import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '../api';

describe('apiFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it('adds Authorization header when token in localStorage', async () => {
    window.localStorage.setItem('ecovault_token', 'my-test-token');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'ok' }),
    });

    await apiFetch('/api/test');

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((options.headers as Record<string, string>).Authorization).toBe('Bearer my-test-token');
  });

  it('does NOT add Authorization header when no token', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'ok' }),
    });

    await apiFetch('/api/test');

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((options.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('returns ok:false on HTTP error status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: async () => 'Unauthorized',
    });

    const result = await apiFetch('/api/protected');

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns error response on fetch failure (network error)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await apiFetch('/api/test');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('returns ok:true with data on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [1, 2, 3] }),
    });

    const result = await apiFetch<{ items: number[] }>('/api/items');

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ items: [1, 2, 3] });
  });

  it('handles backend success field: returns data when success=true', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { token: 'abc' } }),
    });

    const result = await apiFetch('/api/auth/login');

    expect(result.ok).toBe(true);
    expect((result.data as any).token).toBe('abc');
  });

  it('handles backend success field: returns error when success=false', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: 'Invalid credentials' }),
    });

    const result = await apiFetch('/api/auth/login');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });
});
