"""
backend/app/routes/drift.py
Concept Drift & Model Adaptation Endpoints:
- POST /drift/check: KS test & PSI analysis per feature between baseline and active traffic
- POST /model/switch: Toggles active model between rf_v1 and rf_v2 with version logging
- GET /drift/events: Retrieves historical drift check logs
- GET /model/versions: Retrieves registered model versions
"""

import os
import json
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from backend.app.config import settings
from backend.app.database import db
from ml.drift import DriftDetector
from ml.explain import ThreatExplainer

router = APIRouter(tags=["Concept Drift & Adaptation"])

@router.post("/drift/check")
def run_drift_check(payload: Optional[Dict[str, Any]] = Body(default=None)):
    """Runs statistical KS test and PSI against the drift window and stores the event."""
    detector = DriftDetector()
    results = detector.check_drift()

    # Record event in database
    db.save_drift_event({
        "baseline_window": "Monday-Tuesday (Benign Traffic)",
        "current_window": "Wednesday-Friday (Multi-Attack Traffic)",
        "drifted_feature_count": results["drifted_features_count"],
        "drift_percentage": results["drift_percentage"],
        "drift_detected": results["drift_detected"],
        "accuracy_drop": results["accuracy_drop_pct"],
        "details": results
    })

    return results

@router.post("/model/switch")
def switch_model(payload: Dict[str, Any] = Body(...)):
    """Toggles active model between rf_v1 and rf_v2 and logs version change."""
    target_model = payload.get("target_model")
    if target_model not in ("rf_v1", "rf_v2"):
        raise HTTPException(status_code=400, detail="Invalid target_model. Must be 'rf_v1' or 'rf_v2'.")

    explainer = ThreatExplainer.get_instance()
    active_name = explainer.set_active_model(target_model)
    settings.active_model = active_name

    # Load metrics for logging
    metrics_path = os.path.join(settings.model_pack_dir, "metrics.json")
    metrics_data = {}
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics_data = json.load(f)

    db.save_model_version({
        "version_name": active_name,
        "is_active": True,
        "metrics": metrics_data.get("drift_adaptation", {}).get(f"{active_name}_on_drift", {}),
        "note": f"Switched to {active_name} via Adaptation Controller."
    })

    return {
        "status": "success",
        "active_model": active_name,
        "message": f"Active detection model successfully switched to {active_name}."
    }

@router.get("/drift/events")
def get_drift_events():
    """Retrieve logged drift detection history."""
    return db.get_drift_events(limit=20)

@router.get("/model/versions")
def get_model_versions():
    """Retrieve all model versions and active status."""
    versions = db.get_model_versions()
    if not versions:
        # Default initialization entries
        return [
            {"version_name": "rf_v1", "is_active": (settings.active_model == "rf_v1"), "note": "Baseline Random Forest Model"},
            {"version_name": "rf_v2", "is_active": (settings.active_model == "rf_v2"), "note": "Adapted Random Forest Model"}
        ]
    return versions

