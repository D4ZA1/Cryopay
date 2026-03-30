import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Wallet from '../Wallet';

// Mock the AuthContext
const mockRefreshUser = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', firstName: 'Test', email: 'test@example.com' },
    refreshUser: mockRefreshUser,
  })),
}));

// Mock the API module
vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn().mockResolvedValue({ ok: true, data: {} }),
  saveWallet: vi.fn().mockResolvedValue({ ok: true, data: {} }),
}));

// Mock the crypto module
vi.mock('../../lib/crypto', () => ({
  generateKeyPair: vi.fn().mockResolvedValue({
    publicKey: {} as CryptoKey,
    privateKey: {} as CryptoKey,
  }),
  exportJwk: vi.fn().mockResolvedValue({ kty: 'EC', crv: 'P-256', x: 'test-x', y: 'test-y' }),
  encryptJwkWithPassword: vi.fn().mockResolvedValue({ salt: 'abc', iv: 'def', ciphertext: 'ghi' }),
  jwkThumbprint: vi.fn().mockResolvedValue('test-thumbprint-1234567890'),
}));

const renderWallet = () =>
  render(
    <MemoryRouter>
      <Wallet />
    </MemoryRouter>
  );

describe('Wallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as any).__cryopay_private_jwk;
  });

  it('renders the wallet page with heading', () => {
    renderWallet();
    expect(screen.getByRole('heading', { name: /wallet/i })).toBeInTheDocument();
  });

  it('renders the generate keypair button', () => {
    renderWallet();
    expect(screen.getByRole('button', { name: /generate keypair/i })).toBeInTheDocument();
  });

  it('renders the save button', () => {
    renderWallet();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('renders the encryption password input', () => {
    renderWallet();
    // Look for the password input - there should be exactly one
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();
  });

  it('renders button to confirm key page', () => {
    renderWallet();
    expect(screen.getByRole('button', { name: /go to confirm key/i })).toBeInTheDocument();
  });

  it('generates keypair and shows thumbprint when button clicked', async () => {
    const { generateKeyPair, exportJwk, jwkThumbprint } = await import('../../lib/crypto');
    renderWallet();

    fireEvent.click(screen.getByRole('button', { name: /generate keypair/i }));

    await waitFor(() => {
      expect(generateKeyPair).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(exportJwk).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(jwkThumbprint).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/public key id/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/test-thumbprint/i)).toBeInTheDocument();
    });
  });

  it('shows status message after generating keypair', async () => {
    renderWallet();

    fireEvent.click(screen.getByRole('button', { name: /generate keypair/i }));

    await waitFor(() => {
      expect(screen.getByText(/keypair generated/i)).toBeInTheDocument();
    });
  });

  it('allows entering encryption password', () => {
    renderWallet();

    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'mypassword123' } });

    expect(passwordInput).toHaveValue('mypassword123');
  });

  it('saves wallet when save button is clicked after generating keypair', async () => {
    const { saveWallet } = await import('../../lib/api');
    renderWallet();

    // First generate a keypair
    fireEvent.click(screen.getByRole('button', { name: /generate keypair/i }));

    await waitFor(() => {
      expect(screen.getByText(/keypair generated/i)).toBeInTheDocument();
    });

    // Enter password
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

    // Click save
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(saveWallet).toHaveBeenCalled();
    });
  });

  it('shows error if trying to save without password', async () => {
    renderWallet();

    // Generate keypair first
    fireEvent.click(screen.getByRole('button', { name: /generate keypair/i }));

    await waitFor(() => {
      expect(screen.getByText(/keypair generated/i)).toBeInTheDocument();
    });

    // Click save without entering password
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter a password/i)).toBeInTheDocument();
    });
  });
});
