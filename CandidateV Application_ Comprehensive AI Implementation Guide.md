# CandidateV Application: Comprehensive AI Implementation Guide

## Project Overview

You are tasked with building CandidateV (pronounced "Candidate 5"), a modern web application that helps users create, optimize, and manage professional CVs/resumes with AI assistance. The application follows a microservices architecture with clear separation between frontend and backend components.

### Core Features
- User authentication and profile management
- CV creation and editing with templates
- AI-powered CV optimization and suggestions
- Export to multiple formats (PDF, DOCX)
- Subscription-based premium features
- Payment processing

### Technical Architecture
- Frontend: React/Vite application deployed on Vercel
- Backend: Multiple microservices deployed on Railway
- Database: PostgreSQL for persistent storage
- External Services: OpenAI API, Stripe Payments

### User Journey Reference
This implementation guide should be used in conjunction with the `user_journey_flows.md` file located in the same directory. The user journey document provides detailed flows for how users interact with the system and how different components work together to deliver functionality. **Always refer to the user journeys when implementing components to ensure they support the expected user interactions.**

## Development Approach

You must follow these core principles throughout implementation:

1. **Environment-First Development**: Develop directly in target environments (Vercel/Railway), not locally
2. **Strict Interface Compliance**: Implement all interfaces exactly as specified
3. **Independent Components**: Each component must function independently
4. **Comprehensive Testing**: Test each component thoroughly before proceeding
5. **Dependency Isolation**: Explicitly manage all dependencies
6. **User Journey Alignment**: Ensure all implementations support the user journeys defined in the reference document

## Implementation Sequence

Follow this exact sequence for implementation:

1. Set up infrastructure and deployment pipelines
2. Implement Authentication Service
3. Create API Gateway
4. Build User Management Service
5. Develop CV Management Service
6. Implement Frontend Application
7. Create Export & Document Service
8. Build AI Optimization Service
9. Implement Payment & Subscription Service
10. Set up monitoring and logging

## Infrastructure Setup

### Vercel Setup
1. Create a new Vercel project
2. Configure the following environment variables:
   - `AUTH_SERVICE_URL`: URL of the Authentication Service
   - `USER_SERVICE_URL`: URL of the User Management Service
   - `CV_SERVICE_URL`: URL of the CV Management Service
   - `EXPORT_SERVICE_URL`: URL of the Export Service
   - `AI_SERVICE_URL`: URL of the AI Service
   - `PAYMENT_SERVICE_URL`: URL of the Payment Service
   - `NODE_ENV`: Set to "production" for production environment
   - `VITE_STRIPE_PUBLIC_KEY`: Stripe public key

