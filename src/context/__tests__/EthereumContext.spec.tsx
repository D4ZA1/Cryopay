import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EthereumProvider, useEthereum } from '../EthereumContext';
import * as api from '../../lib/api';

// Mock wagmi hooks
const mockUseAccount = vi.fn();
const mockUseConnect = vi.fn();
const mockUseDisconnect = vi.fn();
const mockUseBalance = vi.fn();
const mockUseSignMessage = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  useConnect: () => mockUseConnect(),
  useDisconnect: () => mockUseDisconnect(),
  useBalance: () => mockUseBalance(),
  useSignMessage: () => mockUseSignMessage(),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: class MockQueryClient {
    constructor() {}
    defaultOptions = {};
  },
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../lib/web3', () => ({
  config: {},
}));

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = api.apiFetch as unknown as ReturnType<typeof vi.fn>;

// Default mock return values
const defaultUseAccountReturn = {
  address: undefined,
  isConnected: false,
  isConnecting: false,
  chainId: undefined,
};

const defaultUseConnectReturn = {
  connectAsync: vi.fn(),
  connectors: [{ id: 'metaMask', name: 'MetaMask' }],
};

const defaultUseDisconnectReturn = {
  disconnectAsync: vi.fn(),
};

const defaultUseBalanceReturn = {
  data: undefined,
  refetch: vi.fn(),
};

const defaultUseSignMessageReturn = {
  signMessageAsync: vi.fn(),
};

// Test component that displays context values
const TestComponent = () => {
  const ethereum = useEthereum();
  return (
    <div>
      <span data-testid="address">{ethereum.address || 'no-address'}</span>
      <span data-testid="is-connected">{ethereum.isConnected ? 'connected' : 'disconnected'}</span>
      <span data-testid="is-connecting">{ethereum.isConnecting ? 'connecting' : 'not-connecting'}</span>
      <span data-testid="chain-id">{ethereum.chainId?.toString() || 'no-chain'}</span>
      <span data-testid="balance">{ethereum.balance || 'no-balance'}</span>
      <span data-testid="balance-wei">{ethereum.balanceWei?.toString() || 'no-balance-wei'}</span>
      <span data-testid="is-metamask">{ethereum.isMetaMaskInstalled ? 'installed' : 'not-installed'}</span>
      <span data-testid="error">{ethereum.error?.message || 'no-error'}</span>
      <span data-testid="is-registered">{ethereum.isRegistered ? 'registered' : 'not-registered'}</span>
      <button type="button" data-testid="connect-btn" onClick={() => ethereum.connect().catch(() => {})}>
        Connect
      </button>
      <button type="button" data-testid="disconnect-btn" onClick={ethereum.disconnect}>
        Disconnect
      </button>
      <button type="button" data-testid="refresh-btn" onClick={ethereum.refreshBalance}>
        Refresh
      </button>
      <button type="button" data-testid="clear-error-btn" onClick={ethereum.clearError}>
        Clear Error
      </button>
      <button
        type="button"
        data-testid="sign-btn"
        onClick={() => ethereum.signMessage('test message').catch(() => {})}
      >
        Sign
      </button>
      <button
        type="button"
        data-testid="register-btn"
        onClick={() => ethereum.registerWithBackend().catch(() => {})}
      >
        Register
      </button>
    </div>
  );
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<EthereumProvider>{ui}</EthereumProvider>);
};

// Setup default mocks before each test
const setupDefaultMocks = () => {
  mockUseAccount.mockReturnValue({ ...defaultUseAccountReturn });
  mockUseConnect.mockReturnValue({ ...defaultUseConnectReturn });
  mockUseDisconnect.mockReturnValue({ ...defaultUseDisconnectReturn });
  mockUseBalance.mockReturnValue({ ...defaultUseBalanceReturn });
  mockUseSignMessage.mockReturnValue({ ...defaultUseSignMessageReturn });
  mockApiFetch.mockResolvedValue({ ok: false });
};

