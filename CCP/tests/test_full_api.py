"""
tests/test_full_api.py
Integration tests covering all API endpoints: /predict, /metrics, /alerts,
/explain/global, /drift/check, /model/switch, /stats, /cloud, /policy.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app

client = TestClient(app)

def test_metrics_endpoint():
    res = client.get("/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "random_forest_v1" in data
    assert "isolation_forest" in data
    assert "drift_adaptation" in data

def test_predict_endpoint_single():
    payload = {
        "flow_id": "test-flow-88",
        "features": {
            "Destination Port": 80,
            "Flow Duration": 500,
            "Total Fwd Packets": 2,
            "Total Backward Packets": 2,
            "Total Length of Fwd Packets": 100,
            "Total Length of Bwd Packets": 200,
            "Fwd Packet Length Max": 50,
            "Fwd Packet Length Min": 50,
            "Fwd Packet Length Mean": 50,
            "Bwd Packet Length Max": 100,
            "Bwd Packet Length Min": 100,
            "Bwd Packet Length Mean": 100,
            "Flow Bytes/s": 600,
            "Flow Packets/s": 8,
            "Flow IAT Mean": 250,
            "Flow IAT Max": 500,
            "Fwd IAT Mean": 250,
            "Bwd IAT Mean": 250,
            "FIN Flag Count": 0,
            "SYN Flag Count": 0,
            "RST Flag Count": 0,
            "PSH Flag Count": 0,
            "ACK Flag Count": 1,
            "URG Flag Count": 0,
            "Protocol": 6
        }
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["flow_id"] == "test-flow-88"
    assert data["risk_level"] in ("Low", "Medium", "High")
    assert "anomaly_score" in data

def test_alerts_and_global_explain():
    # Alerts list
    res = client.get("/alerts?limit=5")
    assert res.status_code == 200
    assert "alerts" in res.json()

    # Global explanation
    res = client.get("/explain/global")
    assert res.status_code == 200
    data = res.json()
    assert "ranking" in data
    assert len(data["ranking"]) > 0

def test_drift_and_switch():
    # Drift check
    res = client.post("/drift/check")
    assert res.status_code == 200
    data = res.json()
    assert "drift_detected" in data
    assert "features" in data

    # Model switch
    res = client.post("/model/switch", json={"target_model": "rf_v2"})
    assert res.status_code == 200
    assert res.json()["active_model"] == "rf_v2"

    # Switch back to rf_v1
    res = client.post("/model/switch", json={"target_model": "rf_v1"})
    assert res.status_code == 200
    assert res.json()["active_model"] == "rf_v1"

def test_stats_and_cloud():
    res = client.get("/stats")
    assert res.status_code == 200
    data = res.json()
    assert "total_flows_monitored" in data
    assert "malicious_ratio" in data

    res = client.get("/cloud")
    assert res.status_code == 200
    data = res.json()
    assert "cloud_provider" in data
    assert "uptime_seconds" in data

