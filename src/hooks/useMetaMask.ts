import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useChainId,
  useSignMessage,
} from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { formatEther } from 'viem';
import type { UseMetaMaskReturn, Address } from '../types/blockchain';

// Extend Window interface for MetaMask detection
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

/**
 * Custom hook for MetaMask wallet interactions
 * 
 * Provides a unified interface for connecting, disconnecting, and interacting
 * with MetaMask wallet using wagmi hooks.
 * 
 * @returns {UseMetaMaskReturn} Object containing wallet state and actions
 * 
 * @example
 * ```tsx
 * const { address, isConnected, connect, balance, signMessage } = useMetaMask();
 * 
 * if (!isConnected) {
 *   return <button onClick={connect}>Connect MetaMask</button>;
 * }
 * 
 * return <div>Connected: {address}, Balance: {balance} ETH</div>;
 * ```
 */
export function useMetaMask(): UseMetaMaskReturn {
  const [error, setError] = useState<Error | null>(null);

  // Connection state from wagmi
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();

  // Connect hook with MetaMask connector
  const {
    connectAsync,
    isPending: isConnectPending,
    error: connectError,
  } = useConnect();

  // Disconnect hook
  const { disconnect: wagmiDisconnect } = useDisconnect();

  // Balance hook - only fetch when connected
  const {
    data: balanceData,
    error: balanceError,
  } = useBalance({
    address: address as Address | undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  // Sign message hook
  const {
    signMessageAsync,
    error: signError,
  } = useSignMessage();

  // Aggregate errors
  useEffect(() => {
    const currentError = connectError || balanceError || signError;
    if (currentError) {
      setError(currentError instanceof Error ? currentError : new Error(String(currentError)));
    }
  }, [connectError, balanceError, signError]);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.ethereum?.isMetaMask);
  }, []);

  // Format balance to ETH string
  const balance = useMemo(() => {
    if (!balanceData) return undefined;
    return formatEther(balanceData.value);
  }, [balanceData]);

  // Balance in wei
  const balanceWei = useMemo(() => {
    return balanceData?.value;
  }, [balanceData]);

  /**
   * Connect to MetaMask wallet
   * @throws {Error} If MetaMask is not installed or connection fails
   */
  const connect = useCallback(async (): Promise<void> => {
    setError(null);

    if (!isMetaMaskInstalled) {
      const installError = new Error(
        'MetaMask is not installed. Please install MetaMask to continue.'
      );
      setError(installError);
      throw installError;
    }

    try {
      await connectAsync({
        connector: metaMask(),
      });
    } catch (err) {
      const connectionError = err instanceof Error 
        ? err 
        : new Error('Failed to connect to MetaMask');
      setError(connectionError);
      throw connectionError;
    }
  }, [connectAsync, isMetaMaskInstalled]);

  /**
   * Disconnect from MetaMask wallet
   */
  const disconnect = useCallback((): void => {
    setError(null);
    wagmiDisconnect();
  }, [wagmiDisconnect]);

  /**
   * Sign a message with the connected wallet
   * @param message - The message to sign
   * @returns The signature as a hex string
   * @throws {Error} If wallet is not connected or signing fails
   */
  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      setError(null);

      if (!isConnected || !address) {
        const notConnectedError = new Error(
          'Wallet not connected. Please connect your wallet first.'
        );
        setError(notConnectedError);
        throw notConnectedError;
      }

      try {
        const signature = await signMessageAsync({ 
          message,
          account: address,
        });
        return signature;
      } catch (err) {
        const signingError = err instanceof Error 
          ? err 
          : new Error('Failed to sign message');
        setError(signingError);
        throw signingError;
      }
    },
    [isConnected, address, signMessageAsync]
  );

  return {
    // Connection state
    address: address as Address | undefined,
    isConnected,
    isConnecting: isConnecting || isConnectPending,
    chainId,

    // Balance
    balance,
    balanceWei,

    // Actions
    connect,
    disconnect,

    // MetaMask detection
    isMetaMaskInstalled,

    // Error handling
    error,

    // Signing
    signMessage,
  };
}

// Re-export types for convenience
export type { UseMetaMaskReturn } from '../types/blockchain';
