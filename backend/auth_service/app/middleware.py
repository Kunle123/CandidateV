from fastapi import Request, HTTPException, status
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import os
import logging

# Import redis instead of aioredis for Python 3.11 compatibility
import redis.asyncio as redis_asyncio

logger = logging.getLogger(__name__)

async def setup_rate_limiter():
    """Set up the rate limiter with Redis."""
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        logger.warning("REDIS_URL environment variable is not set. Rate limiting disabled.")
        return
    
    try:
        # Use redis.asyncio instead of aioredis
        redis = redis_asyncio.from_url(redis_url)
        await FastAPILimiter.init(redis)
        logger.info("Rate limiter initialized with Redis")
    except Exception as e:
        logger.error(f"Failed to initialize rate limiter: {str(e)}")
        logger.warning("Rate limiting disabled due to error.")

# Define rate limiters for different endpoints
login_limiter = RateLimiter(times=5, seconds=60)  # 5 requests per minute for login
register_limiter = RateLimiter(times=3, seconds=60)  # 3 requests per minute for registration 