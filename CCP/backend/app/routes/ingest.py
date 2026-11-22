"""
backend/app/routes/ingest.py
Traffic ingestion endpoints:
- POST /ingest/upload: Upload CSV of flows, validate against features.json, clean and scale.
- POST /ingest/replay: Streams rows from model_pack/demo_flows.csv in batches.
"""

import os
import io
import json
import uuid
import joblib
import numpy as np
import pandas as pd
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Body

from backend.app.config import settings
from backend.app.models import IngestResponse, ReplayBatchResponse, ReplayRequest

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

# Load features and scaler
FEATURES_PATH = os.path.join(settings.model_pack_dir, "features.json")
SCALER_PATH = os.path.join(settings.model_pack_dir, "scaler.joblib")
DEMO_FLOWS_PATH = os.path.join(settings.model_pack_dir, "demo_flows.csv")

def get_feature_list():
    if not os.path.exists(FEATURES_PATH):
        raise HTTPException(status_code=500, detail="features.json not found in model_pack")
    with open(FEATURES_PATH, "r") as f:
        data = json.load(f)
    return data["features"]

def get_scaler():
    if not os.path.exists(SCALER_PATH):
        raise HTTPException(status_code=500, detail="scaler.joblib not found in model_pack")
    return joblib.load(SCALER_PATH)

@router.post("/upload", response_model=IngestResponse)
async def upload_flows(file: UploadFile = File(...)):
    """Upload CSV of network flows, validate features against features.json, clean, and scale."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
    
    # Clean column whitespace
    df.columns = [c.strip() for c in df.columns]
    features = get_feature_list()
    scaler = get_scaler()
    
    # Check if Protocol exists, else derive it
    if "Protocol" not in df.columns:
        tcp_flags = [c for c in ["FIN Flag Count", "SYN Flag Count", "RST Flag Count", 
                                "PSH Flag Count", "ACK Flag Count", "URG Flag Count"] if c in df.columns]
        init_win = "Init_Win_bytes_forward" if "Init_Win_bytes_forward" in df.columns else None
        has_tcp_flag = df[tcp_flags].sum(axis=1) > 0 if tcp_flags else False
        has_win = (df[init_win] > 0) if init_win else False
        df["Protocol"] = np.where(has_tcp_flag | has_win, 6, 17)
    
    # Validate required features
    missing_features = [f for f in features if f not in df.columns]
    if missing_features:
        raise HTTPException(
            status_code=422,
            detail=f"Uploaded CSV missing required features: {missing_features[:5]}... Total missing: {len(missing_features)}"
        )
    
    total_received = len(df)
    sub_df = df[features].copy()
    
    # Replace inf with NaN and drop nulls
    for c in features:
        sub_df[c] = pd.to_numeric(sub_df[c], errors="coerce")
    sub_df = sub_df.replace([np.inf, -np.inf], np.nan).dropna()
    valid_count = len(sub_df)
    dropped_count = total_received - valid_count
    
    if valid_count > 0:
        scaled_matrix = scaler.transform(sub_df)
    
    return IngestResponse(
        status="success",
        total_received=total_received,
        valid_count=valid_count,
        dropped_count=dropped_count,
        message=f"Successfully ingested and scaled {valid_count} flows ({dropped_count} dropped due to null/inf)."
    )

@router.post("/replay", response_model=ReplayBatchResponse)
def replay_flows(request: ReplayRequest = Body(...)):
    """Streams rows from model_pack/demo_flows.csv in batches to simulate live network traffic."""
    if not os.path.exists(DEMO_FLOWS_PATH):
        raise HTTPException(status_code=500, detail="demo_flows.csv not found in model_pack")
    
    demo_df = pd.read_csv(DEMO_FLOWS_PATH)
    total_available = len(demo_df)
    
    offset = request.offset % total_available
    batch_size = request.batch_size
    
    end = min(offset + batch_size, total_available)
    batch = demo_df.iloc[offset:end].copy()
    
    # Generate flow IDs and simulated IP addresses
    records = []
    base_time = datetime.now(timezone.utc)
    features = get_feature_list()
    
    for idx, row in batch.iterrows():
        flow_id = f"flow-{uuid.uuid4().hex[:8]}"
        label_val = int(row.get("Label", 0))
        attack_type = str(row.get("Attack_Type", "BENIGN"))
        
        # Synthetic IP assignment for realism in demonstration
        is_attack = (label_val == 1)
        src_ip = f"172.16.0.{np.random.randint(10, 99)}" if is_attack else f"192.168.1.{np.random.randint(2, 250)}"
        dst_ip = "192.168.10.50"
        
        feature_data = {f: float(row[f]) for f in features if f in row}
        
        records.append({
            "flow_id": flow_id,
            "timestamp": base_time.isoformat(),
            "source_ip": src_ip,
            "dest_ip": dst_ip,
            "dest_port": int(row.get("Destination Port", 80)),
            "protocol": "TCP" if row.get("Protocol", 6) == 6 else "UDP",
            "features": feature_data,
            "true_label": label_val,
            "true_attack_type": attack_type
        })
        
    return ReplayBatchResponse(
        total_available=total_available,
        offset=offset,
        count=len(records),
        flows=records
    )

