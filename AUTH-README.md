# CandidateV Authentication System

## Overview
This document explains the authentication system used in the CandidateV application and provides guidance for developers on how to work with authentication during development and testing.

## Authentication Flow
1. User logs in via the frontend application
2. Backend auth_service validates credentials and issues a JWT token
3. Frontend stores the token in localStorage
4. All subsequent API requests include the token in the Authorization header
5. Backend services validate the token before processing requests

## JWT Token Format
The JWT token used in CandidateV follows standard JWT format with three parts:
- Header: Specifies algorithm (HS256) and token type
- Payload: Contains user information and expiration
- Signature: HMAC-SHA256 signature created with the JWT_SECRET

Required payload fields:
- `sub`: User ID (string)
- `exp`: Expiration timestamp (number)
- `iat`: Issued at timestamp (number)

Optional payload fields:
- `name`: User's display name
- `email`: User's email address
- `role`: User's role (e.g., "user", "admin")

## Development Authentication

### Using the Token Generator
For development and testing, you can generate a valid JWT token using the provided scripts:

```bash
# Run the PowerShell script to generate a token
.\generate-token.ps1
```

The script will:
1. Check if Node.js is installed
2. Set up the necessary dependencies in a temporary directory
3. Generate a properly signed JWT token
4. Create a browser-code.js file with ready-to-use code
5. Display instructions for using the token

### Manual Authentication
To manually authenticate in the browser:

1. Open your browser to http://localhost:3000
2. Open developer tools (F12 or right-click and select "Inspect")
3. Go to the Console tab
4. Copy and paste the code from browser-code.js
5. Refresh the page

### Environment Configuration
All backend services must use the same JWT_SECRET for token validation to work. In development, the shared secret is:
```
demo-secret-key-candidatev-development-only
```

This value is set in the .env file of each service. You can update all services at once using:
```bash
.\update-jwt-secret.ps1
```

## Security Considerations

### Production Usage
For production environments:
- Generate a strong, unique JWT_SECRET using a cryptographically secure random generator
- Set shorter token expiration times
- Implement proper token refresh mechanisms
- Consider using a centralized secret management solution

### Security Best Practices
- Never commit JWT_SECRET to version control
- Use HTTPS for all API communications
- Implement proper CORS protections
- Consider adding rate limiting to authentication endpoints
- Validate all claims in the token before trusting them

## Troubleshooting

### 401 Unauthorized Errors
If you're experiencing 401 errors:
1. Verify the token exists in localStorage
2. Check the token format and expiration
3. Ensure the JWT_SECRET is consistent across all services
4. Restart backend services after changing .env files

### Token Generation Issues
If token generation fails:
1. Ensure Node.js is properly installed
2. Check npm can install packages
3. Look for error messages during the installation process
4. Try running the Node.js script directly 