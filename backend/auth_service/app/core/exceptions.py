from fastapi import HTTPException, status
from typing import Any, Optional

class AuthError(HTTPException):
    def __init__(
        self,
        detail: str,
        status_code: int = status.HTTP_401_UNAUTHORIZED,
        headers: Optional[dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)

class InvalidCredentialsError(AuthError):
    def __init__(self):
        super().__init__(
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )

class TokenExpiredError(AuthError):
    def __init__(self):
        super().__init__(
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )

class InvalidTokenError(AuthError):
    def __init__(self):
        super().__init__(
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )

class UserNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

class EmailAlreadyExistsError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

class InvalidPasswordError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password does not meet security requirements"
        )

class RateLimitExceededError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later."
        ) 