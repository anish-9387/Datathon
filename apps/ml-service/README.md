# ML Service

FastAPI microservice for the Crime Intelligence platform.

## Setup (venv + pip — recommended)

1. `cd apps/ml-service`
2. `python3 -m venv .venv` (Python 3.11+)
3. `.venv/bin/pip install -r requirements.txt`
4. Copy `.env.example` to `.env` if you need to override defaults (the defaults work for local dev)

Poetry (`pyproject.toml`) is also present but its lock file may lag behind
`requirements.txt`; prefer the venv + pip path above.

## Training

The service uses two patterns:

1. Offline calibration for the forecasting model.
2. Request-time fitting for clustering, anomaly detection, and similarity search.

To train the forecasting model from the bundled CSV data:

1. Make sure the CSV files under `../../data` are present.
2. Run `poetry run train-models` from `apps/ml-service`.
3. The calibrated artifact is written to `MODEL_CACHE_DIR/forecasting_model.json`.

If you update the historical data, rerun the same command to regenerate the artifact.

## Run

```bash
.venv/bin/uvicorn main:app --reload --port 8000
# or from the repo root: pnpm dev:ml
```

1. Open `http://localhost:8000/api/v1/health` to confirm it is running.
2. Open the docs at `http://localhost:8000/api/v1/docs`.

## Useful endpoints

1. `POST /api/v1/forecasting/predict`
2. `POST /api/v1/forecasting/hotspot`
3. `POST /api/v1/crime-dna/encode`
4. `POST /api/v1/crime-dna/similarity`
5. `POST /api/v1/clustering/mo-discover`
6. `POST /api/v1/anomaly/detect`