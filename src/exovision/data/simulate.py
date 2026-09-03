"""Physical light-curve simulator.

Generates labelled training data for the five categories. Every class is built
from the same physics as the fitting code (`modeling.transit_model`), so the
classifier is learning real morphological differences rather than an artefact of
two separate implementations:

    exoplanet_transit  small flat-bottomed dips, no secondary, matching density
    eclipsing_binary   deep eclipses + secondary at phase 0.5, odd/even offsets
    stellar_blend      an EB diluted by a neighbour: planetary depth, wrong shape
    starspot           smooth rotational modulation, no discrete transit
    noise              photometric scatter + instrumental systematics only

Red (correlated) noise, gaps, outliers and flares are added to every class so
vetting statistics have to work under realistic conditions.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np

from exovision.config import DatasetConfig
from exovision.data.lightcurve import LightCurve
from exovision.labels import Category
from exovision.modeling.transit_model import TransitParams, transit_flux
from exovision.physics import (
    RHO_SUN,
    R_SUN_IN_R_EARTH,
    a_over_rs_from_rho,
    stellar_density_cgs,
)


@dataclass
class SimulatedSystem:
    """A simulated star, its light curve and the ground truth behind it."""

    light_curve: LightCurve
    category: Category
    star: dict[str, Any]
    signals: list[dict[str, Any]] = field(default_factory=list)

    @property
    def n_planets(self) -> int:
        return sum(1 for s in self.signals if s.get("is_planet"))

    @property
    def is_multi_planet(self) -> bool:
        return self.n_planets > 1


# --- stellar population ----------------------------------------------------
def _sample_star(rng: np.random.Generator, mission: str) -> dict[str, Any]:
    """Draw a plausible main-sequence host (rough Kepler/TESS target mix)."""
    # Mass from a truncated power law, then radius/Teff from main-sequence scalings.
    mass = float(np.clip(rng.lognormal(np.log(0.95), 0.28), 0.45, 2.1))
    radius = float(np.clip(mass**0.85 * rng.normal(1.0, 0.06), 0.35, 2.6))
    teff = float(np.clip(5772.0 * mass**0.55 * rng.normal(1.0, 0.04), 3400, 8000))
    density = stellar_density_cgs(mass, radius)
    mag = float(rng.uniform(9.0, 15.5) if mission == "Kepler" else rng.uniform(7.5, 13.5))
    # Fainter stars are noisier; this sets the photometric floor in ppm.
    base_ppm = 22.0 * 10 ** (0.22 * (mag - 10.0))
    return {
        "mass_msun": mass,
        "radius_rsun": radius,
        "teff_k": teff,
        "density_kg_m3": density,
        "density_rho_sun": density / RHO_SUN,
        "magnitude": mag,
        "noise_ppm": float(np.clip(base_ppm * rng.normal(1.0, 0.15), 12.0, 2600.0)),
        "limb_u1": float(np.clip(rng.normal(0.38, 0.07), 0.15, 0.62)),
        "limb_u2": float(np.clip(rng.normal(0.22, 0.06), 0.02, 0.42)),
    }


def _time_axis(cfg: DatasetConfig, rng: np.random.Generator) -> np.ndarray:
    """Regular cadence with survey-like gaps (downlinks, safe modes)."""
    cadence = cfg.cadence_minutes / (60.0 * 24.0)
    baseline = float(cfg.baseline_days * rng.uniform(0.85, 1.15))
    t = np.arange(0.0, baseline, cadence)
    if cfg.gap_fraction > 0 and t.size > 200:
        keep = np.ones(t.size, dtype=bool)
        n_gaps = int(rng.integers(1, 4))
        for _ in range(n_gaps):
            width = int(t.size * cfg.gap_fraction / n_gaps * rng.uniform(0.5, 1.5))
            if width < 1:
                continue
            start = int(rng.integers(0, max(1, t.size - width)))
            keep[start : start + width] = False
        t = t[keep]
    return t


def _red_noise(t: np.ndarray, rng: np.random.Generator, amp: float) -> np.ndarray:
    """1/f-ish correlated noise: a few random-phase low-frequency sinusoids."""
    if t.size == 0 or amp <= 0:
        return np.zeros_like(t)
    span = max(t[-1] - t[0], 1e-6)
    out = np.zeros_like(t)
    for _ in range(4):
        period = float(rng.uniform(0.6, 12.0))
        out += (
            amp
            * rng.uniform(0.3, 1.0)
            * np.sin(2 * np.pi * t / period + rng.uniform(0, 2 * np.pi))
        )
    # Slow instrumental drift across the whole baseline.
    out += amp * rng.normal(0, 1.2) * ((t - t[0]) / span - 0.5)
    return out


def _add_artifacts(
    flux: np.ndarray, t: np.ndarray, rng: np.random.Generator, sigma: float
) -> np.ndarray:
    """Cosmic-ray hits and the occasional stellar flare."""
    out = flux.copy()
    n_out = int(rng.poisson(max(1.0, t.size * 4e-4)))
    if n_out:
        idx = rng.integers(0, t.size, n_out)
        out[idx] += rng.normal(0, 8.0 * sigma, n_out)
    if rng.random() < 0.18 and t.size > 50:  # flare: fast rise, exponential decay
        start = int(rng.integers(0, t.size - 20))
        tau = rng.uniform(0.01, 0.09)
        amp = rng.uniform(3.0, 30.0) * sigma
        seg = t[start:] - t[start]
        out[start:] += amp * np.exp(-seg / tau)
    return out


def _spot_modulation(
    t: np.ndarray, rng: np.random.Generator, amplitude: float, period: float
) -> np.ndarray:
    """Quasi-periodic rotational signal from spots.

    Two harmonics with slowly drifting amplitude — smooth and continuous, which
    is exactly what separates it from a discrete transit. Spots also evolve, so
    the amplitude is modulated on a longer timescale.
    """
    if t.size == 0:
        return np.zeros_like(t)
    phase = 2 * np.pi * t / period
    signal = np.sin(phase + rng.uniform(0, 2 * np.pi))
    signal += rng.uniform(0.25, 0.6) * np.sin(2 * phase + rng.uniform(0, 2 * np.pi))
    envelope = 1.0 + 0.35 * np.sin(
        2 * np.pi * t / (period * rng.uniform(6.0, 20.0)) + rng.uniform(0, 2 * np.pi)
    )
    return amplitude * signal * envelope


# --- per-category signal builders ------------------------------------------
def _make_planets(
    rng: np.random.Generator, star: dict[str, Any], baseline: float, n_planets: int
) -> list[dict[str, Any]]:
    """Draw a planetary system: periods well inside the baseline, sane radii."""
    signals: list[dict[str, Any]] = []
    max_period = min(baseline / 2.5, 28.0)
    period = float(rng.uniform(0.8, max(1.6, max_period * 0.45)))

    for i in range(n_planets):
        if i > 0:
            # Real multi-planet systems are near-resonant, not random: step out
            # by a period ratio drawn around common resonances.
            period *= float(rng.choice([1.55, 1.8, 2.02, 2.4, 3.1]) * rng.normal(1.0, 0.04))
            if period > max_period:
                break

        # Radius from a Kepler-like distribution: mostly small planets.
        r_earth = float(np.clip(rng.lognormal(np.log(2.6), 0.62), 0.7, 16.0))
        rp_over_rs = r_earth / (star["radius_rsun"] * R_SUN_IN_R_EARTH)
        a_over_rs = a_over_rs_from_rho(period, star["density_kg_m3"])
        if not np.isfinite(a_over_rs) or a_over_rs <= 2.0:
            continue

        # Impact parameter biased to transiting geometries (we only see those).
        b = float(rng.uniform(0.0, 0.92) * (1.0 + rp_over_rs))
        inc = float(np.rad2deg(np.arccos(np.clip(b / a_over_rs, -1.0, 1.0))))

        params = TransitParams(
            period=period,
            t0=float(rng.uniform(0.0, period)),
            rp_over_rs=rp_over_rs,
            a_over_rs=a_over_rs,
            inclination_deg=inc,
            u1=star["limb_u1"],
            u2=star["limb_u2"],
        )
        if not params.transits or params.duration_days <= 0:
            continue

        signals.append(
            {
                "kind": "planet",
                "is_planet": True,
                "params": params,
                "period": period,
                "t0": params.t0,
                "depth": params.depth,
                "duration_days": params.duration_days,
                "radius_earth": r_earth,
                "impact_parameter": b,
                "a_over_rs": a_over_rs,
                "secondary_depth": 0.0,
            }
        )
    return signals


def _make_eclipsing_binary(
    rng: np.random.Generator, star: dict[str, Any], baseline: float
) -> dict[str, Any]:
    """A stellar companion: deep eclipses, a secondary, and odd/even offsets."""
    period = float(rng.uniform(0.9, min(baseline / 3.0, 18.0)))
    # Companion radius ratio large enough that this is unmistakably stellar.
    ratio = float(rng.uniform(0.18, 0.62))
    a_over_rs = a_over_rs_from_rho(period, star["density_kg_m3"] * rng.uniform(0.6, 1.4))
    a_over_rs = float(max(a_over_rs, 3.5))
    b = float(rng.uniform(0.0, 0.95) * (1.0 + ratio))
    inc = float(np.rad2deg(np.arccos(np.clip(b / a_over_rs, -1.0, 1.0))))

    params = TransitParams(
        period=period,
        t0=float(rng.uniform(0.0, period)),
        rp_over_rs=ratio,
        a_over_rs=a_over_rs,
        inclination_deg=inc,
        u1=star["limb_u1"],
        u2=star["limb_u2"],
    )
    # Secondary eclipse: the companion is self-luminous, so a real dip occurs
    # near phase 0.5 — the single most decisive EB signature.
    surface_ratio = float(rng.uniform(0.05, 0.5))
    return {
        "kind": "eclipsing_binary",
        "is_planet": False,
        "params": params,
        "period": period,
        "t0": params.t0,
        "depth": params.depth,
        "duration_days": params.duration_days,
        "radius_earth": ratio * star["radius_rsun"] * R_SUN_IN_R_EARTH,
        "impact_parameter": b,
        "a_over_rs": a_over_rs,
        "secondary_depth": float(params.depth * surface_ratio),
        # Slight depth alternation: the true period is 2x what a search finds.
        "odd_even_offset": float(rng.uniform(0.04, 0.35)),
        "eccentric_secondary_phase": float(np.clip(rng.normal(0.5, 0.03), 0.35, 0.65)),
    }


def _make_blend(
    rng: np.random.Generator, star: dict[str, Any], baseline: float
) -> dict[str, Any]:
    """A background EB diluted by the target star inside the same aperture.

    Depth ends up planet-sized, but the shape stays V-ish and the implied
    stellar density is wrong — which is what asterodensity profiling catches.
    """
    eb = _make_eclipsing_binary(rng, star, baseline)
    dilution = float(rng.uniform(0.02, 0.16))  # fraction of light from the EB
    params: TransitParams = eb["params"]
    diluted_k = float(np.sqrt(max(params.depth * dilution, 1e-8)))

    # Keep the *shape* of the original (grazing, wrong density) but scale depth.
    eb.update(
        kind="stellar_blend",
        is_planet=False,
        dilution=dilution,
        depth=diluted_k**2,
        secondary_depth=eb["secondary_depth"] * dilution,
        radius_earth=diluted_k * star["radius_rsun"] * R_SUN_IN_R_EARTH,
        # The transit is timed by the *background* star's density, so the density
        # implied by (P, duration) disagrees with the target's.
        density_mismatch=float(rng.choice([rng.uniform(3.0, 12.0), rng.uniform(0.06, 0.3)])),
    )
    return eb
