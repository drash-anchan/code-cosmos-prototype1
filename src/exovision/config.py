"""Typed configuration for every pipeline stage.

Loaded from YAML (`configs/default.yaml`) so a run is reproducible from a file,
but every field has a sane default — `PipelineConfig()` alone is a working
configuration.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field, fields
from pathlib import Path
from typing import Any

import yaml


@dataclass
class DatasetConfig:
    """How the training set is generated."""

    n_systems: int = 1400
    # Relative frequency of each category in the simulated survey. Deliberately
    # not uniform: real surveys are dominated by junk, and the classifier should
    # learn under that prior.
    class_weights: dict[str, float] = field(
        default_factory=lambda: {
            "exoplanet_transit": 0.30,
            "eclipsing_binary": 0.18,
            "stellar_blend": 0.16,
            "starspot": 0.18,
            "noise": 0.18,
        }
    )
    baseline_days: float = 90.0
    cadence_minutes: float = 30.0
    multi_planet_fraction: float = 0.22
    missions: tuple[str, ...] = ("Kepler", "TESS")
    gap_fraction: float = 0.06
    seed: int = 20260903


@dataclass
class PreprocessConfig:
    """Cleaning and detrending."""

    sigma_upper: float = 4.0
    sigma_lower: float = 8.0  # keep transits: only clip hard on the low side
    window_days: float = 0.85
    biweight_c: float = 6.0
    max_iterations: int = 4
    fill_gaps: bool = False
    use_gp: bool = True  # celerite2 GP when available, biweight otherwise
    gp_min_points: int = 400


@dataclass
class SearchConfig:
    """Periodogram search and iterative masking for multi-planet systems."""

    period_min: float = 0.6
    period_max: float = 30.0
    n_periods: int = 12000
    durations: tuple[float, ...] = (0.02, 0.04, 0.07, 0.10, 0.14, 0.20)
    max_planets: int = 3
    mask_width_factor: float = 2.2  # x duration masked around each found transit
    min_sde: float = 6.0  # SDE floor to keep searching for another planet
    min_points_after_mask: int = 500
    use_tls: bool = True
    tls_window_factor: float = 0.06  # TLS re-searches +/-6% around the BLS peak
    tls_oversampling: int = 2
    tls_max_points: int = 6000  # decimate before TLS to keep runtime sane
    harmonic_tolerance: float = 0.02


@dataclass
class ValidationConfig:
    """Thresholds for the vetting checks."""

    secondary_search_half_width: float = 0.12  # in phase, around 0.5
    odd_even_sigma_threshold: float = 3.0
    secondary_sigma_threshold: float = 3.0
    density_ratio_low: float = 0.25
    density_ratio_high: float = 4.0
    v_shape_threshold: float = 0.55
    max_planet_depth: float = 0.08  # >8% is a star, not a planet
    max_planet_radius_earth: float = 25.0


@dataclass
class ModelingConfig:
    """Transit fit + MCMC for promising candidates."""

    enabled: bool = True
    min_confidence: float = 0.55  # only model candidates the classifier likes
    max_candidates: int = 12
    n_walkers: int = 32
    n_steps: int = 1500
    n_burn: int = 500
    thin: int = 5
    phase_window: float = 0.08  # fraction of the period fitted around mid-transit
    max_points: int = 3000
    progress: bool = False
    seed: int = 7


@dataclass
class ClassifierConfig:
    """XGBoost hyper-parameters and evaluation protocol."""

    n_estimators: int = 600
    max_depth: int = 5
    learning_rate: float = 0.06
    subsample: float = 0.85
    colsample_bytree: float = 0.8
    min_child_weight: float = 2.0
    reg_lambda: float = 1.2
    reg_alpha: float = 0.0
    gamma: float = 0.0
    test_size: float = 0.25
    cv_folds: int = 5
    early_stopping_rounds: int = 60
    calibrate: bool = True
    seed: int = 42


@dataclass
class PathsConfig:
    """Where artifacts land. Relative paths resolve against the ml/ directory."""

    artifacts_dir: str = "artifacts"
    model_file: str = "artifacts/model.joblib"
    metrics_file: str = "artifacts/metrics.json"
    dataset_file: str = "artifacts/dataset.parquet"
    features_csv: str = "artifacts/features.csv"
    catalog_file: str = "artifacts/catalog.json"
    figures_dir: str = "artifacts/figures"


@dataclass
class PipelineConfig:
    """Root configuration object."""

    dataset: DatasetConfig = field(default_factory=DatasetConfig)
    preprocess: PreprocessConfig = field(default_factory=PreprocessConfig)
    search: SearchConfig = field(default_factory=SearchConfig)
    validation: ValidationConfig = field(default_factory=ValidationConfig)
    modeling: ModelingConfig = field(default_factory=ModelingConfig)
    classifier: ClassifierConfig = field(default_factory=ClassifierConfig)
    paths: PathsConfig = field(default_factory=PathsConfig)
    n_jobs: int = -1
    verbose: bool = True

    # -- (de)serialisation --------------------------------------------------
    @classmethod
    def from_dict(cls, payload: dict[str, Any] | None) -> "PipelineConfig":
        payload = dict(payload or {})
        kwargs: dict[str, Any] = {}
        for f in fields(cls):
            if f.name not in payload:
                continue
            value = payload.pop(f.name)
            sub_cls = _SECTIONS.get(f.name)
            if sub_cls is not None and isinstance(value, dict):
                kwargs[f.name] = _build(sub_cls, value)
            else:
                kwargs[f.name] = value
        if payload:
            raise ValueError(f"unknown config keys: {', '.join(sorted(payload))}")
        return cls(**kwargs)

    @classmethod
    def load(cls, path: str | Path | None) -> "PipelineConfig":
        if path is None:
            return cls()
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"config not found: {p}")
        with p.open("r", encoding="utf-8") as fh:
            return cls.from_dict(yaml.safe_load(fh) or {})

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def dump(self, path: str | Path) -> None:
        Path(path).write_text(
            yaml.safe_dump(self.to_dict(), sort_keys=False), encoding="utf-8"
        )


_SECTIONS: dict[str, type] = {
    "dataset": DatasetConfig,
    "preprocess": PreprocessConfig,
    "search": SearchConfig,
    "validation": ValidationConfig,
    "modeling": ModelingConfig,
    "classifier": ClassifierConfig,
    "paths": PathsConfig,
}


def _build(cls: type, payload: dict[str, Any]) -> Any:
    """Instantiate a leaf dataclass, coercing lists back to tuples."""
    valid = {f.name for f in fields(cls)}
    unknown = set(payload) - valid
    if unknown:
        raise ValueError(f"unknown keys for {cls.__name__}: {sorted(unknown)}")
    defaults = cls()
    kwargs: dict[str, Any] = {}
    for key, value in payload.items():
        if isinstance(getattr(defaults, key), tuple) and isinstance(value, list):
            value = tuple(value)
        kwargs[key] = value
    return cls(**kwargs)


__all__ = [
    "PipelineConfig",
    "DatasetConfig",
    "PreprocessConfig",
    "SearchConfig",
    "ValidationConfig",
    "ModelingConfig",
    "ClassifierConfig",
    "PathsConfig",
]
