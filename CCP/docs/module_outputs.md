# Project Evidence & Module Output Mapping

This document provides a comprehensive verification mapping for Modules M1 through M5. It details the input, output, scripts/endpoints, verifiable metrics, and visual screenshot evidence suitable for inclusion in an academic or technical project report.

---

## Module 1: Network Traffic Collection and Preprocessing

- **Goal**: Ingest CIC-IDS2017 raw network traffic CSVs, clean data, extract informative features, fit standard scaler, generate held-out streaming demo flows, and implement backend ingestion endpoints.
- **Input**:
  - 8 raw CSV files in `data/raw/` (`Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv`, `Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv`, `Friday-WorkingHours-Morning.pcap_ISCX.csv`, `Monday-WorkingHours.pcap_ISCX.csv`, `Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv`, `Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv`, `Tuesday-WorkingHours.pcap_ISCX.csv`, `Wednesday-workingHours.pcap_ISCX.csv`).
  - Total raw rows processed: **2,830,743**.
- **Processing Pipeline (`ml/preprocess.py`)**:
  - Column name whitespace stripped.
  - Non-ASCII attack labels normalized.
  - Missing `Protocol` derived from TCP flag states and window size (TCP=6, UDP=17).
  - 25 informative numeric features selected (Protocol, Destination Port, Flow Duration, Packet counts, Byte counts, Packets/s, Bytes/s, Flag counts, IAT stats).
  - Dropped nulls and infinite values: **2,867** rows.
  - Removed duplicate flows: **401,331** rows.
  - Total clean unique rows available: **2,426,545**.
  - Held-out streaming demo set created: **500** flows (350 Benign = 70.0%, 150 Attacks = 30.0%).
  - Stratified laptop-friendly training sample: **300,055** rows across all 15 attack classes.
  - Fitted `StandardScaler` on all 25 features.
- **Outputs & Artifacts Generated**:
  - Clean Parquet Data: `data/clean/flows_clean.parquet` (20.40 MB, 300,055 rows)
  - Selected Features Spec: `model_pack/features.json` (25 features)
  - Fitted Scaler: `model_pack/scaler.joblib`
  - Held-out Demo Dataset: `model_pack/demo_flows.csv` (500 flows)
  - Report: `model_pack/preprocess_report.json`
- **Backend Endpoints (`backend/app/routes/ingest.py`)**:
  - `POST /ingest/upload`: Validates flow CSV against `features.json`, cleans inf/nulls, and applies `StandardScaler`.
  - `POST /ingest/replay`: Streams batches from `demo_flows.csv` simulating live incoming network traffic.
- **Verification & Unit Tests**:
  - `pytest tests/test_preprocess.py`: Passed (3/3)
  - `pytest tests/test_ingest_api.py`: Passed (3/3)
- **Git Commit**: `e7083f3` (`feat(M1): network traffic collection and preprocessing pipeline, scaling, and ingestion endpoints`)

---

## Module 2: AI-Based Intrusion Detection and Classification

- **Goal**: Train supervised and unsupervised machine learning models for high-accuracy intrusion detection while keeping model sizes under 100 MB.
- **Input**:
  - `data/clean/flows_clean.parquet` (300,055 flows)
  - Stratified 80/20 train/test split (240,044 train flows, 60,011 test flows)
- **Pipeline (`ml/train.py`)**:
  - **Random Forest Classifier (`rf_v1.joblib`)**: `n_estimators=100`, `max_depth=16`, `class_weight="balanced"`.
  - **Isolation Forest (`iso.joblib`)**: Trained strictly on Benign flows (`y == 0`, 25,000 sub-sampled flows), `n_estimators=100`, `contamination=0.05`.
- **Verifiable Evaluation Metrics (`model_pack/metrics.json`)**:
  - **Random Forest (rf_v1)**:
    - Accuracy: **99.73%** (0.9973)
    - Precision: **99.21%** (0.9921)
    - Recall: **99.26%** (0.9926)
    - F1-Score: **99.23%** (0.9923)
    - ROC-AUC: **0.9999**
    - Confusion Matrix: TN = 49,442, FP = 83, FN = 78, TP = 10,408
    - Model Size: **1.81 MB**
  - **Isolation Forest (iso)**:
    - Accuracy: **86.89%** (0.8689)
    - Precision: **67.13%** (0.6713)
    - Recall: **48.98%** (0.4898)
    - F1-Score: **56.64%** (0.5664)
    - Confusion Matrix: TN = 47,010, FP = 2,515, FN = 5,350, TP = 5,136
    - Model Size: **2.18 MB**
  - **Total Model Artifacts Size**: **3.99 MB** (well below the 100 MB limit).
- **Backend Endpoints**:
  - `POST /predict`: Predicts single or batch flows with malicious probability, label, and anomaly score.
  - `GET /metrics`: Returns evaluation metrics and confusion matrices.
- **Screenshot Evidence**:
  - `docs/screenshots/detection_metrics.png` (Dashboard Detection page showing metrics cards and confusion matrices).
- **Git Commit**: `1bcee09` (`feat(M2-M4): AI intrusion models, SHAP TreeExplainer, drift detection`)

---

## Module 3: Explainable AI and Threat Analysis

- **Goal**: Implement model explainability using SHAP TreeExplainer, risk scoring, automated natural language alert generation, and top feature contribution extraction.
- **Input**:
  - Trained model `rf_v1.joblib`
  - 200-sample background distribution `model_pack/shap_background.csv`
