import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { WagmiProvider, useAccount, useConnect, useDisconnect, useBalance, useSignMessage } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { formatEther } from 'viem';
import { config } from '../lib/web3';
import { apiFetch } from '../lib/api';

// Types
interface EthereumContextType {
  // Wallet state
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | undefined;

  // Balance
  balance: string | undefined;
  balanceWei: bigint | undefined;
  refreshBalance: () => void;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  switchToSepolia: () => Promise<void>;

  // Status
  isMetaMaskInstalled: boolean;
  error: Error | null;
  clearError: () => void;

  // Backend sync
  isRegistered: boolean;
  registerWithBackend: () => Promise<boolean>;
}

// Create context with undefined default
const EthereumContext = createContext<EthereumContextType | null>(null);

// Create QueryClient outside component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

/**
 * Inner component that uses wagmi hooks (must be inside WagmiProvider)
 */
const EthereumContextInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Wagmi hooks
  const { address, isConnected, isConnecting, chainId } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    chainId, // Explicitly specify chainId to fetch balance from the connected chain (Sepolia)
    query: {
      enabled: !!address,
    },
  });

  // Local state
  const [error, setError] = useState<Error | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!(window as any).ethereum?.isMetaMask;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Connect wallet
  const connect = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      if (!isMetaMaskInstalled) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Find MetaMask connector
      const metaMaskConnector = connectors.find(
        (c) => c.id === 'metaMask' || c.name === 'MetaMask'
      );

      if (!metaMaskConnector) {
        throw new Error('MetaMask connector not found');
      }

      await connectAsync({ connector: metaMaskConnector });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect wallet');
      setError(error);
      throw error;
    }
  }, [connectAsync, connectors, isMetaMaskInstalled]);

  // Switch to Sepolia network
  const switchToSepolia = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error('MetaMask not found');

      const sepoliaChainId = '0xaa36a7'; // 11155111 in hex

      try {
        // Try to switch to Sepolia
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: sepoliaChainId }],
        });
      } catch (switchError: any) {
        // If Sepolia is not added, add it
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: sepoliaChainId,
              chainName: 'Sepolia Testnet',
              nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/demo'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          });
        } else {
          throw switchError;
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to switch network');
      setError(error);
      throw error;
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    try {
      setError(null);
      disconnectAsync();
      setIsRegistered(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to disconnect wallet');
      setError(error);
    }
  }, [disconnectAsync]);

  // Sign message
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      try {
        setError(null);

        if (!isConnected || !address) {
          throw new Error('Wallet not connected');
        }

        const signature = await signMessageAsync({ message });
        return signature;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to sign message');
        setError(error);
        throw error;
      }
    },
    [signMessageAsync, isConnected, address]
  );

  // Refresh balance
  const refreshBalance = useCallback(() => {
    if (address) {
      refetchBalance();
    }
  }, [address, refetchBalance]);

  // Register wallet with backend
  const registerWithBackend = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      if (!isConnected || !address) {
        throw new Error('Wallet not connected');
      }

      // Generate a challenge message for signing
      const challenge = `Sign this message to verify your wallet ownership.\nTimestamp: ${Date.now()}`;

      // Sign the challenge
      const signature = await signMessageAsync({ message: challenge });

      // Verify with backend
      const response = await apiFetch('/api/wallet/verify-wallet', {
        method: 'POST',
        body: JSON.stringify({
          public_key: address,
          challenge,
          signature,
        }),
      });

      if (response.ok) {
        setIsRegistered(true);
        console.log('[EthereumContext] Wallet registered with backend');
        return true;
      } else {
        throw new Error(response.error || 'Failed to register wallet with backend');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to register wallet');
      setError(error);
      console.error('[EthereumContext] Backend registration failed:', error);
      return false;
    }
  }, [isConnected, address, signMessageAsync]);

  // Check registration status when wallet connects
  useEffect(() => {
    if (!isConnected || !address) {
      setIsRegistered(false);
      return;
    }

    // Check if wallet is already registered
    const checkRegistration = async () => {
      try {
        const response = await apiFetch('/api/wallet');
        if (response.ok && response.data?.wallet) {
          const wallet = response.data.wallet;
          // Check if current address matches registered wallet
          if (wallet.public_key?.toLowerCase() === address.toLowerCase() && wallet.verified) {
            setIsRegistered(true);
            console.log('[EthereumContext] Wallet already registered');
          }
        }
      } catch (err) {
        console.warn('[EthereumContext] Failed to check wallet registration:', err);
      }
    };

    checkRegistration();
  }, [isConnected, address]);

  // Auto-prompt to switch to Sepolia if on wrong network
  useEffect(() => {
    if (isConnected && chainId && chainId !== 11155111) {
      console.log('[EthereumContext] Wrong network detected, prompting switch to Sepolia');
      switchToSepolia().catch(err => {
        console.error('Failed to switch to Sepolia:', err);
      });
    }
  }, [isConnected, chainId, switchToSepolia]);

  // Format balance
  const balance = useMemo(() => {
    if (!balanceData?.value) return undefined;
    return formatEther(balanceData.value);
  }, [balanceData?.value]);

  const balanceWei = useMemo(() => {
    return balanceData?.value;
  }, [balanceData?.value]);

  // Context value
  const value: EthereumContextType = useMemo(
    () => ({
      // Wallet state
      address,
      isConnected,
      isConnecting,
      chainId,

      // Balance
      balance,
      balanceWei,
      refreshBalance,

      // Actions
      connect,
      disconnect,
      signMessage,
      switchToSepolia,

      // Status
      isMetaMaskInstalled,
      error,
      clearError,

      // Backend sync
      isRegistered,
      registerWithBackend,
    }),
    [
      address,
      isConnected,
      isConnecting,
      chainId,
      balance,
      balanceWei,
      refreshBalance,
      connect,
      disconnect,
      signMessage,
      switchToSepolia,
      isMetaMaskInstalled,
      error,
      clearError,
      isRegistered,
      registerWithBackend,
    ]
  );

  return <EthereumContext.Provider value={value}>{children}</EthereumContext.Provider>;
};

/**
 * Ethereum Provider component that wraps children with wagmi and react-query providers
 */
export const EthereumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <EthereumContextInner>{children}</EthereumContextInner>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

/**
 * Hook to access the Ethereum context
 * @throws Error if used outside of EthereumProvider
 */
export const useEthereum = (): EthereumContextType => {
  const context = useContext(EthereumContext);
  if (!context) {
    throw new Error('useEthereum must be used within an EthereumProvider');
  }
  return context;
};
