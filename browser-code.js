
// Store properly signed tokens in localStorage
localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXItMTIzIiwibmFtZSI6IkRlbW8gVXNlciIsImVtYWlsIjoiZGVtb0BleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0Nzk1NDMxLCJleHAiOjE3NzYzMzE0MzF9.rt8YuL7sGsPgKfhhsFQunzjpAuhrGy3Mnp-4HNiKx-Q');
localStorage.setItem('refresh_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXItMTIzIiwibmFtZSI6IkRlbW8gVXNlciIsImVtYWlsIjoiZGVtb0BleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0Nzk1NDMxLCJleHAiOjE3NzYzMzE0MzF9.rt8YuL7sGsPgKfhhsFQunzjpAuhrGy3Mnp-4HNiKx-Q');

// Store user info
localStorage.setItem('user', JSON.stringify({
  id: 'demo-user-123',
  email: 'demo@example.com',
  name: 'Demo User',
  role: 'user'
}));

// Show success message
console.log('%c✅ Demo login successful! You can now use the application in demo mode.', 'color: green; font-weight: bold');
