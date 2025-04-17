#!/bin/sh
set -e

# Default port value if PORT environment variable is not set
DEFAULT_PORT=8000

# Use PORT environment variable or default value
PORT=${PORT:-$DEFAULT_PORT}

echo "Starting server on port $PORT"

# First try to run the simple_app (guaranteed to work)
uvicorn simple_app:app --host 0.0.0.0 --port $PORT 