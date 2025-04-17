FROM python:3.9-slim

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install additional dependencies
RUN pip install boto3
RUN pip install psycopg2-binary
RUN pip install alembic

# Create shared folder structure needed by the app
RUN mkdir -p shared/contracts

# Copy application code
COPY . .

# Copy shared contracts if they exist in the parent directory 
# This is wrapped in a conditional to avoid failure if files don't exist
RUN if [ -d "../shared" ]; then cp -r ../shared/* shared/ || true; fi

# Create a shared_fallback.py if it doesn't exist
RUN touch shared_fallback.py

# Ensure PostgreSQL client is available for database migrations
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Default port
ENV PORT=8001

# Run database migrations if DATABASE_URL is provided
# Otherwise skip and continue
CMD if [ -n "$DATABASE_URL" ]; then \
      alembic upgrade head; \
    fi && \
    python -m uvicorn main:app --host 0.0.0.0 --port $PORT 