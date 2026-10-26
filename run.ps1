# CampusPilot AI Launcher (PowerShell)
$ErrorActionPreference = "Stop"

$RootDir = $PSScriptRoot
Set-Location $RootDir

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "          Starting CampusPilot AI                 " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$PythonBin = "python"
if (Test-Path "$RootDir\backend\.venv\Scripts\python.exe") {
    $PythonBin = "$RootDir\backend\.venv\Scripts\python.exe"
} elseif (Test-Path "$RootDir\backend\venv\Scripts\python.exe") {
    $PythonBin = "$RootDir\backend\venv\Scripts\python.exe"
}

Write-Host ">> Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootDir\backend'; & '$PythonBin' -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host ">> Starting Next.js Frontend on http://localhost:3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootDir'; npm run dev"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  CampusPilot AI is running in separate windows!   " -ForegroundColor Yellow
Write-Host "  - Frontend:  http://localhost:3000              " -ForegroundColor White
Write-Host "  - Backend:   http://127.0.0.1:8000             " -ForegroundColor White
Write-Host "  - API Docs:  http://127.0.0.1:8000/docs        " -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan
