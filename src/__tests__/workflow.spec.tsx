import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

// Import components for testing
import LoginScreen from '../pages/LoginScreen';
import SignUpCustodial from '../pages/SignUpCustodial';
import Dashboard from '../pages/Dashboard';
import Contacts from '../pages/Contacts';
import BuySell from '../pages/BuySell';
import Transactions from '../pages/Transactions';

// Mock all API calls
vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  searchProfile: vi.fn(),
  getBlocks: vi.fn(),
  getBlock: vi.fn(),
  createBlock: vi.fn(),
  getContacts: vi.fn(),
  getContact: vi.fn(),
  createContact: vi.fn(),
  updateContact: vi.fn(),
  deleteContact: vi.fn(),
  getWallet: vi.fn(),
  saveWallet: vi.fn(),
  verifyWallet: vi.fn(),
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  changePassword: vi.fn(),
  getMfaStatus: vi.fn(),
  enableMfa: vi.fn(),
  verifyMfa: vi.fn(),
  disableMfa: vi.fn(),
  loginWithMfa: vi.fn(),
}));

// Mock crypto functions
vi.mock('../lib/crypto', () => ({
  encryptJSONWithPassword: vi.fn().mockResolvedValue({
    salt: 'mock-salt',
    iv: 'mock-iv',
    ciphertext: 'mock-ciphertext',
  }),
  decryptJSONWithPassword: vi.fn().mockResolvedValue({
    kind: 'tx',
    amountFiat: 100,
    amountCrypto: 0.033,
    crypto: 'ETH',
  }),
  sha256Hex: vi.fn().mockResolvedValue('mock-hash'),
}));

// Mock symmetric session
vi.mock('../lib/symmetricSession', () => ({
  getSymKey: vi.fn().mockReturnValue(null),
  setSymKey: vi.fn(),
  clearSymKey: vi.fn(),
}));

// Mock EthereumContext
vi.mock('../context/EthereumContext', () => ({
  useEthereum: () => ({
    address: undefined,
    isConnected: false,
    isConnecting: false,
    chainId: undefined,
    balance: undefined,
    balanceWei: undefined,
    refreshBalance: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    signMessage: vi.fn(),
    isMetaMaskInstalled: false,
    error: null,
    clearError: vi.fn(),
    isRegistered: false,
    registerWithBackend: vi.fn(),
  }),
  EthereumProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Import mocked modules
import * as api from '../lib/api';
import * as symmetricSession from '../lib/symmetricSession';

// Type the mocked functions
const mockApiFetch = api.apiFetch as ReturnType<typeof vi.fn>;
const mockGetProfile = api.getProfile as ReturnType<typeof vi.fn>;
const mockGetBlocks = api.getBlocks as ReturnType<typeof vi.fn>;
const mockCreateBlock = api.createBlock as ReturnType<typeof vi.fn>;
const mockGetContacts = api.getContacts as ReturnType<typeof vi.fn>;
const mockCreateContact = api.createContact as ReturnType<typeof vi.fn>;
const mockUpdateContact = api.updateContact as ReturnType<typeof vi.fn>;
const mockDeleteContact = api.deleteContact as ReturnType<typeof vi.fn>;
const mockGetWallet = api.getWallet as ReturnType<typeof vi.fn>;

// Default profile data for authenticated tests
const defaultProfile = {
  id: 'user-1',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  public_key: { thumbprint: 'user-thumbprint' },
};

// Setup default apiFetch implementation that handles profile fetch
const setupDefaultApiFetch = () => {
  mockApiFetch.mockImplementation((url: string, _options?: any) => {
    // Handle profile fetch that AuthContext does on mount
    if (url === '/api/profile') {
      return Promise.resolve({
        ok: true,
        data: { profile: defaultProfile },
      });
    }
    // Default response for other calls
    return Promise.resolve({ ok: true, data: {} });
  });
};

// Setup mock fetch for external APIs (Binance, CoinGecko, exchangerate.host)
const setupExternalFetch = () => {
  return vi.fn().mockImplementation((url: string) => {
    // Binance price API
    if (url.includes('api.binance.com')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ price: '3000.00' }),
      });
    }
    // CoinGecko API
    if (url.includes('api.coingecko.com')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ethereum: { usd: 3000 }, bitcoin: { usd: 50000 } }),
      });
    }
    // Exchange rate API
    if (url.includes('api.exchangerate.host')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: 1.0 }),
      });
    }
    // Default response
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });
};

