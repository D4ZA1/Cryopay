/**
 * WalletConnect component — backend-managed wallet display
 * Shows the user's auto-generated Ethereum address and GRN balance.
 * No MetaMask, no browser extension required.
 */

import { useWallet } from '@/context/EthereumContext';
import { cn } from '@/lib/utils';
import { Wallet } from 'lucide-react';

interface WalletConnectProps {
  showBalance?: boolean;
  compact?: boolean;
  className?: string;
  // Legacy props kept for interface compat — no-ops
  onConnected?: (address: string) => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

export function WalletConnect({
  showBalance = true,
  compact = false,
  className,
}: WalletConnectProps) {
  const { address, grnBalance, isLoaded } = useWallet();

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!isLoaded) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg animate-pulse', className)}>
        <div className="w-2 h-2 bg-slate-300 rounded-full" />
        <span className="text-sm text-slate-400">Loading wallet...</span>
      </div>
    );
  }

  if (!address) return null;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg', className)}>
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="text-sm font-mono text-slate-700">{formatAddress(address)}</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200', className)}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Wallet className="w-6 h-6 text-slate-600" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-mono font-medium text-slate-800">
            {formatAddress(address)}
          </span>
          {showBalance && (
            <span className="text-xs text-slate-500">
              {grnBalance} GRN
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletConnect;
