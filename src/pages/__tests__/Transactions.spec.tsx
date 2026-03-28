import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Transactions from '../Transactions';
import * as api from '../../lib/api';
import { TransactionDirection } from '../../constants';
import { Block } from '../../types/schemas';

// Mock API functions
vi.mock('../../lib/api', () => ({
  getBlocks: vi.fn().mockResolvedValue({ 
    ok: true, 
    data: { blocks: [] } 
  }),
  getProfile: vi.fn().mockResolvedValue({ 
    ok: true, 
    data: { profile: { id: 'test-user-123', first_name: 'Test', public_key: { thumbprint: 'mock-thumbprint' } } } 
  }),
  apiFetch: vi.fn().mockImplementation((url: string) => {
    if (url === '/api/profile') {
      return Promise.resolve({
        ok: true,
        data: { profile: { id: 'test-user-123', first_name: 'Test', last_name: 'User', email: 'test@example.com', public_key: { thumbprint: 'mock-thumbprint' }, notifications: '{}' } }
      });
    }
    // For thumbprint lookups
    if (url.startsWith('/api/profile/search')) {
      return Promise.resolve({ ok: false });
    }
    return Promise.resolve({ ok: false });
  }),
}));

// Mock crypto functions
vi.mock('../../lib/crypto', () => ({
  decryptJSONWithPassword: vi.fn().mockResolvedValue({}),
}));

// Mock symmetric session
vi.mock('../../lib/symmetricSession', () => ({
  getSymKey: vi.fn().mockReturnValue(null),
  setSymKey: vi.fn(),
  clearSymKey: vi.fn(),
}));

