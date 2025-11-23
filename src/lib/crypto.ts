// Browser WebCrypto helpers for ECDSA P-256 keys and AES-GCM encryption
// Exports: generateKeyPair, exportJwk, importJwk, deriveKeyFromPassword, encryptJwkWithPassword, decryptJwkWithPassword, signString, verifySignature, jwkThumbprint

const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64ToBuf = (b64str: string) => Uint8Array.from(atob(b64str), c => c.charCodeAt(0)).buffer;

export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
  return keyPair;
}

export async function exportJwk(key: CryptoKey) {
  return await window.crypto.subtle.exportKey('jwk', key);
}

export async function importJwk(jwk: JsonWebKey, usage: KeyUsage[] = ['verify']) {
  return await window.crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, true, usage);
}

export async function deriveKeyFromPassword(password: string, saltHex?: string) {
  const enc = new TextEncoder();
  const pwKey = await window.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const salt = saltHex ? hexToBuf(saltHex) : window.crypto.getRandomValues(new Uint8Array(16)).buffer;
  const key = await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  return { key, salt: bufToHex(salt) };
}

export async function encryptJwkWithPassword(jwk: JsonWebKey, password: string) {
  const jwkStr = JSON.stringify(jwk);
  const enc = new TextEncoder();
  const { key, salt } = await deriveKeyFromPassword(password);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ct = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(jwkStr));
  return { salt, iv: bufToHex(iv.buffer), ciphertext: b64(ct) };
}

export async function decryptJwkWithPassword(blob: { salt: string; iv: string; ciphertext: string }, password: string) {
  const enc = new TextEncoder();
  const saltBuf = hexToBuf(blob.salt);
  const pwKey = await window.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuf, iterations: 100_000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const ivBuf = hexToBuf(blob.iv);
  try {
    const plain = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(ivBuf) }, key, b64ToBuf(blob.ciphertext));
    const dec = new TextDecoder().decode(plain);
    return JSON.parse(dec);
  } catch (e) {
    throw new Error('Decryption failed');
  }
}

export async function signString(privateJwk: JsonWebKey, data: string) {
  const key = await window.crypto.subtle.importKey('jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await window.crypto.subtle.sign({ name: 'ECDSA', hash: { name: 'SHA-256' } }, key, new TextEncoder().encode(data));
  return b64(sig);
}

export async function verifySignature(publicJwk: JsonWebKey, data: string, sigB64: string) {
  const key = await importJwk(publicJwk, ['verify']);
  const ok = await window.crypto.subtle.verify({ name: 'ECDSA', hash: { name: 'SHA-256' } }, key, b64ToBuf(sigB64), new TextEncoder().encode(data));
  return ok;
}

export async function jwkThumbprint(jwk: JsonWebKey) {
  // Compute a simple thumbprint by hashing the canonical JSON of key params
  // For P-256 public keys, use crv, kty, x, y
  const obj: any = { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };
  const s = JSON.stringify(obj);
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return bufToHex(digest).slice(0, 40);
}

// helpers
function bufToHex(buf: ArrayBuffer | Uint8Array) {
  const arr = new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBuf(hex: string) {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  return bytes.buffer;
}

export { b64, b64ToBuf };

// Encrypt arbitrary JSON with a password (PBKDF2 -> AES-GCM). Returns { salt, iv, ciphertext }
export async function encryptJSONWithPassword(obj: any, password: string, saltHex?: string) {
  // If a saltHex is provided, derive the key using that salt instead of a random salt.
  // This allows chaining encryption to depend on a previous hash (useful for simple block chaining).
  const str = JSON.stringify(obj);
  const enc = new TextEncoder();
  const { key, salt } = await deriveKeyFromPassword(password, saltHex);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ct = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(str));
  return { salt, iv: bufToHex(iv.buffer), ciphertext: b64(ct) };
}

export async function decryptJSONWithPassword(blob: { salt: string; iv: string; ciphertext: string }, password: string) {
  return await decryptJwkWithPassword(blob, password); // same logic works since payload is JSON
}

export async function sha256Hex(textOrB64: string) {
  // Accept either raw text or base64 ciphertext; attempt to decode base64 if it looks like base64
  let data: Uint8Array;
  try {
    // crude check: if contains only base64 url chars and has padding or length, treat as base64
    if (/^[A-Za-z0-9+/=]+$/.test(textOrB64)) {
      data = new Uint8Array(atob(textOrB64).split('').map(c => c.charCodeAt(0)));
    } else {
      data = new TextEncoder().encode(textOrB64);
    }
  } catch (e) {
    data = new TextEncoder().encode(textOrB64);
  }
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return bufToHex(digest);
}
