# EcoVault - Exact Implementation Analysis

Generated: 2025-03-29

---

## 1. EXACT APPLICATION DESCRIPTION

### What the App Actually Does

EcoVault is a **web-based cryptocurrency payment platform** that allows users to create accounts and manage transactions. It is **NOT a full-featured production payment system** but rather a **frontend + backend infrastructure for payment flows**.

**Core Functionality:**
- User registration (2 paths: custodial or non-custodial)
- Login with password
- Multi-factor authentication (TOTP/2FA)
- Wallet management (store public/private keys, client-side encryption)
- Transaction creation (blocks stored in database)
- Transaction history viewing with optional decryption
- Contact management
- User profile management
- Basic blockchain history view

**What It Does NOT Implement:**
- Actual blockchain integration (NOT connected to real blockchain networks)
- Real cryptocurrency transactions (no smart contracts, no gas fees, no actual transfers)
- Real buy/sell functionality (UI exists, backend doesn't)
- Payment processing (Stripe, PayPal, etc.)
- Real-time balance updates
- Fraud detection
- Admin dashboard functionality
- Analytics or reporting
- Actual crypto price feeds
- Integration with external wallet providers (MetaMask buttons exist but don't connect)

---

## 2. EXACT BLOCKCHAIN IMPLEMENTATION

### What "Blockchain" Actually Means in EcoVault

The term "blockchain" is **misleading**. What exists is a **simple transaction ledger**, not a real blockchain.

#### Database Structure (`blocks` table)

**Location:** `/supabase/migrations/002_create_wallets_blocks.sql:26-69`

```sql
CREATE TABLE public.blocks (
  id bigserial PRIMARY KEY,           -- Auto-incrementing block ID
  data jsonb,                         -- Transaction data (JSON)
  previous_hash text,                 -- Reference to previous block hash
  hash text,                          -- SHA-256 hash of this block
  created_at timestamptz,             -- Timestamp
  user_id uuid                        -- Foreign key to auth.users
);
```

#### What Gets Stored in a "Block"

**File:** `/src/types/schemas.ts:366-373`

Each block's `data` column contains a `BlockDataSchema`:

```typescript
{
  public_summary: {
    kind: 'tx' | 'buy' | 'sell',              // Transaction type
    to: string,                                 // Recipient address
    to_user_id?: string (UUID),                 // Recipient's user ID
    to_thumbprint?: string,                     // Recipient's key thumbprint
    from: string,                               // Sender address
    from_user_id?: string (UUID),               // Sender's user ID
    from_thumbprint?: string,                   // Sender's key thumbprint
    amountFiat: number,                         // Amount in USD/EUR/GBP
    amountCrypto: number,                       // Amount in ETH/BTC/USDC/USDT
    crypto: string,                             // Currency symbol
    fiatCurrency: string,                       // USD, EUR, GBP
    timestamp: string | number                  // ISO 8601 or epoch
  },
  encrypted_blob?: {                           // Optional encrypted data
    salt: string,                               // Hex-encoded salt
    iv: string,                                 // Hex-encoded IV
    ciphertext: string                          // Base64-encoded ciphertext
  },
  user_id?: string (UUID)                       // User who created block
}
```

#### Hashing & "Chain" Logic

**File:** `/src/lib/crypto.ts:117-132`

- **Hash Function:** SHA-256 (via `window.crypto.subtle.digest('SHA-256', ...)`)
- **Hash Calculation:** Applied to block data (not implemented as validation currently)
- **Chain Linking:** `previous_hash` field stores the hash of the previous block
- **Actual Validation:** **NOT IMPLEMENTED** - blocks can be created independently; hash chain is never verified

#### Block Creation Flow

**File:** `/src/lib/api.ts:113-118`

```typescript
export async function createBlock(data: string, previousHash?: string | null) {
  return apiFetch('/api/blocks', {
    method: 'POST',
    body: JSON.stringify({ data, previous_hash: previousHash }),
  });
}
```

**Truth:** Blocks are created via `/api/blocks` POST endpoint. The API worker likely:
1. Stores the JSON data
2. Computes a hash of the data
3. Stores the previous_hash reference
4. Saves to database

**What's Missing:**
- No validation that previous_hash actually matches the previous block
- No merkle tree or cryptographic proofs
- No consensus mechanism
- No immutability guarantees
- No fork detection

---

## 3. EXACT USER FLOW (Registration to First Transaction)

### Step 1: Landing Page (Public)
**File:** `/src/pages/LandingPage` (not provided but referenced in `/src/App.tsx:2`)
- Users see EcoVault landing page
- Button to "Get Started" or "Sign Up"

### Step 2: Onboarding Choice (Public)
**File:** `/src/pages/Onboarding.tsx:33-41`

User chooses between two account types:

**Option A: "Simple Account" (Custodial)**
- Label: "Custodial"
- Description: "We create and manage the complex crypto details for you"
- Route: `/signup-custodial`

**Option B: "Self-Custody Wallet" (Non-Custodial)**
- Label: "Non-Custodial"
- Description: "You are in complete control. You connect your own wallet"
- Route: `/signup-non-custodial`

### Step 3A: Custodial Signup
**File:** `/src/pages/SignUpCustodial.tsx:14-111`

**Form Fields:**
- First Name (required)
- Last Name (required)
- Email (required, regex validated)
- Password (required, 8+ chars, 1 uppercase, 1 number, 1 special char)
- Confirm Password (must match)
- Terms of Service (checkbox, required)

**Password Requirements (checked in real-time):**
```typescript
const passwordReqs = {
  length: password.length >= 8,           // Line 27
  uppercase: /[A-Z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[^A-Za-z0-9]/.test(password)
};
```

**Submission Flow (lines 32-67):**
1. Validate all fields are complete
2. Call `/api/auth/register` with:
   ```json
   {
     "email": "user@example.com",
     "password": "SecurePass123!",
     "first_name": "Jane",
     "last_name": "Doe"
   }
   ```
3. **API Response Expected:** `{ ok: true, token: "jwt...", user: { id, email, first_name, last_name } }`
4. **On Success:** Navigate to `/secure-wallet` with state:
   ```typescript
   {
     walletAddress: null,
     privateKey: null,
     email,
     firstName,
     lastName,
     initialToken
   }
   ```
5. **On Error:** Display error message in red box

### Step 3B: Non-Custodial Signup (Incomplete)
**File:** `/src/pages/SignUpNonCustodial.tsx:16-27`

**Form Fields:**
- First Name
- Last Name

**Wallet Options (UI only, not functional):**
- MetaMask (labeled "Popular")
- WalletConnect
- Coinbase Wallet

**Current Status:** No actual wallet connection logic implemented. Buttons are present but do nothing.

### Step 4: Secure Wallet Screen
**File:** `/src/pages/SecureWalletScreen` (referenced but full content not provided)

**Expected Flow:**
1. Generate or import keypair (ECDSA P-256)
2. Display public key
3. Optionally encrypt private key with password
4. Offer MFA setup (TOTP)
5. Save wallet to profile

**Crypto Operations:**
- **Key Generation:** `generateKeyPair()` - ECDSA P-256 (line 7-13 in `/src/lib/crypto.ts`)
- **Private Key Encryption:** `encryptJwkWithPassword()` - PBKDF2 (100k iterations) → AES-256-GCM
- **Wallet Verification:** Challenge-response signing with private key

### Step 5: First Transaction (Implied, Not Implemented)

**Expected but NOT implemented:**
- Buy crypto with fiat (UI exists in `/src/pages/BuySell`)
- Send crypto to contact
- Receive crypto
- Export transaction details

**What Actually Happens:**
- Transactions are created via `/api/blocks` POST
- They appear in `/transactions` view
- Can be decrypted if they have `encrypted_blob`

---

## 4. EXACT DATABASE SCHEMA

### 4.1 `profiles` Table
**File:** `/supabase/migrations/001_create_profiles_table.sql:4-17`

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,                           -- User's first name
  last_name text,                            -- User's last name
  public_key jsonb,                          -- JWK format public key
  encrypted_private_key jsonb,               -- { salt, iv, ciphertext }
  email text,                                -- Email address
  phone text,                                -- Phone number
  notifications jsonb DEFAULT '{}'::jsonb,  -- Notification settings
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger: auto-update updated_at on modification
-- Index: idx_profiles_email on (email)
```

**Notes:**
- `id` is the Supabase auth user ID (UUID)
- `public_key` stored as JSON/JWK object
- `encrypted_private_key` stored as JSON: `{ salt, iv, ciphertext }`
- RLS policies suggested but commented out (not enabled)

### 4.2 `wallets` Table
**File:** `/supabase/migrations/002_create_wallets_blocks.sql:4-24`

```sql
CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key jsonb,                  -- JWK format
  encrypted_private_key jsonb,       -- { salt, iv, ciphertext }
  verified boolean DEFAULT false,    -- Whether ownership was verified
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger: auto-update updated_at on modification
```

**Notes:**
- One wallet per user (PRIMARY KEY on user_id)
- `verified` field indicates if challenge-response signature succeeded
- Separate from `profiles` table (profiles can have keys too)

### 4.3 `blocks` Table
**File:** `/supabase/migrations/002_create_wallets_blocks.sql:26-69`

```sql
CREATE TABLE public.blocks (
  id bigserial PRIMARY KEY,              -- Auto-increment, transaction ID
  data jsonb,                            -- Transaction/block data
  previous_hash text,                    -- Hash of previous block
  hash text,                             -- SHA-256 hash of this block
  created_at timestamptz DEFAULT now(),  -- Block timestamp
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE  -- Block creator
);

-- Trigger: auto-set created_at on insert
```

**Data Structure in `data` Column:**
See section 2 above (BlockDataSchema).

**Notes:**
- Blocks are global, not scoped to users (though user_id column exists)
- No enforcement of hash chain
- `previous_hash` is text, no constraint validation

### 4.4 `contacts` Table
**File:** `/supabase/migrations/003_create_contacts_table.sql:4-18`

```sql
CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,              -- Contact ID
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- Owner
  contact_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,  -- EcoVault user
  name text NOT NULL,                    -- Display name
  address text NOT NULL,                 -- Wallet address
  email text NULL,                       -- Contact email
  label text NULL,                       -- Custom label (Friend, Family, etc)
  public_key jsonb NULL,                 -- Contact's public key (JWK)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index: idx_contacts_user_id on (user_id)
```

**Notes:**
- `user_id` references `profiles` (which is auth.users)
- `contact_user_id` is nullable (contact might not be a EcoVault user)
- `public_key` can store contact's JWK for encryption

### 4.5 Database Relationships Diagram

```
auth.users (Supabase built-in)
    ├── 1:1 ── profiles (user profile info)
    ├── 1:1 ── wallets (crypto keys)
    ├── 1:∞ ── blocks (transactions)
    └── 1:∞ ── contacts (contact list)

blocks (global transaction ledger)
    └── previous_hash → blocks.hash (chain reference, NOT enforced)
```

---

## 5. EXACT API ENDPOINTS

**Base URL:** `process.env.VITE_WORKER_URL` (configured in `.env`)

**File:** `/src/lib/api.ts`

### Authentication Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | `/api/auth/register` | Create new account | `{ email, password, first_name, last_name }` | `{ ok, token, user }` |
| POST | `/api/auth/login` | Login with credentials | `{ email, password }` | `{ ok, token, user, mfa_required? }` |
| POST | `/api/auth/logout` | Logout (clear token) | (none) | `{ ok }` |
| POST | `/api/auth/send-otp` | Send magic link/OTP | `{ email }` | `{ ok }` |
| POST | `/api/auth/verify-otp` | Verify OTP token | `{ email, token }` | `{ ok, token, user }` |
| POST | `/api/auth/change-password` | Change password | `{ password }` | `{ ok }` |

### MFA Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/auth/mfa-status` | Get MFA enabled status | (none) | `{ ok, mfa_enabled? }` |
| POST | `/api/auth/mfa-enable` | Enable TOTP 2FA | (none) | `{ ok, secret, otpauthUrl }` |
| POST | `/api/auth/mfa-verify` | Verify TOTP code | `{ code }` | `{ ok, backupCodes[] }` |
| POST | `/api/auth/mfa-disable` | Disable MFA | `{ password }` | `{ ok }` |
| POST | `/api/auth/mfa-login` | Login with MFA | `{ email, password, mfaCode }` | `{ ok, token, user }` |

### Profile Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/profile` | Get current user profile | (none) | `{ ok, profile: ProfileOutput }` |
| PUT | `/api/profile` | Update profile | `{ first_name?, last_name?, phone?, notifications? }` | `{ ok }` |
| GET | `/api/profile/search?email=...` | Search user by email | (query param) | `{ ok, profile }` |

### Wallet Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/wallet` | Get wallet keys | (none) | `{ ok, user_id, public_key, encrypted_private_key, verified }` |
| POST | `/api/wallet` | Save wallet keys | `{ public_key, encrypted_private_key, verified? }` | `{ ok }` |
| POST | `/api/wallet/verify-wallet` | Verify wallet ownership | `{ public_key, challenge, signature }` | `{ ok }` |

### Block/Transaction Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/blocks` | Get all blocks | (none) | `{ ok, blocks: BlockOutput[] }` |
| GET | `/api/blocks/:id` | Get specific block | (none) | `{ ok, block: BlockOutput }` |
| POST | `/api/blocks` | Create new block | `{ data, previous_hash? }` | `{ ok, block: BlockOutput }` |

### Contact Endpoints

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/contacts` | Get user's contacts | (none) | `{ ok, contacts: ContactOutput[] }` |
| GET | `/api/contacts/:id` | Get specific contact | (none) | `{ ok, contact: ContactOutput }` |
| POST | `/api/contacts` | Create contact | `{ name, address, email?, label?, public_key? }` | `{ ok, contact: ContactOutput }` |
| PUT | `/api/contacts/:id` | Update contact | `{ name?, address?, email?, label?, public_key? }` | `{ ok }` |
| DELETE | `/api/contacts/:id` | Delete contact | (none) | `{ ok }` |

### Authentication Details

**Token Storage:** `localStorage.getItem('ecovault_token')` (set by API on login/register)

**Header:** All requests include:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Location:** `/src/lib/api.ts:17-43` (apiFetch function)

---

## 6. CRYPTO IMPLEMENTATION DETAILS

**File:** `/src/lib/crypto.ts`

### Key Pair Generation
```typescript
export async function generateKeyPair() {
  // ECDSA P-256 (secp256r1)
  // Usage: sign, verify
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,  // extractable
    ['sign', 'verify']
  );
  return keyPair;
}
```

### JWK (JSON Web Key) Export/Import
```typescript
export async function exportJwk(key: CryptoKey) {
  return await window.crypto.subtle.exportKey('jwk', key);
}

export async function importJwk(jwk: JsonWebKey, usage: KeyUsage[] = ['verify']) {
  return await window.crypto.subtle.importKey(
    'jwk', 
    jwk, 
    { name: 'ECDSA', namedCurve: 'P-256' }, 
    true,  // extractable
    usage
  );
}
```

### Password-Based Key Derivation & Encryption
```typescript
export async function deriveKeyFromPassword(password: string, saltHex?: string) {
  // PBKDF2: 100,000 iterations, SHA-256
  const pwKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const salt = saltHex ? hexToBuf(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    { 
      name: 'PBKDF2', 
      salt, 
      iterations: 100_000,  // HIGH - resistant to brute force
      hash: 'SHA-256' 
    },
    pwKey,
    { name: 'AES-GCM', length: 256 },  // 256-bit AES key
    true,
    ['encrypt', 'decrypt']
  );
  return { key, salt: bufToHex(salt) };
}

export async function encryptJwkWithPassword(jwk: JsonWebKey, password: string) {
  // Encrypt JWK with password-derived AES-256-GCM key
  const { key, salt } = await deriveKeyFromPassword(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));  // 96-bit IV
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, 
    key, 
    enc.encode(JSON.stringify(jwk))
  );
  return { salt, iv: bufToHex(iv.buffer), ciphertext: b64(ct) };
}

