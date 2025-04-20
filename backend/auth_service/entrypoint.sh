#!/bin/sh
set -e

# Default port value if PORT environment variable is not set
DEFAULT_PORT=8001 # Default auth service port

# Use PORT environment variable or default value
PORT=${PORT:-$DEFAULT_PORT}

echo "Waiting 5 seconds for database to be ready..."
sleep 5

echo "Starting main Authentication Service on port $PORT with TRACE logging"

# Run the main application defined in main.py
# Use --log-level trace for maximum verbosity
uvicorn main:app --host 0.0.0.0 --port $PORT --log-level trace

# Fallback to simple_app only if main:app fails catastrophically (unlikely with set -e)
# echo "Failed to start main app, falling back to simple_app (This should not happen)" 
# uvicorn simple_app:app --host 0.0.0.0 --port $PORT --log-level info 