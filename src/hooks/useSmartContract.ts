import { useCallback, useState, useMemo } from 'react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS } from '../lib/web3';
import type { EthereumAddress, TransactionHash } from '../types/blockchain';

// =============================================================================
// Contract ABI (subset needed for CryoPayTransactionRecorder interactions)
// =============================================================================

const CRYOPAY_CONTRACT_ABI = [
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'currency', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
      { indexed: false, internalType: 'bytes32', name: 'txHash', type: 'bytes32' },
    ],
    name: 'TransactionRecorded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'user', type: 'address' }],
    name: 'UserRegistered',
    type: 'event',
  },
  // Read functions
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getTransactionCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getTransactions',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'from', type: 'address' },
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'uint256', name: 'amount', type: 'uint256' },
          { internalType: 'string', name: 'currency', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
          { internalType: 'bytes32', name: 'txHash', type: 'bytes32' },
        ],
        internalType: 'struct CryoPayTransactionRecorder.Transaction[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'txHash', type: 'bytes32' }],
    name: 'isTransactionRecorded',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [],
    name: 'registerUser',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'currency', type: 'string' },
      { internalType: 'bytes32', name: 'offChainTxHash', type: 'bytes32' },
    ],
    name: 'recordTransaction',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// =============================================================================
// Types
// =============================================================================

/**
 * Transaction structure returned from the smart contract
 */
export interface ContractTransactionData {
  from: EthereumAddress;
  to: EthereumAddress;
  amount: bigint;
  currency: string;
  timestamp: bigint;
  txHash: `0x${string}`;
}

/**
 * Parameters for recording a transaction
 */
export interface RecordTransactionParams {
  to: EthereumAddress;
  amount: bigint;
  currency: string;
  offChainTxHash: `0x${string}`;
}

/**
 * Return type for useSmartContract hook
 */
export interface UseSmartContractReturn {
  /** Contract address */
  contractAddress: EthereumAddress;
  /** Whether contract is available (address is valid) */
  isContractAvailable: boolean;

  // Read functions (no gas required)
  /** Get transaction count for an address */
  getTransactionCount: (address: EthereumAddress) => Promise<bigint>;
  /** Get paginated transactions for an address */
  getTransactions: (
    address: EthereumAddress,
    offset: bigint,
    limit: bigint
  ) => Promise<ContractTransactionData[]>;
  /** Check if a transaction hash is already recorded */
  isTransactionRecorded: (txHash: `0x${string}`) => Promise<boolean>;

  // Write functions (requires gas)
  /** Register the current user's wallet */
  registerUser: () => Promise<TransactionHash>;
  /** Record a transaction on-chain */
  recordTransaction: (params: RecordTransactionParams) => Promise<TransactionHash>;

  // State
  /** Whether a write operation is pending */
  isPending: boolean;
  /** Current error state */
  error: Error | null;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for interacting with the CryoPayTransactionRecorder smart contract
 *
 * Provides methods for reading transaction data and writing new transactions
 * to the blockchain using wagmi v2 with viem.
 *
 * @returns {UseSmartContractReturn} Object containing contract methods and state
 *
 * @example
 * ```tsx
 * const {
 *   contractAddress,
 *   getTransactionCount,
 *   recordTransaction,
 *   isPending,
 *   error
 * } = useSmartContract();
 *
 * // Read transaction count
 * const count = await getTransactionCount(address);
 *
 * // Record a new transaction
 * const txHash = await recordTransaction({
 *   to: recipientAddress,
 *   amount: BigInt('1000000000000000000'),
 *   currency: 'ETH',
 *   offChainTxHash: '0x...',
 * });
 * ```
 */
export function useSmartContract(): UseSmartContractReturn {
  const [error, setError] = useState<Error | null>(null);

  // Get account and public client from wagmi
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();

  // Write contract hook
  const { writeContractAsync, isPending } = useWriteContract();

  // Check if contract address is valid
  const isContractAvailable = useMemo(() => {
    return /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);
  }, []);

  // =========================================================================
  // Read Functions
  // =========================================================================

  /**
   * Get the transaction count for a given address
   */
  const getTransactionCount = useCallback(
    async (address: EthereumAddress): Promise<bigint> => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      try {
        const count = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CRYOPAY_CONTRACT_ABI,
          functionName: 'getTransactionCount',
          args: [address],
        });
        return count;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get transaction count');
        setError(error);
        throw error;
      }
    },
    [publicClient]
  );

  /**
   * Get paginated transactions for a given address
   */
  const getTransactions = useCallback(
    async (
      address: EthereumAddress,
      offset: bigint,
      limit: bigint
    ): Promise<ContractTransactionData[]> => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      try {
        const transactions = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CRYOPAY_CONTRACT_ABI,
          functionName: 'getTransactions',
          args: [address, offset, limit],
        });

        // Map the raw contract data to our typed structure
        return transactions.map((tx) => ({
          from: tx.from as EthereumAddress,
          to: tx.to as EthereumAddress,
          amount: tx.amount,
          currency: tx.currency,
          timestamp: tx.timestamp,
          txHash: tx.txHash as `0x${string}`,
        }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get transactions');
        setError(error);
        throw error;
      }
    },
    [publicClient]
  );

  /**
   * Check if a transaction hash is already recorded on-chain
   */
  const isTransactionRecorded = useCallback(
    async (txHash: `0x${string}`): Promise<boolean> => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      try {
        const isRecorded = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CRYOPAY_CONTRACT_ABI,
          functionName: 'isTransactionRecorded',
          args: [txHash],
        });
        return isRecorded;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to check transaction status');
        setError(error);
        throw error;
      }
    },
    [publicClient]
  );

  // =========================================================================
  // Write Functions
  // =========================================================================

  /**
   * Register the current user's wallet on the smart contract
   */
  const registerUser = useCallback(async (): Promise<TransactionHash> => {
    if (!userAddress) {
      const err = new Error('Wallet not connected. Please connect your wallet first.');
      setError(err);
      throw err;
    }

    try {
      setError(null);
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CRYOPAY_CONTRACT_ABI,
        functionName: 'registerUser',
      });
      return hash as TransactionHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to register user');
      setError(error);
      throw error;
    }
  }, [userAddress, writeContractAsync]);

  /**
   * Record a transaction on the smart contract
   */
  const recordTransaction = useCallback(
    async (params: RecordTransactionParams): Promise<TransactionHash> => {
      if (!userAddress) {
        const err = new Error('Wallet not connected. Please connect your wallet first.');
        setError(err);
        throw err;
      }

      try {
        setError(null);
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: CRYOPAY_CONTRACT_ABI,
          functionName: 'recordTransaction',
          args: [params.to, params.amount, params.currency, params.offChainTxHash],
        });
        return hash as TransactionHash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to record transaction');
        setError(error);
        throw error;
      }
    },
    [userAddress, writeContractAsync]
  );

  return {
    // Contract state
    contractAddress: CONTRACT_ADDRESS,
    isContractAvailable,

    // Read functions
    getTransactionCount,
    getTransactions,
    isTransactionRecorded,

    // Write functions
    registerUser,
    recordTransaction,

    // State
    isPending,
    error,
  };
}
