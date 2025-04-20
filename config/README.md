# Configuration Management

This directory contains the configuration management system for the CandidateV Authentication Service.

## Structure

```
config/
├── __init__.py
├── base.py           # Base configuration with default values
├── loader.py         # Configuration loader and environment handling
└── environments/     # Environment-specific configurations
    ├── development.py
    └── production.py
```

## Configuration Sources

The configuration system follows a hierarchical approach:

1. **Base Configuration** (`base.py`):
   - Default values
   - Non-sensitive settings
   - Common configuration across environments

2. **Environment-Specific Configuration** (`environments/`):
   - Development settings
   - Production settings
   - Environment-specific overrides

3. **Environment Variables**:
   - Sensitive information (passwords, keys)
   - Deployment-specific settings
   - Override capability for all settings

## Required Environment Variables

The following environment variables must be set:

- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Database password
- `SECRET_KEY`: Application secret key (use `openssl rand -hex 32` to generate)

## Optional Environment Variables

Additional configuration can be provided through:

- `POSTGRES_SERVER`: Database host
- `POSTGRES_PORT`: Database port
- `SMTP_HOST`: Email server host
- `SMTP_USER`: Email server username
- `SMTP_PASSWORD`: Email server password
- `EMAILS_FROM_EMAIL`: Sender email address

## Usage

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration values

3. Set the environment:
   ```bash
   export ENVIRONMENT=development  # or production
   ```

4. The configuration will be automatically loaded when the application starts

## Railway Deployment

When deploying to Railway:

1. All configuration should be set through Railway's environment variables
2. The `ENVIRONMENT` variable should be set to `production`
3. Railway's PostgreSQL service will provide the database URL automatically

## Security Notes

- Never commit `.env` files to version control
- Keep sensitive information in environment variables
- Use different secret keys for development and production
- Regularly rotate production secrets 