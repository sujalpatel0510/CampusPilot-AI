#!/usr/bin/env bash

# CampusPilot AI — One-click launcher for Frontend & Backend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=================================================="
echo "          Starting CampusPilot AI                 "
echo "=================================================="

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup INT TERM EXIT

# Detect Python virtualenv executable (supports Windows, Git Bash & Linux/macOS)
if [ -f "$SCRIPT_DIR/backend/.venv/Scripts/python.exe" ]; then
    PYTHON_BIN="$SCRIPT_DIR/backend/.venv/Scripts/python.exe"
elif [ -f "$SCRIPT_DIR/backend/.venv/bin/python" ]; then
    PYTHON_BIN="$SCRIPT_DIR/backend/.venv/bin/python"
elif [ -f "$SCRIPT_DIR/backend/venv/Scripts/python.exe" ]; then
    PYTHON_BIN="$SCRIPT_DIR/backend/venv/Scripts/python.exe"
elif [ -f "$SCRIPT_DIR/backend/venv/bin/python" ]; then
    PYTHON_BIN="$SCRIPT_DIR/backend/venv/bin/python"
else
    PYTHON_BIN="python"
fi

echo ">> Using Python: $PYTHON_BIN"

# 1. Start Backend Server
echo ">> Launching FastAPI Backend on http://127.0.0.1:8000..."
cd "$SCRIPT_DIR/backend"
"$PYTHON_BIN" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait 2 seconds for backend initialization
sleep 2

# 2. Start Frontend Server
echo ">> Launching Next.js Frontend on http://localhost:3000..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=================================================="
echo "  CampusPilot AI is running!"
echo "  - Frontend:  http://localhost:3000"
echo "  - Backend:   http://127.0.0.1:8000"
echo "  - API Docs:  http://127.0.0.1:8000/docs"
echo "=================================================="
echo "Press Ctrl+C to stop both servers."
echo ""

# Wait for both processes
wait
