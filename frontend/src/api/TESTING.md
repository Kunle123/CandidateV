# API Service Testing Guide

This guide provides instructions for testing the CandidateV API service layer.

## Prerequisites

Before testing, ensure the following backend services are running:

1. **User Service**:
   ```
   cd backend/user_service
   python standalone_server.py
   ```
   Should run on port 8001.

2. **CV Service**:
   ```
   cd backend/cv_service
   python standalone_server.py
   ```
   Should run on port 8002.

3. **Export Service**:
   ```
   cd backend/export_service
   python standalone_server.py
   ```
   Should run on port 8003.

## Running the Frontend

Start the frontend application:

```
cd frontend
npm run dev
```

This will run the application on http://localhost:3000.

## Using the API Test Dashboard

Navigate to http://localhost:3000/api-test to access the API test dashboard.

### Testing Options

1. **Run All Tests**: Click the "Run All Tests" button at the top of the dashboard to test all services at once.

2. **Test Individual Services**: Use the individual test buttons to test specific services:
   - **Auth Status**: Checks if the user is authenticated based on stored tokens
   - **User Service**: Tests the user profile endpoint
   - **CV Service**: Tests the CV templates endpoint
   - **Export Service**: Tests the export formats endpoint
   - **AI Service**: Tests CV analysis (may fail if service not implemented)
   - **Payment Service**: Tests subscription plans (may fail if service not implemented)

### Interpreting Results

- **Green SUCCESS**: Indicates the service is responding correctly
- **Red FAILED**: Indicates the service is not responding or returned an error
- **Error Messages**: Will display specific error details when a test fails
- **Response Details**: Shows the full JSON response at the bottom of the dashboard

## Troubleshooting

### Connection Refused Errors

If you see "ECONNREFUSED" errors:
1. Verify the corresponding backend service is running
2. Check the port number in the vite.config.js proxy settings
3. Ensure the service is listening on 127.0.0.1 (not 0.0.0.0)

### Authentication Issues

If auth-protected endpoints fail:
1. Try logging in first through the regular app interface
2. Check browser localStorage for access_token and refresh_token
3. Verify JWT secret and algorithm match between auth service and API client

### Port Already in Use

If you see "Port already in use" errors:
1. Find and terminate the process using the port:
   ```
   # On Windows
   netstat -ano | findstr :PORT
   taskkill /PID <PID> /F
   
   # On Linux/Mac
   lsof -i :PORT
   kill -9 <PID>
   ```
2. Try running on a different port:
   ```
   # For backend services
   PORT=8006 python standalone_server.py
   
   # For frontend
   npm run dev -- --port 3001
   ```

## Manual Testing with Browser DevTools

You can also test the API services directly from your browser console:

```javascript
// Import all services
import api from './api';

// Test user service
const testUser = async () => {
  const result = await api.user.getCurrentProfile();
  console.log(result);
};

// Test CV service
const testCV = async () => {
  const result = await api.cv.getTemplates();
  console.log(result);
};

// Test with authentication
const testAuth = async () => {
  const loggedIn = await api.auth.login('user@example.com', 'password');
  if (loggedIn.success) {
    const profile = await api.user.getCurrentProfile();
    console.log(profile);
  }
};
``` 