import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSmartContract } from '../useSmartContract'
import type { EthereumAddress } from '../../types/blockchain'

// =============================================================================
// Mocks
// =============================================================================

const MOCK_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const
const MOCK_USER_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f9e3b8' as EthereumAddress
const MOCK_TX_HASH = '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b' as `0x${string}`

// Mock web3 lib
vi.mock('../../lib/web3', () => ({
  CONTRACT_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
}))

// Mock wagmi hooks
const mockReadContract = vi.fn()
const mockWriteContractAsync = vi.fn()

vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: undefined,
  })),
  usePublicClient: vi.fn(() => ({
    readContract: mockReadContract,
  })),
  useWriteContract: vi.fn(() => ({
    writeContractAsync: mockWriteContractAsync,
    isPending: false,
  })),
}))

// Import mocked modules to modify their behavior in tests
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'

// =============================================================================
// Test Helpers
// =============================================================================

function mockUseAccount(overrides: Partial<ReturnType<typeof useAccount>> = {}) {
  ;(useAccount as Mock).mockReturnValue({
    address: undefined,
    ...overrides,
  })
}

function mockUsePublicClient(client: { readContract: typeof mockReadContract } | undefined) {
  ;(usePublicClient as Mock).mockReturnValue(client)
}

function mockUseWriteContract(overrides: Partial<ReturnType<typeof useWriteContract>> = {}) {
  ;(useWriteContract as Mock).mockReturnValue({
    writeContractAsync: mockWriteContractAsync,
    isPending: false,
    ...overrides,
  })
}

// =============================================================================
// Tests
// =============================================================================