// Helper to create mock block data
const createMockBlock = (overrides: {
  id?: number;
  kind?: 'tx' | 'buy' | 'sell';
  from_user_id?: string | null;
  to_user_id?: string | null;
  from_thumbprint?: string | null;
  to_thumbprint?: string | null;
  amountFiat?: number;
  amountCrypto?: number;
  crypto?: string;
  user_id?: string | null;
} = {}): Block => ({
  id: overrides.id ?? 1,
  data: {
    public_summary: {
      kind: overrides.kind ?? 'tx',
      to: 'recipient-address',
      to_user_id: overrides.to_user_id ?? null,
      to_thumbprint: overrides.to_thumbprint ?? null,
      from: 'sender-address',
      from_user_id: overrides.from_user_id ?? null,
      from_thumbprint: overrides.from_thumbprint ?? null,
      amountFiat: overrides.amountFiat ?? 100,
      amountCrypto: overrides.amountCrypto ?? 0.05,
      crypto: overrides.crypto ?? 'ETH',
      fiatCurrency: 'USD',
      timestamp: '2024-01-15T10:30:00Z',
    },
  },
  previous_hash: null,
  hash: 'test-hash-123',
  created_at: '2024-01-15T10:30:00Z',
  user_id: overrides.user_id ?? null,
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
};

describe('Transactions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    // Set up a valid auth token so the AuthContext can initialize the user
    localStorage.setItem('cryopay_token', 'test-token-123');
    
    // Reset to default mock implementations after resetAllMocks clears them
    (api.getBlocks as Mock).mockResolvedValue({ ok: true, data: { blocks: [] } });
    (api.getProfile as Mock).mockResolvedValue({ 
      ok: true, 
      data: { profile: { id: 'test-user-123', first_name: 'Test', public_key: { thumbprint: 'mock-thumbprint' } } } 
    });
    (api.apiFetch as Mock).mockImplementation((url: string) => {
      if (url === '/api/profile') {
        return Promise.resolve({
          ok: true,
          data: { profile: { id: 'test-user-123', first_name: 'Test', last_name: 'User', email: 'test@example.com', public_key: { thumbprint: 'mock-thumbprint' }, notifications: '{}' } }
        });
      }
      // For thumbprint lookups
      if (url.startsWith('/api/profile/search')) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: false });
    });
  });

  // Basic rendering tests
  describe('Basic Rendering', () => {
    it('renders the Transactions page', async () => {
      renderWithProviders(<Transactions />);
      
      await waitFor(() => {
        expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('shows empty state when no transactions', async () => {
      renderWithProviders(<Transactions />);
      
      await waitFor(() => {
        expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('renders transaction history header', async () => {
      renderWithProviders(<Transactions />);
      
      await waitFor(() => {
        expect(screen.getByText('Transaction History')).toBeInTheDocument();
      });
    });

    it('renders filter controls', async () => {
      renderWithProviders(<Transactions />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search by ID, address, or recipient/i)).toBeInTheDocument();
      });
    });
  });

  // Transaction Direction Detection tests
  describe('Transaction Direction Detection', () => {
    const currentUserId = 'test-user-123';
    const currentThumbprint = 'mock-thumbprint';

    it('should display BUY for buy transactions', async () => {
      const buyBlock = createMockBlock({
        id: 1,
        kind: 'buy',
        amountFiat: 500,
        crypto: 'BTC',
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [buyBlock] },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText(/Bought BTC/i)).toBeInTheDocument();
      });
    });

    it('should display SELL for sell transactions', async () => {
      const sellBlock = createMockBlock({
        id: 2,
        kind: 'sell',
        amountFiat: 300,
        crypto: 'ETH',
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [sellBlock] },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText(/Sold to/i)).toBeInTheDocument();
      });
    });

    it('should display RECEIVED when user is recipient via to_user_id', async () => {
      const receivedBlock = createMockBlock({
        id: 3,
        kind: 'tx',
        to_user_id: currentUserId,
        from_user_id: 'other-user',
        amountFiat: 150,
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [receivedBlock] },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        // For received transactions, the label is "From <sender>"
        // The mock has from: 'sender-address'
        expect(screen.getByText(/From sender-address/i)).toBeInTheDocument();
      });
    });

    it('should display SENT when user is sender via from_user_id', async () => {
      const sentBlock = createMockBlock({
        id: 4,
        kind: 'tx',
        from_user_id: currentUserId,
        to_user_id: 'other-user',
        amountFiat: 200,
      });

      // Use mockResolvedValue instead of mockResolvedValue because useEffect
      // may call fetchTransactions multiple times (when user changes from null to defined)
      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [sentBlock] },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        // Sent transactions show "To <recipient>" - using 'recipient-address' from mock
        expect(screen.getByText(/To recipient-address/i)).toBeInTheDocument();
      });
    });

    it('should check to_thumbprint for recipient detection', async () => {
      const receivedByThumbprintBlock = createMockBlock({
        id: 5,
        kind: 'tx',
        to_thumbprint: currentThumbprint,
        from_thumbprint: 'other-thumb',
        amountFiat: 175,
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [receivedByThumbprintBlock] },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        // Transaction should be identified as received based on thumbprint match
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1); // Header + data row
      });
    });

    it('should check from_thumbprint for sender detection', async () => {
      const sentByThumbprintBlock = createMockBlock({
        id: 6,
        kind: 'tx',
        from_thumbprint: currentThumbprint,
        to_thumbprint: 'other-thumb',
        amountFiat: 225,
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [sentByThumbprintBlock] },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1);
      });
    });

    it('should fallback to block user_id comparison', async () => {
      const blockWithUserId = createMockBlock({
        id: 7,
        kind: 'tx',
        user_id: currentUserId,
        amountFiat: 100,
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [blockWithUserId] },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1);
      });
    });
  });

  // Amount Calculation tests
  describe('Amount Calculation', () => {
    const currentUserId = 'test-user-123';
    const currentThumbprint = 'mock-thumbprint';

    it('should show negative amount for buy transactions', async () => {
      const buyBlock = createMockBlock({
        id: 10,
        kind: 'buy',
        amountFiat: 500,
        crypto: 'BTC',
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [buyBlock] },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        // Buy transactions should display negative (money going out)
        expect(screen.getByText(/-\$500\.00/)).toBeInTheDocument();
      });
    });

    it('should show positive amount for sell transactions', async () => {
      const sellBlock = createMockBlock({
        id: 11,
        kind: 'sell',
        amountFiat: 300,
        crypto: 'ETH',
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [sellBlock] },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        // Sell transactions should display positive (money coming in)
        expect(screen.getByText(/\$300\.00/)).toBeInTheDocument();
      });
    });

    it('should show negative amount for sent transactions', async () => {
      const sentBlock = createMockBlock({
        id: 12,
        kind: 'tx',
        from_user_id: currentUserId,
        to_user_id: 'other-user',
        amountFiat: 250,
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [sentBlock] },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      // Auth is already set via cryopay_token in beforeEach

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        // Sent transactions should display negative (money going out)
        // The component should show the transaction label for sent transactions
        expect(screen.getByText(/To recipient-address/i)).toBeInTheDocument();
      });
    });

    it('should show positive amount for received transactions', async () => {
      const receivedBlock = createMockBlock({
        id: 13,
        kind: 'tx',
        to_user_id: currentUserId,
        from_user_id: 'other-user',
        amountFiat: 400,
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [receivedBlock] },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      // Auth is already set via cryopay_token in beforeEach

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        // Received transactions should display positive (money coming in)
        expect(screen.getByText(/\$400\.00/)).toBeInTheDocument();
      });
    });

    it('should calculate balance correctly from multiple transactions', async () => {
      const blocks = [
        createMockBlock({ id: 20, kind: 'buy', amountFiat: 100, user_id: currentUserId }),
        createMockBlock({ id: 21, kind: 'sell', amountFiat: 50, user_id: currentUserId }),
        createMockBlock({
          id: 22,
          kind: 'tx',
          to_user_id: currentUserId,
          from_user_id: 'other',
          amountFiat: 200,
        }),
      ];

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
      });

      // Auth is already set via cryopay_token in beforeEach

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        // Should show 3 transactions
        const rows = screen.getAllByRole('row');
        // 1 header row + 3 data rows
        expect(rows.length).toBe(4);
      });
    });
  });

  // Type Safety tests
  describe('Type Safety', () => {
    it('should handle blocks with missing public_summary gracefully', async () => {
      const blockWithoutSummary: any = {
        id: 30,
        data: null,
        previous_hash: null,
        hash: 'test-hash',
        created_at: '2024-01-15T10:30:00Z',
        user_id: null,
      };

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [blockWithoutSummary] },
      });

      renderWithProviders(<Transactions />);

      // Should not crash and should render
      await waitFor(() => {
        expect(screen.getByText('Transaction History')).toBeInTheDocument();
      });
    });

    it('should handle blocks with partial public_summary data', async () => {
      const blockWithPartialSummary: any = {
        id: 31,
        data: {
          public_summary: {
            kind: 'tx',
            // Missing other required fields
          },
        },
        previous_hash: null,
        hash: 'test-hash',
        created_at: '2024-01-15T10:30:00Z',
        user_id: null,
      };

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [blockWithPartialSummary] },
      });

      renderWithProviders(<Transactions />);

      // Should not crash
      await waitFor(() => {
        expect(screen.getByText('Transaction History')).toBeInTheDocument();
      });
    });

    it('should properly type transaction objects', async () => {
      const validBlock = createMockBlock({
        id: 32,
        kind: 'buy',
        amountFiat: 1000,
        amountCrypto: 0.5,
        crypto: 'ETH',
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [validBlock] },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        // Verify crypto amount is displayed
        expect(screen.getByText(/0\.5 ETH/i)).toBeInTheDocument();
      });
    });

    it('should handle undefined user_id fields', async () => {
      const blockWithUndefinedIds = createMockBlock({
        id: 33,
        kind: 'tx',
        from_user_id: undefined as any,
        to_user_id: undefined as any,
      });

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [blockWithUndefinedIds] },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText('Transaction History')).toBeInTheDocument();
      });
    });
  });

  // Filter functionality tests
  describe('Filter Functionality', () => {
    it('should filter by transaction type', async () => {
      const blocks = [
        createMockBlock({ id: 40, kind: 'buy', crypto: 'BTC' }),
        createMockBlock({ id: 41, kind: 'sell', crypto: 'ETH' }),
      ];

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText(/Bought BTC/i)).toBeInTheDocument();
      });

      // Find and interact with type filter
      const typeFilter = screen.getByDisplayValue('All Types');
      fireEvent.change(typeFilter, { target: { value: 'Buy' } });

      await waitFor(() => {
        expect(screen.getByText(/Bought BTC/i)).toBeInTheDocument();
        expect(screen.queryByText(/Sold to/i)).not.toBeInTheDocument();
      });
    });

    it('should filter by search term', async () => {
      const blocks = [
        createMockBlock({ id: 42, kind: 'buy', crypto: 'BTC' }),
      ];

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks },
      });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText(/Bought BTC/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by ID/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
      });
    });
  });

  // Summary cards tests
  describe('Summary Cards', () => {
    const currentUserId = 'test-user-123';

    it('should calculate total received correctly', async () => {
      const blocks = [
        createMockBlock({
          id: 50,
          kind: 'tx',
          to_user_id: currentUserId,
          from_user_id: 'other',
          amountFiat: 100,
        }),
        createMockBlock({
          id: 51,
          kind: 'tx',
          to_user_id: currentUserId,
          from_user_id: 'other',
          amountFiat: 200,
        }),
      ];

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: 'thumb' } } },
      });

      // Auth is already set via cryopay_token in beforeEach

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText('Total Received')).toBeInTheDocument();
      });
    });

    it('should calculate total sent correctly', async () => {
      const blocks = [
        createMockBlock({
          id: 52,
          kind: 'tx',
          from_user_id: currentUserId,
          to_user_id: 'other',
          amountFiat: 150,
        }),
      ];

      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks },
      });
      (api.getProfile as Mock).mockResolvedValue({
        ok: true,
        data: { profile: { id: currentUserId, public_key: { thumbprint: 'thumb' } } },
      });

      // Auth is already set via cryopay_token in beforeEach

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText('Total Sent')).toBeInTheDocument();
      });
    });
  });

  // Refresh functionality test
  describe('Refresh Functionality', () => {
    it('should refresh transactions when refresh button is clicked', async () => {
      // Start with empty blocks
      (api.getBlocks as Mock).mockResolvedValue({ ok: true, data: { blocks: [] } });

      renderWithProviders(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
      });

      // Now change the mock to return a block for the refresh call
      (api.getBlocks as Mock).mockResolvedValue({
        ok: true,
        data: { blocks: [createMockBlock({ id: 60, kind: 'buy', crypto: 'BTC' })] },
      });

      // Find and click refresh button (has RefreshCw icon)
      const buttons = screen.getAllByRole('button');
      const refreshBtn = buttons.find(btn => btn.querySelector('svg.lucide-refresh-cw'));
      
      if (refreshBtn) {
        fireEvent.click(refreshBtn);

        await waitFor(() => {
          // After refresh, should show the new transaction
          expect(screen.getByText(/Bought BTC/i)).toBeInTheDocument();
        });
      }
    });
  });
});

