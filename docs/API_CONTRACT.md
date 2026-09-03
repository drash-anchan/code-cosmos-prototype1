# Exovision API contract

The single source of truth shared by `ml/api/` (FastAPI) and `web/` (React).
All floats are JSON numbers; `null` is used for "not computed".

Base URL in dev: `http://localhost:8000`

---

## `GET /health`

```json
{
  "status": "ok",
  "modelLoaded": true,
  "catalogLoaded": true,
  "version": "1.0.0",
  "dependencies": [
    { "name": "batman", "available": true, "version": "2.5.1",
      "purpose": "analytic Mandel & Agol transit model",
      "fallbackWhenMissing": "trapezoidal transit model" }
  ]
}
```

## `GET /api/stats`

```json
{
  "starsScanned": 482,
  "candidatesFound": 37,
  "highConfidence": 19,
  "multiPlanetSystems": 4,
  "planetsDetected": 41,
  "categoryCounts": { "exoplanet_transit": 22, "eclipsing_binary": 7,
                      "stellar_blend": 4, "starspot": 3, "noise": 1 },
  "modelAccuracy": 0.83,
  "modelMacroF1": 0.82
}
```

## `GET /api/categories`

```json
[{ "slug": "exoplanet_transit", "label": "Exoplanet transit", "index": 0,
   "description": "Flat-bottomed periodic dip, no secondary eclipse…",
   "count": 22 }]
```

## `GET /api/candidates`

Sorted by confidence descending. Supports `?category=<slug>`, `?minConfidence=0.5`,
`?multiOnly=true`, `?search=<substring>`, `?limit=<int>` (all optional, and the
React app also filters client-side so the endpoint staying dumb is fine).

```json
[{
  "id": "kic-100234", "name": "KIC 100234", "mission": "Kepler",
  "confidence": 0.94, "category": "exoplanet_transit",
  "categoryLabel": "Exoplanet transit", "isMultiPlanet": true,
  "nPlanets": 2, "periodDays": 3.2107, "depthPpm": 5940,
  "durationHours": 2.64, "radiusEarth": 2.7, "sde": 13.7, "snr": 22.9,
  "vetted": true
}]
```

## `GET /api/candidates/{id}`

```json
{
  "id": "kic-100234", "name": "KIC 100234", "mission": "Kepler",
  "confidence": 0.94, "category": "exoplanet_transit",
  "categoryLabel": "Exoplanet transit",
  "categoryDescription": "Flat-bottomed periodic dip…",
  "isMultiPlanet": true, "nPlanets": 2,
  "star": { "radiusRsun": 0.94, "massMsun": 0.97, "teffK": 5620,
            "densityRhoSun": 1.17, "magnitude": 12.4 },
  "lightCurve": {
    "time": [0.0, 0.02, …],
    "rawFlux": [1.0004, 0.9998, …],
    "detrendedFlux": [1.0001, 0.9999, …],
    "trend": [1.0002, 1.0002, …]
  },
  "planets": [{
    "label": "Planet b · 3.21 d",
    "letter": "b",
    "periodDays": 3.2107, "t0": 1.4021,
    "depthPpm": 5940, "durationHours": 2.64, "radiusEarth": 2.71,
    "aOverRs": 9.8, "impactParameter": 0.31, "inclinationDeg": 88.2,
    "equilibriumTempK": 1120,
    "sde": 13.7, "snr": 22.9,
    "confidence": 0.94, "category": "exoplanet_transit",
    "categoryLabel": "Exoplanet transit",
    "folded":  { "phase": [-0.5, …], "flux": [1.0, …] },
    "binned":  { "phase": [-0.5, …], "flux": [1.0, …], "err": [0.0004, …] },
    "model":   { "phase": [-0.5, …], "flux": [1.0, …] },
    "vetting": {
      "secondaryEclipseDepthPpm": 41, "secondaryEclipseSigma": 0.8,
      "secondaryEclipseFlag": false,
      "oddDepthPpm": 5896, "evenDepthPpm": 5977, "oddEvenSigma": 1.1,
      "oddEvenFlag": false,
      "impliedDensityRhoSun": 1.09, "densityRatio": 0.93,
      "asterodensityFlag": false,
      "vShapeScore": 0.21, "vShapeFlag": false,
      "harmonicAmplitudePpm": 415, "transitCount": 28,
      "verdict": "passes all vetting checks",
      "checks": [{ "name": "Secondary eclipse", "passed": true,
                   "detail": "0.8σ at phase 0.5 — consistent with noise" }]
    },
    "posterior": {
      "sampler": "emcee", "nSamples": 6400, "acceptanceFraction": 0.42,
      "converged": true,
      "parameters": [{ "name": "period", "unit": "days", "median": 3.2107,
                       "lower": 0.0004, "upper": 0.0004,
                       "samples": [3.2103, …] }],
      "chainSummary": { "maxAutocorrTime": 41.2, "nEffective": 155 }
    }
  }],
  "featureVector": { "sde": 13.7, "depth_ppm": 5940, … },
  "topFeatures": [{ "name": "odd_even_sigma", "value": 1.1, "importance": 0.08 }]
}
```

`posterior` is `null` when modelling was skipped (low confidence or disabled).
`model.flux` is the best-fit transit evaluated on the folded phase grid.

## `POST /api/detect`

Body (all optional): `{ "starId": "kic-100234", "mission": "TESS", "seed": 12 }`
Runs the full pipeline on a freshly simulated (or requested) star and returns the
same shape as `GET /api/candidates/{id}`, plus:

```json
{ "runtimeSeconds": 4.8, "stagesCompleted": ["clean", "detrend", "search", "vet", "classify", "model"] }
```

## `GET /api/model/metrics`

```json
{
  "accuracy": 0.83, "balancedAccuracy": 0.82, "macroF1": 0.82,
  "planetPrecision": 0.90, "planetRecall": 0.88, "planetRocAuc": 0.95,
  "labels": ["Exoplanet transit", "Eclipsing binary", "Stellar blend", "Starspot", "Noise"],
  "confusionMatrix": [[…]],
  "perClass": [{ "label": "Exoplanet transit", "precision": 0.9,
                 "recall": 0.88, "f1": 0.89, "support": 105 }],
  "featureImportance": [{ "name": "sde", "importance": 0.14 }],
  "crossValidation": { "folds": 5, "accuracyMean": 0.82, "accuracyStd": 0.02 },
  "nTrain": 1050, "nTest": 350, "nFeatures": 48, "trainedAt": "2026-09-03T09:00:00Z"
}
```
