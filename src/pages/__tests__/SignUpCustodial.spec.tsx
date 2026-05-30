import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import SignUpCustodial from '../SignUpCustodial';
import * as api from '../../lib/api';
import userEvent from '@testing-library/user-event';

// Mock api
vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockApiFetch = api.apiFetch as any;

const renderSignUpCustodial = () => render(
  <MemoryRouter>
    <AuthProvider>
      <SignUpCustodial />
    </AuthProvider>
  </MemoryRouter>
);

describe('SignUpCustodial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signup form fields', () => {
    renderSignUpCustodial();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows password requirements', () => {
    renderSignUpCustodial();
    expect(screen.getByText(/8\+ characters/i)).toBeInTheDocument();
    expect(screen.getByText(/1 uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/1 number/i)).toBeInTheDocument();
    expect(screen.getByText(/1 special character/i)).toBeInTheDocument();
  });

  it('submit button is disabled when form is incomplete', async () => {
    renderSignUpCustodial();
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();
  });

  it('submits form with valid data', async () => {
    mockApiFetch.mockResolvedValue({ ok: true, data: { token: 'mock-token', user: { id: '123' } } });

    renderSignUpCustodial();

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1!');
    
    // Check terms checkbox
    await user.click(screen.getByRole('checkbox'));

    // Submit the form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/auth/register', expect.any(Object));
    });
  });

  it('shows error message on API failure', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, error: 'Email already exists' });

    renderSignUpCustodial();

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email address/i), 'user@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password1!');
    await user.click(screen.getByRole('checkbox'));

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/)).toBeInTheDocument();
    });
  });

  it('has login link in footer', () => {
    renderSignUpCustodial();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });
});