describe('EthereumContext', () => {
  // Store original window.ethereum
  const originalEthereum = (window as any).ethereum;

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    // Default: MetaMask not installed
    delete (window as any).ethereum;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore window.ethereum
    if (originalEthereum) {
      (window as any).ethereum = originalEthereum;
    } else {
      delete (window as any).ethereum;
    }
  });

  it('provides initial disconnected state', async () => {
    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('is-connected')).toHaveTextContent('disconnected');
    });

    expect(screen.getByTestId('address')).toHaveTextContent('no-address');
    expect(screen.getByTestId('is-connecting')).toHaveTextContent('not-connecting');
    expect(screen.getByTestId('chain-id')).toHaveTextContent('no-chain');
    expect(screen.getByTestId('balance')).toHaveTextContent('no-balance');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('is-registered')).toHaveTextContent('not-registered');
  });

  it('useEthereum throws outside provider', () => {
    const BadComponent = () => {
      const ethereum = useEthereum();
      return <div>{ethereum.address}</div>;
    };

    // Suppress console.error for this test since we expect an error
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<BadComponent />)).toThrow('useEthereum must be used within an EthereumProvider');

    consoleSpy.mockRestore();
  });

  it('shows isConnected when wallet is connected via wagmi', async () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      chainId: 1,
    });

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('is-connected')).toHaveTextContent('connected');
    });

    expect(screen.getByTestId('address')).toHaveTextContent('0x1234567890123456789012345678901234567890');
    expect(screen.getByTestId('chain-id')).toHaveTextContent('1');
  });

  it('shows formatted balance', async () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      chainId: 1,
    });

    // 1 ETH = 1e18 wei
    mockUseBalance.mockReturnValue({
      data: { value: BigInt('1000000000000000000') },
      refetch: vi.fn(),
    });

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('balance')).toHaveTextContent('1');
    });

    expect(screen.getByTestId('balance-wei')).toHaveTextContent('1000000000000000000');
  });

  it('connect() calls wagmi connectAsync with MetaMask connector', async () => {
    // Setup MetaMask as installed
    (window as any).ethereum = { isMetaMask: true };

    const mockConnectAsync = vi.fn().mockResolvedValue({});
    const metaMaskConnector = { id: 'metaMask', name: 'MetaMask' };

    mockUseConnect.mockReturnValue({
      connectAsync: mockConnectAsync,
      connectors: [metaMaskConnector],
    });

    renderWithProviders(<TestComponent />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('connect-btn'));
    });

    expect(mockConnectAsync).toHaveBeenCalledWith({ connector: metaMaskConnector });
  });

  it('connect() throws error when MetaMask not installed', async () => {
    // MetaMask not installed (window.ethereum is undefined by default in beforeEach)
    renderWithProviders(<TestComponent />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('connect-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('MetaMask is not installed');
    });
  });

  it('disconnect() calls wagmi disconnectAsync and resets registration', async () => {
    const mockDisconnectAsync = vi.fn().mockResolvedValue({});

    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      chainId: 1,
    });

    mockUseDisconnect.mockReturnValue({
      disconnectAsync: mockDisconnectAsync,
    });

    // Mock that wallet is already registered
    mockApiFetch.mockResolvedValue({
      ok: true,
      data: {
        wallet: {
          public_key: '0x1234567890123456789012345678901234567890',
          verified: true,
        },
      },
    });

    renderWithProviders(<TestComponent />);

    // Wait for registration check to complete
    await waitFor(() => {
      expect(screen.getByTestId('is-registered')).toHaveTextContent('registered');
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('disconnect-btn'));
    });

    expect(mockDisconnectAsync).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId('is-registered')).toHaveTextContent('not-registered');
    });
  });

  it('signMessage() calls wagmi signMessageAsync', async () => {
    const mockSignMessageAsync = vi.fn().mockResolvedValue('0xsignature123');

    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      chainId: 1,
    });

    mockUseSignMessage.mockReturnValue({
      signMessageAsync: mockSignMessageAsync,
    });

    // Create a component that captures the return value
    const SignTestComponent = () => {
      const ethereum = useEthereum();
      const [signature, setSignature] = React.useState<string | null>(null);

      const handleSign = async () => {
        const sig = await ethereum.signMessage('test message');
        setSignature(sig);
      };

      return (
        <div>
          <span data-testid="signature">{signature || 'no-signature'}</span>
          <button type="button" data-testid="sign-btn" onClick={handleSign}>
            Sign
          </button>
        </div>
      );
    };

    renderWithProviders(<SignTestComponent />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('sign-btn'));
    });

    expect(mockSignMessageAsync).toHaveBeenCalledWith({ message: 'test message' });
    await waitFor(() => {
      expect(screen.getByTestId('signature')).toHaveTextContent('0xsignature123');
    });
  });

  it('signMessage() throws when not connected', async () => {
    // Default state is disconnected
    renderWithProviders(<TestComponent />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('sign-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Wallet not connected');
    });
  });

  it('clearError() resets error state', async () => {
    // Trigger an error by trying to connect without MetaMask
    renderWithProviders(<TestComponent />);

    // First, trigger an error
    await act(async () => {
      fireEvent.click(screen.getByTestId('connect-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
    });

    // Now clear the error
    await act(async () => {
      fireEvent.click(screen.getByTestId('clear-error-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  it('registerWithBackend() signs challenge and calls API', async () => {
    const mockSignMessageAsync = vi.fn().mockResolvedValue('0xsignature123');

    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      chainId: 1,
    });

    mockUseSignMessage.mockReturnValue({
      signMessageAsync: mockSignMessageAsync,
    });

    // First call is for initial registration check, second is for register
    mockApiFetch
      .mockResolvedValueOnce({ ok: false }) // Initial check - not registered
      .mockResolvedValueOnce({ ok: true }); // Registration call succeeds

    // Component that captures the result of registerWithBackend
    const RegisterTestComponent = () => {
      const ethereum = useEthereum();
      const [result, setResult] = React.useState<boolean | null>(null);

      const handleRegister = async () => {
        const success = await ethereum.registerWithBackend();
        setResult(success);
      };

      return (
        <div>
          <span data-testid="is-registered">{ethereum.isRegistered ? 'registered' : 'not-registered'}</span>
          <span data-testid="register-result">{result === null ? 'pending' : result ? 'success' : 'failed'}</span>
          <button type="button" data-testid="register-btn" onClick={handleRegister}>
            Register
          </button>
        </div>
      );
    };

    renderWithProviders(<RegisterTestComponent />);

    // Wait for initial registration check
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/wallet');
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('register-btn'));
    });

    // Verify signMessageAsync was called with a challenge message
    expect(mockSignMessageAsync).toHaveBeenCalled();
    const signCallArg = mockSignMessageAsync.mock.calls[0][0];
    expect(signCallArg.message).toContain('Sign this message to verify your wallet ownership');

    // Verify API was called with correct data
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/wallet/verify-wallet',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('0x1234567890123456789012345678901234567890'),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-registered')).toHaveTextContent('registered');
      expect(screen.getByTestId('register-result')).toHaveTextContent('success');
    });
  });

  it('checks registration status on wallet connect', async () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      chainId: 1,
    });

    mockApiFetch.mockResolvedValue({
      ok: true,
      data: {
        wallet: {
          public_key: '0x1234567890123456789012345678901234567890',
          verified: true,
        },
      },
    });

    renderWithProviders(<TestComponent />);

    // Verify API was called to check registration
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/wallet');
    });

    // Verify registration status was set
    await waitFor(() => {
      expect(screen.getByTestId('is-registered')).toHaveTextContent('registered');
    });
  });

  it('refreshBalance calls refetch when address is present', async () => {
    const mockRefetch = vi.fn();

    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      chainId: 1,
    });

    mockUseBalance.mockReturnValue({
      data: { value: BigInt('1000000000000000000') },
      refetch: mockRefetch,
    });

    renderWithProviders(<TestComponent />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('refresh-btn'));
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows isMetaMaskInstalled when MetaMask is detected', async () => {
    (window as any).ethereum = { isMetaMask: true };

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('is-metamask')).toHaveTextContent('installed');
    });
  });

  it('resets isRegistered when wallet disconnects', async () => {
    // Start connected and registered
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      chainId: 1,
    });

    mockApiFetch.mockResolvedValue({
      ok: true,
      data: {
        wallet: {
          public_key: '0x1234567890123456789012345678901234567890',
          verified: true,
        },
      },
    });

    const { rerender } = renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('is-registered')).toHaveTextContent('registered');
    });

    // Now simulate disconnection by changing useAccount return value
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      isConnecting: false,
      chainId: undefined,
    });

    // Re-render to trigger the effect
    rerender(
      <EthereumProvider>
        <TestComponent />
      </EthereumProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-registered')).toHaveTextContent('not-registered');
    });
  });

  it('handles registration check error gracefully', async () => {
    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      chainId: 1,
    });

    // Mock API to reject
    mockApiFetch.mockRejectedValue(new Error('Network error'));

    // Suppress console warnings for this test
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProviders(<TestComponent />);

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.getByTestId('is-connected')).toHaveTextContent('connected');
    });

    // Registration should remain false after error
    expect(screen.getByTestId('is-registered')).toHaveTextContent('not-registered');

    consoleSpy.mockRestore();
  });

  it('registerWithBackend() returns false when API fails', async () => {
    const mockSignMessageAsync = vi.fn().mockResolvedValue('0xsignature123');

    mockUseAccount.mockReturnValue({
      address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      chainId: 1,
    });

    mockUseSignMessage.mockReturnValue({
      signMessageAsync: mockSignMessageAsync,
    });

    // Initial check returns not registered, then registration fails
    mockApiFetch
      .mockResolvedValueOnce({ ok: false }) // Initial check
      .mockResolvedValueOnce({ ok: false, error: 'Registration failed' }); // Registration fails

    // Suppress console errors for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const RegisterTestComponent = () => {
      const ethereum = useEthereum();
      const [result, setResult] = React.useState<boolean | null>(null);

      const handleRegister = async () => {
        const success = await ethereum.registerWithBackend();
        setResult(success);
      };

      return (
        <div>
          <span data-testid="register-result">{result === null ? 'pending' : result ? 'success' : 'failed'}</span>
          <span data-testid="error">{ethereum.error?.message || 'no-error'}</span>
          <button type="button" data-testid="register-btn" onClick={handleRegister}>
            Register
          </button>
        </div>
      );
    };

    renderWithProviders(<RegisterTestComponent />);

    // Wait for initial check
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith('/api/wallet');
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('register-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('register-result')).toHaveTextContent('failed');
      expect(screen.getByTestId('error')).toHaveTextContent('Registration failed');
    });

    consoleSpy.mockRestore();
  });
});
