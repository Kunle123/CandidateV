import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '../../context/AuthContext';
import Login from '../../pages/auth/Login';
import Register from '../../pages/auth/Register';
import { supabase } from '../../lib/supabase';

// Mock Supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn()
    }
  }
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ChakraProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  );
};

describe('Authentication Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Registration', () => {
    test('shows validation errors for empty fields', async () => {
      renderWithProviders(<Register />);
      
      // Try to submit empty form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      // Check for validation errors
      expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/you must accept the terms/i)).toBeInTheDocument();
    });

    test('shows error for invalid email format', async () => {
      renderWithProviders(<Register />);
      
      // Enter invalid email
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'invalid-email' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      expect(await screen.findByText(/email is invalid/i)).toBeInTheDocument();
    });

    test('shows error for password mismatch', async () => {
      renderWithProviders(<Register />);
      
      // Enter different passwords
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password456' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    });

    test('successful registration', async () => {
      // Mock successful registration
      supabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null
      });

      renderWithProviders(<Register />);
      
      // Fill form with valid data
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: 'Test User' }
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByLabelText(/terms/i));
      
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      
      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          data: {
            name: 'Test User',
            terms_accepted: true,
            terms_accepted_at: expect.any(String)
          }
        });
      });
    });
  });

  describe('Login', () => {
    test('shows validation errors for empty fields', async () => {
      renderWithProviders(<Login />);
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });

    test('shows error for invalid email format', async () => {
      renderWithProviders(<Login />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'invalid-email' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      expect(await screen.findByText(/email is invalid/i)).toBeInTheDocument();
    });

    test('successful login', async () => {
      // Mock successful login
      supabase.auth.signIn.mockResolvedValueOnce({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null
      });

      renderWithProviders(<Login />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(supabase.auth.signIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    test('handles login error', async () => {
      // Mock login error
      supabase.auth.signIn.mockRejectedValueOnce(new Error('Invalid credentials'));

      renderWithProviders(<Login />);
      
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Reset', () => {
    test('sends reset password email', async () => {
      // Mock successful password reset request
      supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({
        data: {},
        error: null
      });

      renderWithProviders(<Login />);
      
      // Click forgot password link and fill email
      fireEvent.click(screen.getByText(/forgot password/i));
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
      
      await waitFor(() => {
        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
      });
    });
  });
}); 