FROM python:3.11-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    dos2unix \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Convert line endings for shell scripts (fix Windows/Linux compatibility)
RUN dos2unix /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create directory for health check file
RUN mkdir -p /app/storage

# Print directory contents for debugging
RUN ls -la /app
RUN cat /app/simple_app.py
RUN cat /app/entrypoint.sh

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["/app/entrypoint.sh"] 