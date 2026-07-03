import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core import settings
from app.schemas import HealthResponse

logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Machine Learning microservice for Crime Intelligence Platform (Karnataka Police)",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 4))
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "path": str(request.url)},
    )


@app.get("/api/v1/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    return HealthResponse(
        status="healthy",
        version=settings.version,
        service="crime-intelligence-ml-service",
    )


from app.routers import crime_dna, clustering, forecasting, anomaly, graph, assistant, similarity

app.include_router(crime_dna.router, prefix="/api/v1/crime-dna", tags=["Crime DNA"])
app.include_router(clustering.router, prefix="/api/v1/clustering", tags=["Clustering"])
app.include_router(forecasting.router, prefix="/api/v1/forecasting", tags=["Forecasting"])
app.include_router(anomaly.router, prefix="/api/v1/anomaly", tags=["Anomaly Detection"])
app.include_router(graph.router, prefix="/api/v1/graph", tags=["Criminal Network Graph"])
app.include_router(assistant.router, prefix="/api/v1/assistant", tags=["NLP Assistant"])
app.include_router(similarity.router, prefix="/api/v1/similarity", tags=["Similarity Search"])


@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting {settings.app_name} v{settings.version}")
    logger.info(f"Embedding model: {settings.embedding_model}")
    logger.info(f"CORS origins: {settings.cors_origins}")
