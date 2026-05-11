import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BinsAdmin from '../BinsAdmin';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const BINS = [
  {
    bin_id: 'bin-abc-123',
    location_name: 'Central Station',
    location_lat: 50.08,
    location_lng: 14.43,
    supported_materials: ['plastic', 'glass'],
    is_active: true,
    current_nonce: 5,
    created_at: '2024-01-01T00:00:00Z',
  },
];

describe('BinsAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('shows login form when not authenticated', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<BinsAdmin />);
    expect(screen.getByText('Admin Login')).toBeTruthy();
    expect(screen.getByPlaceholderText('admin@example.com')).toBeTruthy();
  });

  it('shows error on login failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({ success: false, error: 'Invalid credentials' }),
    });

    render(<BinsAdmin />);

    fireEvent.change(screen.getByPlaceholderText('admin@example.com'), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials|Login failed/i)).toBeTruthy();
    });
  });

  it('shows register bin form and bins list after login', async () => {
    // First call: login, second call: bins list
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ token: 'test-token-123' }),
          text: async () => JSON.stringify({ token: 'test-token-123' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ bins: BINS }),
        text: async () => JSON.stringify({ bins: BINS }),
      });
    });

    render(<BinsAdmin />);

    fireEvent.change(screen.getByPlaceholderText('admin@example.com'), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'correctpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Register New Bin')).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByText('Central Station')).toBeTruthy();
    });
  });

  it('shows bins list section header after login', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ token: 'test-token-abc' }),
          text: async () => JSON.stringify({ token: 'test-token-abc' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ bins: [] }),
        text: async () => JSON.stringify({ bins: [] }),
      });
    });

    render(<BinsAdmin />);

    fireEvent.change(screen.getByPlaceholderText('admin@example.com'), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Registered Bins')).toBeTruthy();
    });
  });
});
