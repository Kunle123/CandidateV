# API Service Layer

This directory contains the API service layer for the CandidateV frontend application. The service layer provides a clean, consistent interface for interacting with the backend services.

## Structure

- `apiClient.js` - Configures axios with interceptors for authentication and error handling
- `config.js` - Environment-specific configuration for API services
- `utils.js` - Utility functions for API calls (retry, batch requests, error formatting)
- `authService.js` - Authentication and user management
- `userService.js` - User profile operations
- `cvService.js` - CV template and content management
- `exportService.js` - CV export functionality
- `aiService.js` - AI-powered CV improvements
- `paymentService.js` - Subscription and payment management
- `index.js` - Exports all services

## Configuration

The API service layer is configured through `config.js` which handles:

- Environment detection (development, production, test)
- Base URLs for different environments
- Timeout settings
- Logging configuration
- Feature flags
- Service endpoints

## Utilities

The `utils.js` file provides helpful functions:

- `retryApiCall` - Retry failed API calls with exponential backoff
- `batchRequests` - Batch multiple API requests with concurrency control
- `formatApiError` - Format error messages for display

## Usage

### Importing Services

```javascript
// Import specific services
import { userService, cvService } from '../api';

// Or import all services
import api from '../api';

// Import utilities
import { retryApiCall, formatApiError } from '../api/utils';
```

### Example Usage

```javascript
// Using a specific service
const fetchProfile = async () => {
  const result = await userService.getCurrentProfile();
  if (result.success) {
    setProfile(result.data);
  } else {
    setError(result.error);
  }
};

// Using the retry utility
const fetchWithRetry = async () => {
  const result = await userService.getCurrentProfileWithRetry();
  if (result.success) {
    setProfile(result.data);
  } else {
    setError(result.error);
  }
};

// Using batch requests
import { batchRequests } from '../api/utils';

const fetchMultipleResources = async () => {
  const requests = [
    { url: '/cv/templates' },
    { url: '/users/me' },
    { url: '/export/formats' }
  ];
  
  const results = await batchRequests(requests);
  console.log(results);
};
```

## Error Handling

All service methods return an object with the following structure:

```javascript
// Success case
{
  success: true,
  data: { ... } // Response data from the API
}

// Error case
{
  success: false,
  error: "Error message" // Formatted error message
}
```

This allows for consistent error handling across the application:

```javascript
const result = await userService.updateProfile(profileData);
if (result.success) {
  // Handle success
} else {
  // Handle error
  console.error(result.error);
}
```

## Authentication

The API client automatically:
- Adds authentication tokens to requests
- Handles token refresh on 401 errors
- Redirects to login when authentication fails

## Logging

In development mode, the API client logs all requests and responses to the console.
To see detailed logs, open your browser's developer console.

## File Downloads

The `exportService.downloadExport()` method handles file downloads differently from other API calls:

```javascript
await exportService.downloadExport(exportId);
// This will trigger the file download directly
```