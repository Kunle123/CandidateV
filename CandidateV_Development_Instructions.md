# CandidateV Development Instructions

## Introduction

This document provides comprehensive instructions for developing the CandidateV application, a modern web application that helps users create, optimize, and manage professional CVs/resumes with AI assistance. It follows a microservices architecture with clear separation between frontend and backend components.

**IMPORTANT: These instructions are designed to be robust against interruptions. If development is interrupted for any reason, use this document to determine the current state of the project and continue from where work left off.**

## Development Principles

1. **Environment-First Development**: Always develop in target environments (Vercel/Railway)
2. **Interface Compliance**: Strictly implement interfaces as defined in the implementation guide
3. **Component Independence**: Each service must function independently
4. **Progressive Implementation**: Complete one component fully before moving to the next
5. **Continuous Testing**: Test each component thoroughly before proceeding

## Project State Management

To manage interruptions effectively:

1. **Always update the checklist** in `CandidateV_Implementation_Checklist.md` after completing any task
2. **Commit frequently** with descriptive messages that indicate what was completed
3. **Document any challenges** in the project's `debugging_lessons_learned.md` file
4. **Add TODOs in code** for partially completed work
5. **Update environment configuration** when services are added or changed

## Implementation Sequence

Follow this exact sequence for implementation. Each step builds on the previous ones, ensuring coherent development even with interruptions.

### Phase 1: Setup and Initial Assessment (COMPLETED)

- [x] Confirm environment configurations (Vercel/Railway)
- [x] Review existing code and structure
- [x] Set up development environment

### Phase 2: Contract Enforcement System

This phase addresses the challenge of ensuring all components adhere to the interface contracts.

1. **Create Contract Validation Tools**
   - [ ] Develop contract testing framework
     - [ ] Create JSON Schema definitions for all API contracts
     - [ ] Implement request/response validators for each service
     - [ ] Set up automated tests to verify contract compliance
   - [ ] Add contract version headers to all API responses

   **Interruption Recovery**: Check `backend/{service}/tests/contract_tests` for validation progress

2. **Implement Service Documentation**
   - [ ] Set up Swagger/OpenAPI for each service
   - [ ] Generate API documentation from contracts
   - [ ] Create developer portal for contract discovery

   **Interruption Recovery**: Check for OpenAPI YAML files in each service directory

### Phase 3: Backend Services Completion

#### Authentication Service (Partially Completed)

- [x] JWT implementation
- [x] Refresh token mechanism
- [ ] Password reset functionality
  - [ ] Create forgot password endpoint
  - [ ] Implement email token generation
  - [ ] Add reset password endpoint
  - [ ] Connect email service
- [ ] Database Integration
  - [ ] Replace mock database with PostgreSQL
  - [ ] Implement migration scripts
  - [ ] Add database connection pooling
- [ ] Comprehensive testing
  - [ ] Unit tests for all endpoints
  - [ ] Integration tests
  - [ ] Load testing for authentication endpoints

**Interruption Recovery**: Check `backend/auth_service/app.py` and test coverage in `backend/auth_service/tests/`

#### User Management Service (Partially Completed)

- [x] Basic profile CRUD operations
- [ ] Complete profile image management
  - [ ] Set up S3 bucket for image storage
  - [ ] Implement secure upload/download
  - [ ] Add image optimization
- [ ] User preferences system
  - [ ] Complete preferences API
  - [ ] Add preferences cache
- [ ] Database Integration
  - [ ] Replace mock database with PostgreSQL
  - [ ] Create all necessary tables
  - [ ] Implement proper relations
- [ ] Comprehensive testing
  - [ ] Unit tests for all endpoints
  - [ ] Integration tests with Auth Service

**Interruption Recovery**: Check `backend/user_service/app.py` and test coverage in `backend/user_service/tests/`

#### CV Management Service (Partially Completed)

- [x] Basic CV CRUD operations
- [ ] Complete CV templates system
  - [ ] Create default templates
  - [ ] Add premium template flags
  - [ ] Implement template preview generation
- [ ] CV version history
  - [ ] Implement versioning system
  - [ ] Add version comparison
  - [ ] Create restore functionality
- [ ] Sharing functionality
  - [ ] Generate secure share tokens
  - [ ] Create public view endpoints
  - [ ] Add expiration control
- [ ] Database Integration
  - [ ] Replace mock database with PostgreSQL
  - [ ] Implement proper version history tables
  - [ ] Add efficient querying for CV data
- [ ] Comprehensive testing
  - [ ] Unit tests for all endpoints
  - [ ] Integration tests with User Service

**Interruption Recovery**: Check `backend/cv_service/app.py` and test coverage in `backend/cv_service/tests/`

#### Export Service (Basic Structure Only)

- [ ] Document generation system
  - [ ] Implement PDF export
  - [ ] Create DOCX export
  - [ ] Add template rendering engine
- [ ] Async job processing
  - [ ] Set up Redis queue
  - [ ] Create worker processes
  - [ ] Implement job status tracking