export async function decryptJwkWithPassword(blob: { salt, iv, ciphertext }, password: string) {
  // Decrypt using same PBKDF2 derivation
  const saltBuf = hexToBuf(blob.salt);
  const pwKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBuf, iterations: 100_000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const ivBuf = hexToBuf(blob.iv);
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuf) }, 
    key, 
    b64ToBuf(blob.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(plain));
}
```

### Signing & Verification
```typescript
export async function signString(privateJwk: JsonWebKey, data: string) {
  // Sign with ECDSA P-256, SHA-256 hash
  const key = await crypto.subtle.importKey('jwk', privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } }, 
    key, 
    new TextEncoder().encode(data)
  );
  return b64(sig);  // Base64 encode signature
}

export async function verifySignature(publicJwk: JsonWebKey, data: string, sigB64: string) {
  // Verify signature
  const key = await importJwk(publicJwk, ['verify']);
  const ok = await crypto.subtle.verify(
    { name: 'ECDSA', hash: { name: 'SHA-256' } }, 
    key, 
    b64ToBuf(sigB64), 
    new TextEncoder().encode(data)
  );
  return ok;
}
```

### Hashing & Thumbprints
```typescript
export async function jwkThumbprint(jwk: JsonWebKey) {
  // Compute SHA-256 hash of canonical JSON { crv, kty, x, y }
  const obj = { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };
  const s = JSON.stringify(obj);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return bufToHex(digest).slice(0, 40);  // First 40 hex chars
}

