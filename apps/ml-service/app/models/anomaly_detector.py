from __future__ import annotations

from collections import Counter
from typing import Any

import numpy as np

from app.utils import create_mo_feature_vector, extract_location_features, extract_mo_fingerprint


class AnomalyDetector:
    def _vectorize(self, fir: dict[str, Any]) -> np.ndarray:
        mo = extract_mo_fingerprint(fir)
        location = extract_location_features(fir)
        vector = create_mo_feature_vector(
            hour_of_day=int(mo.get("hour_of_day", 0)),
            day_of_week=int(mo.get("day_of_week", 0)),
            crime_type=str(mo.get("crime_type", "Unknown")),
            location=str(mo.get("location", "Unknown")),
            weapon=str(mo.get("weapon", "Unknown")),
            escape_mode=str(mo.get("escape_mode", "Unknown")),
            location_type=str(mo.get("location_type", "Unknown")),
            victim_profile=str(mo.get("victim_profile", "Unknown")),
            accused_profile=str(mo.get("accused_profile", "Unknown")),
        )
        extras = np.array([
            float(location.get("latitude", 0.0)),
            float(location.get("longitude", 0.0)),
        ], dtype=np.float32)
        return np.concatenate([vector, extras]).astype(np.float32)

    def detect(self, fir_dicts: list[dict[str, Any]], contamination: float = 0.1) -> list[dict[str, Any]]:
        if not fir_dicts:
            return []

        frequencies: Counter[str] = Counter(self._pattern_key(fir) for fir in fir_dicts)
        threshold = max(1, int(round(len(fir_dicts) * contamination)))

        results = []
        for fir in fir_dicts:
            pattern_key = self._pattern_key(fir)
            frequency = frequencies[pattern_key]
            anomaly_score = 1.0 / frequency
            is_anomaly = frequency <= threshold
            explanation = self._build_explanation(fir) if is_anomaly else "Within expected range"
            results.append({
                "fir_id": str(fir.get("fir_id", "")),
                "anomaly_score": round(float(anomaly_score), 4),
                "is_anomaly": is_anomaly,
                "explanation": explanation,
            })
        results.sort(key=lambda item: (-int(item["is_anomaly"]), -item["anomaly_score"]))
        return results

    def detect_emerging_patterns(self, fir_dicts: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not fir_dicts:
            return []

        pattern_counter: Counter[str] = Counter()
        for fir in fir_dicts:
            parts = [
                str(fir.get("district", "Unknown") or "Unknown"),
                str(fir.get("crime_type", "Unknown") or "Unknown"),
                str(fir.get("weapon", "Unknown") or "Unknown"),
                str(fir.get("location_type", "Unknown") or "Unknown"),
            ]
            pattern_counter[" | ".join(parts)] += 1

        total = len(fir_dicts)
        patterns = []
        for pattern, count in pattern_counter.most_common(10):
            if count < 2:
                continue
            patterns.append({
                "pattern": pattern,
                "support": count,
                "support_ratio": round(count / total, 4),
            })
        return patterns

    def _build_explanation(self, fir: dict[str, Any]) -> str:
        district = str(fir.get("district", "Unknown") or "Unknown")
        crime_type = str(fir.get("crime_type", "Unknown") or "Unknown")
        location = str(fir.get("location", "Unknown") or "Unknown")
        return f"Unusual combination of {crime_type} in {district} around {location}"

    def _pattern_key(self, fir: dict[str, Any]) -> str:
        mo = extract_mo_fingerprint(fir)
        return "|".join(
            [
                str(mo.get("district", "Unknown") or "Unknown").lower(),
                str(mo.get("crime_type", "Unknown") or "Unknown").lower(),
                str(mo.get("weapon", "Unknown") or "Unknown").lower(),
                str(mo.get("location_type", "Unknown") or "Unknown").lower(),
                str(mo.get("escape_mode", "Unknown") or "Unknown").lower(),
            ]
        )


class AnomalyDetectorInstance:
    def __init__(self) -> None:
        self.detector = AnomalyDetector()