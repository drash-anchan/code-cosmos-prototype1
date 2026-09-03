# Exovision

An end-to-end prototype for classifying exoplanet transit candidates into five categories: exoplanet transit, eclipsing binary, stellar blend, starspot, and noise. It combines physics-led validation features (periodic transit search proxies, secondary eclipses, odd/even depth, asterodensity and shape) with an XGBoost classifier.

## Run the ML API

```bash
cd ml
python3 -m pip install -r requirements.txt
PYTHONPATH=src uvicorn api.main:app --reload --port 8000
```

On its first request, the API trains and saves `ml/artifacts/exovision-model.joblib`. You can train it manually with:

```bash
cd ml
PYTHONPATH=src python3 -m exovision.cli --samples-per-class 450
```

## Run the React frontend

```bash
cd web
npm install
npm run dev
```

Open the local Vite URL. The classifier works in demo mode when the API is off, and automatically calls the trained model at `http://localhost:8000/api/predict` when it is running.

## Project layout

- `ml/src/exovision/pipeline.py` — synthetic training data, XGBoost training, prediction
- `ml/api/main.py` — FastAPI inference endpoint
- `web/` — Vite + React interactive dashboard
- `docs/API_CONTRACT.md` — fuller dashboard API contract for future expansion
