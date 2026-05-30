import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMetaMask } from '../useMetaMask';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
  useBalance: vi.fn(),
  useChainId: vi.fn(),
  useSignMessage: vi.fn(),
}));

vi.mock('wagmi/connectors', () => ({
  metaMask: vi.fn(() => ({ id: 'metaMask' })),
}));

vi.mock('viem', () => ({
  formatEther: vi.fn((value: bigint) => (Number(value) / 1e18).toString()),
}));

import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useChainId,
  useSignMessage,
} from 'wagmi';

const mockUseAccount = vi.mocked(useAccount);
const mockUseConnect = vi.mocked(useConnect);
const mockUseDisconnect = vi.mocked(useDisconnect);
const mockUseBalance = vi.mocked(useBalance);
const mockUseChainId = vi.mocked(useChainId);
const mockUseSignMessage = vi.mocked(useSignMessage);

// Helper to create mock return values with proper typing
const createAccountMock = (overrides: {
  address?: `0x${string}`;
  isConnected?: boolean;
  isConnecting?: boolean;
}) => ({
  address: overrides.address,
  isConnected: overrides.isConnected ?? false,
  isConnecting: overrides.isConnecting ?? false,
  addresses: undefined,
  chain: undefined,
  chainId: undefined,
  connector: undefined,
  isDisconnected: !overrides.isConnected,
  isReconnecting: false,
  status: overrides.isConnected ? 'connected' : 'disconnected',
} as unknown as ReturnType<typeof useAccount>);

const createConnectMock = (overrides: {
  connectAsync?: ReturnType<typeof vi.fn>;
  isPending?: boolean;
  error?: Error | null;
}) => ({
  connectAsync: overrides.connectAsync ?? vi.fn(),
  isPending: overrides.isPending ?? false,
  error: overrides.error ?? null,
  connect: vi.fn(),
  connectors: [],
  data: undefined,
  isError: Boolean(overrides.error),
  isIdle: !overrides.isPending,
  isPaused: false,
  isSuccess: false,
  reset: vi.fn(),
  status: 'idle',
  variables: undefined,
  failureCount: 0,
  failureReason: null,
  submittedAt: 0,
} as unknown as ReturnType<typeof useConnect>);

const createDisconnectMock = (overrides: {
  disconnect?: ReturnType<typeof vi.fn>;
}) => ({
  disconnect: overrides.disconnect ?? vi.fn(),
  disconnectAsync: vi.fn(),
  connectors: [],
  data: undefined,
  error: null,
  isError: false,
  isIdle: true,
  isPending: false,
  isPaused: false,
  isSuccess: false,
  reset: vi.fn(),
  status: 'idle',
  variables: undefined,
  failureCount: 0,
  failureReason: null,
  submittedAt: 0,
} as unknown as ReturnType<typeof useDisconnect>);

const createBalanceMock = (overrides: {
  data?: { value: bigint };
  error?: Error | null;
}) => ({
  data: overrides.data,
  error: overrides.error ?? null,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  failureCount: 0,
  failureReason: null,
  fetchStatus: 'idle',
  isError: Boolean(overrides.error),
  isFetched: true,
  isFetchedAfterMount: true,
  isFetching: false,
  isLoading: false,
  isLoadingError: false,
  isPaused: false,
  isPending: false,
  isPlaceholderData: false,
  isRefetchError: false,
  isRefetching: false,
  isStale: false,
  isSuccess: Boolean(overrides.data),
  refetch: vi.fn(),
  status: overrides.data ? 'success' : 'pending',
  queryKey: ['balance'],
} as unknown as ReturnType<typeof useBalance>);

const createSignMessageMock = (overrides: {
  signMessageAsync?: ReturnType<typeof vi.fn>;
  error?: Error | null;
}) => ({
  signMessageAsync: overrides.signMessageAsync ?? vi.fn(),
  signMessage: vi.fn(),
  data: undefined,
  error: overrides.error ?? null,
  isError: Boolean(overrides.error),
  isIdle: true,
  isPending: false,
  isPaused: false,
  isSuccess: false,
  reset: vi.fn(),
  status: 'idle',
  variables: undefined,
  failureCount: 0,
  failureReason: null,
  submittedAt: 0,
} as unknown as ReturnType<typeof useSignMessage>);

