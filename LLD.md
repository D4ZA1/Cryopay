# CryoPay / EcoVault — Low Level Design (LLD)

## 1. Frontend Architecture

### 1.1 Application Entry

| File | Responsibility |
|------|---------------|
| `src/main.tsx` | React 19 DOM root initialization, BrowserRouter mount |
| `src/App.tsx` | Route definitions, ToastContainer, AnimatedBackground |
| `src/index.css` | Global CSS resets and base styles |

**Route Table:**

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `LandingPage` | Marketing / landing |
| `/leaderboard` | `Leaderboard` | Recycling rankings |
| `/coupons` | `Coupons` | Voucher redemption |
| `/test-qr` | `TestQr` | QR scan/generate testing |
| `/bins-admin` | `BinsAdmin` | Admin: bin management |

---

### 1.2 Page Components

#### LandingPage (`src/pages/LandingPage.tsx`)
Orchestrates 12 section components in vertical order:
```
Navbar → HeroSection → TextRevealSection → BinAnimation
→ ValueProposition → HowItWorks → HorizontalFeatures
→ ImpactStats → BlockchainSection → FeaturesSection
→ CTASection → FooterSection
```

#### BinsAdmin (`src/pages/BinsAdmin.tsx` — 16KB)
- Fetches all bins via `getBins()` API
- Generates QR codes via `generateBinQr()` API
- Lists material prices via `getMaterialPrices()` API
- Admin CRUD operations on recycling bins
- Displays QR as `qrcode.react` component

#### TestQr (`src/pages/TestQr.tsx` — 10KB)
- Camera-based QR scanning via `html5-qrcode`
- Calls `submitQrScan()` to claim tokens
- Shows result and balance update

#### Leaderboard (`src/pages/Leaderboard.tsx`)
- Fetches ranked users from backend
- Displays position, username, recycling stats
- Uses TanStack Query for caching

#### Coupons (`src/pages/Coupons.tsx`)
- Fetches available vouchers
- Shows current recycle balance
- Calls `redeemVoucher()` on redemption

---

### 1.3 Component Library

#### shadcn/ui Primitives (`src/components/ui/`)
| Component | Source | Purpose |
|-----------|--------|---------|
| `button.tsx` | Radix + shadcn | Styled button with variants |
| `input.tsx` | Radix + shadcn | Controlled text input |
| `label.tsx` | Radix + shadcn | Accessible form labels |
| `card.tsx` | Radix + shadcn | Content card container |
| `dialog.tsx` | Radix + shadcn | Accessible modal dialogs |
| `checkbox.tsx` | Radix + shadcn | Accessible checkbox |
| `table.tsx` | Radix + shadcn | Data table |
| `separator.tsx` | Radix + shadcn | Visual divider |

#### Modal Components
| Component | Trigger | Content |
|-----------|---------|---------|
| `ConfirmationModal.tsx` | Destructive actions | Yes/No confirmation |
| `ConfirmationModalWithInput.tsx` | Sensitive ops | Confirmation + text input |
| `EmailOtpModal.tsx` | Email verification | OTP input + timer |
| `TransactionPasswordForm.tsx` | Transaction auth | Password entry form |
| `UnlockTransactionModal.tsx` | Wallet unlock | Unlock with password |

---

### 1.4 API Client (`src/lib/api.ts`)

**Pattern:** Generic `apiFetch<T>(endpoint, options)` with:
- Automatic `Authorization: Bearer <token>` injection from `localStorage`
- JSON response parsing
- Standardized error object `{ error: string, status: number }`

**Endpoint Groups:**

| Group | Functions | Endpoint Prefix |
|-------|-----------|----------------|
| Auth | `register`, `login`, `logout`, `changePassword` | `/auth/*` |
| OTP | `sendOtp`, `verifyOtp` | `/auth/otp/*` |
| MFA | `getMfaStatus`, `enableMfa`, `verifyMfa`, `disableMfa` | `/auth/mfa/*` |
| Profile | `getProfile`, `updateProfile`, `searchProfile` | `/profile/*` |
| Wallet | `getWallet` | `/wallet/*` |
| Contacts | `getContacts`, `createContact`, `updateContact`, `deleteContact` | `/contacts/*` |
| QR/Recycle | `submitQrScan`, `getRecycleBalance`, `redeemVoucher` | `/recycle/*` |
| Bins | `generateBinQr`, `getBins`, `getMaterialPrices` | `/bins/*` |
| AMM | `simulateAmmPrice`, `getAmmHistory`, `triggerAmmRecalculate` | `/amm/*` |

