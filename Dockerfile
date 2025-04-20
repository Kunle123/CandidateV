FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create and set permissions on start script
RUN echo '#!/bin/bash\n\
if [ -n "$DATABASE_URL" ]; then\n\
    export SQLALCHEMY_DATABASE_URI="$DATABASE_URL"\n\
fi\n\
python -m alembic upgrade head\n\
PORT="${PORT:-8000}"\n\
echo "Starting server on port $PORT"\n\
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers ${UVICORN_WORKERS:-1}\n' > /app/start.sh && chmod +x /app/start.sh

# Command to run the application
CMD ["/app/start.sh"] 