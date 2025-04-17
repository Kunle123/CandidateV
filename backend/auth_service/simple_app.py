"""
Simple standalone FastAPI application for health checks
This file doesn't depend on any project-specific imports
"""
from fastapi import FastAPI
import os

app = FastAPI(title="CandidateV Authentication Service")

@app.get("/")
async def root():
    return {"message": "CandidateV Authentication Service"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/health")
async def api_health():
    return {"status": "healthy", "version": "1.0.0"}

# For direct execution
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("simple_app:app", host="0.0.0.0", port=port) 