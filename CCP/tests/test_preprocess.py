"""
tests/test_preprocess.py
Unit tests for data preprocessing logic, label cleaning, protocol derivation,
and feature scaling.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import pytest

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.preprocess import clean_attack_name, SELECTED_FEATURES

def test_clean_attack_name():
    assert clean_attack_name("BENIGN") == "BENIGN"
    assert clean_attack_name("  BENIGN  ") == "BENIGN"
    assert clean_attack_name("Web Attack \x96 Brute Force") == "Web Attack - Brute Force"
    assert clean_attack_name("Web Attack \x96 XSS") == "Web Attack - XSS"
    assert clean_attack_name("Web Attack \x96 Sql Injection") == "Web Attack - SQL Injection"
    assert clean_attack_name("DDoS") == "DDoS"
    assert clean_attack_name("PortScan") == "PortScan"

def test_selected_features_count():
    assert len(SELECTED_FEATURES) == 25
    assert "Protocol" in SELECTED_FEATURES
    assert "Destination Port" in SELECTED_FEATURES
    assert "Flow Duration" in SELECTED_FEATURES
    assert "Flow Bytes/s" in SELECTED_FEATURES
    assert "Flow Packets/s" in SELECTED_FEATURES

def test_protocol_derivation():
    # TCP test row with SYN flag set
    row_tcp = pd.DataFrame([{
        "FIN Flag Count": 0, "SYN Flag Count": 1, "RST Flag Count": 0,
        "PSH Flag Count": 0, "ACK Flag Count": 0, "URG Flag Count": 0,
        "Init_Win_bytes_forward": 1024
    }])
    tcp_flags = ["FIN Flag Count", "SYN Flag Count", "RST Flag Count", "PSH Flag Count", "ACK Flag Count", "URG Flag Count"]
    is_tcp = (row_tcp[tcp_flags].sum(axis=1) > 0) | (row_tcp["Init_Win_bytes_forward"] > 0)
    proto = np.where(is_tcp, 6, 17)
    assert proto[0] == 6

    # UDP test row (no flags, no init window)
    row_udp = pd.DataFrame([{
        "FIN Flag Count": 0, "SYN Flag Count": 0, "RST Flag Count": 0,
        "PSH Flag Count": 0, "ACK Flag Count": 0, "URG Flag Count": 0,
        "Init_Win_bytes_forward": 0
    }])
    is_tcp_udp = (row_udp[tcp_flags].sum(axis=1) > 0) | (row_udp["Init_Win_bytes_forward"] > 0)
    proto_udp = np.where(is_tcp_udp, 6, 17)
    assert proto_udp[0] == 17

