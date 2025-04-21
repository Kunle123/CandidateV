import os
from dotenv import load_dotenv
import openai
from typing import Optional, Dict, Any

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import time
import uuid
import sys

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("ai_service")

# Create FastAPI app
app = FastAPI(
    title="CandidateV AI Optimization Service",
    description="AI-powered CV optimization and analysis for the CandidateV application",
    version="1.0.0",
)

# Import routers after creating app to avoid circular imports
from app.health import router as health_router
from app.analysis import router as analysis_router
from app.optimization import router as optimization_router
from app.job_match import router as job_match_router
from app.cover_letter import router as cover_letter_router

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:3000,https://candidate-v-frontend.vercel.app").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request ID and logging middleware
@app.middleware("http")
async def add_request_id_and_log(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    start_time = time.time()
    logger.info(f"Request started: {request.method} {request.url.path} (ID: {request_id})")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"Request completed: {request.method} {request.url.path} "
                f"(ID: {request_id}) - Status: {response.status_code} - Time: {process_time:.3f}s")
    
    response.headers["X-Request-ID"] = request_id
    return response

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
openai_client = None
if openai_api_key:
    openai_client = openai.OpenAI(api_key=openai_api_key)

def get_mock_analysis() -> Dict[str, Any]:
    """Return mock analysis data when OpenAI is not available"""
    return {
        "match_score": 65,
        "strengths": [
            "Strong technical background",
            "Good communication skills",
            "Project management experience"
        ],
        "weaknesses": [
            "Limited leadership experience",
            "Could improve industry-specific knowledge"
        ],
        "missing_keywords": [
            "agile methodology",
            "cloud infrastructure",
            "team leadership"
        ]
    }

@app.post("/analyze")
async def analyze_cv(cv_id: str, job_description: str) -> Dict[str, Any]:
    """Analyze CV against job description"""
    if not openai_client:
        # Return mock data with a warning
        return {
            "success": True,
            "data": get_mock_analysis(),
            "warning": "Using mock data - AI service is currently offline"
        }
        
    try:
        # Your existing OpenAI analysis code here
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a CV analysis expert. Analyze the CV against the job description."
                },
                {
                    "role": "user", 
                    "content": f"Analyze this CV (ID: {cv_id}) against the job description: {job_description}"
                }
            ]
        )
        
        # Process OpenAI response
        analysis = response.choices[0].message.content
        
        return {
            "success": True,
            "data": analysis
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze CV: {str(e)}"
        )

# Register routers
app.include_router(health_router)
app.include_router(analysis_router)
app.include_router(optimization_router)
app.include_router(job_match_router)
app.include_router(cover_letter_router)

@app.on_event("startup")
async def startup():
    logger.info("Starting up AI Optimization Service")

@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down AI Optimization Service")

@app.get("/")
async def root():
    return {"message": "CandidateV AI Optimization Service"}

# Run debug server if executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8004"))) 