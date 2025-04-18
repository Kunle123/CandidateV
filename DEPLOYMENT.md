# CandidateV Deployment Guide

This document provides instructions for deploying the CandidateV application to different platforms.

## Prerequisites

Before deploying, ensure you have:

1. [Node.js](https://nodejs.org/) installed (version 18 or higher)
2. [Python](https://www.python.org/) installed (version 3.9 or higher)
3. [Docker](https://www.docker.com/products/docker-desktop/) installed (for container deployment)
4. An [OpenAI API key](https://platform.openai.com/)
5. A [Railway](https://railway.app/) account (for backend services)
6. A [Vercel](https://vercel.com/) account (for frontend deployment)
7. A [Stripe](https://stripe.com/) account (for payment processing)

## Deployment Overview

CandidateV follows a microservices architecture with:
- 6 backend services deployed to Railway
- 1 frontend application deployed to Vercel
- Multiple PostgreSQL databases on Railway
- Optional Redis cache on Railway

## 1. Railway Backend Deployment

### Setting Up Railway CLI

1. Install Railway CLI:
   ```
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```
   railway login
   ```

3. Create a new project:
   ```
   railway init
   ```

4. Link to the project (if you didn't create it in the current directory):
   ```
   railway link
   ```

### Database Setup

Set up the necessary PostgreSQL databases:

```bash
# Create PostgreSQL instances for each service
railway add --plugin postgresql --name auth-db
railway add --plugin postgresql --name user-db
railway add --plugin postgresql --name cv-db
railway add --plugin postgresql --name ai-db
railway add --plugin postgresql --name payment-db

# Optional: Add Redis cache
railway add --plugin redis --name redis-cache
```

### 1.1 API Gateway Deployment

```bash
# Navigate to API Gateway directory
cd backend/api_gateway

# Set required environment variables
railway variables set PORT=8000
railway variables set AUTH_SERVICE_URL=$RAILWAY_AUTH_SERVICE_URL
railway variables set USER_SERVICE_URL=$RAILWAY_USER_SERVICE_URL
railway variables set CV_SERVICE_URL=$RAILWAY_CV_SERVICE_URL
railway variables set AI_SERVICE_URL=$RAILWAY_AI_SERVICE_URL
railway variables set PAYMENT_SERVICE_URL=$RAILWAY_PAYMENT_SERVICE_URL
railway variables set CORS_ORIGINS=http://localhost:3000,https://candidatev.vercel.app

# Deploy the service
railway up

# Generate public domain (optional)
railway domain
```

### 1.2 Authentication Service Deployment

```bash
# Navigate to Authentication Service directory
cd backend/auth_service

# Set required environment variables
railway variables set DATABASE_URL=$RAILWAY_AUTH_DB_URL
railway variables set JWT_SECRET=your-secure-jwt-secret
railway variables set JWT_ALGORITHM=HS256
railway variables set JWT_EXPIRATION=86400
railway variables set REDIS_URL=$RAILWAY_REDIS_URL
railway variables set CORS_ORIGINS=http://localhost:3000,https://candidatev.vercel.app

# Deploy the service
railway up

# Generate public domain (optional)
railway domain
```

### 1.3 User Service Deployment

```bash
# Navigate to User Service directory
cd backend/user_service

# Set required environment variables
railway variables set DATABASE_URL=$RAILWAY_USER_DB_URL
railway variables set JWT_SECRET=your-secure-jwt-secret
railway variables set JWT_ALGORITHM=HS256
railway variables set AUTH_SERVICE_URL=$RAILWAY_AUTH_SERVICE_URL
railway variables set CORS_ORIGINS=http://localhost:3000,https://candidatev.vercel.app

# Deploy the service
railway up

# Generate public domain (optional)
railway domain
```

### 1.4 CV Service Deployment

```bash
# Navigate to CV Service directory
cd backend/cv_service

# Set required environment variables
railway variables set DATABASE_URL=$RAILWAY_CV_DB_URL
railway variables set JWT_SECRET=your-secure-jwt-secret
railway variables set JWT_ALGORITHM=HS256
railway variables set STORAGE_TYPE=filesystem
railway variables set STORAGE_PATH=/app/storage
railway variables set CORS_ORIGINS=http://localhost:3000,https://candidatev.vercel.app

# Deploy the service
railway up

# Generate public domain (optional)
railway domain
```

### 1.5 AI Service Deployment

```bash
# Navigate to AI Service directory
cd backend/ai_service

# Set required environment variables
   railway variables set OPENAI_API_KEY=your_api_key_here
railway variables set DATABASE_URL=$RAILWAY_AI_DB_URL
railway variables set CV_SERVICE_URL=$RAILWAY_CV_SERVICE_URL
railway variables set JWT_SECRET=your-secure-jwt-secret
   railway variables set JWT_ALGORITHM=HS256
   railway variables set CORS_ORIGINS=http://localhost:3000,https://candidatev.vercel.app

# Deploy the service
railway up

# Generate public domain (optional)
railway domain
```

### 1.6 Payment Service Deployment

```bash
# Navigate to Payment Service directory
cd backend/payment_service

# Set required environment variables
railway variables set DATABASE_URL=$RAILWAY_PAYMENT_DB_URL
railway variables set STRIPE_API_KEY=your_stripe_secret_key
railway variables set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
railway variables set JWT_SECRET=your-secure-jwt-secret
railway variables set JWT_ALGORITHM=HS256
railway variables set USER_SERVICE_URL=$RAILWAY_USER_SERVICE_URL
railway variables set CORS_ORIGINS=http://localhost:3000,https://candidatev.vercel.app

# Deploy the service
railway up

# Generate public domain (optional)
railway domain
```

## 2. Vercel Frontend Deployment

### Setup and Configuration

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Navigate to the frontend directory:
   ```
   cd frontend
   ```

4. Set up environment variables:
   ```
   vercel env add API_GATEWAY_URL
   # Enter the URL of your deployed API Gateway
   ```

5. Deploy to Vercel:
   ```
   vercel --prod
   ```

## 3. Docker Deployment (Alternative)

You can deploy the entire stack using Docker Compose:

```bash
# Build and start all services
docker-compose up -d --build

# To view logs
docker-compose logs -f
```

The docker-compose.yml file includes configurations for all services and databases.

## 4. Environment Variables Reference

### API Gateway
- `PORT`: Port to run the service on
- `AUTH_SERVICE_URL`: URL to the Authentication service
- `USER_SERVICE_URL`: URL to the User service
- `CV_SERVICE_URL`: URL to the CV service
- `AI_SERVICE_URL`: URL to the AI service
- `PAYMENT_SERVICE_URL`: URL to the Payment service
- `CORS_ORIGINS`: Comma-separated list of allowed origins

### Authentication Service
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_ALGORITHM`: Algorithm for JWT (e.g., HS256)
- `JWT_EXPIRATION`: Token expiration time in seconds
- `REDIS_URL`: Redis connection string (optional)
- `CORS_ORIGINS`: Comma-separated list of allowed origins

### User Service
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_ALGORITHM`: Algorithm for JWT
- `AUTH_SERVICE_URL`: URL to the Authentication service
- `CORS_ORIGINS`: Comma-separated list of allowed origins

### CV Service
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_ALGORITHM`: Algorithm for JWT
- `STORAGE_TYPE`: Storage type (filesystem, s3, etc.)
- `STORAGE_PATH`: Path for local storage
- `CORS_ORIGINS`: Comma-separated list of allowed origins

### AI Service
- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_URL`: PostgreSQL connection string
- `CV_SERVICE_URL`: URL to the CV service
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_ALGORITHM`: Algorithm for JWT
- `CORS_ORIGINS`: Comma-separated list of allowed origins

### Payment Service
- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_API_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_ALGORITHM`: Algorithm for JWT
- `USER_SERVICE_URL`: URL to the User service
- `CORS_ORIGINS`: Comma-separated list of allowed origins

### Frontend
- `API_GATEWAY_URL`: URL to the API Gateway

### API Gateway Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| PORT | Port for the API Gateway service | Yes | 8000 |
| AUTH_SERVICE_URL | URL of the Authentication Service | Yes | https://candidatev-auth-service.up.railway.app |
| USER_SERVICE_URL | URL of the User Management Service | Yes | https://candidatev-user-service.up.railway.app |
| CV_SERVICE_URL | URL of the CV Management Service | Yes | https://candidatev-cv-service.up.railway.app |
| EXPORT_SERVICE_URL | URL of the Export Service | Yes | https://candidatev-export-service.up.railway.app |
| AI_SERVICE_URL | URL of the AI Service | Yes | https://ai-service-production.up.railway.app |
| PAYMENT_SERVICE_URL | URL of the Payment Service | Yes | https://candidatev-payment-service.up.railway.app |
| OPENAI_API_KEY | OpenAI API key for AI features | No | sk-... |
| OPENAI_MODEL | OpenAI model to use | No | gpt-4-turbo-preview |
| LOG_LEVEL | Logging level | No | info |

## 5. Post-Deployment Configuration

### Database Migrations

Each service requires its database schema to be initialized:

```bash
# For each service (auth, user, cv, ai, payment)
cd backend/service_name
railway run python -m alembic upgrade head
```

### Stripe Webhook Configuration

After deploying the Payment Service:

1. In your Stripe Dashboard, set up a webhook pointing to:
   ```
   https://your-payment-service-url/api/payments/webhook
   ```

2. Add the webhook secret to the Payment Service:
   ```
   railway variables set STRIPE_WEBHOOK_SECRET=your_webhook_secret
   ```

## 6. Testing the Deployment

After deployment, you can test the API endpoints:

```bash
# Test API Gateway health
curl https://your-api-gateway-url/health

# Test Authentication Service
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  https://your-api-gateway-url/api/auth/login

# Test AI Service job match endpoint (requires authentication)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"cv_id":"test-cv-id","job_description":"Software developer with Python skills"}' \
  https://your-api-gateway-url/api/ai/job-match
```

## 7. Troubleshooting

- **OpenAI API Key Issues**: Ensure your OpenAI API key is valid and correctly set in the environment variables.
- **Database Connection Issues**: Check the database connection string and ensure the database is running.
- **CORS Errors**: Make sure the frontend origin is included in the CORS_ORIGINS environment variable.
- **Authentication Errors**: Verify that the JWT_SECRET is consistent across all services.
- **Railway Deployment Issues**: If the deployment fails, run `railway logs` to see detailed error messages.
- **Railway CLI Errors**: If you see command not found errors, verify you're using the latest version of Railway CLI with `npm install -g @railway/cli`. 
- **Service Communication Errors**: Check that the service URLs are correctly set in each service's environment variables.
- **Stripe Webhook Errors**: Verify your webhook URL and secret are correctly configured.

## 8. Monitoring and Scaling

### Monitoring
- Set up monitoring for each service using Railway's built-in metrics
- Consider adding services like Sentry for error tracking

### Scaling
- Railway allows easy scaling of services through the web interface
- Increase database resources as needed for higher traffic

## 9. Backup Strategy

- Configure regular database backups in Railway
- Export important data periodically for additional safety

## 10. CI/CD Setup (Optional)

Set up continuous integration and deployment pipelines using GitHub Actions:

1. Create `.github/workflows/deploy.yml` in your repository
2. Configure the workflow to deploy to Railway and Vercel on successful merges to main branch 