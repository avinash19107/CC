"""
ml/preprocess.py
Preprocesses CIC-IDS2017 network traffic dataset:
- Merges raw CSV files
- Cleans whitespace, drops duplicates, inf, and nulls
- Encodes labels: Benign=0, Malicious=1 (retaining original Attack_Type and Day)
- Derives Protocol (TCP=6 / UDP=17) and selects 25 numeric features
- Produces a stratified sample of ~300,000 rows
- Holds out 500 flows for live simulation (demo_flows.csv: 70% benign, 30% mixed attacks)
- Fits and exports StandardScaler, features.json, preprocess_report.json, and flows_clean.parquet
"""

import os
import glob
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# Base directories
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw")
CLEAN_DATA_DIR = os.path.join(BASE_DIR, "data", "clean")
MODEL_PACK_DIR = os.path.join(BASE_DIR, "model_pack")

os.makedirs(CLEAN_DATA_DIR, exist_ok=True)
os.makedirs(MODEL_PACK_DIR, exist_ok=True)

# 25 Selected Informative Numeric Features
SELECTED_FEATURES = [
    "Destination Port",
    "Flow Duration",
    "Total Fwd Packets",
    "Total Backward Packets",
    "Total Length of Fwd Packets",
    "Total Length of Bwd Packets",
    "Fwd Packet Length Max",
    "Fwd Packet Length Min",
    "Fwd Packet Length Mean",
    "Bwd Packet Length Max",
    "Bwd Packet Length Min",
    "Bwd Packet Length Mean",
    "Flow Bytes/s",
    "Flow Packets/s",
    "Flow IAT Mean",
    "Flow IAT Max",
    "Fwd IAT Mean",
    "Bwd IAT Mean",
    "FIN Flag Count",
    "SYN Flag Count",
    "RST Flag Count",
    "PSH Flag Count",
    "ACK Flag Count",
    "URG Flag Count",
    "Protocol",
]

def clean_attack_name(label_str: str) -> str:
    """Normalize attack labels by removing non-ASCII artifacts."""
    if not isinstance(label_str, str):
        return "BENIGN"
    cleaned = label_str.strip().encode("ascii", "ignore").decode("ascii").strip()
    if "BENIGN" in cleaned.upper():
        return "BENIGN"
    if "Brute Force" in cleaned:
        return "Web Attack - Brute Force"
    if "XSS" in cleaned:
        return "Web Attack - XSS"
    if "Sql" in cleaned:
        return "Web Attack - SQL Injection"
    return cleaned

def extract_day(filename: str) -> str:
    """Extract day of week from CIC-IDS2017 filename."""
    fname = os.path.basename(filename)
    for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]:
        if day.lower() in fname.lower():
            return day
    return "Unknown"

def process_file(filepath: str):
    """Load and perform initial cleaning on a single CSV file."""
    print(f"Loading {os.path.basename(filepath)}...")
    df = pd.read_csv(filepath, low_memory=False)
    
    # Strip column-name whitespace
    df.columns = [c.strip() for c in df.columns]
    
    raw_count = len(df)
    
    # Identify label column
    label_col = "Label" if "Label" in df.columns else df.columns[-1]
    
    # Normalize Attack Type and Day
    day = extract_day(filepath)
    df["Day"] = day
    df["Attack_Type"] = df[label_col].apply(clean_attack_name)
    df["Label"] = (df["Attack_Type"] != "BENIGN").astype(int)
    
    # Derive Protocol if missing
    if "Protocol" not in df.columns:
        tcp_flags = [c for c in ["FIN Flag Count", "SYN Flag Count", "RST Flag Count", 
                                "PSH Flag Count", "ACK Flag Count", "URG Flag Count"] if c in df.columns]
        init_win = "Init_Win_bytes_forward" if "Init_Win_bytes_forward" in df.columns else None
        
        has_tcp_flag = df[tcp_flags].sum(axis=1) > 0 if tcp_flags else False
        has_win = (df[init_win] > 0) if init_win else False
        is_tcp = has_tcp_flag | has_win
        df["Protocol"] = np.where(is_tcp, 6, 17)
    
    # Verify required features exist
    available_features = [f for f in SELECTED_FEATURES if f in df.columns]
    if len(available_features) != len(SELECTED_FEATURES):
        missing = set(SELECTED_FEATURES) - set(available_features)
        raise ValueError(f"File {filepath} missing expected features: {missing}")
    
    # Keep only selected features plus metadata
    cols_to_keep = SELECTED_FEATURES + ["Day", "Attack_Type", "Label"]
    df = df[cols_to_keep].copy()
    
    # Convert feature columns to numeric
    for col in SELECTED_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    
    # Replace inf and -inf with NaN
    df[SELECTED_FEATURES] = df[SELECTED_FEATURES].replace([np.inf, -np.inf], np.nan)
    
    # Drop rows with nulls in features
    df = df.dropna(subset=SELECTED_FEATURES)
    non_null_count = len(df)
    
    # Deduplicate
    df = df.drop_duplicates(subset=SELECTED_FEATURES)
    dedup_count = len(df)
    
    return df, raw_count, (raw_count - non_null_count), (non_null_count - dedup_count)