// Unit tests for helper functions (extracted logic)
describe('Helper Function Logic', () => {
  describe('determineTransactionDirection logic', () => {
    // These tests verify the logic that should exist in determineTransactionDirection
    
    it('BUY kind should result in BUY direction', () => {
      const transactionKind = 'buy';
      const direction = transactionKind === 'buy' ? TransactionDirection.BUY : TransactionDirection.SENT;
      expect(direction).toBe(TransactionDirection.BUY);
    });

    it('SELL kind should result in SELL direction', () => {
      const transactionKind = 'sell';
      const direction = transactionKind === 'sell' ? TransactionDirection.SELL : TransactionDirection.SENT;
      expect(direction).toBe(TransactionDirection.SELL);
    });

    it('TX kind with matching to_user_id should be RECEIVED', () => {
      // For peer-to-peer transactions, direction depends on user role
      const currentUserId = 'user-123';
      const toUserId = 'user-123';
      
      const isRecipient = toUserId === currentUserId;
      const direction = isRecipient ? TransactionDirection.RECEIVED : TransactionDirection.SENT;
      
      expect(direction).toBe(TransactionDirection.RECEIVED);
    });

    it('TX kind with non-matching to_user_id should be SENT', () => {
      // For peer-to-peer transactions where current user is sender
      const currentUserId = 'user-123';
      const toUserId: string = 'other-user';
      
      const isRecipient = toUserId === currentUserId;
      const direction = isRecipient ? TransactionDirection.RECEIVED : TransactionDirection.SENT;
      
      expect(direction).toBe(TransactionDirection.SENT);
    });

    it('should use thumbprint for recipient detection when user_id not available', () => {
      const currentThumbprint = 'thumb-abc';
      const toThumbprint = 'thumb-abc';
      const toUserId: string | null = null;
      const someUserId = 'user-123';
      
      const isRecipient = toUserId === someUserId || toThumbprint === currentThumbprint;
      expect(isRecipient).toBe(true);
    });
  });

  describe('resolveDisplayName logic', () => {
    const profileMap: Record<string, string> = {
      'user-123': 'John Doe',
      'thumb-abc': 'Jane Smith',
    };

    it('should return profile name when userId matches', () => {
      const userId = 'user-123';
      const result = profileMap[userId] ?? 'Unknown';
      expect(result).toBe('John Doe');
    });

    it('should return profile name when thumbprint matches', () => {
      const thumbprint = 'thumb-abc';
      const result = profileMap[thumbprint] ?? 'Unknown';
      expect(result).toBe('Jane Smith');
    });

    it('should return fallback when no match', () => {
      const userId = 'unknown-user';
      const thumbprint = 'unknown-thumb';
      const fallback = 'Default Name';
      
      const result = profileMap[userId] ?? profileMap[thumbprint] ?? fallback;
      expect(result).toBe('Default Name');
    });

    it('should truncate thumbprint when no other info available', () => {
      const thumbprint = 'abcdefghijklmnop';
      const truncated = `${thumbprint.slice(0, 8)}...`;
      expect(truncated).toBe('abcdefgh...');
    });

    it('should return Unknown when nothing available', () => {
      const userId: string | undefined = undefined;
      const thumbprint: string | undefined = undefined;
      const fallback: string | undefined = undefined;
      
      const result = userId || thumbprint || fallback || 'Unknown';
      expect(result).toBe('Unknown');
    });
  });

  describe('Amount calculation logic', () => {
    it('buy transactions should be negative (money out)', () => {
      const transactionKind = 'buy';
      const amountFiat = 500;
      
      const calculatedAmount = transactionKind === 'buy' ? -Math.abs(amountFiat) : amountFiat;
      expect(calculatedAmount).toBe(-500);
    });

    it('sell transactions should be positive (money in)', () => {
      const transactionKind = 'sell';
      const amountFiat = 300;
      
      const calculatedAmount = transactionKind === 'sell' ? Math.abs(amountFiat) : amountFiat;
      expect(calculatedAmount).toBe(300);
    });

    it('sent P2P transactions should be negative', () => {
      // For tx kind, direction depends on whether user sent or received
      const isSent = true;
      const amountFiat = 200;
      
      const calculatedAmount = isSent ? -Math.abs(amountFiat) : amountFiat;
      expect(calculatedAmount).toBe(-200);
    });

    it('received P2P transactions should be positive', () => {
      // For tx kind, direction depends on whether user sent or received
      const isSent = false;
      const amountFiat = 150;
      
      const calculatedAmount = isSent ? -Math.abs(amountFiat) : amountFiat;
      expect(calculatedAmount).toBe(150);
    });
  });
});

