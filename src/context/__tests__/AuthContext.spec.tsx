import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import * as api from '../../lib/api';

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('../../lib/symmetricSession', () => ({
  clearSymKey: vi.fn(),
}));

const mockApiFetch = api.apiFetch as unknown as ReturnType<typeof vi.fn>;

const TestComponent = ({ children }: { children?: React.ReactNode }) => {
  const auth = useAuth();
  return (
    <div>
      {children || (
        <>
          <span data-testid="user-name">{auth.user?.firstName || 'Guest'}</span>
          <span data-testid="loading">{auth.isLoading ? 'loading' : 'ready'}</span>
          <button type="button" data-testid="logout-btn" onClick={auth.logout}>
            Logout
          </button>
          <button type="button" data-testid="refresh-btn" onClick={auth.refreshUser}>
            Refresh
          </button>
        </>
      )}
    </div>
  );
};

const renderWithProviders = (ui: React.ReactElement, initialToken?: string) => {
  if (initialToken) {
    localStorage.setItem('cryopay_token', initialToken);
  }
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockApiFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('provides initial loading state', async () => {
    // No token, so apiFetch won't be called and loading will finish quickly
    mockApiFetch.mockResolvedValue({ ok: false });
    
    renderWithProviders(<TestComponent />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
  });

  it('restores session from localStorage token on mount', async () => {
    const mockProfile = {
      ok: true,
      data: { profile: { id: '1', first_name: 'John', email: 'john@example.com' } },
    };
    mockApiFetch.mockResolvedValue(mockProfile);

    renderWithProviders(<TestComponent />, 'mock-token');

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('John');
    });
    
    expect(mockApiFetch).toHaveBeenCalledWith('/api/profile');
  });

  it('handles login', async () => {
    const TestLoginComp = () => {
      const { login, user } = useAuth();
      return (
        <>
          <span data-testid="user-name">{user?.firstName || 'Guest'}</span>
          <button type="button" onClick={() => login('token123', { id: '1', firstName: 'Jane' })}>
            Login
          </button>
        </>
      );
    };

    // Mock for initial load (no token)
    mockApiFetch.mockResolvedValue({ ok: false });

    renderWithProviders(<TestLoginComp />);

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    expect(localStorage.getItem('cryopay_token')).toBe('token123');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Jane');
  });

  it('handles logout', async () => {
    localStorage.setItem('cryopay_token', 'token');
    const mockProfile = { ok: true, data: { profile: { id: '1', first_name: 'User' } } };
    mockApiFetch.mockResolvedValue(mockProfile);

    renderWithProviders(<TestComponent />);

    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('User');
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('logout-btn'));
    });

    expect(localStorage.getItem('cryopay_token')).toBeNull();
    expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
  });

  it('refreshUser updates user data', async () => {
    const mockProfile1 = { ok: true, data: { profile: { id: '1', first_name: 'Old' } } };
    const mockProfile2 = { ok: true, data: { profile: { id: '1', first_name: 'New' } } };
    mockApiFetch
      .mockResolvedValueOnce(mockProfile1)
      .mockResolvedValueOnce(mockProfile2);

    renderWithProviders(<TestComponent />, 'token');

    // Wait for initial profile load
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Old');
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('refresh-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('New');
    });
    
    expect(mockApiFetch).toHaveBeenCalledTimes(2);
    expect(mockApiFetch).toHaveBeenCalledWith('/api/profile');
  });

  it('useAuth throws outside provider', () => {
    const BadComp = () => {
      const auth = useAuth();
      return <div>{auth.user?.firstName}</div>;
    };
    
    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<BadComp />)).toThrow('useAuth must be used within an AuthProvider');
    
    consoleSpy.mockRestore();
  });

  it('handles profile fetch error on init', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<TestComponent />, 'token');

    // Wait for loading to complete (error should still finish loading)
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
  });

  it('handles profile response with ok: false', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, error: 'Unauthorized' });

    renderWithProviders(<TestComponent />, 'token');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('Guest');
  });
});
