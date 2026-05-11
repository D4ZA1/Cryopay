import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Coupons from '../Coupons';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}));

const COUPONS = [
  { id: '1', type: 'transit', label: 'Bus Pass', description: '1-day bus pass', cost_grn: 100, icon: '🚌', partner: 'DPP', validity_days: 1 },
  { id: '2', type: 'grocery', label: 'Grocery 50', description: '50 CZK off', cost_grn: 200, icon: '🛒', partner: 'Billa', validity_days: 30 },
  { id: '3', type: 'transit', label: 'Weekly Pass', description: '7-day bus pass', cost_grn: 400, icon: '🚌', partner: 'DPP', validity_days: 7 },
];

const mockFetch = (response: any, ok = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
};

describe('Coupons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<Coupons />);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders coupon cards when API returns data', async () => {
    mockFetch({ coupons: COUPONS });

    render(<Coupons />);

    await waitFor(() => {
      expect(screen.getByText('Bus Pass')).toBeTruthy();
      expect(screen.getByText('Grocery 50')).toBeTruthy();
    });
  });

  it('filter buttons show only matching coupons', async () => {
    mockFetch({ coupons: COUPONS });

    render(<Coupons />);

    await waitFor(() => {
      expect(screen.getByText('Bus Pass')).toBeTruthy();
    });

    // Click transit filter
    const transitBtn = screen.getByRole('button', { name: /Transit/i });
    fireEvent.click(transitBtn);

    expect(screen.getByText('Bus Pass')).toBeTruthy();
    expect(screen.getByText('Weekly Pass')).toBeTruthy();
    expect(screen.queryByText('Grocery 50')).toBeFalsy();
  });

  it('shows all coupons when "All" filter is active', async () => {
    mockFetch({ coupons: COUPONS });

    render(<Coupons />);

    await waitFor(() => {
      expect(screen.getByText('Bus Pass')).toBeTruthy();
    });

    // Filter to transit then back to all
    const transitBtn = screen.getByRole('button', { name: /Transit/i });
    fireEvent.click(transitBtn);
    const allBtn = screen.getByRole('button', { name: /^All$/i });
    fireEvent.click(allBtn);

    expect(screen.getByText('Bus Pass')).toBeTruthy();
    expect(screen.getByText('Grocery 50')).toBeTruthy();
  });
});
