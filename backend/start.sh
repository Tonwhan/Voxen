#!/bin/bash

# Voxen CAD Universal Startup Script
# Works locally and on server

# 1. Load Environment Variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "--- Environment loaded from .env ---"
else
    echo "--- WARNING: .env file not found. Using defaults. ---"
fi

# 2. Check for Virtual Environment
if [ -d "venv" ]; then
    echo "--- Activating virtual environment ---"
    source venv/bin/activate
else
    echo "--- No venv found. Running with system python. ---"
fi

# 3. Start Backend
echo "--- Starting Voxen CAD Server on port ${PORT:-5000} ---"
python3 app.py
