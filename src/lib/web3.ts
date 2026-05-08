/**
 * Minimal chain config — used for read-only RPC calls only.
 * Wallet management has moved server-side. No wagmi, no MetaMask.
 */
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const RPC_URL = import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://rpc.sepolia.org';

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

export const CHAIN_ID = 11155111;
export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS || '') as `0x${string}`;
