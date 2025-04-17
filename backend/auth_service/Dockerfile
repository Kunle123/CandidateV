FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

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

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application directly with app:app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"] 