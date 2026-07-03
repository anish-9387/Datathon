import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Settings:
    app_name: str = "Crime Intelligence ML Service"
    version: str = "1.0.0"
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    model_cache_dir: str = os.getenv("MODEL_CACHE_DIR", "model_cache")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    faiss_index_path: str = os.getenv("FAISS_INDEX_PATH", "faiss_index.bin")
    faiss_id_map_path: str = os.getenv("FAISS_ID_MAP_PATH", "faiss_id_map.json")

    db_host: str = os.getenv("DB_HOST", "localhost")
    db_port: int = int(os.getenv("DB_PORT", "5432"))
    db_name: str = os.getenv("DB_NAME", "crime_intelligence")
    db_user: str = os.getenv("DB_USER", "postgres")
    db_password: str = os.getenv("DB_PASSWORD", "postgres")
    db_url: Optional[str] = os.getenv("DATABASE_URL")

    cors_origins: list[str] = field(
        default_factory=lambda: os.getenv("CORS_ORIGINS", "*").split(",")
    )
    max_embedding_cache: int = int(os.getenv("MAX_EMBEDDING_CACHE", "100000"))


settings = Settings()


KARNATAKA_DISTRICTS: list[str] = [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
    "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga",
    "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan",
    "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal",
    "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga",
    "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura",
    "Yadgir", "Unknown",
]

CRIME_TYPES: list[str] = [
    "Robbery", "Burglary", "Theft", "Assault", "Homicide",
    "Kidnapping", "Cyber Crime", "Fraud", "Drug Offense", "Sexual Offense",
    "Vehicle Theft", "Arson", "Extortion", "Riots", "Unknown",
]

WEEKDAYS: list[str] = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
]

FESTIVAL_DATES_2025_2026: set[tuple[int, int]] = {
    (1, 26), (3, 14), (3, 31), (4, 14), (4, 18),
    (5, 1), (6, 7), (8, 15), (8, 27), (9, 7),
    (10, 2), (11, 1), (11, 13), (12, 25),
    (1, 15), (1, 26), (3, 3), (4, 2),
}

SALARY_DAYS: set[int] = {1, 28, 29, 30, 31}

KARNATAKA_COORDS: dict[str, dict[str, float]] = {
    "Bengaluru Urban": {"lat": 12.9716, "lng": 77.5946},
    "Bengaluru Rural": {"lat": 13.0831, "lng": 77.4858},
    "Mysuru": {"lat": 12.2958, "lng": 76.6394},
    "Belagavi": {"lat": 15.8497, "lng": 74.4977},
    "Dakshina Kannada": {"lat": 12.8740, "lng": 74.8479},
    "Udupi": {"lat": 13.3409, "lng": 74.7421},
}

DISTRICT_TO_CODE: dict[str, int] = {
    d: i for i, d in enumerate(KARNATAKA_DISTRICTS)
}

CRIME_TYPE_TO_CODE: dict[str, int] = {
    c: i for i, c in enumerate(CRIME_TYPES)
}