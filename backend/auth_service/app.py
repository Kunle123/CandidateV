from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
import os
from datetime import datetime, timedelta
import uuid
import jwt
from typing import Optional, Dict
from sqlalchemy.orm import Session

from app.database import get_db_session
from app.models import User as UserModel, RefreshToken as RefreshTokenModel, ResetToken as ResetTokenModel
from app.schemas import UserCreate, UserResponse, Token, RefreshToken, MessageResponse, ForgotPasswordRequest, ResetPasswordRequest
from app import services

# Environment variables
SECRET_KEY = os.getenv("JWT_SECRET", "development_secret_key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost,http://localhost:3000,https://candidatev.vercel.app").split(",")
RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "15"))

# Create FastAPI app
app = FastAPI(title="CandidateV Auth Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Basic routes
@app.get("/")
async def root():
    return {"message": "CandidateV Authentication Service"}

@app.get("/api/health")
async def health_check():
    # Check database connection by running a simple query
    db = next(get_db_session())
    try:
        db.execute("SELECT 1")
        db_status = "ok"
    except Exception:
        db_status = "error"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "database_connection": db_status
    }

@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db_session)):
    # Check if user exists
    db_user = services.get_user_by_email(db, user_data.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = services.create_user(db, user_data.email, user_data.password, user_data.name)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at
    )

@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db_session)):
    # Check if user exists
    user = services.get_user_by_email(db, form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not services.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = services.create_access_token(
        data={"sub": user.email, "user_id": str(user.id)},
        expires_delta=access_token_expires
    )
    
    # Create refresh token
    refresh_token = services.create_refresh_token(db, user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token.token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # in seconds
    }

@app.post("/api/auth/refresh", response_model=Token)
async def refresh_token(refresh_request: RefreshToken, db: Session = Depends(get_db_session)):
    # Verify refresh token
    db_token = services.verify_refresh_token(db, refresh_request.refresh_token)
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user
    user = services.get_user_by_id(db, db_token.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new tokens
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = services.create_access_token(
        data={"sub": user.email, "user_id": str(user.id)},
        expires_delta=access_token_expires
    )
    
    # Create new refresh token
    new_refresh_token = services.create_refresh_token(db, user.id)
    
    # Revoke old token
    services.revoke_refresh_token(db, refresh_request.refresh_token)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token.token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # in seconds
    }

@app.post("/api/auth/logout", response_model=MessageResponse)
async def logout(refresh_request: RefreshToken, db: Session = Depends(get_db_session)):
    # Revoke the token
    success = services.revoke_refresh_token(db, refresh_request.refresh_token)
    
    # Always return success, even if token wasn't found
    return {"message": "Successfully logged out"}

@app.get("/api/auth/verify")
async def verify_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db_session)):
    try:
        # Decode token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user_id = payload.get("user_id")
        
        # Check if it's a refresh token
        if payload.get("refresh"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if user exists
        user = services.get_user_by_email(db, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {
            "user_id": user_id,
            "email": email,
            "expires_at": datetime.fromtimestamp(payload.get("exp")).isoformat()
        }
        
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.post("/api/auth/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db_session)):
    # Check if user exists
    user = services.get_user_by_email(db, request.email)
    
    # Always return a success message even if the user doesn't exist
    # This prevents user enumeration attacks
    if not user:
        return {"message": "If your email is registered, you will receive a password reset link"}
    
    # Generate reset token
    reset_token = services.create_password_reset_token(db, user.id)
    
    # In a real implementation, send an email with the token
    # For this demo, we'll just print it to the console
    print(f"Password reset email sent to {user.email} with token: {reset_token.token}")
    
    return {"message": "If your email is registered, you will receive a password reset link"}

@app.post("/api/auth/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db_session)):
    # Check if token exists and is valid
    token = services.verify_reset_token(db, request.token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    # Reset the password
    success = services.reset_password(db, token.user_id, request.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to reset password"
        )
    
    # Mark token as used
    services.mark_reset_token_used(db, token.id)
    
    # Revoke all refresh tokens for the user for security
    services.revoke_all_user_tokens(db, token.user_id)
    
    return {"message": "Password has been reset successfully"}

# Clean up expired tokens periodically
@app.on_event("startup")
async def startup_event():
    # This would typically be done by a background task or cron job
    # For simplicity, we'll do it on startup
    db = next(get_db_session())
    result = services.clean_expired_tokens(db)
    print(f"Cleaned up {result['refresh_tokens']} expired refresh tokens and {result['reset_tokens']} reset tokens")

# For testing and development
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True) 