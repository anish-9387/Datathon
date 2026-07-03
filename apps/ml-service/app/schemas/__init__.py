from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FIRInput(BaseModel):
    fir_id: str
    district: str = ""
    police_station: str = ""
    section_law: str = ""
    date_time: Optional[datetime] = None
    crime_type: str = ""
    location: str = ""
    location_type: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    weapon: str = ""
    accused_name: str = ""
    accused_profile: str = ""
    victim_name: str = ""
    victim_profile: str = ""
    escape_mode: str = ""
    fir_text: str = ""
    status: str = ""


class FIRCompareRequest(BaseModel):
    fir_1_id: str
    fir_2_id: str


class FIRSimilarityRequest(BaseModel):
    fir_id: str
    top_k: int = Field(default=10, ge=1, le=100)


class FIRSimilarityResponse(BaseModel):
    query_fir_id: str
    results: list[dict]
    total: int


class FIRCompareResponse(BaseModel):
    fir_1_id: str
    fir_2_id: str
    cosine_similarity: float
    mo_similarity: float
    textual_similarity: float
    overall_score: float


class DNAEncodeResponse(BaseModel):
    fir_id: str
    embedding_dim: int
    fingerprint: str
    status: str = "success"


class ClusterRequest(BaseModel):
    fir_ids: list[str]
    algorithm: str = Field(default="dbscan", pattern="^(dbscan|hdbscan)$")
    eps: float = 0.5
    min_samples: int = 3


class ClusterResponse(BaseModel):
    cluster_id: int
    fir_ids: list[str]
    size: int
    confidence: float
    representative_mo: str


class ClustersSummaryResponse(BaseModel):
    total_clusters: int
    noise_points: int
    clusters: list[ClusterResponse]


class PredictRequest(BaseModel):
    hour: Optional[int] = Field(default=None, ge=0, le=23)
    day: Optional[int] = Field(default=None, ge=1, le=31)
    month: Optional[int] = Field(default=None, ge=1, le=12)
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6)
    district: str = ""
    crime_type: str = ""
    is_weekend: Optional[bool] = None
    is_festival: Optional[bool] = None
    is_salary_day: Optional[bool] = None
    population_density: Optional[float] = None
    historical_crime_count: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PredictResponse(BaseModel):
    probability: float
    prediction: str
    confidence: float
    shap_explanation: dict
    top_factors: list[dict]


class HotspotRequest(BaseModel):
    district: str = ""
    crime_type: str = ""
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    grid_size: int = Field(default=50, ge=10, le=200)


class HotspotResponse(BaseModel):
    hotspots: list[dict]
    total_hotspots: int
    model_info: dict


class AnomalyDetectRequest(BaseModel):
    fir_ids: list[str]
    contamination: float = Field(default=0.1, ge=0.01, le=0.5)


class AnomalyResult(BaseModel):
    fir_id: str
    anomaly_score: float
    is_anomaly: bool
    explanation: str


class AnomalyDetectResponse(BaseModel):
    results: list[AnomalyResult]
    total_flagged: int


class CriminalNetworkRequest(BaseModel):
    fir_ids: list[str]


class NetworkNode(BaseModel):
    id: str
    label: str
    type: str
    weight: float = 0.0


class NetworkEdge(BaseModel):
    source: str
    target: str
    weight: float
    relationship: str


class CriminalNetworkResponse(BaseModel):
    nodes: list[NetworkNode]
    edges: list[NetworkEdge]
    stats: dict


class GangDetectionResponse(BaseModel):
    communities: list[dict]
    total_gangs: int
    modularity_score: float


class InfluenceResponse(BaseModel):
    scores: list[dict]
    top_influencers: list[dict]


class AssistantQueryRequest(BaseModel):
    query: str


class AssistantSqlResponse(BaseModel):
    sql: str
    explanation: str
    results_placeholder: list[dict] = []


class AssistantSummaryResponse(BaseModel):
    summary: str
    keywords: list[str]
    key_phrases: list[str]


class ExplainRequest(BaseModel):
    fir_id: str
    features: dict


class ExplainResponse(BaseModel):
    shap_values: dict
    base_value: float
    top_contributors: list[dict]


class SimilaritySearchRequest(BaseModel):
    query_text: str
    top_k: int = Field(default=10, ge=1, le=100)
    filters: Optional[dict] = None


class SimilaritySearchResponse(BaseModel):
    results: list[dict]
    total: int


class ModelInfo(BaseModel):
    name: str
    algorithm: str
    trained: bool
    features: list[str]
    metrics: Optional[dict] = None


class ModelsResponse(BaseModel):
    models: list[ModelInfo]


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    service: str = "crime-intelligence-ml-service"
