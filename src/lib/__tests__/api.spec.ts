import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, getProfile, login, getWallet, saveWallet, getBlocks, getContacts, createContact, sendOtp } from '../api';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(global, 'fetch').mockReset();
  localStorage.clear();
});

describe('api.ts', () => {
  it('uses correct worker base URL', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => ({}) } as any);
    await apiFetch('/test');
    expect(global.fetch).toHaveBeenCalled();
  });

  it('apiFetch success with auth header', async () => {
    localStorage.setItem('cryopay_token', 'token123');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => ({ data: 'success' }),
    } as any);

    const res = await apiFetch('/api/test');
    expect(res.ok).toBe(true);
    expect(res.data).toEqual({ data: 'success' });
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('http://localhost:8787/api/test'), expect.objectContaining({
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token123',
      }),
    }));
  });

  it('apiFetch handles 401/4xx errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      text: () => 'Unauthorized',
    } as any);

    const res = await apiFetch('/api/protected');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Unauthorized');
  });

  it('apiFetch handles network error', async () => {
    (global.fetch as any).mockRejectedValue(new Error('fetch failed'));

    const res = await apiFetch('/api/offline');
    expect(res.ok).toBe(false);
    expect(res.error).toContain('fetch failed');
  });

  it('login constructs correct payload', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => ({}) } as any);

    await login('user@example.com', 'pass123');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/login'), expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email: 'user@example.com', password: 'pass123' }),
    }));
  });

  it('getProfile no auth if no token', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: () => ({ profile: { id: '1' } }) } as any);

    await getProfile();
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/profile'), expect.objectContaining({
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('wallet APIs: get/save/verify', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: () => ({}) } as any);

    await getWallet();
    expect(global.fetch).toHaveBeenCalled();
    expect((global.fetch as any).mock.calls[0][0]).toContain('/api/wallet');

    await saveWallet('pubkey', 'encpriv', true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect((global.fetch as any).mock.calls[1][0]).toContain('/api/wallet');
    expect((global.fetch as any).mock.calls[1][1]?.body).toContain('public_key');
  });

  it('blocks/contacts APIs', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true, json: () => ({}) } as any);

    await getBlocks();
    expect(global.fetch).toHaveBeenCalled();
    expect((global.fetch as any).mock.calls[0][0]).toContain('/api/blocks');

    await getContacts();
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect((global.fetch as any).mock.calls[1][0]).toContain('/api/contacts');

    await createContact({ name: 'John', address: 'addr' });
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect((global.fetch as any).mock.calls[2][0]).toContain('/api/contacts');
  });

  it('OTP APIs', async () => {
    (global.fetch as any).mockResolvedValue({ ok: true } as any);

    await sendOtp('user@example.com');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/send-otp'), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' }),
    }));
  });
});