3. Create a `vercel.json` file with the following content:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/**",
      "use": "@vercel/static"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/auth/(.*)",
      "dest": "https://{AUTH_SERVICE_URL}/api/auth/$1",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization"
      }
    },
    {
      "src": "/api/users/(.*)",
      "dest": "https://{USER_SERVICE_URL}/api/users/$1",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization"
      }
    },
    {
      "src": "/api/cv/(.*)",
      "dest": "https://{CV_SERVICE_URL}/api/cv/$1",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization"
      }
    },
    {
      "src": "/api/export/(.*)",
      "dest": "https://{EXPORT_SERVICE_URL}/api/export/$1",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization"
      }
    },
    {
      "src": "/api/ai/(.*)",
      "dest": "https://{AI_SERVICE_URL}/api/ai/$1",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization"
      }
    },
    {
      "src": "/api/payments/(.*)",
      "dest": "https://{PAYMENT_SERVICE_URL}/api/payments/$1",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Accept, Authorization"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

### Railway Setup
For each microservice, create a separate Railway project with the following configuration:

1. Set up PostgreSQL database
2. Configure the following environment variables for each service:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret for JWT token generation/validation
   - `JWT_ALGORITHM`: Algorithm for JWT (HS256)
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (30)
   - `CORS_ORIGINS`: List of allowed origins including Vercel URL and localhost
   - `PORT`: Port for the service (8000)
   - `OPENAI_API_KEY`: For AI Service only
   - `STRIPE_SECRET_KEY`: For Payment Service only
   - `STRIPE_WEBHOOK_SECRET`: For Payment Service only

3. Create a `railway.json` file for each service with the following content:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt && alembic upgrade head"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  },
  "healthcheck": {
    "path": "/api/health",
    "interval": 30,
    "timeout": 5,
    "retries": 3
  }
}
```

## Component 1: Authentication Service

### Technology Stack
- FastAPI framework
- PostgreSQL database
- JWT for authentication
- Pydantic for data validation
- SQLAlchemy for ORM

### Database Schema
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    revoked BOOLEAN NOT NULL DEFAULT false
);
```

### API Endpoints

#### 1. Register User
- **URL**: `/api/auth/register`
- **Method**: POST
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```
- **Response (201)**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2025-04-09T10:00:00Z"
}
```
- **User Journey Reference**: See "User Journey 1: New User Registration and Onboarding" in the user journey flows document

#### 2. Login
- **URL**: `/api/auth/login`
- **Method**: POST
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```
- **Response (200)**:
```json
{
  ***REMOVED***,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```
- **User Journey Reference**: See "User Journey 1: New User Registration and Onboarding" in the user journey flows document

#### 3. Refresh Token
- **URL**: `/api/auth/refresh`
- **Method**: POST
- **Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Response (200)**:
```json
{
  ***REMOVED***,
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### 4. Logout
- **URL**: `/api/auth/logout`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Response (200)**:
```json
{
  "message": "Successfully logged out"
}
```

#### 5. Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Response (200)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-04-09T10:00:00Z",
  "version": "1.0.0",
  "database_connection": "ok"
}
```

### Implementation Requirements
1. Implement password hashing using bcrypt
2. Create JWT token generation with proper expiration
3. Implement refresh token rotation for security
4. Add rate limiting for login attempts
5. Create database connection pooling
6. Implement proper error handling
7. Add comprehensive logging
8. Create health check endpoint
9. Ensure implementation supports the authentication flow described in the user journey document

### Testing Requirements
1. Test user registration with valid/invalid data
2. Test login with correct/incorrect credentials
3. Test token refresh flow
4. Test logout functionality
5. Verify database connection handling
6. Test rate limiting functionality
7. Verify proper error responses
8. Test the complete user registration and login journey

## Component 2: API Gateway

### Technology Stack
- Vercel Serverless Functions
- Node.js
- Express.js

### Implementation Requirements
1. Create route forwarding to appropriate microservices
2. Implement CORS handling
3. Add request logging with correlation IDs
4. Implement basic request validation
5. Create health check endpoint
6. Add error standardization
7. Implement request tracing
8. Ensure all routes support the user journeys defined in the reference document

### Testing Requirements
1. Test routing to each microservice
2. Verify CORS handling
3. Test error handling
4. Verify health check functionality
5. Test with simulated service failures
6. Verify support for all user journey flows

## Component 3: User Management Service

### Technology Stack
- FastAPI framework
- PostgreSQL database
- SQLAlchemy for ORM
- Pydantic for data validation

### Database Schema
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    bio TEXT,
    profile_image_url VARCHAR(255),
    job_title VARCHAR(255),
    location VARCHAR(255),
    website VARCHAR(255),
    social_links JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### API Endpoints

#### 1. Get Current User Profile
- **URL**: `/api/users/me`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "bio": "Professional software developer",
  "profile_image_url": "https://example.com/image.jpg",
  "job_title": "Senior Developer",
  "location": "New York",
  "website": "https://johndoe.com",
  "social_links": {
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  },
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```
- **User Journey Reference**: See "User Journey 6: Managing Account and Subscription" in the user journey flows document

#### 2. Update User Profile
- **URL**: `/api/users/me`
- **Method**: PUT
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "name": "John Doe",
  "bio": "Professional software developer",
  "job_title": "Senior Developer",
  "location": "New York",
  "website": "https://johndoe.com",
  "social_links": {
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  }
}
```
- **Response (200)**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "bio": "Professional software developer",
  "profile_image_url": "https://example.com/image.jpg",
  "job_title": "Senior Developer",
  "location": "New York",
  "website": "https://johndoe.com",
  "social_links": {
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  },
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```
- **User Journey Reference**: See "User Journey 6: Managing Account and Subscription" in the user journey flows document

#### 3. Upload Profile Image
- **URL**: `/api/users/me/image`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Request Body**: Form data with image file
- **Response (200)**:
```json
{
  "profile_image_url": "https://example.com/image.jpg"
}
```
- **User Journey Reference**: See "User Journey 6: Managing Account and Subscription" in the user journey flows document

#### 4. Update User Preferences
- **URL**: `/api/users/me/preferences`
- **Method**: PUT
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "theme": "dark",
  "notifications": true
}
```
- **Response (200)**:
```json
{
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```
- **User Journey Reference**: See "User Journey 6: Managing Account and Subscription" in the user journey flows document

#### 5. Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Response (200)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-04-09T10:00:00Z",
  "version": "1.0.0",
  "database_connection": "ok"
}
```

### Implementation Requirements
1. Implement JWT validation
2. Create database models and migrations
3. Implement profile image upload and storage
4. Add proper error handling
5. Create comprehensive logging
6. Implement database connection pooling
7. Add health check endpoint
8. Ensure implementation supports the account management flow described in the user journey document

### Testing Requirements
1. Test profile retrieval with valid/invalid token
2. Test profile update with valid/invalid data
3. Test image upload functionality
4. Verify preference updates
5. Test database connection handling
6. Verify proper error responses
7. Test the complete account management journey

## Component 4: CV Management Service

### Technology Stack
- FastAPI framework
- PostgreSQL database
- SQLAlchemy for ORM
- Pydantic for data validation

### Database Schema
```sql
CREATE TABLE cv_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    structure JSONB NOT NULL,
    thumbnail_url VARCHAR(255),
    is_premium BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES cv_templates(id),
    content JSONB NOT NULL,
    last_modified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE cv_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL
);

CREATE TABLE cv_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### API Endpoints

#### 1. List User's CVs
- **URL**: `/api/cv`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Query Parameters**: page, limit, sort
- **Response (200)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Software Developer CV",
      "template_id": "uuid",
      "last_modified": "2025-04-09T10:00:00Z",
      "created_at": "2025-04-09T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```
- **User Journey Reference**: See "User Journey 2: Creating a New CV" in the user journey flows document

#### 2. Create CV
- **URL**: `/api/cv`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "title": "Software Developer CV",
  "template_id": "uuid",
  "content": {
    "personal_info": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "address": "New York, NY"
    },
    "summary": "Experienced software developer with 5+ years of experience...",
    "experience": [
      {
        "title": "Senior Developer",
        "company": "Tech Corp",
        "location": "New York, NY",
        "start_date": "2020-01",
        "end_date": "present",
        "description": "Led development of..."
      }
    ],
    "education": [
      {
        "degree": "Bachelor of Science in Computer Science",
        "institution": "University of Technology",
        "location": "Boston, MA",
        "graduation_date": "2015"
      }
    ],
    "skills": [
      "JavaScript",
      "Python",
      "React",
      "Node.js"
    ]
  }
}
```
- **Response (201)**:
```json
{
  "id": "uuid",
  "title": "Software Developer CV",
  "template_id": "uuid",
  "content": { ... },
  "last_modified": "2025-04-09T10:00:00Z",
  "created_at": "2025-04-09T10:00:00Z"
}
```
- **User Journey Reference**: See "User Journey 2: Creating a New CV" in the user journey flows document

#### 3. Get CV by ID
- **URL**: `/api/cv/{cv_id}`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "id": "uuid",
  "title": "Software Developer CV",
  "template_id": "uuid",
  "content": { ... },
  "last_modified": "2025-04-09T10:00:00Z",
  "created_at": "2025-04-09T10:00:00Z"
}
```
- **User Journey Reference**: See "User Journey 2: Creating a New CV" in the user journey flows document

#### 4. Update CV
- **URL**: `/api/cv/{cv_id}`
- **Method**: PUT
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "title": "Updated CV Title",
  "content": { ... }
}
```
- **Response (200)**:
```json
{
  "id": "uuid",
  "title": "Updated CV Title",
  "template_id": "uuid",
  "content": { ... },
  "last_modified": "2025-04-09T10:00:00Z",
  "created_at": "2025-04-09T10:00:00Z"
}
```
- **User Journey Reference**: See "User Journey 2: Creating a New CV" in the user journey flows document

#### 5. Delete CV
- **URL**: `/api/cv/{cv_id}`
- **Method**: DELETE
- **Headers**: Authorization: Bearer {token}
- **Response (204)**

#### 6. List CV Templates
- **URL**: `/api/cv/templates`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Query Parameters**: page, limit, category
- **Response (200)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Professional Template",
      "description": "Clean and professional CV template",
      "thumbnail_url": "https://example.com/thumbnail.jpg",
      "is_premium": false
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```
- **User Journey Reference**: See "User Journey 2: Creating a New CV" in the user journey flows document

#### 7. Get CV Version History
- **URL**: `/api/cv/{cv_id}/versions`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "cv_id": "uuid",
      "created_at": "2025-04-09T10:00:00Z",
      "created_by": "uuid"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```
- **User Journey Reference**: See "User Journey 7: CV Version History and Restoration" in the user journey flows document

#### 8. Share CV
- **URL**: `/api/cv/{cv_id}/share`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "expires_in_days": 7
}
```
- **Response (200)**:
```json
{
  "share_url": "https://candidatev.com/s/abcdef123456",
  "expires_at": "2025-04-16T10:00:00Z"
}
```
- **User Journey Reference**: See "User Journey 3: Exporting and Sharing CV" in the user journey flows document

#### 9. Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Response (200)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-04-09T10:00:00Z",
  "version": "1.0.0",
  "database_connection": "ok"
}
```

### Implementation Requirements
1. Implement JWT validation
2. Create database models and migrations
3. Implement version history tracking
4. Add proper error handling
5. Create comprehensive logging
6. Implement database connection pooling
7. Add health check endpoint
8. Ensure implementation supports the CV creation, editing, and sharing flows described in the user journey document

### Testing Requirements
1. Test CV creation with valid/invalid data
2. Test CV retrieval with valid/invalid token
3. Test CV update functionality
4. Test version history tracking
5. Verify template listing
6. Test sharing functionality
7. Verify proper error responses
8. Test the complete CV creation and management journeys

## Component 5: Frontend Application

### Technology Stack
- React
- Vite
- TypeScript
- Chakra UI for components
- React Router for routing
- React Query for data fetching
- Zustand for state management

### Pages and Components

#### 1. Authentication Pages
- Login Page
- Registration Page
- Forgot Password Page
- Reset Password Page

#### 2. Dashboard
- CV List
- User Profile
- Subscription Status

#### 3. CV Editor
- Template Selection
- Section Editor
- Real-time Preview
- AI Suggestions Integration

#### 4. Profile Management
- Personal Information
- Subscription Management
- Payment Methods

#### 5. Shared Components
- Navigation
- Footer
- Loading States
- Error Handling
- Notifications

### Implementation Requirements
1. Implement responsive design
2. Create authentication flow with token management
3. Implement CV editor with real-time preview
4. Add error handling and loading states
5. Create form validation
6. Implement routing with protected routes
7. Add dark/light theme support
8. Ensure implementation supports all user journeys defined in the reference document

### Testing Requirements
1. Test authentication flows
2. Test CV creation and editing
3. Verify responsive design
4. Test form validation
5. Verify protected routes
6. Test error handling
7. Test all user journeys end-to-end

## Component 6: Export & Document Service

### Technology Stack
- FastAPI framework
- PostgreSQL database
- WeasyPrint for PDF generation
- python-docx for DOCX generation
- Redis for job queue

### Database Schema
```sql
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    cv_id UUID NOT NULL,
    format VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    file_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

### API Endpoints

#### 1. Export CV
- **URL**: `/api/export/cv/{cv_id}`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "format": "pdf",
  "options": {
    "paper_size": "a4",
    "margin": "normal"
  }
}
```
- **Response (202)**:
```json
{
  "export_id": "uuid",
  "status": "processing",
  "created_at": "2025-04-09T10:00:00Z"
}
```
- **User Journey Reference**: See "User Journey 3: Exporting and Sharing CV" in the user journey flows document

#### 2. Get Export Status
- **URL**: `/api/export/status/{export_id}`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "export_id": "uuid",
  "status": "completed",
  "format": "pdf",
  "created_at": "2025-04-09T10:00:00Z",
  "completed_at": "2025-04-09T10:01:00Z",
  "file_url": "https://storage.example.com/exports/cv-123.pdf"
}
```
- **User Journey Reference**: See "User Journey 3: Exporting and Sharing CV" in the user journey flows document

#### 3. List Export Formats
- **URL**: `/api/export/formats`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "formats": [
    {
      "id": "pdf",
      "name": "PDF Document",
      "description": "Portable Document Format",
      "is_premium": false
    },
    {
      "id": "docx",
      "name": "Word Document",
      "description": "Microsoft Word Document",
      "is_premium": true
    }
  ]
}
```
- **User Journey Reference**: See "User Journey 3: Exporting and Sharing CV" in the user journey flows document

#### 4. Download Export
- **URL**: `/api/export/download/{export_id}`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Response**: Binary file with appropriate Content-Type
- **User Journey Reference**: See "User Journey 3: Exporting and Sharing CV" in the user journey flows document

#### 5. Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Response (200)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-04-09T10:00:00Z",
  "version": "1.0.0",
  "database_connection": "ok",
  "queue_connection": "ok"
}
```

### Implementation Requirements
1. Implement JWT validation
2. Create database models and migrations
3. Implement document generation for PDF and DOCX
4. Set up job queue for async processing
5. Add proper error handling
6. Create comprehensive logging
7. Implement database connection pooling
8. Add health check endpoint
9. Ensure implementation supports the export flow described in the user journey document

### Testing Requirements
1. Test export request with valid/invalid data
2. Test document generation for different formats
3. Verify job queue processing
4. Test download functionality
5. Verify proper error responses
6. Test the complete export journey

## Component 7: AI Optimization Service

### Technology Stack
- FastAPI framework
- PostgreSQL database
- OpenAI API integration
- Redis for job queue

### Database Schema
```sql
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    cv_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES ai_analyses(id) ON DELETE CASCADE,
    section VARCHAR(50) NOT NULL,
    original_text TEXT NOT NULL,
    suggested_text TEXT NOT NULL,
    reason TEXT NOT NULL,
    applied BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### API Endpoints

#### 1. Analyze CV
- **URL**: `/api/ai/analyze/{cv_id}`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "analysis_type": "comprehensive",
  "target_job": "Software Developer",
  "target_company": "Tech Corp"
}
```
- **Response (202)**:
```json
{
  "analysis_id": "uuid",
  "status": "processing",
  "created_at": "2025-04-09T10:00:00Z"
}
```
- **User Journey Reference**: See "User Journey 5: Receiving and Applying AI Feedback" in the user journey flows document

#### 2. Get Analysis Status
- **URL**: `/api/ai/analysis/{analysis_id}`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "analysis_id": "uuid",
  "status": "completed",
  "created_at": "2025-04-09T10:00:00Z",
  "completed_at": "2025-04-09T10:01:00Z"
}
```
- **User Journey Reference**: See "User Journey 5: Receiving and Applying AI Feedback" in the user journey flows document

#### 3. Get Analysis Results
- **URL**: `/api/ai/analysis/{analysis_id}/results`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "analysis_id": "uuid",
  "cv_id": "uuid",
  "score": 85,
  "summary": "Your CV is strong but could use improvements in the experience section.",
  "strengths": [
    "Clear and concise summary",
    "Strong educational background",
    "Relevant skills highlighted"
  ],
  "weaknesses": [
    "Experience descriptions lack quantifiable achievements",
    "Skills section could be more targeted to the job"
  ],
  "suggestions_count": 5
}
```
- **User Journey Reference**: See "User Journey 5: Receiving and Applying AI Feedback" in the user journey flows document

#### 4. Get Suggestions
- **URL**: `/api/ai/analysis/{analysis_id}/suggestions`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Query Parameters**: section, limit
- **Response (200)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "section": "experience",
      "original_text": "Led development of web application",
      "suggested_text": "Led development of web application that increased user engagement by 35% and reduced load times by 50%",
      "reason": "Adding quantifiable achievements strengthens your experience"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```
- **User Journey Reference**: See "User Journey 5: Receiving and Applying AI Feedback" in the user journey flows document

#### 5. Apply Suggestion
- **URL**: `/api/ai/suggestion/{suggestion_id}/apply`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "success": true,
  "cv_id": "uuid",
  "updated_at": "2025-04-09T10:00:00Z"
}
```
- **User Journey Reference**: See "User Journey 5: Receiving and Applying AI Feedback" in the user journey flows document

#### 6. Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Response (200)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-04-09T10:00:00Z",
  "version": "1.0.0",
  "database_connection": "ok",
  "queue_connection": "ok",
  "openai_connection": "ok"
}
```

### Implementation Requirements
1. Implement JWT validation
2. Create database models and migrations
3. Implement OpenAI API integration
4. Set up job queue for async processing
5. Add proper error handling
6. Create comprehensive logging
7. Implement database connection pooling
8. Add health check endpoint
9. Ensure implementation supports the AI feedback flow described in the user journey document

### Testing Requirements
1. Test analysis request with valid/invalid data
2. Test OpenAI integration with mock responses
3. Verify job queue processing
4. Test suggestion application
5. Verify proper error responses
6. Test the complete AI feedback journey

## Component 8: Payment & Subscription Service

### Technology Stack
- FastAPI framework
- PostgreSQL database
- Stripe API integration

### Database Schema
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2) NOT NULL,
    stripe_price_id_monthly VARCHAR(255) NOT NULL,
    stripe_price_id_yearly VARCHAR(255) NOT NULL,
    features JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    stripe_subscription_id VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    card_brand VARCHAR(50) NOT NULL,
    card_last4 VARCHAR(4) NOT NULL,
    card_exp_month INTEGER NOT NULL,
    card_exp_year INTEGER NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id),
    stripe_invoice_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL,
    invoice_pdf VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    paid_at TIMESTAMP WITH TIME ZONE
);
```

### API Endpoints

#### 1. List Subscription Plans
- **URL**: `/api/payments/plans`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Premium",
      "description": "Access to all premium features",
      "price_monthly": 9.99,
      "price_yearly": 99.99,
      "features": [
        "AI optimization",
        "Premium templates",
        "Export to all formats"
      ]
    }
  ]
}
```
- **User Journey Reference**: See "User Journey 4: Subscribing to Premium Plan" in the user journey flows document

#### 2. Get Current Subscription
- **URL**: `/api/payments/subscription`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "id": "uuid",
  "plan": {
    "id": "uuid",
    "name": "Premium",
    "description": "Access to all premium features"
  },
  "status": "active",
  "current_period_end": "2025-05-09T10:00:00Z",
  "cancel_at_period_end": false
}
```
- **User Journey Reference**: See "User Journey 6: Managing Account and Subscription" in the user journey flows document

#### 3. Create Subscription
- **URL**: `/api/payments/subscription`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "plan_id": "uuid",
  "payment_method_id": "pm_card_visa",
  "billing_interval": "monthly"
}
```
- **Response (201)**:
```json
{
  "id": "uuid",
  "plan": {
    "id": "uuid",
    "name": "Premium"
  },
  "status": "active",
  "current_period_end": "2025-05-09T10:00:00Z",
  "cancel_at_period_end": false
}
```
- **User Journey Reference**: See "User Journey 4: Subscribing to Premium Plan" in the user journey flows document

#### 4. Cancel Subscription
- **URL**: `/api/payments/subscription/cancel`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "id": "uuid",
  "status": "active",
  "cancel_at_period_end": true,
  "current_period_end": "2025-05-09T10:00:00Z"
}
```
- **User Journey Reference**: See "User Journey 6: Managing Account and Subscription" in the user journey flows document

#### 5. List Payment Methods
- **URL**: `/api/payments/payment-methods`
- **Method**: GET
- **Headers**: Authorization: Bearer {token}
- **Response (200)**:
```json
{
  "items": [
    {
      "id": "uuid",
      "card_brand": "visa",
      "card_last4": "4242",
      "card_exp_month": 12,
      "card_exp_year": 2025,
      "is_default": true
    }
  ]
}
```
- **User Journey Reference**: See "User Journey 6: Managing Account and Subscription" in the user journey flows document

#### 6. Add Payment Method
- **URL**: `/api/payments/payment-methods`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "payment_method_id": "pm_card_visa",
  "is_default": true
}
```
- **Response (201)**:
```json
{
  "id": "uuid",
  "card_brand": "visa",
  "card_last4": "4242",
  "card_exp_month": 12,
  "card_exp_year": 2025,
  "is_default": true
}
```
- **User Journey Reference**: See "User Journey 6: Managing Account and Subscription" in the user journey flows document

#### 7. Create Checkout Session
- **URL**: `/api/payments/checkout-session`
- **Method**: POST
- **Headers**: Authorization: Bearer {token}
- **Request Body**:
```json
{
  "plan_id": "uuid",
  "billing_interval": "monthly",
  "success_url": "https://candidatev.com/subscription/success",
  "cancel_url": "https://candidatev.com/subscription/cancel"
}
```
- **Response (200)**:
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```
- **User Journey Reference**: See "User Journey 4: Subscribing to Premium Plan" in the user journey flows document

#### 8. Webhook Handler
- **URL**: `/api/payments/webhook`
- **Method**: POST
- **Headers**: Stripe-Signature: {signature}
- **Request Body**: Stripe event object
- **Response (200)**:
```json
{
  "received": true
}
```

#### 9. Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Response (200)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-04-09T10:00:00Z",
  "version": "1.0.0",
  "database_connection": "ok",
  "stripe_connection": "ok"
}
```

### Implementation Requirements
1. Implement JWT validation
2. Create database models and migrations
3. Implement Stripe API integration
4. Set up webhook handling
5. Add proper error handling
6. Create comprehensive logging
7. Implement database connection pooling
8. Add health check endpoint
9. Ensure implementation supports the subscription and payment flows described in the user journey document

### Testing Requirements
1. Test plan listing
2. Test subscription creation with valid/invalid data
3. Test payment method management
4. Verify webhook handling
5. Test checkout session creation
6. Verify proper error responses
7. Test the complete subscription journey

## Testing Strategy

### Unit Testing
1. Test all business logic functions
2. Test data validation
3. Test utility functions
4. Use pytest for backend, Jest for frontend

### Integration Testing
1. Test API endpoints with mock dependencies
2. Test database interactions
3. Test external service integrations with mocks
4. Use pytest for backend, React Testing Library for frontend

### End-to-End Testing
1. Test complete user flows as defined in the user journey document
2. Test authentication flows
3. Test CV creation and editing
4. Test subscription management
5. Use Cypress or Playwright

### Contract Testing
1. Verify API responses match interface specifications
2. Test error handling for all endpoints
3. Use Pact or similar tool

### Performance Testing
1. Test API response times
2. Test under load
3. Use k6 or similar tool

## Deployment Strategy

### CI/CD Pipeline
1. Set up GitHub Actions for CI/CD
2. Implement automated testing
3. Configure deployment to Vercel and Railway
4. Set up environment-specific configurations

### Environment Management
1. Create development, staging, and production environments
2. Implement environment-specific configurations
3. Set up database migrations
4. Configure logging and monitoring

### Monitoring and Logging
1. Implement centralized logging
2. Set up performance monitoring
3. Configure error tracking
4. Create health check dashboards

## Conclusion

This comprehensive guide provides all the necessary details to implement the CandidateV (pronounced "Candidate 5") application from scratch. By following these instructions and referring to the user journey flows document in the same directory, you can build a modern, microservices-based application with a clear separation of concerns and robust functionality.

Remember to:
1. Develop directly in the target environments (Vercel/Railway)
2. Strictly adhere to the interface specifications
3. Implement comprehensive testing
4. Manage dependencies explicitly
5. Follow the implementation sequence
6. Ensure all implementations support the user journeys defined in the reference document

Good luck with your implementation!
