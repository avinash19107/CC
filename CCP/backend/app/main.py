"""
backend/app/main.py
FastAPI Application Entrypoint for the Cloud-Based IDS Analytics Platform.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.routes import ingest, predict, alerts, drift, stats

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Intelligent Network Traffic Monitoring and Intrusion Detection System using Big Data Analytics, ML, SHAP, and Concept Drift Monitoring."
)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All Sub-Routers
app.include_router(ingest.router)
app.include_router(predict.router)
app.include_router(alerts.router)
app.include_router(drift.router)
app.include_router(stats.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "database_mode": settings.database_mode,
        "active_model": settings.active_model
    }

@app.get("/")
def root():
    return {
        "message": f"{settings.app_name} API is operational.",
        "docs_url": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
