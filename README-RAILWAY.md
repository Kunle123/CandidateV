# CandidateV Railway Deployment Guide

This guide explains how to deploy the CandidateV microservices architecture to Railway.

## Prerequisites

1. [Node.js](https://nodejs.org/) installed (version 18 or higher)
2. [Railway CLI](https://docs.railway.app/develop/cli) installed: `npm install -g @railway/cli`
3. A [Railway](https://railway.app/) account
4. Your API keys:
   - OpenAI API key
   - Stripe API key and webhook secret

## Deployment Options

### Option 1: Automated Deployment with Scripts

We've provided two deployment scripts for different operating systems:

#### For Linux/Mac:

```bash
chmod +x deploy-to-railway.sh
./deploy-to-railway.sh
```

#### For Windows:

```powershell
# Run as administrator
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\deploy-to-railway.ps1
```

These scripts will:
1. Create a Railway project
2. Set up PostgreSQL databases for each service
3. Set up Redis cache
4. Deploy each service with the correct environment variables
5. Generate public URLs for each service
6. Configure service-to-service communication

### Option 2: Manual Deployment

If you prefer to deploy manually:

1. **Set up Railway CLI and project**

   ```bash
   # Login to Railway
   railway login
   
   # Create a new project
   railway init
   ```

2. **Deploy databases**

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

3. **Deploy each service**

   Copy the `railway.toml` file to each service directory, then deploy each service by following the instructions in the main DEPLOYMENT.md file.

## Railway Configuration

The `railway.toml` file in each service directory configures how Railway deploys the service:

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "./Dockerfile"

[deploy]
numReplicas = 1
healthcheckPath = "/health"
healthcheckTimeout = 10
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

## Accessing Service URLs

After deployment, you can retrieve the public URL for each service using:

```bash
railway domain --service service-name
```

## Troubleshooting

1. **Deployment Failures**

   Check the logs for detailed error messages:
   ```bash
   railway logs --service service-name
   ```

2. **Environment Variable Issues**

   Verify your environment variables are set correctly:
   ```bash
   railway variables list --service service-name
   ```

3. **Database Connection Issues**

   Ensure the database URLs are correctly configured:
   ```bash
   railway connect --service database-name
   ```

## Scaling on Railway

Railway automatically scales your services based on usage. You can configure additional scaling settings in the Railway dashboard.

## Cost Management

Railway charges based on usage. To manage costs:

1. Set up project budgets in the Railway dashboard
2. Consider sleep schedules for non-production environments
3. Monitor resource usage regularly

## Continuous Deployment

To set up continuous deployment from GitHub:

1. Connect your Railway project to your GitHub repository
2. Configure automatic deployments for your main branch
3. Set up branch deployments for staging environments 