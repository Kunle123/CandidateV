import axios from 'axios';
import config from './config';

console.log('All import.meta.env at runtime:', import.meta.env);
console.log('AUTH_API_URL at runtime:', config.AUTH_API_URL);

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
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  // Logout
  async logout() {
    const response = await api.post('/logout');
    return response.data;
  },

  // Get current user
  async getCurrentUser() {
    const response = await api.get('/user');
    return response.data;
  },

  // Register (sign up)
  async signUp({ name, email, password }) {
    console.log('Registering user via:', api.defaults.baseURL + '/register');
    const response = await api.post('/register', { name, email, password });
    return response.data;
  }
};

export default authService; 