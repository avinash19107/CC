"""
backend/app/config.py
Configuration and environment management for the Cloud-Based IDS Analytics Platform.
"""

import os
from pydantic import BaseModel

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL_PACK_DIR = os.getenv("MODEL_PACK_DIR", os.path.join(BASE_DIR, "model_pack"))
DATA_DIR = os.getenv("DATA_DIR", os.path.join(BASE_DIR, "data"))
DB_PATH = os.getenv("SQLITE_DB_PATH", os.path.join(BASE_DIR, "ids_analytics.db"))

class Settings(BaseModel):
    app_name: str = "Cloud-Based Intelligent Network Traffic Monitoring and IDS"
    app_version: str = "1.0.0"
    debug: bool = os.getenv("DEBUG", "False").lower() in ("true", "1")
    database_mode: str = os.getenv("DATABASE_MODE", "sqlite") # "sqlite" or "firestore"
    firestore_collection_prefix: str = os.getenv("FIRESTORE_PREFIX", "ids_")
    model_pack_dir: str = MODEL_PACK_DIR
    data_dir: str = DATA_DIR
    sqlite_db_path: str = DB_PATH
    active_model: str = "rf_v1" # "rf_v1" or "rf_v2"
    gcp_project_id: str = os.getenv("GCP_PROJECT", "")
    gcp_region: str = os.getenv("GCP_REGION", "us-central1")
    cloud_run_revision: str = os.getenv("K_REVISION", "local-dev")

settings = Settings()