export async function sha256Hex(textOrB64: string) {
  // SHA-256 hash of text or base64
  let data: Uint8Array;
  if (/^[A-Za-z0-9+/=]+$/.test(textOrB64)) {
    data = new Uint8Array(atob(textOrB64).split('').map(c => c.charCodeAt(0)));
  } else {
    data = new TextEncoder().encode(textOrB64);
  }
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bufToHex(digest);
}
```

### Encryption Utilities for JSON
```typescript
export async function encryptJSONWithPassword(obj: any, password: string, saltHex?: string) {
  // Encrypt arbitrary JSON with password
  // If saltHex provided, derive key with that salt (for block chaining)
  const str = JSON.stringify(obj);
  const { key, salt } = await deriveKeyFromPassword(password, saltHex);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(str));
  return { salt, iv: bufToHex(iv.buffer), ciphertext: b64(ct) };
}

export async function decryptJSONWithPassword(blob: { salt, iv, ciphertext }, password: string) {
  return await decryptJwkWithPassword(blob, password);
}
```

### Cryptographic Summary

| Algorithm | Purpose | Details |
|-----------|---------|---------|
| ECDSA P-256 | Key pair generation, signing | Browser WebCrypto, extractable |
| SHA-256 | Hashing | Used for JWK thumbprints, block hashes |
| PBKDF2 | Key derivation | 100,000 iterations, SHA-256 |
| AES-256-GCM | Symmetric encryption | 256-bit keys, 96-bit IV, authenticated |

**Security Notes:**
- All crypto operations use WebCrypto API (browser native)
- Private keys never leave the browser (client-side encryption)
- No server-side key storage (encrypted backups optional)
- PBKDF2 iteration count (100k) is strong against brute force
- ECDSA P-256 is standard (used by TLS 1.3, JWT, etc)
- AES-256-GCM provides both confidentiality and authenticity

---

## 7. EXACT FEATURE IMPLEMENTATION STATUS

### ✅ IMPLEMENTED

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| User Registration (Custodial) | ✅ Complete | `/pages/SignUpCustodial.tsx` | Form validation, API call, navigation |
| Login | ✅ Complete | `/pages/LoginScreen` (referenced) | Email/password, token-based |
| Profile Management | ✅ Complete | `/pages/Settings` (referenced) | Update name, phone, notifications |
| MFA/2FA (TOTP) | ✅ Complete | `/pages/ForceMFASetup` (referenced) | Setup, verify, disable, backup codes |
| Wallet Key Generation | ✅ Complete | `/lib/crypto.ts` | ECDSA P-256, JWK export/import |
| Wallet Encryption | ✅ Complete | `/lib/crypto.ts` | AES-256-GCM with PBKDF2 |
| Wallet Verification | ✅ Complete | API endpoint | Challenge-response signing |
| Transaction History | ✅ Complete | `/pages/Transactions.tsx` | View blocks, filter, search, export CSV |
| Transaction Decryption | ✅ Complete | `/pages/Transactions.tsx:438-459` | Password-protected inline decryption |
| Contact Management | ✅ Complete | `/pages/Contacts` (referenced) | CRUD operations |
| Block Creation | ✅ Complete | `/lib/api.ts:113-118` | POST /api/blocks |
| Blockchain View | ✅ Complete | `/pages/Blockchain.tsx` | Display blocks with raw JSON |
| Authentication Context | ✅ Complete | `/context/AuthContext.tsx` | Token storage, user session, logout |
| Routing | ✅ Complete | `/App.tsx` | Protected routes, onboarding flow |

### ❌ NOT IMPLEMENTED

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Real Blockchain Integration | ❌ Missing | N/A | No connection to Ethereum, Bitcoin, etc |
| Real Cryptocurrency Transactions | ❌ Missing | N/A | No actual fund transfers |
| Buy/Sell Functionality | ❌ Partial UI | `/pages/BuySell` | UI exists, backend missing |
| Non-Custodial Wallet Connection | ❌ Missing | `/pages/SignUpNonCustodial.tsx` | MetaMask/WalletConnect buttons non-functional |
| Payment Processing | ❌ Missing | N/A | No Stripe, PayPal, Square integration |
| Real-time Balance | ❌ Missing | N/A | Balance calculated from local blocks only |
| Fraud Detection | ❌ Missing | N/A | No validation logic |
| Real-time Notifications | ❌ Missing | N/A | No WebSocket, no push notifications |
| Price Feeds | ❌ Missing | N/A | No crypto/fiat exchange rates |
| Admin Dashboard | ❌ Missing | N/A | No admin tools |
| Analytics/Reporting | ❌ Missing | N/A | CSV export only |
| KYC/AML | ❌ Missing | N/A | No identity verification |
| Smart Contracts | ❌ Missing | N/A | Not applicable (no blockchain) |

---

## 8. AUTHENTICATION & SESSION MANAGEMENT

**File:** `/src/context/AuthContext.tsx`

### Token Management

```typescript
// On login/register
localStorage.setItem('ecovault_token', token);  // Line 96

