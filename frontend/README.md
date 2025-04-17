# CandidateV Frontend

This is the frontend application for the CandidateV platform, built with React and Vite.

## Deployment on Vercel

This frontend is configured to be deployed on Vercel. There are two ways to deploy:

### Option 1: Deploy the entire repository

When deploying the entire repository, Vercel should be configured to:
1. Use the `.vercelignore` file at the root to ignore non-frontend files
2. Use the root `vercel.json` configuration
3. Use the `frontend` directory as the source directory

### Option 2: Deploy only this directory

Alternatively, you can deploy only this directory by:
1. Setting this directory as the root directory in Vercel project settings
2. Using the `vercel.json` configuration in this directory

## API Configuration

The frontend is configured to connect to the API Gateway hosted on Railway at:
`https://api-gateway-production.up.railway.app`

This is configured through:
1. The `vercel.json` file's rewrite rules
2. The `.env` file's `VITE_API_BASE_URL` variable

## Local Development

To run locally:

```
npm install
npm run dev
```

The development server will proxy API requests to the configured backend. 