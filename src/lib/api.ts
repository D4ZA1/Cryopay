interface ImportMetaEnv {
  readonly VITE_WORKER_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';

interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('cryopay_token');
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
      const err = await response.text();
      return { ok: false, error: err };
    }

    const data = await response.json();
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

export async function verifyWallet(publicKey: string, challenge: string, signature: string) {
  return apiFetch('/api/wallet/verify-wallet', {
    method: 'POST',
    body: JSON.stringify({ public_key: publicKey, challenge, signature }),
  });
}

export async function saveWallet(publicKey: string, encryptedPrivateKey: string, verified: boolean = false) {
  return apiFetch('/api/wallet', {
    method: 'POST',
    body: JSON.stringify({ public_key: publicKey, encrypted_private_key: encryptedPrivateKey, verified }),
  });
}

// Blocks/Transactions API
export async function getBlocks() {
  return apiFetch('/api/blocks');
}

export async function getBlock(id: number) {
  return apiFetch(`/api/blocks/${id}`);
}

export async function createBlock(data: string, previousHash?: string) {
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

export async function createContact(data: { name: string; address: string; email?: string; label?: string; public_key?: string }) {
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
