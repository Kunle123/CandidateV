# CandidateV Application

CandidateV (pronounced "Candidate 5") is a modern web application that helps users create, optimize, and manage professional CVs/resumes with AI assistance. The application follows a microservices architecture with clear separation between frontend and backend components.

## Project Overview

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

## Project Structure

- `/frontend`: React/Vite application for the user interface
- `/backend`: Backend microservices
  - `/auth_service`: Authentication and user management
  - `/user_service`: User profile management
  - `/cv_service`: CV creation and management
  - `/export_service`: Document export functionality
  - `/ai_service`: AI optimization for CVs
  - `/payment_service`: Subscription and payment processing
- `/infra`: Infrastructure setup and deployment pipelines

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.9+)
- PostgreSQL
- Redis (optional, for rate limiting)

### Development Environment Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-org/candidatev.git
   cd candidatev
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env` in each service directory
   - Update the variables with your configuration

3. Start the services:
   - Each service can be run independently
   - Follow the README in each service directory for specific instructions

## Deployment

### Frontend (Vercel)

1. Connect your repository to Vercel
2. Configure the environment variables as specified in the documentation
3. Deploy the application

### Backend (Railway)

1. Create a new project for each microservice in Railway
2. Configure the environment variables
3. Connect to the repository and deploy

## Documentation

- Implementation Guide: See `CandidateV Application_ Comprehensive AI Implementation Guide.md`
- User Journeys: See `CandidateV Application_ User Journey Flows.md`

## License

This project is licensed under the MIT License - see the LICENSE file for details. 