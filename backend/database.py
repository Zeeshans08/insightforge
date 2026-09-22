import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "insightforge.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_path TEXT NOT NULL,
        cleaned_path TEXT,
        row_count INTEGER,
        col_count INTEGER,
        profile_json TEXT,
        eda_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis_sessions (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        question TEXT NOT NULL,
        reasoning_trace_json TEXT,
        final_answer TEXT,
        chart_config_json TEXT,
        code_executed TEXT,
        code_output TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(dataset_id) REFERENCES datasets(id)
    )
    """)
    
    conn.commit()
    conn.close()

def save_dataset(dataset_id: str, filename: str, original_path: str, row_count: int, col_count: int, profile: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO datasets (id, filename, original_path, row_count, col_count, profile_json)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (dataset_id, filename, original_path, row_count, col_count, json.dumps(profile)))
    conn.commit()
    conn.close()

def update_dataset_cleaning(dataset_id: str, cleaned_path: str, profile: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE datasets 
    SET cleaned_path = ?, profile_json = ?
    WHERE id = ?
    """, (cleaned_path, json.dumps(profile), dataset_id))
    conn.commit()
    conn.close()

def update_dataset_eda(dataset_id: str, eda: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE datasets 
    SET eda_json = ?
    WHERE id = ?
    """, (json.dumps(eda), dataset_id))
    conn.commit()
    conn.close()

import math

def sanitize_json_obj(obj):
    if isinstance(obj, dict):
        return {k: sanitize_json_obj(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_json_obj(i) for i in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
        return obj
    return obj

def get_dataset(dataset_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        record = dict(row)
        if record.get("profile_json"):
            record["profile"] = sanitize_json_obj(json.loads(record["profile_json"]))
        if record.get("eda_json"):
            record["eda"] = sanitize_json_obj(json.loads(record["eda_json"]))
        return record
    return None

def save_analysis_session(session_id: str, dataset_id: str, question: str, reasoning_trace: list, final_answer: str, chart_config: dict, code_executed: str, code_output: str, status: str = "success"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO analysis_sessions (id, dataset_id, question, reasoning_trace_json, final_answer, chart_config_json, code_executed, code_output, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (session_id, dataset_id, question, json.dumps(reasoning_trace), final_answer, json.dumps(chart_config), code_executed, code_output, status))
    conn.commit()
    conn.close()

def get_analysis_sessions(dataset_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_sessions WHERE dataset_id = ? ORDER BY created_at DESC", (dataset_id,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        item = dict(r)
        if item.get("reasoning_trace_json"):
            item["reasoning_trace"] = json.loads(item["reasoning_trace_json"])
        if item.get("chart_config_json"):
            item["chart_config"] = json.loads(item["chart_config_json"])
        results.append(item)
    return results

# -------------------------------------------------------------
# ADMIN HELPER FUNCTIONS
# -------------------------------------------------------------
def get_admin_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM datasets")
    total_datasets = cursor.fetchone()[0]
    
    cursor.execute("SELECT SUM(row_count) FROM datasets")
    total_rows_res = cursor.fetchone()[0]
    total_rows = total_rows_res if total_rows_res else 0
    
    cursor.execute("SELECT COUNT(*) FROM analysis_sessions")
    total_sessions = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM analysis_sessions WHERE status = 'success'")
    successful_sessions = cursor.fetchone()[0]

    conn.close()

    # DB file size in MB
    db_size_mb = 0.0
    if os.path.exists(DB_PATH):
        db_size_mb = round(os.path.getsize(DB_PATH) / (1024 * 1024), 2)

    return {
        "total_datasets": total_datasets,
        "total_rows_processed": total_rows,
        "total_queries_executed": total_sessions,
        "successful_queries": successful_sessions,
        "db_size_mb": db_size_mb
    }

def get_all_datasets_admin():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.*, COUNT(s.id) as session_count
        FROM datasets d
        LEFT JOIN analysis_sessions s ON d.id = s.dataset_id
        GROUP BY d.id
        ORDER BY d.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        rec = dict(r)
        if rec.get("profile_json"):
            rec["profile"] = sanitize_json_obj(json.loads(rec["profile_json"]))
        results.append(rec)
    return results

def get_all_sessions_admin():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.*, d.filename as dataset_filename
        FROM analysis_sessions s
        LEFT JOIN datasets d ON s.dataset_id = d.id
        ORDER BY s.created_at DESC
        LIMIT 50
    """)
    rows = cursor.fetchall()
    conn.close()
    results = []
    for r in rows:
        item = dict(r)
        if item.get("reasoning_trace_json"):
            item["reasoning_trace"] = json.loads(item["reasoning_trace_json"])
        if item.get("chart_config_json"):
            item["chart_config"] = json.loads(item["chart_config_json"])
        results.append(item)
    return results

def delete_dataset_admin(dataset_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT original_path, cleaned_path FROM datasets WHERE id = ?", (dataset_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False
    
    original_path = row["original_path"]
    cleaned_path = row["cleaned_path"]

    cursor.execute("DELETE FROM analysis_sessions WHERE dataset_id = ?", (dataset_id,))
    cursor.execute("DELETE FROM datasets WHERE id = ?", (dataset_id,))
    conn.commit()
    conn.close()

    # Clean up physical files from disk
    if original_path and os.path.exists(original_path) and not "sample_sales.csv" in original_path:
        try:
            os.remove(original_path)
        except Exception:
            pass

    if cleaned_path and os.path.exists(cleaned_path):
        try:
            os.remove(cleaned_path)
        except Exception:
            pass

    return True

init_db()