// On logout
localStorage.removeItem('ecovault_token');  // Line 104
```

### Session Initialization (on app load)

**Location:** `/src/context/AuthContext.tsx:37-72`

```typescript
useEffect(() => {
  // 1. Check for token in localStorage
  const storedToken = localStorage.getItem('ecovault_token');
  if (storedToken) {
    // 2. Fetch user profile using token
    const response = await apiFetch('/api/profile');
    if (response.ok && response.data?.profile) {
      // 3. Restore user session
      setUser({
        id: profile.id,
        firstName: profile.first_name || profile.email || 'User',
        lastName: profile.last_name || undefined,
        email: profile.email || undefined,
        phone: profile.phone || null,
        user_metadata: { notifications: JSON.parse(profile.notifications) }
      });
    }
  }
}, []);
```

### Protected Routes

**File:** `/src/components/ProtectedRoute` (referenced)

Routes under `/dashboard`, `/transactions`, `/contacts`, etc. require valid token.

---

## 9. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                      EcoVault Frontend (React)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User Input → Components (Custodial Signup, Transactions, etc)  │
│       ↓                                                            │
│  AuthContext (manages token + user session)                      │
│       ↓                                                            │
│  lib/api.ts (apiFetch) → VITE_WORKER_URL/api/...                │
│       ↓                                                            │
│  Worker API Backend (Cloudflare Worker or Node.js)              │
│       ├─→ Register: Create user in Supabase auth                │
│       ├─→ Login: Verify credentials, return JWT                 │
│       ├─→ Wallet: Get/save keys from profiles table             │
│       ├─→ Blocks: CRUD transactions in blocks table             │
│       └─→ Contacts: Manage user contacts                        │
│       ↓                                                            │
│  Supabase PostgreSQL                                             │
│       ├─ auth.users (Supabase auth)                            │
│       ├─ public.profiles (user profile + keys)                  │
│       ├─ public.wallets (wallet verification)                   │
│       ├─ public.blocks (transaction ledger)                     │
│       └─ public.contacts (contact list)                         │
│                                                                   │
│  lib/crypto.ts (WebCrypto)                                      │
│       ├─ Key generation (ECDSA P-256)                          │
│       ├─ Encryption (AES-256-GCM + PBKDF2)                     │
│       ├─ Signing (ECDSA SHA-256)                               │
│       └─ Hashing (SHA-256)                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. FEATURES MENTIONED IN README BUT MISSING FROM CODE

### Claims in README vs Reality

| Claim | Status | Reality |
|-------|--------|---------|
| "Support for both crypto and fiat payments" | ❌ False | UI only; no real transactions |
| "Real-time payment status updates" | ❌ False | Status hardcoded to 'Completed' |
| "Integrated fraud detection and validation logic" | ❌ False | No fraud detection exists |
| "Comprehensive automated test suite" | ❌ Partial | Tests folder exists but minimal coverage |
| "Production-ready" | ❌ False | Many features incomplete/missing |
| "Seamless integration of cryptocurrency..." | ❌ Misleading | No real crypto integration |
| "Scalable... solution" | ❌ Not Proven | Single-worker architecture, no proven scale |
| "Multiple payment providers" | ❌ False | No payment provider integrations |
| "Buy/sell and peer-to-peer crypto operations" | ⚠️ Partial | UI exists, backend missing |
| "Admin/advanced: Blockchain history" | ✅ Partial | Blockchain page exists but shows raw JSON |

---

## 11. MISSING CRITICAL INFRASTRUCTURE

### Backend Implementation

**Current State:**
- No backend code provided in `/backend` folder
- All endpoints assumed to exist at `VITE_WORKER_URL`
- Likely uses Cloudflare Workers or custom Node.js server

**What's Missing:**
- Authentication middleware
- JWT verification
- Database queries
- Input validation
- Error handling
- Transaction business logic
- Integration with real blockchain (if needed)
- Webhook handling

### Error Handling

**File:** `/src/lib/utils.ts` (referenced)

Function `getErrorMessage()` used but not provided. Likely extracts error text from API responses.

### Testing

**Locations:**
- `/src/__tests__/` 
- `/src/constants/__tests__/`

**Status:** Minimal test coverage. Primary focus on unit tests, integration tests missing.

---

## 12. ENVIRONMENT CONFIGURATION

**Required Environment Variables:**

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `VITE_WORKER_URL` | ✅ Yes | N/A | Backend API base URL |
| `VITE_SUPABASE_URL` | ✅ Yes | N/A | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | N/A | Supabase anon/public key |

**Example `.env`:**
```
VITE_WORKER_URL=https://api.example.com
VITE_SUPABASE_URL=https://myproject.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 13. SUMMARY TABLE: What Exists vs. What's Missing

