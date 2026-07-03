# ML Service

FastAPI microservice for the Crime Intelligence platform.

## Setup with Poetry

1. `cd apps/ml-service`
2. `poetry env use 3.14` in this workspace, or any Python `3.11+` interpreter with wheels available
3. `poetry install`
4. Copy `.env.example` to `.env` and set `DATABASE_URL`, `MODEL_CACHE_DIR`, and any model overrides you need

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

1. Start the API with `poetry run serve`.
2. Open `http://localhost:8000/api/v1/health` to confirm it is running.
3. Open the docs at `http://localhost:8000/api/v1/docs`.

You can also run Uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Useful endpoints

1. `POST /api/v1/forecasting/predict`
2. `POST /api/v1/forecasting/hotspot`
3. `POST /api/v1/crime-dna/encode`
4. `POST /api/v1/crime-dna/similarity`
5. `POST /api/v1/clustering/mo-discover`
6. `POST /api/v1/anomaly/detect`