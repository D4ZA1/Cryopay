import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import LoginScreen from '../LoginScreen';
import * as api from '../../lib/api';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = api.apiFetch as any;

const renderLoginScreen = (initialEntries = ['/login']) => {
  const router = createMemoryRouter([
    { 
      path: '/',
      element: <AuthProvider><div><LoginScreen /></div></AuthProvider>,
      children: []
    },
    { path: '/login', element: <AuthProvider><LoginScreen /></AuthProvider> },
    { path: '/dashboard', element: <AuthProvider><div>Dashboard</div></AuthProvider> },
  ], { initialEntries });

  return render(
    <RouterProvider router={router} />
  );
};

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form', () => {
    renderLoginScreen();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    renderLoginScreen();

    const passwordInput = screen.getByLabelText(/password/i);
    // The toggle button has no accessible name (icon-only), find by its position relative to password input
    const passwordContainer = passwordInput.closest('.relative');
    const toggleBtn = passwordContainer?.querySelector('button[type="button"]') as HTMLElement;

    expect(passwordInput).toHaveAttribute('type', 'password');

    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('submits form and calls login API', async () => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      data: { token: 'mock-token', user: { id: '1', first_name: 'Test', email: 'test@example.com' } },
    });

    renderLoginScreen();

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(mockApiFetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
  });

  it('shows loading state during submission', async () => {
    // Use a promise that we control to keep the API "pending"
    let resolveApiCall: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });
    mockApiFetch.mockReturnValue(pendingPromise);

    renderLoginScreen();

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    // Click submit - this will start the loading state
    userEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    // Wait for loading state to appear
    await screen.findByText('Logging In...');
    
    // Clean up by resolving the promise
    resolveApiCall!({ ok: true, data: { token: 't', user: { id: '1', first_name: 'Test', email: 'test@example.com' } } });
  });

  it('shows error on API failure', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, error: 'Invalid credentials' } as any);

    renderLoginScreen();

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await screen.findByText(/Invalid credentials/);
  });

  it('has navigation links', () => {
    renderLoginScreen();
    expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
    expect(screen.getByText('Connect with Wallet')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });
});
