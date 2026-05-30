# CryoPay - Quick Reference: What's Real vs. Marketing

## TL;DR

| Aspect | Marketing Claim | Reality |
|--------|-----------------|---------|
| **What it is** | "Production-ready payment platform" | Reference frontend for crypto wallet management |
| **Blockchain** | "Integrated blockchain features" | Simple transaction ledger (not real blockchain) |
| **Transactions** | "Seamless crypto payment workflows" | Store transaction data in database, no actual transfers |
| **Wallets** | "Secure key management" | ✅ ECDSA P-256, AES-256-GCM encryption (REAL) |
| **Auth** | "Secure authentication" | ✅ Email/password + 2FA (REAL) |
| **Buy/Sell** | "Buy/sell operations" | UI buttons exist, backend missing |
| **Non-custodial** | "Connect your own wallet" | MetaMask buttons don't connect |
| **Payment Processing** | "Multiple payment providers" | Not implemented |
| **Fraud Detection** | "Integrated fraud detection" | Doesn't exist |
| **Production Ready** | "Production-ready" | ❌ Missing backend, compliance, audits |

---

## What You Can Actually Build With This

✅ **User authentication system** (email/password + 2FA)
✅ **Secure key storage** (ECDSA key generation + AES encryption)
✅ **Transaction history UI** (view and search blocks)
✅ **Contact management** (CRUD contacts)
✅ **User profile management** (name, phone, preferences)
✅ **Export transactions** (CSV)

---

## What's Missing (What You Need to Build)

❌ **Backend API** - All `/api/*` endpoints
❌ **Real blockchain** - If you want actual crypto transactions
❌ **Payment processing** - Stripe, PayPal, etc.
❌ **Non-custodial wallets** - MetaMask/WalletConnect integration
❌ **Buy/Sell flow** - The actual fiat-to-crypto conversion
❌ **Fraud detection** - Risk scoring, velocity checks
❌ **Compliance** - KYC, AML, regulations
❌ **Production security** - Audit, penetration testing

---

## Code Locations Quick Map

### Authentication
- **Login/Register logic**: `/src/lib/api.ts:45-63`
- **Session management**: `/src/context/AuthContext.tsx`
- **Login page**: `/src/pages/LoginScreen`
- **Signup (custodial)**: `/src/pages/SignUpCustodial.tsx`

### Wallet/Crypto
- **Key generation**: `/src/lib/crypto.ts:7-14`
- **Encryption**: `/src/lib/crypto.ts:38-66`
- **Signing**: `/src/lib/crypto.ts:68-78`
- **Wallet API**: `/src/lib/api.ts:82-102`

### Transactions
- **Block API**: `/src/lib/api.ts:105-118`
- **Transaction view**: `/src/pages/Transactions.tsx`
- **Transaction decryption**: `/src/pages/Transactions.tsx:438-459`

### Database
- **Users/profiles**: `/supabase/migrations/001_create_profiles_table.sql`
- **Wallets**: `/supabase/migrations/002_create_wallets_blocks.sql:4-24`
- **Blocks**: `/supabase/migrations/002_create_wallets_blocks.sql:26-69`
- **Contacts**: `/supabase/migrations/003_create_contacts_table.sql`

### UI
- **Onboarding**: `/src/pages/Onboarding.tsx`
- **Routes**: `/src/App.tsx`
- **Protected routes**: `/src/components/ProtectedRoute`
- **Auth context**: `/src/context/AuthContext.tsx`

---

## API Endpoints You Must Implement

