from fastapi import HTTPException, status
from typing import Any, Optional

class AuthError(HTTPException):
    """Base class for authentication errors"""
    def __init__(
        self,
        detail: str,
        status_code: int = status.HTTP_401_UNAUTHORIZED,
        headers: Optional[dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)

class InvalidCredentialsError(AuthError):
    """Raised when credentials are invalid"""
    def __init__(self):
        super().__init__(
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )

class TokenExpiredError(AuthError):
    """Raised when token has expired"""
    def __init__(self):
        super().__init__(
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )

class InvalidTokenError(AuthError):
    """Raised when token is invalid"""
    def __init__(self):
        super().__init__(
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )

class UserNotFoundError(HTTPException):
    """Raised when user is not found"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

class EmailAlreadyExistsError(HTTPException):
    """Raised when email is already registered"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

class InvalidPasswordError(HTTPException):
    """Raised when password doesn't meet requirements"""
    def __init__(self, message: str = "Password does not meet security requirements"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

class RateLimitExceededError(HTTPException):
    """Raised when rate limit is exceeded"""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        )

class EmailVerificationError(HTTPException):
    """Raised when there's an email verification issue"""
    def __init__(self, message: str = "Email verification failed"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

class PermissionDeniedError(HTTPException):
    """Raised when user doesn't have required permissions"""
    def __init__(self, message: str = "Permission denied"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message
        )

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
) 