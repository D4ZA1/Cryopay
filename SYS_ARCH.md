# CryoPay / EcoVault — System Architecture

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                      CryoPay / EcoVault — System Architecture                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (Client)                                                               │
│ React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS · shadcn/ui · Vercel CDN    │
│                                                                                 │
│  ┌──────────────┐ ┌────────────┐ ┌─────────────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Landing Page │ │ Dashboard  │ │   Auth UI        │ │  Web3   │ │  State  │  │
│  │ & Marketing  │ │  Recycle   │ │ Email + MetaMask │ │wagmi/   │ │TanStack │  │
│  │  Leaderboard │ │  Coupons   │ │ TOTP MFA        │ │viem     │ │ Query   │  │
│  └──────────────┘ └────────────┘ └─────────────────┘ └─────────┘ └─────────┘  │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │ Client-Side Crypto  (src/lib/crypto.ts · Browser WebCrypto API)         │   │
│  │  ECDSA P-256 keygen · PBKDF2 key derive · AES-GCM encrypt · SHA-256     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │ QR Engine   (html5-qrcode · qrcode.react)                               │   │
│  │  Camera scan → validate → submit · Admin: generate signed QR codes       │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────┬───────────────────────────────────────┘
                                          │ HTTPS / JWT Bearer
                                          │                   MetaMask sign / send
                                          ▼                        ╲
┌─────────────────────────────────────────────────────────────────────────────────┐
│ BACKEND — API LAYER                                                             │
│ Cloudflare Workers · Hono 4.4.5 · TypeScript · Zod Validation                  │
│                                                                                 │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────────────────────┐  │
│  │  Auth Service   │ │Profile & Wallet  │ │    Transaction Service           │  │
│  │  Email/Password │ │ Service          │ │ Send · Buy/Sell · History        │  │
│  │  TOTP MFA       │ │ Key management   │ │ Contact resolution               │  │
│  │  MetaMask EIP191│ │ Encrypted store  │ │ Blocks · Status tracking         │  │
│  └─────────────────┘ └──────────────────┘ └──────────────────────────────────┘  │
│                                                                                 │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────────────────────┐  │
│  │ Recycle Service │ │   Bin Service    │ │      AMM Service                 │  │
│  │ QR validation   │ │ Bin CRUD         │ │ Dynamic price calc               │  │
│  │ Token crediting │ │ QR generation    │ │ simulateAmmPrice                 │  │
│  │ Voucher redeem  │ │ Material prices  │ │ History snapshots                │  │
│  └─────────────────┘ └──────────────────┘ └──────────────────────────────────┘  │
│                                                                                 │
│  ┌─────────────────────────────┐ ┌────────────────────────────────────────────┐ │
│  │  Blockchain Bridge Service  │ │       Ethereum Gateway Service             │ │
│  │  On-chain sync              │ │  RPC calls · Etherscan API                 │ │
│  │  viem writeContract         │ │  Gas oracle · Receipt fetch               │ │
│  └─────────────────────────────┘ └────────────────────────────────────────────┘ │
└───────────┬───────────────────────────────────────┬─────────────────────────────┘
            │ D1 SQL                    viem writeContract       │ HTTP / JSON-RPC
            ▼                                        ▼           ▼
┌───────────────────────┐    ┌──────────────────────────┐   ┌──────────────────────┐
│ DATABASE              │    │ SMART CONTRACT            │   │ EXTERNAL             │
│ Cloudflare D1 · SQLite│    │ Solidity 0.8.28 · Sepolia│   │ Third-party APIs     │
│ 10 Tables             │    │ Testnet · Hardhat         │   │ & Ethereum Network   │
│                       │    │                           │   │                      │
│ ┌───────────────────┐ │    │ ┌───────────────────────┐ │   │ ┌──────────────────┐ │
│ │ Users & Profiles  │ │    │ │ CryoPay               │ │   │ │ Ethereum Sepolia │ │
│ │ accounts · mfa    │ │    │ │ TransactionRecorder   │ │   │ │ RPC              │ │
│ └───────────────────┘ │    │ │ .sol                  │ │   │ │ eth_call         │ │
│ ┌───────────────────┐ │    │ └───────────────────────┘ │   │ │ sendRawTx        │ │
│ │ Wallets & Keys    │ │    │ ┌───────────────────────┐ │   │ └──────────────────┘ │
│ │ address · cipher  │ │    │ │ Methods               │ │   │ ┌──────────────────┐ │
│ └───────────────────┘ │    │ │ record · batchRecord  │ │   │ │ Etherscan API    │ │
│ ┌───────────────────┐ │    │ │ query · verify        │ │   │ │ tx history       │ │
│ │ Transactions &    │ │    │ │ event TxRecorded      │ │   │ │ receipts         │ │
│ │ Blocks            │ │    │ └───────────────────────┘ │   │ │ gas oracle       │ │
│ │ hashes · receipts │ │    └──────────────────────────┘   │ └──────────────────┘ │
│ └───────────────────┘ │                                    └──────────────────────┘
│ ┌───────────────────┐ │
│ │ Contacts & OTP    │ │
│ │ address book · MFA│ │
│ └───────────────────┘ │
│ ┌───────────────────┐ │
│ │ Bins & Recycling  │ │
│ │ QR deposits · AMM │ │
│ └───────────────────┘ │
└───────────────────────┘

LEGEND
══════
┌─────┐  Frontend (client)      ┌─────┐  Smart contract
│     │  React / Vite / Vercel  │     │  Solidity / Sepolia
└─────┘                         └─────┘

┌─────┐  Backend API layer      ┌─────┐  External / on-chain
│     │  CF Workers / Hono      │     │  Etherscan / Sepolia RPC
└─────┘                         └─────┘

