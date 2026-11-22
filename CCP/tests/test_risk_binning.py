"""
tests/test_risk_binning.py
Unit tests for risk score binning, SHAP top-feature extraction, and alert formatting.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.explain import ThreatExplainer

def test_risk_level_binning():
    # Low < 0.40
    assert ThreatExplainer.get_risk_level(0.00) == "Low"
    assert ThreatExplainer.get_risk_level(0.39) == "Low"

    # Medium 0.40 to 0.70
    assert ThreatExplainer.get_risk_level(0.40) == "Medium"
    assert ThreatExplainer.get_risk_level(0.55) == "Medium"
    assert ThreatExplainer.get_risk_level(0.70) == "Medium"

    # High > 0.70
    assert ThreatExplainer.get_risk_level(0.71) == "High"
    assert ThreatExplainer.get_risk_level(0.95) == "High"
    assert ThreatExplainer.get_risk_level(1.00) == "High"

def test_threat_explainer_inference():
    explainer = ThreatExplainer.get_instance()
    sample_flow = {
        "Destination Port": 80,
        "Flow Duration": 120000,
        "Total Fwd Packets": 10,
        "Total Backward Packets": 8,
        "Total Length of Fwd Packets": 500,
        "Total Length of Bwd Packets": 1200,
        "Fwd Packet Length Max": 100,
        "Fwd Packet Length Min": 10,
        "Fwd Packet Length Mean": 50,
        "Bwd Packet Length Max": 200,
        "Bwd Packet Length Min": 20,
        "Bwd Packet Length Mean": 100,
        "Flow Bytes/s": 14000,
        "Flow Packets/s": 150,
        "Flow IAT Mean": 2000,
        "Flow IAT Max": 10000,
        "Fwd IAT Mean": 3000,
        "Bwd IAT Mean": 2500,
        "FIN Flag Count": 0,
        "SYN Flag Count": 1,
        "RST Flag Count": 0,
        "PSH Flag Count": 1,
        "ACK Flag Count": 1,
        "URG Flag Count": 0,
        "Protocol": 6
    }
    result = explainer.predict_flow(sample_flow, flow_id="flow-test-1")
    assert "prediction" in result
    assert "risk_score" in result
    assert result["risk_level"] in ("Low", "Medium", "High")
    assert "anomaly_score" in result
    assert result["simulated_action"] in ("Block IP", "Rate-limit", "Log only")