- [ ] Storage integration
  - [ ] Configure S3 storage for exports
  - [ ] Add secure download links
  - [ ] Implement file cleanup policy
- [ ] Database Integration
  - [ ] Create tables for export jobs
  - [ ] Track export history
- [ ] Comprehensive testing
  - [ ] Unit tests for export formats
  - [ ] Integration tests with CV Service

**Interruption Recovery**: Check `backend/export_service/app.py` and job queue implementation in `backend/export_service/workers/`

#### AI Service (Not Started)

- [ ] Initial service setup
  - [ ] Create base FastAPI application
  - [ ] Set up Docker configuration
  - [ ] Configure Railway deployment
- [ ] OpenAI integration
  - [ ] Implement API client
  - [ ] Add retry mechanisms
  - [ ] Set up proper error handling
- [ ] CV analysis system
  - [ ] Create analysis algorithms
  - [ ] Implement suggestion generation
  - [ ] Add scoring system
- [ ] Async processing
  - [ ] Set up job queue
  - [ ] Create worker processes
  - [ ] Implement status tracking
- [ ] Database Integration
  - [ ] Create tables for analyses and suggestions
  - [ ] Track applied suggestions
- [ ] Comprehensive testing
  - [ ] Unit tests for analysis logic
  - [ ] Integration tests with CV Service
  - [ ] Mock OpenAI for testing

**Interruption Recovery**: Check for the existence of `backend/ai_service/app.py`

#### Payment Service (Not Started)

- [ ] Initial service setup
  - [ ] Create base FastAPI application
  - [ ] Set up Docker configuration
  - [ ] Configure Railway deployment
- [ ] Stripe integration
  - [ ] Implement API client
  - [ ] Create webhook handlers
  - [ ] Set up subscription management
- [ ] Plan management
  - [ ] Create subscription plans
  - [ ] Implement feature flags
  - [ ] Add upgrade/downgrade logic
- [ ] Invoicing system
  - [ ] Generate invoices
  - [ ] Create payment history
  - [ ] Implement receipt delivery
- [ ] Database Integration
  - [ ] Create tables for payments and subscriptions
  - [ ] Track payment history
- [ ] Comprehensive testing
  - [ ] Unit tests for payment logic
  - [ ] Integration tests with User Service
  - [ ] Test Stripe in sandbox mode

**Interruption Recovery**: Check for the existence of `backend/payment_service/app.py`

### Phase 4: Inter-Service Communication

This phase addresses the challenge of service-to-service communication patterns.

1. **Create Service Discovery System**
   - [ ] Implement service registry
   - [ ] Add health check integration
   - [ ] Create service client libraries

2. **Implement Circuit Breakers**
   - [ ] Add circuit breaker pattern to service calls
   - [ ] Implement fallback mechanisms
   - [ ] Create retry policies

3. **Standardize Error Handling**
   - [ ] Create common error format library
   - [ ] Implement consistent error mapping
   - [ ] Add correlation IDs for request tracing

**Interruption Recovery**: Check for the implementation of client libraries in `backend/shared/` and usage in service code

### Phase 5: Frontend Development

#### Core UI Components

- [ ] Design system implementation
  - [ ] Create base component library
  - [ ] Implement theme provider
  - [ ] Add responsive layout components
- [ ] Navigation components
  - [ ] Create header/footer
  - [ ] Implement sidebar navigation
  - [ ] Add breadcrumb system
- [ ] Authentication UI
  - [ ] Complete login/register forms
  - [ ] Implement password reset UI
  - [ ] Add session management
- [ ] Notification system
  - [ ] Create toast notifications
  - [ ] Implement alert components
  - [ ] Add loading indicators

**Interruption Recovery**: Check the implementation status in `frontend/src/components/`

#### User Management UI

- [ ] Profile management
  - [ ] Create profile editor
  - [ ] Implement image upload
  - [ ] Add profile viewing component
- [ ] Account settings
  - [ ] Create settings pages
  - [ ] Implement preference controls
  - [ ] Add account management options
- [ ] Experience & Education Management
  - [ ] Create CRUD interfaces
  - [ ] Implement drag-and-drop reordering
  - [ ] Add validation

**Interruption Recovery**: Check the implementation status in `frontend/src/pages/profile/`

#### CV Management UI

- [ ] CV creation
  - [ ] Implement template selection
  - [ ] Create CV editor with sections
  - [ ] Add validation and guidance
- [ ] CV editing
  - [ ] Create WYSIWYG editor
  - [ ] Implement real-time preview
  - [ ] Add section management
- [ ] Version history
  - [ ] Create version browser
  - [ ] Implement diff view
  - [ ] Add restore functionality
- [ ] Sharing UI
  - [ ] Create share dialog
  - [ ] Implement link management
  - [ ] Add visibility controls

**Interruption Recovery**: Check the implementation status in `frontend/src/pages/cv/`

#### AI Features UI

- [ ] Analysis UI
  - [ ] Create analysis request form
  - [ ] Implement progress tracking
  - [ ] Add results dashboard