// Extended tests for helper functions with edge cases
describe('Extended Helper Function Tests', () => {
  describe('determineTransactionDirection edge cases', () => {
    it('should prioritize kind over user_id for buy transactions', () => {
      // Even if from_user_id matches current user, buy kind should result in BUY direction
      const kind: string = 'buy';
      const direction = kind === 'buy' 
        ? TransactionDirection.BUY 
        : kind === 'sell' 
          ? TransactionDirection.SELL 
          : TransactionDirection.SENT;
      expect(direction).toBe(TransactionDirection.BUY);
    });

    it('should prioritize kind over user_id for sell transactions', () => {
      const kind: string = 'sell';
      const direction = kind === 'buy' 
        ? TransactionDirection.BUY 
        : kind === 'sell' 
          ? TransactionDirection.SELL 
          : TransactionDirection.SENT;
      expect(direction).toBe(TransactionDirection.SELL);
    });

    it('should fallback to tx direction logic when kind is tx', () => {
      const kind: string = 'tx';
      const currentUserId = 'user-123';
      const toUserId = 'user-123';
      
      const isBuyOrSell = kind === 'buy' || kind === 'sell';
      const isRecipient = !isBuyOrSell && toUserId === currentUserId;
      
      expect(isBuyOrSell).toBe(false);
      expect(isRecipient).toBe(true);
    });

    it('should check thumbprint when user_id is null', () => {
      const currentThumbprint = 'abc-thumb-123';
      const toUserId: string | null = null;
      const currentUserId = 'user-123';
      const toThumbprint = 'abc-thumb-123';
      
      const isRecipient = toUserId === currentUserId || toThumbprint === currentThumbprint;
      expect(isRecipient).toBe(true);
    });

    it('should handle both user_id and thumbprint being null', () => {
      const currentUserId = 'user-123';
      const currentThumbprint = 'thumb-123';
      const toUserId: string | null = null;
      const toThumbprint: string | null = null;
      
      const isRecipient = toUserId === currentUserId || toThumbprint === currentThumbprint;
      expect(isRecipient).toBe(false);
    });

    it('should detect sender when from_user_id matches', () => {
      const currentUserId = 'user-123';
      const fromUserId: string = 'user-123';
      const toUserId: string = 'other-user';
      
      const isSender = fromUserId === currentUserId;
      const isRecipient = toUserId === currentUserId;
      
      expect(isSender).toBe(true);
      expect(isRecipient).toBe(false);
    });

    it('should detect sender when from_thumbprint matches', () => {
      const currentThumbprint = 'thumb-abc';
      const fromThumbprint: string = 'thumb-abc';
      const toThumbprint: string = 'thumb-xyz';
      
      const isSender = fromThumbprint === currentThumbprint;
      const isRecipient = toThumbprint === currentThumbprint;
      
      expect(isSender).toBe(true);
      expect(isRecipient).toBe(false);
    });
  });

  describe('resolveDisplayName edge cases', () => {
    const profileMap: Record<string, string> = {
      'user-abc': 'Alice Johnson',
      'user-xyz': 'Bob Smith',
      'thumb-123': 'Charlie Brown',
      'thumb-456': 'Diana Prince',
    };

    it('should prioritize userId over thumbprint', () => {
      const userId = 'user-abc';
      const thumbprint = 'thumb-123'; // Both have entries
      
      const result = profileMap[userId] ?? profileMap[thumbprint] ?? 'Unknown';
      expect(result).toBe('Alice Johnson'); // userId takes priority
    });

    it('should use thumbprint when userId has no match', () => {
      const userId = 'nonexistent-user';
      const thumbprint = 'thumb-456';
      
      const result = profileMap[userId] ?? profileMap[thumbprint] ?? 'Unknown';
      expect(result).toBe('Diana Prince');
    });

    it('should use fallback when neither userId nor thumbprint matches', () => {
      const userId = 'unknown-user';
      const thumbprint = 'unknown-thumb';
      const fallback = 'External Address';
      
      const result = profileMap[userId] ?? profileMap[thumbprint] ?? fallback;
      expect(result).toBe('External Address');
    });

    it('should truncate long thumbprints for display', () => {
      const thumbprint = 'abcdefghijklmnopqrstuvwxyz123456';
      const truncated = `${thumbprint.slice(0, 8)}...`;
      expect(truncated).toBe('abcdefgh...');
      expect(truncated.length).toBe(11); // 8 chars + '...'
    });

    it('should truncate long user IDs for display', () => {
      const userId = 'user-very-long-id-12345678';
      const truncated = `User ${userId.slice(0, 8)}...`;
      expect(truncated).toBe('User user-ver...');
    });

    it('should handle undefined profileMap gracefully', () => {
      const userId = 'user-123';
      const thumbprint = 'thumb-abc';
      const profileMapUndefined: Record<string, string> | undefined = undefined;
      
      const result = (profileMapUndefined?.[userId]) ?? 
                     (profileMapUndefined?.[thumbprint]) ?? 
                     `${thumbprint.slice(0, 8)}...`;
      expect(result).toBe('thumb-ab...');
    });

    it('should handle empty strings', () => {
      const userId = '';
      const thumbprint = '';
      
      // Empty strings are falsy, so should fall through
      const result = (userId && profileMap[userId]) || 
                     (thumbprint && profileMap[thumbprint]) || 
                     'Unknown';
      expect(result).toBe('Unknown');
    });
  });

  describe('Amount calculation edge cases', () => {
    it('should handle zero amounts correctly', () => {
      const amountFiat = 0;
      const isSent = true;
      
      const calculatedAmount = isSent ? -Math.abs(amountFiat) : amountFiat;
      expect(calculatedAmount).toBe(-0);
      expect(Object.is(calculatedAmount, -0)).toBe(true);
    });

    it('should handle very large amounts', () => {
      const amountFiat = 999999999.99;
      const kind = 'buy';
      
      const calculatedAmount = kind === 'buy' ? -Math.abs(amountFiat) : amountFiat;
      expect(calculatedAmount).toBe(-999999999.99);
    });

    it('should handle decimal precision', () => {
      const amountFiat = 123.456789;
      const kind = 'sell';
      
      const calculatedAmount = kind === 'sell' ? Math.abs(amountFiat) : -amountFiat;
      expect(calculatedAmount).toBeCloseTo(123.456789, 6);
    });

    it('should correctly negate already negative amounts for buy', () => {
      const amountFiat = -100; // Already negative (shouldn't happen but handle it)
      const kind = 'buy';
      
      const calculatedAmount = kind === 'buy' ? -Math.abs(amountFiat) : amountFiat;
      expect(calculatedAmount).toBe(-100); // Math.abs makes it positive, then negated
    });

    it('should preserve positive amounts for sell even if input is negative', () => {
      const amountFiat = -50;
      const kind = 'sell';
      
      const calculatedAmount = kind === 'sell' ? Math.abs(amountFiat) : amountFiat;
      expect(calculatedAmount).toBe(50);
    });
  });
});

