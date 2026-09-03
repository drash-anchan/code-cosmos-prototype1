"""Physical constants and unit conversions used across the pipeline.

Values are IAU 2015 nominal constants; kept in one place so the transit
geometry, asterodensity vetting and MCMC priors cannot drift apart.
"""

from __future__ import annotations

import numpy as np

# --- SI base constants -----------------------------------------------------
G_SI = 6.67430e-11  # m^3 kg^-1 s^-2
R_SUN_M = 6.957e8  # m
M_SUN_KG = 1.98892e30  # kg
R_JUP_M = 7.1492e7  # m
R_EARTH_M = 6.3781e6  # m
AU_M = 1.495978707e11  # m
DAY_S = 86400.0  # s

# Mean solar density, kg m^-3 (~1408). Asterodensity profiling is expressed in
# units of this value so numbers stay O(1).
RHO_SUN = M_SUN_KG / (4.0 / 3.0 * np.pi * R_SUN_M**3)

# Convenience conversions
R_SUN_IN_R_EARTH = R_SUN_M / R_EARTH_M  # ~109.1
R_SUN_IN_R_JUP = R_SUN_M / R_JUP_M  # ~9.73


def rho_star_from_transit(period_days: float, a_over_rs: float) -> float:
    """Mean stellar density implied by transit geometry, in kg m^-3.

    From Kepler's third law with M_planet << M_star:

        rho_star = 3 * pi / (G * P^2) * (a / R_star)^3

    This is the core of asterodensity profiling: compare the density a transit
    *implies* against the density independently known for the star. A grazing
    eclipsing binary or a diluted blend generally implies a nonsensical value.
    """
    period_s = float(period_days) * DAY_S
    if period_s <= 0 or a_over_rs <= 0:
        return float("nan")
    return 3.0 * np.pi / (G_SI * period_s**2) * float(a_over_rs) ** 3


def a_over_rs_from_rho(period_days: float, rho_star_kg_m3: float) -> float:
    """Inverse of :func:`rho_star_from_transit` — a/R* for a known density."""
    period_s = float(period_days) * DAY_S
    if period_s <= 0 or rho_star_kg_m3 <= 0:
        return float("nan")
    return float(np.cbrt(rho_star_kg_m3 * G_SI * period_s**2 / (3.0 * np.pi)))


def transit_duration_days(
    period_days: float,
    a_over_rs: float,
    rp_over_rs: float = 0.0,
    impact_parameter: float = 0.0,
) -> float:
    """Total (first-to-last contact) transit duration for a circular orbit.

    T_14 = P / pi * asin( sqrt((1 + k)^2 - b^2) / (a/Rs) ), clipped so a
    non-transiting geometry returns 0 rather than a NaN.
    """
    if a_over_rs <= 1.0 or period_days <= 0:
        return 0.0
    num = (1.0 + rp_over_rs) ** 2 - impact_parameter**2
    if num <= 0:
        return 0.0
    arg = np.sqrt(num) / a_over_rs
    if arg >= 1.0:  # star is huge compared to the orbit; whole orbit is transit
        return float(period_days) / 2.0
    return float(period_days) / np.pi * float(np.arcsin(arg))


def stellar_density_cgs(mass_msun: float, radius_rsun: float) -> float:
    """Mean density of a star in kg m^-3 from mass and radius in solar units."""
    if mass_msun <= 0 or radius_rsun <= 0:
        return float("nan")
    mass = mass_msun * M_SUN_KG
    radius = radius_rsun * R_SUN_M
    return mass / (4.0 / 3.0 * np.pi * radius**3)


def planet_radius_earth(rp_over_rs: float, r_star_rsun: float) -> float:
    """Planet radius in Earth radii from the depth ratio and host radius."""
    return float(rp_over_rs) * float(r_star_rsun) * R_SUN_IN_R_EARTH


def equilibrium_temperature(
    teff_k: float, a_over_rs: float, albedo: float = 0.3
) -> float:
    """Zero-albedo-corrected equilibrium temperature, assuming full redistribution."""
    if a_over_rs <= 0 or teff_k <= 0:
        return float("nan")
    return float(teff_k * np.sqrt(1.0 / (2.0 * a_over_rs)) * (1.0 - albedo) ** 0.25)


__all__ = [
    "G_SI",
    "R_SUN_M",
    "M_SUN_KG",
    "R_JUP_M",
    "R_EARTH_M",
    "AU_M",
    "DAY_S",
    "RHO_SUN",
    "R_SUN_IN_R_EARTH",
    "R_SUN_IN_R_JUP",
    "rho_star_from_transit",
    "a_over_rs_from_rho",
    "transit_duration_days",
    "stellar_density_cgs",
    "planet_radius_earth",
    "equilibrium_temperature",
]
