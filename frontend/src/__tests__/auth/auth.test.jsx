import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Register from '../../pages/Register';
import Login from '../../pages/Login';
import { authHelper } from '../../lib/supabase';

// Mock Supabase auth helper
vi.mock('../../lib/supabase', () => ({
  authHelper: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    getUser: vi.fn(),
  },
}));

// Mock toast notifications
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Registration', () => {
    const renderRegister = () => {
      return render(
        <BrowserRouter>
          <AuthProvider>
            <Register />
          </AuthProvider>
        </BrowserRouter>
      );
    };

    test('validates required fields', async () => {
      renderRegister();
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      fireEvent.click(submitButton);
      
      expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/please accept the terms/i)).toBeInTheDocument();
    });

    test('validates email format', async () => {
      renderRegister();
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);
      
      expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
    });

    test('validates password criteria', async () => {
      renderRegister();
      const passwordInput = screen.getByLabelText(/^password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      fireEvent.click(submitButton);
      
      expect(await screen.findByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    test('handles successful registration', async () => {
      authHelper.signUp.mockResolvedValueOnce({ 
        data: { user: { id: '123' }, session: null },
        error: null 
      });

      renderRegister();
      
      fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(authHelper.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: {
              full_name: 'Test User',
            },
          },
        });
      });
    });
  });

  describe('Login', () => {
    const renderLogin = () => {
      return render(
        <BrowserRouter>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </BrowserRouter>
      );
    };

    test('validates required fields', async () => {
      renderLogin();
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      
      fireEvent.click(submitButton);
      
      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });

    test('handles successful login', async () => {
      authHelper.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: '123' }, session: { access_token: 'token' } },
        error: null
      });

      renderLogin();
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(authHelper.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    test('handles login error', async () => {
      authHelper.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      renderLogin();
      
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(authHelper.signInWithPassword).toHaveBeenCalled();
      });
    });
  });
}); 