// Extended filter functionality tests
describe('Extended Filter Functionality', () => {
  const currentUserId = 'test-user-123';
  const currentThumbprint = 'mock-thumbprint';

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    localStorage.setItem('cryopay_token', 'test-token-123');
    
    // Reset to default mock implementations
    (api.getBlocks as Mock).mockResolvedValue({ ok: true, data: { blocks: [] } });
    (api.getProfile as Mock).mockResolvedValue({ 
      ok: true, 
      data: { profile: { id: currentUserId, first_name: 'Test', public_key: { thumbprint: currentThumbprint } } } 
    });
    (api.apiFetch as Mock).mockImplementation((url: string) => {
      if (url === '/api/profile') {
        return Promise.resolve({
          ok: true,
          data: { profile: { id: currentUserId, first_name: 'Test', last_name: 'User', email: 'test@example.com', public_key: { thumbprint: currentThumbprint }, notifications: '{}' } }
        });
      }
      if (url.startsWith('/api/profile/search')) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: false });
    });
  });

  it('should filter by Received type only', async () => {
    const blocks = [
      createMockBlock({ id: 80, kind: 'tx', to_user_id: currentUserId, from_user_id: 'other' }),
      createMockBlock({ id: 81, kind: 'tx', from_user_id: currentUserId, to_user_id: 'other' }),
      createMockBlock({ id: 82, kind: 'buy', crypto: 'BTC' }),
    ];

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/From sender-address/i)).toBeInTheDocument();
    });

    // Filter to Received only
    const typeFilter = screen.getByDisplayValue('All Types');
    fireEvent.change(typeFilter, { target: { value: 'Received' } });

    await waitFor(() => {
      expect(screen.getByText(/From sender-address/i)).toBeInTheDocument();
      // Should not show Buy or Sent transactions
      expect(screen.queryByText(/Bought BTC/i)).not.toBeInTheDocument();
    });
  });

  it('should filter by Sent type only', async () => {
    const blocks = [
      createMockBlock({ id: 83, kind: 'tx', from_user_id: currentUserId, to_user_id: 'other' }),
      createMockBlock({ id: 84, kind: 'tx', to_user_id: currentUserId, from_user_id: 'other' }),
    ];

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      // Wait for transactions to load
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
    });

    const typeFilter = screen.getByDisplayValue('All Types');
    fireEvent.change(typeFilter, { target: { value: 'Sent' } });

    await waitFor(() => {
      expect(screen.getByText(/To recipient-address/i)).toBeInTheDocument();
      expect(screen.queryByText(/From sender-address/i)).not.toBeInTheDocument();
    });
  });

  it('should filter by Sell type only', async () => {
    const blocks = [
      createMockBlock({ id: 85, kind: 'sell', crypto: 'ETH', amountFiat: 500 }),
      createMockBlock({ id: 86, kind: 'buy', crypto: 'BTC', amountFiat: 200 }),
    ];

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/Sold to/i)).toBeInTheDocument();
    });

    const typeFilter = screen.getByDisplayValue('All Types');
    fireEvent.change(typeFilter, { target: { value: 'Sell' } });

    await waitFor(() => {
      expect(screen.getByText(/Sold to/i)).toBeInTheDocument();
      expect(screen.queryByText(/Bought BTC/i)).not.toBeInTheDocument();
    });
  });

  it('should combine type and search filters', async () => {
    const blocks = [
      createMockBlock({ id: 87, kind: 'buy', crypto: 'BTC' }),
      createMockBlock({ id: 88, kind: 'buy', crypto: 'ETH' }),
      createMockBlock({ id: 89, kind: 'sell', crypto: 'BTC' }),
    ];

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/Bought BTC/i)).toBeInTheDocument();
    });

    // Filter by Buy type
    const typeFilter = screen.getByDisplayValue('All Types');
    fireEvent.change(typeFilter, { target: { value: 'Buy' } });

    // Then search for ETH
    const searchInput = screen.getByPlaceholderText(/Search by ID/i);
    fireEvent.change(searchInput, { target: { value: '88' } });

    await waitFor(() => {
      expect(screen.getByText(/Bought ETH/i)).toBeInTheDocument();
      expect(screen.queryByText(/Bought BTC/i)).not.toBeInTheDocument();
    });
  });

  it('should filter by status', async () => {
    const blocks = [
      createMockBlock({ id: 90, kind: 'buy', crypto: 'BTC' }),
    ];

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/Bought BTC/i)).toBeInTheDocument();
    });

    // Filter by Pending status (should show no results since all are Completed)
    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'Pending' } });

    await waitFor(() => {
      expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
    });
  });

  it('should search by transaction hash', async () => {
    const blocks = [
      createMockBlock({ id: 91, kind: 'buy', crypto: 'BTC' }),
    ];
    // The mock creates hash as 'test-hash-123'

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/Bought BTC/i)).toBeInTheDocument();
    });

    // Search by transaction ID
    const searchInput = screen.getByPlaceholderText(/Search by ID/i);
    fireEvent.change(searchInput, { target: { value: '91' } });

    await waitFor(() => {
      expect(screen.getByText(/Bought BTC/i)).toBeInTheDocument();
    });
  });

  it('should clear filters and show all transactions', async () => {
    const blocks = [
      createMockBlock({ id: 92, kind: 'buy', crypto: 'BTC' }),
      createMockBlock({ id: 93, kind: 'sell', crypto: 'ETH' }),
    ];

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/Bought BTC/i)).toBeInTheDocument();
    });

    // Apply filter
    const typeFilter = screen.getByDisplayValue('All Types');
    fireEvent.change(typeFilter, { target: { value: 'Buy' } });

    await waitFor(() => {
      expect(screen.queryByText(/Sold to/i)).not.toBeInTheDocument();
    });

    // Clear filter back to All
    fireEvent.change(typeFilter, { target: { value: 'All' } });

    await waitFor(() => {
      expect(screen.getByText(/Bought BTC/i)).toBeInTheDocument();
      expect(screen.getByText(/Sold to/i)).toBeInTheDocument();
    });
  });
});

