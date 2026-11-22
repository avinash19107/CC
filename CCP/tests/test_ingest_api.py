"""
tests/test_ingest_api.py
API tests for FastAPI endpoints: /health, /ingest/replay, /ingest/upload.
"""

import os
import sys
import io
import pandas as pd
import pytest
from fastapi.testclient import TestClient

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_ingest_replay():
    payload = {"batch_size": 5, "offset": 0}
    response = client.post("/ingest/replay", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 5
    assert len(data["flows"]) == 5
    first = data["flows"][0]
    assert "flow_id" in first
    assert "features" in first
    assert len(first["features"]) == 25

def test_ingest_upload():
    # Create sample CSV matching features
    demo_path = os.path.join(os.path.dirname(__file__), "..", "model_pack", "demo_flows.csv")
    sample_df = pd.read_csv(demo_path, nrows=5)
    csv_bytes = io.BytesIO()
    sample_df.to_csv(csv_bytes, index=False)
    csv_bytes.seek(0)
    
    response = client.post(
        "/ingest/upload",
        files={"file": ("test_flows.csv", csv_bytes, "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["valid_count"] == 5
    assert data["total_received"] == 5

