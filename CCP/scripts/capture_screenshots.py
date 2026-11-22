"""
scripts/capture_screenshots.py
Automated high-resolution screenshot capture of all 4 dashboard pages:
1. Overview & Telemetry (docs/screenshots/overview_dashboard.png)
2. AI Detection & Confusion Matrices (docs/screenshots/detection_metrics.png)
3. Explainable AI & SHAP Local/Global Threats (docs/screenshots/threat_analysis_shap.png)
4. Concept Drift Detection & Model Adaptation (docs/screenshots/drift_adaptation.png)
"""

import os
import time
from playwright.sync_api import sync_playwright

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DOCS_DIR = os.path.join(BASE_DIR, "docs", "screenshots")
os.makedirs(DOCS_DIR, exist_ok=True)

def capture_all():
    print("Starting automated screenshot capture on http://127.0.0.1:5173...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 920})
        page = context.new_page()

        # 1. Overview Page
        print("Navigating to Overview page...")
        page.goto("http://127.0.0.1:5173", wait_until="networkidle")
        time.sleep(2)
        overview_path = os.path.join(DOCS_DIR, "overview_dashboard.png")
        page.screenshot(path=overview_path, full_page=True)
        print(f"Captured Overview -> {overview_path}")

        # Start simulation to stream live packets
        print("Starting live simulation stream...")
        try:
            sim_btn = page.locator("button:has-text('Start Live Simulation')")
            if sim_btn.count() > 0:
                sim_btn.click()
                time.sleep(4)
        except Exception as e:
            print("Simulation button click:", e)

        # 2. AI Detection Page
        print("Navigating to AI Detection page...")
        page.locator("button:has-text('AI Detection (M2)')").click()
        time.sleep(2)
        detection_path = os.path.join(DOCS_DIR, "detection_metrics.png")
        page.screenshot(path=detection_path, full_page=True)
        print(f"Captured Detection -> {detection_path}")

        # 3. Threat Analysis Page (SHAP)
        print("Navigating to Threat Analysis (SHAP) page...")
        page.locator("button:has-text('Threat Analysis (SHAP)')").click()
        time.sleep(2)
        # Click first row if present
        first_row = page.locator("tbody tr").first
        if first_row.count() > 0:
            first_row.click()
            time.sleep(1)
        threats_path = os.path.join(DOCS_DIR, "threat_analysis_shap.png")
        page.screenshot(path=threats_path, full_page=True)
        print(f"Captured Threat Analysis -> {threats_path}")

        # 4. Drift & Adaptation Page
        print("Navigating to Drift & Adaptation page...")
        page.locator("button:has-text('Drift & Adaptation')").click()
        time.sleep(2)

        # Click Drift Audit
        audit_btn = page.locator("button:has-text('Run Drift Audit')")
        if audit_btn.count() > 0:
            audit_btn.click()
            time.sleep(2)

        # Click Adapt Model
        adapt_btn = page.locator("button:has-text('Adapt Model')")
        if adapt_btn.count() > 0:
            adapt_btn.click()
            time.sleep(2)

        drift_path = os.path.join(DOCS_DIR, "drift_adaptation.png")
        page.screenshot(path=drift_path, full_page=True)
        print(f"Captured Drift & Adaptation -> {drift_path}")

        browser.close()
        print("\nALL 4 SCREENSHOTS SUCCESSFULLY CAPTURED!")

if __name__ == "__main__":
    capture_all()

