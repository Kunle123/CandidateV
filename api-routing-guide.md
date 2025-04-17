# CandidateV API Routing Guide

## Overview

This document outlines the standardized approach to API routing in the CandidateV application. Following these guidelines will ensure consistent behavior across environments and prevent common issues like duplicate path segments and service unavailability.

## Key Principles

1. **Consistent Path Structure**: All API paths follow the `/api/service/endpoint` pattern
2. **Relative URLs**: Frontend components use relative URLs that start with `/api/`
3. **Single Source of Truth**: `apiClient.js` is the primary method for making API calls
4. **Service Independence**: Each service runs on its own port with clear responsibilities
5. **Centralized Routing**: The API Gateway routes all requests to appropriate services

## Architecture

```
Frontend (Port 5173)
    │
    ▼
API Gateway (Port 3000)
    │
    ├── Auth Service (Port 8000)
    ├── User Service (Port 8001)
    ├── CV Service (Port 8002)
    ├── Export Service (Port 8003)
    ├── AI Service (Port 8004)
    └── Payment Service (Port 8005)
```

## URL Structure

All API requests must follow this pattern:

```
/api/{service}/{endpoint}
```

Where:
- `{service}` is one of: `auth`, `users`, `cv`, `export`, `ai`, `payments`
- `{endpoint}` is the specific endpoint provided by the service

Examples:
- `/api/auth/login`
- `/api/cv/1234`
- `/api/ai/optimize`

## Frontend Configuration

### Using apiClient.js

The recommended way to make API calls is using the `apiClient` or `apiService` exported from `apiClient.js`:

```javascript
import apiClient, { apiService } from 'src/api/apiClient';

// Preferred approach - using service helpers
apiService.get('cv/1234'); // Automatically adds /api/ prefix

// Alternative direct approach
apiClient.get('/api/cv/1234');
```

### URL Construction

When constructing URLs:

1. **DO NOT** include the hostname or port (`http://localhost:3000`)
2. **DO** start paths with `/api/`
3. **DO NOT** use the base URL in both the axios config and the path

**Incorrect** (causes duplicate `/api/api/` segments):
```javascript
// AVOID THIS - it creates duplicate /api segments
axios.defaults.baseURL = 'http://localhost:3000/api';
axios.get('/api/users'); // Results in http://localhost:3000/api/api/users
```

**Correct**:
```javascript
// Either use empty baseURL with /api in the path
axios.defaults.baseURL = '';
axios.get('/api/users');

// OR use full URL without /api in the path
axios.defaults.baseURL = 'http://localhost:3000/api';
axios.get('users');
```

## Environment Configuration

### Development (Vite)

In development, the Vite proxy handles routing to the API Gateway:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
});
```

### Production

In production, API requests should still use relative URLs (`/api/...`), which will be directed to the correct server by the hosting platform configuration.

## Service Host Configuration

### IPv4 vs IPv6 Connectivity Issues

We discovered connectivity issues when services were configured to use different IP address formats. To ensure consistent connectivity:

1. **Always use `127.0.0.1` instead of `0.0.0.0` or `localhost`**
   - Using `0.0.0.0` makes services bind to all interfaces but may cause connection issues
   - `localhost` may resolve to IPv6 (`::1`) on some systems, causing connectivity problems

2. **Service URL Configuration**
   - In API Gateway `.env`: `SERVICE_URL=http://127.0.0.1:8000`
   - In uvicorn startup: `--host 127.0.0.1`

3. **Common Error Patterns**
   - `connect ECONNREFUSED ::1:8000` - IPv6 connection attempt failure
   - `connect ECONNREFUSED 127.0.0.1:8000` - IPv4 connection attempt failure

This standardization ensures that all services communicate using the same IP address format and prevents hard-to-debug connectivity issues.

## Common Issues and Solutions

### Duplicate Path Segments

**Problem**: URLs like `http://localhost:3000/api/api/auth/login`

**Causes**:
- Setting axios baseURL to include `/api` while also including `/api` in individual request paths
- Global axios configuration in multiple places

**Solutions**:
- Use empty baseURL and include `/api` in paths
- Or use baseURL with `/api` and omit it from paths
- Use the apiService helpers which handle this automatically

### Service Unavailable Errors (503)

**Causes**:
- The target service isn't running
- Port conflicts
- Startup order issues
- IPv4/IPv6 connectivity mismatches

**Solutions**:
- Check service status at `/api/gateway-status` or `/api/health?check=true`
- Ensure services are started in the correct order (auth first)
- Verify there are no port conflicts
- Use consistent IP addressing (127.0.0.1)

### Path Not Found Errors (404)

**Causes**:
- Typos in endpoint paths
- Missing service name in the path
- Service endpoint doesn't exist

**Solutions**: 
- Ensure path follows the `/api/{service}/{endpoint}` pattern
- Check API documentation for correct endpoint paths
- Verify the service is properly implemented

## Best Practices

1. **Always use apiService helpers** for the most reliable API access
2. **Check service health** before assuming service errors are code issues
3. **Run services in the correct order** using the `start-all.ps1` script
4. **Handle service unavailability gracefully** in the UI
5. **Log API errors** to help with troubleshooting
6. **Use consistent IP addressing** across all configuration files

## Tools for Diagnostics

- **API Gateway Status**: `GET /api/gateway-status` - Shows all service statuses
- **Health Check**: `GET /api/health?check=true` - Performs live health checks on all services
- **Browser Console**: Check for duplicate path warnings and error messages
- **API Logs**: Check `api/logs/error.log` for detailed error information

## Service URLs

| Service | Development URL | Port |
|---------|-----------------|------|
| API Gateway | http://localhost:3000 | 3000 |
| Auth Service | http://localhost:8000 | 8000 |
| User Service | http://localhost:8001 | 8001 |
| CV Service | http://localhost:8002 | 8002 |
| Export Service | http://localhost:8003 | 8003 |
| AI Service | http://localhost:8004 | 8004 |
| Payment Service | http://localhost:8005 | 8005 |
| Frontend | http://localhost:5173 | 5173 | 