---

### 1.5 Cryptography Module (`src/lib/crypto.ts`)

All operations use **Browser WebCrypto API** (no Node.js crypto):

```
Key Generation:
  generateKeyPair()
    → SubtleCrypto.generateKey(ECDSA P-256)
    → Returns { privateKey: CryptoKey, publicKey: CryptoKey }

Key Export:
  exportPublicKeyJwk(key) → JWK object (can be sent to server)
  exportPrivateKeyJwk(key) → JWK object (encrypted before storage)

Password → Encryption Key:
  deriveKey(password, salt)
    → PBKDF2 (SHA-256, 100_000 iterations)
    → Returns AES-GCM CryptoKey

Encrypt Private Key:
  encryptPrivateKey(privateJwk, password)
    → deriveKey(password, random 16-byte salt)
    → AES-GCM encrypt(JSON.stringify(privateJwk), iv=random 12 bytes)
    → Returns { ciphertext: base64, salt: base64, iv: base64 }

Decrypt Private Key:
  decryptPrivateKey(ciphertext, salt, iv, password)
    → deriveKey(password, salt)
    → AES-GCM decrypt
    → Returns privateKey JWK

Sign Data:
  sign(data, privateKey)
    → SubtleCrypto.sign(ECDSA SHA-256, privateKey, data)
    → Returns signature: ArrayBuffer

Hash:
  sha256(data) → hex string

JWK Thumbprint:
  jwkThumbprint(jwk) → SHA-256 of canonical JWK → base64url
```

---

### 1.6 Type System (`src/types/schemas.ts`)

All schemas use **Zod v4** for runtime validation:

```typescript
RegisterInputSchema: {
  username: string (min 3, max 30)
  email: string (email format)
  password: string (min 8)
  publicKeyJwk: JWK object
}

UserSchema: {
  id: string (uuid)
  username: string
  email: string
  createdAt: string (ISO date)
  mfaEnabled: boolean
}

LoginInputSchema: { email, password }
LoginOutputSchema: { token: string, user: UserSchema }

TransactionSchema: {
  id: string
  fromAddress: string
  toAddress: string
  amount: string (decimal)
  currency: CryptoCurrency enum
  status: TransactionStatus enum
  txHash: string | null
  createdAt: string
}

ContactSchema: {
  id: string
  label: ContactLabel enum
  address: string
  publicKeyJwk: JWK | null
  note: string | null
}
```

---

### 1.7 Constants (`src/constants/index.ts`)

```typescript
// Enums
enum TransactionKind { TX, BUY, SELL }
enum TransactionDirection { SEND, RECEIVE }
enum TransactionStatus { PENDING, CONFIRMED, FAILED }
enum CryptoCurrency { ETH, BTC, USDC, USDT }
enum FiatCurrency { USD, EUR, GBP }
enum ContactLabel { PERSONAL, BUSINESS, EXCHANGE, OTHER }
enum ErrorCode { /* 30+ codes: AUTH_*, WALLET_*, TX_*, RECYCLE_*, ... */ }

// Storage Keys (localStorage)
STORAGE_KEYS = {
  TOKEN: 'ecovault_token',
  USER: 'ecovault_user',
  PRIVATE_KEY: 'ecovault_pk_encrypted',
  SALT: 'ecovault_salt',
}

// All API endpoints
API_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  // ... 30+ more
}

// Frontend routes
ROUTES = {
  HOME: '/',
  LEADERBOARD: '/leaderboard',
  COUPONS: '/coupons',
  // ...
}
```

---

## 2. Backend Architecture (Cloudflare Workers)

### 2.1 Service Map

