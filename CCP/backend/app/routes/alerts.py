"""
backend/app/routes/alerts.py
Explainable AI & Alert Management Endpoints:
- GET /alerts: List alerts with pagination and risk_level filtering
- GET /alerts/{id}: Full SHAP explanation breakdown for a specific alert
- GET /explain/global: Global feature importance from SHAP TreeExplainer
"""

import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Path
from backend.app.database import db
from ml.explain import ThreatExplainer

router = APIRouter(tags=["Explainability & Threat Analysis"])

@router.get("/alerts")
def list_alerts(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    risk_level: Optional[str] = Query(default="All")
):
    """Retrieve historical security alerts with filtering and pagination."""
    alerts = db.get_alerts(limit=limit, offset=offset, risk_level=risk_level)
    return {
        "count": len(alerts),
        "limit": limit,
        "offset": offset,
        "risk_level_filter": risk_level,
        "alerts": alerts
    }

@router.get("/alerts/{alert_id}")
def get_alert_detail(alert_id: str = Path(...)):
    """Retrieve full SHAP waterfall and raw metadata for a specific alert."""
    alert = db.get_alert_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert with id {alert_id} not found.")
    return alert

@router.get("/explain/global")
def get_global_explanation():
    """Returns global feature importance computed across background samples via SHAP."""
    explainer = ThreatExplainer.get_instance()
    global_importance = explainer.generate_global_importance(sample_size=100)
    return {
        "status": "success",
        "model": explainer.active_model_name,
        "total_features": len(global_importance),
        "ranking": global_importance
    }

