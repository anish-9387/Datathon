from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np

from app.core import settings
from app.utils import build_fir_fingerprint, encode_fir_text

try:
    import faiss  # type: ignore
except Exception:  # pragma: no cover - optional dependency fallback
    faiss = None


class CrimeDNAEncoder:
    def __init__(self) -> None:
        self.cache_dir = Path(settings.model_cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.index_path = self.cache_dir / settings.faiss_index_path
        self.id_map_path = self.cache_dir / settings.faiss_id_map_path
        self._index = None
        self._vectors: np.ndarray | None = None
        self._fir_ids: list[str] = []

    def _build_text(self, fir: dict[str, Any]) -> str:
        parts = [
            str(fir.get("fir_text", "")),
            str(fir.get("crime_type", "")),
            str(fir.get("location", "")),
            str(fir.get("district", "")),
            str(fir.get("section_law", "")),
            str(fir.get("weapon", "")),
            str(fir.get("accused_profile", "")),
            str(fir.get("victim_profile", "")),
            str(fir.get("escape_mode", "")),
        ]
        return " ".join(part for part in parts if part.strip())

    def encode(self, fir: dict[str, Any]) -> np.ndarray:
        text = self._build_text(fir)
        if not text.strip():
            text = fir.get("fir_id", "") or json.dumps(fir, sort_keys=True)
        embedding = encode_fir_text(text)
        return np.asarray(embedding, dtype=np.float32)

    def get_fingerprint(self, fir: dict[str, Any]) -> str:
        return build_fir_fingerprint(
            time_of_day=str(fir.get("time_of_day", "")),
            location_type=str(fir.get("location_type", "")),
            weapon=str(fir.get("weapon", "")),
            victim_profile=str(fir.get("victim_profile", "")),
            accused_profile=str(fir.get("accused_profile", "")),
            section=str(fir.get("section_law", "")),
            district=str(fir.get("district", "")),
            crime_type=str(fir.get("crime_type", "")),
        )

    def build_faiss_index(self, firs: list[dict[str, Any]]) -> None:
        vectors = []
        fir_ids = []
        for fir in firs:
            fir_id = str(fir.get("fir_id", "")).strip()
            if not fir_id:
                continue
            vectors.append(self.encode(fir))
            fir_ids.append(fir_id)

        if not vectors:
            self._vectors = None
            self._fir_ids = []
            self._index = None
            return

        matrix = np.vstack(vectors).astype(np.float32)
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        matrix = matrix / norms
        self._vectors = matrix
        self._fir_ids = fir_ids

        if faiss is not None:
            dimension = matrix.shape[1]
            index = faiss.IndexFlatIP(dimension)
            index.add(matrix)
            self._index = index
        else:
            self._index = None

        try:
            np.savez_compressed(self.index_path, vectors=matrix, fir_ids=np.array(fir_ids, dtype=object))
            self.id_map_path.write_text(json.dumps({"fir_ids": fir_ids}, indent=2), encoding="utf-8")
        except Exception:
            pass

    def _search_matrix(self, query_vector: np.ndarray, top_k: int) -> list[dict[str, Any]]:
        if self._vectors is None or not self._fir_ids:
            return []

        query_vector = np.asarray(query_vector, dtype=np.float32)
        query_norm = np.linalg.norm(query_vector)
        if query_norm == 0:
            return []
        query_vector = query_vector / query_norm

        scores = self._vectors @ query_vector
        order = np.argsort(-scores)[:top_k]
        results = []
        for index in order:
            results.append({
                "fir_id": self._fir_ids[int(index)],
                "score": round(float(scores[int(index)]), 4),
            })
        return results

    def search_similar(self, query_fir: dict[str, Any], top_k: int = 10) -> list[dict[str, Any]]:
        query_vector = self.encode(query_fir)
        if self._index is not None and faiss is not None:
            query = np.asarray(query_vector, dtype=np.float32).reshape(1, -1)
            scores, indices = self._index.search(query, top_k)
            results: list[dict[str, Any]] = []
            for score, index in zip(scores[0], indices[0], strict=False):
                if index < 0 or index >= len(self._fir_ids):
                    continue
                results.append({
                    "fir_id": self._fir_ids[int(index)],
                    "score": round(float(score), 4),
                })
            return results
        return self._search_matrix(query_vector, top_k)

    def compare(self, fir_1: dict[str, Any], fir_2: dict[str, Any]) -> dict[str, float]:
        vec_1 = self.encode(fir_1)
        vec_2 = self.encode(fir_2)

        norm_1 = float(np.linalg.norm(vec_1)) or 1.0
        norm_2 = float(np.linalg.norm(vec_2)) or 1.0
        cosine_similarity = float(np.dot(vec_1, vec_2) / (norm_1 * norm_2))

        fingerprint_1 = self.get_fingerprint(fir_1)
        fingerprint_2 = self.get_fingerprint(fir_2)
        mo_similarity = 1.0 if fingerprint_1 == fingerprint_2 else self._fingerprint_similarity(fingerprint_1, fingerprint_2)

        text_1 = self._build_text(fir_1)
        text_2 = self._build_text(fir_2)
        textual_similarity = self._token_similarity(text_1, text_2)

        overall_score = round((cosine_similarity * 0.5) + (mo_similarity * 0.25) + (textual_similarity * 0.25), 4)
        return {
            "cosine_similarity": round(cosine_similarity, 4),
            "mo_similarity": round(mo_similarity, 4),
            "textual_similarity": round(textual_similarity, 4),
            "overall_score": overall_score,
        }

    def _fingerprint_similarity(self, hash_a: str, hash_b: str) -> float:
        differences = sum(ch_a != ch_b for ch_a, ch_b in zip(hash_a, hash_b, strict=False))
        return round(max(0.0, 1.0 - differences / max(len(hash_a), 1)), 4)

    def _token_similarity(self, text_a: str, text_b: str) -> float:
        tokens_a = set(text_a.lower().split())
        tokens_b = set(text_b.lower().split())
        if not tokens_a or not tokens_b:
            return 0.0
        intersection = len(tokens_a & tokens_b)
        union = len(tokens_a | tokens_b)
        return round(intersection / union if union else 0.0, 4)


class CrimeDNAEncoderInstance:
    def __init__(self) -> None:
        self.encoder = CrimeDNAEncoder()