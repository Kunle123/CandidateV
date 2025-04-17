# Strategic Routing Plan for CandidateV Application

## 1. Situation Analysis

### Current Architecture
- **Frontend**: Vite React app with React Router DOM
- **API Gateway**: Express server proxying to microservices
- **Backend Services**: Multiple Python FastAPI services on different ports
- **Port Conflicts**: Frontend and API Gateway both attempting to use port 3000

### Core Issues
1. **Port Conflicts**: API Gateway and Frontend both want port 3000
2. **Mixed API Routing**: Mixture of relative (`/api/...`) and absolute (`http://localhost:3000/api/...`) paths
3. **Inconsistent Usage**: Some components use direct axios calls, others use apiClient
4. **Duplicate Proxy Logic**: Both Vite proxy and API Gateway do similar routing
5. **Environment Inconsistency**: Different behavior in dev vs prod environments

## 2. Strategic Principles

1. **Clear Separation of Concerns**: Each component should have a single responsibility
2. **Consistent API Access Pattern**: Every component should access APIs the same way
3. **Environment Agnostic Code**: Same code should work in all environments
4. **Single Source of Truth**: One canonical way to route API requests
5. **Maintainable Configuration**: Easy to update service endpoints

## 3. Implementation Plan

### Phase 1: Stabilize Configuration

1. **Update vite.config.js**
   - Configure Vite to run on port 5173 consistently (avoid 3000 entirely)
   - Update proxy to point to the API Gateway (not individual services)

2. **Fixed API Gateway Port**
   - Ensure API Gateway consistently uses port 3000
   - Add clear validation on startup to fail if port 3000 is not available

3. **Environment Variables**
   - Create consistent .env files for all environments
   - Replace hardcoded values with environment variables

### Phase 2: Standardize API Access

1. **Create API Service Layer**
   - Enhance existing apiClient.js to be the sole entry point for all API calls
   - Implement service modules for each API domain (auth, users, cv, etc.)
   - Ensure proper error handling and token management

2. **Implement Base URL Strategy**
   - Development: Use relative URLs `/api/...` (relies on Vite proxy)
   - Production: Use either relative URLs or configured base URL
   - No hardcoding of hostnames/ports in API calls

3. **Remove Global Axios Configuration**
   - Remove axios defaults from main.jsx
   - Ensure all axios usage goes through the service layer
   - Update components using direct axios calls

### Phase 3: Refactor Components

1. **Audit All Components**
   - Identify all components making API calls
   - Document the API endpoints they access
   - Categorize by service (auth, cv, users, etc.)

2. **Standardize API Call Patterns**
   - Replace direct axios calls with service layer methods
   - Ensure consistent error handling
   - Implement proper loading states

3. **Implement Request Interceptors**
   - Add authentication token handling
   - Add request/response logging (in development only)
   - Add retry logic for transient failures

### Phase 4: Testing & Validation

1. **Unit Tests**
   - Test service layer components
   - Mock API responses
   - Verify error handling

2. **Integration Tests**
   - Test frontend-to-gateway communication
   - Verify authentication flows
   - Test success and failure scenarios

3. **Environment Tests**
   - Test in development environment
   - Test in production-like environment
   - Verify consistent behavior

## 4. Implementation Timeline

1. **Phase 1 (Configuration)**: 1 day
2. **Phase 2 (API Standardization)**: 2 days
3. **Phase 3 (Component Refactoring)**: 2-3 days depending on number of components
4. **Phase 4 (Testing)**: 1-2 days 