describe('useSmartContract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadContract.mockReset()
    mockWriteContractAsync.mockReset()
    
    // Default mock implementations
    mockUseAccount({ address: undefined })
    mockUsePublicClient({ readContract: mockReadContract })
    mockUseWriteContract({ writeContractAsync: mockWriteContractAsync, isPending: false })
  })

  // ===========================================================================
  // Contract Address Availability
  // ===========================================================================

  describe('contract address availability', () => {
    it('should return contract address', () => {
      const { result } = renderHook(() => useSmartContract())
      
      expect(result.current.contractAddress).toBe(MOCK_CONTRACT_ADDRESS)
    })

    it('should indicate contract is available when address is valid', () => {
      const { result } = renderHook(() => useSmartContract())
      
      expect(result.current.isContractAvailable).toBe(true)
    })
  })

  // ===========================================================================
  // Get Transaction Count (Read)
  // ===========================================================================

  describe('getTransactionCount', () => {
    it('should return transaction count for an address', async () => {
      const expectedCount = BigInt(5)
      mockReadContract.mockResolvedValue(expectedCount)

      const { result } = renderHook(() => useSmartContract())
      
      let count: bigint | undefined
      await act(async () => {
        count = await result.current.getTransactionCount(MOCK_USER_ADDRESS)
      })

      expect(count).toBe(expectedCount)
      expect(mockReadContract).toHaveBeenCalledWith({
        address: MOCK_CONTRACT_ADDRESS,
        abi: expect.any(Array),
        functionName: 'getTransactionCount',
        args: [MOCK_USER_ADDRESS],
      })
    })

    it('should throw error when contract call fails', async () => {
      const contractError = new Error('Contract execution reverted')
      mockReadContract.mockRejectedValue(contractError)

      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.getTransactionCount(MOCK_USER_ADDRESS)
        })
      ).rejects.toThrow('Contract execution reverted')
    })
  })

  // ===========================================================================
  // Get Transactions Paginated (Read)
  // ===========================================================================

  describe('getTransactions', () => {
    it('should return paginated transactions for an address', async () => {
      const mockTransactions = [
        {
          from: MOCK_USER_ADDRESS,
          to: '0x1234567890123456789012345678901234567890' as `0x${string}`,
          amount: BigInt('1000000000000000000'),
          currency: 'ETH',
          timestamp: BigInt(1704067200),
          txHash: MOCK_TX_HASH,
        },
      ]
      mockReadContract.mockResolvedValue(mockTransactions)

      const { result } = renderHook(() => useSmartContract())
      
      let transactions: Awaited<ReturnType<typeof result.current.getTransactions>> | undefined
      await act(async () => {
        transactions = await result.current.getTransactions(MOCK_USER_ADDRESS, BigInt(0), BigInt(10))
      })

      expect(transactions).toHaveLength(1)
      expect(transactions![0]).toEqual({
        from: MOCK_USER_ADDRESS,
        to: '0x1234567890123456789012345678901234567890',
        amount: BigInt('1000000000000000000'),
        currency: 'ETH',
        timestamp: BigInt(1704067200),
        txHash: MOCK_TX_HASH,
      })
      expect(mockReadContract).toHaveBeenCalledWith({
        address: MOCK_CONTRACT_ADDRESS,
        abi: expect.any(Array),
        functionName: 'getTransactions',
        args: [MOCK_USER_ADDRESS, BigInt(0), BigInt(10)],
      })
    })

    it('should return empty array when no transactions exist', async () => {
      mockReadContract.mockResolvedValue([])

      const { result } = renderHook(() => useSmartContract())
      
      let transactions: Awaited<ReturnType<typeof result.current.getTransactions>> | undefined
      await act(async () => {
        transactions = await result.current.getTransactions(MOCK_USER_ADDRESS, BigInt(0), BigInt(10))
      })

      expect(transactions).toEqual([])
    })

    it('should throw error when getting transactions fails', async () => {
      mockReadContract.mockRejectedValue(new Error('Failed to fetch transactions'))

      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.getTransactions(MOCK_USER_ADDRESS, BigInt(0), BigInt(10))
        })
      ).rejects.toThrow('Failed to fetch transactions')
    })
  })

  // ===========================================================================
  // Check If Transaction Is Recorded (Read)
  // ===========================================================================

  describe('isTransactionRecorded', () => {
    it('should return true when transaction is recorded', async () => {
      mockReadContract.mockResolvedValue(true)

      const { result } = renderHook(() => useSmartContract())
      
      let isRecorded: boolean | undefined
      await act(async () => {
        isRecorded = await result.current.isTransactionRecorded(MOCK_TX_HASH)
      })

      expect(isRecorded).toBe(true)
      expect(mockReadContract).toHaveBeenCalledWith({
        address: MOCK_CONTRACT_ADDRESS,
        abi: expect.any(Array),
        functionName: 'isTransactionRecorded',
        args: [MOCK_TX_HASH],
      })
    })

    it('should return false when transaction is not recorded', async () => {
      mockReadContract.mockResolvedValue(false)

      const { result } = renderHook(() => useSmartContract())
      
      let isRecorded: boolean | undefined
      await act(async () => {
        isRecorded = await result.current.isTransactionRecorded(MOCK_TX_HASH)
      })

      expect(isRecorded).toBe(false)
    })

    it('should throw error when checking transaction status fails', async () => {
      mockReadContract.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.isTransactionRecorded(MOCK_TX_HASH)
        })
      ).rejects.toThrow('Network error')
    })
  })

  // ===========================================================================
  // Read Function Error When Public Client Unavailable
  // ===========================================================================

  describe('read function error when public client unavailable', () => {
    beforeEach(() => {
      mockUsePublicClient(undefined)
    })

    it('should throw error when getting transaction count without public client', async () => {
      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.getTransactionCount(MOCK_USER_ADDRESS)
        })
      ).rejects.toThrow('Public client not available')
    })

    it('should throw error when getting transactions without public client', async () => {
      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.getTransactions(MOCK_USER_ADDRESS, BigInt(0), BigInt(10))
        })
      ).rejects.toThrow('Public client not available')
    })

    it('should throw error when checking transaction recorded without public client', async () => {
      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.isTransactionRecorded(MOCK_TX_HASH)
        })
      ).rejects.toThrow('Public client not available')
    })
  })

  // ===========================================================================
  // Register User (Write)
  // ===========================================================================

  describe('registerUser', () => {
    it('should register user when wallet is connected', async () => {
      const expectedTxHash = '0xabc123' as `0x${string}`
      mockUseAccount({ address: MOCK_USER_ADDRESS })
      mockWriteContractAsync.mockResolvedValue(expectedTxHash)

      const { result } = renderHook(() => useSmartContract())
      
      let txHash: `0x${string}` | undefined
      await act(async () => {
        txHash = await result.current.registerUser()
      })

      expect(txHash).toBe(expectedTxHash)
      expect(mockWriteContractAsync).toHaveBeenCalledWith({
        address: MOCK_CONTRACT_ADDRESS,
        abi: expect.any(Array),
        functionName: 'registerUser',
      })
    })

    it('should throw error when wallet is not connected', async () => {
      mockUseAccount({ address: undefined })

      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.registerUser()
        })
      ).rejects.toThrow('Wallet not connected. Please connect your wallet first.')
    })

    it('should throw error when contract write fails', async () => {
      mockUseAccount({ address: MOCK_USER_ADDRESS })
      mockWriteContractAsync.mockRejectedValue(new Error('User rejected transaction'))

      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.registerUser()
        })
      ).rejects.toThrow('User rejected transaction')
    })
  })

  // ===========================================================================
  // Record Transaction (Write)
  // ===========================================================================

  describe('recordTransaction', () => {
    const recordTransactionParams = {
      to: '0x1234567890123456789012345678901234567890' as EthereumAddress,
      amount: BigInt('1000000000000000000'),
      currency: 'ETH',
      offChainTxHash: MOCK_TX_HASH,
    }

    it('should record transaction when wallet is connected', async () => {
      const expectedTxHash = '0xdef456' as `0x${string}`
      mockUseAccount({ address: MOCK_USER_ADDRESS })
      mockWriteContractAsync.mockResolvedValue(expectedTxHash)

      const { result } = renderHook(() => useSmartContract())
      
      let txHash: `0x${string}` | undefined
      await act(async () => {
        txHash = await result.current.recordTransaction(recordTransactionParams)
      })

      expect(txHash).toBe(expectedTxHash)
      expect(mockWriteContractAsync).toHaveBeenCalledWith({
        address: MOCK_CONTRACT_ADDRESS,
        abi: expect.any(Array),
        functionName: 'recordTransaction',
        args: [
          recordTransactionParams.to,
          recordTransactionParams.amount,
          recordTransactionParams.currency,
          recordTransactionParams.offChainTxHash,
        ],
      })
    })

    it('should throw error when wallet is not connected', async () => {
      mockUseAccount({ address: undefined })

      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.recordTransaction(recordTransactionParams)
        })
      ).rejects.toThrow('Wallet not connected. Please connect your wallet first.')
    })

    it('should throw error when recording transaction fails', async () => {
      mockUseAccount({ address: MOCK_USER_ADDRESS })
      mockWriteContractAsync.mockRejectedValue(new Error('Insufficient gas'))

      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.recordTransaction(recordTransactionParams)
        })
      ).rejects.toThrow('Insufficient gas')
    })
  })

  // ===========================================================================
  // Write Function Error When Wallet Not Connected
  // ===========================================================================

  describe('write function error when wallet not connected', () => {
    beforeEach(() => {
      mockUseAccount({ address: undefined })
    })

    it('should throw wallet not connected error when registerUser called without wallet', async () => {
      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.registerUser()
        })
      ).rejects.toThrow('Wallet not connected. Please connect your wallet first.')
    })

    it('should throw wallet not connected error when recordTransaction called without wallet', async () => {
      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.recordTransaction({
            to: '0x1234567890123456789012345678901234567890' as EthereumAddress,
            amount: BigInt('1000000000000000000'),
            currency: 'ETH',
            offChainTxHash: MOCK_TX_HASH,
          })
        })
      ).rejects.toThrow('Wallet not connected. Please connect your wallet first.')
    })
  })

  // ===========================================================================
  // isPending State During Write Operations
  // ===========================================================================

  describe('isPending state during write operations', () => {
    it('should reflect isPending state from useWriteContract', () => {
      mockUseWriteContract({ writeContractAsync: mockWriteContractAsync, isPending: true })

      const { result } = renderHook(() => useSmartContract())
      
      expect(result.current.isPending).toBe(true)
    })

    it('should be false when no write operation is pending', () => {
      mockUseWriteContract({ writeContractAsync: mockWriteContractAsync, isPending: false })

      const { result } = renderHook(() => useSmartContract())
      
      expect(result.current.isPending).toBe(false)
    })

    it('should update isPending when write contract state changes', () => {
      mockUseWriteContract({ writeContractAsync: mockWriteContractAsync, isPending: false })

      const { result, rerender } = renderHook(() => useSmartContract())
      
      expect(result.current.isPending).toBe(false)

      // Simulate pending state change
      mockUseWriteContract({ writeContractAsync: mockWriteContractAsync, isPending: true })
      rerender()

      expect(result.current.isPending).toBe(true)
    })
  })

  // ===========================================================================
  // Error State
  // ===========================================================================

  describe('error state', () => {
    it('should initially have null error state', () => {
      const { result } = renderHook(() => useSmartContract())
      
      expect(result.current.error).toBeNull()
    })

    it('should throw and propagate read operation error', async () => {
      mockReadContract.mockRejectedValue(new Error('Read failed'))

      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.getTransactionCount(MOCK_USER_ADDRESS)
        })
      ).rejects.toThrow('Read failed')
    })

    it('should throw and propagate write operation error', async () => {
      mockUseAccount({ address: MOCK_USER_ADDRESS })
      mockWriteContractAsync.mockRejectedValue(new Error('Write failed'))

      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.registerUser()
        })
      ).rejects.toThrow('Write failed')
    })

    it('should wrap non-Error objects in Error for read operations', async () => {
      mockReadContract.mockRejectedValue('String error')

      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.getTransactionCount(MOCK_USER_ADDRESS)
        })
      ).rejects.toThrow('Failed to get transaction count')
    })

    it('should wrap non-Error objects in Error for write operations', async () => {
      mockUseAccount({ address: MOCK_USER_ADDRESS })
      mockWriteContractAsync.mockRejectedValue('String error')

      const { result } = renderHook(() => useSmartContract())
      
      await expect(
        act(async () => {
          await result.current.registerUser()
        })
      ).rejects.toThrow('Failed to register user')
    })
  })
})
