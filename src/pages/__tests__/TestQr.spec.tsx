import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TestQr from '../TestQr';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value }: { value: string }) => <svg data-testid="qr-code" data-value={value} />,
}));

const ACTIVE_BINS = [
  { bin_id: 'bin-001', location_name: 'Main Station', supported_materials: 'plastic,glass', is_active: 1 },
];

describe('TestQr', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page header', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bins: ACTIVE_BINS }),
      text: async () => '{}',
    });

    render(<TestQr />);
    expect(screen.getByText('QR Test Generator')).toBeTruthy();
  });

  it('shows warning when no active bins', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bins: [] }),
      text: async () => '{}',
    });

    render(<TestQr />);

    await waitFor(() => {
      expect(screen.getByText(/No active bins found/i)).toBeTruthy();
    });
  });

  it('generate button is disabled when no bins', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bins: [] }),
      text: async () => '{}',
    });

    render(<TestQr />);

    await waitFor(() => {
      expect(screen.queryByText(/No active bins/i)).toBeTruthy();
    });

    const generateBtn = screen.getByRole('button', { name: /Generate QR/i });
    expect(generateBtn).toBeTruthy();
    expect((generateBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows QR code after generate button clicked', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/bins') && !url.includes('/qr') && !url.includes('simulate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bins: ACTIVE_BINS }),
          text: async () => '{}',
        });
      }
      if (url.includes('/qr')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ payload: { bin_id: 'bin-001', nonce: 1, sig: 'abc123' } }),
          text: async () => '{}',
        });
      }
      // AMM simulate
      return Promise.resolve({
        ok: true,
        json: async () => ({ grn: 5, rate_per_kg: 10, weight_kg: 0.5 }),
        text: async () => '{}',
      });
    });

    render(<TestQr />);

    await waitFor(() => {
      expect(screen.queryByText(/No active bins/i)).toBeFalsy();
    });

    const generateBtn = screen.getByRole('button', { name: /Generate QR/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByTestId('qr-code')).toBeTruthy();
    });
  });
});
