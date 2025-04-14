from fastapi import FastAPI
import os
from datetime import datetime

# Create FastAPI app
app = FastAPI(title="CandidateV CV Service - Simplified")

# Basic routes
@app.get("/")
async def root():
    return {"message": "CandidateV CV Service - Simplified Version"}

@app.get("/api/health")
async def health_check():
    """Health check endpoint for deployment verification"""
    import sys
    import platform
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": {
            "python_version": sys.version,
            "platform": platform.platform(),
            "cwd": os.getcwd(),
            "files": os.listdir(".")[:10]  # First 10 files
        }
    }

@app.get("/api/cv/templates")
async def get_templates():
    """Get a simplified list of CV templates."""
    return [
        {
            "id": "default",
            "name": "Professional",
            "category": "Professional"
        },
        {
            "id": "modern",
            "name": "Modern",
            "category": "Creative"
        },
        {
            "id": "minimalist",
            "name": "Minimalist",
            "category": "Simple"
        }
    ]

@app.get("/api/cv")
async def get_cvs():
    """Get a sample CV."""
    return [
        {
            "id": "sample-cv-1",
            "user_id": "test-user",
            "metadata": {
                "name": "My Sample CV",
                "version": 1,
                "last_modified": datetime.utcnow().isoformat()
            },
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    ]

# For testing and development
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8002"))
    uvicorn.run("app_simplified:app", host="0.0.0.0", port=port, reload=True) 