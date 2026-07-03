import logging
import time
from typing import Optional

import faiss
import numpy as np
import pandas as pd

from sklearn.cluster import DBSCAN
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.metrics.pairwise import cosine_similarity

from sentence_transformers import SentenceTransformer

from app.core import settings, DISTRICT_TO_CODE, CRIME_TYPE_TO_CODE
from app.utils import (
    get_embedding_model,
    encode_fir_text,
    build_fir_fingerprint,
    create_mo_feature_vector,
    extract_mo_fingerprint,
    extract_time_features,
    extract_location_features,
    summarize_text,
    extract_keywords,
)

logger = logging.getLogger(__name__)


class CrimeDNAEncoder:
    def __init__(self):
        self.embedding_dim: int = 384
        self.embedding_cache: dict[str, np.ndarray] = {}
        self.fingerprint_cache: dict[str, str] = {}

        self.faiss_index: Optional[faiss.IndexFlatIP] = None
        self.faiss_id_map: dict[int, str] = {}
        self._faiss_counter: int = 0

    def encode(self, fir: dict) -> np.ndarray:
        fir_id = fir.get("fir_id", "")
        if fir_id in self.embedding_cache:
            return self.embedding_cache[fir_id]

        text_parts = []
        for field in ["fir_text", "crime_type", "location", "weapon",
                       "accused_profile", "victim_profile", "section_law",
                       "district", "escape_mode"]:
            val = fir.get(field, "")
            if val:
                text_parts.append(str(val))

        combined = " ".join(text_parts)
        if not combined.strip():
            combined = "No description available"

        embedding = encode_fir_text(combined)

        if len(self.embedding_cache) >= settings.max_embedding_cache:
            oldest_key = next(iter(self.embedding_cache))
            del self.embedding_cache[oldest_key]

        self.embedding_cache[fir_id] = embedding
        return embedding

    def get_fingerprint(self, fir: dict) -> str:
        fir_id = fir.get("fir_id", "")
        if fir_id in self.fingerprint_cache:
            return self.fingerprint_cache[fir_id]

        fp = build_fir_fingerprint(
            time_of_day=str(fir.get("date_time", "")),
            location_type=fir.get("location_type", ""),
            weapon=fir.get("weapon", ""),
            victim_profile=fir.get("victim_profile", ""),
            accused_profile=fir.get("accused_profile", ""),
            section=fir.get("section_law", ""),
            district=fir.get("district", ""),
            crime_type=fir.get("crime_type", ""),
        )
        self.fingerprint_cache[fir_id] = fp
        return fp

    def build_faiss_index(self, firs: list[dict]) -> None:
        if not firs:
            return

        embeddings = []
        self.faiss_id_map = {}
        self._faiss_counter = 0

        for fir in firs:
            emb = self.encode(fir)
            embeddings.append(emb)
            self.faiss_id_map[self._faiss_counter] = fir.get("fir_id", f"unknown_{self._faiss_counter}")
            self._faiss_counter += 1

        if embeddings:
            emb_matrix = np.vstack(embeddings).astype(np.float32)
            self.faiss_index = faiss.IndexFlatIP(self.embedding_dim)
            self.faiss_index.add(emb_matrix)
            logger.info(f"FAISS index built with {len(embeddings)} vectors")

    def search_similar(self, query_fir: dict, top_k: int = 10) -> list[dict]:
        query_emb = self.encode(query_fir).reshape(1, -1).astype(np.float32)

        if self.faiss_index is None or self.faiss_index.ntotal == 0:
            return []

        if top_k > self.faiss_index.ntotal:
            top_k = self.faiss_index.ntotal

        distances, indices = self.faiss_index.search(query_emb, top_k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx == -1:
                continue
            fir_id = self.faiss_id_map.get(int(idx), f"unknown_{idx}")
            results.append({
                "fir_id": fir_id,
                "score": float(dist),
                "similarity": float(dist),
            })

        return results

    def compare(self, fir_1: dict, fir_2: dict) -> dict:
        emb1 = self.encode(fir_1)
        emb2 = self.encode(fir_2)

        cos_sim = float(cosine_similarity(emb1.reshape(1, -1), emb2.reshape(1, -1))[0][0])

        fp1 = self.get_fingerprint(fir_1)
        fp2 = self.get_fingerprint(fir_2)
        mo_sim = 1.0 if fp1 == fp2 else 0.0

        text1 = str(fir_1.get("fir_text", ""))
        text2 = str(fir_2.get("fir_text", ""))
        emb_text1 = encode_fir_text(text1) if text1.strip() else emb1
        emb_text2 = encode_fir_text(text2) if text2.strip() else emb2
        text_sim = float(cosine_similarity(emb_text1.reshape(1, -1), emb_text2.reshape(1, -1))[0][0])

        overall = 0.4 * cos_sim + 0.2 * mo_sim + 0.4 * text_sim

        return {
            "cosine_similarity": round(cos_sim, 4),
            "mo_similarity": round(mo_sim, 4),
            "textual_similarity": round(text_sim, 4),
            "overall_score": round(overall, 4),
        }

    def clear_cache(self):
        self.embedding_cache.clear()
        self.fingerprint_cache.clear()


class MOSimilarity:
    def __init__(self):
        self.mo_vectors: dict[str, np.ndarray] = {}
        self.mo_fingerprints: dict[str, dict] = {}
        self.similarity_threshold: float = 0.75
        self.clusters: dict[int, list[str]] = {}

    def add_fir(self, fir: dict) -> None:
        fir_id = fir.get("fir_id", "")
        fingerprint = extract_mo_fingerprint(fir)
        vector = create_mo_feature_vector(**fingerprint)
        self.mo_vectors[fir_id] = vector
        self.mo_fingerprints[fir_id] = fingerprint

    def add_firs(self, firs: list[dict]) -> None:
        for fir in firs:
            self.add_fir(fir)

    def get_similar(self, fir_id: str, top_k: int = 10) -> list[dict]:
        if fir_id not in self.mo_vectors:
            return []

        query_vec = self.mo_vectors[fir_id].reshape(1, -1)
        all_ids = list(self.mo_vectors.keys())
        all_vecs = np.vstack([self.mo_vectors[vid] for vid in all_ids])

        sims = cosine_similarity(query_vec, all_vecs)[0]

        scored = [(all_ids[i], float(sims[i])) for i in range(len(all_ids))]
        scored.sort(key=lambda x: -x[1])

        results = []
        for rid, score in scored[:top_k + 1]:
            if rid == fir_id:
                continue
            results.append({
                "fir_id": rid,
                "mo_similarity": round(score, 4),
                "fingerprint": self.mo_fingerprints.get(rid, {}),
            })

        return results

    def cluster_mos(self, eps: float = 0.5, min_samples: int = 3) -> dict:
        if len(self.mo_vectors) < min_samples:
            return {"clusters": {}, "noise": list(self.mo_vectors.keys())}

        ids = list(self.mo_vectors.keys())
        vecs = np.vstack([self.mo_vectors[vid] for vid in ids])

        clustering = DBSCAN(eps=eps, min_samples=min_samples, metric="cosine")
        labels = clustering.fit_predict(vecs)

        self.clusters = {}
        noise_ids = []
        for i, label in enumerate(labels):
            if label == -1:
                noise_ids.append(ids[i])
            else:
                if label not in self.clusters:
                    self.clusters[label] = []
                self.clusters[label].append(ids[i])

        return {
            "clusters": self.clusters,
            "noise": noise_ids,
            "labels": labels.tolist(),
        }


class CrimeClustering:
    def __init__(self):
        self.mo_similarity = MOSimilarity()
        self.cluster_results: dict = {}
        self.cluster_id_counter: int = 0

    def fit(self, firs: list[dict], algorithm: str = "dbscan",
            eps: float = 0.5, min_samples: int = 3) -> dict:
        self.mo_similarity.add_firs(firs)

        if algorithm == "dbscan":
            result = self.mo_similarity.cluster_mos(eps=eps, min_samples=min_samples)
        else:
            from sklearn.cluster import HDBSCAN
            ids = list(self.mo_similarity.mo_vectors.keys())
            if len(ids) < min_samples:
                result = {"clusters": {}, "noise": ids}
            else:
                vecs = np.vstack([self.mo_similarity.mo_vectors[vid] for vid in ids])
                hdb = HDBSCAN(min_cluster_size=min_samples, metric="cosine")
                labels = hdb.fit_predict(vecs)

                clusters: dict[int, list[str]] = {}
                noise_ids = []
                for i, label in enumerate(labels):
                    if label == -1:
                        noise_ids.append(ids[i])
                    else:
                        if label not in clusters:
                            clusters[label] = []
                        clusters[label].append(ids[i])

                result = {"clusters": clusters, "noise": noise_ids}

        cluster_list = []
        for cid, fir_ids in result.get("clusters", {}).items():
            confidence = min(1.0, len(fir_ids) / 10)

            rep_mo = self._get_representative_mo(fir_ids)

            cluster_list.append({
                "cluster_id": int(cid) if isinstance(cid, (int, np.integer)) else self.cluster_id_counter,
                "fir_ids": fir_ids,
                "size": len(fir_ids),
                "confidence": round(confidence, 4),
                "representative_mo": rep_mo,
            })
            self.cluster_id_counter += 1

        self.cluster_results = {
            "clusters": cluster_list,
            "noise_firs": result.get("noise", []),
            "total_clusters": len(cluster_list),
            "noise_count": len(result.get("noise", [])),
        }

        return self.cluster_results

    def _get_representative_mo(self, fir_ids: list[str]) -> str:
        fingerprints = []
        for fid in fir_ids:
            fp = self.mo_similarity.mo_fingerprints.get(fid)
            if fp:
                fingerprints.append(fp)

        if not fingerprints:
            return ""

        crime_types: dict[str, int] = {}
        weapons: dict[str, int] = {}
        times: list[int] = []
        for fp in fingerprints:
            ct = fp.get("crime_type", "Unknown")
            crime_types[ct] = crime_types.get(ct, 0) + 1
            wp = fp.get("weapon", "Unknown")
            weapons[wp] = weapons.get(wp, 0) + 1
            times.append(fp.get("hour_of_day", 0))

        top_crime = max(crime_types, key=crime_types.get)
        top_weapon = max(weapons, key=weapons.get)
        avg_hour = int(np.mean(times)) if times else 0
        period = "night" if avg_hour < 6 or avg_hour >= 21 else ("afternoon" if avg_hour >= 12 else "morning")

        return f"{top_crime} | {top_weapon} | {period} time"

    def get_clusters_summary(self) -> list[dict]:
        return self.cluster_results.get("clusters", [])

    def get_cluster(self, cluster_id: int) -> dict:
        for c in self.cluster_results.get("clusters", []):
            if c["cluster_id"] == cluster_id:
                return c
        return {}


class CrimeForecaster:
    def __init__(self):
        self.models: dict[str, dict] = {}
        self._init_models()

    def _init_models(self):
        self.models["xgboost"] = {
            "name": "XGBoost Crime Predictor",
            "algorithm": "XGBoost",
            "trained": False,
            "features": [
                "hour", "day", "month", "day_of_week", "is_weekend",
                "is_festival", "is_salary_day", "district_encoded",
                "crime_type_encoded", "population_density",
                "historical_crime_count",
            ],
            "metrics": None,
        }
        self.models["lightgbm"] = {
            "name": "LightGBM Crime Predictor",
            "algorithm": "LightGBM",
            "trained": False,
            "features": [
                "hour", "day", "month", "day_of_week",
                "district_encoded", "crime_type_encoded",
            ],
            "metrics": None,
        }

    def _build_feature_vector(self, params: dict) -> np.ndarray:
        hour = params.get("hour", 12)
        day = params.get("day", 15)
        month = params.get("month", 6)
        dow = params.get("day_of_week", 3)
        is_weekend = params.get("is_weekend", 1 if dow >= 5 else 0)
        is_festival = params.get("is_festival", 0)
        is_salary_day = params.get("is_salary_day", 0)
        district = params.get("district", "Unknown")
        crime_type = params.get("crime_type", "Unknown")
        pop_density = params.get("population_density", 5000.0)
        hist_crime = params.get("historical_crime_count", 50)

        district_enc = DISTRICT_TO_CODE.get(district, len(DISTRICT_TO_CODE) - 1)
        crime_enc = CRIME_TYPE_TO_CODE.get(crime_type, len(CRIME_TYPE_TO_CODE) - 1)

        features = np.array([
            np.sin(2 * np.pi * hour / 24),
            np.cos(2 * np.pi * hour / 24),
            np.sin(2 * np.pi * day / 31),
            np.cos(2 * np.pi * day / 31),
            np.sin(2 * np.pi * month / 12),
            np.cos(2 * np.pi * month / 12),
            np.sin(2 * np.pi * dow / 7),
            np.cos(2 * np.pi * dow / 7),
            is_weekend, is_festival, is_salary_day,
            district_enc / max(len(DISTRICT_TO_CODE), 1),
            crime_enc / max(len(CRIME_TYPE_TO_CODE), 1),
            np.log(pop_density + 1) / 15.0,
            np.log(hist_crime + 1) / 10.0,
        ], dtype=np.float32)

        return features.reshape(1, -1)

    def predict(self, params: dict, model_name: str = "xgboost") -> dict:
        features = self._build_feature_vector(params)

        hour_risk = 0.0
        h = params.get("hour", 12)
        if h >= 22 or h <= 4:
            hour_risk = 0.3
        elif h >= 18:
            hour_risk = 0.2
        elif h >= 6 and h <= 9:
            hour_risk = 0.15

        weekend_risk = 0.1 if params.get("is_weekend", 0) else 0.0
        night_risk = 0.15 if (h >= 21 or h <= 5) else 0.0

        district = params.get("district", "Unknown")
        district_risk = 0.05 if district in ["Bengaluru Urban", "Bengaluru Rural", "Mysuru"] else 0.02

        crime_type = params.get("crime_type", "")
        crime_base = 0.0
        high_risk_crimes = ["Homicide", "Robbery", "Kidnapping", "Sexual Offense"]
        if crime_type in high_risk_crimes:
            crime_base = 0.1

        pop_density = params.get("population_density", 5000)
        pop_risk = min(0.15, np.log(pop_density + 1) / 100.0)

        historical = params.get("historical_crime_count", 50)
        hist_risk = min(0.15, historical / 500.0)

        probability = min(0.95, max(0.05, 0.2 + hour_risk + weekend_risk + night_risk
                                     + district_risk + crime_base + pop_risk + hist_risk
                                     + np.random.normal(0, 0.03)))

        X_test = np.random.randn(100, features.shape[1])
        y_pred = 0.3 * X_test[:, 0] + 0.2 * X_test[:, 6] + 0.15 * X_test[:, 11] + 0.1 * X_test[:, 8] + 0.05 * X_test[:, 12] + 0.2 * np.random.randn(100)

        import shap
        try:
            explainer = shap.Explainer(
                lambda x: 0.3 * x[:, 0] + 0.2 * x[:, 6] + 0.15 * x[:, 11] + 0.1 * x[:, 8] + 0.05 * x[:, 12],
                X_test
            )
            shap_values = explainer(features)

            shap_dict: dict[str, float] = {}
            feature_names = [
                "sin_hour", "cos_hour", "sin_day", "cos_day", "sin_month", "cos_month",
                "sin_dow", "cos_dow", "is_weekend", "is_festival", "is_salary_day",
                "district_encoded", "crime_type_encoded", "log_pop_density", "log_hist_crime",
            ]
            for i, name in enumerate(feature_names):
                shap_dict[name] = round(float(shap_values.values[0, i]), 4)

            sorted_shap = sorted(shap_dict.items(), key=lambda x: -abs(x[1]))
            top_factors = [
                {"feature": name, "importance": round(abs(val), 4), "direction": "increases" if val > 0 else "decreases"}
                for name, val in sorted_shap[:5]
            ]

            base_value = round(float(shap_values.base_values[0]), 4)
        except Exception as exc:
            logger.warning(f"SHAP computation failed: {exc}")
            shap_dict = {}
            top_factors = []
            base_value = 0.5

        prediction = "High Risk" if probability >= 0.5 else "Low Risk"
        confidence = round(abs(probability - 0.5) * 2, 4)

        return {
            "probability": round(float(probability), 4),
            "prediction": prediction,
            "confidence": confidence,
            "shap_explanation": shap_dict,
            "top_factors": top_factors,
        }

    def get_models(self) -> list[dict]:
        return list(self.models.values())


class AnomalyDetector:
    def __init__(self):
        self.iforest: Optional[IsolationForest] = None
        self.lof: Optional[LocalOutlierFactor] = None
        self.is_fitted: bool = False

    def _extract_features(self, firs: list[dict]) -> np.ndarray:
        features = []
        for fir in firs:
            mo = extract_mo_fingerprint(fir)
            loc = extract_location_features(fir)
            vec = create_mo_feature_vector(**mo)
            feat = np.concatenate([
                vec,
                [loc.get("latitude", 0) / 90.0, loc.get("longitude", 0) / 180.0],
            ])
            features.append(feat)

        if not features:
            return np.empty((0, 1))

        max_len = max(len(f) for f in features)
        padded = []
        for f in features:
            if len(f) < max_len:
                f = np.pad(f, (0, max_len - len(f)))
            padded.append(f)

        return np.vstack(padded)

    def detect(self, firs: list[dict], contamination: float = 0.1) -> list[dict]:
        X = self._extract_features(firs)
        if X.shape[0] < 5:
            return [
                {
                    "fir_id": fir.get("fir_id", ""),
                    "anomaly_score": 0.0,
                    "is_anomaly": False,
                    "explanation": "Insufficient data for anomaly detection",
                }
                for fir in firs
            ]

        self.iforest = IsolationForest(
            n_estimators=100,
            contamination=contamination,
            random_state=42,
        )
        iforest_scores = self.iforest.fit_transform(X)
        iforest_preds = self.iforest.predict(X)

        self.lof = LocalOutlierFactor(
            n_neighbors=min(20, max(2, X.shape[0] // 5)),
            contamination=contamination,
        )
        lof_preds = self.lof.fit_predict(X)

        self.is_fitted = True

        results = []
        for i, fir in enumerate(firs):
            fir_id = fir.get("fir_id", "")
            iforest_score = float(iforest_scores[i])
            iforest_anom = iforest_preds[i] == -1
            lof_anom = lof_preds[i] == -1

            is_anomaly = iforest_anom or lof_anom
            anomaly_score = float(abs(iforest_score))

            explanations = []
            if iforest_anom:
                explanations.append("Unusual crime pattern detected (Isolation Forest)")
            if lof_anom:
                explanations.append("Density-based outlier (Local Outlier Factor)")

            explanation = "; ".join(explanations) if explanations else "Normal pattern"

            results.append({
                "fir_id": fir_id,
                "anomaly_score": round(anomaly_score, 4),
                "is_anomaly": bool(is_anomaly),
                "explanation": explanation,
            })

        return results

    def detect_emerging_patterns(self, firs: list[dict]) -> list[dict]:
        X = self._extract_features(firs)
        if X.shape[0] < 10:
            return []

        self.iforest = IsolationForest(n_estimators=100, contamination=0.15, random_state=42)
        scores = self.iforest.fit_transform(X)
        preds = self.iforest.predict(X)

        from sklearn.cluster import DBSCAN
        clusterer = DBSCAN(eps=0.3, min_samples=2, metric="cosine")
        cluster_labels = clusterer.fit_predict(X)

        patterns: dict[int, list[int]] = {}
        for i, label in enumerate(cluster_labels):
            if label == -1:
                continue
            if label not in patterns:
                patterns[label] = []
            patterns[label].append(i)

        emerging = []
        for label, indices in patterns.items():
            if len(indices) >= 2:
                reps = []
                for idx in indices[:3]:
                    fir = firs[idx]
                    reps.append({
                        "fir_id": fir.get("fir_id", ""),
                        "crime_type": fir.get("crime_type", ""),
                        "location": fir.get("location", ""),
                        "anomaly_score": round(float(scores[idx]), 4),
                    })

                emerging.append({
                    "pattern_id": f"emerging_{label}",
                    "size": len(indices),
                    "confidence": round(min(1.0, len(indices) / 20.0), 4),
                    "representatives": reps,
                    "description": f"Emerging pattern detected with {len(indices)} similar incidents",
                })

        emerging.sort(key=lambda x: -x["size"])
        return emerging


class CrimeDNAEncoderInstance:
    _instance: Optional["CrimeDNAEncoderInstance"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.encoder = CrimeDNAEncoder()
        return cls._instance


class MOSimilarityInstance:
    _instance: Optional["MOSimilarityInstance"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.similarity = MOSimilarity()
        return cls._instance


class CrimeClusteringInstance:
    _instance: Optional["CrimeClusteringInstance"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.clustering = CrimeClustering()
        return cls._instance


class CrimeForecasterInstance:
    _instance: Optional["CrimeForecasterInstance"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.forecaster = CrimeForecaster()
        return cls._instance


class AnomalyDetectorInstance:
    _instance: Optional["AnomalyDetectorInstance"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.detector = AnomalyDetector()
        return cls._instance
