# CandidateV Application: User Journey Flows

This document outlines the key user journeys for the CandidateV application, providing a clear understanding of how users interact with the system and how different components work together to deliver the functionality.

## User Journey 1: New User Registration and Onboarding

### Flow Steps:
1. **Landing Page Visit**
   - User visits the CandidateV landing page
   - System displays marketing content and registration/login options

2. **Registration**
   - User clicks "Sign Up" button
   - System displays registration form
   - User enters email, password, and name
   - User submits registration form
   - **Components Involved**:
     - Frontend Application: Registration form UI
     - Authentication Service: Processes registration request
     - User Management Service: Creates user profile

3. **Email Verification**
   - System sends verification email
   - User clicks verification link in email
   - System verifies email and activates account
   - **Components Involved**:
     - Authentication Service: Generates verification token and validates it
     - Email Service: Sends verification email

4. **Initial Profile Setup**
   - System redirects to profile setup page
   - User enters basic professional information
   - User uploads profile picture (optional)
   - User submits profile information
   - **Components Involved**:
     - Frontend Application: Profile setup UI
     - User Management Service: Stores profile information
     - API Gateway: Routes requests

5. **Dashboard Introduction**
   - System displays dashboard with tutorial overlay
   - User views tutorial explaining key features
   - System highlights "Create CV" button
   - **Components Involved**:
     - Frontend Application: Dashboard UI and tutorial

### Data Flow:
```
User → Frontend → API Gateway → Authentication Service → Database
                                                      ↓
User ← Frontend ← API Gateway ← User Management Service
```

## User Journey 2: Creating a New CV

### Flow Steps:
1. **Template Selection**
   - User clicks "Create New CV" button on dashboard
   - System displays available templates
   - User browses templates (free and premium)
   - User selects desired template
   - **Components Involved**:
     - Frontend Application: Template gallery UI
     - CV Management Service: Provides template data
     - Payment & Subscription Service: Checks if user can access premium templates

2. **CV Information Entry**
   - System displays CV editor with template structure
   - User enters personal information
   - User adds education history
   - User adds work experience
   - User adds skills and other sections
   - **Components Involved**:
     - Frontend Application: CV editor UI
     - CV Management Service: Stores CV data incrementally

3. **Real-time Preview**
   - System displays real-time preview of CV
   - User toggles between edit and preview modes
   - **Components Involved**:
     - Frontend Application: Preview rendering
     - CV Management Service: Provides formatted data

4. **AI Suggestions**
   - User clicks "Get AI Suggestions" button
   - System processes CV with AI
   - System displays improvement suggestions
   - User reviews and applies/rejects suggestions
   - **Components Involved**:
     - Frontend Application: Suggestions UI
     - AI Optimization Service: Analyzes CV and generates suggestions
     - CV Management Service: Updates CV with applied suggestions

5. **Saving CV**
   - User clicks "Save" button
   - System saves CV to user's account
   - System confirms save with notification
   - **Components Involved**:
     - Frontend Application: Save UI and notifications
     - CV Management Service: Persists CV data
     - User Management Service: Associates CV with user

### Data Flow:
```
User → Frontend → API Gateway → CV Management Service → Database
                              ↓
User ← Frontend ← API Gateway ← AI Optimization Service
```

## User Journey 3: Exporting and Sharing CV

### Flow Steps:
1. **Export Format Selection**
   - User opens saved CV
   - User clicks "Export" button
   - System displays available export formats
   - User selects desired format (PDF, DOCX, etc.)
   - **Components Involved**:
     - Frontend Application: Export UI
     - Export & Document Service: Lists available formats
     - Payment & Subscription Service: Checks if user can access premium formats

2. **Export Processing**
   - User confirms export
   - System initiates export job
   - System displays progress indicator
   - System notifies when export is complete
   - **Components Involved**:
     - Frontend Application: Progress UI
     - Export & Document Service: Processes export job
     - CV Management Service: Provides CV data

3. **Download**
   - System displays download button
   - User clicks download
   - System delivers exported file to user
   - **Components Involved**:
     - Frontend Application: Download UI
     - Export & Document Service: Provides file download

4. **Sharing CV**
   - User clicks "Share" button
   - System displays sharing options
   - User selects sharing method (link, email, etc.)
   - User enters recipient details if needed
   - **Components Involved**:
     - Frontend Application: Sharing UI
     - CV Management Service: Generates sharing links
     - User Management Service: Validates sharing permissions

5. **Recipient View**
   - Recipient receives shared CV link
   - Recipient opens link in browser
   - System displays read-only CV view
   - **Components Involved**:
     - Frontend Application: Public CV view
     - CV Management Service: Validates sharing token and provides data

