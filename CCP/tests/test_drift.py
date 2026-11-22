"""
tests/test_drift.py
Unit tests for KS-test, Population Stability Index (PSI), and drift threshold triggers.
"""

import os
import sys
import numpy as np
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.drift import calculate_psi, DriftDetector

def test_psi_identical_distributions():
    np.random.seed(42)
    dist_a = np.random.normal(loc=10.0, scale=2.0, size=1000)
    dist_b = dist_a.copy()
    psi = calculate_psi(dist_a, dist_b)
    assert psi < 0.05, f"PSI for identical data should be near 0, got {psi}"

def test_psi_drifted_distributions():
    np.random.seed(42)
    base = np.random.normal(loc=10.0, scale=2.0, size=1000)
    shifted = np.random.normal(loc=25.0, scale=5.0, size=1000)
    psi = calculate_psi(base, shifted)
    assert psi > 0.20, f"PSI for heavily shifted distribution should exceed 0.2, got {psi}"

def test_drift_detector_execution():
    detector = DriftDetector()
    results = detector.check_drift()
    assert "drift_detected" in results
    assert "drift_percentage" in results
    assert "features" in results
    assert len(results["features"]) == 25
    assert results["drift_status"] in ("NORMAL", "CRITICAL DRIFT")

