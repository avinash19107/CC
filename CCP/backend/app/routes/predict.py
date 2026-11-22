"""
backend/app/routes/predict.py
Inference & Metrics Endpoints:
- POST /predict: Predict single or multiple network flows with risk scoring and SHAP top features
- GET /metrics: Model comparison metrics (Random Forest vs Isolation Forest, Drift Adaptation)
"""

import os
import json
import uuid
from typing import List, Dict, Any, Union
from fastapi import APIRouter, HTTPException, Body
from backend.app.config import settings
from backend.app.database import db
from backend.app.models import PredictionResult, BatchPredictRequest
from ml.explain import ThreatExplainer

router = APIRouter(tags=["Detection & Prediction"])

METRICS_PATH = os.path.join(settings.model_pack_dir, "metrics.json")

@router.get("/metrics")
def get_metrics():
    """Returns evaluation metrics for Random Forest v1, Isolation Forest, and Drift Adaptation."""
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(status_code=500, detail="metrics.json not found in model_pack")
    with open(METRICS_PATH, "r") as f:
        metrics = json.load(f)
    return metrics

@router.post("/predict", response_model=Union[PredictionResult, List[PredictionResult]])
def predict_flows(payload: Union[Dict[str, Any], BatchPredictRequest, List[Dict[str, Any]]] = Body(...)):
    """
    Predict intrusion likelihood for one or more flows.
    Returns:
    - prediction (0 or 1), label (Benign or Malicious)
    - malicious probability & risk level (Low, Medium, High)
    - unsupervised anomaly score
    - SHAP top 3 feature contributors for Medium/High flows
    - natural language alert text
    - simulated automated response action
    """
    explainer = ThreatExplainer.get_instance()
    
    # Normalize input into a list of flow dictionaries
    if isinstance(payload, list):
        flow_list = payload
    elif isinstance(payload, BatchPredictRequest):
        flow_list = payload.flows
    elif isinstance(payload, dict) and "flows" in payload:
        flow_list = payload["flows"]
    else:
        flow_list = [payload]

    results = []
    for item in flow_list:
        flow_id = item.get("flow_id", f"flow-{uuid.uuid4().hex[:6]}")
        features_dict = item.get("features", item)
        res = explainer.predict_flow(features_dict, flow_id=flow_id)

        # Record alert if Medium or High risk
        if res["risk_level"] in ("Medium", "High"):
            alert_doc = {
                "id": str(uuid.uuid4())[:8],
                "flow_id": res["flow_id"],
                "risk_score": res["risk_score"],
                "risk_level": res["risk_level"],
                "malicious_probability": res["malicious_probability"],
                "anomaly_score": res["anomaly_score"],
                "alert_text": res["alert_text"],
                "top_features": res["top_features"],
                "simulated_action": res["simulated_action"],
                "raw_flow": {
                    "source_ip": item.get("source_ip", "192.168.1.100"),
                    "dest_port": item.get("dest_port", features_dict.get("Destination Port", 80)),
                    "protocol": item.get("protocol", "TCP")
                }
            }
            db.save_alert(alert_doc)
            
            # Record simulated automated response action
            db.save_simulated_action({
                "flow_id": res["flow_id"],
                "source_ip": item.get("source_ip", "192.168.1.100"),
                "dest_port": item.get("dest_port", features_dict.get("Destination Port", 80)),
                "risk_level": res["risk_level"],
                "action": res["simulated_action"]
            })

        results.append(PredictionResult(**res))

    if len(results) == 1 and not (isinstance(payload, list) or (isinstance(payload, dict) and "flows" in payload)):
        return results[0]
    return results

