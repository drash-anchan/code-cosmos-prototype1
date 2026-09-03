"""Sampling of host-star properties for the simulated survey.

Draws from rough Kepler/TESS target distributions: mostly late-F to K dwarfs,
with a mass-radius relation so the implied density stays physical. The density
is what asterodensity vetting later compares against, so it has to be sampled
self-consistently rather than made up per-check.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

import numpy as np

from exovision.physics import RHO_SUN, stellar_density_cgs


@dataclass
class StarProperties:
    """Physical properties of one host star."""

    radius_rsun: float
    mass_msun: float
    teff_k: float
    magnitude: float
    limb_u1: float
    limb_u2: float

    @property
    def density_kg_m3(self) -> float:
        return stellar_density_cgs(self.mass_msun, self.radius_rsun)

    @property
    def density_rho_sun(self) -> float:
        """Mean density in solar units — the quantity vetting works in."""
        return self.density_kg_m3 / RHO_SUN

    def to_dict(self) -> dict[str, float]:
        payload = {k: float(v) for k, v in asdict(self).items()}
        payload["density_rho_sun"] = float(self.density_rho_sun)
        return payload


def sample_star(rng: np.random.Generator) -> StarProperties:
    """Draw one plausible main-sequence host."""
    # Log-uniform in mass over the range surveys actually observe, then a
    # broken power-law radius so we get both dwarfs and slightly evolved stars.
    mass = float(np.exp(rng.uniform(np.log(0.55), np.log(1.45))))
    if mass < 1.0:
        radius = mass**0.90
    else:
        radius = mass**0.60
    # A little scatter for evolution / metallicity; keeps densities from being a
    # deterministic function of mass, which would make vetting artificially easy.
    radius *= float(np.exp(rng.normal(0.0, 0.10)))
    radius = float(np.clip(radius, 0.45, 2.4))

    teff = float(np.clip(5772.0 * mass**0.54 * rng.normal(1.0, 0.03), 3600.0, 7200.0))
    magnitude = float(rng.uniform(9.0, 15.5))

    # Quadratic limb darkening, loosely temperature-dependent (cooler stars are
    # more strongly darkened at the limb).
    u1 = float(np.clip(0.55 - 3.0e-5 * (teff - 5000.0) + rng.normal(0, 0.05), 0.15, 0.75))
    u2 = float(np.clip(0.15 + rng.normal(0, 0.05), 0.02, 0.40))

    return StarProperties(radius, mass, teff, magnitude, u1, u2)


def photometric_precision(magnitude: float, cadence_minutes: float) -> float:
    """Per-point white-noise sigma for a given magnitude and cadence.

    A crude but monotonic CDPP-like scaling: bright stars are photon-limited,
    faint stars degrade exponentially, and longer exposures average noise down
    as sqrt(t).
    """
    base = 6.0e-5 * np.exp(0.38 * (max(magnitude, 8.0) - 10.0))
    cadence_gain = np.sqrt(max(cadence_minutes, 1.0) / 30.0)
    return float(np.clip(base / cadence_gain, 2.0e-5, 6.0e-3))


__all__ = ["StarProperties", "sample_star", "photometric_precision"]
