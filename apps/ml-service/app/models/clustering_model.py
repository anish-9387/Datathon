from __future__ import annotations

from collections import defaultdict
from typing import Any

import numpy as np

from app.utils import create_mo_feature_vector, extract_location_features, extract_mo_fingerprint


class CrimeClustering:
    def __init__(self) -> None:
        self.cluster_results: dict[str, Any] = {"clusters": [], "noise_count": 0}

    def _vectorize(self, fir: dict[str, Any]) -> np.ndarray:
        mo = extract_mo_fingerprint(fir)
        location = extract_location_features(fir)
        base = create_mo_feature_vector(
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
        extra = np.array([
            float(location.get("latitude", 0.0)),
            float(location.get("longitude", 0.0)),
        ], dtype=np.float32)
        return np.concatenate([base, extra]).astype(np.float32)

    def fit(
        self,
        fir_dicts: list[dict[str, Any]],
        algorithm: str = "dbscan",
        eps: float = 0.5,
        min_samples: int = 3,
    ) -> dict[str, Any]:
        if not fir_dicts:
            self.cluster_results = {"clusters": [], "noise_count": 0}
            return self.cluster_results

        clusters: dict[int, list[dict[str, Any]]] = defaultdict(list)
        fingerprint_to_cluster: dict[str, int] = {}
        noise_count = 0

        for fir in fir_dicts:
            fingerprint = self._cluster_fingerprint(fir)
            if fingerprint not in fingerprint_to_cluster:
                fingerprint_to_cluster[fingerprint] = len(fingerprint_to_cluster)
            cluster_id = fingerprint_to_cluster[fingerprint]
            clusters[cluster_id].append(fir)

        if algorithm.lower() == "hdbscan":
            clusters = self._merge_small_clusters(clusters, min_samples)
            noise_count = sum(1 for members in clusters.values() if len(members) < min_samples)

        cluster_payload: list[dict[str, Any]] = []
        for cluster_id, members in clusters.items():
            if not members:
                continue
            representative = members[0]
            cluster_payload.append({
                "cluster_id": cluster_id,
                "fir_ids": [str(item.get("fir_id", "")) for item in members if item.get("fir_id")],
                "size": len(members),
                "confidence": round(min(0.95, 0.5 + len(members) / max(len(fir_dicts), 1) / 2), 4),
                "representative_mo": str(representative.get("crime_type", "Unknown")),
            })

        cluster_payload.sort(key=lambda item: (-item["size"], item["cluster_id"]))
        self.cluster_results = {
            "clusters": cluster_payload,
            "noise_count": noise_count,
            "algorithm": algorithm,
        }
        return self.cluster_results

    def _cluster_fingerprint(self, fir: dict[str, Any]) -> str:
        mo = extract_mo_fingerprint(fir)
        return "|".join(
            [
                str(mo.get("district", "Unknown") or "Unknown").lower(),
                str(mo.get("crime_type", "Unknown") or "Unknown").lower(),
                str(mo.get("weapon", "Unknown") or "Unknown").lower(),
                str(mo.get("escape_mode", "Unknown") or "Unknown").lower(),
                str(mo.get("location_type", "Unknown") or "Unknown").lower(),
            ]
        )

    def _merge_small_clusters(
        self,
        clusters: dict[int, list[dict[str, Any]]],
        min_samples: int,
    ) -> dict[int, list[dict[str, Any]]]:
        merged: dict[int, list[dict[str, Any]]] = defaultdict(list)
        large_cluster_id = 0
        noise_bucket: list[dict[str, Any]] = []

        for _, members in clusters.items():
            if len(members) >= min_samples:
                merged[large_cluster_id].extend(members)
                large_cluster_id += 1
            else:
                noise_bucket.extend(members)

        if noise_bucket:
            merged[-1].extend(noise_bucket)
        return merged

    def get_clusters_summary(self) -> list[dict[str, Any]]:
        return list(self.cluster_results.get("clusters", []))

    def get_cluster(self, cluster_id: int) -> dict[str, Any] | None:
        for cluster in self.cluster_results.get("clusters", []):
            if int(cluster.get("cluster_id", -1)) == cluster_id:
                return cluster
        return None


class CrimeClusteringInstance:
    def __init__(self) -> None:
        self.clustering = CrimeClustering()