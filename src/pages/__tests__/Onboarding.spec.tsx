import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import OnboardingScreen from '../Onboarding';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const renderOnboarding = () => render(
  <MemoryRouter>
    <AuthProvider>
      <OnboardingScreen />
    </AuthProvider>
  </MemoryRouter>
);

describe('OnboardingScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders account choice cards', () => {
    renderOnboarding();

    expect(screen.getByText('Simple Account')).toBeInTheDocument();
    expect(screen.getByText('Self-Custody Wallet')).toBeInTheDocument();
    expect(screen.getByText('How would you like to manage your funds?')).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    renderOnboarding();
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('has login link in footer', () => {
    renderOnboarding();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
    expect(screen.getByText('Log In')).toBeInTheDocument();
  });

  it('shows button texts for each choice', () => {
    renderOnboarding();
    expect(screen.getByText('Select & Continue')).toBeInTheDocument();
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('shows taglines for each account type', () => {
    renderOnboarding();
    expect(screen.getByText(/best for beginners/i)).toBeInTheDocument();
    expect(screen.getByText(/for experts/i)).toBeInTheDocument();
  });

  it('shows labels for custodial and non-custodial', () => {
    renderOnboarding();
    expect(screen.getByText('Custodial')).toBeInTheDocument();
    expect(screen.getByText('Non-Custodial')).toBeInTheDocument();
  });
});
