#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "⚡ [AI-Service] Checking Python environment in $DIR..."

# Verify or create virtual environment
if [ ! -d "$DIR/venv" ]; then
    echo "📦 [AI-Service] Virtual environment not found. Initializing venv..."
    python3 -m venv "$DIR/venv"
    "$DIR/venv/bin/pip" install --upgrade pip
    "$DIR/venv/bin/pip" install -r "$DIR/requirements.txt"
fi

# Ensure dependencies are installed
if [ ! -f "$DIR/venv/bin/uvicorn" ]; then
    echo "📦 [AI-Service] Installing missing dependencies from requirements.txt..."
    "$DIR/venv/bin/pip" install -r "$DIR/requirements.txt"
fi

echo "🚀 [AI-Service] Launching FastAPI RAG backend on http://localhost:8000..."
exec "$DIR/venv/bin/python" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

