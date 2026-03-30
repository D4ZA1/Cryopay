/**
 * Blockchain and Ethereum-related TypeScript types
 * Used for MetaMask integration and CryoPayTransactionRecorder contract interactions
 */

// =============================================================================
// Primitive Types
// =============================================================================

/**
 * Ethereum address type (0x + 40 hex chars)
 * Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f9e3b8
 */
export type EthereumAddress = `0x${string}`;

/**
 * Transaction hash type (0x + 64 hex chars)
 * Example: 0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b
 */
export type TransactionHash = `0x${string}`;

// =============================================================================
// Wallet Types
// =============================================================================

/**
 * MetaMask connection status
 */
export type WalletConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Connected wallet info
 */
export interface WalletInfo {
  address: EthereumAddress;
  chainId: number;
  isConnected: boolean;
  balance?: string;
  balanceFormatted?: string;
}

/**
 * Ethereum context state for React context/state management
 */
export interface EthereumState {
  wallet: WalletInfo | null;
  status: WalletConnectionStatus;
  error: string | null;
  isMetaMaskInstalled: boolean;
}

// =============================================================================
// MetaMask Authentication
// =============================================================================

/**
 * MetaMask connection request sent to backend
 */
export interface ConnectMetaMaskRequest {
  address: EthereumAddress;
  signature: string;
  message: string;
  nonce?: string;
}

/**
 * MetaMask connection response from backend
 */
export interface ConnectMetaMaskResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    ethereumAddress: EthereumAddress;
  };
  error?: string;
}

/**
 * Sign message request for wallet signature
 */
export interface SignMessageRequest {
  message: string;
  address: EthereumAddress;
}

// =============================================================================
// Transaction Types
// =============================================================================

/**
 * Transaction to record on-chain via CryoPayTransactionRecorder contract
 */
export interface RecordTransactionRequest {
  to: EthereumAddress;
  amount: string; // Wei as string
  currency: string;
  offChainTxHash: TransactionHash;
  signature?: string;
}

/**
 * Transaction status from backend database
 */
export interface BlockchainTransaction {
  id: number;
  userId: string;
  txHash: TransactionHash;
  fromAddress: EthereumAddress;
  toAddress: EthereumAddress;
  amountWei: string;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  confirmations?: number;
  gasUsed?: string;
  transactionFee?: string;
  createdAt: string;
  confirmedAt?: string;
}

/**
 * Contract transaction returned from smart contract queries
 */
export interface ContractTransaction {
  from: EthereumAddress;
  to: EthereumAddress;
  amount: string;
  currency: string;
  timestamp: string;
  txHash: TransactionHash;
}

/**
 * Transaction pagination for list queries
 */
export interface TransactionPagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

// =============================================================================
// Network & Gas Types
// =============================================================================

/**
 * Current gas price information
 */
export interface GasPrice {
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  timestamp: string;
}

/**
 * Account balance information
 */
export interface BalanceInfo {
  address: EthereumAddress;
  balanceWei: string;
  balanceEth: string;
  timestamp: string;
}

/**
 * Network configuration and status
 */
export interface NetworkInfo {
  network: string;
  chainId: number;
  configuredChainId: number;
  rpcUrl: string;
  blockNumber: string;
  timestamp: string;
}

// =============================================================================
// Hook Return Types
// =============================================================================

/**
 * Return type for useMetaMask hook
 */
export interface UseMetaMaskReturn {
  /** Connected wallet address */
  address: EthereumAddress | undefined;
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Whether connection is in progress */
  isConnecting: boolean;
  /** Current chain ID */
  chainId: number | undefined;
  /** ETH balance formatted as string */
  balance: string | undefined;
  /** ETH balance in wei */
  balanceWei: bigint | undefined;
  /** Connect to MetaMask */
  connect: () => Promise<void>;
  /** Disconnect from MetaMask */
  disconnect: () => void;
  /** Whether MetaMask is installed */
  isMetaMaskInstalled: boolean;
  /** Current error state */
  error: Error | null;
  /** Sign a message with connected wallet */
  signMessage: (message: string) => Promise<string>;
}

// =============================================================================
// Type Aliases for Convenience
// =============================================================================

/**
 * Alias for EthereumAddress for wagmi compatibility
 */
export type Address = EthereumAddress;

/**
 * Hex string type
 */
export type Hex = `0x${string}`;
