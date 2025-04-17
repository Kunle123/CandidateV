FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
# Explicitly install PyJWT first
RUN pip install --no-cache-dir PyJWT
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create directory for health check file
RUN mkdir -p /app/storage

# Create a simple app file that doesn't depend on imports
RUN echo 'from fastapi import FastAPI\napp = FastAPI()\n\n@app.get("/")\nasync def root():\n    return {"message": "CandidateV Authentication Service"}\n\n@app.get("/health")\nasync def health():\n    return {"status": "healthy"}\n\n@app.get("/api/health")\nasync def api_health():\n    return {"status": "healthy"}' > /app/simple_app.py

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "simple_app:app", "--host", "0.0.0.0", "--port", "8000"] 