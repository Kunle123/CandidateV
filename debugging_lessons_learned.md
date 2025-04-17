# Debugging Lessons Learned: Microservices Architecture

## Docker and Container Issues

1. **Memory Limitations**
   - Split dependency installations into smaller chunks to avoid memory errors during builds
   - Prefer incremental installations grouped by related packages

2. **File Structure**
   - Ensure proper file paths in COPY commands
   - Use explicit paths (`./file`) instead of implicit ones (`file`)

3. **Dockerfile Best Practices**
   - Always include a proper `FROM` statement at the beginning
   - Explicitly install all dependencies to avoid missing packages
   - Run basic verification commands to check installations
   - Use multi-stage builds for complex applications

## Deployment Configuration

1. **Railway Deployments**
   - Use `DOCKERFILE` builder explicitly in railway.json when using custom Dockerfiles
   - Remove database migration commands from initial deployments to reduce complexity
   - Set a proper health check endpoint with reasonable timeout and retries
   - Configure appropriate restart policies

2. **Vercel Deployments**
   - Set the explicit VERCEL environment variable for conditional logic
   - Export modules correctly for serverless functions
   - Disable operations that don't work well in serverless (file system writes)
   - Create proper vercel.json configurations specifying builds and routes

## Microservices Communication

1. **CORS Configuration**
   - Configure CORS correctly on all services with appropriate origins
   - Test CORS with the actual frontend domain
   - Include trailing slash variations in CORS configs

2. **API Gateway Best Practices**
   - Implement robust error handling when services are unavailable
   - Track service availability status
   - Return proper status codes (503 instead of 500) for unavailable services
   - Include diagnostic endpoints for troubleshooting

## Error Handling and Debugging

1. **Application Structure**
   - Use standalone files to simplify module imports
   - Create self-contained applications for easier deployment
   - Implement clear error boundaries between services

2. **Logging Strategy**
   - Set up environment-specific logging (simplified for serverless)
   - Use request IDs to track requests across services
   - Include timestamps, service names, and error details in logs
   - Add debug endpoints in production for diagnostic information

3. **Fallback Behavior**
   - Implement graceful degradation when services are unavailable
   - Use mock data or stubs for testing before all services are ready

## Testing Approach

1. **Incremental Testing**
   - Test each service in isolation before integration
   - Verify connectivity using health checks before full testing
   - Create comprehensive smoke tests for each deployment

2. **Environment Variables**
   - Double-check environment variable configuration in each deployment
   - Use defaults that make sense for the environment
   - Include environment-specific configuration for testing

## General Patterns

1. **Avoid Magic Paths**
   - Don't rely on directory structures that might change between environments
   - Use absolute module imports and avoid relative paths when possible

2. **Early Validation**
   - Add validation steps early in the deployment process
   - Return helpful error messages that explain what's missing

3. **Incremental Development**
   - Complete one component fully before moving to the next
   - Deploy services incrementally and verify each before proceeding

# Debugging Lessons Learned: Frontend Structure Issues

## Issue Summary

The project encountered errors related to missing dependencies and components due to a nested directory structure that caused confusion with dependency installation and file placement.

## Root Causes Identified

1. **Nested Directory Structure**:
   - The project had a confusing nested directory structure: `frontend/frontend/src`
   - Dependencies were installed in the outer `frontend` directory, but the app code was in the inner `frontend/frontend` directory
   - The Profile component file was missing in the inner directory structure

2. **Dependency Installation Issues**:
   - When running `npm install` in the parent `frontend` directory, dependencies were not available to the inner `frontend/frontend` directory
   - This caused import errors for `react-icons/fa` and `@chakra-ui/icons`
   - Package installations needed to be performed in the correct directory context

3. **File Path Resolution**:
   - The import path in App.jsx was looking for a file at `./pages/profile/Profile`
   - This file existed in the outer frontend structure but not in the inner one
   - The import path in App.jsx couldn't resolve the component

## Solutions Applied

1. **Identified the correct directory structure**:
   - Used tools like `pwd` and `ls` to understand the actual directory hierarchy
   - Confirmed the existence of a nested `frontend/frontend` structure

2. **Installed dependencies in the correct location**:
   - Installed missing packages (`react-icons` and `@chakra-ui/icons`) directly in the inner frontend directory
   - Used the correct path for installation: `cd frontend/frontend; npm install react-icons @chakra-ui/icons --save`

3. **Created missing component files**:
   - Added the Profile.jsx component to the correct inner frontend location
   - Copied the component from the outer directory to match the expected structure

## Lessons Learned

