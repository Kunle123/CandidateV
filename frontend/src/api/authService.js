import axios from 'axios';
import config from './config';

const api = axios.create({
  baseURL: config.AUTH_API_URL,
  withCredentials: true // for cookies/session
});

const authService = {
  // Social login redirect
  getSocialLoginUrl(provider) {
    return `${config.AUTH_API_URL}/auth/${provider}`;
  },

  // Login (email/password)
  async login({ email, password }) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Logout
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get current user
  async getCurrentUser() {
    const response = await api.get('/auth/user');
    return response.data;
  },

  // Register (sign up)
  async signUp({ name, email, password }) {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  }
};

export default authService; 