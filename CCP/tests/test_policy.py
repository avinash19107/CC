"""
tests/test_policy.py
Unit tests for the automated simulated defense policy and safety guarantees.
"""

import os
import sys
import json
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.config import settings

def test_response_policy_structure():
    policy_path = os.path.join(settings.model_pack_dir, "response_policy.json")
    assert os.path.exists(policy_path)
    with open(policy_path, "r") as f:
        data = json.load(f)
    
    assert data["execution_mode"] == "SIMULATED"
    assert "High" in data["rules"]
    assert "Medium" in data["rules"]
    assert "Low" in data["rules"]
    assert data["rules"]["High"]["action"] == "Block IP"
    assert data["rules"]["Medium"]["action"] == "Rate-limit"
    assert data["rules"]["Low"]["action"] == "Log only"

