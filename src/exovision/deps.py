"""Optional-dependency probes.

The pipeline is designed to degrade rather than crash: every optional science
library is imported through this module, which records whether it is available
and why. `dependency_report()` is surfaced by the CLI and the API so it is
always obvious which code path produced a given result.
"""

from __future__ import annotations

import warnings
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Dependency:
    """Availability of one optional import."""

    name: str
    available: bool
    version: str | None
    purpose: str
    fallback: str
    module: Any = None

    def __bool__(self) -> bool:  # lets callers write `if HAS_BATMAN:`
        return self.available


def _probe(import_name: str, purpose: str, fallback: str, attr: str | None = None) -> Dependency:
    try:
        # lightkurve and friends emit import-time UserWarnings about their own
        # optional extras; that noise is not useful here.
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            module = __import__(
                import_name, fromlist=["_"] if "." in import_name else []
            )
        if attr is not None:
            module = getattr(module, attr)
        version = getattr(module, "__version__", None)
        return Dependency(import_name, True, version, purpose, fallback, module)
    except Exception:  # ImportError, but also broken builds / missing shared libs
        return Dependency(import_name, False, None, purpose, fallback, None)


BATMAN = _probe(
    "batman",
    purpose="analytic Mandel & Agol limb-darkened transit model",
    fallback="trapezoidal transit model with a quadratic limb-darkening taper",
)

TLS = _probe(
    "transitleastsquares",
    purpose="Transit Least Squares periodogram (transit-shaped template)",
    fallback="BLS peak refined on a fine local period grid",
)

EMCEE = _probe(
    "emcee",
    purpose="affine-invariant MCMC posterior sampling",
    fallback="Levenberg-Marquardt fit with a Gaussian (Fisher/Laplace) posterior",
)

CELERITE2 = _probe(
    "celerite2",
    purpose="Gaussian-process model of correlated stellar variability",
    fallback="running-biweight detrending with iterative sigma clipping",
)

CORNER = _probe(
    "corner",
    purpose="corner plots of the MCMC posterior",
    fallback="posterior summary statistics only (no corner figure)",
)

LIGHTKURVE = _probe(
    "lightkurve",
    purpose="download real Kepler/TESS light curves from MAST",
    fallback="local FITS/CSV files, or the built-in physical simulator",
)

OPTIONAL_DEPENDENCIES: tuple[Dependency, ...] = (
    BATMAN,
    TLS,
    EMCEE,
    CELERITE2,
    CORNER,
    LIGHTKURVE,
)

HAS_BATMAN = BATMAN.available
HAS_TLS = TLS.available
HAS_EMCEE = EMCEE.available
HAS_CELERITE2 = CELERITE2.available
HAS_CORNER = CORNER.available
HAS_LIGHTKURVE = LIGHTKURVE.available


def dependency_report() -> list[dict[str, Any]]:
    """Serialisable view of which optional backends are active."""
    return [
        {
            "name": dep.name,
            "available": dep.available,
            "version": dep.version,
            "purpose": dep.purpose,
            "fallback_when_missing": dep.fallback,
        }
        for dep in OPTIONAL_DEPENDENCIES
    ]


def format_dependency_report() -> str:
    """Human-readable table for the CLI banner."""
    lines = ["Optional science backends:"]
    for dep in OPTIONAL_DEPENDENCIES:
        mark = "OK  " if dep.available else "--  "
        version = f" {dep.version}" if dep.version else ""
        lines.append(f"  {mark}{dep.name}{version}")
        if not dep.available:
            lines.append(f"        using fallback: {dep.fallback}")
    return "\n".join(lines)


__all__ = [
    "Dependency",
    "OPTIONAL_DEPENDENCIES",
    "BATMAN",
    "TLS",
    "EMCEE",
    "CELERITE2",
    "CORNER",
    "LIGHTKURVE",
    "HAS_BATMAN",
    "HAS_TLS",
    "HAS_EMCEE",
    "HAS_CELERITE2",
    "HAS_CORNER",
    "HAS_LIGHTKURVE",
    "dependency_report",
    "format_dependency_report",
]