```
Cloudflare Worker (Hono 4.4.5)
├── AuthService
│   ├── POST /auth/register      → bcrypt hash + D1 insert + JWT
│   ├── POST /auth/login         → bcrypt verify + JWT issue
│   ├── POST /auth/logout        → token invalidation
│   ├── POST /auth/otp/send      → TOTP generate + email send
│   ├── POST /auth/otp/verify    → TOTP verify
│   ├── GET  /auth/mfa/status    → check MFA enabled
│   ├── POST /auth/mfa/enable    → store TOTP secret
│   ├── POST /auth/mfa/verify    → verify TOTP token
│   └── POST /auth/mfa/disable   → remove TOTP secret
│
├── ProfileService
│   ├── GET  /profile            → fetch user + wallet address
│   ├── PUT  /profile            → update username/avatar
│   └── GET  /profile/search     → search users by username
│
├── WalletService
│   └── GET  /wallet             → fetch encrypted key + balance
│
├── ContactService
│   ├── GET    /contacts         → list user contacts
│   ├── POST   /contacts         → add contact (resolve address)
│   ├── PUT    /contacts/:id     → update contact label/note
│   └── DELETE /contacts/:id     → remove contact
│
├── TransactionService
│   ├── POST /tx/send            → validate, store, relay to chain
│   ├── GET  /tx/history         → paginated tx list
│   └── GET  /tx/:id             → single transaction detail
│
├── RecycleService
│   ├── POST /recycle/scan       → validate QR, credit tokens via AMM
│   ├── GET  /recycle/balance    → current token balance
│   └── POST /recycle/redeem     → redeem voucher, debit tokens
│
├── BinService
│   ├── GET  /bins               → list all bins
│   ├── POST /bins/:id/qr        → generate signed QR for bin
│   └── GET  /bins/prices        → current material prices
│
├── AmmService
│   ├── POST /amm/simulate       → price simulation for amount
│   ├── GET  /amm/history        → price history chart data
│   └── POST /amm/recalculate    → trigger AMM rebalance
│
├── BlockchainBridgeService
│   ├── On TX: viem writeContract → TransactionRecorder.record()
│   ├── On batch: TransactionRecorder.batchRecord()
│   └── Query: TransactionRecorder.query() / verify()
│
└── EthereumGatewayService
    ├── HTTP/JSON-RPC → Sepolia RPC node
    ├── eth_call → read on-chain state
    ├── sendRawTx → broadcast signed tx
    └── Etherscan API → history, receipts, gas oracle
```

### 2.2 Middleware Stack
```
Request
  → CORS middleware
  → Rate limiting
  → JWT verification (extracting userId)
  → Zod body validation
  → Route handler
  → Response serialization
```

### 2.3 Authentication Detail

```
Email Auth:
  register(email, password, publicKeyJwk)
    → bcrypt(password, 10 rounds) → passwordHash
    → INSERT INTO users (email, passwordHash, publicKeyJwk)
    → sign JWT { userId, email, exp: 7d }

  login(email, password)
    → SELECT user WHERE email
    → bcrypt.compare(password, hash)
    → sign JWT

MetaMask Auth (EIP-191):
  login(address, signature, message)
    → recover signer from signature
    → compare with address
    → sign JWT { userId, address }

MFA (TOTP):
  enable() → generate secret → store encrypted in D1
  verify(token) → TOTP.verify(token, secret)
  On login: if mfaEnabled → require TOTP before JWT
```

---

## 3. Database Schema (Cloudflare D1 · SQLite)

### 3.1 Table Definitions

```sql
-- Core user account
CREATE TABLE users (
  id TEXT PRIMARY KEY,            -- UUID
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,                -- Encrypted TOTP secret
  created_at TEXT DEFAULT (datetime('now'))
);

-- Custodial wallet per user
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  eth_address TEXT UNIQUE NOT NULL,
  public_key_jwk TEXT NOT NULL,   -- ECDSA P-256 public key
  encrypted_private_key TEXT,     -- AES-GCM ciphertext
  salt TEXT,                      -- PBKDF2 salt (base64)
  iv TEXT                         -- AES-GCM IV (base64)
);

-- On-chain and off-chain transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  kind TEXT NOT NULL,             -- TX | BUY | SELL
  direction TEXT NOT NULL,        -- SEND | RECEIVE
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount TEXT NOT NULL,           -- Decimal string (no float)
  currency TEXT NOT NULL,         -- ETH | BTC | USDC | USDT
  status TEXT DEFAULT 'PENDING',
  tx_hash TEXT,                   -- Blockchain tx hash
  block_number INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Block confirmations
CREATE TABLE blocks (
  id TEXT PRIMARY KEY,
  tx_id TEXT REFERENCES transactions(id),
  block_hash TEXT NOT NULL,
  block_number INTEGER NOT NULL,
  confirmed_at TEXT
);

-- Address book
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT REFERENCES users(id),
  label TEXT NOT NULL,            -- PERSONAL | BUSINESS | EXCHANGE | OTHER
  address TEXT NOT NULL,
  public_key_jwk TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Recycling bins
CREATE TABLE bins (
  id TEXT PRIMARY KEY,
  location TEXT NOT NULL,
  material_type TEXT NOT NULL,    -- PLASTIC | METAL | GLASS | PAPER
  active INTEGER DEFAULT 1,
  last_scanned_at TEXT
);

-- QR scan events → token credits
CREATE TABLE recycling_deposits (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  bin_id TEXT REFERENCES bins(id),
  material_type TEXT NOT NULL,
  weight_kg REAL,
  tokens_credited REAL NOT NULL,
  price_at_scan REAL NOT NULL,    -- AMM price at time of scan
  scanned_at TEXT DEFAULT (datetime('now'))
);

-- Voucher redemptions
CREATE TABLE redemptions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  voucher_code TEXT NOT NULL,
  tokens_spent REAL NOT NULL,
  redeemed_at TEXT DEFAULT (datetime('now'))
);

-- AMM price snapshots
CREATE TABLE amm_history (
  id TEXT PRIMARY KEY,
  material_type TEXT NOT NULL,
  price_per_kg REAL NOT NULL,
  volume_24h REAL,
  recorded_at TEXT DEFAULT (datetime('now'))
);

-- Email OTP / session tokens
CREATE TABLE otp_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0
);
```

