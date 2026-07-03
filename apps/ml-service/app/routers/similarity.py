import logging

import numpy as np
from fastapi import APIRouter, HTTPException

from app.models import CrimeDNAEncoderInstance
from app.schemas import (
    FIRInput,
    SimilaritySearchRequest,
    SimilaritySearchResponse,
)
from app.utils import encode_fir_text

logger = logging.getLogger(__name__)
router = APIRouter()

encoder_instance = CrimeDNAEncoderInstance()


@router.post("/search", response_model=SimilaritySearchResponse)
async def search_similar_firs(
    request: SimilaritySearchRequest,
    firs: list[FIRInput],
):
    try:
        if not request.query_text.strip():
            raise HTTPException(status_code=400, detail="Query text cannot be empty")

        query_embedding = encode_fir_text(request.query_text)

        fir_dicts = [f.model_dump() for f in firs]

        results = []
        for fir in fir_dicts:
            fir_text = fir.get("fir_text", "")
            if not fir_text.strip():
                continue

            fir_embedding = encode_fir_text(fir_text)
            similarity = float(np.dot(query_embedding, fir_embedding))

            if request.filters:
                matches = True
                for key, value in request.filters.items():
                    fir_val = str(fir.get(key, "")).lower()
                    if value and str(value).lower() not in fir_val:
                        matches = False
                        break
                if not matches:
                    continue

            results.append({
                "fir_id": fir.get("fir_id", ""),
                "score": round(similarity, 4),
                "crime_type": fir.get("crime_type", ""),
                "location": fir.get("location", ""),
                "district": fir.get("district", ""),
                "date_time": str(fir.get("date_time", "")),
                "status": fir.get("status", ""),
                "weapon": fir.get("weapon", ""),
            })

        results.sort(key=lambda x: -x["score"])
        results = results[:request.top_k]

        return SimilaritySearchResponse(
            results=results,
            total=len(results),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Similarity search failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
