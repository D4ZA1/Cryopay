import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletConnect } from '../WalletConnect';

// Mock the useEthereum hook
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('@/context/EthereumContext', () => ({
  useEthereum: vi.fn(),
}));

import { useEthereum } from '@/context/EthereumContext';

const mockUseEthereum = useEthereum as ReturnType<typeof vi.fn>;

// Default mock state
const defaultMockState = {
  address: undefined,
  isConnected: false,
  isConnecting: false,
  connect: mockConnect,
  disconnect: mockDisconnect,
  balance: undefined,
  isMetaMaskInstalled: true,
  error: null,
};

describe('WalletConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEthereum.mockReturnValue(defaultMockState);
  });

  describe('Disconnected State', () => {
    it('shows connect button when disconnected', () => {
      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        isConnected: false,
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect />);

      expect(screen.getByRole('button', { name: /connect metamask/i })).toBeInTheDocument();
    });

    it('handles connect button click', async () => {
      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        isConnected: false,
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect />);

      const connectButton = screen.getByRole('button', { name: /connect metamask/i });
      fireEvent.click(connectButton);

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Connecting State', () => {
    it('shows connecting state with spinner', () => {
      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        isConnecting: true,
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect />);

      expect(screen.getByRole('button', { name: /connecting/i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Connected State', () => {
    const connectedState = {
      ...defaultMockState,
      address: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
      isConnected: true,
      balance: '1.234567890123456789',
      isMetaMaskInstalled: true,
    };

    it('shows connected state with formatted address and balance', () => {
      mockUseEthereum.mockReturnValue(connectedState);

      render(<WalletConnect />);

      // Address should be formatted as 0x1234...5678
      expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
      // Balance should be formatted to 4 decimal places
      expect(screen.getByText('1.2346 ETH')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });

    it('shows compact connected state', () => {
      mockUseEthereum.mockReturnValue(connectedState);

      render(<WalletConnect compact />);

      // Address should still be shown
      expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
      // In compact mode, balance is not shown and disconnect is icon-only
      expect(screen.queryByText(/ETH/)).not.toBeInTheDocument();
      // Should have disconnect button with title
      expect(screen.getByTitle('Disconnect wallet')).toBeInTheDocument();
    });

    it('handles disconnect button click', () => {
      mockUseEthereum.mockReturnValue(connectedState);

      render(<WalletConnect />);

      const disconnectButton = screen.getByRole('button', { name: /disconnect/i });
      fireEvent.click(disconnectButton);

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('handles disconnect button click in compact mode', () => {
      mockUseEthereum.mockReturnValue(connectedState);

      render(<WalletConnect compact />);

      const disconnectButton = screen.getByTitle('Disconnect wallet');
      fireEvent.click(disconnectButton);

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('MetaMask Not Installed', () => {
    it('shows MetaMask not installed message', () => {
      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        isMetaMaskInstalled: false,
      });

      render(<WalletConnect />);

      expect(screen.getByText('MetaMask not detected')).toBeInTheDocument();
      expect(screen.getByText(/install metamask to connect your wallet/i)).toBeInTheDocument();
      
      const installLink = screen.getByRole('link', { name: /install metamask/i });
      expect(installLink).toBeInTheDocument();
      expect(installLink).toHaveAttribute('href', 'https://metamask.io/download/');
      expect(installLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Error State', () => {
    it('shows error state with retry button', () => {
      const testError = new Error('Connection failed');
      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        error: testError,
        isConnected: false,
        isConnecting: false,
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect />);

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('calls connect on retry button click', () => {
      const testError = new Error('Connection failed');
      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        error: testError,
        isConnected: false,
        isConnecting: false,
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callbacks', () => {
    it('calls onConnected callback when connected', () => {
      const onConnected = vi.fn();
      const address = '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`;

      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        address,
        isConnected: true,
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect onConnected={onConnected} />);

      expect(onConnected).toHaveBeenCalledWith(address);
    });

    it('calls onDisconnected callback when disconnected', () => {
      const onDisconnected = vi.fn();

      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        isConnected: false,
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect onDisconnected={onDisconnected} />);

      expect(onDisconnected).toHaveBeenCalled();
    });

    it('calls onError callback when error occurs', () => {
      const onError = vi.fn();
      const testError = new Error('Test error');

      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        error: testError,
        isConnected: false,
        isConnecting: false,
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect onError={onError} />);

      expect(onError).toHaveBeenCalledWith(testError);
    });
  });

  describe('Balance Display', () => {
    it('shows balance when showBalance is true (default)', () => {
      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        address: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        isConnected: true,
        balance: '2.5',
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect />);

      expect(screen.getByText('2.5000 ETH')).toBeInTheDocument();
    });

    it('hides balance when showBalance is false', () => {
      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        address: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        isConnected: true,
        balance: '2.5',
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect showBalance={false} />);

      expect(screen.queryByText(/ETH/)).not.toBeInTheDocument();
    });

    it('shows 0.0000 when balance is null', () => {
      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        address: '0x1234567890abcdef1234567890abcdef12345678' as `0x${string}`,
        isConnected: true,
        balance: null,
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect />);

      expect(screen.getByText('0.0000 ETH')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className to disconnected state', () => {
      mockUseEthereum.mockReturnValue({
        ...defaultMockState,
        isConnected: false,
        isMetaMaskInstalled: true,
      });

      render(<WalletConnect className="custom-class" />);

      const button = screen.getByRole('button', { name: /connect metamask/i });
      expect(button).toHaveClass('custom-class');
    });
  });
});
