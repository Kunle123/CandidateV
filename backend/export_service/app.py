from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
import os
import uuid
import tempfile
from datetime import datetime
from typing import Optional, Dict, Any, List
import asyncio
import json
from fastapi.security import OAuth2PasswordBearer
import jwt
import httpx

# Environment variables
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:3000,https://candidatev.vercel.app").split(",")
JWT_SECRET = os.getenv("JWT_SECRET", "development_secret_key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
CV_SERVICE_URL = os.getenv("CV_SERVICE_URL", "http://localhost:8002")
EXPORT_DIR = os.getenv("EXPORT_DIR", "./exports")
os.makedirs(EXPORT_DIR, exist_ok=True)

# Create FastAPI app
app = FastAPI(title="CandidateV Export Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# Models
class ExportRequest(BaseModel):
    cv_id: str
    format: str = "pdf"
    template_options: Optional[Dict[str, Any]] = None

class ExportResponse(BaseModel):
    id: str
    status: str
    cv_id: str
    format: str
    download_url: Optional[str] = None
    created_at: datetime

class ExportStatusResponse(BaseModel):
    id: str
    status: str
    cv_id: str
    format: str
    download_url: Optional[str] = None
    progress: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

# Mock database for export jobs
EXPORT_JOBS = {}

# Helper function to validate JWT token
async def verify_token(token: Optional[str] = Depends(oauth2_scheme)):
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Verify token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get user ID from payload
        user_id = payload.get("user_id")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {"user_id": user_id}
    
    except (jwt.PyJWTError, Exception) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Helper function to simulate PDF generation
async def generate_pdf(export_id: str, cv_id: str, user_id: str, format: str, template_options: Optional[Dict[str, Any]] = None):
    """
    Simulate the PDF generation process.
    In a real implementation, this would use a PDF library like ReportLab or WeasyPrint.
    """
    if export_id not in EXPORT_JOBS:
        return
    
    # Update job status to processing
    EXPORT_JOBS[export_id]["status"] = "processing"
    EXPORT_JOBS[export_id]["updated_at"] = datetime.utcnow()
    
    # Simulate processing time
    for i in range(1, 6):
        if export_id not in EXPORT_JOBS:  # Job was cancelled
            return
            
        await asyncio.sleep(1)  # Simulate work
        EXPORT_JOBS[export_id]["progress"] = i * 20  # Update progress (0-100%)
    
    # Create a mock PDF file
    filename = f"{export_id}.{format.lower()}"
    filepath = os.path.join(EXPORT_DIR, filename)
    
    with open(filepath, "w") as f:
        f.write(f"Mock {format.upper()} file for CV {cv_id}\n")
        f.write(f"Created at: {datetime.utcnow().isoformat()}\n")
        f.write(f"User ID: {user_id}\n")
        f.write(f"Template options: {json.dumps(template_options or {})}\n")
    
    # Update job status to completed
    EXPORT_JOBS[export_id]["status"] = "completed"
    EXPORT_JOBS[export_id]["download_url"] = f"/api/export/download/{export_id}"
    EXPORT_JOBS[export_id]["updated_at"] = datetime.utcnow()
    EXPORT_JOBS[export_id]["completed_at"] = datetime.utcnow()

# Routes
@app.get("/")
async def root():
    return {"message": "CandidateV Export Service"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "cv_service_connection": "ok"
    }

@app.post("/api/export", response_model=ExportResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_export(
    export_req: ExportRequest,
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_token)
):
    """
    Create a new export job for a CV.
    
    This will start a background task to generate the export file.
    """
    user_id = auth["user_id"]
    
    # Validate format
    if export_req.format.lower() not in ["pdf", "docx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format. Supported formats: pdf, docx"
        )
    
    # Create export job
    export_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    job = {
        "id": export_id,
        "user_id": user_id,
        "cv_id": export_req.cv_id,
        "format": export_req.format.lower(),
        "template_options": export_req.template_options,
        "status": "pending",
        "progress": 0,
        "created_at": now,
        "updated_at": now
    }
    
    # Store job
    EXPORT_JOBS[export_id] = job
    
    # Start background task
    background_tasks.add_task(
        generate_pdf,
        export_id=export_id,
        cv_id=export_req.cv_id,
        user_id=user_id,
        format=export_req.format.lower(),
        template_options=export_req.template_options
    )
    
    # Return response
    return {
        "id": export_id,
        "status": "pending",
        "cv_id": export_req.cv_id,
        "format": export_req.format.lower(),
        "created_at": now
    }

@app.get("/api/export/{export_id}", response_model=ExportStatusResponse)
async def get_export_status(export_id: str, auth: dict = Depends(verify_token)):
    """Get the status of an export job."""
    user_id = auth["user_id"]
    
    # Check if job exists
    if export_id not in EXPORT_JOBS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export job not found"
        )
    
    # Check if user owns the job
    job = EXPORT_JOBS[export_id]
    if job["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this export job"
        )
    
    # Return job status
    return job

@app.get("/api/export/download/{export_id}")
async def download_export(export_id: str, auth: dict = Depends(verify_token)):
    """Download the exported file."""
    user_id = auth["user_id"]
    
    # Check if job exists
    if export_id not in EXPORT_JOBS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export job not found"
        )
    
    # Check if user owns the job
    job = EXPORT_JOBS[export_id]
    if job["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this export job"
        )
    
    # Check if job is completed
    if job["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Export job is not completed yet"
        )
    
    # Check if file exists
    filename = f"{export_id}.{job['format']}"
    filepath = os.path.join(EXPORT_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export file not found"
        )
    
    # Return file
    return FileResponse(
        filepath,
        filename=f"cv_{job['cv_id']}.{job['format']}"
    )

@app.delete("/api/export/{export_id}")
async def cancel_export(export_id: str, auth: dict = Depends(verify_token)):
    """Cancel an export job and delete any generated files."""
    user_id = auth["user_id"]
    
    # Check if job exists
    if export_id not in EXPORT_JOBS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export job not found"
        )
    
    # Check if user owns the job
    job = EXPORT_JOBS[export_id]
    if job["user_id"] != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this export job"
        )
    
    # Delete the job
    del EXPORT_JOBS[export_id]
    
    # Delete the file if it exists
    filename = f"{export_id}.{job['format']}"
    filepath = os.path.join(EXPORT_DIR, filename)
    
    if os.path.exists(filepath):
        os.remove(filepath)
    
    return {"message": "Export job cancelled"}

# For testing and development
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8003"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True) 