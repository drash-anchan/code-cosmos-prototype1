"""Exovision — autonomous exoplanet detection from Kepler/TESS light curves.

The package is organised as a straight line from raw photometry to a scored
candidate:

    data       simulate or load light curves
    preprocess clean + detrend away stellar variability
    search     BLS / TLS periodograms, iterative masking for multi-planet systems
    validation secondary-eclipse, odd-even and asterodensity vetting
    features   turn the search + vetting numbers into a feature vector
    models     XGBoost classifier over the five candidate categories
    modeling   batman + emcee transit fits for promising candidates
    pipeline   glues all of the above into one call

Every optional dependency has a pure-numpy fallback, so `import exovision`
works on a bare numpy/scipy/sklearn/xgboost install.
"""

from exovision.labels import CATEGORIES, CATEGORY_LABELS, Category

__version__ = "1.0.0"

__all__ = ["Category", "CATEGORIES", "CATEGORY_LABELS", "__version__"]
