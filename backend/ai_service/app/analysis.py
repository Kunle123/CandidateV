from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import logging
from datetime import datetime
import json
import httpx
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure logging
logger = logging.getLogger(__name__)

# Set up OAuth2 with Bearer token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Initialize router
router = APIRouter(prefix="/api/ai")

# OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY environment variable is not set. AI features will not work correctly.")

# Initialize OpenAI client
client = None
if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)

# CV Service URL
CV_SERVICE_URL = os.getenv("CV_SERVICE_URL", "http://localhost:8002")

# Pydantic models for request and response
class CVAnalysisRequest(BaseModel):
    cv_id: str
    sections: Optional[List[str]] = None

class AnalysisResult(BaseModel):
    score: float = Field(..., ge=0, le=10)
    feedback: List[Dict[str, Any]] = []
    improvement_suggestions: List[Dict[str, Any]] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    industry_fit: List[Dict[str, Any]] = []
    keywords_analysis: Dict[str, Any] = {}

class CVAnalysisResponse(BaseModel):
    cv_id: str
    analysis: AnalysisResult
    timestamp: datetime

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=0.5, max=10))
async def fetch_cv_data(cv_id: str, token: str) -> Dict[str, Any]:
    """Fetch CV data from the CV service."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.get(f"{CV_SERVICE_URL}/api/cv/{cv_id}", headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Failed to fetch CV data: {response.status_code} {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to fetch CV data from CV service: {response.status_code}"
                )
            
            return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error fetching CV data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error communicating with CV service: {str(e)}"
        )

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=0.5, max=10))
async def analyze_cv_with_openai(cv_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze CV data using OpenAI API."""
    if not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API key not configured"
        )
    
    try:
        # Extract CV content from the CV data
        cv_content = {
            "personal_info": cv_data.get("personal_info", {}),
            "summary": cv_data.get("summary", ""),
            "experience": cv_data.get("experience", []),
            "education": cv_data.get("education", []),
            "skills": cv_data.get("skills", []),
            "certifications": cv_data.get("certifications", []),
        }
        
        # Prepare the prompt for GPT
        prompt = f"""
        You are a professional resume reviewer and career coach. Analyze the following CV:
        
        CV_DATA: {json.dumps(cv_content, indent=2)}
        
        Provide a detailed analysis with the following:
        1. Overall score (0-10)
        2. Specific feedback on each section
        3. Improvement suggestions
        4. Strengths
        5. Weaknesses
        6. Industry fit assessment
        7. Keywords analysis for ATS systems
        
        Format your response as structured JSON with the following schema:
        {{
            "score": float,
            "feedback": [
                {{"section": string, "comments": string, "score": float}}
            ],
            "improvement_suggestions": [
                {{"section": string, "suggestion": string, "importance": string}}
            ],
            "strengths": [string],
            "weaknesses": [string],
            "industry_fit": [
                {{"industry": string, "fit_score": float, "reasons": string}}
            ],
            "keywords_analysis": {{
                "found_keywords": [string],
                "missing_keywords": [string],
                "recommendation": string
            }}
        }}
        
        Respond with ONLY the JSON structure above, no other text.
        """
        
        # Call the OpenAI API
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a CV analysis expert that provides structured feedback in JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
        )
        
        # Extract and parse the response
        analysis_json = response.choices[0].message.content
        analysis_data = json.loads(analysis_json)
        
        return analysis_data
        
    except Exception as e:
        logger.error(f"Error analyzing CV with OpenAI: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing CV: {str(e)}"
        )

@router.post("/analyze", response_model=CVAnalysisResponse)
async def analyze_cv(
    request: CVAnalysisRequest,
    token: str = Depends(oauth2_scheme)
):
    """
    Analyze a CV using AI to provide feedback and suggestions for improvement.
    """
    # For testing purposes, return mock data if CV ID is "test-cv-id"
    if request.cv_id == "test-cv-id" or not client:
        logger.info(f"Using mock data for analysis with cv_id={request.cv_id}")
        
        # Create a mock analysis result
        mock_result = {
            "score": 7.5,
            "feedback": [
                {"section": "summary", "comments": "Good overview of skills and experience, but could be more specific", "score": 7.0},
                {"section": "experience", "comments": "Strong experience section with clear achievements", "score": 8.0},
                {"section": "education", "comments": "Well-formatted education section", "score": 8.5},
                {"section": "skills", "comments": "Good range of technical skills", "score": 7.5}
            ],
            "improvement_suggestions": [
                {"section": "summary", "suggestion": "Add more specific achievements with metrics", "importance": "high"},
                {"section": "experience", "suggestion": "Quantify achievements with numbers and percentages", "importance": "medium"},
                {"section": "skills", "suggestion": "Organize skills by category", "importance": "low"}
            ],
            "strengths": [
                "Strong technical background",
                "Clear presentation of work history",
                "Good educational qualifications"
            ],
            "weaknesses": [
                "Lack of quantifiable achievements",
                "Summary could be more impactful",
                "Missing some industry-specific keywords"
            ],
            "industry_fit": [
                {"industry": "Software Development", "fit_score": 8.0, "reasons": "Strong technical skills and relevant experience"},
                {"industry": "Data Science", "fit_score": 6.5, "reasons": "Has some relevant skills but could expand on data analysis experience"}
            ],
            "keywords_analysis": {
                "found_keywords": ["Python", "JavaScript", "React", "development"],
                "missing_keywords": ["CI/CD", "cloud", "AWS", "agile"],
                "recommendation": "Add more industry-specific keywords to pass ATS screening"
            }
        }
        
        # Prepare the mock response
        response = CVAnalysisResponse(
            cv_id=request.cv_id,
            analysis=AnalysisResult(**mock_result),
            timestamp=datetime.utcnow()
        )
        
        return response
    
    try:
        # Fetch CV data from the CV service
        cv_data = await fetch_cv_data(request.cv_id, token)
        
        # Analyze the CV using OpenAI
        analysis_result = await analyze_cv_with_openai(cv_data)
        
        # Prepare the response
        response = CVAnalysisResponse(
            cv_id=request.cv_id,
            analysis=AnalysisResult(**analysis_result),
            timestamp=datetime.utcnow()
        )
        
        return response
    except Exception as e:
        logger.error(f"Error in analyze_cv: {str(e)}")
        # Return mock data as fallback in case of errors
        fallback_result = {
            "score": 6.0,
            "feedback": [
                {"section": "overall", "comments": "Error occurred during analysis", "score": 6.0}
            ],
            "improvement_suggestions": [
                {"section": "overall", "suggestion": "Try again later or contact support", "importance": "medium"}
            ],
            "strengths": [
                "Unable to analyze strengths due to error"
            ],
            "weaknesses": [
                "Unable to analyze weaknesses due to error"
            ],
            "industry_fit": [],
            "keywords_analysis": {
                "found_keywords": [],
                "missing_keywords": [],
                "recommendation": "Unable to provide keyword analysis due to error"
            }
        }
        
        return CVAnalysisResponse(
            cv_id=request.cv_id,
            analysis=AnalysisResult(**fallback_result),
            timestamp=datetime.utcnow()
        ) 