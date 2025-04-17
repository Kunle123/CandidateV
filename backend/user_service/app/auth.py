from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import os
from datetime import datetime

from .database import get_db_session
from .models import UserProfile

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Environment variables for JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET environment variable is not set")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db_session)):
    """Validate the JWT token and return the current user's profile."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the JWT
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        # Check token expiration
        exp = payload.get("exp")
        if exp is None or datetime.utcnow().timestamp() > exp:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
        
    # Get the user profile
    user_profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    
    # If user profile doesn't exist, create a stub one
    if not user_profile:
        user_profile = UserProfile(id=user_id)
        db.add(user_profile)
        db.commit()
        db.refresh(user_profile)
        
    return user_profile 