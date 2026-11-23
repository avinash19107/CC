"""
backend/app/main.py
FastAPI Application Entrypoint for the Cloud-Based IDS Analytics Platform.
"""

import re
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.routes import ingest, predict, alerts, drift, stats

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Intelligent Network Traffic Monitoring and Intrusion Detection System using Big Data Analytics, ML, SHAP, and Concept Drift Monitoring."
)

# Normalize duplicate slashes in incoming request paths (e.g., //stats -> /stats)
@app.middleware("http")
async def clean_path_middleware(request: Request, call_next):
    if "//" in request.scope.get("path", ""):
        request.scope["path"] = re.sub(r"/+", "/", request.scope["path"])
    response = await call_next(request)
    return response

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
