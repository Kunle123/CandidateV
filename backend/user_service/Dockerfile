FROM python:3.11-slim

WORKDIR /app

# Install core dependencies first
RUN pip install --no-cache-dir fastapi==0.109.0 uvicorn==0.26.0 pydantic==2.6.1 email-validator

# Install database related dependencies
RUN pip install --no-cache-dir sqlalchemy==2.0.27 psycopg2-binary==2.9.9 alembic==1.13.1 asyncpg==0.29.0

# Install remaining dependencies in groups
RUN pip install --no-cache-dir pydantic-settings==2.1.0 python-jose==3.3.0 python-multipart==0.0.6
RUN pip install --no-cache-dir fastapi-limiter==0.1.5 aioredis==2.0.1 python-dotenv==1.0.0
RUN pip install --no-cache-dir boto3==1.33.9 pillow==10.1.0

# Copy app.py before creating uploads directory
COPY ./app.py .

# Create uploads directory if using local storage
RUN mkdir -p ./uploads

# Use app.py for the FastAPI application
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"] 