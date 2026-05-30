import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';
import { createPublicClient, type PublicClient } from 'viem';
import type { Chain } from 'viem/chains';

// Custom Hardhat localhost chain definition
export const hardhatLocal: Chain = {
  id: 31337,
  name: import.meta.env.VITE_ETHEREUM_NETWORK_NAME || 'Hardhat Local',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_ETHEREUM_RPC_URL || 'http://127.0.0.1:8545'],
    },
  },
  testnet: true,
};

// Custom Sepolia chain definition with environment RPC URL
export const sepoliaCustom: Chain = {
  ...sepolia,
  rpcUrls: {
    ...sepolia.rpcUrls,
    default: {
      http: [import.meta.env.VITE_ETHEREUM_RPC_URL || sepolia.rpcUrls.default.http[0]],
    },
  },
};

// Supported chains array
export const SUPPORTED_CHAINS = [hardhatLocal, sepoliaCustom, mainnet] as const;

// Locked contract address from environment
export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ||
  '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`;

// Chain ID from environment
export const CHAIN_ID = parseInt(
  import.meta.env.VITE_ETHEREUM_CHAIN_ID || '31337',
  10
);

// Validate contract address format
if (!/^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS)) {
  throw new Error(
    `Invalid contract address format: ${CONTRACT_ADDRESS}. Expected 0x-prefixed 40 character hex string.`
  );
}

// Wagmi configuration with MetaMask connector
export const config = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [metaMask()],
  transports: {
    [hardhatLocal.id]: http(import.meta.env.VITE_ETHEREUM_RPC_URL || 'http://127.0.0.1:8545'),
    [sepolia.id]: http(import.meta.env.VITE_ETHEREUM_RPC_URL || undefined),
    [mainnet.id]: http(),
  },
});

// Public client cache to avoid creating multiple instances
const publicClientCache = new Map<number, PublicClient>();

/**
 * Get a viem public client for a specific chain
 * @param chainId - The chain ID to get the client for (defaults to CHAIN_ID)
 * @returns A viem PublicClient instance
 * @throws Error if the chain is not supported
 */
export function getPublicClient(chainId: number = CHAIN_ID): PublicClient {
  // Check cache first
  const cached = publicClientCache.get(chainId);
  if (cached) {
    return cached;
  }

  // Find the chain configuration
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  if (!chain) {
    throw new Error(
      `Chain ID ${chainId} is not supported. Supported chains: ${SUPPORTED_CHAINS.map((c) => `${c.name} (${c.id})`).join(', ')}`
    );
  }

  // Create and cache the public client
  const client = createPublicClient({
    chain,
    transport: http(chain.rpcUrls.default.http[0]),
  });

  publicClientCache.set(chainId, client);
  return client;
}

/**
 * Check if a chain ID is supported by the application
 * @param chainId - The chain ID to check
 * @returns True if the chain is supported, false otherwise
 */
export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAINS.some((chain) => chain.id === chainId);
}

/**
 * Get the default chain for the application
 * @returns The chain matching CHAIN_ID, or hardhatLocal as fallback
 */
export function getDefaultChain(): Chain {
  return SUPPORTED_CHAINS.find((c) => c.id === CHAIN_ID) || hardhatLocal;
}

// Type exports for external use
export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]['id'];
