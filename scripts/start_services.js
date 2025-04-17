/**
 * CandidateV Backend Services Starter
 * 
 * This script starts all backend services required for the CandidateV application.
 * It handles starting Python FastAPI services and logs their output.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration for services
const services = [
  {
    name: 'auth_service',
    command: 'python',
    args: ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8000'],
    directory: '../backend/auth_service',
    env: { ...process.env }
  },
  {
    name: 'user_service',
    command: 'python',
    args: ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8001'],
    directory: '../backend/user_service',
    env: { ...process.env }
  },
  {
    name: 'cv_service',
    command: 'python',
    args: ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8002'],
    directory: '../backend/cv_service',
    env: { ...process.env }
  },
  {
    name: 'export_service',
    command: 'python',
    args: ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8003'],
    directory: '../backend/export_service',
    env: { ...process.env }
  },
];

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Store process references to manage them
const processes = {};

// Function to start a service
function startService(service) {
  console.log(`Starting ${service.name}...`);
  
  // Create log streams
  const stdout = fs.createWriteStream(path.join(logsDir, `${service.name}.log`));
  const stderr = fs.createWriteStream(path.join(logsDir, `${service.name}.error.log`));
  
  // Start the process
  const process = spawn(service.command, service.args, {
    cwd: path.join(__dirname, service.directory),
    env: service.env,
    shell: true
  });
  
  // Store the process reference
  processes[service.name] = process;
  
  // Set up logging
  process.stdout.pipe(stdout);
  process.stderr.pipe(stderr);
  
  // Log to console with service name prefix
  process.stdout.on('data', (data) => {
    console.log(`[${service.name}] ${data.toString().trim()}`);
  });
  
  process.stderr.on('data', (data) => {
    console.error(`[${service.name}] ERROR: ${data.toString().trim()}`);
  });
  
  // Handle process exit
  process.on('close', (code) => {
    console.log(`[${service.name}] Process exited with code ${code}`);
    
    // Remove from processes
    delete processes[service.name];
    
    // Optional: restart service if it crashes
    if (code !== 0) {
      console.log(`[${service.name}] Restarting service in 5 seconds...`);
      setTimeout(() => {
        startService(service);
      }, 5000);
    }
  });
  
  return process;
}

// Start all services
console.log('Starting CandidateV backend services...');
services.forEach(startService);

// Handle script termination
process.on('SIGINT', () => {
  console.log('Shutting down all services...');
  
  // Kill all child processes
  Object.values(processes).forEach(proc => {
    proc.kill('SIGINT');
  });
  
  // Exit after a short delay
  setTimeout(() => {
    console.log('All services stopped.');
    process.exit(0);
  }, 1000);
});

console.log('All services started. Press Ctrl+C to stop all services.'); 