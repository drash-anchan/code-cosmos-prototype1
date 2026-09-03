"""Light-curve loaders for real data.

The pipeline is built to run entirely offline on simulated systems, so these are
thin conveniences rather than a core dependency: point them at a CSV or a Kepler
/ TESS FITS file and you get the same :class:`LightCurve` the simulator returns.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np

from exovision.data.lightcurve import LightCurve
from exovision.deps import LIGHTKURVE


def load_csv(
    path: str | Path,
    time_col: str = "time",
    flux_col: str = "flux",
    flux_err_col: str | None = "flux_err",
    star_id: str | None = None,
    mission: str = "unknown",
) -> LightCurve:
    """Read a light curve from CSV. Column names are configurable."""
    import pandas as pd

    p = Path(path)
    frame = pd.read_csv(p)
    missing = [c for c in (time_col, flux_col) if c not in frame.columns]
    if missing:
        raise KeyError(f"{p.name} is missing column(s): {missing}")

    err = None
    if flux_err_col and flux_err_col in frame.columns:
        err = frame[flux_err_col].to_numpy(dtype=float)

    return LightCurve(
        time=frame[time_col].to_numpy(dtype=float),
        flux=frame[flux_col].to_numpy(dtype=float),
        flux_err=err,
        star_id=star_id or p.stem,
        mission=mission,
        meta={"source": str(p)},
    ).normalize()


def load_fits(
    path: str | Path,
    flux_column: str = "PDCSAP_FLUX",
    star_id: str | None = None,
) -> LightCurve:
    """Read a Kepler/TESS light-curve FITS file with astropy.

    Defaults to the PDCSAP flux column (systematics already removed by the
    mission pipeline) and falls back to SAP_FLUX when it is absent.
    """
    from astropy.io import fits

    p = Path(path)
    with fits.open(p) as hdul:
        header = hdul[0].header
        data = hdul[1].data
        columns = {c.upper() for c in data.columns.names}
        col = flux_column.upper() if flux_column.upper() in columns else "SAP_FLUX"
        if col not in columns:
            raise KeyError(f"{p.name} has no {flux_column} or SAP_FLUX column")

        time = np.asarray(data["TIME"], dtype=float)
        flux = np.asarray(data[col], dtype=float)
        err_col = f"{col}_ERR"
        err = np.asarray(data[err_col], dtype=float) if err_col in columns else None

        quality = np.asarray(data["QUALITY"], dtype=int) if "QUALITY" in columns else None
        mission = str(header.get("MISSION") or header.get("TELESCOP") or "unknown")
        target = star_id or str(
            header.get("OBJECT") or header.get("KEPLERID") or header.get("TICID") or p.stem
        )

    good = np.isfinite(time) & np.isfinite(flux)
    if quality is not None:
        good &= quality == 0  # drop cadences the mission flagged as bad
    time, flux = time[good], flux[good]
    err = err[good] if err is not None else None

    median = float(np.median(flux)) if flux.size else 1.0
    if median != 0:
        flux = flux / median
        err = err / abs(median) if err is not None else None

    return LightCurve(
        time=time,
        flux=flux,
        flux_err=err,
        star_id=target,
        mission=mission,
        meta={"source": str(p), "flux_column": col},
    )


def load_from_mast(
    target: str,
    mission: str = "TESS",
    author: str | None = None,
    limit: int | None = 2,
    **search_kwargs: Any,
) -> LightCurve:
    """Download and stitch light curves from MAST via lightkurve.

    Requires the optional ``lightkurve`` extra and network access. Raises
    ``RuntimeError`` if it is not installed so callers can fall back to the
    simulator with a clear message.
    """
    if not LIGHTKURVE.available:
        raise RuntimeError(
            "load_from_mast needs the optional 'lightkurve' extra: "
            "pip install -r requirements-extras.txt"
        )
    lk = LIGHTKURVE.module
    result = lk.search_lightcurve(target, mission=mission, author=author, **search_kwargs)
    if len(result) == 0:
        raise ValueError(f"no MAST light curves found for {target!r} ({mission})")

    collection = result[:limit].download_all() if limit else result.download_all()
    stitched = collection.stitch().remove_nans()
    flux = np.asarray(stitched.flux.value, dtype=float)
    err = np.asarray(stitched.flux_err.value, dtype=float)
    median = float(np.median(flux)) if flux.size else 1.0

    return LightCurve(
        time=np.asarray(stitched.time.value, dtype=float),
        flux=flux / median if median else flux,
        flux_err=err / abs(median) if median else err,
        star_id=target,
        mission=mission,
        meta={"source": "MAST", "n_sectors": len(collection)},
    )


__all__ = ["load_csv", "load_fits", "load_from_mast"]