### Auth (11 endpoints)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/send-otp
POST   /api/auth/verify-otp
POST   /api/auth/change-password
GET    /api/auth/mfa-status
POST   /api/auth/mfa-enable
POST   /api/auth/mfa-verify
POST   /api/auth/mfa-disable
POST   /api/auth/mfa-login
```

### Profile (3 endpoints)
```
GET    /api/profile
PUT    /api/profile
GET    /api/profile/search?email=...
```

### Wallet (3 endpoints)
```
GET    /api/wallet
POST   /api/wallet
POST   /api/wallet/verify-wallet
```

### Blocks/Transactions (3 endpoints)
```
GET    /api/blocks
GET    /api/blocks/:id
POST   /api/blocks
```

### Contacts (5 endpoints)
```
GET    /api/contacts
GET    /api/contacts/:id
POST   /api/contacts
PUT    /api/contacts/:id
DELETE /api/contacts/:id
```

---

## Key Code Snippets

### How Auth Token Works
```typescript
// From /src/lib/api.ts:17-43
const token = localStorage.getItem('cryopay_token');
headers.Authorization = `Bearer ${token}`;
```

### How Keys Are Encrypted
```typescript
// From /src/lib/crypto.ts:38-45
// PBKDF2 (100k iterations) derives key from password
// AES-256-GCM encrypts the private key
// Returns: { salt, iv, ciphertext }
```

### How Transactions Are Stored
```typescript
// From /src/types/schemas.ts:366-373
{
  public_summary: {
    kind: 'tx',
    to: '0x...',
    from: '0x...',
    amountFiat: 100,
    amountCrypto: 0.05,
    crypto: 'ETH',
    fiatCurrency: 'USD',
    timestamp: '2025-03-29T...'
  },
  encrypted_blob?: { salt, iv, ciphertext }
}
```

### How Balance Is Calculated
```typescript
// From /src/pages/Transactions.tsx:166-172
const relevant = rows.filter((r) => r.relevant);
const bal = relevant.reduce((acc, r) => acc + (r.amountUSD || 0), 0);
setBalance(bal);
```

---

## Environment Variables

```bash
VITE_WORKER_URL=https://your-backend-api.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

All three **required**. No defaults.

---

## Database Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `auth.users` | Supabase auth | id, email, password_hash |
| `profiles` | User info | id, first_name, last_name, public_key, encrypted_private_key |
| `wallets` | Wallet verification | user_id, public_key, verified |
| `blocks` | Transaction ledger | id, data (JSON), previous_hash, hash |
| `contacts` | Contact lists | id, user_id, name, address, public_key |

---

## Features Status Matrix

| Feature | Works? | Location | Notes |
|---------|--------|----------|-------|
| Email/password signup | ✅ | SignUpCustodial.tsx | Custodial only |
| Email/password login | ✅ | LoginScreen | Works |
| 2FA/TOTP | ✅ | ForceMFASetup | Setup + verify + disable |
| Key generation | ✅ | crypto.ts | ECDSA P-256 |
| Key encryption | ✅ | crypto.ts | AES-256-GCM + PBKDF2 |
| Wallet verification | ✅ | api.ts | Challenge-response |
| Create transactions | ✅ | api.ts | POST /api/blocks |
| View transactions | ✅ | Transactions.tsx | Search + filter |
| Decrypt transactions | ✅ | Transactions.tsx | Password-protected |
| Export CSV | ✅ | Transactions.tsx | CSV download |
| Manage contacts | ✅ | Contacts | CRUD |
| Update profile | ✅ | Settings | Name, phone, etc |
| Real blockchain | ❌ | N/A | Not connected |
| Real transactions | ❌ | N/A | Logged only |
| Buy/sell | ❌ | BuySell.tsx | UI only |
| Non-custodial | ❌ | SignUpNonCustodial | UI only |
| External wallets | ❌ | N/A | Not integrated |
| Payment processing | ❌ | N/A | Not implemented |

---

## Getting Started (What Works)

1. **Clone & install**
   ```bash
   git clone [repo]
   npm install
   ```

2. **Set env vars**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Run frontend**
   ```bash
   npm run dev
   ```

4. **Frontend works, but you need backend**
   - Implement all 25 API endpoints
   - Connect Supabase
   - Add business logic

5. **Test the flow**
   - Signup custodial path works
   - Login works
   - Key generation/encryption works
   - Transaction logging works

---

## The Honest Summary

**CryoPay is:**
- A well-architected React frontend
- With secure crypto operations (real ECDSA + AES)
- With proper auth/2FA scaffolding
- With transaction tracking UI
- Missing the backend to do anything real

**Before production:**
- ✅ Keep: Auth flow, key generation, UI
- ❌ Add: Backend API implementation
- ❌ Add: Real blockchain integration (if needed)
- ❌ Add: Payment processing
- ❌ Add: Compliance & security audit
- ❌ Add: Fraud detection

**Bottom line:** This is a **frontend reference implementation**, not a complete payment system.