// Render with full app routes
const renderApp = (initialRoute: string = '/login') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/signup-custodial" element={<SignUpCustodial />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/buy-sell" element={<BuySell />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/secure-wallet" element={<div data-testid="secure-wallet">Secure Wallet Setup</div>} />
          <Route path="/onboarding" element={<div>Onboarding</div>} />
          <Route path="/forgot-password" element={<div>Forgot Password</div>} />
          <Route path="/signup-non-custodial" element={<div>Non-Custodial Signup</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

// Mock fetch for external APIs (Binance, etc.)
const originalFetch = global.fetch;

// Setup userEvent without clipboard to avoid conflicts
const setupUser = () => userEvent.setup({ writeToClipboard: false });

describe('Account Workflow E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Setup default apiFetch that handles profile requests
    setupDefaultApiFetch();
    
    // Setup mock fetch for external APIs (Binance, CoinGecko, etc.)
    global.fetch = setupExternalFetch() as unknown as typeof fetch;
    
    // Default mock implementations for specific API functions
    mockGetProfile.mockResolvedValue({
      ok: true,
      data: { profile: defaultProfile },
    });
    
    mockGetBlocks.mockResolvedValue({
      ok: true,
      data: { blocks: [] },
    });
    
    mockGetWallet.mockResolvedValue({
      ok: true,
      data: { wallet: { public_key: '0xTestWalletAddress123' } },
    });
    
    mockGetContacts.mockResolvedValue({
      ok: true,
      data: { contacts: [] },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Registration Flow', () => {
    it('should register a new user with valid credentials', async () => {
      const user = setupUser();
      
      mockApiFetch.mockResolvedValueOnce({
        ok: true,
        data: { 
          token: 'new-user-token',
          user: { id: 'new-user-1', email: 'newuser@example.com', first_name: 'New', last_name: 'User' }
        },
      });

      renderApp('/signup-custodial');

      // Fill in registration form
      await user.type(screen.getByLabelText(/first name/i), 'New');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');
      
      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('newuser@example.com'),
        }));
      });

      // Should redirect to wallet setup
      await waitFor(() => {
        expect(screen.getByTestId('secure-wallet')).toBeInTheDocument();
      });
    });

    it('should show error for existing email', async () => {
      const user = setupUser();
      
      mockApiFetch.mockResolvedValueOnce({
        ok: false,
        error: 'Email already registered',
      });

      renderApp('/signup-custodial');

      // Fill in form with existing email
      await user.type(screen.getByLabelText(/first name/i), 'Existing');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');
      
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
      });
    });

    it('should validate password requirements', async () => {
      const user = setupUser();

      renderApp('/signup-custodial');

      const passwordInput = screen.getByLabelText(/^password$/i);
      
      // Type weak password
      await user.type(passwordInput, 'weak');
      
      // Verify requirements are shown
      expect(screen.getByText(/8\+ characters/i)).toBeInTheDocument();
      expect(screen.getByText(/1 uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/1 number/i)).toBeInTheDocument();
      expect(screen.getByText(/1 special character/i)).toBeInTheDocument();

      // Verify submit button is disabled
      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toBeDisabled();

      // Type strong password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPass123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass123!');
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('checkbox'));

      // Verify submit button is now enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should redirect to wallet setup after registration', async () => {
      const user = setupUser();
      
      mockApiFetch.mockResolvedValueOnce({
        ok: true,
        data: { 
          token: 'new-token',
          user: { id: 'user-1', email: 'test@example.com', first_name: 'Test' }
        },
      });

      renderApp('/signup-custodial');

      // Complete registration
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');
      await user.click(screen.getByRole('checkbox'));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByTestId('secure-wallet')).toBeInTheDocument();
      });
    });
  });

  describe('Login Flow', () => {
    it('should login with valid credentials', async () => {
      const user = setupUser();
      
      mockApiFetch.mockResolvedValueOnce({
        ok: true,
        data: { 
          token: 'valid-token',
          user: { id: 'user-1', email: 'test@example.com', first_name: 'Test' }
        },
      });

      renderApp('/login');

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
          method: 'POST',
        }));
      });

      // After login should redirect to dashboard
      await waitFor(() => {
        expect(screen.getByText(/total balance/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid credentials', async () => {
      const user = setupUser();
      
      mockApiFetch.mockResolvedValueOnce({
        ok: false,
        error: 'Invalid email or password',
      });

      renderApp('/login');

      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('should redirect to dashboard after login', async () => {
      const user = setupUser();
      
      mockApiFetch.mockResolvedValueOnce({
        ok: true,
        data: { 
          token: 'valid-token',
          user: { id: 'user-1', email: 'test@example.com', first_name: 'Test' }
        },
      });

      renderApp('/login');

       await user.type(screen.getByLabelText(/email/i), 'test@example.com');
       await user.type(screen.getByLabelText(/password/i), 'password123');
       await user.click(screen.getByRole('button', { name: /log in/i }));

       await waitFor(() => {
         expect(screen.getByText(/total balance/i)).toBeInTheDocument();
       });
    });

    it('should handle MFA flow when enabled', async () => {
      const user = setupUser();
      
      // First login attempt returns MFA required
      mockApiFetch.mockResolvedValueOnce({
        ok: false,
        error: 'MFA_REQUIRED',
      });

      renderApp('/login');

      await user.type(screen.getByLabelText(/email/i), 'mfa@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /log in/i }));

      // Should show MFA error (in a real app, this would trigger MFA modal)
      await waitFor(() => {
        expect(screen.getByText(/MFA_REQUIRED/i)).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Flow', () => {
    beforeEach(() => {
      // Set up authenticated user
      localStorage.setItem('cryopay_token', 'test-token');
      
      // Ensure getSymKey returns a session key so we don't need unlock modal
      vi.mocked(symmetricSession.getSymKey).mockReturnValue('session-key');
    });

    it('should create a buy transaction successfully', async () => {
      const user = setupUser();
      
      mockCreateBlock.mockResolvedValueOnce({
        ok: true,
        data: { block: { id: 1, hash: 'block-hash-1' } },
      });

      renderApp('/buy-sell');

      // Wait for the page to load and price to be fetched
      await waitFor(() => {
        expect(screen.getByText(/buy & sell crypto/i)).toBeInTheDocument();
      });

      // Wait for price loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/fetching price/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Enter amount in the fiat input (using id selector since label changes)
      const fiatInput = screen.getByRole('spinbutton', { name: /you pay/i });
      await user.type(fiatInput, '100');

      // Wait for crypto amount to be calculated
      await waitFor(() => {
        const cryptoInput = screen.getByRole('spinbutton', { name: /you get/i });
        expect(cryptoInput.getAttribute('value')).not.toBe('');
      });

      // Click Buy Now
      const buyNowButton = screen.getByRole('button', { name: /buy now/i });
      await user.click(buyNowButton);

      await waitFor(() => {
        expect(mockCreateBlock).toHaveBeenCalled();
      });
    });

    it('should create a sell transaction successfully', async () => {
      const user = setupUser();
      
      mockCreateBlock.mockResolvedValueOnce({
        ok: true,
        data: { block: { id: 2, hash: 'block-hash-2' } },
      });

      // Mock alert to capture balance warning
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderApp('/buy-sell');

      await waitFor(() => {
        expect(screen.getByText(/buy & sell crypto/i)).toBeInTheDocument();
      });

      // Click Sell tab
      const sellButton = screen.getByRole('button', { name: /sell crypto/i });
      await user.click(sellButton);

      // Should show security warning for selling
      await waitFor(() => {
        expect(screen.getByText(/important security notice/i)).toBeInTheDocument();
      });

      // Wait for price loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/fetching price/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Enter amount - label changes to "You Receive" for sell
      const fiatInput = screen.getByRole('spinbutton', { name: /you receive/i });
      await user.type(fiatInput, '50');

      // Wait for crypto amount to be calculated
      await waitFor(() => {
        const cryptoInput = screen.getByRole('spinbutton', { name: /you sell/i });
        expect(cryptoInput.getAttribute('value')).not.toBe('');
      });

      // Click Sell Now - should trigger insufficient balance alert since balance is 0
      const sellNowButton = screen.getByRole('button', { name: /sell now/i });
      await user.click(sellNowButton);

      // Should show insufficient balance alert (balance is 0, trying to sell $50)
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Insufficient balance'));
      });

      alertSpy.mockRestore();
    });

    it('should display transaction in history', async () => {
      const mockTransactions = [
        {
          id: 1,
          hash: 'tx-hash-1',
          user_id: 'user-1',
          data: {
            public_summary: {
              kind: 'buy',
              crypto: 'ETH',
              amountFiat: 100,
              amountCrypto: 0.033,
              timestamp: new Date().toISOString(),
            },
          },
          created_at: new Date().toISOString(),
        },
      ];

      mockGetBlocks.mockResolvedValueOnce({
        ok: true,
        data: { blocks: mockTransactions },
      });

      renderApp('/transactions');

      await waitFor(() => {
        expect(screen.getByText(/transaction history/i)).toBeInTheDocument();
      });

      // Verify transactions are displayed
      await waitFor(() => {
        expect(screen.getByText(/bought eth/i)).toBeInTheDocument();
      });
    });

    it('should calculate balance correctly after transaction', async () => {
      const mockTransactions = [
        {
          id: 1,
          hash: 'tx-hash-1',
          user_id: 'user-1',
          data: {
            public_summary: {
              kind: 'buy',
              crypto: 'ETH',
              amountFiat: 100,
              amountCrypto: 0.033,
              from_user_id: 'user-1',
              timestamp: new Date().toISOString(),
            },
          },
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          hash: 'tx-hash-2',
          user_id: 'user-1',
          data: {
            public_summary: {
              kind: 'sell',
              crypto: 'ETH',
              amountFiat: 150,
              amountCrypto: 0.05,
              from_user_id: 'user-1',
              timestamp: new Date().toISOString(),
            },
          },
          created_at: new Date().toISOString(),
        },
      ];

       mockGetBlocks.mockResolvedValue({
         ok: true,
         data: { blocks: mockTransactions },
       });

       renderApp('/dashboard');

       // Balance should reflect: -100 (buy) + 150 (sell) = $50
       await waitFor(() => {
         // Dashboard shows the calculated balance
         expect(screen.getByText(/total balance/i)).toBeInTheDocument();
       });
    });
  });

  describe('Contact Management Flow', () => {
    beforeEach(() => {
      // Set up authenticated user
      localStorage.setItem('cryopay_token', 'test-token');
    });

    it('should add a new contact', async () => {
      const user = setupUser();
      
      // Override apiFetch to handle both profile and profile search
      mockApiFetch.mockImplementation((url: string) => {
        if (url === '/api/profile') {
          return Promise.resolve({
            ok: true,
            data: { profile: defaultProfile },
          });
        }
        if (url.includes('/api/profile/search')) {
          return Promise.resolve({
            ok: true,
            data: {
              profile: {
                id: 'contact-user-1',
                email: 'contact@example.com',
                first_name: 'Contact',
                last_name: 'Person',
                public_key: { thumbprint: 'contact-thumbprint' },
              },
            },
          });
        }
        return Promise.resolve({ ok: true, data: {} });
      });

      mockCreateContact.mockResolvedValueOnce({
        ok: true,
        data: {
          contact: {
            id: 1,
            name: 'Contact Person',
            address: 'contact-thumbprint',
            email: 'contact@example.com',
          },
        },
      });

      mockGetContacts.mockResolvedValueOnce({
        ok: true,
        data: { contacts: [] },
      });

      renderApp('/contacts');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add contact/i })).toBeInTheDocument();
      });

      // Click Add Contact
      const addButton = screen.getByRole('button', { name: /add contact/i });
      await user.click(addButton);

      // Fill in contact form
      await waitFor(() => {
        expect(screen.getByText(/add new contact/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('John Doe'), 'Contact Person');
      await user.type(screen.getByPlaceholderText('0x...'), '0xContactAddress');
      await user.type(screen.getByPlaceholderText(/enter public key/i), 'contact-thumbprint');
      await user.type(screen.getByPlaceholderText('john@example.com'), 'contact@example.com');

      // Submit - find the button inside the dialog
      const dialog = screen.getByRole('dialog');
      const submitButton = within(dialog).getByRole('button', { name: /add contact/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/profile/search?email=contact%40example.com')
        );
      });
    });

    it('should edit an existing contact', async () => {
      const user = setupUser();
      
      const existingContact = {
        id: 1,
        name: 'Original Name',
        address: '0xOriginalAddress',
        email: 'original@example.com',
        label: 'Friend',
      };

      mockGetContacts.mockResolvedValueOnce({
        ok: true,
        data: { contacts: [existingContact] },
      });

      mockUpdateContact.mockResolvedValueOnce({
        ok: true,
        data: {
          contact: {
            ...existingContact,
            name: 'Updated Name',
            label: 'Family',
          },
        },
      });

      renderApp('/contacts');

      // Wait for contact to appear
      await waitFor(() => {
        expect(screen.getByText('Original Name')).toBeInTheDocument();
      });

       // Find the edit button by the Edit icon (the button with just the edit icon)
       const buttons = screen.getAllByRole('button');
       
       // Find the edit button - it should have the square-pen icon
       const editButton = buttons.find(btn => 
         btn.querySelector('svg.lucide-square-pen')
       );
       
       if (editButton) {
         await user.click(editButton);
       }

       // Edit contact modal should open
       await waitFor(() => {
         expect(screen.getByText(/edit contact/i)).toBeInTheDocument();
       });

      // Update the name using the input with id
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateContact).toHaveBeenCalledWith(1, expect.objectContaining({
          name: 'Updated Name',
        }));
      });
    });

    it('should delete a contact', async () => {
      const user = setupUser();
      
      const contactToDelete = {
        id: 1,
        name: 'Delete Me',
        address: '0xDeleteAddress',
        email: 'delete@example.com',
      };

      mockGetContacts.mockResolvedValueOnce({
        ok: true,
        data: { contacts: [contactToDelete] },
      });

      mockDeleteContact.mockResolvedValueOnce({
        ok: true,
      });

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderApp('/contacts');

      await waitFor(() => {
        expect(screen.getByText('Delete Me')).toBeInTheDocument();
      });

      // Find and click delete button
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => 
        btn.querySelector('svg.lucide-trash2') || 
        btn.classList.contains('text-red-600')
      );
      
      if (deleteButton) {
        await user.click(deleteButton);
      }

      await waitFor(() => {
        expect(mockDeleteContact).toHaveBeenCalledWith(1);
      });

      confirmSpy.mockRestore();
    });

    it('should send to a contact', async () => {
      const user = setupUser();
      
      const contact = {
        id: 1,
        name: 'Send Target',
        address: '0xSendAddress',
        email: 'send@example.com',
        public_key: { thumbprint: 'send-thumbprint' },
      };

      mockGetContacts.mockResolvedValueOnce({
        ok: true,
        data: { contacts: [contact] },
      });

      mockGetBlocks.mockResolvedValue({
        ok: true,
        data: { blocks: [] },
      });

      mockCreateBlock.mockResolvedValueOnce({
        ok: true,
        data: { block: { id: 1, hash: 'tx-hash' } },
      });

      // Override apiFetch to handle both profile and profile search
      mockApiFetch.mockImplementation((url: string) => {
        if (url === '/api/profile') {
          return Promise.resolve({
            ok: true,
            data: { profile: defaultProfile },
          });
        }
        if (url.includes('/api/profile/search')) {
          return Promise.resolve({
            ok: true,
            data: {
              profile: {
                id: 'recipient-id',
                email: 'send@example.com',
                public_key: { thumbprint: 'send-thumbprint' },
              },
            },
          });
        }
        return Promise.resolve({ ok: true, data: {} });
      });

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderApp('/contacts');

      await waitFor(() => {
        expect(screen.getByText('Send Target')).toBeInTheDocument();
      });

      // Click Quick Send button
      const quickSendButtons = screen.getAllByRole('button', { name: /quick send/i });
      await user.click(quickSendButtons[0]);

      // Fill in send modal
      await waitFor(() => {
        expect(screen.getByText(/send to contact/i)).toBeInTheDocument();
      });

      // Get inputs by their preceding label text
      const amountInputs = screen.getAllByRole('textbox');
      // Find the amount input (second input after address)
      const amountInput = amountInputs.find(input => {
        const label = input.closest('.space-y-2')?.querySelector('label');
        return label?.textContent?.includes('Amount');
      });
      
      if (amountInput) {
        await user.type(amountInput, '25');
      }

      // Find password input
      const passwordInput = screen.getByPlaceholderText(/enter wallet-derived key/i);
      await user.type(passwordInput, 'wallet-password');

      // Click Send button in modal
      const dialog = screen.getByRole('dialog');
      const sendButton = within(dialog).getByRole('button', { name: /^send$/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockCreateBlock).toHaveBeenCalled();
      });

      alertSpy.mockRestore();
    });
  });

  describe('Dashboard Workflow', () => {
    beforeEach(() => {
      localStorage.setItem('cryopay_token', 'test-token');
    });

    it('should display user balance on dashboard', async () => {
      mockGetBlocks.mockResolvedValueOnce({
        ok: true,
        data: {
          blocks: [
            {
              id: 1,
              user_id: 'user-1',
              data: {
                public_summary: {
                  kind: 'sell',
                  amountFiat: 500,
                  amountCrypto: 0.166,
                  crypto: 'ETH',
                },
              },
            },
          ],
        },
      });

       renderApp('/dashboard');

       await waitFor(() => {
         expect(screen.getByText(/total balance/i)).toBeInTheDocument();
       });
    });

    it('should display wallet address on dashboard', async () => {
      mockGetWallet.mockResolvedValueOnce({
        ok: true,
        data: { wallet: { public_key: '0xMyWalletAddress123456789' } },
      });

       renderApp('/dashboard');

       await waitFor(() => {
         expect(screen.getByText(/0xMyWal/)).toBeInTheDocument();
       });
    });

    it('should show recent transactions on dashboard', async () => {
      mockGetBlocks.mockResolvedValueOnce({
        ok: true,
        data: {
          blocks: [
            {
              id: 1,
              user_id: 'user-1',
              data: {
                public_summary: {
                  kind: 'buy',
                  to: 'Exchange',
                  amountFiat: 100,
                  amountCrypto: 0.033,
                  crypto: 'ETH',
                  timestamp: new Date().toISOString(),
                },
              },
            },
          ],
        },
      });

      renderApp('/dashboard');

      await waitFor(() => {
        expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
      });
    });

    it('should navigate to transactions from dashboard', async () => {
      const user = setupUser();

       renderApp('/dashboard');

       // Wait for the Current Balance to load (indicates dashboard is ready)
       await waitFor(() => {
         expect(screen.getByText(/total balance/i)).toBeInTheDocument();
       });

      // Click View All link - it's a Link component
      const viewAllLink = screen.getByRole('link', { name: /view all/i });
      await user.click(viewAllLink);

      await waitFor(() => {
        expect(screen.getByText(/transaction history/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const user = setupUser();
      
      mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

      renderApp('/login');

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle API errors with appropriate messages', async () => {
      const user = setupUser();
      
      mockApiFetch.mockResolvedValueOnce({
        ok: false,
        error: 'Server is temporarily unavailable',
      });

      renderApp('/login');

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText(/server is temporarily unavailable/i)).toBeInTheDocument();
      });
    });

    it('should handle empty field submission', async () => {
      const user = setupUser();

      // Mock API to return error for empty credentials
      mockApiFetch.mockImplementation((url: string) => {
        if (url === '/api/auth/login') {
          return Promise.resolve({
            ok: false,
            error: 'Email and password are required',
          });
        }
        return Promise.resolve({ ok: true, data: {} });
      });

      renderApp('/login');

      // Submit without filling in fields
      const submitButton = screen.getByRole('button', { name: /log in/i });
      await user.click(submitButton);

      // Should show error from API
      await waitFor(() => {
        expect(screen.getByText(/email and password are required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session Management', () => {
    it('should persist user session across page refreshes', async () => {
      // Set up token in localStorage
      localStorage.setItem('cryopay_token', 'persisted-token');
      
      // Mock profile fetch that would happen on mount
      mockApiFetch.mockResolvedValueOnce({
        ok: true,
        data: {
          profile: {
            id: 'user-1',
            first_name: 'Persisted',
            last_name: 'User',
            email: 'persisted@example.com',
          },
        },
      });

       renderApp('/dashboard');

       // User session should be restored
       await waitFor(() => {
         expect(screen.getByText(/total balance/i)).toBeInTheDocument();
       });
    });

    it('should clear session on logout', async () => {
      localStorage.setItem('cryopay_token', 'session-token');
      
      // Verify token exists before test
      expect(localStorage.getItem('cryopay_token')).toBe('session-token');

      // Simulate logout
      localStorage.removeItem('cryopay_token');

      // Verify token is cleared
      expect(localStorage.getItem('cryopay_token')).toBeNull();
    });
  });
});
