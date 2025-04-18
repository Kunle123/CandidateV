# CandidateV API Gateway

This is the API Gateway for the CandidateV application. It routes requests to the appropriate microservices and provides mock implementations for development purposes.

## OpenAI Integration

This API Gateway now includes OpenAI integration for CV analysis, optimization, and cover letter generation. When properly configured, it will use OpenAI's GPT models for intelligent CV processing. If no OpenAI API key is provided, it will fall back to mock implementations.

### Features

1. **CV-Job Matching Analysis**
   - Endpoint: `POST /api/ai/job-match/analyze`
   - Analyzes a CV against a job description
   - Provides match score, strengths, weaknesses, and keyword analysis

2. **CV Optimization**
   - Endpoint: `POST /api/ai/optimize`
   - Improves CV sections to better match job requirements
   - Provides optimized content with specific improvements

3. **Cover Letter Generation**
   - Endpoint: `POST /api/ai/cover-letter`
   - Creates tailored cover letters based on CV and job description
   - Includes proper formatting, key points, and relevant keywords

## AI Service Status

### Required OpenAI API Key

The OpenAI API key is now **required** for AI features to work. If the OpenAI API key is not provided in the `.env` file:

- AI endpoints will return a 503 Service Unavailable response
- The response will include a message indicating the service is offline
- Frontend applications should handle this gracefully and display an appropriate message

Example response when API key is missing:
```json
{
  "status": "error",
  "message": "AI service is currently offline. Please try again later.",
  "service_status": "offline",
  "details": "OpenAI API key is not configured. Contact the administrator to enable this feature.",
  "timestamp": "2023-05-01T12:34:56.789Z"
}
```

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Copy `.env.example` to `.env` and configure environment variables:
   ```
   cp .env.example .env
   ```
4. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
5. Start the server:
   ```
   npm run dev
   ```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4-turbo-preview)
- Service URLs for various microservices

## API Usage Examples

### Job Match Analysis

```bash
curl -X POST http://localhost:3000/api/ai/job-match/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "cv_id": "cv-001",
    "job_description": "We are looking for a software developer with experience in React and Node.js..."
  }'
```

### CV Optimization

```bash
curl -X POST http://localhost:3000/api/ai/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "cv_id": "cv-001",
    "targets": [
      {
        "section": "summary",
        "content": "Experienced software developer with 5 years of experience."
      },
      {
        "section": "experience_1",
        "content": "Worked on various web applications using JavaScript."
      }
    ],
    "job_description": "Looking for a React developer with experience in building modern web applications..."
  }'
```

### Cover Letter Generation

```bash
curl -X POST http://localhost:3000/api/ai/cover-letter \
  -H "Content-Type: application/json" \
  -d '{
    "cv_id": "cv-001",
    "job_description": "We are seeking a project manager with experience in agile methodologies...",
    "company_name": "Tech Solutions Inc.",
    "recipient_name": "HR Department",
    "position_title": "Senior Project Manager",
    "user_comments": "I particularly enjoy working in fast-paced environments."
  }'
```

## Testing OpenAI Integration

To test the OpenAI integration, follow these steps:

1. Make sure you have set your OpenAI API key in the `.env` file:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. Run the test script:
   ```
   node test-openai.js
   ```

This script will:
1. Test the connection to the OpenAI API
2. Test the job match analysis endpoint to ensure it's working properly

If the tests are successful, you should see confirmation messages and sample responses.

## Features

- Route forwarding to appropriate microservices
- Request/response logging with correlation IDs
- Error standardization
- Health check endpoint
- CORS handling
- Basic request validation

## API Endpoints

### Health Check

- `GET /api/health`: Check service health and connected services

### Service Routes

- `/api/auth/*`: Routes to Authentication Service
- `/api/users/*`: Routes to User Management Service
- `/api/cv/*`: Routes to CV Management Service
- `/api/export/*`: Routes to Export Service
- `/api/ai/*`: Routes to AI Service
- `/api/payments/*`: Routes to Payment Service

## Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Then edit the `.env` file with appropriate values.

3. Run the service:
   ```
   npm run dev
   ```

## Deployment

This service is designed to be deployed on Vercel. To deploy:

1. Connect your repository to Vercel
2. Configure the environment variables in the Vercel dashboard
3. Deploy the application

## Logging

Logs are written to:
- Console (all levels)
- `logs/error.log` (error level only)
- `logs/combined.log` (all levels)

Each log entry includes a request ID for tracing requests across services. 