# CandidateV Deployment Architecture

## Current Architecture

The CandidateV application uses a distributed architecture with the following components:

1. **Frontend**: React application deployed on Vercel
   - Location: `/frontend` directory
   - Deployment: Vercel (https://candidatev.vercel.app or similar)
   - Configuration: `frontend/vercel.json` and root `vercel.json`

2. **API Gateway**: Express.js application deployed on Railway
   - Location: `/backend/api_gateway` directory
   - Deployment: Railway (https://api-gateway-production.up.railway.app)
   - Handles routing to all microservices

3. **Microservices**: Various Python FastAPI services deployed on Railway
   - Location: `/backend/*/` directories (auth_service, user_service, etc.)
   - Deployment: Individual Railway services

## API Routing

All API requests follow this pattern:
- Frontend makes requests to `/api/*`
- Vercel (via rewrites in vercel.json) forwards these to `https://api-gateway-production.up.railway.app/api/*`
- The API Gateway on Railway routes requests to the appropriate microservice

## Deployment Files

- **Root `vercel.json`**: Main configuration for Vercel deployment
  - Builds from the frontend directory
  - Routes API requests to Railway API Gateway
  - All other routes go to the SPA frontend

- **Frontend environment variables**:
  - Production (`.env`): Points to Railway API Gateway
  - Development (`.env.development`): Points to local API Gateway

## Historical Notes

The project previously had a different architecture where:
1. The API Gateway was intended to be deployed on Vercel directly
2. The separate `/api` directory contained an earlier version of the API Gateway
3. Multiple vercel.json files existed with conflicting configurations

These have been consolidated into the current architecture with the API Gateway on Railway.

## Local Development

For local development:
1. The frontend runs on port 5173
2. The API Gateway runs on port 8000
3. Individual microservices run on ports 8001-8005 