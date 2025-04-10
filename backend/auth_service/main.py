from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World from root main.py"}

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "timestamp": "2025-04-10T12:00:00Z",
        "version": "1.0.0",
        "database_connection": "ok"
    } 