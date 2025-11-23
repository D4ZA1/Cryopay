// Simple in-memory symmetric key store for the unlocked wallet-derived key.
// This is intentionally minimal and keeps the key in memory only.
let symKey: string | null = null;

export function setSymKey(k: string) {
  symKey = k;
}

export function getSymKey(): string | null {
  return symKey;
}

export function clearSymKey() {
  symKey = null;
}

export default { setSymKey, getSymKey, clearSymKey };
