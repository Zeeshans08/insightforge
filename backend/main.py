import os
import io
import uuid
import json
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException, Response, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

import database
from agent import run_agent_query
from pdf_exporter import generate_pdf_report

load_dotenv()

app = FastAPI(title="InsightForge Agentic Data API", version="2.0.0")

# CORS setup
frontend_url = os.getenv("FRONTEND_URL", "*")
allowed_origins = [frontend_url] if frontend_url != "*" else ["*"]
if "http://localhost:5173" not in allowed_origins and frontend_url != "*":
    allowed_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev access seamlessly
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("cleaned_data", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
os.makedirs("reports", exist_ok=True)

database.init_db()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit

def read_df_from_bytes(filename: str, contents: bytes) -> pd.DataFrame:
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 10MB limit.")

    try:
        if filename.endswith(".csv"):
            return pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            return pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV or Excel.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read spreadsheet file: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "InsightForge Agentic API is online 🚀", "status": "active"}

@app.get("/health")
def health_check():
    api_key_loaded = bool(os.getenv("ANTHROPIC_API_KEY"))
    return {"status": "ok", "api_key_loaded": api_key_loaded}

def sanitize_df_sample(df_subset) -> list:
    cleaned = df_subset.fillna("").copy()
    for col in cleaned.columns:
        cleaned[col] = cleaned[col].astype(str)
    return cleaned.to_dict(orient="records")

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename.lower()
    contents = await file.read()
    
    df = read_df_from_bytes(filename, contents)
    
    dataset_id = str(uuid.uuid4())
    original_path = os.path.join("uploads", f"{dataset_id}_{file.filename}")
    with open(original_path, "wb") as f:
        f.write(contents)

    profile = {
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),
        "column_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing_values": {col: int(df[col].isna().sum()) for col in df.columns},
        "sample_rows": sanitize_df_sample(df.head(5)),
    }

    database.save_dataset(dataset_id, file.filename, original_path, len(df), len(df.columns), profile)
    
    return {"dataset_id": dataset_id, "profile": profile}

@app.post("/api/clean/{dataset_id}")
async def clean_dataset(dataset_id: str):
    record = database.get_dataset(dataset_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_path = record.get("cleaned_path") or record.get("original_path")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Source data file missing")

    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    report = {"actions": [], "rows_before": len(df)}

    # 1. Drop duplicates
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        df = df.drop_duplicates()
        report["actions"].append(f"Removed {int(dup_count)} duplicate row(s).")

    # 2. Handle missing values
    for col in df.columns:
        missing_count = df[col].isna().sum()
        if missing_count > 0:
            if pd.api.types.is_numeric_dtype(df[col]):
                med = df[col].median()
                df[col] = df[col].fillna(med)
                report["actions"].append(f"Filled {int(missing_count)} missing values in numeric column '{col}' with median ({round(float(med), 2)}).")
            else:
                df[col] = df[col].fillna("Unknown")
                report["actions"].append(f"Filled {int(missing_count)} missing values in text column '{col}' with 'Unknown'.")

    # 3. Flag negative values
    flagged = []
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]) and any(kw in col.lower() for kw in ["qty", "quantity", "price", "amount", "revenue"]):
            neg_count = (df[col] < 0).sum()
            if neg_count > 0:
                flagged.append(col)
                report["actions"].append(f"Flagged {int(neg_count)} negative value(s) in '{col}' (possible returns/cancellations).")

    if file_path.endswith((".xlsx", ".xls")):
        cleaned_path = os.path.join("cleaned_data", f"{dataset_id}_cleaned.xlsx")
        df.to_excel(cleaned_path, index=False)
    else:
        cleaned_path = os.path.join("cleaned_data", f"{dataset_id}_cleaned.csv")
        df.to_csv(cleaned_path, index=False)

    report["rows_after"] = len(df)
    report["flagged_columns"] = flagged
    report["cleaned_sample"] = sanitize_df_sample(df.head(5))

    # Update database profile & cleaned path
    updated_profile = record.get("profile", {})
    updated_profile["sample_rows"] = report["cleaned_sample"]
    updated_profile["missing_values"] = {col: 0 for col in df.columns}
    database.update_dataset_cleaning(dataset_id, cleaned_path, updated_profile)

    return {"dataset_id": dataset_id, "report": report, "profile": updated_profile}

