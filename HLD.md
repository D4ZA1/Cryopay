# CryoPay / EcoVault — High Level Design (HLD)

## System Overview

CryoPay (EcoVault) is a **full-stack cryptocurrency payment and recycling incentive platform**. Users can authenticate via email or MetaMask, manage custodial wallets, send/receive crypto, scan QR codes at recycling bins to earn tokens, and redeem vouchers — all verified on the Ethereum Sepolia blockchain.

---

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INPUT (Web Browser)                        │
│    React 19 · TypeScript · Vite · Tailwind CSS · Vercel Deployment      │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                                  │
│         Email/Password  ·  TOTP MFA  ·  MetaMask (EIP-191)              │
│                       JWT Bearer Token                                   │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
┌─────────────────┐     ┌──────────────────────────────┐
│  WALLET & KEYS  │     │      RECYCLING ENGINE         │
│  ECDSA P-256    │     │  QR Scan → AMM Pricing →      │
│  AES-GCM enc.   │     │  Token Credit → Leaderboard   │
│  PBKDF2 derive  │     └──────────────┬───────────────┘
└────────┬────────┘                    │
         │                             │
         └────────────┬────────────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   TRANSACTION LAYER                                      │
│        Validate · Prepare · Record · Contact Resolution                  │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │ D1 SQL
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   DATABASE STORAGE                                       │
│              Cloudflare D1 · SQLite · 10 Tables                          │
│   Users · Wallets · Transactions · Contacts · Bins · AMM History        │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │ viem writeContract
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               SMART CONTRACT BRIDGE                                      │
│       CryoPay TransactionRecorder.sol (Solidity 0.8.28)                 │
│         Methods: record · batch · query · verify · TxRecorded event     │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              ETHEREUM SEPOLIA BLOCKCHAIN                                  │
│         RPC: eth_call · sendRawTx · Etherscan: history · receipts       │
└─────────────────────┬───────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               CONFIRMATION & PROOF                                       │
│           Transaction History · Etherscan Verification · Receipts       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Core Functional Flows

### 1. Authentication Flow
```
User → Enter Credentials (Email/Password OR MetaMask Sign)
     → Backend validates
     → TOTP MFA Check (if enabled)
     → JWT issued
     → Stored in localStorage (ecovault_token)
     → All subsequent API calls use Bearer token
```

### 2. Wallet & Key Management Flow
```
User → Register
     → Browser generates ECDSA P-256 keypair (WebCrypto)
     → Password → PBKDF2 derivation (100k iterations) → AES-GCM key
     → Private key encrypted with AES-GCM
     → Ciphertext + JWK public key stored in D1
     → On login: decrypt with password → reconstruct signer
```

### 3. Recycling & Token Earning Flow
```
User → Scan QR code at recycling bin
     → Backend validates QR (bin ID + material type)
     → AMM engine calculates dynamic token price
     → Tokens credited to user's recycle balance
     → Leaderboard rankings updated
     → User can redeem vouchers with earned tokens
```

### 4. Crypto Transaction Flow
```
User → Enter recipient + amount
     → Backend resolves contact / validates address
     → Transaction prepared and stored in D1
     → Smart contract bridge signs via Ether.js/viem
     → Submitted to Ethereum Sepolia via RPC
     → TxRecorded event emitted on-chain
     → Confirmation + Etherscan link returned to user
```

### 5. Buy/Sell Flow
```
User → Select crypto + fiat amount
     → Currency conversion calculated (currency.ts utilities)
     → AMM simulation run (simulateAmmPrice API)
     → Order executed and recorded
     → Transaction stored in D1 + on-chain record
```

---

## System Boundaries

| Boundary | Technology | Responsibility |
|----------|-----------|----------------|
| Client | React 19 + Vite | UI rendering, WebCrypto key ops, Web3 wallet |
| API Gateway | Cloudflare Workers (Hono) | Auth, business logic, D1 queries |
| Database | Cloudflare D1 (SQLite) | Persistent storage, 10 tables |
| Smart Contract | Solidity 0.8.28 on Sepolia | On-chain transaction recording |
| Blockchain RPC | Ethereum Sepolia | Transaction broadcast + state |
| Etherscan | Etherscan API | tx history, receipts, gas oracle |

---

## Non-Functional Properties

| Property | Design Decision |
|----------|----------------|
| **Security** | PBKDF2+AES-GCM for keys, ECDSA P-256 signing, TOTP MFA, EIP-191 MetaMask auth |
| **Scalability** | Cloudflare Workers (serverless, globally distributed edge) |
| **Availability** | Vercel CDN (frontend) + Cloudflare edge (backend) |
| **Auditability** | Every transaction recorded on-chain with Etherscan proof |
| **Decentralisation** | Smart contract is source of truth for transaction finality |
| **Privacy** | Keys encrypted client-side, server never sees raw private keys |
