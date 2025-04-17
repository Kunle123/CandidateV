# CandidateV Application Startup Guide

## Application Architecture

CandidateV is built with a microservice architecture:

1. **API Gateway** (Node.js):
   - Port: 8000
   - Location: `/api` directory
   - Role: Routes requests to appropriate microservices

2. **Backend Services** (Python FastAPI):
   - Auth Service (Port 8000) - `/backend/auth_service`
   - User Service (Port 8001) - `/backend/user_service`
   - CV Service (Port 8002) - `/backend/cv_service`
   - Export Service (Port 8003) - `/backend/export_service`
   - AI Service (Port 8004) - `/backend/ai_service`
   - Payment Service (Port 8005) - `/backend/payment_service`

3. **Frontend** (React):
   - Port: 3000 (or alternative if 3000 is in use)
   - Location: `/frontend` directory

## Startup Sequence

**Important**: The services must be started in the correct order:

1. Backend Microservices:
   - Auth Service must start first (port 8000)
   - User Service (port 8001)
   - CV Service (port 8002)
   - Export Service (port 8003)
   - AI Service (port 8004)
   - Payment Service (port 8005)
2. API Gateway (port 8000, proxies to microservices)
3. Frontend (port 3000)

## Launch Script

Use the `start-all.ps1` script to launch the application. This script:
- Cleans up any existing processes on ports 8000-8005, 3000-3003
- Stops any Python and Node processes
- Starts all microservices in the correct order
- Starts the API Gateway
- Starts the Frontend

```powershell
.\start-all.ps1
```

## Connection Errors

The most common error seen in the frontend is:
```
[vite] http proxy error at /api/cv:
Error: connect ECONNREFUSED 127.0.0.1:8002
```

This indicates that the CV service isn't running on port 8002. Make sure to start it with:

```powershell
cd backend/cv_service
python -m uvicorn main:app --host 127.0.0.1 --port 8002 --reload
```

See the section on "Manual Service Startup" below for more details.

## Configuration Files

### API Gateway (.env)

```
# Server port
PORT=8000

# Service URLs
AUTH_SERVICE_URL=http://localhost:8000
USER_SERVICE_URL=http://localhost:8001
CV_SERVICE_URL=http://localhost:8002
EXPORT_SERVICE_URL=http://localhost:8003
AI_SERVICE_URL=http://localhost:8004
PAYMENT_SERVICE_URL=http://localhost:8005
```

### Auth Service (.env)

```
# JWT Configuration
JWT_SECRET=demo-secret-key-candidatev-development-only
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
RESET_TOKEN_EXPIRE_MINUTES=15

# Development Auth Settings
DEBUG_AUTH=true
ALLOW_DEMO_USER=true
DEMO_USER_ID=demo-user-123

# Database configuration
DATABASE_URL=sqlite:///./test.db

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,...

# Server
PORT=8000
```

## Authentication Flow

1. **Frontend Login**:
   - The frontend sends a form-urlencoded request to `/api/auth/login`
   - The API Gateway forwards this to the Auth Service
   - Login credentials must be sent as `username` (not email) and `password`

2. **Token Storage**:
   - The access token is stored in localStorage as `access_token`
   - The refresh token is stored in localStorage as `refresh_token`

3. **API Authorization**:
   - All API requests include the access token in the `Authorization: Bearer TOKEN` header

4. **Token Propagation**:
   - The API Gateway forwards the Authorization header to microservices
   - Each microservice validates the token independently
   - If the token is invalid or missing, services return 401 Unauthorized

## Common Issues & Troubleshooting

### Port Conflicts

If you see "port is already in use" errors:
- Run the cleanup portion of the start script
- Check for lingering processes using `Get-NetTCPConnection -LocalPort PORT_NUMBER`

### Authentication Errors (401 Unauthorized)

If you see "401 Unauthorized" when accessing services like `/api/cv`:

1. **Token Issues**:
   - Check localStorage in browser devtools to ensure `access_token` exists and is valid
   - Ensure you're logged in successfully and token hasn't expired
   - Try logging out and logging back in to get a fresh token

2. **Token Forwarding**:
   - The API Gateway might not be forwarding the token correctly
   - Check that the `addAuthHeader` function in `api/index.js` is working properly
   - Verify your request includes the Authorization header with format: `Bearer TOKEN`

3. **Token Validation in CV Service**:
   - The JWT secret might be different between Auth and CV services
   - Make sure all services share the same `JWT_SECRET` in their .env files
   - Check that JWT_SECRET in backend/cv_service/.env matches auth_service

```bash
# Check JWT_SECRET in both services
# They should be identical
cat backend/auth_service/.env | grep JWT_SECRET
cat backend/cv_service/.env | grep JWT_SECRET
```

