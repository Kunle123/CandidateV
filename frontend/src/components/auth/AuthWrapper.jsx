import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';

/**
 * Authentication wrapper component that handles auth initialization
 * and ensures proper token setup
 */
const AuthWrapper = ({ children }) => {
  const { isAuthenticated, loading, user, initializeAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  useEffect(() => {
    // Initialize authentication on component mount
    initializeAuth();

    // In development mode, check if we need to set up demo auth
    if (isDevelopment) {
      const token = localStorage.getItem('access_token');
      
      // If no token exists, setup demo auth for development
      if (!token && !loading) {
        console.log('Setting up demo authentication for development environment');
        
        // Create a demo JWT token (this is not a real token, just for demo purposes)
        const demoToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXIiLCJuYW1lIjoiRGVtbyBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.xvwZpeiYh4RDX6ZKgZYn0UJnZ4Y5v8P4CgS6I1X3HZ4";
        
        // Store tokens
        localStorage.setItem('access_token', demoToken);
        localStorage.setItem('refresh_token', demoToken);
        
        // Store user info
        localStorage.setItem('user', JSON.stringify({
          id: 'demo-user-id',
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'user'
        }));
        
        // Re-initialize auth after setting up demo credentials
        initializeAuth();
        
        toast({
          title: 'Demo Mode Active',
          description: 'Using demo authentication for development',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  }, [initializeAuth, loading, isDevelopment, toast]);

  // Simply render children, authentication status will be handled by ProtectedRoute
  return <>{children}</>;
};

export default AuthWrapper; 