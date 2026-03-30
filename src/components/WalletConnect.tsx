import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useEthereum } from '@/context/EthereumContext';
import { LogOut, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// MetaMask SVG Icon (from SignUpNonCustodial.tsx)
const MetamaskIcon = () => (
  <svg width="24" height="24" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-label="MetaMask logo">
    <path fill="#E2761B" d="M136.23,127.31,104.75,95.83l-18.3,18.3,27.1,27.09,24.84,24.84,9.37-9.37-21.53-21.54Z"/>
    <path fill="#E4761B" d="M104.75,95.83,75.45,125.13l13.59,13.59,15.71-15.71Z"/>
    <path fill="#D96624" d="m136.23,127.31-4.1-12-11.67,11.67,15.77,4.1Z"/>
    <path fill="#E3761B" d="M211.43,84.45,190.89,63.91l-14.28,14.28,20.54,20.54Z"/>
    <path fill="#E3751A" d="M190.89,63.91,164.87,37.89,144.33,58.43l.35.35L124.14,79.32l12.09,4.1,27.1-27.09Z"/>
    <path fill="#E97319" d="m190.89,63.91-26.02-26.02-22.9,22.9,20.54,20.54,28.38-17.42Z"/>
    <path fill="#DF6C20" d="m144.33,58.43-.35-.35-19.84-19.84-24.15,24.15L89.28,73.1,75.45,84.45l38.64,38.64,12.09,4.1,27.1-27.09,20.54-20.54-22.39-1.1Z"/>
    <path fill="#CD5D22" d="M100,62.59,89.28,73.1l-13.83,11.35,13.59,13.59L124.14,73,123.8,72.65Z"/>
    <path fill="#C55823" d="m100,62.59-10.72,10.51,25.86-1.11Z"/>
    <path fill="#CC591F" d="M100,62.59,75.45,84.45l-20.54-20.54,22.9-22.9Z"/>
    <path fill="#F29322" d="m180.8,110.16-27.1,27.09-27.09,27.1,14.28,14.28,40.26-40.26Z"/>
    <path fill="#EFA220" d="m126.61,164.35,27.1-27.1,9.37-9.37L144.33,146Z"/>
    <path fill="#E8821E" d="M104.75,152.92l21.86,21.86,9.37-9.37-21.86-21.86-9.37,9.37Z"/>
    <path fill="#DA6B20" d="m126.61,164.35,4.1,12,11.67-11.67-15.77-4.1Z"/>
    <path fill="#EC8E1F" d="M44.57,84.45,65.11,63.91l14.28,14.28L59.05,98.53Z"/>
    <path fill="#E9881C" d="M65.11,63.91,91.13,37.89,111.67,58.43l-.35.35,20.54,20.54-12.09,4.1-38.64-38.64Z"/>
    <path fill="#EE8A1A" d="M65.11,63.91,91.13,37.89,114.07,60.8l-20.54,20.54-28.42-17.43Z"/>
    <path fill="#E1771D" d="M111.67,58.43,89.28,73.1,75.45,84.45,48.43,57.43l24.15-24.15,19.84,19.84.35.35,18.86,18.86-12.09,4.1-38.64-38.64Z"/>
  </svg>
);

interface WalletConnectProps {
  onConnected?: (address: string) => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  showBalance?: boolean;
  compact?: boolean;
  className?: string;
}

export function WalletConnect({
  onConnected,
  onDisconnected,
  onError,
  showBalance = true,
  compact = false,
  className,
}: WalletConnectProps) {
  const {
    address,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    balance,
    isMetaMaskInstalled,
    error,
  } = useEthereum();

  // Call callbacks when state changes
  useEffect(() => {
    if (isConnected && address && onConnected) {
      onConnected(address);
    }
  }, [isConnected, address, onConnected]);

  useEffect(() => {
    if (!isConnected && onDisconnected) {
      onDisconnected();
    }
  }, [isConnected, onDisconnected]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      // Error is handled via the context and onError callback
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      // Error is handled via the context and onError callback
    }
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = (bal: string | null | undefined) => {
    if (!bal) return '0.0000';
    const num = parseFloat(bal);
    return num.toFixed(4);
  };

  // MetaMask not installed state
  if (!isMetaMaskInstalled) {
    return (
      <div className={cn('text-center p-4 bg-slate-50 rounded-lg border border-slate-200', className)}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <p className="text-slate-700 font-medium">MetaMask not detected</p>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Install MetaMask to connect your wallet
        </p>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
        >
          Install MetaMask
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  // Error state
  if (error && !isConnecting && !isConnected) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
        <Button
          onClick={handleConnect}
          variant="outline"
          className="w-full"
        >
          <MetamaskIcon />
          <span className="ml-2">Try Again</span>
        </Button>
      </div>
    );
  }

  // Connecting state
  if (isConnecting) {
    return (
      <Button disabled className={cn('w-full', className)}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Connecting...
      </Button>
    );
  }

  // Connected state
  if (isConnected && address) {
    if (compact) {
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-mono text-slate-700">
              {formatAddress(address)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDisconnect}
            className="h-8 w-8 text-slate-500 hover:text-slate-700"
            title="Disconnect wallet"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className={cn('flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200', className)}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MetamaskIcon />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-mono font-medium text-slate-800">
              {formatAddress(address)}
            </span>
            {showBalance && (
              <span className="text-xs text-slate-500">
                {formatBalance(balance)} ETH
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="ml-auto text-slate-600 hover:text-slate-800"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Disconnect
        </Button>
      </div>
    );
  }

  // Disconnected state (default)
  return (
    <Button
      onClick={handleConnect}
      className={cn('w-full', className)}
      variant="outline"
    >
      <MetamaskIcon />
      <span className="ml-2">Connect MetaMask</span>
    </Button>
  );
}

export default WalletConnect;