1. **Directory Structure Awareness**:
   - Always verify the actual directory structure before making changes
   - Use tools like `pwd`, `ls`, and file explorers to understand the project organization
   - Be cautious of nested directories with similar names that can cause confusion

2. **Package Management Best Practices**:
   - Always install dependencies in the same directory as the package.json file
   - Verify that dependencies are correctly installed by checking package.json and node_modules
   - Look for "up to date" messages during installation that might indicate the packages already exist

3. **Resolving Import Errors**:
   - When facing import resolution errors, check that the file actually exists in the expected location
   - Verify the import paths match the actual file structure
   - Look for nested directory issues that might cause import resolution problems

4. **Debugging Process**:
   - Start with identifying the exact error messages
   - Examine the file structure to understand the context
   - Trace import paths to verify they match the actual file locations
   - Test solutions incrementally to confirm they resolve the issue

5. **PowerShell Syntax Considerations**:
   - PowerShell uses `;` instead of `&&` for command chaining
   - Adjust command syntax based on the terminal environment

## Preventing Similar Issues

1. **Project Setup Guidelines**:
   - Establish clear conventions for directory structure
   - Avoid nesting directories with the same name
   - Document the structure for team members

2. **CI/CD Validations**:
   - Add checks for proper dependency installation
   - Validate import paths in pre-commit hooks
   - Test component resolution during the build process

3. **Development Environment**:
   - Use consistent development environments across the team
   - Document terminal-specific syntax (PowerShell vs Bash)
   - Implement workspace configuration files for consistent paths

## Port Usage Issues

During development, we encountered multiple instances of port conflicts, with Vite reporting:
```
Port 3000 is in use, trying another one...
Port 3001 is in use, trying another one...
...
```

### Root Causes

1. **Multiple Development Instances**:
   - Running multiple development servers simultaneously (intentionally or unintentionally)
   - Previous server instances not properly terminated

2. **Nested Project Structure**:
   - The nested `frontend/frontend` structure allowed running development servers from different directories
   - Each directory's `npm run dev` command started a separate Vite server

### Solutions

1. **Process Management**:
   - Use process management tools to identify and terminate unused instances
   - Run `netstat -ano | findstr "PORT"` (Windows) or `lsof -i :PORT` (Mac/Linux) to find processes using specific ports
   - Properly terminate servers with Ctrl+C or task manager before starting new ones

2. **Consistent Development Directory**:
   - Always run development commands from the correct directory
   - Document the proper working directory for development
   - Consider adding a root-level package.json script that navigates to the correct directory first

3. **Custom Port Configuration**:
   - Configure a specific port in vite.config.js to avoid random port selection
   - Set `strictPort: true` to force the server to fail if the port is already in use, rather than automatically finding a different port
   - Document the expected development port in the project README

### Lessons Learned

1. **Process Awareness**:
   - Always be aware of running processes, especially in development
   - Properly terminate servers before starting new ones
   - Check running processes when encountering port conflicts

2. **Standardize Development Workflow**:
   - Create a standardized development workflow document
   - Include exact commands to start and stop services
   - Specify the expected working directory for each command

This port usage issue further highlighted the problems caused by the nested directory structure, as it allowed multiple development server instances to run simultaneously from different directory contexts.

## Implemented Solutions to Prevent Recurrence

To prevent these issues from recurring and to improve the developer experience, we created several helper tools:

1. **Helper Scripts for Frontend Development**:
   - `scripts/setup_frontend.sh` (Linux/Mac): Ensures developers are working in the correct frontend directory
   - `scripts/setup_frontend.ps1` (Windows): PowerShell version of the same script
   - `scripts/cleanup_ports.ps1` (Windows): Helps identify and terminate Node.js processes to resolve port conflicts
   - `scripts/cleanup_ports.sh` (Linux/Mac): Bash version for cleaning up ports on Unix-based systems

2. **Documentation Updates**:
   - Updated README.md with clear instructions about the directory structure
   - Added a "Common Development Issues" section with troubleshooting steps
   - Documented the correct workflow for running frontend commands

3. **Process Management**:
   - Implemented port conflict detection and resolution via scripts
   - Added guidance for identifying zombie processes
   - Provided commands for cleaning up resources

These tools and documentation changes should significantly reduce the likelihood of similar issues occurring in the future, and provide clear guidance for resolving them when they do.

## Conclusion

This debugging experience highlighted the importance of understanding project structure before making changes. The nested directory structure created confusion with dependency installation and file resolution. By methodically identifying the actual structure and installing dependencies in the correct location, we resolved the issues and created a working implementation.

Future projects should avoid nested directories with similar names and establish clear conventions for directory structure to prevent similar issues. 