FROM python:3.11-slim

WORKDIR /app

# Install required packages directly
RUN pip install --no-cache-dir fastapi==0.109.0 \
    uvicorn==0.26.0 \
    sqlalchemy==2.0.27 \
    psycopg2-binary==2.9.9 \
    pydantic==2.6.1 \
    pydantic-settings==2.1.0 \
    python-jose==3.3.0 \
    python-multipart==0.0.6 \
    alembic==1.13.1 \
    asyncpg==0.29.0 \
    fastapi-limiter==0.1.5 \
    aioredis==2.0.1 \
    python-dotenv==1.0.0 \
    boto3==1.33.9 \
    pillow==10.1.0 \
    email-validator

# Copy app files
COPY app.py ./

# Create uploads directory if using local storage
RUN mkdir -p ./uploads

# Use app.py for the FastAPI application
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"] 