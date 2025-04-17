# CandidateV Deployment Architecture

## Current Architecture

The CandidateV application uses a distributed architecture with the following components:

1. **Frontend**: React application deployed on Vercel
   - Location: `/frontend` directory
   - Deployment: Vercel (https://candidatev.vercel.app or similar)
   - Configuration: `frontend/vercel.json` (only this file is used for deployment)

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
- Vercel (via rewrites in frontend/vercel.json) forwards these to `https://api-gateway-production.up.railway.app/api/*`
- The API Gateway on Railway routes requests to the appropriate microservice

## Deployment Files

- **`frontend/vercel.json`**: Frontend configuration for Vercel deployment
  - Routes API requests to Railway API Gateway
  - All other routes go to the SPA frontend
  - Specifies build configuration

- **Frontend environment variables**:
  - Production (`.env`): Points to Railway API Gateway
  - Development (`.env.development`): Points to local API Gateway

## Vercel Deployment

The Vercel deployment process:
1. Uses the `frontend/vercel.json` configuration
2. Deploys only the frontend directory
3. Runs the build command defined in frontend/vercel.json
4. Deploys the output from `frontend/dist`
5. Sets up rewrites for API requests to Railway

## Historical Notes

The project previously had a different architecture where:
1. The API Gateway was intended to be deployed on Vercel directly
2. The separate `/api` directory contained an earlier version of the API Gateway
3. Multiple vercel.json files existed with conflicting configurations

These have been consolidated into the current architecture with the API Gateway on Railway and frontend on Vercel.

## Local Development

For local development:
1. The frontend runs on port 5173
2. The API Gateway runs on port 8000
3. Individual microservices run on ports 8001-8005 