┌─────┐  Database
│     │  Cloudflare D1 / SQLite
└─────┘

──────►  Unidirectional call
◄────►  Bidirectional
- - -►  Direct wallet → chain (MetaMask)
```

---

## Component Inventory

### Frontend Modules

| Module | Technology | Location |
|--------|-----------|----------|
| Router | React Router v7 | `src/App.tsx` |
| State Management | TanStack Query v5 | throughout pages |
| UI Library | Radix UI + shadcn/ui | `src/components/ui/` |
| Animation | Framer Motion · @paper-design/shaders | `src/components/` |
| Icons | Lucide React | throughout |
| QR Scan | html5-qrcode | `src/pages/TestQr.tsx` |
| QR Generate | qrcode.react | `src/pages/BinsAdmin.tsx` |
| Forms | Zod + React state | `src/types/schemas.ts` |
| Notifications | react-toastify | `src/App.tsx` |
| Crypto | Browser WebCrypto | `src/lib/crypto.ts` |
| API Client | fetch wrapper | `src/lib/api.ts` |
| Currency | Custom utils | `src/lib/currency.ts` |
| Session | AES-GCM encryption | `src/lib/symmetricSession.ts` |

### Backend Services

| Service | Routes | Key Operations |
|---------|--------|---------------|
| Auth | `/auth/*` | register, login, logout, OTP, MFA |
| Profile | `/profile/*` | CRUD profile, search users |
| Wallet | `/wallet/*` | fetch wallet + balance |
| Contacts | `/contacts/*` | address book CRUD |
| Transaction | `/tx/*` | send, history, detail |
| Recycle | `/recycle/*` | scan QR, balance, redeem |
| Bins | `/bins/*` | list, generate QR, prices |
| AMM | `/amm/*` | simulate, history, recalculate |
| Blockchain Bridge | internal | viem writeContract calls |
| Ethereum Gateway | internal | RPC + Etherscan proxy |

### Database Tables (10 total)

| Table | Primary Data |
|-------|-------------|
| `users` | id, username, email, password_hash, mfa_enabled |
| `wallets` | eth_address, public_key_jwk, encrypted_private_key, salt, iv |
| `transactions` | kind, direction, from/to, amount, currency, status, tx_hash |
| `blocks` | block_hash, block_number, tx confirmation |
| `contacts` | owner, label, address, public_key_jwk |
| `bins` | location, material_type, active status |
| `recycling_deposits` | user, bin, material, tokens_credited, price_at_scan |
| `redemptions` | user, voucher_code, tokens_spent |
| `amm_history` | material_type, price_per_kg, volume_24h |
| `otp_tokens` | user, token, expires_at, used flag |

---

## Data Flow Summary

```
QR Scan Flow:
  Camera → html5-qrcode → submitQrScan() → Hono Worker
  → validate QR signature → AMM price lookup
  → INSERT recycling_deposits → UPDATE user token balance
  → return tokens earned

Transaction Flow:
  User input → TransactionPasswordForm → decrypt private key
  → sign tx (WebCrypto ECDSA) → POST /tx/send → Hono Worker
  → INSERT transactions (PENDING) → viem writeContract
  → Sepolia RPC sendRawTx → await TxRecorded event
  → UPDATE transactions (CONFIRMED + tx_hash) → return to UI

Auth Flow:
  Email: POST /auth/login → bcrypt.compare → sign JWT → store in localStorage
  MetaMask: EIP-191 sign message → POST /auth/login → recover address → sign JWT
  MFA: after credential check → POST /auth/mfa/verify → TOTP.verify → sign JWT
```

---

## Deployment Topology

```
                    ┌─────────────────────────────────┐
                    │         Vercel CDN               │
                    │   (Global edge, frontend dist)   │
                    │   vite build → /dist             │
                    └──────────────┬──────────────────┘
                                   │ HTTPS
                    ┌──────────────▼──────────────────┐
                    │    Cloudflare Workers (Edge)     │
                    │   cryo-worker.*.workers.dev      │
                    │   Hono API · Zod · TypeScript    │
                    └──────┬───────────────┬───────────┘
                           │               │
               ┌───────────▼──┐    ┌───────▼────────────────┐
               │ Cloudflare D1│    │ Ethereum Sepolia       │
               │ (SQLite edge)│    │ RPC + Etherscan API    │
               └──────────────┘    └────────────────────────┘
```

---

## Technology Stack Reference

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend framework | React | 19.1.1 | UI rendering |
| Language | TypeScript | 5.9 | Type safety |
| Build tool | Vite | 7 | Fast HMR, ESM bundling |
| Styling | Tailwind CSS | 3.4.18 | Utility-first CSS |
| UI primitives | Radix UI + shadcn/ui | latest | Accessible components |
| Animation | Framer Motion | 12.23.24 | Motion animations |
| Server state | TanStack Query | 5.95.2 | Data fetching & caching |
| Routing | React Router | 7.9.4 | SPA navigation |
| Validation | Zod | 4.3.6 | Runtime schema validation |
| Backend runtime | Cloudflare Workers | - | Serverless edge compute |
| Backend framework | Hono | 4.4.5 | HTTP routing on Workers |
| Database | Cloudflare D1 | - | SQLite at the edge |
| Smart contract | Solidity | 0.8.28 | On-chain recording |
| Contract framework | Hardhat | - | Compile, test, deploy |
| Blockchain client | viem | - | Type-safe Ethereum client |
| Web3 wallet | wagmi | - | MetaMask connection |
| Crypto | Browser WebCrypto | - | Client-side key operations |
| Testing | Vitest | 4.1 | Unit test runner |
| Deployment (FE) | Vercel | - | Global CDN |
| Deployment (BE) | Cloudflare | - | Edge workers |
| Blockchain network | Ethereum Sepolia | - | Testnet environment |
