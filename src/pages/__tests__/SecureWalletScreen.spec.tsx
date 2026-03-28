import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import SecureWalletScreen from '../SecureWalletScreen';
import * as crypto from '../../lib/crypto';
import * as api from '../../lib/api';
import userEvent from '@testing-library/user-event';

vi.mock('../../lib/crypto');
vi.mock('../../lib/api');

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

const mockGenerateKeyPair = crypto.generateKeyPair as Mock;
const mockExportJwk = crypto.exportJwk as Mock;
const mockJwkThumbprint = crypto.jwkThumbprint as Mock;
const mockEncryptJwkWithPassword = crypto.encryptJwkWithPassword as Mock;
const mockApiFetch = api.apiFetch as Mock;
const mockGetProfile = api.getProfile as Mock;
const mockSaveWallet = api.saveWallet as Mock;

const renderSecureWallet = () => render(
  <MemoryRouter initialEntries={['/secure-wallet']} initialIndex={0}>
    <AuthProvider>
      <SecureWalletScreen />
    </AuthProvider>
  </MemoryRouter>
);

describe('SecureWalletScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Default mocks
    mockApiFetch.mockResolvedValue({ ok: true });
    mockGetProfile.mockResolvedValue({ ok: true, data: { profile: { id: 'user-123' } } });
    mockSaveWallet.mockResolvedValue({ ok: true });
    mockGenerateKeyPair.mockResolvedValue({
      privateKey: { type: 'private' },
      publicKey: { type: 'public' },
    });
    mockExportJwk.mockResolvedValue({ kty: 'EC', crv: 'P-256', x: 'testx', y: 'testy' });
    mockJwkThumbprint.mockResolvedValue('test-thumbprint-123');
    mockEncryptJwkWithPassword.mockResolvedValue({ encrypted: 'data' });
  });

  it('renders wallet ready heading', async () => {
    renderSecureWallet();
    
    await waitFor(() => {
      expect(screen.getByText(/your new wallet is ready/i)).toBeInTheDocument();
    });
  });

  it('shows public address after key generation', async () => {
    renderSecureWallet();
    
    await waitFor(() => {
      expect(screen.getByText('test-thumbprint-123')).toBeInTheDocument();
    });
  });

  it('generates keys on mount', async () => {
    renderSecureWallet();
    
    await waitFor(() => {
      expect(mockGenerateKeyPair).toHaveBeenCalled();
    });
  });

  it('shows reveal private key button', async () => {
    renderSecureWallet();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reveal private key/i })).toBeInTheDocument();
    });
  });

  it('reveals private key on button click', async () => {
    renderSecureWallet();
    
    const user = userEvent.setup();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reveal private key/i })).toBeInTheDocument();
    });
    
    await user.click(screen.getByRole('button', { name: /reveal private key/i }));
    
    await waitFor(() => {
      // After revealing, we should see the encryption password input
      expect(screen.getByPlaceholderText(/enter a password to encrypt/i)).toBeInTheDocument();
    });
  });

  it('shows 2FA options section', async () => {
    renderSecureWallet();
    
    await waitFor(() => {
      expect(screen.getByText(/set up 2-factor authentication/i)).toBeInTheDocument();
    });
  });

  it('has finish button', async () => {
    renderSecureWallet();
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /finish & go to dashboard/i })).toBeInTheDocument();
    });
  });

  it('shows step 3 of 3 progress', async () => {
    renderSecureWallet();
    
    await waitFor(() => {
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    });
  });
});
