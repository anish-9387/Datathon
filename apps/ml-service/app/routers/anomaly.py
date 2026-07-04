import logging

from fastapi import APIRouter, HTTPException

from app.models import AnomalyDetectorInstance
from app.schemas import (
    FIRInput,
    AnomalyDetectRequest,
    AnomalyDetectResponse,
    AnomalyResult,
)

logger = logging.getLogger(__name__)
router = APIRouter()

anomaly_instance = AnomalyDetectorInstance()


@router.post("/detect", response_model=AnomalyDetectResponse)
async def detect_anomalies(request: AnomalyDetectRequest, firs: list[FIRInput]):
    try:
        fir_dicts = [f.model_dump() for f in firs]

        if not fir_dicts:
            raise HTTPException(status_code=400, detail="No FIRs provided for anomaly detection")

        detector = anomaly_instance.detector
        results = detector.detect(fir_dicts, contamination=request.contamination)

        total_flagged = sum(1 for r in results if r["is_anomaly"])

        result_models = []
        for r in results:
            result_models.append(AnomalyResult(
                fir_id=r["fir_id"],
                anomaly_score=r["anomaly_score"],
                is_anomaly=r["is_anomaly"],
                explanation=r["explanation"],
            ))

        return AnomalyDetectResponse(
            results=result_models,
            total_flagged=total_flagged,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Anomaly detection failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emerging")
async def get_emerging_patterns(firs: list[FIRInput]):
    try:
        fir_dicts = [f.model_dump() for f in firs]

        if not fir_dicts:
            return {"patterns": [], "total": 0}

        detector = anomaly_instance.detector
        patterns = detector.detect_emerging_patterns(fir_dicts)

        return {
            "patterns": patterns,
            "total": len(patterns),
        }
    except Exception as e:
        logger.error(f"Failed to detect emerging patterns: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
