FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir uvicorn

# Verify uvicorn is installed and in PATH
RUN which uvicorn || echo "uvicorn not found in PATH"

COPY . .

# Create uploads directory if using local storage
RUN mkdir -p ./uploads

# Use python -m to run uvicorn instead of direct command
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"] 