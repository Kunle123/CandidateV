"""Rate limiting middleware for FastAPI."""
from typing import Tuple, Optional
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import asyncio
from collections import defaultdict

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        calls: int = 100,
        period: int = 60,
        exclude_paths: Optional[list] = None
    ):
        """Initialize rate limiter.
        
        Args:
            app: The ASGI application
            calls: Number of calls allowed per period
            period: Time period in seconds
            exclude_paths: List of paths to exclude from rate limiting
        """
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.exclude_paths = exclude_paths or []
        self.requests = defaultdict(list)  # IP -> List[timestamp]
        self._cleanup_task = None

    async def cleanup_old_requests(self):
        """Remove expired request records."""
        while True:
            now = datetime.utcnow()
            cutoff = now - timedelta(seconds=self.period)
            
            for ip in list(self.requests.keys()):
                self.requests[ip] = [
                    ts for ts in self.requests[ip]
                    if ts > cutoff
                ]
                if not self.requests[ip]:
                    del self.requests[ip]
            
            await asyncio.sleep(60)  # Run cleanup every minute

    def should_exclude(self, path: str) -> bool:
        """Check if path should be excluded from rate limiting."""
        return any(path.startswith(excluded) for excluded in self.exclude_paths)

    def get_client_ip(self, request: Request) -> str:
        """Get client IP from request headers or connection info."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next):
        """Handle incoming request with rate limiting."""
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self.cleanup_old_requests())

        if self.should_exclude(request.url.path):
            return await call_next(request)

        client_ip = self.get_client_ip(request)
        now = datetime.utcnow()
        
        # Remove old requests
        cutoff = now - timedelta(seconds=self.period)
        self.requests[client_ip] = [
            ts for ts in self.requests[client_ip]
            if ts > cutoff
        ]
        
        # Check rate limit
        if len(self.requests[client_ip]) >= self.calls:
            oldest = min(self.requests[client_ip])
            reset_time = oldest + timedelta(seconds=self.period)
            reset_seconds = int((reset_time - now).total_seconds())
            
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Too many requests",
                    "reset_after_seconds": reset_seconds,
                    "limit": self.calls,
                    "period_seconds": self.period
                }
            )
        
        # Add current request
        self.requests[client_ip].append(now)
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = self.calls - len(self.requests[client_ip])
        response.headers["X-RateLimit-Limit"] = str(self.calls)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int((now + timedelta(seconds=self.period)).timestamp()))
        
        return response 