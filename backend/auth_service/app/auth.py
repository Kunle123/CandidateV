from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import logging

from .database import get_db_session
from .models import User, RefreshToken
from .schemas import UserCreate, UserResponse, Token, RefreshToken as RefreshTokenSchema, TokenResponse, MessageResponse
from .security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, oauth2_scheme

# Get a logger instance
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db_session)):
    token_data = decode_access_token(token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db_session)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

# --- Simplified Login Endpoint for Debugging (Commented Out) ---
# @router.post("/login", methods=["POST"]) # Explicitly add methods=["POST"]
# async def login_simplified(request: Request): # Accept raw Request
#     logger.info(f"=== SIMPLIFIED LOGIN ENDPOINT HIT (POST specified) ===") # Updated log message
#     body = await request.body()
#     logger.info(f"Raw request body received: {body.decode()}")
#     # Just return a dummy success to test routing
#     return {"message": "Simplified login endpoint reached successfully (POST specified)", "received_body": body.decode()}
# --- End Simplified Login Endpoint ---

# --- Original Login Function (Restored) ---
@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db_session)):
    logger.info(f"=== LOGIN ENDPOINT HIT === User attempt: {form_data.username}") 
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        logger.warning(f"Login failed for user: {form_data.username} - User not found") 
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password", # Keep detail generic for security
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Login failed for user: {form_data.username} - Incorrect password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password", # Keep detail generic
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Check if user is active (if you have an is_active flag)
    # if not user.is_active:
    #     logger.warning(f"Login failed for inactive user: {form_data.username}")
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST, 
    #         detail="Inactive user"
    #     )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, # Use user.id as subject
        expires_delta=access_token_expires
    )
    refresh_token_value = create_refresh_token()
    refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_value,
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    try:
        db.add(refresh_token)
        db.commit()
        logger.info(f"Login successful for user: {form_data.username}")
    except Exception as e:
        db.rollback()
        logger.error(f"Database error during login for user {form_data.username}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login. Please try again."
        )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_value,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }
# --- End Original Login Function ---

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: RefreshTokenSchema, db: Session = Depends(get_db_session)):
    # Find the refresh token
    token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token.refresh_token,
        RefreshToken.expires_at > datetime.utcnow(),
        RefreshToken.revoked == False
    ).first()
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(token.user_id)},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/logout", response_model=MessageResponse)
async def logout(refresh_token: RefreshTokenSchema, current_user: User = Depends(get_current_user), db: Session = Depends(get_db_session)):
    # Find and revoke the refresh token
    token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token.refresh_token,
        RefreshToken.user_id == current_user.id
    ).first()
    
    if token:
        token.revoked = True
        db.commit()
    
    return {"message": "Successfully logged out"} 