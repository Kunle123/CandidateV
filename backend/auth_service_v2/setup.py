"""Setup file for the auth service package."""
from setuptools import setup, find_packages

setup(
    name="auth_service",
    version="2.0.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.109.2",
        "uvicorn>=0.27.1",
        "sqlalchemy>=2.0.27",
        "asyncpg>=0.29.0",
        "python-jose>=3.3.0",
        "passlib[bcrypt]>=1.7.4",
        "aiofiles>=24.1.0",
        "python-multipart>=0.0.9",
        "email-validator>=2.1.0",
        "pydantic>=2.6.1",
        "pydantic-settings>=2.1.0",
        "aiosqlite>=0.21.0",  # For testing
    ],
    extras_require={
        'test': [
            'pytest>=8.0.0',
            'pytest-asyncio>=0.23.5',
            'pytest-cov>=4.1.0',
            'httpx>=0.26.0',  # For async HTTP client
            'asgi-lifespan>=2.1.0',  # For ASGI app lifecycle management
        ],
    },
    python_requires='>=3.9',
) 