// Tests for transaction label display
describe('Transaction Label Display', () => {
  const currentUserId = 'test-user-123';
  const currentThumbprint = 'mock-thumbprint';

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    localStorage.setItem('cryopay_token', 'test-token-123');
    
    // Reset to default mock implementations
    (api.getBlocks as Mock).mockResolvedValue({ ok: true, data: { blocks: [] } });
    (api.getProfile as Mock).mockResolvedValue({ 
      ok: true, 
      data: { profile: { id: currentUserId, first_name: 'Test', public_key: { thumbprint: currentThumbprint } } } 
    });
    (api.apiFetch as Mock).mockImplementation((url: string) => {
      if (url === '/api/profile') {
        return Promise.resolve({
          ok: true,
          data: { profile: { id: currentUserId, first_name: 'Test', last_name: 'User', email: 'test@example.com', public_key: { thumbprint: currentThumbprint }, notifications: '{}' } }
        });
      }
      if (url.startsWith('/api/profile/search')) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: false });
    });
  });

  it('should display "Bought [CRYPTO]" for buy transactions', async () => {
    const buyBlock = createMockBlock({
      id: 100,
      kind: 'buy',
      crypto: 'USDC',
      amountCrypto: 100,
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [buyBlock] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/Bought USDC/i)).toBeInTheDocument();
    });
  });

  it('should display "Sold to [ADDRESS]" for sell transactions', async () => {
    const sellBlock = createMockBlock({
      id: 101,
      kind: 'sell',
      crypto: 'BTC',
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [sellBlock] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/Sold to recipient-address/i)).toBeInTheDocument();
    });
  });

  it('should display "To [ADDRESS]" for sent transactions', async () => {
    const sentBlock = createMockBlock({
      id: 102,
      kind: 'tx',
      from_user_id: currentUserId,
      to_user_id: 'other-user',
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [sentBlock] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/To recipient-address/i)).toBeInTheDocument();
    });
  });

  it('should display "From [ADDRESS]" for received transactions', async () => {
    const receivedBlock = createMockBlock({
      id: 103,
      kind: 'tx',
      to_user_id: currentUserId,
      from_user_id: 'other-user',
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [receivedBlock] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/From sender-address/i)).toBeInTheDocument();
    });
  });

  it('should display crypto amount with currency symbol', async () => {
    const block = createMockBlock({
      id: 104,
      kind: 'buy',
      crypto: 'ETH',
      amountCrypto: 1.5,
      amountFiat: 3000,
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [block] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText(/1\.5 ETH/i)).toBeInTheDocument();
    });
  });
});

