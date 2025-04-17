# CandidateV Authentication Service

This service handles user authentication for the CandidateV application, including user registration, login, token management, and session handling.

## Features

- User registration and account creation
- Secure login with password hashing
- JWT token generation and validation
- Refresh token rotation for improved security
- Rate limiting for login attempts
- Health check endpoint

## Environment Variables

The following environment variables are required:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token generation/validation
- `JWT_ALGORITHM`: Algorithm for JWT (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 30)
- `CORS_ORIGINS`: List of allowed origins including Vercel URL and localhost
- `PORT`: Port for the service (default: 8000)
- `REDIS_URL`: URL for Redis connection (optional, for rate limiting)

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login with credentials
- `POST /api/auth/refresh`: Refresh access token
- `POST /api/auth/logout`: Logout and invalidate refresh token

### Health Check

- `GET /api/health`: Check service health

## Local Development

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```
   export DATABASE_URL=postgresql://user:password@localhost:5432/candidatev
   export JWT_SECRET=your_secret_key
   export JWT_ALGORITHM=HS256
   export ACCESS_TOKEN_EXPIRE_MINUTES=30
   export CORS_ORIGINS=http://localhost,http://localhost:3000
   ```

3. Run the service:
   ```
   python main.py
   ```

## Deployment

This service is designed to be deployed on Railway. Set up the required environment variables in the Railway dashboard.

## Database Migrations

Database migrations are managed with Alembic:

1. Generate a new migration:
   ```
   alembic revision --autogenerate -m "description"
   ```

2. Apply migrations:
   ```
   alembic upgrade head
   ``` 