---

## 4. Smart Contract

### 4.1 CryoPay TransactionRecorder.sol

**Network:** Ethereum Sepolia Testnet  
**Compiler:** Solidity 0.8.28  
**Framework:** Hardhat

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CryoPayTransactionRecorder {

    struct TxRecord {
        string  txId;          // CryoPay internal UUID
        address from;
        address to;
        uint256 amount;        // In wei / smallest unit
        string  currency;      // "ETH" | "USDC" etc.
        uint256 timestamp;
        bytes32 dataHash;      // SHA-256 of off-chain data
    }

    mapping(bytes32 => TxRecord) public records;  // keccak256(txId) → record
    address public owner;

    event TxRecorded(
        string indexed txId,
        address indexed from,
        address indexed to,
        uint256 amount,
        string currency,
        uint256 timestamp
    );

    // Record single transaction
    function record(TxRecord calldata tx) external onlyOwner;

    // Batch record multiple transactions
    function batchRecord(TxRecord[] calldata txs) external onlyOwner;

    // Query a transaction by ID
    function query(string calldata txId) external view returns (TxRecord memory);

    // Verify on-chain existence
    function verify(string calldata txId, bytes32 expectedHash) external view returns (bool);
}
```

---

## 5. AMM (Automated Market Maker) Module

```
Material Type → AMM Price Calculation:
  Inputs:
    - Material type (PLASTIC/METAL/GLASS/PAPER)
    - Current supply in system
    - Demand (recent redemption rate)
    - Base price per kg (from admin config)

  Formula (simplified):
    dynamicPrice = basePricePerKg * (1 + demandFactor) / (1 + supplyFactor)

  Output:
    tokensEarned = weight_kg * dynamicPrice

  Stored:
    → amm_history table (snapshot per calculation)
    → Used for leaderboard relative rankings
```

---

## 6. Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Browser WebCrypto for key ops | Private keys never leave client; no server-side key exposure |
| PBKDF2 (100k iterations) | Resist brute force on encrypted key storage |
| Cloudflare Workers + D1 | Zero cold-start latency, global edge, SQLite simplicity |
| Zod schemas (both FE and BE) | Single source of truth for data shapes, runtime safety |
| Amounts as string/decimal | Avoid float precision bugs in financial calculations |
| Sepolia testnet | Safe staging environment, real chain semantics |
| viem over ethers.js | Lighter, tree-shakeable, type-safe Ethereum client |
| TanStack Query | Caching, background refresh, optimistic updates for all server state |

---

## 7. Security Design

| Threat | Mitigation |
|--------|-----------|
| Private key theft | AES-GCM encrypted in localStorage, password-derived key, never sent to server |
| Session hijacking | Short-lived JWT (7d), HTTPS-only, `Bearer` header (not cookie) |
| Replay attacks | Nonce/timestamp in EIP-191 MetaMask messages |
| XSS | React auto-escaping, no dangerouslySetInnerHTML, CSP headers |
| Brute force | PBKDF2 100k iterations, rate limiting on auth endpoints |
| MFA bypass | TOTP required before JWT on MFA-enabled accounts |
| SQL injection | Parameterized queries via D1 prepared statements |
| QR fraud | Backend validates QR signature before crediting tokens |