4. **CORS Issues**:
   - Check that `CORS_ORIGINS` in CV service includes your frontend URL
   - Ensure both Auth and CV services have matching CORS settings

5. **Quick Fix**:
   - Sometimes, simply restarting all services in the correct order resolves authentication issues
   - Use the `start-complete.ps1` script which handles proper startup sequence

### 500 Internal Server Errors

If you see "500 Internal Server Error" when accessing services like `/api/cv`:
1. **CV Service Not Running**: Make sure the CV service is running on port 8002
2. **API Gateway Configuration**:
   - Check that the API Gateway is recognizing the service: `http://localhost:8000/api/debug`
   - Verify the API Gateway's .env file has correct service URLs
3. **Proxy Path Issues**: 
   - In `api/index.js`, ensure the CV service conditions allow proper routing:
   ```javascript
   if (CV_SERVICE_URL && CV_SERVICE_URL !== 'http://localhost:8002') {
     // Change this to remove the condition, or update your .env file
     app.use('/api/cv', createServiceProxy('/cv', CV_SERVICE_URL, 'cv'));
   }
   ```
   - Try editing this to always use the proxy regardless of URL:
   ```javascript
   app.use('/api/cv', createServiceProxy('/cv', CV_SERVICE_URL, 'cv'));
   ```
4. **Service Initialization**: Some services need a moment to initialize fully. Wait 10-15 seconds after starting all services before testing.

### Module Import Errors

If you see "Could not import module" errors:
- Make sure you're in the correct directory when launching a service
- Some services have their entry point in `main.py`, others in `app.py`
- The Export Service specifically uses `app:app` instead of `main:app`

### API Gateway Crashes

If the API Gateway crashes with:
```
[HPM] Proxy created: /  -> http://localhost:8000
[HPM] Proxy rewrite rule created: "^/api/auth" ~> "/api"
[HPM] Proxy created: /  -> http://localhost:8001
[HPM] Proxy rewrite rule created: "^/api/users" ~> "/api"
[nodemon] app crashed - waiting for file changes before starting...
```

This could be due to:
1. Auth Service not running properly (since API Gateway depends on it)
2. Port conflict (both Auth Service and API Gateway trying to use port 8000)
3. Configuration issues in the API Gateway settings

Fix by:
- Start auth service on port 8000 first
- Verify it's running correctly before starting API Gateway
- Check that the API Gateway configuration doesn't have invalid settings

### PowerShell Command Syntax

- Don't use `&&` in PowerShell commands (it's not supported)
- Use semicolons (`;`) or multiple commands on separate lines

## Demo User Credentials

- Email: demo@candidatev.com
- Password: demo1234

## URLs

- Frontend: http://127.0.0.1:3000 (or alternative port)
- API Gateway: http://127.0.0.1:8000
- Auth Service: http://127.0.0.1:8000 (via API Gateway)
- User Service: http://127.0.0.1:8001 (via API Gateway)
- CV Service: http://127.0.0.1:8002 (via API Gateway)
- Export Service: http://127.0.0.1:8003 (via API Gateway)
- AI Service: http://127.0.0.1:8004 (via API Gateway)
- Payment Service: http://127.0.0.1:8005 (via API Gateway)

## Authentication Recovery

If you encounter 401 Unauthorized errors, follow these steps to recover:

### Step 1: Fix JWT Token Configuration

Run the `fix-auth-tokens.ps1` script to synchronize JWT configuration across all services:

```powershell
.\fix-auth-tokens.ps1
```

This script will:
- Read JWT configuration from auth_service
- Apply the same configuration to all other services
- Ensure consistent token validation across the platform

### Step 2: Restart All Services

Use the comprehensive startup script to restart all services in the correct order:

```powershell
.\start-complete.ps1
```

### Step 3: Verify Token

Run the token verification script to test if your token is properly validated:

```powershell
.\check-token.ps1
```

Follow the prompts to test your token against the auth service and CV service.

### Step 4: Re-Login if Needed

If the token is invalid or expired:
1. Open the browser and go to http://127.0.0.1:3000
2. Click on "Logout" if you're already logged in
3. Login with demo credentials:
   - Email: demo@candidatev.com  
   - Password: demo1234

### Step 5: Test API Endpoints

Once logged in, test the API endpoints to ensure everything is working:

```powershell
.\test-api-endpoints.ps1
```

## Manual Service Startup (if needed)

### Auth Service

```powershell
cd backend/auth_service
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### API Gateway

```powershell
cd api
npm run dev
```

### Frontend

```powershell
cd frontend
$env:VITE_API_BASE_URL='http://127.0.0.1:8000'; npm run dev -- --host 127.0.0.1
``` 