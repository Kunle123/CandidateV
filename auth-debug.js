// Auth Debugging Script
// This script helps diagnose authentication issues between frontend and backend

// Token from localStorage
const token = localStorage.getItem('access_token');
if (!token) {
  console.error('❌ No access token found in localStorage');
  console.log('Run the browser-code.js script first to set up authentication');
} else {
  console.log('✅ Token found in localStorage');
  
  // Parse the token (JWT format is header.payload.signature)
  const [headerB64, payloadB64, signature] = token.split('.');
  
  try {
    // Decode the header and payload
    const header = JSON.parse(atob(headerB64));
    const payload = JSON.parse(atob(payloadB64));
    
    console.log('📄 Token Header:', header);
    console.log('📄 Token Payload:', payload);
    
    // Check for required fields
    const requiredFields = ['sub', 'exp', 'iat'];
    const missingFields = requiredFields.filter(field => !payload[field]);
    
    if (missingFields.length > 0) {
      console.error(`❌ Token is missing required fields: ${missingFields.join(', ')}`);
    } else {
      console.log('✅ Token contains all required fields');
    }
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.error('❌ Token has expired');
      console.log(`Token expired ${Math.floor((now - payload.exp) / 86400)} days ago`);
    } else {
      console.log('✅ Token is not expired');
      console.log(`Token expires in ${Math.floor((payload.exp - now) / 86400)} days`);
    }
    
    // Check for user info
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      console.error('❌ No user info found in localStorage');
    } else {
      const user = JSON.parse(userJson);
      console.log('👤 User info:', user);
      
      // Check if user ID matches token subject
      if (user.id !== payload.sub) {
        console.error('❌ User ID does not match token subject');
        console.log(`User ID: ${user.id}, Token subject: ${payload.sub}`);
      } else {
        console.log('✅ User ID matches token subject');
      }
    }
  } catch (error) {
    console.error('❌ Error parsing token:', error.message);
  }
  
  // Test a request with the token
  console.log('🔍 Testing API request with token...');
  fetch('/api/cv', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  })
  .then(response => {
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.error('❌ Authentication failed (401 Unauthorized)');
      console.log('Possible causes:');
      console.log('1. Token signature is invalid (wrong JWT_SECRET on backend)');
      console.log('2. Token format not recognized by backend');
      console.log('3. User ID in token not found in database');
    } else if (response.status === 403) {
      console.error('❌ Authorization failed (403 Forbidden)');
      console.log('User authenticated but does not have permission');
    } else if (response.status >= 200 && response.status < 300) {
      console.log('✅ Authentication successful');
    } else {
      console.error(`❌ Request failed with status ${response.status}`);
    }
    
    return response.text().catch(() => 'No response body');
  })
  .then(text => {
    try {
      const data = JSON.parse(text);
      console.log('📦 Response data:', data);
    } catch {
      console.log('📝 Response text:', text);
    }
  })
  .catch(error => {
    console.error('❌ Network error:', error.message);
  });
  
  // Also check headers that are being sent
  console.log('🔍 Checking request headers...');
  const headers = new Headers();
  headers.append('Authorization', `Bearer ${token}`);
  
  console.log('📤 Request headers:');
  headers.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });
}

console.log('✨ Auth debugging complete. Check the console output above for issues.');
console.log('💡 Run this in your browser console to debug authentication problems.'); 