- [ ] Suggestion management
  - [ ] Create suggestion browser
  - [ ] Implement accept/reject controls
  - [ ] Add explanation components
- [ ] Improvement tracking
  - [ ] Create metrics dashboard
  - [ ] Implement before/after comparison
  - [ ] Add scoring visualization

**Interruption Recovery**: Check the implementation status in `frontend/src/components/ai/`

#### Subscription & Payment UI

- [ ] Plan selection
  - [ ] Create plan comparison
  - [ ] Implement feature highlighting
  - [ ] Add subscription controls
- [ ] Checkout process
  - [ ] Create payment form
  - [ ] Implement Stripe Elements
  - [ ] Add confirmation flow
- [ ] Subscription management
  - [ ] Create billing dashboard
  - [ ] Implement payment method controls
  - [ ] Add upgrade/downgrade flow
- [ ] Invoice history
  - [ ] Create invoice browser
  - [ ] Implement receipt download
  - [ ] Add payment history

**Interruption Recovery**: Check the implementation status in `frontend/src/pages/subscription/`

### Phase 6: Integration Testing

- [ ] Backend Integration
  - [ ] Create end-to-end API tests
  - [ ] Test service communication
  - [ ] Verify error propagation
- [ ] Frontend-Backend Integration
  - [ ] Test all API interactions
  - [ ] Verify form submissions
  - [ ] Check error handling
- [ ] User Journey Testing
  - [ ] Test complete user journeys
  - [ ] Verify mobile responsiveness
  - [ ] Check accessibility compliance

**Interruption Recovery**: Check the test coverage in `tests/` directory

### Phase 7: Deployment & Monitoring

- [ ] CI/CD Pipeline
  - [ ] Configure GitHub Actions
  - [ ] Set up deployment pipelines
  - [ ] Add test automation
- [ ] Monitoring Setup
  - [ ] Implement centralized logging
  - [ ] Set up performance monitoring
  - [ ] Create alert system
- [ ] Security Configuration
  - [ ] Perform security audit
  - [ ] Implement security headers
  - [ ] Add rate limiting

**Interruption Recovery**: Check the configuration in `.github/workflows/` and infrastructure files

### Phase 8: Documentation & Final Preparation

- [ ] User Documentation
  - [ ] Create user guides
  - [ ] Add help center content
  - [ ] Create tutorial videos
- [ ] Developer Documentation
  - [ ] Document architecture
  - [ ] Create API documentation
  - [ ] Add onboarding guides
- [ ] Operational Documentation
  - [ ] Create runbooks
  - [ ] Document monitoring procedures
  - [ ] Add incident response plans

**Interruption Recovery**: Check documentation in the `docs/` directory

## Handling Unanticipated Interruptions

If development is interrupted unexpectedly, follow these steps to resume work:

1. **Assess the current state**:
   - Review `CandidateV_Implementation_Checklist.md` to see what was completed
   - Check git history for the last commits and their messages
   - Review any TODOs left in the code

2. **Verify environment**:
   - Ensure all environment variables are properly set
   - Check service health endpoints to verify what's running
   - Validate database state and migrations

3. **Run tests**:
   - Execute the test suite to verify what's working
   - Check for failing tests that might indicate incomplete work
   - Review test coverage to identify untested areas

4. **Review documentation**:
   - Check `debugging_lessons_learned.md` for any known issues
   - Review implementation notes for insights into challenges
   - Look for comments in code that indicate work in progress

5. **Resume work**:
   - Identify the next unchecked item in this document
   - Start from the beginning of that section
   - Make sure to understand the requirements before continuing

## Versioning Strategy

To handle interface contract changes without breaking existing integrations:

1. **Never change existing endpoints**: Create new versions instead
2. **Use API versioning in URLs**: (e.g., `/api/v1/users`, `/api/v2/users`)
3. **Maintain backward compatibility**: Support older versions for a deprecation period
4. **Document changes clearly**: Note differences between versions
5. **Use feature flags**: Enable gradual rollout of new features

## Testing Strategy

1. **Unit Testing**: Test individual functions and methods
2. **Integration Testing**: Test service interactions
3. **Contract Testing**: Verify API contract compliance
4. **User Journey Testing**: Test complete workflows
5. **Performance Testing**: Test under load
6. **Security Testing**: Test for vulnerabilities

Run tests frequently during development to catch issues early.

## Communication Patterns

Standardize these communication patterns across services:

1. **Request/Response**: Synchronous API calls with standard response format
2. **Event-Based**: Asynchronous communication via message queue
3. **Circuit Breaking**: Fail fast with fallbacks for service failures
4. **Correlation Tracking**: Use request IDs across service calls
5. **Retry Policies**: Implement consistent retry logic

## Final Checklist Before Launch

- [ ] All services passing health checks
- [ ] All critical user journeys tested
- [ ] Security audit completed
- [ ] Performance testing under load
- [ ] Documentation completed
- [ ] Monitoring and alerts configured
- [ ] Backup and recovery tested
- [ ] Compliance requirements met

**Remember**: Always update this document and the implementation checklist as you progress to maintain continuity in case of interruptions. 