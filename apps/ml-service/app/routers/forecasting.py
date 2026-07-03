import logging

from fastapi import APIRouter, HTTPException

from app.models import CrimeForecasterInstance
from app.schemas import (
    PredictRequest,
    PredictResponse,
    HotspotRequest,
    HotspotResponse,
    ModelsResponse,
    ModelInfo,
)

logger = logging.getLogger(__name__)
router = APIRouter()

forecaster_instance = CrimeForecasterInstance()


@router.post("/predict", response_model=PredictResponse)
async def predict_crime(request: PredictRequest):
    try:
        forecaster = forecaster_instance.forecaster
        params = request.model_dump(exclude_none=True)

        if "hour" not in params or "day" not in params or "month" not in params:
            from datetime import datetime
            now = datetime.now()
            params.setdefault("hour", now.hour)
            params.setdefault("day", now.day)
            params.setdefault("month", now.month)
            params.setdefault("day_of_week", now.weekday())

        if "day_of_week" in params:
            params["is_weekend"] = 1 if params["day_of_week"] >= 5 else 0

        result = forecaster.predict(params, model_name="xgboost")

        return PredictResponse(
            probability=result["probability"],
            prediction=result["prediction"],
            confidence=result["confidence"],
            shap_explanation=result["shap_explanation"],
            top_factors=result["top_factors"],
        )
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hotspot", response_model=HotspotResponse)
async def generate_hotspots(request: HotspotRequest):
    try:
        forecaster = forecaster_instance.forecaster

        import numpy as np
        from app.core import KARNATAKA_COORDS

        if request.district and request.district in KARNATAKA_COORDS:
            center = KARNATAKA_COORDS[request.district]
            lat_min, lat_max = center["lat"] - 0.5, center["lat"] + 0.5
            lng_min, lng_max = center["lng"] - 0.5, center["lng"] + 0.5
        else:
            lat_min, lat_max = 11.5, 18.5
            lng_min, lng_max = 74.0, 78.5

        grid_size = request.grid_size
        lats = np.linspace(lat_min, lat_max, grid_size)
        lngs = np.linspace(lng_min, lng_max, int(grid_size * (lng_max - lng_min) / (lat_max - lat_min)))

        hotspots = []
        for lat in lats[::5]:
            for lng in lngs[::5]:
                fake_params = {
                    "hour": 21,
                    "day": 15,
                    "month": 6,
                    "day_of_week": 5,
                    "is_weekend": 1,
                    "is_festival": 0,
                    "is_salary_day": 0,
                    "district": request.district or "Bengaluru Urban",
                    "crime_type": request.crime_type or "Robbery",
                    "population_density": 8000,
                    "historical_crime_count": 100,
                    "latitude": float(lat),
                    "longitude": float(lng),
                }
                result = forecaster.predict(fake_params)

                from app.utils import extract_time_features, extract_location_features
                risk_score = result["probability"]
                num_crimes = int(np.random.poisson(risk_score * 10 + 1))

                hotspots.append({
                    "latitude": float(lat),
                    "longitude": float(lng),
                    "risk_score": round(float(risk_score), 4),
                    "predicted_crimes": num_crimes,
                    "confidence": result["confidence"],
                })

        hotspots.sort(key=lambda h: -h["risk_score"])
        top_hotspots = hotspots[:20]

        return HotspotResponse(
            hotspots=top_hotspots,
            total_hotspots=len(top_hotspots),
            model_info={
                "model": "XGBoost Crime Predictor",
                "algorithm": "XGBoost",
                "grid_size": request.grid_size,
                "district": request.district or "All Karnataka",
                "crime_type": request.crime_type or "All Types",
            },
        )
    except Exception as e:
        logger.error(f"Hotspot generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models", response_model=ModelsResponse)
async def list_models():
    try:
        forecaster = forecaster_instance.forecaster
        models_data = forecaster.get_models()

        models = []
        for m in models_data:
            models.append(ModelInfo(
                name=m["name"],
                algorithm=m["algorithm"],
                trained=m["trained"],
                features=m["features"],
                metrics=m.get("metrics"),
            ))

        return ModelsResponse(models=models)
    except Exception as e:
        logger.error(f"Failed to list models: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