### Data Flow:
```
User → Frontend → API Gateway → CV Management Service → Database
                              ↓
User ← Frontend ← API Gateway ← Export & Document Service
```

## User Journey 4: Subscribing to Premium Plan

### Flow Steps:
1. **Plan Discovery**
   - User encounters premium feature limitation
   - System displays upgrade prompt
   - User clicks "View Plans" button
   - System displays subscription plans
   - **Components Involved**:
     - Frontend Application: Plans UI
     - Payment & Subscription Service: Provides plan data

2. **Plan Selection**
   - User reviews available plans
   - User selects desired plan
   - User chooses billing cycle (monthly/yearly)
   - **Components Involved**:
     - Frontend Application: Plan selection UI
     - Payment & Subscription Service: Provides plan details

3. **Payment Information**
   - User clicks "Subscribe" button
   - System displays payment form
   - User enters payment details
   - User submits payment information
   - **Components Involved**:
     - Frontend Application: Payment UI
     - Payment & Subscription Service: Processes payment through Stripe
     - User Management Service: Updates user subscription status

4. **Confirmation**
   - System processes payment
   - System displays confirmation
   - System updates user's subscription status
   - **Components Involved**:
     - Frontend Application: Confirmation UI
     - Payment & Subscription Service: Confirms subscription
     - User Management Service: Updates user permissions

5. **Access to Premium Features**
   - System unlocks premium features
   - User receives welcome email with premium tips
   - Dashboard updates to show premium status
   - **Components Involved**:
     - Frontend Application: Updated UI with premium features
     - All Services: Check subscription status for feature access

### Data Flow:
```
User → Frontend → API Gateway → Payment & Subscription Service → Stripe API
                              ↓
User ← Frontend ← API Gateway ← User Management Service
```

## User Journey 5: Receiving and Applying AI Feedback

### Flow Steps:
1. **Requesting AI Analysis**
   - User opens saved CV
   - User clicks "Analyze with AI" button
   - User selects analysis type (general, job-specific)
   - User submits analysis request
   - **Components Involved**:
     - Frontend Application: Analysis request UI
     - AI Optimization Service: Initiates analysis
     - Payment & Subscription Service: Validates feature access

2. **Waiting for Analysis**
   - System displays progress indicator
   - System processes CV with AI in background
   - System notifies user when analysis is complete
   - **Components Involved**:
     - Frontend Application: Progress UI and notifications
     - AI Optimization Service: Processes analysis job
     - OpenAI API: Provides AI capabilities

3. **Reviewing Analysis Results**
   - User opens analysis results
   - System displays overall score and summary
   - System shows strengths and weaknesses
   - **Components Involved**:
     - Frontend Application: Analysis results UI
     - AI Optimization Service: Provides analysis data

4. **Viewing Suggestions**
   - User browses section-by-section suggestions
   - System displays original text and suggested improvements
   - System explains reasoning for each suggestion
   - **Components Involved**:
     - Frontend Application: Suggestions UI
     - AI Optimization Service: Provides detailed suggestions

5. **Applying Suggestions**
   - User reviews each suggestion
   - User clicks "Apply" or "Ignore" for each suggestion
   - System updates CV with applied suggestions
   - System tracks improvement metrics
   - **Components Involved**:
     - Frontend Application: Suggestion application UI
     - AI Optimization Service: Tracks applied suggestions
     - CV Management Service: Updates CV content

### Data Flow:
```
User → Frontend → API Gateway → AI Optimization Service → OpenAI API
                              ↓
User ← Frontend ← API Gateway ← CV Management Service
```

## User Journey 6: Managing Account and Subscription

### Flow Steps:
1. **Accessing Account Settings**
   - User clicks profile icon
   - User selects "Account Settings" from dropdown
   - System displays account settings page
   - **Components Involved**:
     - Frontend Application: Account settings UI
     - User Management Service: Provides user data

2. **Updating Profile Information**
   - User edits profile information
   - User uploads new profile picture
   - User saves changes
   - **Components Involved**:
     - Frontend Application: Profile edit UI
     - User Management Service: Updates user data

3. **Managing Subscription**
   - User navigates to "Subscription" tab
   - System displays current subscription details
   - User can upgrade, downgrade, or cancel subscription
   - **Components Involved**:
     - Frontend Application: Subscription management UI
     - Payment & Subscription Service: Handles subscription changes
     - Stripe API: Processes payment changes

4. **Viewing Payment History**
   - User navigates to "Billing" tab
   - System displays payment history and invoices
   - User can download invoices
   - **Components Involved**:
     - Frontend Application: Billing history UI
     - Payment & Subscription Service: Provides invoice data

