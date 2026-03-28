import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import SignUpNonCustodial from '../SignUpNonCustodial';

const renderSignUpNonCustodial = () => render(
  <MemoryRouter>
    <AuthProvider>
      <SignUpNonCustodial />
    </AuthProvider>
  </MemoryRouter>
);

describe('SignUpNonCustodial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders wallet connect form', () => {
    renderSignUpNonCustodial();
    // Check for the heading
    expect(screen.getByRole('heading', { name: /create your profile/i })).toBeInTheDocument();
    // Has connect buttons for wallets
    expect(screen.getByText('MetaMask')).toBeInTheDocument();
    expect(screen.getByText('WalletConnect')).toBeInTheDocument();
  });

  it('shows login link in footer', () => {
    renderSignUpNonCustodial();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });

  it('renders wallet connection buttons', () => {
    renderSignUpNonCustodial();

    // Verify wallet buttons are rendered as buttons (not links)
    const metamaskButton = screen.getByText('MetaMask').closest('button');
    expect(metamaskButton).toBeInTheDocument();
    
    const walletConnectButton = screen.getByText('WalletConnect').closest('button');
    expect(walletConnectButton).toBeInTheDocument();
    
    const coinbaseButton = screen.getByText('Coinbase Wallet').closest('button');
    expect(coinbaseButton).toBeInTheDocument();
  });

  it('renders name input fields', () => {
    renderSignUpNonCustodial();
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
  });
});
