import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Leaderboard from '../Leaderboard';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const mockFetch = (response: any, ok = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
};

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves
    render(<Leaderboard />);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders leaderboard entries when API returns data', async () => {
    mockFetch({
      leaderboard: [
        { rank: 1, name: 'Alice', total_earned: 500, deposit_count: 10, total_kg: '5.00' },
        { rank: 2, name: 'Bob', total_earned: 300, deposit_count: 6, total_kg: '3.00' },
      ],
    });

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
    });

    expect(screen.getByText('500')).toBeTruthy();
  });

  it('renders "No recycling activity" when data is empty', async () => {
    mockFetch({ leaderboard: [] });

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.getByText(/No recycling activity/i)).toBeTruthy();
    });
  });

  it('renders error message when API fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'Internal Server Error',
    });

    render(<Leaderboard />);

    await waitFor(() => {
      expect(screen.queryByText(/animate-spin/)).toBeFalsy();
    });

    // Error state: loading false, error shown
    await waitFor(() => {
      expect(document.querySelector('.text-red-400')).toBeTruthy();
    });
  });
});
