# CryoPay

## Overview

**CryoPay** is a complete cryptocurrency wallet and transaction management platform consisting of:
- **Frontend**: React/TypeScript web application with secure client-side key management
- **Backend**: Cloudflare Workers API with D1 SQLite database

It provides a complete onboarding flow, secure account management, wallet key generation with client-side encryption, multi-factor authentication (2FA), transaction tracking, and contact management.

⚠️ **Important:** This is a reference implementation demonstrating best practices for secure crypto wallet handling. It is **not** a complete production payment platform. Real blockchain integration, payment processing, and compliance measures are not included and must be implemented separately.

## What CryoPay Does

### ✅ Implemented & Working

**User Accounts:**
- Email/password registration and login with PBKDF2 password hashing (100k iterations)
- JWT token-based authentication (HS256, 7-day expiration)
- Token refresh endpoint to extend sessions
- Multi-factor authentication (TOTP/2FA) with RFC 6238 compliance
- Backup codes for account recovery
- Email-based OTP magic links (tokens stored in DB, email delivery TODO)
- Profile management (name, phone, notifications, MFA status)
- Session persistence via localStorage and HTTP-only cookies

**Wallet Management:**
- ECDSA P-256 key pair generation (entirely client-side, using WebCrypto)
- JWK format key export/import
- Password-protected key encryption (PBKDF2 with 100,000 iterations + AES-256-GCM)
- Wallet verification via challenge-response signing
- **Private keys never leave the browser** (client-side encryption only)
- Server stores encrypted backups (with user password, server cannot decrypt)

**Transactions:**
- Transaction creation as immutable blocks with SHA-256 hashing
- Block chain with `previous_hash` references (stored but not validated)
- Transaction history viewing, search, and filtering
- CSV export of transaction records
- Optional password-protected decryption of transaction details
- Transaction classification (Sent, Received, Buy, Sell)
- Balance calculation from transaction history

**Contacts & Social:**
- Create, read, update, delete user contacts
- Store contact addresses, email, labels, and public keys
- Link contacts to other CryoPay users
- Search and auto-link CryoPay users by email

**Security:**
- PBKDF2-SHA256 password hashing with 100,000 iterations
- JWT tokens with HS256 signature verification
- TOTP 2FA with time-step tolerance (±1 for clock drift)
- Request input validation (Zod schemas)
- Database prepared statements (no SQL injection)

### ❌ Not Implemented

**Real Blockchain:**
- ❌ No connection to Ethereum, Bitcoin, or other blockchains
- ❌ Transactions are stored as JSON blocks, not submitted to any blockchain
- ❌ No hash chain validation (previous_hash is stored but not enforced)
- ❌ No consensus mechanism
- ❌ No immutability guarantees beyond database constraints

**Cryptocurrency Integration:**
- ❌ MetaMask/WalletConnect buttons exist but are non-functional
- ❌ Non-custodial wallet flows are incomplete
- ❌ No actual blockchain transaction submission
- ❌ No gas fee handling or chain interaction

**Payment Processing:**
- ❌ No Stripe, PayPal, or other payment processor integration
- ❌ Buy/Sell UI exists but backend is missing
- ❌ No fiat-to-crypto or crypto-to-fiat conversion
- ❌ No real payment authorization or settlement

**Security & Compliance:**
- ❌ No fraud detection or transaction validation
- ❌ No KYC/AML (Know Your Customer / Anti-Money Laundering)
- ❌ No transaction velocity checks
- ❌ No rate limiting on auth endpoints
- ❌ No refresh token rotation
- ❌ Not audited; reference implementation only

**Infrastructure:**
- ❌ Email delivery (OTP tokens stored but not sent)
- ❌ Real-time notifications (WebSocket, push notifications)
- ❌ Admin dashboard or analytics tools
- ❌ CSV export only for transaction reporting
- ❌ Database-level row-level security (app-level only)

## Technology Stack

### Frontend

- **React** 18+ (functional components, hooks)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Framer Motion** for animations
- **Lucide React** for icons
- **Radix UI** for accessible components
- **Vite** as build tool
- **Vitest** for testing

### Backend

