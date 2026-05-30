import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEthereumTransaction } from '../useEthereumTransaction';
import type { TransactionReceipt } from 'viem';
import type { EthereumAddress, TransactionHash } from '../../types/blockchain';

// =============================================================================
// Mocks
// =============================================================================

const mockSendTransactionAsync = vi.fn();
const mockResetSend = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();
const mockEstimateGas = vi.fn();

// Mock state that can be modified between tests
let mockSendTransactionState = {
  sendTransactionAsync: mockSendTransactionAsync,
  isPending: false,
  error: null as Error | null,
  reset: mockResetSend,
};

let mockWaitForReceiptState = {
  data: undefined as TransactionReceipt | undefined,
  isLoading: false,
  isSuccess: false,
  error: null as Error | null,
};

let mockPublicClient: {
  waitForTransactionReceipt: typeof mockWaitForTransactionReceipt;
  estimateGas: typeof mockEstimateGas;
} | undefined = {
  waitForTransactionReceipt: mockWaitForTransactionReceipt,
  estimateGas: mockEstimateGas,
};

vi.mock('wagmi', () => ({
  useSendTransaction: vi.fn(() => mockSendTransactionState),
  useWaitForTransactionReceipt: vi.fn(() => mockWaitForReceiptState),
  usePublicClient: vi.fn(() => mockPublicClient),
  useAccount: vi.fn(() => ({
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f9e3b8' as EthereumAddress,
  })),
}));

// =============================================================================
// Test Data
// =============================================================================

const TEST_ADDRESS: EthereumAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f9e3b8';
const TEST_TX_HASH: TransactionHash = '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b';
const TEST_VALUE = BigInt('1000000000000000000'); // 1 ETH in wei

const mockReceipt: TransactionReceipt = {
  blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  blockNumber: BigInt(12345678),
  contractAddress: null,
  cumulativeGasUsed: BigInt(21000),
  effectiveGasPrice: BigInt(20000000000),
  from: TEST_ADDRESS,
  gasUsed: BigInt(21000),
  logs: [],
  logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  status: 'success',
  to: TEST_ADDRESS,
  transactionHash: TEST_TX_HASH,
  transactionIndex: 0,
  type: 'eip1559',
};

// =============================================================================
// Tests
// =============================================================================

