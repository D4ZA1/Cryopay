import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import EmailOtpModal from '../EmailOtpModal';
import * as api from '../../lib/api';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
  login: vi.fn(),
}));

const mockApiFetch = api.apiFetch as any;

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  userEmail: 'user@example.com',
  onVerified: vi.fn(),
};

const renderModal = (props = {}) => render(
  <MemoryRouter>
    <AuthProvider>
      <EmailOtpModal {...defaultProps} {...props} />
    </AuthProvider>
  </MemoryRouter>
);

describe('EmailOtpModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders modal with correct email', () => {
    renderModal();
    expect(screen.getByText('Verify your email')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it('sends magic link on resend click', async () => {
    mockApiFetch.mockResolvedValue({ ok: true });

    renderModal();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /resend email/i }));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/auth/send-otp', expect.any(Object));
    });
  });

  it('shows resend cooldown after sending', async () => {
    mockApiFetch.mockResolvedValue({ ok: true });

    renderModal();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /resend email/i }));

    await waitFor(() => {
      // After sending, the button should show a cooldown
      expect(screen.getByText(/Resend \(\d+s\)/)).toBeInTheDocument();
    });
  });

  it('calls onVerified when session detected via localStorage', async () => {
    const onVerified = vi.fn();
    const onClose = vi.fn();
    renderModal({ onVerified, onClose });

    // Simulate the session being set (as if user clicked the magic link in another tab)
    localStorage.setItem('cryopay_token', 'session-token');

    // The component polls every 3s, but we can trigger it manually by clicking "I clicked the link"
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /i clicked the link/i }));

    await waitFor(() => {
      expect(onVerified).toHaveBeenCalled();
    });
  });

  it('closes modal on close button', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const user = userEvent.setup();
    // There are two close buttons (one in the content, one in dialog header), get all and click the first one
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    await user.click(closeButtons[0]);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows instructions to check inbox', () => {
    renderModal();
    expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
  });
});
