"""
ml/drift.py
Concept Drift Detection and Model Adaptation Module.
- Statistical Kolmogorov-Smirnov test (scipy.stats.ks_2samp)
- Population Stability Index (PSI) per feature
- Evaluates feature-level and dataset-level drift:
  - Feature is drifted if p < 0.05 and PSI > 0.2
  - Drift alert raised if > 20% of features drifted or accuracy on window drops > 5%
- Supports model version switching between rf_v1 and rf_v2
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from scipy.stats import ks_2samp
from sklearn.metrics import accuracy_score

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_PACK_DIR = os.path.join(BASE_DIR, "model_pack")

def calculate_psi(baseline: np.ndarray, current: np.ndarray, num_bins: int = 10) -> float:
    """Calculates the Population Stability Index (PSI) between baseline and current distributions."""
    eps = 1e-4
    # Create bin edges from baseline quantiles
    try:
        quantiles = np.linspace(0, 100, num_bins + 1)
        bin_edges = np.percentile(baseline, quantiles)
        bin_edges = np.unique(bin_edges)
        if len(bin_edges) < 2:
            return 0.0
        
        # Bin data
        base_counts, _ = np.histogram(baseline, bins=bin_edges)
        curr_counts, _ = np.histogram(current, bins=bin_edges)
        
        # Normalize to probabilities
        p_base = (base_counts + eps) / (len(baseline) + eps * len(base_counts))
        q_curr = (curr_counts + eps) / (len(current) + eps * len(curr_counts))
        
        # PSI formula: sum((q - p) * ln(q / p))
        psi_val = np.sum((q_curr - p_base) * np.log(q_curr / p_base))
        return float(max(0.0, psi_val))
    except Exception:
        return 0.0

class DriftDetector:
    def __init__(self):
        self.features_path = os.path.join(MODEL_PACK_DIR, "features.json")
        self.baseline_path = os.path.join(MODEL_PACK_DIR, "baseline_sample.csv")
        self.drift_path = os.path.join(MODEL_PACK_DIR, "drift_sample.csv")
        self.scaler_path = os.path.join(MODEL_PACK_DIR, "scaler.joblib")
        self.rf_v1_path = os.path.join(MODEL_PACK_DIR, "rf_v1.joblib")
        self.rf_v2_path = os.path.join(MODEL_PACK_DIR, "rf_v2.joblib")

        with open(self.features_path, "r") as f:
            self.features = json.load(f)["features"]

        self.baseline_df = pd.read_csv(self.baseline_path)
        self.drift_df = pd.read_csv(self.drift_path)
        self.scaler = joblib.load(self.scaler_path)
        self.rf_v1 = joblib.load(self.rf_v1_path)
        self.rf_v2 = joblib.load(self.rf_v2_path) if os.path.exists(self.rf_v2_path) else None

    def check_drift(self, current_df: pd.DataFrame = None):
        """Runs KS-Test and PSI on all 25 features between baseline and current window."""
        if current_df is None or len(current_df) == 0:
            current_df = self.drift_df

        feature_results = []
        drifted_features = []

        for feat in self.features:
            base_vals = self.baseline_df[feat].dropna().values
            curr_vals = current_df[feat].dropna().values

            # Two-sample Kolmogorov-Smirnov test
            ks_stat, p_val = ks_2samp(base_vals, curr_vals)
            # Population Stability Index
            psi_val = calculate_psi(base_vals, curr_vals)

            # A feature is drifted if p < 0.05 and PSI > 0.2
            is_drifted = bool(p_val < 0.05 and psi_val > 0.20)
            if is_drifted:
                drifted_features.append(feat)

            feature_results.append({
                "feature": feat,
                "ks_statistic": round(float(ks_stat), 4),
                "p_value": float(p_val),
                "psi": round(float(psi_val), 4),
                "is_drifted": is_drifted,
                "status": "DRIFTED" if is_drifted else "STABLE"
            })

        total_features = len(self.features)
        drift_percentage = (len(drifted_features) / total_features) * 100.0

        # Check accuracy drop on current labeled window
        accuracy_drop = 0.0
        v1_acc = 0.0
        v2_acc = 0.0
        if "Label" in current_df.columns:
            y_curr = current_df["Label"].values
            X_curr_scaled = self.scaler.transform(current_df[self.features].values)
            v1_preds = self.rf_v1.predict(X_curr_scaled)
            v1_acc = float(accuracy_score(y_curr, v1_preds))
            baseline_acc = 0.9973 # test accuracy
            accuracy_drop = max(0.0, (baseline_acc - v1_acc) * 100.0)
            if self.rf_v2 is not None:
                v2_preds = self.rf_v2.predict(X_curr_scaled)
                v2_acc = float(accuracy_score(y_curr, v2_preds))

        # Alert if > 20% of features drifted or accuracy drops > 5%
        drift_detected = bool(drift_percentage > 20.0 or accuracy_drop > 5.0)

        return {
            "drift_detected": drift_detected,
            "drift_status": "CRITICAL DRIFT" if drift_detected else "NORMAL",
            "drifted_features_count": len(drifted_features),
            "total_features": total_features,
            "drift_percentage": round(drift_percentage, 2),
            "accuracy_drop_pct": round(accuracy_drop, 2),
            "v1_accuracy": round(v1_acc, 4),
            "v2_accuracy": round(v2_acc, 4),
            "features": feature_results,
            "drifted_feature_names": drifted_features
        }

if __name__ == "__main__":
    detector = DriftDetector()
    results = detector.check_drift()
    print(f"Drift Detected: {results['drift_detected']} ({results['drift_percentage']}% of features drifted)")
    print(f"Drifted features count: {results['drifted_features_count']} / {results['total_features']}")
    for f in results["features"][:5]:
        print(f"  {f['feature']}: PSI={f['psi']}, p={f['p_value']:.4e}, status={f['status']}")

