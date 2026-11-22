"""
backend/app/database.py
Unified data store supporting SQLite local fallback and GCP Firestore.
"""

import os
import json
import sqlite3
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from backend.app.config import settings

class Database:
    def __init__(self):
        self.mode = settings.database_mode
        self.sqlite_path = settings.sqlite_db_path
        self._init_sqlite()

    def _get_connection(self):
        conn = sqlite3.connect(self.sqlite_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Alerts table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                flow_id TEXT,
                timestamp TEXT,
                risk_score REAL,
                risk_level TEXT,
                malicious_probability REAL,
                anomaly_score REAL,
                alert_text TEXT,
                top_features TEXT,
                simulated_action TEXT,
                raw_flow TEXT
            )
            """)
            # Simulated Response table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS response_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                flow_id TEXT,
                source_ip TEXT,
                dest_port REAL,
                risk_level TEXT,
                action TEXT,
                status TEXT
            )
            """)
            # Drift events table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS drift_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                baseline_window TEXT,
                current_window TEXT,
                drifted_feature_count INTEGER,
                drift_percentage REAL,
                drift_detected INTEGER,
                accuracy_drop REAL,
                details TEXT
            )
            """)
            # Model versions table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS model_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                version_name TEXT,
                is_active INTEGER,
                metrics TEXT,
                note TEXT
            )
            """)
            conn.commit()

    def save_alert(self, alert: Dict[str, Any]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO alerts 
            (id, flow_id, timestamp, risk_score, risk_level, malicious_probability, anomaly_score, alert_text, top_features, simulated_action, raw_flow)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                alert.get("id"),
                alert.get("flow_id"),
                alert.get("timestamp", datetime.now(timezone.utc).isoformat()),
                alert.get("risk_score", 0.0),
                alert.get("risk_level", "Low"),
                alert.get("malicious_probability", 0.0),
                alert.get("anomaly_score", 0.0),
                alert.get("alert_text", ""),
                json.dumps(alert.get("top_features", [])),
                alert.get("simulated_action", "Log only"),
                json.dumps(alert.get("raw_flow", {}))
            ))
            conn.commit()

    def get_alerts(self, limit: int = 50, offset: int = 0, risk_level: Optional[str] = None) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if risk_level and risk_level.lower() != "all":
                cursor.execute("""
                SELECT * FROM alerts WHERE risk_level = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?
                """, (risk_level.capitalize(), limit, offset))
            else:
                cursor.execute("""
                SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ? OFFSET ?
                """, (limit, offset))
            
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["top_features"] = json.loads(item["top_features"]) if item["top_features"] else []
                item["raw_flow"] = json.loads(item["raw_flow"]) if item["raw_flow"] else {}
                results.append(item)
            return results

    def get_alert_by_id(self, alert_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM alerts WHERE id = ? or flow_id = ?", (alert_id, alert_id))
            row = cursor.fetchone()
            if not row:
                return None
            item = dict(row)
            item["top_features"] = json.loads(item["top_features"]) if item["top_features"] else []
            item["raw_flow"] = json.loads(item["raw_flow"]) if item["raw_flow"] else {}
            return item

    def save_simulated_action(self, action_dict: Dict[str, Any]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO response_actions (timestamp, flow_id, source_ip, dest_port, risk_level, action, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                action_dict.get("timestamp", datetime.now(timezone.utc).isoformat()),
                action_dict.get("flow_id", "N/A"),
                action_dict.get("source_ip", "192.168.10.50"),
                action_dict.get("dest_port", 80),
                action_dict.get("risk_level", "Low"),
                action_dict.get("action", "Log only"),
                "simulated"
            ))
            conn.commit()

    def get_simulated_actions(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM response_actions ORDER BY id DESC LIMIT ?", (limit,))
            return [dict(r) for r in cursor.fetchall()]

    def save_drift_event(self, event: Dict[str, Any]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO drift_events 
            (timestamp, baseline_window, current_window, drifted_feature_count, drift_percentage, drift_detected, accuracy_drop, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event.get("timestamp", datetime.now(timezone.utc).isoformat()),
                event.get("baseline_window", "Monday-Tuesday"),
                event.get("current_window", "Live-Stream"),
                event.get("drifted_feature_count", 0),
                event.get("drift_percentage", 0.0),
                1 if event.get("drift_detected") else 0,
                event.get("accuracy_drop", 0.0),
                json.dumps(event.get("details", {}))
            ))
            conn.commit()

    def get_drift_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM drift_events ORDER BY id DESC LIMIT ?", (limit,))
            results = []
            for r in cursor.fetchall():
                item = dict(r)
                item["details"] = json.loads(item["details"]) if item["details"] else {}
                item["drift_detected"] = bool(item["drift_detected"])
                results.append(item)
            return results

    def save_model_version(self, version: Dict[str, Any]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if version.get("is_active"):
                cursor.execute("UPDATE model_versions SET is_active = 0")
            cursor.execute("""
            INSERT INTO model_versions (timestamp, version_name, is_active, metrics, note)
            VALUES (?, ?, ?, ?, ?)
            """, (
                version.get("timestamp", datetime.now(timezone.utc).isoformat()),
                version.get("version_name"),
                1 if version.get("is_active") else 0,
                json.dumps(version.get("metrics", {})),
                version.get("note", "")
            ))
            conn.commit()

    def get_model_versions(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM model_versions ORDER BY id DESC")
            results = []
            for r in cursor.fetchall():
                item = dict(r)
                item["metrics"] = json.loads(item["metrics"]) if item["metrics"] else {}
                item["is_active"] = bool(item["is_active"])
                results.append(item)
            return results

    def get_stats_summary(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM alerts")
            total_alerts = cursor.fetchone()[0]
            
            cursor.execute("SELECT risk_level, COUNT(*) FROM alerts GROUP BY risk_level")
            level_counts = dict(cursor.fetchall())
            
            cursor.execute("SELECT COUNT(*) FROM response_actions")
            total_actions = cursor.fetchone()[0]
            
            return {
                "total_alerts": total_alerts,
                "high_risk": level_counts.get("High", 0),
                "medium_risk": level_counts.get("Medium", 0),
                "low_risk": level_counts.get("Low", 0),
                "total_simulated_actions": total_actions
            }

db = Database()