- **Pipeline (`ml/explain.py`)**:
  - TreeExplainer cached in memory at server startup.
  - Risk score mapped to malicious probability:
    - **Low Risk**: $< 0.40$ (normal network activity)
    - **Medium Risk**: $0.40 \le score \le 0.70$ (suspicious traffic)
    - **High Risk**: $> 0.70$ (active intrusion attack)
  - Local feature attribution: for Medium and High risk flows, computes exact SHAP impact values and human-readable directionality (e.g. *high, short, prolonged, active*).
  - Automated Alert Text Generation: e.g., *"Flow 1832: High risk (0.93). Top reasons: Flow Packets/s high, Flow Duration short, Destination Port 445."*
  - Global Feature Importance: computes mean absolute SHAP values across the feature space.
- **Outputs & Visual Evidence**:
  - `docs/screenshots/shap_summary.png`: Global SHAP feature importance plot generated via matplotlib.
  - `docs/screenshots/threat_analysis_shap.png`: Threat Analysis dashboard showing alert log, local SHAP waterfall chart, and global importance rankings.
- **Backend Endpoints**:
  - `GET /alerts`: Filtered and paginated security alert history.
  - `GET /alerts/{id}`: Detailed per-flow SHAP breakdown.
  - `GET /explain/global`: Global feature importance ranking.

---

## Module 4: Concept Drift Detection and Model Adaptation

- **Goal**: Detect statistical data distribution drift between baseline traffic and evolving attack vectors using two-sample KS-tests and Population Stability Index (PSI); retrain and hot-swap to adapted model `rf_v2`.
- **Input**:
  - Baseline Sample: `model_pack/baseline_sample.csv` (1,000 rows from Monday/Tuesday benign traffic).
  - Drift Sample: `model_pack/drift_sample.csv` (1,000 rows from Wednesday/Thursday/Friday attack traffic).
- **Pipeline (`ml/drift.py`)**:
  - Two-sample Kolmogorov-Smirnov test (`scipy.stats.ks_2samp`) per feature.
  - Population Stability Index (PSI) per feature across 10 quantile bins.
  - Feature drift criteria: $p < 0.05$ and $PSI > 0.20$.
  - System drift alert raised if $> 20\%$ of features drifted OR test accuracy drops $> 5\%$.
  - Model Adaptation (`rf_v2.joblib`): trained on baseline + drift data.
- **Verifiable Adaptation Results**:
  - `rf_v1` on Drift Window: Accuracy **99.80%**, F1-Score **99.59%**.
  - `rf_v2` (Adapted) on Drift Window: Accuracy **99.90%**, F1-Score **99.80%** (**+0.20% F1 improvement**).
- **Backend Endpoints**:
  - `POST /drift/check`: Runs KS-test and PSI audit; logs drift event.
  - `POST /model/switch`: Toggles active detection model between `rf_v1` and `rf_v2`.
  - `GET /drift/events`: History of drift audits.
  - `GET /model/versions`: Active model version registry.
- **Screenshot Evidence**:
  - `docs/screenshots/drift_adaptation.png`: Drift & Adaptation dashboard showing PSI feature bars, drift status badge, and model version switch confirmation.

---

## Module 5: Cloud Security Dashboard & Automated Simulated Defense

- **Goal**: Provide an interactive operations dashboard with real-time telemetry, live packet replay, automated simulated defense actions, and cloud runtime monitoring.
- **Components**:
  - **Simulated Response Engine (`model_pack/response_policy.json`)**:
    - High Risk: **"Block IP"** (Simulated firewall drop rule)
    - Medium Risk: **"Rate-limit"** (Simulated QoS traffic shaping)
    - Low Risk: **"Log only"** (Recorded in security telemetry)
    - Safety Guarantee: strictly simulated actions stored in SQLite/Firestore audit log.
  - **Frontend UI (React + Vite + Tailwind + Recharts)**:
    - Overview Tab: KPI cards, live traffic area chart, risk distribution donut, cloud runtime telemetry, automated simulated defense table.
    - Detection Tab: Supervised vs unsupervised performance cards, confusion matrix heatmaps.
    - Threat Analysis Tab: Alert feed, local SHAP waterfall chart, global importance bars.
    - Drift Tab: PSI feature bars, drift sentinel rules, model adaptation comparison, hot-swap button.
- **Backend Endpoints (`backend/app/routes/stats.py`)**:
  - `GET /stats`: Aggregated traffic counts, alert breakdown, malicious ratio, top attackers/ports.
  - `GET /cloud`: Cloud provider metadata, Cloud Run revision, region, memory, uptime.
  - `GET /policy` & `PUT /policy`: View and update response policy.
  - `GET /actions`: Audit log of simulated defense actions.
- **Screenshot Evidence**:
  - `docs/screenshots/overview_dashboard.png`: Overview page with live KPIs, traffic timeline, threat donut, and response table.

---

## 6. Assumptions and Technical Notes

1. **Docker Execution on Local Host**: Docker Desktop was not installed on the local Windows environment. Complete, production-ready `backend/Dockerfile`, `frontend/Dockerfile`, `nginx.conf`, and `docker-compose.yml` were authored for containerized environments. Local testing and dashboard operations ran seamlessly via Python Uvicorn (port 8000) and Vite preview server (port 5173).
2. **Missing Protocol Column in Raw CSVs**: The original CIC-IDS2017 `MachineLearningCVE` CSVs do not have a dedicated `Protocol` column. The protocol was reliably derived from TCP header flags (`FIN`, `SYN`, `RST`, `PSH`, `ACK`, `URG`) and `Init_Win_bytes_forward` (TCP=6, UDP=17), fulfilling the 25-feature requirement without synthesizing random values.
3. **Simulated Response Guarantee**: Automated defense actions (Block IP, Rate-limit) are strictly simulated and logged to the database with status `"simulated"`, ensuring full safety and preventing disruption to local or cloud network connectivity.
