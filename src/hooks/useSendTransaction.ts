import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useState, useCallback } from 'react';

/**
 * Hook for sending ETH transactions on-chain
 * Wraps wagmi's useSendTransaction with better error handling and status tracking
 */
export function useSendEth() {
  const { sendTransaction, data: hash, error: sendError, isPending: isSending } = useSendTransaction();
  const { data: receipt, isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({ 
    hash,
  });
  const [localError, setLocalError] = useState<string | null>(null);

  /**
   * Send ETH and wait for confirmation
   * @param to - Recipient Ethereum address
   * @param amount - Amount in ETH (e.g., "0.1")
   * @returns Object with transaction hash and receipt after confirmation
   */
  const sendEthAndWait = useCallback(async (to: string, amount: string): Promise<{
    hash: string;
    receipt: any;
  }> => {
    setLocalError(null);
    
    try {
      // Validate address format
      if (!to.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid Ethereum address format');
      }

      // Validate amount
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Invalid amount');
      }

      // Send transaction - this returns immediately
      const txHash = await new Promise<string>((resolve, reject) => {
        sendTransaction(
          {
            to: to as `0x${string}`,
            value: parseEther(amount),
          },
          {
            onSuccess: (hash) => {
              resolve(hash);
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });

      // Wait for receipt confirmation
      let confirmedReceipt: any = null;
      let retries = 0;
      const maxRetries = 120; // 2 minutes with 1-second checks
      
      while (retries < maxRetries) {
        if (receipt && receipt.blockNumber) {
          confirmedReceipt = receipt;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }

      if (!confirmedReceipt) {
        throw new Error('Transaction confirmation timeout');
      }

      return {
        hash: txHash,
        receipt: confirmedReceipt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setLocalError(errorMessage);
      throw error;
    }
  }, [sendTransaction, receipt]);

  /**
   * Send ETH to an address (returns hash immediately)
   * @param to - Recipient Ethereum address
   * @param amount - Amount in ETH (e.g., "0.1")
   * @returns Transaction hash or throws error
   */
  const sendEth = async (to: string, amount: string) => {
    setLocalError(null);
    
    try {
      // Validate address format
      if (!to.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid Ethereum address format');
      }

      // Validate amount
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Invalid amount');
      }

      // Send transaction
      const result = await sendTransaction({
        to: to as `0x${string}`,
        value: parseEther(amount),
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setLocalError(errorMessage);
      throw error;
    }
  };

  return {
    sendEth,
    sendEthAndWait,
    hash,
    receipt,
    isSending,
    isConfirming,
    isSuccess,
    error: sendError || receiptError || (localError ? new Error(localError) : null),
  };
}

/**
 * Hook for getting transaction details
 */
export function useTransactionStatus(hash?: `0x${string}`) {
  const { data: receipt, isLoading, isSuccess, error } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    receipt,
    isLoading,
    isSuccess,
    error,
    blockNumber: receipt?.blockNumber,
    gasUsed: receipt?.gasUsed,
    status: receipt?.status,
  };
}
