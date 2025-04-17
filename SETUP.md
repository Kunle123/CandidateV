# CandidateV Setup Guide

This guide will help you set up and run the CandidateV application locally.

## Prerequisites

- Node.js v16+
- Python 3.10+
- PowerShell (Windows) or Bash (Linux/macOS)

## Installation

1. Clone the repository (if you haven't already)
2. Install dependencies for the root project, frontend, and API gateway:

```bash
# Root project dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..

# API Gateway dependencies
cd api
npm install
cd ..
```

## Running the Application

### Step 1: Clean up ports (if needed)

If you encounter port conflicts, run the cleanup script:

```
.\cleanup-ports.ps1
```

### Step 2: Start the Backend Services

You can use the included script to start all backend services:

```
.\start-complete.ps1
```

This will start all required services:
- Auth Service (port 8000)
- User Service (port 8001)
- CV Service (port 8002)
- Export Service (port 8003)
- AI Service (port 8004)
- Payment Service (port 8005)

### Step 3: Start the API Gateway and Frontend

For Windows users with PowerShell, use one of these methods:

**Option 1: Using separate PowerShell windows**

1. Open a new PowerShell window and run:
```
.\start-api.ps1
```

2. Open another PowerShell window and run:
```
.\start-frontend.ps1
```

**Option 2: Using the batch script**

Run the following command:
```
.\start-dev.bat
```

This will open separate command windows for the API Gateway and Frontend.

## Accessing the Application

Once everything is running:

- Frontend: http://localhost:5173 (or another port if 5173 is in use)
- API Gateway: http://localhost:3000

## Demo Login

You can use the following credentials to log in:

- Email: demo@candidatev.com
- Password: demo1234

## Troubleshooting

### Port Conflicts

If you see errors about ports already being in use, run the cleanup script:

```
.\cleanup-ports.ps1
```

### Authentication Errors

If you encounter authentication issues, try:

1. Clearing your browser's local storage
2. Ensuring the Auth Service is running on port 8000
3. Using the demo login credentials

### PowerShell Command Syntax

If you get errors about the `&&` operator in PowerShell, use the provided scripts or run commands sequentially. 