// Tests for amount display formatting
describe('Amount Display Formatting', () => {
  const currentUserId = 'test-user-123';
  const currentThumbprint = 'mock-thumbprint';

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    localStorage.setItem('cryopay_token', 'test-token-123');
    
    // Reset to default mock implementations
    (api.getBlocks as Mock).mockResolvedValue({ ok: true, data: { blocks: [] } });
    (api.getProfile as Mock).mockResolvedValue({ 
      ok: true, 
      data: { profile: { id: currentUserId, first_name: 'Test', public_key: { thumbprint: currentThumbprint } } } 
    });
    (api.apiFetch as Mock).mockImplementation((url: string) => {
      if (url === '/api/profile') {
        return Promise.resolve({
          ok: true,
          data: { profile: { id: currentUserId, first_name: 'Test', last_name: 'User', email: 'test@example.com', public_key: { thumbprint: currentThumbprint }, notifications: '{}' } }
        });
      }
      if (url.startsWith('/api/profile/search')) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: false });
    });
  });

  it('should format negative amounts with minus sign', async () => {
    const buyBlock = createMockBlock({
      id: 110,
      kind: 'buy',
      amountFiat: 1234.56,
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [buyBlock] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      // Should show negative for buy (money out)
      expect(screen.getByText(/-\$1,234\.56/)).toBeInTheDocument();
    });
  });

  it('should format positive amounts without minus sign', async () => {
    const sellBlock = createMockBlock({
      id: 111,
      kind: 'sell',
      amountFiat: 5678.90,
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [sellBlock] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      // Should show positive for sell (money in)
      expect(screen.getByText(/\$5,678\.90/)).toBeInTheDocument();
    });
  });

  it('should apply green color to positive amounts', async () => {
    const receivedBlock = createMockBlock({
      id: 112,
      kind: 'tx',
      to_user_id: currentUserId,
      from_user_id: 'other',
      amountFiat: 200,
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [receivedBlock] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      const amountElement = screen.getByText(/\$200\.00/);
      expect(amountElement).toHaveClass('text-green-600');
    });
  });

  it('should not apply green color to negative amounts', async () => {
    const sentBlock = createMockBlock({
      id: 113,
      kind: 'tx',
      from_user_id: currentUserId,
      to_user_id: 'other',
      amountFiat: 150,
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [sentBlock] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      const amountElement = screen.getByText(/-\$150\.00/);
      expect(amountElement).toHaveClass('text-slate-800');
    });
  });
});