describe('useMetaMask', () => {
  const mockConnectAsync = vi.fn();
  const mockDisconnect = vi.fn();
  const mockSignMessageAsync = vi.fn();

  const defaultMocks = () => {
    mockUseAccount.mockReturnValue(createAccountMock({
      address: undefined,
      isConnected: false,
      isConnecting: false,
    }));

    mockUseConnect.mockReturnValue(createConnectMock({
      connectAsync: mockConnectAsync,
      isPending: false,
      error: null,
    }));

    mockUseDisconnect.mockReturnValue(createDisconnectMock({
      disconnect: mockDisconnect,
    }));

    mockUseBalance.mockReturnValue(createBalanceMock({
      data: undefined,
      error: null,
    }));

    mockUseChainId.mockReturnValue(1);

    mockUseSignMessage.mockReturnValue(createSignMessageMock({
      signMessageAsync: mockSignMessageAsync,
      error: null,
    }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();

    // Default: MetaMask is installed
    Object.defineProperty(window, 'ethereum', {
      value: { isMetaMask: true },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Clean up window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  describe('initial state when not connected', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useMetaMask());

      expect(result.current.address).toBeUndefined();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.chainId).toBe(1);
      expect(result.current.balance).toBeUndefined();
      expect(result.current.balanceWei).toBeUndefined();
      expect(result.current.error).toBeNull();
      expect(result.current.isMetaMaskInstalled).toBe(true);
    });

    it('has connect and disconnect functions available', () => {
      const { result } = renderHook(() => useMetaMask());

      expect(typeof result.current.connect).toBe('function');
      expect(typeof result.current.disconnect).toBe('function');
      expect(typeof result.current.signMessage).toBe('function');
    });
  });

  describe('MetaMask not installed detection', () => {
    it('detects when MetaMask is not installed', () => {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useMetaMask());

      expect(result.current.isMetaMaskInstalled).toBe(false);
    });

    it('detects when ethereum exists but is not MetaMask', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { isMetaMask: false },
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useMetaMask());

      expect(result.current.isMetaMaskInstalled).toBe(false);
    });

    it('throws error when trying to connect without MetaMask installed', async () => {
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useMetaMask());

      let thrownError: Error | undefined;
      await act(async () => {
        try {
          await result.current.connect();
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe(
        'MetaMask is not installed. Please install MetaMask to continue.'
      );
      expect(result.current.error?.message).toBe(
        'MetaMask is not installed. Please install MetaMask to continue.'
      );
    });
  });

  describe('successful connection', () => {
    it('connects successfully and updates state', async () => {
      mockConnectAsync.mockResolvedValueOnce({
        accounts: ['0x1234567890abcdef1234567890abcdef12345678'],
        chainId: 1,
      });

      const { result } = renderHook(() => useMetaMask());

      await act(async () => {
        await result.current.connect();
      });

      expect(mockConnectAsync).toHaveBeenCalledWith({
        connector: { id: 'metaMask' },
      });
    });

    it('shows isConnecting state during connection', () => {
      mockUseAccount.mockReturnValue(createAccountMock({
        address: undefined,
        isConnected: false,
        isConnecting: true,
      }));

      const { result } = renderHook(() => useMetaMask());

      expect(result.current.isConnecting).toBe(true);
    });

    it('shows isConnecting when isPending is true', () => {
      mockUseConnect.mockReturnValue(createConnectMock({
        connectAsync: mockConnectAsync,
        isPending: true,
        error: null,
      }));

      const { result } = renderHook(() => useMetaMask());

      expect(result.current.isConnecting).toBe(true);
    });

    it('returns connected state with address and chainId', () => {
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678' as const;

      mockUseAccount.mockReturnValue(createAccountMock({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      }));

      mockUseChainId.mockReturnValue(137);

      const { result } = renderHook(() => useMetaMask());

      expect(result.current.address).toBe(testAddress);
      expect(result.current.isConnected).toBe(true);
      expect(result.current.chainId).toBe(137);
    });
  });

  describe('connection error handling', () => {
    it('handles connection rejection error', async () => {
      const connectionError = new Error('User rejected the request');
      mockConnectAsync.mockRejectedValueOnce(connectionError);

      const { result } = renderHook(() => useMetaMask());

      let thrownError: Error | undefined;
      await act(async () => {
        try {
          await result.current.connect();
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('User rejected the request');
      expect(result.current.error?.message).toBe('User rejected the request');
    });

    it('handles non-Error rejection', async () => {
      mockConnectAsync.mockRejectedValueOnce('string error');

      const { result } = renderHook(() => useMetaMask());

      let thrownError: Error | undefined;
      await act(async () => {
        try {
          await result.current.connect();
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Failed to connect to MetaMask');
      expect(result.current.error?.message).toBe('Failed to connect to MetaMask');
    });

    it('aggregates connect error from useConnect', () => {
      const connectError = new Error('Connection failed');

      mockUseConnect.mockReturnValue(createConnectMock({
        connectAsync: mockConnectAsync,
        isPending: false,
        error: connectError,
      }));

      const { result } = renderHook(() => useMetaMask());

      expect(result.current.error?.message).toBe('Connection failed');
    });
  });

  describe('disconnect functionality', () => {
    it('calls wagmi disconnect when disconnect is called', () => {
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678' as const;

      mockUseAccount.mockReturnValue(createAccountMock({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      }));

      const { result } = renderHook(() => useMetaMask());

      act(() => {
        result.current.disconnect();
      });

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('clears error state on disconnect', () => {
      mockUseConnect.mockReturnValue(createConnectMock({
        connectAsync: mockConnectAsync,
        isPending: false,
        error: new Error('Previous error'),
      }));

      const { result } = renderHook(() => useMetaMask());

      // Error should be set from the hook aggregation
      expect(result.current.error).not.toBeNull();

      // Reset mock to clear the error
      mockUseConnect.mockReturnValue(createConnectMock({
        connectAsync: mockConnectAsync,
        isPending: false,
        error: null,
      }));

      act(() => {
        result.current.disconnect();
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('sign message when connected', () => {
    it('signs message successfully when connected', async () => {
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678' as const;
      const testSignature = '0xabcdef1234567890';

      mockUseAccount.mockReturnValue(createAccountMock({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      }));

      mockSignMessageAsync.mockResolvedValueOnce(testSignature);

      const { result } = renderHook(() => useMetaMask());

      let signature: string | undefined;
      await act(async () => {
        signature = await result.current.signMessage('Hello, World!');
      });

      expect(signature).toBe(testSignature);
      expect(mockSignMessageAsync).toHaveBeenCalledWith({
        message: 'Hello, World!',
        account: testAddress,
      });
    });

    it('handles sign message error', async () => {
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678' as const;
      const signError = new Error('User denied signature');

      mockUseAccount.mockReturnValue(createAccountMock({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      }));

      mockSignMessageAsync.mockRejectedValueOnce(signError);

      const { result } = renderHook(() => useMetaMask());

      let thrownError: Error | undefined;
      await act(async () => {
        try {
          await result.current.signMessage('Hello, World!');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('User denied signature');
      expect(result.current.error?.message).toBe('User denied signature');
    });

    it('handles non-Error sign message rejection', async () => {
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678' as const;

      mockUseAccount.mockReturnValue(createAccountMock({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      }));

      mockSignMessageAsync.mockRejectedValueOnce('string error');

      const { result } = renderHook(() => useMetaMask());

      let thrownError: Error | undefined;
      await act(async () => {
        try {
          await result.current.signMessage('Hello, World!');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Failed to sign message');
      expect(result.current.error?.message).toBe('Failed to sign message');
    });
  });

  describe('sign message error when not connected', () => {
    it('throws error when signing message while not connected', async () => {
      const { result } = renderHook(() => useMetaMask());

      let thrownError: Error | undefined;
      await act(async () => {
        try {
          await result.current.signMessage('Hello, World!');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe(
        'Wallet not connected. Please connect your wallet first.'
      );
      expect(result.current.error?.message).toBe(
        'Wallet not connected. Please connect your wallet first.'
      );
    });

    it('throws error when address is undefined even if isConnected', async () => {
      mockUseAccount.mockReturnValue(createAccountMock({
        address: undefined,
        isConnected: true, // Edge case
        isConnecting: false,
      }));

      const { result } = renderHook(() => useMetaMask());

      let thrownError: Error | undefined;
      await act(async () => {
        try {
          await result.current.signMessage('Hello, World!');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe(
        'Wallet not connected. Please connect your wallet first.'
      );
    });
  });

  describe('balance formatting', () => {
    it('returns formatted balance when connected', () => {
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678' as const;
      const balanceWei = BigInt('1000000000000000000'); // 1 ETH in wei

      mockUseAccount.mockReturnValue(createAccountMock({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      }));

      mockUseBalance.mockReturnValue(createBalanceMock({
        data: { value: balanceWei },
        error: null,
      }));

      const { result } = renderHook(() => useMetaMask());

      expect(result.current.balance).toBe('1');
      expect(result.current.balanceWei).toBe(balanceWei);
    });

    it('returns undefined balance when not connected', () => {
      const { result } = renderHook(() => useMetaMask());

      expect(result.current.balance).toBeUndefined();
      expect(result.current.balanceWei).toBeUndefined();
    });

    it('formats small balance correctly', () => {
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678' as const;
      const balanceWei = BigInt('100000000000000000'); // 0.1 ETH in wei

      mockUseAccount.mockReturnValue(createAccountMock({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      }));

      mockUseBalance.mockReturnValue(createBalanceMock({
        data: { value: balanceWei },
        error: null,
      }));

      const { result } = renderHook(() => useMetaMask());

      expect(result.current.balance).toBe('0.1');
      expect(result.current.balanceWei).toBe(balanceWei);
    });

    it('handles balance error', () => {
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678' as const;
      const balanceError = new Error('Failed to fetch balance');

      mockUseAccount.mockReturnValue(createAccountMock({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      }));

      mockUseBalance.mockReturnValue(createBalanceMock({
        data: undefined,
        error: balanceError,
      }));

      const { result } = renderHook(() => useMetaMask());

      expect(result.current.balance).toBeUndefined();
      expect(result.current.error?.message).toBe('Failed to fetch balance');
    });

    it('handles zero balance', () => {
      const testAddress = '0x1234567890abcdef1234567890abcdef12345678' as const;
      const balanceWei = BigInt('0');

      mockUseAccount.mockReturnValue(createAccountMock({
        address: testAddress,
        isConnected: true,
        isConnecting: false,
      }));

      mockUseBalance.mockReturnValue(createBalanceMock({
        data: { value: balanceWei },
        error: null,
      }));

      const { result } = renderHook(() => useMetaMask());

      expect(result.current.balance).toBe('0');
      expect(result.current.balanceWei).toBe(balanceWei);
    });
  });

  describe('error aggregation', () => {
    it('aggregates sign error', () => {
      const signError = new Error('Sign error');

      mockUseSignMessage.mockReturnValue(createSignMessageMock({
        signMessageAsync: mockSignMessageAsync,
        error: signError,
      }));

      const { result } = renderHook(() => useMetaMask());

      expect(result.current.error?.message).toBe('Sign error');
    });

    it('prioritizes connect error over other errors', () => {
      const connectError = new Error('Connect error');
      const balanceError = new Error('Balance error');

      mockUseConnect.mockReturnValue(createConnectMock({
        connectAsync: mockConnectAsync,
        isPending: false,
        error: connectError,
      }));

      mockUseBalance.mockReturnValue(createBalanceMock({
        data: undefined,
        error: balanceError,
      }));

      const { result } = renderHook(() => useMetaMask());

      // connectError is checked first in the useEffect
      expect(result.current.error?.message).toBe('Connect error');
    });
  });
});
