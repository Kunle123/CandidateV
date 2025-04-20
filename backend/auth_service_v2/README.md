# CandidateV Authentication Service V2

A secure, scalable authentication service built with FastAPI and PostgreSQL.

## Features

- JWT-based authentication
- Refresh token mechanism
- Password reset functionality
- Email verification
- Rate limiting
- Role-based access control
- Comprehensive test coverage
- Swagger/OpenAPI documentation

## Prerequisites

- Python 3.10+
- PostgreSQL 14+
- Docker (optional)

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
# or
.\venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database:
```bash
alembic upgrade head
```

5. Run the service:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Development

### Directory Structure

```
app/
├── api/          # API endpoints
├── core/         # Core configuration and utilities
├── db/           # Database models and session management
├── schemas/      # Pydantic models for request/response
└── services/     # Business logic
```

### Running Tests

```bash
pytest --cov=app tests/
```

### Database Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "description"
```

Apply migrations:
```bash
alembic upgrade head
```

### API Documentation

Once running, access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Security

- All passwords are hashed using bcrypt
- JWT tokens with short expiration
- Refresh tokens with secure rotation
- Rate limiting on sensitive endpoints
- CORS configuration
- Input validation
- SQL injection protection

## Environment Variables

Required environment variables:
- `POSTGRES_SERVER`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `SECRET_KEY`

Optional:
- `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 30)
- `REFRESH_TOKEN_EXPIRE_DAYS` (default: 7)
- `RATE_LIMIT_PER_MINUTE` (default: 60)

## Contributing

1. Create a feature branch
2. Make changes
3. Run tests
4. Submit pull request

## License

MIT 