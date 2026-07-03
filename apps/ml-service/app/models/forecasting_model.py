from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

from app.core import CRIME_TYPES, KARNATAKA_DISTRICTS, settings
from app.utils import extract_location_features, extract_time_features


class CrimeForecaster:
    def __init__(self) -> None:
        self.cache_dir = Path(settings.model_cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.artifact_path = self.cache_dir / "forecasting_model.json"
        self._artifact = self._load_or_default()

    def _default_artifact(self) -> dict[str, Any]:
        district_weights = {
            district: round((index + 1) / max(len(KARNATAKA_DISTRICTS), 1), 4)
            for index, district in enumerate(KARNATAKA_DISTRICTS)
        }
        crime_weights = {
            crime_type: round((index + 1) / max(len(CRIME_TYPES), 1), 4)
            for index, crime_type in enumerate(CRIME_TYPES)
        }
        return {
            "trained": False,
            "version": 1,
            "bias": 0.18,
            "district_weights": district_weights,
            "crime_weights": crime_weights,
            "feature_weights": {
                "population_density": 0.18,
                "historical_crime_count": 0.32,
                "is_weekend": 0.05,
                "is_festival": 0.06,
                "is_salary_day": 0.04,
                "hour": 0.05,
            },
            "metrics": {
                "status": "baseline",
                "note": "Calibrated from defaults until train-models is run.",
            },
        }

    def _load_or_default(self) -> dict[str, Any]:
        if not self.artifact_path.exists():
            return self._default_artifact()

        try:
            return json.loads(self.artifact_path.read_text(encoding="utf-8"))
        except Exception:
            return self._default_artifact()

    def train_from_records(self, records: list[dict[str, Any]]) -> dict[str, Any]:
        if not records:
            self._artifact = self._default_artifact()
            self._artifact["trained"] = False
            return self._artifact

        district_totals: dict[str, float] = {}
        crime_totals: dict[str, float] = {}
        population_samples: list[float] = []
        crime_samples: list[float] = []

        for record in records:
            district = str(record.get("district", "Unknown") or "Unknown")
            district_totals[district] = district_totals.get(district, 0.0) + self._record_score(record)

            crime_type = str(record.get("crime_type", "Unknown") or "Unknown")
            crime_totals[crime_type] = crime_totals.get(crime_type, 0.0) + self._record_score(record)

            population_density = record.get("population_density")
            if population_density is not None:
                population_samples.append(float(population_density))

            historical_crime_count = record.get("historical_crime_count")
            if historical_crime_count is not None:
                crime_samples.append(float(historical_crime_count))

        max_district = max(district_totals.values()) if district_totals else 1.0
        max_crime = max(crime_totals.values()) if crime_totals else 1.0

        self._artifact = self._default_artifact()
        self._artifact["trained"] = True
        self._artifact["district_weights"] = {
            key: round(value / max_district, 4) for key, value in district_totals.items()
        }
        self._artifact["crime_weights"] = {
            key: round(value / max_crime, 4) for key, value in crime_totals.items()
        }
        self._artifact["bias"] = round(min(max(sum(crime_samples) / (len(crime_samples) * 1000), 0.05), 0.35), 4) if crime_samples else self._artifact["bias"]

        if population_samples:
            self._artifact["feature_weights"]["population_density"] = round(
                min(max(sum(population_samples) / (len(population_samples) * 50000), 0.08), 0.28),
                4,
            )

        self._artifact["metrics"] = {
            "status": "trained",
            "records": len(records),
            "districts": len(self._artifact["district_weights"]),
            "crime_types": len(self._artifact["crime_weights"]),
        }
        self._persist()
        return self._artifact

    def _record_score(self, record: dict[str, Any]) -> float:
        total = 0.0
        for value in record.values():
            if isinstance(value, (int, float)):
                total += float(value)
            elif isinstance(value, str) and value.strip():
                total += min(len(value.strip()) / 25.0, 1.0)
        return total or 1.0

    def _persist(self) -> None:
        self.artifact_path.write_text(json.dumps(self._artifact, indent=2), encoding="utf-8")

    def predict(self, params: dict[str, Any], model_name: str = "xgboost") -> dict[str, Any]:
        artifact = self._artifact
        time_features = extract_time_features(None)
        time_features.update({k: v for k, v in params.items() if k in time_features})
        location_features = extract_location_features(params)

        score = artifact.get("bias", 0.18)
        district = str(params.get("district", "Unknown") or "Unknown")
        district_weight = artifact.get("district_weights", {}).get(district, 0.12)
        score += district_weight * 0.45

        crime_type = str(params.get("crime_type", "Unknown") or "Unknown")
        crime_weight = artifact.get("crime_weights", {}).get(crime_type, 0.10)
        score += crime_weight * 0.30

        population_density = float(params.get("population_density") or 0.0)
        historical_crime_count = float(params.get("historical_crime_count") or 0.0)
        score += min(population_density / 50000.0, 1.0) * artifact["feature_weights"]["population_density"]
        score += min(historical_crime_count / 1000.0, 1.0) * artifact["feature_weights"]["historical_crime_count"]

        is_weekend = 1 if params.get("is_weekend") else 0
        is_festival = 1 if params.get("is_festival") else 0
        is_salary_day = 1 if params.get("is_salary_day") else 0
        hour = int(params.get("hour") or time_features["hour"])

        score += is_weekend * artifact["feature_weights"]["is_weekend"]
        score += is_festival * artifact["feature_weights"]["is_festival"]
        score += is_salary_day * artifact["feature_weights"]["is_salary_day"]
        score += (1.0 - abs(hour - 21) / 24.0) * artifact["feature_weights"]["hour"]

        if location_features.get("latitude") and location_features.get("longitude"):
            score += 0.04

        probability = 1.0 / (1.0 + math.exp(-5.0 * (score - 0.5)))
        probability = round(max(0.01, min(probability, 0.99)), 4)
        confidence = round(abs(probability - 0.5) * 2.0, 4)

        shap_explanation = {
            "district": round(district_weight * 0.45, 4),
            "crime_type": round(crime_weight * 0.30, 4),
            "population_density": round(min(population_density / 50000.0, 1.0) * artifact["feature_weights"]["population_density"], 4),
            "historical_crime_count": round(min(historical_crime_count / 1000.0, 1.0) * artifact["feature_weights"]["historical_crime_count"], 4),
            "is_weekend": round(is_weekend * artifact["feature_weights"]["is_weekend"], 4),
            "is_festival": round(is_festival * artifact["feature_weights"]["is_festival"], 4),
            "is_salary_day": round(is_salary_day * artifact["feature_weights"]["is_salary_day"], 4),
        }

        top_factors = sorted(
            [
                {"feature": "district", "value": district, "impact": round(district_weight * 0.45, 4)},
                {"feature": "crime_type", "value": crime_type, "impact": round(crime_weight * 0.30, 4)},
                {"feature": "population_density", "value": population_density, "impact": shap_explanation["population_density"]},
                {"feature": "historical_crime_count", "value": historical_crime_count, "impact": shap_explanation["historical_crime_count"]},
                {"feature": "is_festival", "value": is_festival, "impact": shap_explanation["is_festival"]},
            ],
            key=lambda item: -abs(item["impact"]),
        )[:5]

        return {
            "probability": probability,
            "prediction": "high-risk" if probability >= 0.5 else "low-risk",
            "confidence": confidence,
            "shap_explanation": shap_explanation,
            "top_factors": top_factors,
            "model_name": model_name,
        }

    def get_models(self) -> list[dict[str, Any]]:
        trained = bool(self._artifact.get("trained"))
        return [
            {
                "name": "xgboost",
                "algorithm": "heuristic-calibrated booster",
                "trained": trained,
                "features": [
                    "district",
                    "crime_type",
                    "population_density",
                    "historical_crime_count",
                    "is_weekend",
                    "is_festival",
                    "is_salary_day",
                    "hour",
                ],
                "metrics": self._artifact.get("metrics"),
            },
            {
                "name": "lightgbm",
                "algorithm": "heuristic-calibrated booster",
                "trained": trained,
                "features": ["district", "crime_type", "time_features", "location_features"],
                "metrics": self._artifact.get("metrics"),
            },
        ]


class CrimeForecasterInstance:
    def __init__(self) -> None:
        self.forecaster = CrimeForecaster()