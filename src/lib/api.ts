import { parseApiError } from "@/utils/errorUtils";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;
  
interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('cryopay_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  Object.assign(headers, options.headers);

  try {
    const response = await fetch(`${WORKER_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const rawErr = await response.text();
      const errorMessage = parseApiError(rawErr);
      return { ok: false, error: errorMessage };
    }

    const data = await response.json();
    
    // Handle backend responses with 'success' field (like MetaMask endpoints)
    if ('success' in data) {
      if (data.success) {
        return { ok: true, data: data.data as T };
      } else {
        return { ok: false, error: data.error || data.message || 'Request failed' };
      }
    }
    
    return { ok: true, data: data as T };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function register(email: string, password: string, firstName: string, lastName?: string) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
  });
}

export async function login(email: string, password: string) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return apiFetch('/api/auth/logout', {
    method: 'POST',
  });
}

// Profile API
export async function getProfile() {
  return apiFetch('/api/profile');
}

export async function updateProfile(data: { first_name?: string; last_name?: string; phone?: string; notifications?: string }) {
  return apiFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function searchProfile(email: string) {
  return apiFetch(`/api/profile/search?email=${encodeURIComponent(email)}`);
}

// Wallet API
export async function getWallet() {
  return apiFetch('/api/wallet');
}

export async function verifyWallet(publicKey: string, challenge: string, signature: string) {
  return apiFetch('/api/wallet/verify-wallet', {
    method: 'POST',
    body: JSON.stringify({ public_key: publicKey, challenge, signature }),
  });
}

export async function saveWallet(publicKey: string, encryptedPrivateKey: string, verified: boolean = false) {
  console.log('[api.ts saveWallet] publicKey:', publicKey ? '(present)' : 'empty');
  console.log('[api.ts saveWallet] encryptedPrivateKey:', encryptedPrivateKey ? '(present)' : 'empty');
  console.log('[api.ts saveWallet] encryptedPrivateKey type:', typeof encryptedPrivateKey);
  console.log('[api.ts saveWallet] verified:', verified);
  return apiFetch('/api/wallet', {
    method: 'POST',
    body: JSON.stringify({ public_key: publicKey, encrypted_private_key: encryptedPrivateKey, verified }),
  });
}

// Blocks/Transactions API
export async function getBlocks() {
  return apiFetch('/api/blocks');
}

export async function getBlock(id: number) {
  return apiFetch(`/api/blocks/${id}`);
}

export async function createBlock(data: string, previousHash?: string | null) {
  return apiFetch('/api/blocks', {
    method: 'POST',
    body: JSON.stringify({ data, previous_hash: previousHash }),
  });
}

// Contacts API
export async function getContacts() {
  return apiFetch('/api/contacts');
}

export async function getContact(id: number) {
  return apiFetch(`/api/contacts/${id}`);
}

export async function createContact(data: { name: string; address: string; email?: string; label?: string; public_key?: string; contact_user_id?: string }) {
  return apiFetch('/api/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContact(id: number, data: { name?: string; address?: string; email?: string; label?: string; public_key?: string }) {
  return apiFetch(`/api/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteContact(id: number) {
  return apiFetch(`/api/contacts/${id}`, {
    method: 'DELETE',
  });
}

// OTP / Magic Link API
export async function sendOtp(email: string) {
  return apiFetch('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(email: string, token: string) {
  return apiFetch('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, token }),
  });
}

// Password change
export async function changePassword(password: string) {
  return apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// MFA status
export async function getMfaStatus() {
  return apiFetch('/api/auth/mfa-status');
}

export async function enableMfa() {
  return apiFetch('/api/auth/mfa-enable', {
    method: 'POST',
  });
}

export async function verifyMfa(code: string) {
  return apiFetch('/api/auth/mfa-verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function disableMfa(password: string) {
  return apiFetch('/api/auth/mfa-disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function loginWithMfa(email: string, password: string, mfaCode: string) {
  return apiFetch('/api/auth/mfa-login', {
    method: 'POST',
    body: JSON.stringify({ email, password, mfaCode }),
  });
}

// ============ MetaMask Authentication ============

/**
 * Register/login with MetaMask wallet
 */
export async function connectMetaMask(data: {
  address: string;
  signature: string;
  message: string;
  firstName?: string;
  lastName?: string;
}) {
  return apiFetch('/api/auth/metamask/connect', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Login with MetaMask (existing user)
 */
export async function loginMetaMask(data: {
  address: string;
  signature: string;
  message: string;
}) {
  return apiFetch('/api/auth/metamask-login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============ Ethereum API ============

/**
 * Get current gas prices
 */
export async function getGasPrice() {
  return apiFetch('/api/ethereum/gas-price');
}

/**
 * Get ETH balance for an address
 */
export async function getEthBalance(address: string) {
  return apiFetch(`/api/ethereum/balance/${address}`);
}

/**
 * Get contract ABI
 */
export async function getContractABI() {
  return apiFetch('/api/ethereum/contract-abi');
}

/**
 * Get contract address for current network
 */
export async function getContractAddress() {
  return apiFetch('/api/ethereum/contract-address');
}

/**
 * Get network info
 */
export async function getNetworkInfo() {
  return apiFetch('/api/ethereum/network');
}

/**
 * Check Ethereum connectivity health
 */
export async function checkEthereumHealth() {
  return apiFetch('/api/ethereum/health');
}

// ============ Blockchain Transactions ============

/**
 * Record a transaction on-chain
 */
export async function recordTransaction(data: {
  to: string;
  amount: string;
  currency: string;
  offChainTxHash: string;
  signature?: string;
}) {
  return apiFetch('/api/blockchain/record', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(txHash: string) {
  return apiFetch(`/api/blockchain/status/${txHash}`);
}

/**
 * Get user's blockchain transactions
 */
export async function getBlockchainTransactions(limit = 20, offset = 0) {
  return apiFetch(`/api/blockchain/transactions?limit=${limit}&offset=${offset}`);
}

/**
 * Get transactions from smart contract
 */
export async function getContractTransactions(limit = 10, offset = 0) {
  return apiFetch(`/api/blockchain/contract-transactions?limit=${limit}&offset=${offset}`);
}

/**
 * Sync transactions from blockchain
 */
export async function syncBlockchainTransactions() {
  return apiFetch('/api/blockchain/sync', {
    method: 'POST',
  });
}

/**
 * Get real transaction history from Etherscan
 */
export async function getTransactionHistory(limit = 20, page = 1) {
  return apiFetch(`/api/blockchain/history?limit=${limit}&page=${page}`);
}
