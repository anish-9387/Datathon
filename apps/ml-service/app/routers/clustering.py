import logging

from fastapi import APIRouter, HTTPException

from app.models import CrimeClusteringInstance
from app.schemas import (
    FIRInput,
    ClusterRequest,
    ClusterResponse,
    ClustersSummaryResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()

clustering_instance = CrimeClusteringInstance()


@router.post("/mo-discover")
async def run_mo_clustering(request: ClusterRequest, firs: list[FIRInput]):
    try:
        fir_dicts = [f.model_dump() for f in firs]

        if not fir_dicts:
            raise HTTPException(status_code=400, detail="No FIRs provided for clustering")

        clustering = clustering_instance.clustering
        results = clustering.fit(
            fir_dicts,
            algorithm=request.algorithm,
            eps=request.eps,
            min_samples=request.min_samples,
        )

        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clustering failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters", response_model=ClustersSummaryResponse)
async def get_clusters_summary():
    try:
        clustering = clustering_instance.clustering
        clusters = clustering.get_clusters_summary()

        cluster_responses = []
        for c in clusters:
            cluster_responses.append(ClusterResponse(
                cluster_id=c.get("cluster_id", -1),
                fir_ids=c.get("fir_ids", []),
                size=c.get("size", 0),
                confidence=c.get("confidence", 0.0),
                representative_mo=c.get("representative_mo", ""),
            ))

        return ClustersSummaryResponse(
            total_clusters=len(cluster_responses),
            noise_points=clustering.cluster_results.get("noise_count", 0),
            clusters=cluster_responses,
        )
    except Exception as e:
        logger.error(f"Failed to get clusters summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cluster/{cluster_id}")
async def get_cluster_firs(cluster_id: int):
    try:
        clustering = clustering_instance.clustering
        cluster = clustering.get_cluster(cluster_id)

        if not cluster or not cluster.get("fir_ids"):
            raise HTTPException(status_code=404, detail=f"Cluster {cluster_id} not found or empty")

        return cluster
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get cluster {cluster_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
