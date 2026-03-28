import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import userEvent from '@testing-library/user-event';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderForgotPassword = () => render(
  <MemoryRouter>
    <AuthProvider>
      <ForgotPasswordScreen />
    </AuthProvider>
  </MemoryRouter>
);

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders forgot password form', () => {
    renderForgotPassword();
    expect(screen.getByText(/forgot password\?/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('submit button is disabled when email is empty', () => {
    renderForgotPassword();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeDisabled();
  });

  it('submits email for password reset', async () => {
    renderForgotPassword();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/your email address/i), 'user@example.com');
    
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    expect(submitButton).not.toBeDisabled();
    
    await user.click(submitButton);

    // After submission, the component shows a success message
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('has back to login link', () => {
    renderForgotPassword();
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });

  it('shows success message after submission', async () => {
    renderForgotPassword();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/your email address/i), 'user@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText(/if an account with that email exists/i)).toBeInTheDocument();
    });
  });
});
