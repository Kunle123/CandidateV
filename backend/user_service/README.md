# User Management Service

This service manages user profiles, preferences, and image uploads for the CandidateV application.

## Features

- User profile management (bio, job title, location, etc.)
- Profile image upload and storage
- User preferences management
- Integration with Authentication Service

## Development Guide

### Environment Setup

The service can use either SQLite (for development) or PostgreSQL (for production).

#### Environment Variables

- `DATABASE_URL`: Database connection string
- `PORT`: Server port (default: 8001)
- `JWT_SECRET`: Secret key for JWT validation
- `JWT_ALGORITHM`: Algorithm for JWT (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT expiration time
- `BASE_URL`: Base URL for the service
- `CORS_ORIGINS`: Allowed origins for CORS
- `USE_LOCAL_STORAGE`: Whether to use local storage for images (true/false)
- `LOCAL_STORAGE_PATH`: Path for local image storage
- `S3_BUCKET_NAME`: S3 bucket name for image storage
- `S3_REGION`: S3 region
- `S3_ACCESS_KEY`: S3 access key
- `S3_SECRET_KEY`: S3 secret key

### Scripts

We provide several scripts to help with development:

#### 1. Development Starter (Recommended)

This script sets up everything in one go: environment variables, database, and starts the service.

```bash
python dev_start.py
```

#### 2. Direct Database Setup

If you need to reset the database or set it up separately:

```bash
python direct_setup_db.py
```

#### 3. Environment Variable Setup

If you want to set environment variables for another script:

```bash
# Set env vars and run a command
python set_env.py python -m uvicorn app.main:app --reload --port 8085

# Or just set env vars
python set_env.py
```

#### 4. Run Script

Run the service with environment variables set:

```bash
python run.py
```

### Database

The service can use SQLite for development or PostgreSQL for production:

- **SQLite**: Uses `sqlite:///./user_service.db` (default for development)
- **PostgreSQL**: Set `DATABASE_URL` to a PostgreSQL connection string

Database migrations are managed with Alembic:

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head
```

### Image Storage

The service supports two storage options:

1. **Local storage**: Files are stored in the `uploads` directory and served directly
2. **S3 storage**: Files are stored in an S3 bucket (set `USE_LOCAL_STORAGE=false`)

## API Endpoints

### Profile Management

- `GET /api/users/me`: Get current user profile
- `PUT /api/users/me`: Update current user profile
- `POST /api/users/me/image`: Upload profile image
- `PUT /api/users/me/preferences`: Update user preferences

### Health Check

- `GET /api/health`: Check service health

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check if DATABASE_URL is set correctly
   - For SQLite, ensure the directory is writable
   - For PostgreSQL, check credentials and network access

2. **JWT Validation Errors**
   - Ensure JWT_SECRET and JWT_ALGORITHM match the Auth Service settings

3. **Image Upload Issues**
   - For local storage, check if uploads directory exists and is writable
   - For S3 storage, verify S3 credentials and bucket permissions

### Logs

The service logs to stdout with the following format:
```
TIMESTAMP - LOGGER_NAME - LEVEL - MESSAGE
```

Set `LOG_LEVEL` environment variable to control logging verbosity (default: info).

## Contract Validation

This service implements contract validation using JSON Schema definitions from the shared contracts. This ensures that:

1. All requests to the API are validated against the contract schema
2. All responses from the API conform to the defined contract
3. API documentation is automatically generated from the contract schema

### Contract Implementation

The contract is defined in the `backend/shared/contracts/user_service.json` file, which follows JSON Schema format. This schema is used to:

- Validate incoming requests before they're processed
- Validate outgoing responses to ensure contract compliance
- Generate OpenAPI documentation that's accessible at `/docs` and `/redoc`

### Contract Version

The current contract version is included in all API responses through the `X-Contract-Version` header. 