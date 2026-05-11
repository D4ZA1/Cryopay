import { parseApiError } from "@/utils/errorUtils";

const WORKER_URL = import.meta.env.VITE_WORKER_URL;
  
interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('ecovault_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  Object.assign(headers, options.headers);

  try {
    const response = await fetch(`${WORKER_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const rawErr = await response.text();
      const errorMessage = parseApiError(rawErr);
      return { ok: false, error: errorMessage };
    }

    const data = await response.json();
    
    // Handle backend responses with 'success' field
    if ('success' in data) {
      if (data.success) {
        return { ok: true, data: data.data as T };
      } else {
        return { ok: false, error: data.error || data.message || 'Request failed' };
      }
    }
    
    return { ok: true, data: data as T };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function register(email: string, password: string, firstName: string, lastName?: string) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
  });
}

export async function login(email: string, password: string) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return apiFetch('/api/auth/logout', {
    method: 'POST',
  });
}

// Profile API
export async function getProfile() {
  return apiFetch('/api/profile');
}

export async function updateProfile(data: { first_name?: string; last_name?: string; phone?: string; notifications?: string }) {
  return apiFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function searchProfile(email: string) {
  return apiFetch(`/api/profile/search?email=${encodeURIComponent(email)}`);
}

// Wallet API
export async function getWallet() {
  return apiFetch('/api/wallet');
}

// Blocks/Transactions API
export async function getBlocks() {
  return apiFetch('/api/blocks');
}

export async function getBlock(id: number) {
  return apiFetch(`/api/blocks/${id}`);
}

export async function createBlock(data: string, previousHash?: string | null) {
  return apiFetch('/api/blocks', {
    method: 'POST',
    body: JSON.stringify({ data, previous_hash: previousHash }),
  });
}

// Contacts API
export async function getContacts() {
  return apiFetch('/api/contacts');
}

export async function getContact(id: number) {
  return apiFetch(`/api/contacts/${id}`);
}

export async function createContact(data: { name: string; address: string; email?: string; label?: string; public_key?: string; contact_user_id?: string }) {
  return apiFetch('/api/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContact(id: number, data: { name?: string; address?: string; email?: string; label?: string; public_key?: string }) {
  return apiFetch(`/api/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteContact(id: number) {
  return apiFetch(`/api/contacts/${id}`, {
    method: 'DELETE',
  });
}

// OTP / Magic Link API
export async function sendOtp(email: string) {
  return apiFetch('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(email: string, token: string) {
  return apiFetch('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, token }),
  });
}

// Password change
export async function changePassword(password: string) {
  return apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

// MFA status
export async function getMfaStatus() {
  return apiFetch('/api/auth/mfa-status');
}

export async function enableMfa() {
  return apiFetch('/api/auth/mfa-enable', {
    method: 'POST',
  });
}

export async function verifyMfa(code: string) {
  return apiFetch('/api/auth/mfa-verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function disableMfa(password: string) {
  return apiFetch('/api/auth/mfa-disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function loginWithMfa(email: string, password: string, mfaCode: string) {
  return apiFetch('/api/auth/mfa-login', {
    method: 'POST',
    body: JSON.stringify({ email, password, mfaCode }),
  });
}

// ============ Recycle / GreenEcoVault API ============

export async function submitQrScan(qrString: string) {
  return apiFetch('/api/recycle/scan', {
    method: 'POST',
    body: JSON.stringify({ qr_string: qrString }),
  });
}

export async function getRecycleBalance() {
  return apiFetch<{ balance: number; source: string }>('/api/recycle/balance');
}

export async function getRecycleDeposits(limit = 20, offset = 0) {
  return apiFetch(`/api/recycle/deposits?limit=${limit}&offset=${offset}`);
}

export async function redeemVoucher(tokensSpent: number, voucherType: 'transit' | 'grocery' | 'charity') {
  return apiFetch('/api/recycle/redeem', {
    method: 'POST',
    body: JSON.stringify({ tokens_spent: tokensSpent, voucher_type: voucherType }),
  });
}

export async function getRedemptions() {
  return apiFetch('/api/recycle/redemptions');
}

export async function getMaterialPrices() {
  return apiFetch('/api/bins/prices');
}

export async function getBins() {
  return apiFetch('/api/bins');
}

export async function generateBinQr(binId: string, materialType: string, weightGrams: number) {
  return apiFetch<{ qr_string: string; expires_at: string }>(`/api/bins/${binId}/generate-qr`, {
    method: 'POST',
    body: JSON.stringify({ materialType, weightGrams }),
  });
}

export async function getRecycleStats() {
  return apiFetch<{
    total_deposits: number;
    total_tokens_earned: number;
    total_kg_recycled: number;
    confirmed_tokens: number;
    pending_tokens: number;
    by_material: Array<{ material_type: string; deposit_count: number; tokens_earned: number; weight_grams: number }>;
    last_deposit_at: number | null;
  }>('/api/recycle/stats');
}

// ============ AMM API ============

export async function triggerAmmRecalculate() {
  return apiFetch('/api/amm/recalculate', { method: 'POST' });
}

export async function simulateAmmPrice(
  material: string,
  wCurrentKg = 0,
  uActive = 0
) {
  return apiFetch(
    `/api/amm/simulate?material=${encodeURIComponent(material)}&w_current_kg=${wCurrentKg}&u_active=${uActive}`
  );
}

export async function getAmmHistory(
  material?: string,
  hours = 24,
  limit = 100
) {
  const params = new URLSearchParams({ hours: String(hours), limit: String(limit) });
  if (material) params.set('material', material);
  return apiFetch(`/api/amm/history?${params.toString()}`);
}
