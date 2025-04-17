// Node.js script to generate a valid JWT token
// This script will create a properly signed token that the backend can verify

// Check if jsonwebtoken is installed, if not display installation instructions
try {
  require.resolve('jsonwebtoken');
} catch (e) {
  console.error('\x1b[31mError: jsonwebtoken package is not installed\x1b[0m');
  console.log('\x1b[33mPlease install it using:\x1b[0m');
  console.log('npm install jsonwebtoken');
  console.log('or');
  console.log('yarn add jsonwebtoken');
  process.exit(1);
}

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// The same JWT secret used in the backend services
const JWT_SECRET = 'demo-secret-key-candidatev-development-only';

// Create payload with required fields
const payload = {
  sub: 'demo-user-123', // User ID - required by backend
  name: 'Demo User',
  email: 'demo@example.com',
  role: 'user',
  iat: Math.floor(Date.now() / 1000), // Issued at time
  exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // Expires in 1 year
};

// Sign the token with the secret
const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });

console.log('\x1b[32m✅ JWT token generated successfully!\x1b[0m');
console.log('\x1b[36mToken:\x1b[0m', token);

// Create JavaScript code for the browser console
const consoleCode = `
// Store properly signed tokens in localStorage
localStorage.setItem('access_token', '${token}');
localStorage.setItem('refresh_token', '${token}');

// Store user info
localStorage.setItem('user', JSON.stringify({
  id: 'demo-user-123',
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'user'
}));

// Show success message
console.log('%c✅ Demo login successful! You can now use the application in demo mode.', 'color: green; font-weight: bold');
`;

// Save to a file for easy copying
const outputFile = path.join(__dirname, 'browser-code.js');
fs.writeFileSync(outputFile, consoleCode);

console.log('\n\x1b[33mPlease follow these steps:\x1b[0m');
console.log('1. Open your browser to http://localhost:3000');
console.log('2. Open the browser\'s developer tools (F12 or right-click > Inspect)');
console.log('3. Go to the Console tab');
console.log('4. Copy and paste the code below into the console and press Enter:');
console.log('\x1b[36m' + consoleCode + '\x1b[0m');
console.log('5. Refresh the page');

console.log(`\n\x1b[33mThe code has also been saved to ${outputFile} for easy copying.\x1b[0m`);
console.log('\x1b[32mThis token is properly signed and should be accepted by the backend services.\x1b[0m'); 