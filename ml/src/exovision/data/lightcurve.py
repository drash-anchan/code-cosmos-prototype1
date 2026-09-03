"""The light-curve container passed between every pipeline stage.

Deliberately thin: time / flux / flux_err arrays plus provenance metadata, with
the handful of operations (masking, folding, binning, normalising) that the rest
of the pipeline needs. No I/O and no science lives here.
"""

from __future__ import annotations

from dataclasses import dataclass, field, replace
from typing import Any, Iterator

import numpy as np


@dataclass
class LightCurve:
    """Time-series photometry for one star.

    Attributes
    ----------
    time:
        Observation times in days. Monotonically increasing, gaps allowed.
    flux:
        Relative flux, normalised so the out-of-transit level is ~1.0.
    flux_err:
        Per-point uncertainty on ``flux``. Defaults to the robust scatter.
    star_id, mission:
        Provenance, carried through to the dashboard.
    meta:
        Free-form dict. The simulator stores ground truth here; the preprocessor
        stores what it removed; the searcher stores its periodogram.
    """

    time: np.ndarray
    flux: np.ndarray
    flux_err: np.ndarray | None = None
    star_id: str = "unknown"
    mission: str = "Kepler"
    meta: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.time = np.asarray(self.time, dtype=float)
        self.flux = np.asarray(self.flux, dtype=float)
        if self.time.shape != self.flux.shape:
            raise ValueError(
                f"time and flux must match: {self.time.shape} vs {self.flux.shape}"
            )
        if self.flux_err is None:
            self.flux_err = np.full_like(self.flux, max(self.robust_scatter(), 1e-8))
        else:
            self.flux_err = np.asarray(self.flux_err, dtype=float)
            if self.flux_err.shape != self.flux.shape:
                raise ValueError("flux_err must have the same shape as flux")

        # Drop non-finite samples once, here, so no downstream stage has to.
        good = np.isfinite(self.time) & np.isfinite(self.flux) & np.isfinite(self.flux_err)
        if not good.all():
            self.time = self.time[good]
            self.flux = self.flux[good]
            self.flux_err = self.flux_err[good]

        if self.time.size > 1 and np.any(np.diff(self.time) < 0):
            order = np.argsort(self.time)
            self.time = self.time[order]
            self.flux = self.flux[order]
            self.flux_err = self.flux_err[order]

    # -- basic properties ---------------------------------------------------
    def __len__(self) -> int:
        return int(self.time.size)

    def __iter__(self) -> Iterator[tuple[float, float, float]]:
        return zip(self.time.tolist(), self.flux.tolist(), self.flux_err.tolist())

    @property
    def n_points(self) -> int:
        return int(self.time.size)

    @property
    def baseline_days(self) -> float:
        """Total time span covered, in days."""
        return float(self.time[-1] - self.time[0]) if self.time.size > 1 else 0.0

    @property
    def cadence_days(self) -> float:
        """Median sampling interval, robust against data gaps."""
        if self.time.size < 2:
            return 0.0
        return float(np.median(np.diff(self.time)))

    @property
    def duty_cycle(self) -> float:
        """Fraction of the baseline actually covered by samples."""
        if self.baseline_days <= 0 or self.cadence_days <= 0:
            return 0.0
        expected = self.baseline_days / self.cadence_days
        return float(min(1.0, self.n_points / max(expected, 1.0)))

    def robust_scatter(self) -> float:
        """Point-to-point scatter, immune to transits and outliers.

        Uses the MAD of successive differences (the "sigma-CDPP" trick): a
        transit only affects a handful of consecutive differences, so this
        measures true photometric noise rather than astrophysical signal.
        """
        if self.flux.size < 3:
            return float(np.std(self.flux)) if self.flux.size else 0.0
        diffs = np.diff(self.flux)
        mad = float(np.median(np.abs(diffs - np.median(diffs))))
        return mad * 1.4826 / np.sqrt(2.0)

    # -- transformations (all return new objects) ---------------------------
    def copy(self, **overrides: Any) -> "LightCurve":
        base = replace(
            self,
            time=self.time.copy(),
            flux=self.flux.copy(),
            flux_err=None if self.flux_err is None else self.flux_err.copy(),
            meta=dict(self.meta),
        )
        return replace(base, **overrides) if overrides else base

    def with_flux(self, flux: np.ndarray, **meta: Any) -> "LightCurve":
        """Same time axis, new flux values — used by every detrending step."""
        out = self.copy()
        out.flux = np.asarray(flux, dtype=float)
        out.meta.update(meta)
        return out

    def mask(self, keep: np.ndarray) -> "LightCurve":
        """Keep only the samples where ``keep`` is True."""
        keep = np.asarray(keep, dtype=bool)
        if keep.shape != self.time.shape:
            raise ValueError("mask shape must match the light curve")
        return LightCurve(
            time=self.time[keep],
            flux=self.flux[keep],
            flux_err=None if self.flux_err is None else self.flux_err[keep],
            star_id=self.star_id,
            mission=self.mission,
            meta=dict(self.meta),
        )

    def normalize(self) -> "LightCurve":
        """Divide out the median so the baseline sits at 1.0."""
        median = float(np.median(self.flux)) if self.flux.size else 1.0
        if median == 0.0:
            return self.copy()
        out = self.copy()
        out.flux = self.flux / median
        out.flux_err = self.flux_err / abs(median)
        return out

    def mask_transits(
        self, period: float, t0: float, duration: float, width_factor: float = 2.0
    ) -> "LightCurve":
        """Remove in-transit samples so the next search sees a clean curve.

        This is how multi-planet systems are found: locate the strongest signal,
        mask it, search again. ``width_factor`` widens the mask beyond the
        nominal duration to catch ingress/egress and period uncertainty.
        """
        if period <= 0 or duration <= 0:
            return self.copy()
        half = 0.5 * duration * width_factor
        phase = self.phase(period, t0)
        return self.mask(np.abs(phase) > half)

    def phase(self, period: float, t0: float) -> np.ndarray:
        """Time from nearest mid-transit, in days, wrapped to [-P/2, +P/2)."""
        if period <= 0:
            return np.zeros_like(self.time)
        return (self.time - t0 + 0.5 * period) % period - 0.5 * period

    def fold(self, period: float, t0: float) -> tuple[np.ndarray, np.ndarray]:
        """Phase-fold and sort by phase. Returns (phase_days, flux)."""
        ph = self.phase(period, t0)
        order = np.argsort(ph)
        return ph[order], self.flux[order]

    def bin_folded(
        self, period: float, t0: float, n_bins: int = 128, window: float | None = None
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Phase-fold then average into bins.

        Returns (bin_centre_phase, mean_flux, standard_error). Empty bins come
        back as NaN so callers can decide whether to interpolate or drop them.
        """
        ph, fl = self.fold(period, t0)
        if window is None:
            lo, hi = -0.5 * period, 0.5 * period
        else:
            lo, hi = -abs(window), abs(window)
            inside = (ph >= lo) & (ph <= hi)
            ph, fl = ph[inside], fl[inside]

        edges = np.linspace(lo, hi, n_bins + 1)
        centres = 0.5 * (edges[:-1] + edges[1:])
        if ph.size == 0:
            nan = np.full(n_bins, np.nan)
            return centres, nan, nan.copy()

        idx = np.clip(np.digitize(ph, edges) - 1, 0, n_bins - 1)
        counts = np.bincount(idx, minlength=n_bins).astype(float)
        totals = np.bincount(idx, weights=fl, minlength=n_bins)
        sq = np.bincount(idx, weights=fl**2, minlength=n_bins)

        with np.errstate(invalid="ignore", divide="ignore"):
            mean = np.where(counts > 0, totals / counts, np.nan)
            var = np.where(counts > 1, sq / counts - mean**2, np.nan)
            err = np.sqrt(np.clip(var, 0.0, None) / np.maximum(counts, 1.0))
        return centres, mean, err

    def downsample(self, max_points: int, seed: int | None = None) -> "LightCurve":
        """Uniformly thin the curve to at most ``max_points`` samples.

        Uses a regular stride rather than random sampling so the time axis stays
        evenly covered (important for periodograms).
        """
        if max_points <= 0 or self.n_points <= max_points:
            return self.copy()
        del seed  # stride sampling is deterministic; kept for call-site symmetry
        stride = int(np.ceil(self.n_points / max_points))
        keep = np.zeros(self.n_points, dtype=bool)
        keep[::stride] = True
        return self.mask(keep)

    def to_dict(self, max_points: int | None = None) -> dict[str, Any]:
        """JSON-serialisable view, optionally thinned for the browser."""
        lc = self.downsample(max_points) if max_points else self
        return {
            "star_id": lc.star_id,
            "mission": lc.mission,
            "time": lc.time.tolist(),
            "flux": lc.flux.tolist(),
            "flux_err": lc.flux_err.tolist(),
            "n_points": lc.n_points,
            "baseline_days": lc.baseline_days,
            "cadence_days": lc.cadence_days,
        }

    def __repr__(self) -> str:  # keeps notebook/debug output readable
        return (
            f"LightCurve({self.star_id!r}, mission={self.mission!r}, "
            f"n={self.n_points}, baseline={self.baseline_days:.1f}d, "
            f"scatter={self.robust_scatter():.2e})"
        )


__all__ = ["LightCurve"]
