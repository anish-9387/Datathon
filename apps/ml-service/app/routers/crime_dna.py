import logging

from fastapi import APIRouter, HTTPException

from app.models import CrimeDNAEncoderInstance
from app.schemas import (
    FIRInput,
    FIRCompareRequest,
    FIRSimilarityRequest,
    FIRSimilarityResponse,
    FIRCompareResponse,
    DNAEncodeResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()

encoder_instance = CrimeDNAEncoderInstance()


@router.post("/encode", response_model=DNAEncodeResponse)
async def encode_fir(fir: FIRInput):
    try:
        fir_dict = fir.model_dump()
        encoder = encoder_instance.encoder
        embedding = encoder.encode(fir_dict)
        fingerprint = encoder.get_fingerprint(fir_dict)

        return DNAEncodeResponse(
            fir_id=fir.fir_id,
            embedding_dim=len(embedding),
            fingerprint=fingerprint,
            status="success",
        )
    except Exception as e:
        logger.error(f"Failed to encode FIR {fir.fir_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/similarity", response_model=FIRSimilarityResponse)
async def find_similar_firs(request: FIRSimilarityRequest, firs: list[FIRInput]):
    try:
        encoder = encoder_instance.encoder

        fir_dicts = [f.model_dump() for f in firs]

        query_fir = next((f for f in fir_dicts if f["fir_id"] == request.fir_id), None)
        if query_fir is None:
            raise HTTPException(status_code=404, detail=f"FIR {request.fir_id} not found in provided list")

        encoder.build_faiss_index(fir_dicts)

        results = encoder.search_similar(query_fir, top_k=request.top_k)

        return FIRSimilarityResponse(
            query_fir_id=request.fir_id,
            results=results,
            total=len(results),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Similarity search failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare", response_model=FIRCompareResponse)
async def compare_firs(request: FIRCompareRequest, firs: list[FIRInput]):
    try:
        encoder = encoder_instance.encoder

        fir_dicts = {f.fir_id: f.model_dump() for f in firs}

        fir_1 = fir_dicts.get(request.fir_1_id)
        fir_2 = fir_dicts.get(request.fir_2_id)

        if fir_1 is None:
            raise HTTPException(status_code=404, detail=f"FIR {request.fir_1_id} not found")
        if fir_2 is None:
            raise HTTPException(status_code=404, detail=f"FIR {request.fir_2_id} not found")

        result = encoder.compare(fir_1, fir_2)

        return FIRCompareResponse(
            fir_1_id=request.fir_1_id,
            fir_2_id=request.fir_2_id,
            **result,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"FIR comparison failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