def run_preprocessing(target_sample_size=300000, random_state=42):
    print("=" * 60)
    print("MODULE 1: NETWORK TRAFFIC COLLECTION & PREPROCESSING")
    print("=" * 60)
    
    csv_files = sorted(glob.glob(os.path.join(RAW_DATA_DIR, "*.csv")))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {RAW_DATA_DIR}")
    
    print(f"Found {len(csv_files)} raw CSV files in {RAW_DATA_DIR}.")
    
    total_raw_rows = 0
    total_dropped_null_inf = 0
    total_duplicates_removed = 0
    dfs = []
    
    for f in csv_files:
        df_clean, raw_c, drop_c, dedup_c = process_file(f)
        total_raw_rows += raw_c
        total_dropped_null_inf += drop_c
        total_duplicates_removed += dedup_c
        dfs.append(df_clean)
        print(f"  -> {len(df_clean)} cleaned rows retained.")
    
    combined_df = pd.concat(dfs, ignore_index=True)
    # Final deduplication across merged files
    pre_len = len(combined_df)
    combined_df = combined_df.drop_duplicates(subset=SELECTED_FEATURES)
    cross_dedup = pre_len - len(combined_df)
    total_duplicates_removed += cross_dedup
    
    total_clean_rows = len(combined_df)
    print(f"\nTotal raw rows processed: {total_raw_rows:,}")
    print(f"Total rows dropped (NaN / Inf): {total_dropped_null_inf:,}")
    print(f"Total duplicates removed: {total_duplicates_removed:,}")
    print(f"Clean unique flows available: {total_clean_rows:,}")
    
    # Held-out demo flows creation (500 flows: 350 benign, 150 mixed attacks)
    print("\nExtracting 500 held-out demo flows (70% Benign, 30% Attacks)...")
    benign_pool = combined_df[combined_df["Label"] == 0]
    attack_pool = combined_df[combined_df["Label"] == 1]
    
    demo_benign = benign_pool.sample(n=350, random_state=random_state)
    demo_attack = attack_pool.sample(n=150, random_state=random_state)
    demo_flows = pd.concat([demo_benign, demo_attack]).sample(frac=1, random_state=random_state).reset_index(drop=True)
    
    # Exclude demo flows from main dataset
    combined_df = combined_df.drop(demo_flows.index, errors="ignore")
    
    demo_csv_path = os.path.join(MODEL_PACK_DIR, "demo_flows.csv")
    demo_flows.to_csv(demo_csv_path, index=False)
    print(f"Saved held-out demo flows -> {demo_csv_path} ({len(demo_flows)} rows)")
    
    # Stratified Sampling to ~300,000 rows
    print(f"\nDrawing stratified sample of ~{target_sample_size:,} rows...")
    
    # Calculate sampling fraction per attack type to ensure rare classes are retained
    sampled_dfs = []
    total_available = len(combined_df)
    sample_ratio = min(1.0, target_sample_size / total_available)
    
    for attack_type, group in combined_df.groupby("Attack_Type"):
        group_len = len(group)
        if group_len <= 50:
            # Keep all rare attacks (e.g. Heartbleed, SQL injection)
            sampled_dfs.append(group)
        else:
            n_samples = max(20, int(round(group_len * sample_ratio)))
            n_samples = min(group_len, n_samples)
            sampled_dfs.append(group.sample(n=n_samples, random_state=random_state))
            
    final_sampled_df = pd.concat(sampled_dfs, ignore_index=True).sample(frac=1, random_state=random_state).reset_index(drop=True)
    print(f"Sampled dataset size: {len(final_sampled_df):,} rows.")
    
    # Fit StandardScaler on selected 25 features
    print("\nFitting StandardScaler on 25 numeric features...")
    scaler = StandardScaler()
    scaler.fit(final_sampled_df[SELECTED_FEATURES])
    
    scaler_path = os.path.join(MODEL_PACK_DIR, "scaler.joblib")
    joblib.dump(scaler, scaler_path)
    print(f"Saved scaler -> {scaler_path}")
    
    # Save features.json
    features_meta = {
        "features": SELECTED_FEATURES,
        "feature_count": len(SELECTED_FEATURES),
        "scaling": "StandardScaler",
        "feature_types": {f: "float64" for f in SELECTED_FEATURES}
    }
    features_json_path = os.path.join(MODEL_PACK_DIR, "features.json")
    with open(features_json_path, "w") as f:
        json.dump(features_meta, f, indent=2)
    print(f"Saved features metadata -> {features_json_path}")
    
    # Save cleaned sampled dataset to Parquet
    parquet_path = os.path.join(CLEAN_DATA_DIR, "flows_clean.parquet")
    final_sampled_df.to_parquet(parquet_path, index=False, engine="fastparquet")
    print(f"Saved cleaned parquet -> {parquet_path} ({os.path.getsize(parquet_path) / (1024*1024):.2f} MB)")
    
    # Preprocessing Report
    class_dist = final_sampled_df["Label"].value_counts().to_dict()
    attack_dist = final_sampled_df["Attack_Type"].value_counts().to_dict()
    day_dist = final_sampled_df["Day"].value_counts().to_dict()
    
    report = {
        "raw_rows_total": int(total_raw_rows),
        "rows_dropped_null_or_inf": int(total_dropped_null_inf),
        "duplicates_removed": int(total_duplicates_removed),
        "clean_unique_rows": int(total_clean_rows),
        "sample_size": int(len(final_sampled_df)),
        "demo_flows_count": int(len(demo_flows)),
        "class_distribution": {
            "Benign (0)": int(class_dist.get(0, 0)),
            "Malicious (1)": int(class_dist.get(1, 0))
        },
        "attack_type_distribution": {k: int(v) for k, v in sorted(attack_dist.items(), key=lambda x: x[1], reverse=True)},
        "day_distribution": {k: int(v) for k, v in day_dist.items()},
        "selected_features": SELECTED_FEATURES
    }
    
    report_path = os.path.join(MODEL_PACK_DIR, "preprocess_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"Saved preprocessing report -> {report_path}")
    
    print("\nPREPROCESSING COMPLETED SUCCESSFULLY!")
    return report

if __name__ == "__main__":
    run_preprocessing()