describe('useEthereumTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock state to defaults
    mockSendTransactionState = {
      sendTransactionAsync: mockSendTransactionAsync,
      isPending: false,
      error: null,
      reset: mockResetSend,
    };

    mockWaitForReceiptState = {
      data: undefined,
      isLoading: false,
      isSuccess: false,
      error: null,
    };

    mockPublicClient = {
      waitForTransactionReceipt: mockWaitForTransactionReceipt,
      estimateGas: mockEstimateGas,
    };
  });

  // ===========================================================================
  // Initial State Tests
  // ===========================================================================

  describe('initial state', () => {
    it('should return correct initial state with no pending transaction', () => {
      const { result } = renderHook(() => useEthereumTransaction());

      expect(result.current.isPending).toBe(false);
      expect(result.current.isConfirming).toBe(false);
      expect(result.current.isConfirmed).toBe(false);
      expect(result.current.txHash).toBeUndefined();
      expect(result.current.receipt).toBeUndefined();
      expect(result.current.error).toBeNull();
      expect(typeof result.current.sendTransaction).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.waitForConfirmation).toBe('function');
      expect(typeof result.current.estimateGas).toBe('function');
    });
  });

  // ===========================================================================
  // Send Transaction Tests
  // ===========================================================================

  describe('sendTransaction', () => {
    it('should successfully send a transaction and return hash', async () => {
      mockSendTransactionAsync.mockResolvedValue(TEST_TX_HASH);

      const { result } = renderHook(() => useEthereumTransaction());

      let hash: TransactionHash;
      await act(async () => {
        hash = await result.current.sendTransaction({
          to: TEST_ADDRESS,
          value: TEST_VALUE,
        });
      });

      expect(hash!).toBe(TEST_TX_HASH);
      expect(mockSendTransactionAsync).toHaveBeenCalledWith({
        to: TEST_ADDRESS,
        value: TEST_VALUE,
        data: undefined,
      });
      expect(result.current.txHash).toBe(TEST_TX_HASH);
    });

    it('should send transaction with optional data parameter', async () => {
      mockSendTransactionAsync.mockResolvedValue(TEST_TX_HASH);
      const testData = '0x1234abcd' as `0x${string}`;

      const { result } = renderHook(() => useEthereumTransaction());

      await act(async () => {
        await result.current.sendTransaction({
          to: TEST_ADDRESS,
          value: TEST_VALUE,
          data: testData,
        });
      });

      expect(mockSendTransactionAsync).toHaveBeenCalledWith({
        to: TEST_ADDRESS,
        value: TEST_VALUE,
        data: testData,
      });
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('error handling', () => {
    it('should handle transaction send error', async () => {
      const txError = new Error('User rejected transaction');
      mockSendTransactionAsync.mockRejectedValue(txError);

      const { result } = renderHook(() => useEthereumTransaction());

      await act(async () => {
        await expect(
          result.current.sendTransaction({
            to: TEST_ADDRESS,
            value: TEST_VALUE,
          })
        ).rejects.toThrow('User rejected transaction');
      });

      expect(result.current.error).toEqual(txError);
    });

    it('should convert non-Error objects to Error instances', async () => {
      mockSendTransactionAsync.mockRejectedValue('String error');

      const { result } = renderHook(() => useEthereumTransaction());

      await act(async () => {
        await expect(
          result.current.sendTransaction({
            to: TEST_ADDRESS,
            value: TEST_VALUE,
          })
        ).rejects.toThrow('Failed to send transaction');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Failed to send transaction');
    });

    it('should aggregate errors from wagmi hooks', () => {
      const wagmiError = new Error('Wagmi send error');
      mockSendTransactionState.error = wagmiError;

      const { result } = renderHook(() => useEthereumTransaction());

      expect(result.current.error).toEqual(wagmiError);
    });
  });

  // ===========================================================================
  // Reset Functionality Tests
  // ===========================================================================

  describe('reset', () => {
    it('should reset all transaction state', async () => {
      mockSendTransactionAsync.mockResolvedValue(TEST_TX_HASH);

      const { result } = renderHook(() => useEthereumTransaction());

      // First, send a transaction
      await act(async () => {
        await result.current.sendTransaction({
          to: TEST_ADDRESS,
          value: TEST_VALUE,
        });
      });

      expect(result.current.txHash).toBe(TEST_TX_HASH);

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.txHash).toBeUndefined();
      expect(result.current.error).toBeNull();
      expect(mockResetSend).toHaveBeenCalled();
    });

    it('should clear error state on reset', async () => {
      const txError = new Error('Transaction failed');
      mockSendTransactionAsync.mockRejectedValue(txError);

      const { result } = renderHook(() => useEthereumTransaction());

      // Trigger an error
      await act(async () => {
        try {
          await result.current.sendTransaction({
            to: TEST_ADDRESS,
            value: TEST_VALUE,
          });
        } catch {
          // Expected error
        }
      });

      expect(result.current.error).toEqual(txError);

      // Reset should clear the error
      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ===========================================================================
  // Wait for Confirmation Tests
  // ===========================================================================

  describe('waitForConfirmation', () => {
    it('should successfully wait for transaction confirmation', async () => {
      mockWaitForTransactionReceipt.mockResolvedValue(mockReceipt);

      const { result } = renderHook(() => useEthereumTransaction());

      let receipt: TransactionReceipt;
      await act(async () => {
        receipt = await result.current.waitForConfirmation(TEST_TX_HASH);
      });

      expect(receipt!).toEqual(mockReceipt);
      expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({
        hash: TEST_TX_HASH,
        confirmations: 1,
      });
    });

    it('should wait for specified number of confirmations', async () => {
      mockWaitForTransactionReceipt.mockResolvedValue(mockReceipt);

      const { result } = renderHook(() => useEthereumTransaction());

      await act(async () => {
        await result.current.waitForConfirmation(TEST_TX_HASH, 5);
      });

      expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({
        hash: TEST_TX_HASH,
        confirmations: 5,
      });
    });

    it('should throw error when transaction is reverted', async () => {
      const revertedReceipt: TransactionReceipt = {
        ...mockReceipt,
        status: 'reverted',
      };
      mockWaitForTransactionReceipt.mockResolvedValue(revertedReceipt);

      const { result } = renderHook(() => useEthereumTransaction());

      await act(async () => {
        await expect(
          result.current.waitForConfirmation(TEST_TX_HASH)
        ).rejects.toThrow('Transaction reverted');
      });

      expect(result.current.error?.message).toBe('Transaction reverted');
    });

    it('should throw error when public client is unavailable', async () => {
      mockPublicClient = undefined;

      const { result } = renderHook(() => useEthereumTransaction());

      await act(async () => {
        await expect(
          result.current.waitForConfirmation(TEST_TX_HASH)
        ).rejects.toThrow('Public client not available');
      });
    });

    it('should handle wait confirmation errors gracefully', async () => {
      const waitError = new Error('Network timeout');
      mockWaitForTransactionReceipt.mockRejectedValue(waitError);

      const { result } = renderHook(() => useEthereumTransaction());

      await act(async () => {
        await expect(
          result.current.waitForConfirmation(TEST_TX_HASH)
        ).rejects.toThrow('Network timeout');
      });

      expect(result.current.error).toEqual(waitError);
    });
  });

  // ===========================================================================
  // Gas Estimation Tests
  // ===========================================================================

  describe('estimateGas', () => {
    it('should estimate gas and return with buffer', async () => {
      const baseGas = BigInt(21000);
      mockEstimateGas.mockResolvedValue(baseGas);

      const { result } = renderHook(() => useEthereumTransaction());

      let estimate: { gasLimit: bigint; gasLimitWithBuffer: bigint };
      await act(async () => {
        estimate = await result.current.estimateGas({
          to: TEST_ADDRESS,
          value: TEST_VALUE,
        });
      });

      expect(estimate!.gasLimit).toBe(baseGas);
      // 20% buffer: 21000 * 120 / 100 = 25200
      expect(estimate!.gasLimitWithBuffer).toBe(BigInt(25200));
      expect(mockEstimateGas).toHaveBeenCalledWith({
        to: TEST_ADDRESS,
        value: TEST_VALUE,
        data: undefined,
      });
    });

    it('should include data in gas estimation when provided', async () => {
      mockEstimateGas.mockResolvedValue(BigInt(50000));
      const testData = '0xabcdef' as `0x${string}`;

      const { result } = renderHook(() => useEthereumTransaction());

      await act(async () => {
        await result.current.estimateGas({
          to: TEST_ADDRESS,
          value: TEST_VALUE,
          data: testData,
        });
      });

      expect(mockEstimateGas).toHaveBeenCalledWith({
        to: TEST_ADDRESS,
        value: TEST_VALUE,
        data: testData,
      });
    });

    it('should throw error when public client is unavailable', async () => {
      mockPublicClient = undefined;

      const { result } = renderHook(() => useEthereumTransaction());

      await act(async () => {
        await expect(
          result.current.estimateGas({
            to: TEST_ADDRESS,
            value: TEST_VALUE,
          })
        ).rejects.toThrow('Public client not available');
      });
    });

    it('should handle gas estimation errors', async () => {
      const gasError = new Error('Insufficient funds for gas');
      mockEstimateGas.mockRejectedValue(gasError);

      const { result } = renderHook(() => useEthereumTransaction());

      await act(async () => {
        await expect(
          result.current.estimateGas({
            to: TEST_ADDRESS,
            value: TEST_VALUE,
          })
        ).rejects.toThrow('Insufficient funds for gas');
      });

      expect(result.current.error).toEqual(gasError);
    });

    it('should convert non-Error gas estimation errors', async () => {
      mockEstimateGas.mockRejectedValue('Gas estimation failed');

      const { result } = renderHook(() => useEthereumTransaction());

      await act(async () => {
        await expect(
          result.current.estimateGas({
            to: TEST_ADDRESS,
            value: TEST_VALUE,
          })
        ).rejects.toThrow('Failed to estimate gas');
      });

      expect(result.current.error?.message).toBe('Failed to estimate gas');
    });
  });

  // ===========================================================================
  // Transaction State Tests
  // ===========================================================================

  describe('transaction state', () => {
    it('should reflect isPending from useSendTransaction', () => {
      mockSendTransactionState.isPending = true;

      const { result } = renderHook(() => useEthereumTransaction());

      expect(result.current.isPending).toBe(true);
    });

    it('should reflect isConfirming from useWaitForTransactionReceipt', () => {
      mockWaitForReceiptState.isLoading = true;

      const { result } = renderHook(() => useEthereumTransaction());

      expect(result.current.isConfirming).toBe(true);
    });

    it('should reflect isConfirmed and receipt from useWaitForTransactionReceipt', () => {
      mockWaitForReceiptState.data = mockReceipt;
      mockWaitForReceiptState.isSuccess = true;

      const { result } = renderHook(() => useEthereumTransaction());

      expect(result.current.isConfirmed).toBe(true);
      expect(result.current.receipt).toEqual(mockReceipt);
    });
  });
});
