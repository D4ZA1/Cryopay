import { useState, useCallback } from 'react';
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  usePublicClient,
  useAccount,
} from 'wagmi';
import type { TransactionReceipt } from 'viem';
import type { TransactionHash, EthereumAddress } from '../types/blockchain';

// =============================================================================
// Types
// =============================================================================

/**
 * Parameters for sending an ETH transaction
 */
export interface SendTransactionParams {
  /** Recipient address */
  to: EthereumAddress;
  /** Amount to send in Wei */
  value: bigint;
  /** Optional transaction data (for contract calls) */
  data?: `0x${string}`;
}

/**
 * Gas estimation result
 */
export interface GasEstimate {
  /** Estimated gas limit */
  gasLimit: bigint;
  /** Gas limit with safety buffer (20% extra) */
  gasLimitWithBuffer: bigint;
}

/**
 * Return type for useEthereumTransaction hook
 */
export interface UseEthereumTransactionReturn {
  /** Send an ETH transaction */
  sendTransaction: (params: SendTransactionParams) => Promise<TransactionHash>;
  /** Whether transaction is being signed/sent */
  isPending: boolean;
  /** Whether waiting for transaction confirmation */
  isConfirming: boolean;
  /** Whether transaction is confirmed */
  isConfirmed: boolean;
  /** Transaction hash after sending */
  txHash: TransactionHash | undefined;
  /** Transaction receipt after confirmation */
  receipt: TransactionReceipt | undefined;
  /** Current error state */
  error: Error | null;
  /** Reset transaction state */
  reset: () => void;
  /** Wait for a specific transaction to be confirmed */
  waitForConfirmation: (
    hash: TransactionHash,
    confirmations?: number
  ) => Promise<TransactionReceipt>;
  /** Estimate gas for a transaction */
  estimateGas: (params: SendTransactionParams) => Promise<GasEstimate>;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Custom hook for sending ETH transactions via MetaMask
 *
 * Provides a unified interface for sending transactions, tracking confirmation
 * status, and handling errors using wagmi hooks.
 *
 * @returns {UseEthereumTransactionReturn} Object containing transaction state and actions
 *
 * @example
 * ```tsx
 * const {
 *   sendTransaction,
 *   isPending,
 *   isConfirming,
 *   isConfirmed,
 *   txHash,
 *   receipt,
 *   error,
 *   reset,
 * } = useEthereumTransaction();
 *
 * const handleSend = async () => {
 *   try {
 *     const hash = await sendTransaction({
 *       to: '0x742d35Cc6634C0532925a3b844Bc9e7595f9e3b8',
 *       value: parseEther('0.1'),
 *     });
 *     console.log('Transaction sent:', hash);
 *   } catch (err) {
 *     console.error('Transaction failed:', err);
 *   }
 * };
 *
 * if (isPending) return <div>Signing transaction...</div>;
 * if (isConfirming) return <div>Waiting for confirmation...</div>;
 * if (isConfirmed) return <div>Transaction confirmed! Hash: {txHash}</div>;
 * ```
 */
export function useEthereumTransaction(): UseEthereumTransactionReturn {
  const [txHash, setTxHash] = useState<TransactionHash | undefined>();
  const [error, setError] = useState<Error | null>(null);

  // Get public client for direct RPC calls
  const publicClient = usePublicClient();

  // Send transaction hook
  const {
    sendTransactionAsync,
    isPending,
    error: sendError,
    reset: resetSend,
  } = useSendTransaction();

  // Wait for transaction receipt hook
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  /**
   * Send an ETH transaction
   * @param params - Transaction parameters (to, value, data)
   * @returns The transaction hash
   * @throws {Error} If transaction fails to send
   */
  const sendTransaction = useCallback(
    async (params: SendTransactionParams): Promise<TransactionHash> => {
      setError(null);

      try {
        const hash = await sendTransactionAsync({
          to: params.to,
          value: params.value,
          data: params.data,
        });

        setTxHash(hash);
        return hash;
      } catch (err) {
        const txError =
          err instanceof Error ? err : new Error('Failed to send transaction');
        setError(txError);
        throw txError;
      }
    },
    [sendTransactionAsync]
  );

  /**
   * Wait for a transaction to be confirmed
   * @param hash - The transaction hash to wait for
   * @param confirmations - Number of confirmations to wait for (default: 1)
   * @returns The transaction receipt
   * @throws {Error} If waiting fails or transaction reverts
   */
  const waitForConfirmation = useCallback(
    async (
      hash: TransactionHash,
      confirmations: number = 1
    ): Promise<TransactionReceipt> => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      try {
        const txReceipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations,
        });

        // Check if transaction was successful
        if (txReceipt.status === 'reverted') {
          throw new Error('Transaction reverted');
        }

        return txReceipt;
      } catch (err) {
        const waitError =
          err instanceof Error
            ? err
            : new Error('Failed to wait for confirmation');
        setError(waitError);
        throw waitError;
      }
    },
    [publicClient]
  );

  /**
   * Estimate gas for a transaction
   * @param params - Transaction parameters (to, value, data)
   * @returns Gas estimate with buffer
   * @throws {Error} If gas estimation fails
   */
  const estimateGas = useCallback(
    async (params: SendTransactionParams): Promise<GasEstimate> => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      try {
        const gasLimit = await publicClient.estimateGas({
          to: params.to,
          value: params.value,
          data: params.data,
        });

        // Add 20% buffer for safety
        const gasLimitWithBuffer = (gasLimit * BigInt(120)) / BigInt(100);

        return {
          gasLimit,
          gasLimitWithBuffer,
        };
      } catch (err) {
        const gasError =
          err instanceof Error ? err : new Error('Failed to estimate gas');
        setError(gasError);
        throw gasError;
      }
    },
    [publicClient]
  );

  /**
   * Reset all transaction state
   */
  const reset = useCallback(() => {
    setTxHash(undefined);
    setError(null);
    resetSend();
  }, [resetSend]);

  // Aggregate errors from wagmi hooks
  const currentError = error || sendError || receiptError || null;

  return {
    // Transaction sending
    sendTransaction,

    // Transaction state
    isPending,
    isConfirming,
    isConfirmed,

    // Transaction result
    txHash,
    receipt,

    // Error handling
    error: currentError instanceof Error ? currentError : currentError ? new Error(String(currentError)) : null,
    reset,

    // Helpers
    waitForConfirmation,
    estimateGas,
  };
}

// Re-export types for convenience
export type { TransactionReceipt } from 'viem';
