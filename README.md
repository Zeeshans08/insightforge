# InsightForge 🚀 | Autonomous Agentic Data Intelligence Platform

> **"Turn raw, messy spreadsheets into instant, verified insights, automated EDA, and interactive visual charts — no SQL, no Excel formulas, and no manual chart-building."**

InsightForge is a modern full-stack data analytics platform powered by a transparent **4-Stage AI Agent** (Planner $\rightarrow$ Safe Python Sandbox $\rightarrow$ Validator $\rightarrow$ Synthesizer). Designed to solve real-world data problems (missing values, duplicates, pricing anomalies, complex queries), InsightForge bridges raw data files and executive-ready decisions.

---

## 🌟 Key Features

- **1-Click Automated Data Cleaning**: Deduplicates rows, imputes numeric missing values with medians, fills text gaps with 'Unknown', and flags negative transaction anomalies.
- **Automated Exploratory Data Analysis (EDA)**: Statistical distributions (Mean, Median, Min, Max, Std Dev), top categorical breakdowns, correlation matrices, and IQR outlier detection.
- **Transparent 4-Stage AI Agent**:
  1. **Planner**: Formulates analysis strategies & Pandas Python code.
  2. **Safe Python Sandbox**: Executes pandas queries in a sanitized python environment (`df`, `pd`, `np`).
  3. **Validator**: Inspects calculation accuracy and automatically self-corrects if code errors occur.
  4. **Synthesizer**: Generates plain-English narrative answers and dynamic Recharts visualization specifications.
- **Private Password-Protected Admin Portal (`/admin`)**:
  - Dedicated route requiring Admin Login (`admin` / `insightforge123`).
  - System telemetry (Total Datasets, Rows Processed, Agent Queries, DB Size).
  - Datasets Registry with 1-click dataset deletion.
  - Agent Query Execution Audit Logs.
- **Interactive Recharts Visualizations**: Renders dynamic Bar, Line, Pie, and Scatter charts with tooltips and custom glassmorphism styling.
- **Executive PDF Export**: Generates shareable summary reports for stakeholders.
- **SQLite Persistence**: Stores datasets, cleaning histories, and query sessions.

---

## 🏗️ Architecture & Flow

```mermaid
graph TD
    User[Public Visitor] -->|Upload CSV/XLSX or 1-Click Demo| API[FastAPI Backend]
    API -->|Sanitize & Store| DB[(SQLite Database)]
    
    AdminUser[Admin] -->|Navigates to /admin| AdminLogin[Admin Login Screen]
    AdminLogin -->|Authenticate Token| AdminPanel[Admin Telemetry Control Center]
    
    User -->|Ask Question in Plain English| Agent[Agent Orchestrator]
    
    subgraph Agentic Pipeline
        Agent -->|Stage 1: Plan & Write Pandas Code| Planner[Planner Stage]
        Planner -->|Stage 2: Run Pandas Query| Sandbox[Safe Python Code Sandbox]
        Sandbox -->|Stage 3: Validate / Self-Correct| Validator[Validator Stage]
        Validator -->|Stage 4: Synthesize Answer + Recharts Spec| Synthesizer[Synthesis Stage]
    end
    
    Synthesizer -->|JSON Response + Reasoning Trace + Chart Spec| API
    API -->|Return Session Data| User
    User -->|Render Glassmorphic UI & Interactive Charts| Dashboard[React + Recharts Dashboard]
    User -->|Download Executive Summary| PDF[PDF Exporter (ReportLab)]
```

---

## 🌐 Live Production Deployment Guide

### 1. Push Repository to GitHub
```bash
git init
git add .
git commit -m "InsightForge Production Release"
git remote add origin https://github.com/YOUR_USERNAME/insightforge.git
git branch -M main
git push -u origin main
```

### 2. Deploy Backend to Render.com (100% Free)
1. Go to [Render.com](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository `insightforge`.
3. Set configuration:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables**:
   - `ANTHROPIC_API_KEY` = `your_anthropic_api_key`
   - `ADMIN_USERNAME` = `admin`
   - `ADMIN_PASSWORD` = `insightforge123`
   - `ADMIN_SECRET_TOKEN` = `insightforge_admin_token_secret_998877`
5. Click **Create Web Service**. Render will deploy your backend to `https://insightforge-backend.onrender.com`.

### 3. Deploy Frontend to Vercel (100% Free)
1. Go to [Vercel.com](https://vercel.com) and click **Add New...** $\rightarrow$ **Project**.
2. Import your GitHub repository `insightforge`.
3. Set configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. Add **Environment Variable**:
   - `VITE_API_BASE_URL` = `https://insightforge-backend.onrender.com`
5. Click **Deploy**. Vercel will deploy your live website to `https://insightforge.vercel.app`!

---

## 💻 Local Development Setup

### Backend Server (Port 8000)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend Web App (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

### Admin Access
- Navigate to `http://localhost:5173/admin`
- **Username**: `admin`
- **Password**: `insightforge123`
