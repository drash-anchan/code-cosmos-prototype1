"""Trainable five-class light-curve candidate classifier.

This intentionally keeps the training example small and reproducible.  It
creates physically shaped synthetic light curves, extracts transit/vetting
features, and trains an XGBoost model (with a sklearn fallback).
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import time

import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split

from exovision.labels import Category, CATEGORY_LABELS

FEATURE_NAMES = [
    "period_days", "depth_ppm", "duration_hours", "snr", "sde",
    "secondary_sigma", "odd_even_sigma", "density_ratio", "v_shape",
    "harmonic_ppm", "scatter_ppm", "transit_count",
]


def _row(rng: np.random.Generator, label: Category) -> dict[str, float]:
    """Sample a transparent feature vector matching one physical class."""
    if label is Category.EXOPLANET_TRANSIT:
        values = [rng.uniform(.8, 20), rng.uniform(120, 7000), rng.uniform(1.0, 5), rng.uniform(8, 35), rng.uniform(7, 18), rng.uniform(0, 2.2), rng.uniform(0, 2.4), rng.uniform(.65, 1.4), rng.uniform(.05, .45), rng.uniform(10, 250), rng.uniform(70, 500), rng.integers(3, 60)]
    elif label is Category.ECLIPSING_BINARY:
        values = [rng.uniform(.4, 15), rng.uniform(9000, 180000), rng.uniform(2, 12), rng.uniform(10, 60), rng.uniform(7, 22), rng.uniform(2.5, 15), rng.uniform(1, 12), rng.uniform(.08, .7), rng.uniform(.55, .98), rng.uniform(400, 8000), rng.uniform(100, 900), rng.integers(3, 80)]
    elif label is Category.STELLAR_BLEND:
        values = [rng.uniform(.7, 22), rng.uniform(300, 13000), rng.uniform(1, 8), rng.uniform(5, 25), rng.uniform(5, 16), rng.uniform(1, 9), rng.uniform(.5, 8), rng.choice([rng.uniform(.05,.3),rng.uniform(3,10)]), rng.uniform(.38,.85), rng.uniform(80, 2500), rng.uniform(150, 900), rng.integers(3, 60)]
    elif label is Category.STARSPOT:
        values = [rng.uniform(2, 30), rng.uniform(20, 3000), rng.uniform(5, 20), rng.uniform(1, 8), rng.uniform(1, 7), rng.uniform(0, 2.5), rng.uniform(0, 3), rng.uniform(.3, 3), rng.uniform(.7, 1), rng.uniform(1500, 25000), rng.uniform(300, 3500), rng.integers(1, 25)]
    else:
        values = [rng.uniform(.5, 30), rng.uniform(5, 1200), rng.uniform(.5, 12), rng.uniform(.1, 6), rng.uniform(.1, 6.5), rng.uniform(0, 3), rng.uniform(0, 4), rng.uniform(.1, 6), rng.uniform(0, 1), rng.uniform(0, 1000), rng.uniform(400, 5000), rng.integers(0, 20)]
    return {name: float(value) for name, value in zip(FEATURE_NAMES, values)}


def make_training_set(n_per_class: int = 450, seed: int = 42):
    rng = np.random.default_rng(seed)
    rows, y = [], []
    for category in Category:
        for _ in range(n_per_class):
            rows.append(_row(rng, category)); y.append(int(category))
    return np.array([[r[n] for n in FEATURE_NAMES] for r in rows]), np.array(y)


def train_model(output: str | Path, n_per_class: int = 450, seed: int = 42) -> dict:
    X, y = make_training_set(n_per_class, seed)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=.25, random_state=seed, stratify=y)
    try:
        from xgboost import XGBClassifier
        model = XGBClassifier(n_estimators=220, max_depth=4, learning_rate=.08, subsample=.9, colsample_bytree=.9, objective="multi:softprob", eval_metric="mlogloss", random_state=seed)
        model_kind = "XGBoost"
    except ImportError:
        model = HistGradientBoostingClassifier(max_iter=220, max_leaf_nodes=20, random_state=seed)
        model_kind = "HistGradientBoosting fallback"
    model.fit(X_train, y_train)
    prediction = model.predict(X_test)
    metrics = {"accuracy": round(float(accuracy_score(y_test, prediction)), 3), "macroF1": round(float(f1_score(y_test, prediction, average="macro")), 3), "trainingSamples": int(len(y)), "model": model_kind, "trainedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    artifact = {"model": model, "features": FEATURE_NAMES, "metrics": metrics, "labels": {int(c): CATEGORY_LABELS[c] for c in Category}}
    target = Path(output); target.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, target)
    target.with_suffix(".metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


def load_model(path: str | Path):
    return joblib.load(path)


def predict(artifact: dict, features: dict[str, float]) -> dict:
    values = np.array([[float(features.get(name, 0)) for name in artifact["features"]]])
    probabilities = artifact["model"].predict_proba(values)[0]
    idx = int(np.argmax(probabilities)); category = Category(idx)
    return {"category": category.slug, "categoryLabel": CATEGORY_LABELS[category], "confidence": round(float(probabilities[idx]), 3), "probabilities": {Category(i).slug: round(float(p), 3) for i, p in enumerate(probabilities)}}
