/**
 * CandidateV Backend Services Stopper
 * 
 * This script stops all running backend services for the CandidateV application.
 * It finds and terminates Python/uvicorn processes running on the service ports.
 */

const { exec } = require('child_process');
const os = require('os');

// Service port mapping
const services = [
  { name: 'auth_service', port: 8000 },
  { name: 'user_service', port: 8001 },
  { name: 'cv_service', port: 8002 },
  { name: 'export_service', port: 8003 },
];

// Platform-specific commands to find and kill processes
const isWindows = os.platform() === 'win32';

// Get process ID by port
function getProcessIdByPort(port, callback) {
  let command;
  
  if (isWindows) {
    // Windows command to find process using a port
    command = `netstat -ano | findstr :${port}`;
  } else {
    // Unix/Mac command to find process using a port
    command = `lsof -i :${port} -t`;
  }
  
  exec(command, (error, stdout) => {
    if (error) {
      console.log(`No process found on port ${port}`);
      callback(null);
      return;
    }
    
    let processId;
    
    if (isWindows) {
      // Parse Windows netstat output to find PID
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes(`${port}`)) {
          const parts = line.trim().split(/\s+/);
          processId = parts[parts.length - 1];
          break;
        }
      }
    } else {
      // Unix/Mac output is already the PID
      processId = stdout.trim();
    }
    
    if (processId) {
      callback(processId);
    } else {
      console.log(`No process found on port ${port}`);
      callback(null);
    }
  });
}

// Kill process by ID
function killProcess(pid, serviceName) {
  if (!pid) return;
  
  const command = isWindows ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
  
  exec(command, (error, stdout) => {
    if (error) {
      console.error(`Error stopping ${serviceName}: ${error.message}`);
      return;
    }
    console.log(`${serviceName} stopped successfully`);
  });
}

// Stop all services
console.log('Stopping CandidateV backend services...');

services.forEach(service => {
  console.log(`Trying to stop ${service.name} on port ${service.port}...`);
  
  getProcessIdByPort(service.port, (pid) => {
    if (pid) {
      console.log(`Found ${service.name} running with PID ${pid}`);
      killProcess(pid, service.name);
    } else {
      console.log(`${service.name} is not running on port ${service.port}`);
    }
  });
});

// For Windows, also try to find Python processes that might be our services
if (isWindows) {
  console.log('Looking for any remaining Python/uvicorn processes...');
  
  exec('tasklist /FI "IMAGENAME eq python.exe" /FO CSV', (error, stdout) => {
    if (error) {
      console.error('Error looking for Python processes:', error.message);
      return;
    }
    
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.includes('python.exe') && line.includes('uvicorn')) {
        const match = line.match(/"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/);
        if (match && match[2]) {
          const pid = match[2];
          console.log(`Found uvicorn process with PID ${pid}`);
          killProcess(pid, 'Python/uvicorn');
        }
      }
    }
  });
}

console.log('Service shutdown commands issued. All services should be stopped shortly.'); 