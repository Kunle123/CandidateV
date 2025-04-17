import apiClient, { apiService } from './apiClient';
import { jwtDecode } from 'jwt-decode';

// User authentication service
const authService = {
  // Login user
  async login(email, password) {
    try {
      // Create form data for OAuth2PasswordRequestForm format
      const formData = new URLSearchParams();
      formData.append('username', email); // OAuth2 form expects 'username', not 'email'
      formData.append('password', password);
      
      const response = await apiService.post('auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const { access_token, refresh_token } = response.data;
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Decode user data from token
      const userData = this.getUserFromToken(access_token);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      
      // For demo/development: Generate demo tokens if using demo credentials
      if ((email === 'demo@candidatev.com' || email === 'admin@candidatev.com') && 
          (password === 'demo1234' || password === 'admin1234')) {
        console.log('🔑 Using demo login fallback');
        
        // Create a mock JWT token with 24h expiration
        const now = Math.floor(Date.now() / 1000);
        const mockPayload = {
          sub: email,
          email: email,
          name: email === 'admin@candidatev.com' ? 'Admin User' : 'Demo User',
          exp: now + 86400, // 24 hours
          iat: now,
          role: email.includes('admin') ? 'admin' : 'user'
        };
        
        // Encode a simple mock token (this is NOT secure, only for development)
        const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(mockPayload))}.DEMO_SIG`;
        
        localStorage.setItem('access_token', mockToken);
        localStorage.setItem('refresh_token', mockToken);
        localStorage.setItem('demo_mode', 'true');
        
        // Store user data for demo mode
        localStorage.setItem('user', JSON.stringify({
          id: mockPayload.sub,
          email: mockPayload.email,
          name: mockPayload.name,
          role: mockPayload.role
        }));
        
        return { 
          success: true, 
          user: mockPayload,
          demo: true
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  },

  // Register new user
  async register(name, email, password) {
    try {
      const response = await apiService.post('auth/register', {
        name,
        email,
        password
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  },

  // Logout user
  async logout() {
    try {
      const refresh_token = localStorage.getItem('refresh_token');
      if (refresh_token) {
        await apiService.post('auth/logout', { refresh_token });
      }
      
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('demo_mode');
      localStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      // Still remove tokens even if server request fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('demo_mode');
      localStorage.removeItem('user');
      return { success: true };
    }
  },

  // Refresh access token
  async refreshToken() {
    try {
      // Check for demo mode first
      if (localStorage.getItem('demo_mode') === 'true') {
        console.log('Demo mode - skipping token refresh');
        return { 
          success: true, 
          user: JSON.parse(localStorage.getItem('user') || '{}'),
          demo: true
        };
      }
      
      const refresh_token = localStorage.getItem('refresh_token');
      if (!refresh_token) {
        throw new Error('No refresh token available');
      }
      
      const response = await apiService.post('auth/refresh', { refresh_token });
      const { access_token } = response.data;
      
      localStorage.setItem('access_token', access_token);
      
      const userData = this.getUserFromToken(access_token);
      return { success: true, user: userData };
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Token refresh failed'
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    // Check for demo mode first
    if (localStorage.getItem('demo_mode') === 'true') {
      return true;
    }
    
    const token = localStorage.getItem('access_token');
    if (!token) return false;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  // Get user data from token
  getUserFromToken(token) {
    try {
      const decoded = jwtDecode(token);
      return {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role || 'user'
      };
    } catch (error) {
      return null;
    }
  },

  // Get current user data from token
  getCurrentUser() {
    // Check for demo mode first
    if (localStorage.getItem('demo_mode') === 'true') {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}');
      } catch (e) {
        return null;
      }
    }
    
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    
    return this.getUserFromToken(token);
  }
};

export default authService; 