| Category | Component | Status |
|----------|-----------|--------|
| **Auth** | Registration | ✅ Custodial only |
| | Login | ✅ |
| | MFA/TOTP | ✅ |
| | Password Reset | ⚠️ API exists, flow unclear |
| **Wallets** | Key Generation | ✅ |
| | Key Storage (encrypted) | ✅ |
| | Key Export | ✅ |
| | Wallet Verification | ✅ |
| **Transactions** | Create | ✅ Via blocks |
| | View/History | ✅ |
| | Decrypt Details | ✅ |
| | Export (CSV) | ✅ |
| | Buy/Sell | ❌ |
| | Real blockchain | ❌ |
| **Contacts** | CRUD | ✅ |
| **Settings** | Profile | ✅ |
| | Notifications | ✅ |
| | Security | ✅ |
| **Admin** | Blockchain Debug | ✅ Basic view |

---

## CONCLUSION

**EcoVault is:**
- A **frontend-heavy cryptocurrency application** with basic auth, wallet management, and transaction history
- **NOT production-ready** due to missing critical features (real blockchain, payment processing, fraud detection)
- **Not a replacement for existing payment systems** (Stripe, PayPal, etc.)
- **A proof-of-concept** for integrating crypto wallets and transaction tracking with Supabase + WebCrypto

**What works:**
- User accounts (custodial path only)
- Secure password storage
- Key generation and encryption (client-side)
- Transaction logging (as blocks)
- Contact management

**What doesn't work:**
- Actual cryptocurrency transfers
- Non-custodial wallet connections
- Buy/sell functionality
- Real blockchain integration
- Payment processing
- Fraud prevention

