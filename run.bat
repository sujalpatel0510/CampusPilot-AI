@echo off
title CampusPilot AI Launcher
echo ==================================================
echo           Starting CampusPilot AI
echo ==================================================

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

set PYTHON_BIN=python
if exist "%ROOT_DIR%backend\.venv\Scripts\python.exe" (
    set PYTHON_BIN="%ROOT_DIR%backend\.venv\Scripts\python.exe"
) else if exist "%ROOT_DIR%backend\venv\Scripts\python.exe" (
    set PYTHON_BIN="%ROOT_DIR%backend\venv\Scripts\python.exe"
)

echo ^>^> Starting FastAPI Backend on http://127.0.0.1:8000...
start "CampusPilot Backend (FastAPI)" cmd /k "cd /d "%ROOT_DIR%backend" && %PYTHON_BIN% -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo ^>^> Starting Next.js Frontend on http://localhost:3000...
start "CampusPilot Frontend (Next.js)" cmd /k "cd /d "%ROOT_DIR%" && npm run dev"

echo.
echo ==================================================
echo   CampusPilot AI is running in separate windows!
echo   - Frontend:  http://localhost:3000
echo   - Backend:   http://127.0.0.1:8000
echo   - API Docs:  http://127.0.0.1:8000/docs
echo ==================================================
echo Close the opened windows or press any key to close this launcher.
pause >nul
