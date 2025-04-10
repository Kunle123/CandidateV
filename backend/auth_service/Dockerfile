FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir uvicorn

# Create a simple test app
RUN echo 'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\ndef read_root():\n    return {"Hello": "World"}\n\n@app.get("/health")\ndef health():\n    return {"status": "healthy"}' > test_app.py

COPY . .

# Use simple app for testing
CMD ["python", "-m", "uvicorn", "test_app:app", "--host", "0.0.0.0", "--port", "8000"] 