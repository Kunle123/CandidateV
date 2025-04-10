from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
import os
from datetime import datetime, timedelta
import uuid

# Create FastAPI app
app = FastAPI(title="CandidateV Auth Service")

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int

class RefreshRequest(BaseModel):
    refresh_token: str

class MessageResponse(BaseModel):
    message: str

# Sample user database (in-memory for demo)
fake_users_db = {}

# Basic routes
@app.get("/")
async def root():
    return {"message": "CandidateV Authentication Service"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "database_connection": "ok"
    }

@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    # Check if user exists
    if user_data.email in fake_users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user (no real password hashing for demo)
    user_id = str(uuid.uuid4())
    created_at = datetime.utcnow()
    
    fake_users_db[user_data.email] = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": user_data.password,  # In a real app, this would be hashed
        "created_at": created_at
    }
    
    return {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "created_at": created_at
    }

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Check if user exists and password is correct
    if form_data.username not in fake_users_db or fake_users_db[form_data.username]["password"] != form_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens (no real JWT for demo)
    access_token = f"fake_access_token_{uuid.uuid4()}"
    refresh_token = f"fake_refresh_token_{uuid.uuid4()}"
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 1800  # 30 minutes
    }

@app.post("/api/auth/logout", response_model=MessageResponse)
async def logout():
    return {"message": "Successfully logged out"}

# For testing Railway deployment
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app:app", host="0.0.0.0", port=port) 