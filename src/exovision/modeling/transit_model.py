"""Transit light-curve model, used both to simulate and to fit.

One implementation shared by the simulator and the MCMC stage, so a fit can
never disagree with the physics that generated the data. Uses `batman`'s
Mandel & Agol solution when it is installed and falls back to an analytic
trapezoid with a limb-darkening taper otherwise.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from exovision.deps import BATMAN
from exovision.physics import transit_duration_days


@dataclass
class TransitParams:
    """Circular-orbit transit parameters (the standard fitted set)."""

    period: float
    t0: float
    rp_over_rs: float
    a_over_rs: float
    inclination_deg: float = 90.0
    u1: float = 0.35
    u2: float = 0.23
    ecc: float = 0.0
    omega_deg: float = 90.0

    @property
    def impact_parameter(self) -> float:
        """b = a/Rs * cos(i), the projected sky separation at mid-transit."""
        return float(
            self.a_over_rs * np.cos(np.deg2rad(self.inclination_deg))
        )

    @property
    def depth(self) -> float:
        """Approximate geometric depth (k^2), ignoring limb darkening."""
        return float(self.rp_over_rs**2)

    @property
    def duration_days(self) -> float:
        return transit_duration_days(
            self.period, self.a_over_rs, self.rp_over_rs, abs(self.impact_parameter)
        )

    @property
    def transits(self) -> bool:
        """True when the planet actually crosses the stellar disc."""
        return abs(self.impact_parameter) < 1.0 + self.rp_over_rs


def transit_flux(
    time: np.ndarray,
    params: TransitParams,
    exp_time_days: float | None = None,
    supersample: int = 5,
) -> np.ndarray:
    """Relative flux (1.0 out of transit) at each time.

    ``exp_time_days`` enables finite-exposure smearing, which matters a lot at
    Kepler's 30-minute cadence — without it, short ingresses are artificially
    sharp and the fitted duration comes out biased.
    """
    time = np.asarray(time, dtype=float)
    if not params.transits or params.rp_over_rs <= 0:
        return np.ones_like(time)

    if BATMAN.available:
        try:
            return _batman_flux(time, params, exp_time_days, supersample)
        except Exception:
            pass  # fall through to the analytic model
    return trapezoid_flux(time, params, exp_time_days, supersample)


def _batman_flux(
    time: np.ndarray,
    params: TransitParams,
    exp_time_days: float | None,
    supersample: int,
) -> np.ndarray:
    batman = BATMAN.module
    bp = batman.TransitParams()
    bp.t0 = float(params.t0)
    bp.per = float(params.period)
    bp.rp = float(params.rp_over_rs)
    bp.a = float(params.a_over_rs)
    bp.inc = float(params.inclination_deg)
    bp.ecc = float(params.ecc)
    bp.w = float(params.omega_deg)
    bp.u = [float(params.u1), float(params.u2)]
    bp.limb_dark = "quadratic"

    if exp_time_days and exp_time_days > 0 and supersample > 1:
        model = batman.TransitModel(
            bp, time, supersample_factor=int(supersample), exp_time=float(exp_time_days)
        )
    else:
        model = batman.TransitModel(bp, time)
    return np.asarray(model.light_curve(bp), dtype=float)


def trapezoid_flux(
    time: np.ndarray,
    params: TransitParams,
    exp_time_days: float | None = None,
    supersample: int = 5,
) -> np.ndarray:
    """Analytic trapezoid with a quadratic-limb-darkening curved floor.

    Ingress/egress duration follows the real geometry (T_12 from the b and k
    chords), so the V-vs-U shape that vetting keys on is preserved.
    """
    time = np.asarray(time, dtype=float)
    if exp_time_days and exp_time_days > 0 and supersample > 1:
        n = int(supersample)
        offsets = (np.arange(n) - (n - 1) / 2.0) / n * float(exp_time_days)
        stacked = np.stack(
            [_trapezoid_instant(time + off, params) for off in offsets], axis=0
        )
        return stacked.mean(axis=0)
    return _trapezoid_instant(time, params)


def _trapezoid_instant(time: np.ndarray, params: TransitParams) -> np.ndarray:
    k = float(params.rp_over_rs)
    b = abs(params.impact_parameter)
    a = float(params.a_over_rs)
    period = float(params.period)

    outer = (1.0 + k) ** 2 - b**2
    if outer <= 0 or a <= 1.0:
        return np.ones_like(time)

    t_total = period / np.pi * np.arcsin(min(np.sqrt(outer) / a, 1.0))
    inner = (1.0 - k) ** 2 - b**2
    if inner > 0:  # fully overlapping: flat-bottomed U shape
        t_full = period / np.pi * np.arcsin(min(np.sqrt(inner) / a, 1.0))
    else:  # grazing: no flat bottom at all, a pure V
        t_full = 0.0

    phase = (time - params.t0 + 0.5 * period) % period - 0.5 * period
    x = np.abs(phase)
    half_total, half_full = 0.5 * t_total, 0.5 * t_full

    # Fractional overlap: 1 inside full contact, tapering linearly to 0 at T14.
    ramp = np.zeros_like(x)
    inside = x <= half_full
    ramp[inside] = 1.0
    if half_total > half_full:
        edge = (~inside) & (x < half_total)
        ramp[edge] = (half_total - x[edge]) / (half_total - half_full)

    # Limb darkening: the disc is brighter at the centre, so a transit at small
    # b blocks more light than k^2 alone implies.
    u1, u2 = float(params.u1), float(params.u2)
    mu = np.sqrt(max(0.0, 1.0 - min(b, 0.999) ** 2))
    intensity = 1.0 - u1 * (1.0 - mu) - u2 * (1.0 - mu) ** 2
    norm = 1.0 - u1 / 3.0 - u2 / 6.0
    depth = k**2 * (intensity / norm if norm > 0 else 1.0)

    return 1.0 - depth * ramp


__all__ = ["TransitParams", "transit_flux", "trapezoid_flux"]
