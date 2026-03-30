import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useState, useCallback } from 'react';
import { getPublicClient } from '../lib/web3';

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

      // Poll for receipt using getTransactionReceipt (simple RPC call, not waitForTransactionReceipt)
      // This avoids potential stack overflow issues with viem's waitForTransactionReceipt
      const publicClient = getPublicClient();
      let confirmedReceipt = null;
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes with 1-second intervals

      while (!confirmedReceipt && attempts < maxAttempts) {
        try {
          const receipt = await publicClient.getTransactionReceipt({ 
            hash: txHash as `0x${string}`,
          });
          if (receipt) {
            confirmedReceipt = receipt;
            break;
          }
        } catch (e) {
          // getTransactionReceipt might fail before tx is in a block, that's normal
          console.debug('Receipt not yet available, retrying...', e);
        }
        
        // Wait 1 second before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!confirmedReceipt) {
        throw new Error('Transaction confirmation timeout after 2 minutes');
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
  }, [sendTransaction]);

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