5. **Updating Payment Methods**
   - User adds or updates payment method
   - System securely processes payment information
   - System confirms payment method update
   - **Components Involved**:
     - Frontend Application: Payment method UI
     - Payment & Subscription Service: Updates payment methods
     - Stripe API: Handles payment method storage

### Data Flow:
```
User → Frontend → API Gateway → User Management Service → Database
                              ↓
User ← Frontend ← API Gateway ← Payment & Subscription Service → Stripe API
```

## User Journey 7: CV Version History and Restoration

### Flow Steps:
1. **Viewing Version History**
   - User opens saved CV
   - User clicks "Version History" button
   - System displays list of previous versions with timestamps
   - **Components Involved**:
     - Frontend Application: Version history UI
     - CV Management Service: Provides version data

2. **Comparing Versions**
   - User selects two versions to compare
   - System displays side-by-side comparison
   - System highlights differences between versions
   - **Components Involved**:
     - Frontend Application: Comparison UI
     - CV Management Service: Provides version comparison

3. **Previewing Previous Version**
   - User clicks "Preview" on a previous version
   - System displays read-only view of that version
   - **Components Involved**:
     - Frontend Application: Version preview UI
     - CV Management Service: Retrieves specific version

4. **Restoring Previous Version**
   - User clicks "Restore" on a previous version
   - System prompts for confirmation
   - User confirms restoration
   - System restores CV to selected version
   - **Components Involved**:
     - Frontend Application: Restoration UI
     - CV Management Service: Performs version restoration

5. **Continuing Editing**
   - System displays restored version in editor
   - User can continue editing from restored state
   - **Components Involved**:
     - Frontend Application: CV editor UI
     - CV Management Service: Saves new edits

### Data Flow:
```
User → Frontend → API Gateway → CV Management Service → Database
                              ↓
User ← Frontend ← API Gateway ← CV Management Service
```

## User Journey 8: Mobile Experience

### Flow Steps:
1. **Mobile Access**
   - User accesses CandidateV on mobile device
   - System displays responsive mobile interface
   - **Components Involved**:
     - Frontend Application: Responsive UI

2. **CV Viewing**
   - User browses saved CVs
   - System displays mobile-optimized CV list
   - User selects CV to view
   - **Components Involved**:
     - Frontend Application: Mobile CV view
     - CV Management Service: Provides CV data

3. **Limited Editing**
   - User makes minor edits to CV
   - System provides simplified editing interface
   - User saves changes
   - **Components Involved**:
     - Frontend Application: Mobile editing UI
     - CV Management Service: Saves updates

4. **Sharing on Mobile**
   - User shares CV directly to mobile apps
   - System integrates with mobile sharing APIs
   - **Components Involved**:
     - Frontend Application: Mobile sharing integration
     - CV Management Service: Generates sharing links

5. **Notifications**
   - User receives mobile notifications
   - System delivers push notifications for important events
   - **Components Involved**:
     - Frontend Application: Push notification handling
     - Notification Service: Sends notifications

### Data Flow:
```
User → Mobile Frontend → API Gateway → Various Backend Services
                                     ↓
User ← Mobile Frontend ← API Gateway ← Various Backend Services
```

## Component Interaction Summary

This section summarizes how components interact across all user journeys:

### Authentication Service
- Handles user registration, login, and token management
- Verifies user identity for all secured operations
- Manages refresh tokens for persistent sessions
- Interacts with: User Management Service, API Gateway

### User Management Service
- Stores and manages user profile information
- Handles user preferences and settings
- Manages user permissions and roles
- Interacts with: Authentication Service, CV Management Service, Payment & Subscription Service

### CV Management Service
- Stores and manages CV data and templates
- Handles CV creation, editing, and version history
- Manages sharing and permissions for CVs
- Interacts with: User Management Service, AI Optimization Service, Export & Document Service

### AI Optimization Service
- Analyzes CVs for improvement opportunities
- Generates suggestions for CV enhancement
- Tracks applied suggestions and improvements
- Interacts with: CV Management Service, OpenAI API

### Export & Document Service
- Generates CV exports in various formats
- Manages export jobs asynchronously
- Provides download capabilities for exported documents
- Interacts with: CV Management Service

### Payment & Subscription Service
- Manages subscription plans and billing
- Processes payments through Stripe
- Tracks user subscription status
- Controls access to premium features
- Interacts with: User Management Service, Stripe API

### API Gateway
- Routes requests to appropriate microservices
- Handles authentication and authorization
- Manages CORS and request/response formatting
- Interacts with: All backend services

### Frontend Application
- Provides user interface for all interactions
- Manages client-side state and navigation
- Handles responsive design for different devices
- Interacts with: API Gateway

This comprehensive view of user journeys demonstrates how the different components of the CandidateV application work together to provide a seamless user experience while maintaining separation of concerns in the microservices architecture.
