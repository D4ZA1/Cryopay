import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import SignUpNonCustodial from '../SignUpNonCustodial';

// Mock useEthereum hook
const mockUseEthereum = {
  address: undefined as `0x${string}` | undefined,
  isConnected: false,
  isConnecting: false,
  signMessage: vi.fn(),
  isMetaMaskInstalled: true,
  connect: vi.fn(),
  disconnect: vi.fn(),
  error: null as Error | null,
  clearError: vi.fn(),
  balance: undefined,
  balanceWei: undefined,
  refreshBalance: vi.fn(),
  chainId: undefined,
  isRegistered: false,
  registerWithBackend: vi.fn(),
};

vi.mock('@/context/EthereumContext', () => ({
  useEthereum: () => mockUseEthereum,
}));

// Mock connectMetaMask API
const mockConnectMetaMask = vi.fn();
vi.mock('@/lib/api', () => ({
  connectMetaMask: (...args: unknown[]) => mockConnectMetaMask(...args),
}));

// Mock WalletConnect component
vi.mock('@/components/WalletConnect', () => ({
  WalletConnect: ({ onConnected, onError: _onError, className }: { 
    onConnected?: () => void; 
    onError?: (err: Error) => void;
    className?: string;
  }) => (
    <button 
      type="button"
      data-testid="wallet-connect-mock"
      className={className}
      onClick={() => {
        if (mockUseEthereum.isConnected && onConnected) {
          onConnected();
        }
      }}
    >
      {mockUseEthereum.isConnected ? 'Connected' : 'MetaMask'}
    </button>
  ),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
const mockLogin = vi.fn();
vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      login: mockLogin,
      logout: vi.fn(),
      isAuthenticated: false,
      user: null,
      token: null,
    }),
  };
});

const renderSignUpNonCustodial = () => render(
  <MemoryRouter>
    <AuthProvider>
      <SignUpNonCustodial />
    </AuthProvider>
  </MemoryRouter>
);

const resetMockEthereum = () => {
  mockUseEthereum.address = undefined;
  mockUseEthereum.isConnected = false;
  mockUseEthereum.isConnecting = false;
  mockUseEthereum.isMetaMaskInstalled = true;
  mockUseEthereum.error = null;
  mockUseEthereum.signMessage.mockReset();
  mockUseEthereum.connect.mockReset();
  mockUseEthereum.disconnect.mockReset();
};

describe('SignUpNonCustodial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockEthereum();
    mockConnectMetaMask.mockReset();
    mockNavigate.mockReset();
    mockLogin.mockReset();
  });

  it('renders wallet connect form', () => {
    renderSignUpNonCustodial();
    // Check for the heading
    expect(screen.getByRole('heading', { name: /create your profile/i })).toBeInTheDocument();
    // Has connect buttons for wallets
    expect(screen.getByTestId('wallet-connect-mock')).toBeInTheDocument();
    expect(screen.getByText('WalletConnect')).toBeInTheDocument();
  });

  it('shows login link in footer', () => {
    renderSignUpNonCustodial();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });

  it('renders wallet connection buttons', () => {
    renderSignUpNonCustodial();

    // Verify wallet buttons are rendered
    expect(screen.getByTestId('wallet-connect-mock')).toBeInTheDocument();
    
    const walletConnectButton = screen.getByText('WalletConnect').closest('button');
    expect(walletConnectButton).toBeInTheDocument();
    
    const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button');
    expect(coinbaseButton).toBeInTheDocument();
  });

  it('renders name input fields', () => {
    renderSignUpNonCustodial();
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  });

  it('shows connected state when wallet is connected', () => {
    mockUseEthereum.isConnected = true;
    mockUseEthereum.address = '0x1234567890abcdef1234567890abcdef12345678';
    
    renderSignUpNonCustodial();
    
    // The mocked WalletConnect shows "Connected" when isConnected is true
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('triggers registration flow when name is filled and wallet connected', async () => {
    const mockSignature = '0xmocksignature123';
    mockUseEthereum.signMessage.mockResolvedValue(mockSignature);
    mockConnectMetaMask.mockResolvedValue({
      ok: true,
      data: {
        token: 'mock-token',
        user: { id: 'user-123' },
      },
    });

    // Start disconnected
    mockUseEthereum.isConnected = false;
    mockUseEthereum.address = undefined;

    const { rerender } = renderSignUpNonCustodial();

    // Fill in the first name
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Satoshi' } });

    // Simulate wallet connection
    mockUseEthereum.isConnected = true;
    mockUseEthereum.address = '0x1234567890abcdef1234567890abcdef12345678';

    // Re-render to trigger the useEffect
    rerender(
      <MemoryRouter>
        <AuthProvider>
          <SignUpNonCustodial />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockUseEthereum.signMessage).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockConnectMetaMask).toHaveBeenCalledWith(
        expect.objectContaining({
          address: '0x1234567890abcdef1234567890abcdef12345678',
          signature: mockSignature,
          firstName: 'Satoshi',
        })
      );
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('mock-token', expect.objectContaining({
        id: 'user-123',
        firstName: 'Satoshi',
      }));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles registration error', async () => {
    mockUseEthereum.signMessage.mockResolvedValue('0xmocksignature');
    mockConnectMetaMask.mockResolvedValue({
      ok: false,
      error: 'Registration failed: duplicate wallet',
    });

    // Start disconnected
    mockUseEthereum.isConnected = false;
    mockUseEthereum.address = undefined;

    const { rerender } = renderSignUpNonCustodial();

    // Fill in the first name
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Satoshi' } });

    // Simulate wallet connection
    mockUseEthereum.isConnected = true;
    mockUseEthereum.address = '0x1234567890abcdef1234567890abcdef12345678';

    rerender(
      <MemoryRouter>
        <AuthProvider>
          <SignUpNonCustodial />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Registration failed: duplicate wallet')).toBeInTheDocument();
    });

    // Should not navigate or login on error
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows error from wallet connection (signing failed)', async () => {
    mockUseEthereum.signMessage.mockRejectedValue(new Error('User rejected signing'));

    // Start disconnected
    mockUseEthereum.isConnected = false;
    mockUseEthereum.address = undefined;

    const { rerender } = renderSignUpNonCustodial();

    // Fill in the first name
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Satoshi' } });

    // Simulate wallet connection
    mockUseEthereum.isConnected = true;
    mockUseEthereum.address = '0x1234567890abcdef1234567890abcdef12345678';

    rerender(
      <MemoryRouter>
        <AuthProvider>
          <SignUpNonCustodial />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User rejected signing')).toBeInTheDocument();
    });

    // Should not call API, navigate or login when signing fails
    expect(mockConnectMetaMask).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows warning when first name is not filled before connecting wallet', () => {
    renderSignUpNonCustodial();
    
    expect(screen.getByText('Please enter your first name before connecting your wallet.')).toBeInTheDocument();
  });

  it('does not show warning when first name is filled', () => {
    renderSignUpNonCustodial();
    
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Satoshi' } });
    
    expect(screen.queryByText('Please enter your first name before connecting your wallet.')).not.toBeInTheDocument();
  });
});
