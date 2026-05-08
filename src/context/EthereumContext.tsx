/**
 * WalletContext — backend-managed wallet context
 * Replaces the old wagmi/MetaMask EthereumContext.
 * The user's Ethereum wallet is auto-generated server-side at registration.
 * The frontend only needs to display the wallet address and GRN token balance.
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';

interface WalletState {
  /** User's Ethereum address (from profile.public_key, set at registration) */
  address: string | null;
  /** GRN token balance */
  grnBalance: number;
  /** Whether wallet data has been loaded */
  isLoaded: boolean;
  /** Refresh wallet data from backend */
  refresh: () => Promise<void>;
  /** Error if wallet load failed */
  error: string | null;
}

const WalletContext = createContext<WalletState | null>(null);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [grnBalance, setGrnBalance] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);

      const [walletRes, balanceRes] = await Promise.all([
        apiFetch<{ wallet: { public_key: string } }>('/api/wallet'),
        apiFetch<{ balance: number }>('/api/recycle/balance'),
      ]);

      if (walletRes.ok && walletRes.data?.wallet?.public_key) {
        setAddress(walletRes.data.wallet.public_key);
      }

      if (balanceRes.ok && typeof balanceRes.data?.balance === 'number') {
        setGrnBalance(balanceRes.data.balance);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet');
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('cryopay_token');
    if (token) {
      refresh();
    } else {
      setIsLoaded(true);
    }
  }, [refresh]);

  return (
    <WalletContext.Provider value={{ address, grnBalance, isLoaded, refresh, error }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletState => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};

// Backward-compat alias so any file that still imports useEthereum doesn't break immediately
// TODO: Replace useEthereum usages with useWallet across the codebase
export const useEthereum = useWallet;
export const EthereumProvider = WalletProvider;