@app.post("/api/eda/{dataset_id}")
async def compute_eda(dataset_id: str):
    record = database.get_dataset(dataset_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_path = record.get("cleaned_path") or record.get("original_path")
    if file_path.endswith(".csv"):
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(exclude="number").columns.tolist()

    numeric_summary = {}
    for col in numeric_cols:
        s = df[col].dropna()
        if len(s) > 0:
            numeric_summary[col] = {
                "mean": round(float(s.mean()), 2),
                "median": round(float(s.median()), 2),
                "min": round(float(s.min()), 2),
                "max": round(float(s.max()), 2),
                "std": round(float(s.std()), 2) if len(s) > 1 else 0.0
            }

    categorical_summary = {}
    for col in categorical_cols:
        top_vals = df[col].value_counts().head(5)
        categorical_summary[col] = {str(k): int(v) for k, v in top_vals.items()}

    correlations = {}
    if len(numeric_cols) >= 2:
        corr_matrix = df[numeric_cols].corr().round(2)
        correlations = corr_matrix.to_dict()
        for c1 in correlations:
            for c2 in correlations[c1]:
                if pd.isna(correlations[c1][c2]):
                    correlations[c1][c2] = 0.0

    outliers = {}
    for col in numeric_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        if iqr > 0:
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            outlier_count = int(((df[col] < lower) | (df[col] > upper)).sum())
            if outlier_count > 0:
                outliers[col] = outlier_count

    eda_result = {
        "rows_analyzed": len(df),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "numeric_summary": numeric_summary,
        "categorical_summary": categorical_summary,
        "correlations": correlations,
        "outliers_detected": outliers
    }

    database.update_dataset_eda(dataset_id, eda_result)
    return eda_result

from pydantic import BaseModel

class AgentQueryRequest(BaseModel):
    dataset_id: str
    question: str

@app.post("/api/query")
async def process_agent_query(req: AgentQueryRequest):
    record = database.get_dataset(req.dataset_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_path = record.get("cleaned_path") or record.get("original_path")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Data file missing")

    profile = record.get("profile", {})
    eda = record.get("eda", {})

    agent_result = run_agent_query(file_path, profile, eda, req.question)

    session_id = str(uuid.uuid4())
    database.save_analysis_session(
        session_id=session_id,
        dataset_id=req.dataset_id,
        question=req.question,
        reasoning_trace=agent_result.get("reasoning_trace", []),
        final_answer=agent_result.get("answer", ""),
        chart_config=agent_result.get("chart_config", {}),
        code_executed=agent_result.get("code_executed", ""),
        code_output=agent_result.get("code_output", "")
    )

    return {
        "session_id": session_id,
        "dataset_id": req.dataset_id,
        "question": req.question,
        "answer": agent_result.get("answer", ""),
        "key_metrics": agent_result.get("key_metrics", []),
        "reasoning_trace": agent_result.get("reasoning_trace", []),
        "chart_config": agent_result.get("chart_config", {}),
        "code_executed": agent_result.get("code_executed", ""),
        "code_output": agent_result.get("code_output", "")
    }

@app.get("/api/demo")
async def load_demo_dataset():
    sample_file_path = os.path.join(os.path.dirname(__file__), "test-data", "sample_sales.csv")
    if not os.path.exists(sample_file_path):
        raise HTTPException(status_code=404, detail="Demo file not found on server")

    with open(sample_file_path, "rb") as f:
        contents = f.read()

    df = pd.read_csv(io.BytesIO(contents))
    dataset_id = "demo-sales-dataset"
    original_path = sample_file_path

    profile = {
        "filename": "sample_sales.csv",
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),
        "column_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing_values": {col: int(df[col].isna().sum()) for col in df.columns},
        "sample_rows": sanitize_df_sample(df.head(5)),
    }

    database.save_dataset(dataset_id, "sample_sales.csv", original_path, len(df), len(df.columns), profile)
    return {"dataset_id": dataset_id, "profile": profile}

@app.get("/api/dataset/{dataset_id}")
async def get_dataset_details(dataset_id: str):
    record = database.get_dataset(dataset_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    sessions = database.get_analysis_sessions(dataset_id)
    record["sessions"] = sessions
    return record

@app.get("/api/download-cleaned/{dataset_id}")
async def download_cleaned_file(dataset_id: str):
    record = database.get_dataset(dataset_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    cleaned_path = record.get("cleaned_path")
    if not cleaned_path or not os.path.exists(cleaned_path):
        cleaned_path = record.get("original_path")
        
    orig_filename = record.get('filename', 'cleaned_data')
    base_name, _ = os.path.splitext(orig_filename)

    if cleaned_path.endswith((".xlsx", ".xls")):
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        download_filename = f"cleaned_{base_name}.xlsx"
    else:
        media_type = "text/csv"
        download_filename = f"cleaned_{base_name}.csv"

    return FileResponse(cleaned_path, filename=download_filename, media_type=media_type)

@app.get("/api/export-pdf/{dataset_id}")
async def export_pdf(dataset_id: str):
    record = database.get_dataset(dataset_id)
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    sessions = database.get_analysis_sessions(dataset_id)
    pdf_filename = f"insightforge_report_{dataset_id[:8]}.pdf"
    output_path = os.path.join("reports", pdf_filename)
    
    generate_pdf_report(record, output_path, sessions)
    return FileResponse(output_path, filename=pdf_filename, media_type="application/pdf")

# -------------------------------------------------------------
# ADMIN AUTH & API ENDPOINTS
# -------------------------------------------------------------
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "insightforge123")
ADMIN_SECRET_TOKEN = os.getenv("ADMIN_SECRET_TOKEN", "insightforge_admin_token_secret_998877")

class AdminLoginRequest(BaseModel):
    username: str
    password: str

def verify_admin_auth(x_admin_token: str = Header(None)):
    if not x_admin_token or x_admin_token != ADMIN_SECRET_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized admin access. Invalid or missing token.")

@app.post("/api/admin/login")
async def admin_login(req: AdminLoginRequest):
    if req.username == ADMIN_USERNAME and req.password == ADMIN_PASSWORD:
        return {
            "status": "success",
            "message": "Authenticated successfully",
            "token": ADMIN_SECRET_TOKEN
        }
    raise HTTPException(status_code=401, detail="Invalid admin username or password.")

@app.get("/api/admin/stats")
async def get_admin_dashboard_stats(x_admin_token: str = Header(None)):
    verify_admin_auth(x_admin_token)
    stats = database.get_admin_stats()
    api_key_loaded = bool(os.getenv("ANTHROPIC_API_KEY"))
    model_name = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
    stats["api_key_loaded"] = api_key_loaded
    stats["model_name"] = model_name
    return stats

@app.get("/api/admin/datasets")
async def get_admin_datasets_list(x_admin_token: str = Header(None)):
    verify_admin_auth(x_admin_token)
    datasets = database.get_all_datasets_admin()
    return {"datasets": datasets}

@app.get("/api/admin/sessions")
async def get_admin_sessions_list(x_admin_token: str = Header(None)):
    verify_admin_auth(x_admin_token)
    sessions = database.get_all_sessions_admin()
    return {"sessions": sessions}

@app.delete("/api/admin/dataset/{dataset_id}")
async def admin_delete_dataset(dataset_id: str, x_admin_token: str = Header(None)):
    verify_admin_auth(x_admin_token)
    success = database.delete_dataset_admin(dataset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dataset not found or could not be deleted")
    return {"status": "success", "deleted_dataset_id": dataset_id}