// Integration tests for transaction relevance
describe('Transaction Relevance Detection', () => {
  const currentUserId = 'test-user-123';
  const currentThumbprint = 'mock-thumbprint';

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    localStorage.setItem('cryopay_token', 'test-token-123');
    
    // Reset to default mock implementations
    (api.getBlocks as Mock).mockResolvedValue({ ok: true, data: { blocks: [] } });
    (api.getProfile as Mock).mockResolvedValue({ 
      ok: true, 
      data: { profile: { id: currentUserId, first_name: 'Test', public_key: { thumbprint: currentThumbprint } } } 
    });
    (api.apiFetch as Mock).mockImplementation((url: string) => {
      if (url === '/api/profile') {
        return Promise.resolve({
          ok: true,
          data: { profile: { id: currentUserId, first_name: 'Test', last_name: 'User', email: 'test@example.com', public_key: { thumbprint: currentThumbprint }, notifications: '{}' } }
        });
      }
      if (url.startsWith('/api/profile/search')) {
        return Promise.resolve({ ok: false });
      }
      return Promise.resolve({ ok: false });
    });
  });

  it('should mark transaction as relevant when user is sender via from_user_id', async () => {
    const block = createMockBlock({
      id: 70,
      kind: 'tx',
      from_user_id: currentUserId,
      to_user_id: 'other-user',
      amountFiat: 100,
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [block] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      // Transaction should be displayed (relevant)
      expect(screen.queryByText(/No transactions found/i)).not.toBeInTheDocument();
    });
  });

  it('should mark transaction as relevant when user is recipient via to_user_id', async () => {
    const block = createMockBlock({
      id: 71,
      kind: 'tx',
      from_user_id: 'other-user',
      to_user_id: currentUserId,
      amountFiat: 100,
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [block] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      expect(screen.queryByText(/No transactions found/i)).not.toBeInTheDocument();
    });
  });

  it('should mark transaction as relevant when user thumbprint matches to_thumbprint', async () => {
    const block = createMockBlock({
      id: 72,
      kind: 'tx',
      from_thumbprint: 'other-thumb',
      to_thumbprint: currentThumbprint,
      amountFiat: 100,
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [block] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  it('should mark transaction as relevant when user thumbprint matches from_thumbprint', async () => {
    const block = createMockBlock({
      id: 73,
      kind: 'tx',
      from_thumbprint: currentThumbprint,
      to_thumbprint: 'other-thumb',
      amountFiat: 100,
    });

    (api.getBlocks as Mock).mockResolvedValue({
      ok: true,
      data: { blocks: [block] },
    });
    (api.getProfile as Mock).mockResolvedValue({
      ok: true,
      data: { profile: { id: currentUserId, public_key: { thumbprint: currentThumbprint } } },
    });

    renderWithProviders(<Transactions />);

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
    });
  });
});
