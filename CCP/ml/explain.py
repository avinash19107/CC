"""
ml/explain.py
Explainable AI (XAI) and Threat Analysis module using SHAP (SHapley Additive exPlanations).
- Caches shap.TreeExplainer on rf_v1 using 200-sample background (shap_background.csv)
- Computes risk score (malicious probability) and bins: Low (<0.4), Medium (0.4-0.7), High (>0.7)
- Computes local explanations for Medium and High risk flows, extracting top 3 features with direction
- Generates human-readable alert strings: "Flow 1832: High risk (0.93). Top reasons: Flow Packets/s high, Flow Duration short, Destination Port 445."
- Generates and saves global SHAP summary plot to docs/screenshots/shap_summary.png
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import shap
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_PACK_DIR = os.path.join(BASE_DIR, "model_pack")
DOCS_SCREENSHOTS_DIR = os.path.join(BASE_DIR, "docs", "screenshots")
os.makedirs(DOCS_SCREENSHOTS_DIR, exist_ok=True)

class ThreatExplainer:
    _instance = None

    def __init__(self):
        self.features_path = os.path.join(MODEL_PACK_DIR, "features.json")
        self.scaler_path = os.path.join(MODEL_PACK_DIR, "scaler.joblib")
        self.model_v1_path = os.path.join(MODEL_PACK_DIR, "rf_v1.joblib")
        self.model_v2_path = os.path.join(MODEL_PACK_DIR, "rf_v2.joblib")
        self.iso_path = os.path.join(MODEL_PACK_DIR, "iso.joblib")
        self.bg_path = os.path.join(MODEL_PACK_DIR, "shap_background.csv")

        # Load metadata
        with open(self.features_path, "r") as f:
            self.features = json.load(f)["features"]

        self.scaler = joblib.load(self.scaler_path)
        self.rf_v1 = joblib.load(self.model_v1_path)
        self.rf_v2 = joblib.load(self.model_v2_path) if os.path.exists(self.model_v2_path) else self.rf_v1
        self.iso = joblib.load(self.iso_path)
        self.active_model_name = "rf_v1"
        self.active_model = self.rf_v1

        # Load background data for SHAP
        bg_df = pd.read_csv(self.bg_path)
        self.bg_scaled = self.scaler.transform(bg_df[self.features].values)

        # Initialize TreeExplainer (cached in memory)
        print("Initializing SHAP TreeExplainer with 200-sample background...")
        self.explainer = shap.TreeExplainer(self.rf_v1, data=self.bg_scaled, feature_perturbation="interventional")
        print("SHAP TreeExplainer cached successfully.")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ThreatExplainer()
        return cls._instance

    def set_active_model(self, model_name: str):
        if model_name == "rf_v2":
            self.active_model = self.rf_v2
            self.active_model_name = "rf_v2"
        else:
            self.active_model = self.rf_v1
            self.active_model_name = "rf_v1"
        return self.active_model_name

    @staticmethod
    def get_risk_level(prob: float) -> str:
        """Risk score = predicted malicious probability. Levels: Low < 0.4, Medium 0.4 to 0.7, High > 0.7."""
        if prob < 0.40:
            return "Low"
        elif prob <= 0.70:
            return "Medium"
        else:
            return "High"

    @staticmethod
    def _feature_direction(feat_name: str, raw_val: float, shap_val: float) -> str:
        """Determines natural human-readable direction phrase."""
        if "Port" in feat_name:
            return f"{int(raw_val)}"
        elif "Duration" in feat_name:
            return "short" if raw_val < 50000 else "prolonged"
        elif "Packets/s" in feat_name or "Bytes/s" in feat_name:
            return "high" if shap_val > 0 else "low"
        elif "Flag" in feat_name:
            return "active" if raw_val > 0 else "cleared"
        else:
            return "elevated" if shap_val > 0 else "reduced"

    def predict_flow(self, flow_dict: dict, flow_id: str = "flow-0"):
        """Predicts risk score, anomaly score, and SHAP top contributors for a single flow."""
        raw_vals = [float(flow_dict.get(f, 0.0)) for f in self.features]
        arr_2d = np.array([raw_vals])
        scaled_2d = self.scaler.transform(arr_2d)

        # Supervised probability
        probs = self.active_model.predict_proba(scaled_2d)[0]
        mal_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
        pred_label = 1 if mal_prob >= 0.5 else 0
        risk_level = self.get_risk_level(mal_prob)

        # Unsupervised Isolation Forest anomaly score
        iso_pred_raw = self.iso.predict(scaled_2d)[0] # -1 anomaly, 1 normal
        is_anomaly = bool(iso_pred_raw == -1)
        iso_score = float(-self.iso.score_samples(scaled_2d)[0]) # higher = more anomalous

        top_features = []
        alert_text = None

        # Compute SHAP explanation for Medium and High risk flows
        if mal_prob >= 0.40:
            shap_values = self.explainer.shap_values(scaled_2d)
            # In binary classification, shap_values is array for positive class or list [class0, class1]
            if isinstance(shap_values, list) and len(shap_values) == 2:
                class1_shap = shap_values[1][0]
            elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
                class1_shap = shap_values[0, :, 1]
            else:
                class1_shap = shap_values[0]

            # Sort features by absolute contribution to malicious prediction
            feat_impacts = []
            for i, feat in enumerate(self.features):
                s_val = float(class1_shap[i])
                r_val = raw_vals[i]
                feat_impacts.append({
                    "feature": feat,
                    "shap_value": round(s_val, 4),
                    "raw_value": round(r_val, 4),
                    "abs_impact": abs(s_val),
                    "direction": self._feature_direction(feat, r_val, s_val)
                })

            feat_impacts.sort(key=lambda x: x["abs_impact"], reverse=True)
            top_3 = feat_impacts[:3]
            top_features = feat_impacts[:6] # Keep top 6 for UI waterfall

            # Format natural alert text:
            # "Flow 1832: High risk (0.93). Top reasons: Flow Packets/s high, Flow Duration short, Destination Port 445."
            reasons = [f"{item['feature']} {item['direction']}" for item in top_3]
            alert_text = f"Flow {flow_id}: {risk_level} risk ({mal_prob:.2f}). Top reasons: {', '.join(reasons)}."

        # Automated Simulated Response Policy
        if risk_level == "High":
            simulated_action = "Block IP"
        elif risk_level == "Medium":
            simulated_action = "Rate-limit"
        else:
            simulated_action = "Log only"

        return {
            "flow_id": flow_id,
            "prediction": pred_label,
            "label": "Malicious" if pred_label == 1 else "Benign",
            "malicious_probability": round(mal_prob, 4),
            "risk_score": round(mal_prob, 4),
            "risk_level": risk_level,
            "anomaly_score": round(iso_score, 4),
            "is_anomaly": is_anomaly,
            "top_features": top_features,
            "alert_text": alert_text,
            "simulated_action": simulated_action
        }

    def generate_global_importance(self, sample_size: int = 150):
        """Computes global feature importance using SHAP and saves docs/screenshots/shap_summary.png."""
        bg_df = pd.read_csv(self.bg_path).head(sample_size)
        scaled_sample = self.scaler.transform(bg_df[self.features].values)

        shap_values = self.explainer.shap_values(scaled_sample)
        if isinstance(shap_values, list) and len(shap_values) == 2:
            vals = shap_values[1]
        elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
            vals = shap_values[:, :, 1]
        else:
            vals = shap_values

        mean_abs = np.mean(np.abs(vals), axis=0)
        ranking = []
        for i, feat in enumerate(self.features):
            ranking.append({
                "feature": feat,
                "importance": float(mean_abs[i])
            })
        ranking.sort(key=lambda x: x["importance"], reverse=True)

        # Generate and save SHAP summary bar plot
        plt.figure(figsize=(10, 6))
        top_10 = ranking[:10][::-1]
        names = [item["feature"] for item in top_10]
        imps = [item["importance"] for item in top_10]

        plt.barh(names, imps, color="#4f46e5")
        plt.xlabel("Mean |SHAP Value| (Impact on Intrusion Classification)")
        plt.title("SHAP Global Feature Importance (Random Forest v1)")
        plt.tight_layout()

        png_path = os.path.join(DOCS_SCREENSHOTS_DIR, "shap_summary.png")
        plt.savefig(png_path, dpi=150)
        plt.close()
        print(f"Saved SHAP summary plot -> {png_path}")

        return ranking

if __name__ == "__main__":
    explainer = ThreatExplainer.get_instance()
    global_imp = explainer.generate_global_importance()
    print("Top 5 Global Features by SHAP Importance:")
    for item in global_imp[:5]:
        print(f"  {item['feature']}: {item['importance']:.4f}")

