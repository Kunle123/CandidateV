# CandidateV: AI-Powered CV Builder

> **IMPORTANT DEPLOYMENT NOTE**: This project uses a distributed architecture with the frontend deployed on Vercel and backend services on Railway. See `DEPLOYMENT_ARCHITECTURE.md` for detailed information about the current architecture and routing setup.

CandidateV (pronounced "Candidate 5") is a modern web application that helps users create, optimize, and manage professional CVs/resumes with AI assistance. The application follows a microservices architecture with clear separation between frontend and backend components.

## Project Overview

### Core Features
- User authentication and profile management
- CV creation and editing with templates
- AI-powered CV optimization and suggestions
- CV-to-job matching with feedback
- Cover letter generation assistance
- Export to multiple formats (PDF, DOCX)
- Subscription-based premium features
- Payment processing with Stripe

### Technical Architecture
- Frontend: React/Vite application deployed on Vercel
- Backend: Multiple microservices deployed on Railway
- Database: PostgreSQL for persistent storage
- External Services: OpenAI API, Stripe Payments

## Project Structure

- `/frontend`: React/Vite application for the user interface
  - Contains the React application source code in `/frontend/src`
- `/backend`: Backend microservices
  - `/api_gateway`: API Gateway for routing requests to services
  - `/auth_service`: Authentication and user management
  - `/user_service`: User profile management
  - `/cv_service`: CV creation and management
  - `/export_service`: Document export functionality
  - `/ai_service`: AI optimization, job matching, and cover letter generation
  - `/payment_service`: Subscription and payment processing with Stripe
- `/infra`: Infrastructure setup and deployment pipelines
- `/api`: Legacy API implementation (no longer used in production)

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.9+)
- PostgreSQL
- Redis (optional, for rate limiting)
- OpenAI API key (for AI features)
- Stripe API key (for payment features)

### Development Environment Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-org/candidatev.git
   cd candidatev
   ```

2. Install root dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in each service directory
   - Update the variables with your configuration

4. Install all dependencies:
   ```
   npm run install:all
   ```

5. Start all services:
   ```
   npm run start
   ```

   This will start all microservices on their designated ports:
   - API Gateway: http://localhost:8000
   - Auth Service: http://localhost:8001
   - User Service: http://localhost:8002
   - CV Service: http://localhost:8003
   - Export Service: http://localhost:8006
   - AI Service: http://localhost:8004
   - Payment Service: http://localhost:8005
   - Frontend: http://localhost:3000

### Running Individual Services

You can start individual services using the npm scripts:

```
npm run start:frontend    # Start the frontend only
npm run start:api         # Start the API Gateway only
npm run start:auth        # Start the Auth Service only
npm run start:user        # Start the User Service only
npm run start:cv          # Start the CV Service only
npm run start:ai          # Start the AI Service only
npm run start:payment     # Start the Payment Service only
```

## Authentication System

### Authentication Flow
1. User logs in via the frontend application
2. Backend auth_service validates credentials and issues a JWT token
3. Frontend stores the token in localStorage
4. All subsequent API requests include the token in the Authorization header
5. Backend services validate the token before processing requests

### Development Authentication

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

## AI Features

The AI service provides several key features:

1. **CV Analysis**: Evaluates CVs and provides feedback on content, structure, and effectiveness
2. **Job Match Analysis**: Compares CVs against job descriptions to measure compatibility and identify gaps
3. **CV Optimization**: Provides specific recommendations to improve CVs
4. **Cover Letter Generation**: Creates customized cover letters based on CV content and job descriptions

To use these features, you need:
1. An OpenAI API key set in the `.env` file of the AI service
2. Authentication with a valid JWT token
3. Connection to the CV service for accessing CV data

## Payment System

The payment service provides subscription management using Stripe:

1. **Subscription Plans**: Basic, Pro, and Enterprise tiers with different feature sets
2. **Secure Checkout**: Integration with Stripe Checkout for payment processing
3. **Webhook Handling**: Processing subscription lifecycle events from Stripe
4. **User Subscription Management**: API for retrieving and managing user subscriptions

To use payment features, you need:
1. A Stripe API key set in the `.env` file of the payment service
2. Stripe webhook secret for webhook validation
3. Authentication with a valid JWT token
4. Connection to the user service for user data

## Deployment

### Using Deployment Scripts

The project includes scripts for deploying all services to Railway:

#### For Windows:
```
npm run deploy:railway
```
or
```
.\deploy-to-railway.ps1
```

#### For Linux/Mac:
```
npm run deploy:railway:unix
```
or
```
bash ./deploy-to-railway.sh
```

These scripts will:
1. Verify Railway CLI is installed
2. Login to Railway if needed
3. Deploy each service with proper configuration
4. Generate public domains for each service

### Manual Deployment

#### Frontend (Vercel)

1. Connect your repository to Vercel
2. Configure the environment variables as specified in the documentation
3. Deploy the application
   ```
   npm run deploy:vercel
   ```

#### Backend (Railway)

1. Create a new project for each microservice in Railway
2. Configure the environment variables as specified in DEPLOYMENT.md
3. Deploy each service using the Railway CLI

For detailed deployment instructions, see the [DEPLOYMENT.md](DEPLOYMENT.md) file.

## Testing

Run tests for all services:

```
npm run test
```

Or test individual services:

```
npm run test:auth
npm run test:user
npm run test:cv
npm run test:ai
npm run test:payment
npm run test:frontend
```

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md): Detailed deployment instructions
- [IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md): Current project status
- [CandidateV_Implementation_Checklist.md](CandidateV_Implementation_Checklist.md): Implementation task list

## License

This project is proprietary and confidential. 