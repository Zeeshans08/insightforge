@echo off
echo Starting InsightForge Full-Stack Platform...

start "InsightForge Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"
start "InsightForge Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Backend running on http://localhost:8000
echo Frontend running on http://localhost:5173