- **Hono** 4.4.5 (lightweight web framework for Cloudflare Workers)
- **Cloudflare Workers** (edge computing runtime)
- **D1** (Cloudflare's SQLite database)
- **TypeScript** 5.4.5
- **Zod** for request/response validation
- **Wrangler** 4.77.0 (Cloudflare CLI)

### Cryptography (All Client-Side)

- **WebCrypto API** (browser native, no external libs)
- **ECDSA P-256** for key generation and signing
- **AES-256-GCM** for symmetric encryption
- **PBKDF2-SHA256** for password hashing (100,000 iterations)
- **SHA-256** for block hashing
- **HMAC-SHA1** for TOTP verification
- **HMAC-SHA256** for JWT signing

## Project Structure

```
/CryoPay                            # Frontend React app
├── src/
│   ├── components/                 # React components
│   ├── pages/                      # Page routes
│   │   ├── Onboarding.tsx         # Account type selection
│   │   ├── SignUpCustodial.tsx    # Custodial signup form
│   │   ├── Transactions.tsx       # Transaction history
│   │   ├── Blockchain.tsx         # Block explorer
│   │   ├── Contacts.tsx           # Contact management
│   │   ├── Wallet.tsx             # Wallet management
│   │   └── Dashboard.tsx          # User dashboard
│   ├── context/                    # React context (Auth)
│   ├── lib/
│   │   ├── api.ts                 # API client
│   │   ├── crypto.ts              # Cryptographic operations
│   │   └── symmetricSession.ts    # Session key management
│   ├── types/schemas.ts           # Zod schemas & types
│   └── main.tsx                   # Entry point
├── public/                         # Static assets
├── tests/                          # Test suites
├── package.json
├── tsconfig.json
└── README.md

/cryo-worker                        # Backend Cloudflare Workers
├── src/
│   ├── index.ts                   # Hono app setup
│   ├── db/schema.ts               # Database types
│   ├── middleware/
│   │   └── auth.ts                # JWT validation & authMiddleware
│   ├── routes/
│   │   ├── auth.ts                # Auth endpoints (register, login, MFA, OTP)
│   │   ├── profile.ts             # Profile management
│   │   ├── wallet.ts              # Wallet endpoints
│   │   ├── blocks.ts              # Block/transaction endpoints
│   │   └── contacts.ts            # Contact management
│   ├── constants/index.ts         # Error codes, HTTP status codes
│   └── schemas/index.ts           # Zod validation schemas
├── migrations/
│   ├── 0001_initial_schema.sql    # tables: profiles, wallets, blocks, contacts
│   ├── 0002_add_password_hash.sql # password_hash column
│   ├── 0003_add_otp_tokens.sql    # otp_tokens table
│   └── 0004_add_mfa.sql           # MFA fields (mfa_enabled, mfa_secret, mfa_backup_codes)
├── test/                          # Test suites
├── package.json
├── tsconfig.json
├── wrangler.jsonc                 # Cloudflare Workers config
└── vitest.config.mts
```

## Database Schema

### Complete Table Structure

#### **`profiles`** (User Profile Information)

| Column                | Type    | Nullable | Default | Constraints | Description                                      |
| --------------------- | ------- | -------- | ------- | ----------- | ------------------------------------------------ |
| `id`                    | TEXT    | NO       | -       | PRIMARY KEY | User ID (UUID)                                   |
| `first_name`            | TEXT    | YES      | NULL    | -           | User's first name                                |
| `last_name`             | TEXT    | YES      | NULL    | -           | User's last name                                 |
| `email`                 | TEXT    | YES      | NULL    | UNIQUE      | Email address                                    |
| `phone`                 | TEXT    | YES      | NULL    | -           | Phone number                                     |
| `password_hash`         | TEXT    | NO       | -       | -           | PBKDF2-SHA256 hash (format: `salt:hash`)         |
| `public_key`            | TEXT    | YES      | NULL    | -           | ECDSA P-256 public key in JWK format (JSON)      |
| `encrypted_private_key` | TEXT    | YES      | NULL    | -           | Encrypted private key: `{ salt, iv, ciphertext }` |
| `notifications`         | TEXT    | YES      | NULL    | -           | Notification preferences (JSON)                  |
| `mfa_enabled`           | BOOLEAN | NO       | false   | -           | Is TOTP 2FA enabled                              |
| `mfa_secret`            | TEXT    | YES      | NULL    | -           | Base32-encoded TOTP secret                       |
| `mfa_backup_codes`      | TEXT    | YES      | NULL    | -           | Backup codes (JSON array)                        |
| `created_at`            | TEXT    | NO       | now()   | -           | ISO timestamp                                    |
| `updated_at`            | TEXT    | NO       | now()   | -           | ISO timestamp                                    |

**Indexes:**
- `idx_profiles_email` on (email) - For profile lookup

---

#### **`wallets`** (Wallet Information & Verification Status)

| Column                | Type    | Nullable | Default | Constraints | Description                     |
| --------------------- | ------- | -------- | ------- | ----------- | ------------------------------- |
| `user_id`               | TEXT    | NO       | -       | PRIMARY KEY | User ID (UUID)                  |
| `public_key`            | TEXT    | YES      | NULL    | -           | ECDSA P-256 public key (JWK)    |
| `encrypted_private_key` | TEXT    | YES      | NULL    | -           | Encrypted private key (JSON)    |
| `verified`              | BOOLEAN | NO       | false   | -           | Wallet verified (challenge-response) |
| `created_at`            | TEXT    | NO       | now()   | -           | ISO timestamp                   |
| `updated_at`            | TEXT    | NO       | now()   | -           | ISO timestamp                   |

**Notes:**
- One wallet per user (PRIMARY KEY on user_id)
- `verified` field indicates successful challenge-response wallet verification

---

#### **`blocks`** (Transaction Ledger - "Blockchain")

| Column        | Type    | Nullable | Default | Constraints | Description                    |
| ------------- | ------- | -------- | ------- | ----------- | ------------------------------ |
| `id`            | INTEGER | NO       | AUTO    | PRIMARY KEY | Auto-incrementing block ID     |
| `data`          | TEXT    | YES      | NULL    | -           | Transaction data (JSON string) |
| `previous_hash` | TEXT    | YES      | NULL    | -           | SHA-256 hash of previous block |
| `hash`          | TEXT    | YES      | NULL    | -           | SHA-256 hash of this block     |
| `created_at`    | TEXT    | NO       | now()   | -           | ISO timestamp                  |
| `user_id`       | TEXT    | YES      | NULL    | -           | User who created block         |

**Block Data Structure** (stored in `data` as JSON string):
```json
{
  "public_summary": {
    "kind": "tx" | "buy" | "sell",
    "to": "string (address)",
    "to_user_id": "uuid | null",
    "to_thumbprint": "string | null",
    "from": "string (address)",
    "from_user_id": "uuid | null",
    "from_thumbprint": "string | null",
    "amountFiat": number,
    "amountCrypto": number,
    "crypto": "string (BTC, ETH, USDC, etc)",
    "fiatCurrency": "string (USD, EUR, GBP)",
    "timestamp": "ISO 8601 string | epoch number"
  },
  "encrypted_blob": {
    "salt": "hex string",
    "iv": "hex string",
    "ciphertext": "base64 string"
  } | null,
  "user_id": "uuid | null"
}
```

---

#### **`contacts`** (User Contact List)

| Column          | Type    | Nullable | Default | Constraints | Description                          |
| --------------- | ------- | -------- | ------- | ----------- | ------------------------------------ |
| `id`              | INTEGER | NO       | AUTO    | PRIMARY KEY | Auto-incrementing contact ID         |
| `user_id`         | TEXT    | NO       | -       | FOREIGN KEY | Contact owner (user ID)              |
| `contact_user_id` | TEXT    | YES      | NULL    | -           | CryoPay user ID (if also a user)     |
| `name`            | TEXT    | NO       | -       | NOT NULL    | Contact's display name               |
| `address`         | TEXT    | NO       | -       | NOT NULL    | Contact's wallet address             |
| `email`           | TEXT    | YES      | NULL    | -           | Contact's email address              |
| `label`           | TEXT    | YES      | NULL    | -           | Custom label (Friend, Family, etc)   |
| `public_key`      | TEXT    | YES      | NULL    | -           | Contact's public key in JWK (JSON)   |
| `created_at`      | TEXT    | NO       | now()   | -           | ISO timestamp                        |
| `updated_at`      | TEXT    | NO       | now()   | -           | ISO timestamp                        |

**Indexes:**
- `idx_contacts_user_id` on (user_id) - For retrieval of user's contacts

---

#### **`otp_tokens`** (Magic Link Tokens for Email OTP)

| Column     | Type    | Nullable | Default | Constraints | Description           |
| ---------- | ------- | -------- | ------- | ----------- | --------------------- |
| `id`         | INTEGER | NO       | AUTO    | PRIMARY KEY | Token ID              |
| `email`      | TEXT    | NO       | -       | -           | Email address         |
| `token`      | TEXT    | NO       | -       | UNIQUE      | OTP token string      |
| `expires_at` | TEXT    | NO       | -       | -           | ISO timestamp         |
| `used`       | BOOLEAN | NO       | false   | -           | Whether token was used |
| `created_at` | TEXT    | NO       | now()   | -           | ISO timestamp         |

**Indexes:**
- `idx_otp_tokens_email` on (email)
- `idx_otp_tokens_token` on (token)

**Notes:**
- Tokens expire and are marked as used after verification
- Email sending is TODO (not implemented)

---

### Database Relationship Diagram

```
profiles (users)
    ├─→ 1:1 ── wallets
    │           └─ Wallet keys & verification status
    │
    ├─→ 1:∞ ── blocks
    │           └─ Transaction ledger
    │
    ├─→ 1:∞ ── contacts (self-referential)
    │           └─ User's saved contacts
    │
    └─→ 1:∞ ── otp_tokens
                └─ Magic link tokens for email OTP
```

---

## API Endpoints

### Base URL
- **Frontend requests to:** `$VITE_WORKER_URL` (configured in `.env`)
- **Backend runs on:** `https://<project>.workers.dev` (or custom domain)
- **All requests require:** `Authorization: Bearer <token>` header (except auth endpoints)

### Authentication Endpoints (`/api/auth/*`)

| Method | Path                | Purpose                    | Protected | Request Body                                                                      | Response                                    |
| ------ | ------------------- | -------------------------- | --------- | ------------------------------------------------------------------------------- | ------------------------------------------- |
| POST   | `/register`           | Create new account         | No        | `{email, password, first_name, last_name?, public_key?, encrypted_private_key?}` | `{ok, token, user}`                           |
| POST   | `/login`              | Login with email/password  | No        | `{email, password}`                                                               | `{ok, token, user}`                           |
| POST   | `/mfa-login`          | Login with TOTP code       | No        | `{email, password, mfaCode}`                                                      | `{ok, token, user}`                           |
| POST   | `/refresh`            | Extend token expiration    | Yes       | `{}`                                                                              | `{ok, token}`                                 |
| POST   | `/send-otp`           | Send magic link email      | No        | `{email}`                                                                         | `{ok, message}`                               |
| POST   | `/verify-otp`         | Verify magic link token    | No        | `{email, token}`                                                                  | `{ok, token}`                                 |
| POST   | `/change-password`    | Change password            | Yes       | `{password}`                                                                      | `{ok, message}`                               |
| GET    | `/mfa-status`         | Check if MFA enabled       | Yes       | (none)                                                                           | `{enabled: boolean}`                          |
| POST   | `/mfa-enable`         | Initialize MFA setup       | Yes       | `{}`                                                                              | `{ok, secret, otpauthUrl, message}`           |
| POST   | `/mfa-verify`         | Verify TOTP code           | Yes       | `{code}`                                                                          | `{ok, message, backupCodes?: string[]}`       |
| POST   | `/mfa-disable`        | Disable MFA                | Yes       | `{password}`                                                                      | `{ok, message}`                               |

### Profile Endpoints (`/api/profile/*`)

| Method | Path              | Purpose                        | Protected | Request Body                                                                      | Response           |
| ------ | ----------------- | ------------------------------- | --------- | ------------------------------------------------------------------------------- | ------------------ |
| GET    | `/`                 | Get current user profile       | Yes       | (none)                                                                           | `{ok, profile}`      |
| PUT    | `/`                 | Update profile                 | Yes       | `{first_name?, last_name?, phone?, notifications?, public_key?, encrypted_private_key?}` | `{ok}`               |
| POST   | `/`                 | Update profile (specific)      | Yes       | `{first_name?, last_name?, public_key?, encrypted_private_key?}`                 | `{ok, message}`      |
| GET    | `/search`           | Search profile by email/id     | Yes       | Query: `?email=X` or `?id=X` or `?thumbprint=X`                                   | `{ok, profile}`      |
| POST   | `/create-profile-wallet` | Upsert profile & wallet | Yes | `{first_name?, last_name?, public_key?, encrypted_private_key?, email?, phone?}` | `{ok, message}`      |

### Wallet Endpoints (`/api/wallet/*`)

| Method | Path            | Purpose                      | Protected | Request Body                              | Response       |
| ------ | --------------- | ----------------------------- | --------- | ----------------------------------------- | -------------- |
| GET    | `/`               | Get user's wallet            | Yes       | (none)                                    | `{ok, wallet}`   |
| POST   | `/`               | Save/update wallet           | Yes       | `{public_key, encrypted_private_key, verified?}` | `{ok, message}` |
| POST   | `/verify-wallet`  | Verify wallet with signature | Yes       | `{public_key, challenge, signature}`      | `{ok, message}` |

### Blocks Endpoints (`/api/blocks/*`)

| Method | Path  | Purpose              | Protected | Request Body         | Response       |
| ------ | ----- | -------------------- | --------- | -------------------- | -------------- |
| GET    | `/`     | Get user's blocks    | Yes       | (none)               | `{ok, blocks}` |
| GET    | `/:id`  | Get specific block   | Yes       | (none)               | `{ok, block}`  |
| POST   | `/`     | Create new block     | Yes       | `{data?, previous_hash?}` | `{ok, block}`  |

### Contacts Endpoints (`/api/contacts/*`)

| Method | Path  | Purpose           | Protected | Request Body                                                | Response           |
| ------ | ----- | ------------------ | --------- | ----------------------------------------------------------- | ------------------ |
| GET    | `/`     | Get all contacts   | Yes       | (none)                                                      | `{ok, contacts}`   |
| GET    | `/:id`  | Get contact        | Yes       | (none)                                                      | `{ok, contact}`    |
| POST   | `/`     | Create contact     | Yes       | `{name, address, email?, label?, public_key?, contact_user_id?}` | `{ok, contact}`    |
| PUT    | `/:id`  | Update contact     | Yes       | `{name?, address?, email?, label?, public_key?}`               | `{ok, contact}`    |
| DELETE | `/:id`  | Delete contact     | Yes       | (none)                                                      | `{ok, message}`    |

### Utility Endpoints

| Method | Path      | Purpose           | Response          |
| ------ | --------- | ------------------ | ------------------- |
| GET    | `/`         | Health check      | Lists database tables |
| GET    | `/health`   | Health check      | `{ok}`                |
| GET    | `/tables`   | List DB tables    | `{tables: []}`        |

---

## User Flows

### Custodial Signup (Only Fully Implemented Path)

1. **Onboarding:** User selects "Simple Account" (custodial)
2. **Registration:** POST `/api/auth/register` with email, password, name
   - Backend: Hashes password with PBKDF2 (100k iterations), creates profile, returns JWT
   - Frontend: Stores token in localStorage, navigates to wallet setup
3. **Secure Wallet Setup:**
   - Generate ECDSA P-256 keypair in browser
   - Encrypt private key with password (PBKDF2 + AES-256-GCM)
   - POST `/api/wallet` to save encrypted backup
4. **Optional 2FA:** POST `/api/auth/mfa-enable` to set up TOTP
5. **Dashboard Access:** Token valid for 7 days, can refresh with `/api/auth/refresh`

### Non-Custodial Signup (Incomplete)

- UI buttons exist for MetaMask and WalletConnect
- No actual wallet connection logic implemented
- Do not use this path

### Login & MFA

1. **Login:** POST `/api/auth/login` with email/password
   - If MFA enabled, response includes `mfa_required: true`
2. **MFA Challenge:** POST `/api/auth/mfa-login` with email, password, TOTP code
   - Backend verifies code with ±1 time-step tolerance
   - Returns token on success
3. **Token Usage:** Include `Authorization: Bearer <token>` in all protected requests

### Transaction Flow

1. User initiates transaction creation
2. Frontend creates block data with sender, recipient, amounts, timestamp
3. POST `/api/blocks` with optional encrypted data
4. Backend: Computes SHA-256 hash, stores with previous_hash reference
5. User views transactions in history (GET `/api/blocks`)

---

## Prerequisites

- **Node.js** 20.19+ (frontend and backend)
- npm, yarn, or pnpm for package management
- Cloudflare account (for Workers and D1 database)
- Supabase account is **NOT needed** (uses D1, not Supabase)

## Getting Started

### Frontend Setup

```bash
cd /Users/dev/Desktop/Programms/project/Cryopay
npm install
cp .env.example .env
```

Update `.env`:
```env
VITE_WORKER_URL=https://cryo-worker.your-workers-dev.workers.dev
VITE_SUPABASE_URL=(not used - kept for backward compatibility)
VITE_SUPABASE_ANON_KEY=(not used - kept for backward compatibility)
```

Start dev server:
```bash
npm run dev
```

Open `http://localhost:5173`

### Backend Setup

```bash
cd /Users/dev/Desktop/Programms/project/cryo-worker
npm install
```

Create `.env.local` (Wrangler reads this):
```env
JWT_SECRET=your-very-secret-key-min-32-chars-recommended
```

Initialize D1 database:
```bash
npx wrangler d1 create cryopay-db
```

Run migrations:
```bash
npx wrangler d1 execute cryopay-db --file=migrations/0001_initial_schema.sql
npx wrangler d1 execute cryopay-db --file=migrations/0002_add_password_hash.sql
npx wrangler d1 execute cryopay-db --file=migrations/0003_add_otp_tokens.sql
npx wrangler d1 execute cryopay-db --file=migrations/0004_add_mfa.sql
```

Start local dev server:
```bash
npm run dev
```

Wrangler will start on `http://localhost:8787`

Deploy to Cloudflare:
```bash
npm run deploy
```

---

## Environment Variables

### Frontend (`/Cryopay/.env`)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `VITE_WORKER_URL` | ✅ Yes | Backend API URL (e.g., `https://cryo-worker.example.workers.dev`) |
| `VITE_SUPABASE_URL` | ❌ No | Not used (legacy, can be any value) |
| `VITE_SUPABASE_ANON_KEY` | ❌ No | Not used (legacy, can be any value) |

### Backend (`/cryo-worker/.env.local`)

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `JWT_SECRET` | ✅ Yes | Secret for HS256 JWT signing (min 32 chars recommended) |
| `DATABASE` | ✅ Auto | D1 database binding (configured in `wrangler.jsonc`) |

---

## Cryptographic Implementation

All cryptographic operations use **WebCrypto API** (browser for frontend, Cloudflare Workers for backend).

### Password Hashing (PBKDF2-SHA256)
```
Iterations: 100,000
Salt: 16 random bytes, hex-encoded
Hash: SHA-256
Storage Format: salt:hash (both hex)
```

### Encryption (AES-256-GCM)
```
Key Derivation: PBKDF2-SHA256 with 100k iterations
Cipher: AES-256-GCM
Key Size: 256 bits
IV Size: 96 bits (12 bytes)
Ciphertext: Base64-encoded
```

### JWT Tokens (HS256)
```
Algorithm: HMAC-SHA256
Key: JWT_SECRET from environment
Payload: { sub: userId, email, iat, exp }
Expiration: 7 days (604,800 seconds)
```

### TOTP (RFC 6238)
```
Algorithm: HMAC-SHA1
Time Step: 30 seconds
Digits: 6
Clock Tolerance: ±1 time step
```

### Block Hashing (SHA-256)
```
Input: data || previous_hash || timestamp || user_id
Output: 64-character hex string
```

---

## Scripts

### Frontend
```bash
npm run dev              # Start dev server
npm run build            # Create production build
npm run preview          # Preview build locally
npm run test             # Run tests
npm run test:watch      # Test watch mode
npm run lint            # Lint code
```

### Backend
```bash
npm run dev              # Start local Workers dev server
npm run deploy           # Deploy to Cloudflare
npm run test             # Run tests
npm run test:watch      # Test watch mode
```

---

## ⚠️ Limitations & Before Production Use

**This is a reference implementation.** Before using in production:

1. **Add Rate Limiting**
   - Implement rate limiting on auth endpoints
   - Prevent brute-force attacks on login/registration

2. **Email Delivery**
   - Implement email sending for OTP tokens
   - Use SendGrid, Mailgun, or similar service

3. **Add Compliance**
   - Implement KYC (Know Your Customer) verification
   - Add AML (Anti-Money Laundering) checks
   - Comply with financial regulations in your jurisdiction

4. **Database-Level Security**
   - Enable RLS policies at database level
   - Add foreign key constraints
   - Add CHECK constraints for data validation

5. **Blockchain Integration (Optional)**
   - Connect to Ethereum, Bitcoin, or other chains (if needed)
   - Implement actual transaction submission
   - Add gas fee handling and settlement logic

6. **Payment Processing**
   - Integrate Stripe, PayPal, or similar (if handling fiat)
   - Implement payment settlement and reconciliation
   - Add webhook handlers for payment events

7. **Security Audit**
   - Conduct professional security review
   - Test for vulnerabilities (OWASP Top 10)
   - Consider external audit by cryptography experts

8. **Infrastructure**
   - Set up monitoring and alerting (Sentry, CloudFlare Analytics)
   - Configure backup and disaster recovery
   - Set up CI/CD pipeline with automated tests

9. **Token Refresh**
   - Implement refresh token rotation
   - Add token revocation mechanism
   - Track active sessions

10. **Logging & Compliance**
    - Log authentication events
    - Log all financial transactions
    - Implement audit trails for compliance

---

## Testing

### Frontend
```bash
npm run test            # Run tests
npm run test:watch     # Watch mode
```

### Backend
```bash
npm run test            # Run tests
npm run test:watch     # Watch mode
```

Tests include:
- Unit tests for crypto functions
- Integration tests for API endpoints
- Validation tests for request/response schemas
- Authentication middleware tests
- Database query tests

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit with conventional messages: `git commit -m "feat: add feature"`
4. Run tests and linting: `npm run test && npm run lint`
5. Push to your fork and open a pull request

**Standards:**
- Use conventional commit messages (feat:, fix:, docs:, etc.)
- Add tests for new features
- Ensure all tests pass
- Follow TypeScript best practices
- No secrets in commits

---

## Known Issues & Limitations

- **Email OTP:** Tokens generated but not sent (TODO)
- **No Rate Limiting:** Auth endpoints can be brute-forced
- **No Token Rotation:** Single 7-day expiration, no refresh token rotation
- **Database-Level RLS:** Uses app-level checks instead of D1 constraints
- **No Foreign Keys:** D1 doesn't enforce relationships
- **No Transactions:** D1 doesn't support multi-statement transactions
- **Block Chain Validation:** `previous_hash` stored but not validated
- **Static Email Configuration:** No dynamic email sending

---

## License

This project is licensed under the [YOUR LICENSE HERE] license. See the [LICENSE](LICENSE) file for details.

---

**Further Reading:**
- `/IMPLEMENTATION_ANALYSIS.md` - Detailed architecture and feature breakdown
- `/README_UPDATE_GUIDE.md` - Discrepancies between claims and implementation
- `/cryo-worker/wrangler.jsonc` - Cloudflare Workers configuration
- `/cryo-worker/migrations/*.sql` - Database schema
- `/src/types/schemas.ts` - Frontend validation schemas
- `/cryo-worker/src/schemas/index.ts` - Backend validation schemas
