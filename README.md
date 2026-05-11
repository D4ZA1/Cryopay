# EcoVault

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity&logoColor=white)](https://soliditylang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.4.5-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A complete cryptocurrency payment platform with a modern React frontend, Cloudflare Workers backend, and Ethereum smart contracts for on-chain transaction recording.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Smart Contract](#smart-contract)
- [Backend (cryo-worker)](#backend-cryo-worker)
- [Frontend (EcoVault)](#frontend-ecovault)
- [Environment Variables](#environment-variables)
- [Setup Instructions](#setup-instructions)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Cryptography](#cryptography)
- [Important Notes](#important-notes)

---

## Overview

EcoVault is a full-stack cryptocurrency payment solution consisting of three main components:

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React + TypeScript + Vite | Web application for user interaction |
| **Backend** | Cloudflare Workers (Hono) + D1 | API server with SQLite database |
| **Contracts** | Solidity + Hardhat | On-chain transaction recording |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CRYOPAY PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐  │
│  │      FRONTEND       │    │       BACKEND       │    │    BLOCKCHAIN   │  │
│  │                     │    │                     │    │                 │  │
│  │  ┌───────────────┐  │    │  ┌───────────────┐  │    │  ┌───────────┐  │  │
│  │  │    React 19   │  │    │  │     Hono      │  │    │  │ Ethereum  │  │  │
│  │  │  TypeScript   │──┼────┼──│   Framework   │──┼────┼──│  Sepolia  │  │  │
│  │  │    Vite 7     │  │    │  │   Cloudflare  │  │    │  │  Testnet  │  │  │
│  │  └───────────────┘  │    │  │    Workers    │  │    │  └───────────┘  │  │
│  │                     │    │  └───────────────┘  │    │        │        │  │
│  │  ┌───────────────┐  │    │         │          │    │        │        │  │
│  │  │    wagmi +    │  │    │  ┌───────────────┐  │    │  ┌───────────┐  │  │
│  │  │     viem      │──┼────┼──│   D1 SQLite   │  │    │  │  EcoVault  │  │  │
│  │  │   (Web3)      │  │    │  │   Database    │  │    │  │ Contract  │  │  │
│  │  └───────────────┘  │    │  └───────────────┘  │    │  └───────────┘  │  │
│  │                     │    │                     │    │                 │  │
│  │  ┌───────────────┐  │    │  ┌───────────────┐  │    │                 │  │
│  │  │   MetaMask    │  │    │  │  viem (RPC)   │──┼────┼─────────────────┘  │
│  │  │  Integration  │  │    │  │   Alchemy     │  │                        │
│  │  └───────────────┘  │    │  └───────────────┘  │                        │
│  └─────────────────────┘    └─────────────────────┘                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┤
│  │                         USER AUTHENTICATION                             │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  │                                                                         │
│  │   ┌─────────────────────────┐      ┌─────────────────────────────────┐  │
│  │   │   SIMPLE ACCOUNT USER  │      │      METAMASK WALLET USER       │  │
│  │   ├─────────────────────────┤      ├─────────────────────────────────┤  │
│  │   │ • Email/Password Auth  │      │ • Wallet Signature Auth         │  │
│  │   │ • JWK Public Keys      │      │ • Ethereum Address (0x...)      │  │
│  │   │ • PBKDF2 Password Hash │      │ • Email: {addr}@wallet.ecovault  │  │
│  │   │ • Optional TOTP MFA    │      │ • No Password Required          │  │
│  │   └─────────────────────────┘      └─────────────────────────────────┘  │
│  │                                                                         │
│  └─────────────────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

### Authentication
- **Email/Password Registration** - Traditional account creation with secure password hashing
- **MetaMask Wallet Authentication** - Connect with Ethereum wallet, sign message to authenticate
- **Multi-Factor Authentication (MFA)** - TOTP-based 2FA with backup codes
- **Magic Link Login** - Passwordless email verification
- **JWT Session Management** - 7-day token expiration with refresh capability

### Wallet Management
- **Custodial Wallets** - Server-managed keys with encrypted storage
- **Non-Custodial Wallets** - MetaMask integration for self-custody
- **Challenge-Response Verification** - Prove wallet ownership

### Transactions
- **P2P Payments** - Send cryptocurrency to other users
- **On-Chain Recording** - Immutable transaction history via smart contract
- **Transaction History** - Search, filter, and export capabilities
- **Block Explorer View** - Visual blockchain representation

### Contacts
- **Contact Management** - Save and organize payment recipients
- **Quick Send** - Fast payments to saved contacts
- **Public Key Storage** - Encrypted communication support

---

## Project Structure

```
project/
├── EcoVault/                      # Frontend Application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── ui/               # Radix UI primitives
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── WalletConnect.tsx
│   │   │   └── ...
│   │   ├── context/              # React contexts
│   │   │   ├── AuthContext.tsx   # Authentication state
│   │   │   └── EthereumContext.tsx # Web3 state
│   │   ├── hooks/                # Custom React hooks
│   │   ├── layouts/              # Page layouts
│   │   │   └── AuthenticatedLayout.tsx
│   │   ├── lib/                  # Utilities
│   │   │   └── symmetricSession.ts
│   │   ├── pages/                # Route pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Contacts.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── Blockchain.tsx
│   │   │   ├── Wallet.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   ├── SignUpCustodial.tsx
│   │   │   ├── SignUpNonCustodial.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   └── ...
│   │   ├── types/                # TypeScript definitions
│   │   │   ├── index.ts
│   │   │   ├── schemas.ts
│   │   │   └── blockchain.ts
│   │   ├── constants/            # App constants
│   │   ├── test/                 # Test utilities
│   │   ├── App.tsx               # Root component
│   │   └── main.tsx              # Entry point
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── cryo-worker/                  # Backend Application
│   ├── src/
│   │   ├── routes/               # API route handlers
│   │   │   ├── auth.ts           # Authentication endpoints
│   │   │   ├── profile.ts        # Profile management
│   │   │   ├── wallet.ts         # Wallet operations
│   │   │   ├── blocks.ts         # Block/transaction storage
│   │   │   ├── contacts.ts       # Contact management
│   │   │   ├── blockchain.ts     # On-chain operations
│   │   │   ├── ethereum.ts       # Ethereum RPC endpoints
│   │   │   └── dev.ts            # Development utilities
│   │   ├── middleware/           # Request middleware
│   │   │   ├── auth.ts           # JWT authentication
│   │   │   └── ethereum-auth.ts  # MetaMask signature verification
│   │   ├── lib/                  # Shared libraries
│   │   │   ├── ethereum.ts       # Ethereum utilities
│   │   │   ├── smartContract.ts  # Contract interaction
│   │   │   └── etherscan.ts      # Etherscan API
│   │   ├── schemas/              # Zod validation schemas
│   │   │   ├── index.ts
│   │   │   └── blockchain.ts
│   │   ├── constants/            # Error codes, HTTP status
│   │   ├── db/
│   │   │   └── schema.ts         # Database types
│   │   └── index.ts              # Worker entry point
│   ├── migrations/               # D1 SQL migrations
│   │   ├── 0001_initial_schema.sql
│   │   ├── 0002_add_password_hash.sql
│   │   ├── 0003_add_otp_tokens.sql
│   │   ├── 0004_add_mfa.sql
│   │   └── 0005_add_blockchain_tables.sql
│   ├── test/                     # Test files
│   ├── package.json
│   ├── wrangler.jsonc            # Cloudflare config
│   ├── vitest.config.mts
│   └── tsconfig.json
│
└── contracts/                    # Smart Contracts
    ├── contracts/
    │   └── EcoVaultTransactionRecorder.sol
    ├── test/                     # Contract tests
    ├── ignition/                 # Hardhat Ignition modules
    │   └── modules/
    │       └── EcoVaultTransactionRecorder.cts
    ├── abi/                      # Generated ABIs
    ├── artifacts/                # Compiled contracts
    ├── typechain-types/          # TypeScript bindings
    ├── hardhat.config.cts
    ├── package.json
    └── tsconfig.json
```

---

## Smart Contract

### EcoVaultTransactionRecorder

**Purpose**: Records EcoVault transactions on-chain for immutability and transparency.

| Property | Value |
|----------|-------|
| **Contract Name** | EcoVaultTransactionRecorder |
| **Solidity Version** | ^0.8.28 |
| **License** | MIT |

### Deployed Addresses

| Network | Chain ID | Address |
|---------|----------|---------|
| Localhost (Hardhat) | 31337 | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| Sepolia Testnet | 11155111 | `0x9a142DBc7dec674E7b6d8175FcE40aAf88aCE75A` |

### Contract Functions

| Function | Type | Description |
|----------|------|-------------|
| `registerUser()` | Write | Register the caller as a EcoVault user |
| `recordTransaction(to, amount, currency, txHash)` | Write | Record a single transaction on-chain |
| `recordBatchTransactions(recipients[], amounts[], currencies[], txHashes[])` | Write | Record multiple transactions in one call (gas efficient) |
| `getTransactionCount(user)` | Read | Get number of transactions for a user |
| `getTransactions(user, offset, limit)` | Read | Get paginated transactions for a user |
| `getTotalTransactions(user)` | Read | Get total transaction count for a user |
| `isTransactionRecorded(txHash)` | Read | Check if a transaction hash is already recorded |

### Contract Events

```solidity
event TransactionRecorded(
    address indexed from,
    address indexed to,
    uint256 amount,
    string currency,
    uint256 timestamp,
    bytes32 txHash
);

event UserRegistered(address indexed user);
```

### Full Contract Source

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title EcoVaultTransactionRecorder
 * @notice Records EcoVault transactions on-chain for immutability and transparency
 * @dev Deployed on Sepolia testnet for testing
 */
contract EcoVaultTransactionRecorder {
    // ============ Events ============
    event TransactionRecorded(
        address indexed from,
        address indexed to,
        uint256 amount,
        string currency,
        uint256 timestamp,
        bytes32 txHash
    );
    event UserRegistered(address indexed user);

    // ============ State ============
    mapping(address => uint256) public transactionCounts;
    mapping(address => Transaction[]) public userTransactions;
    mapping(bytes32 => bool) public recordedTxHashes;

    struct Transaction {
        address from;
        address to;
        uint256 amount;
        string currency;
        uint256 timestamp;
        bytes32 txHash; // Hash linking to off-chain transaction
    }

    // ============ Functions ============

    /**
     * @notice Register a user with EcoVault
     * @dev Emits UserRegistered event
     */
    function registerUser() external {
        transactionCounts[msg.sender] = 0;
        emit UserRegistered(msg.sender);
    }

    /**
     * @notice Record a transaction on-chain
     * @param to Recipient address
     * @param amount Transaction amount
     * @param currency Currency type (e.g., "ETH", "USDC")
     * @param offChainTxHash Hash linking to off-chain transaction data
     */
    function recordTransaction(
        address to,
        uint256 amount,
        string memory currency,
        bytes32 offChainTxHash
    ) external {
        require(to != address(0), "Invalid recipient");
        require(!recordedTxHashes[offChainTxHash], "TX already recorded");

        Transaction memory newTx = Transaction({
            from: msg.sender,
            to: to,
            amount: amount,
            currency: currency,
            timestamp: block.timestamp,
            txHash: offChainTxHash
        });

        userTransactions[msg.sender].push(newTx);
        recordedTxHashes[offChainTxHash] = true;
        transactionCounts[msg.sender]++;

        emit TransactionRecorded(
            msg.sender,
            to,
            amount,
            currency,
            block.timestamp,
            offChainTxHash
        );
    }

    /**
     * @notice Record multiple transactions in a single call (gas efficient)
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts
     * @param currencies Array of currency types
     * @param txHashes Array of off-chain transaction hashes
     */
    function recordBatchTransactions(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string[] calldata currencies,
        bytes32[] calldata txHashes
    ) external {
        require(
            recipients.length == amounts.length &&
                amounts.length == currencies.length &&
                currencies.length == txHashes.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(!recordedTxHashes[txHashes[i]], "TX already recorded");

            Transaction memory newTx = Transaction({
                from: msg.sender,
                to: recipients[i],
                amount: amounts[i],
                currency: currencies[i],
                timestamp: block.timestamp,
                txHash: txHashes[i]
            });

            userTransactions[msg.sender].push(newTx);
            recordedTxHashes[txHashes[i]] = true;
            transactionCounts[msg.sender]++;

            emit TransactionRecorded(
                msg.sender,
                recipients[i],
                amounts[i],
                currencies[i],
                block.timestamp,
                txHashes[i]
            );
        }
    }

    /**
     * @notice Get the transaction count for a user
     * @param user User address
     * @return Transaction count
     */
    function getTransactionCount(address user) external view returns (uint256) {
        return transactionCounts[user];
    }

    /**
     * @notice Get user transactions with pagination
     * @param user User address
     * @param offset Starting index
     * @param limit Number of transactions to return
     * @return Array of transactions
     */
    function getTransactions(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (Transaction[] memory) {
        uint256 totalTxs = userTransactions[user].length;

        if (offset >= totalTxs) {
            return new Transaction[](0);
        }

        uint256 actualLimit = limit;
        if (offset + limit > totalTxs) {
            actualLimit = totalTxs - offset;
        }

        Transaction[] memory result = new Transaction[](actualLimit);
        for (uint256 i = 0; i < actualLimit; i++) {
            result[i] = userTransactions[user][offset + i];
        }
        return result;
    }

    /**
     * @notice Get total transactions stored for a user
     * @param user User address
     * @return Total number of transactions
     */
    function getTotalTransactions(address user) external view returns (uint256) {
        return userTransactions[user].length;
    }

    /**
     * @notice Check if a transaction hash has been recorded
     * @param txHash Transaction hash to check
     * @return True if recorded, false otherwise
     */
    function isTransactionRecorded(bytes32 txHash) external view returns (bool) {
        return recordedTxHashes[txHash];
    }
}
```

---

## Backend (cryo-worker)

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Cloudflare Workers | - |
| Framework | Hono | 4.4.5 |
| Database | D1 (SQLite) | - |
| Validation | Zod | 4.3.6 |
| Ethereum | viem | 2.47.6 |
| Auth | JWT (HS256) | - |

### Security Features

- **Password Hashing**: PBKDF2 with SHA-256, 100,000 iterations, 16-byte salt
- **JWT Tokens**: HS256 signing, 7-day expiration
- **TOTP MFA**: RFC 6238 compliant, 30-second time steps, backup codes
- **Signature Verification**: EIP-191 personal sign for MetaMask authentication

---

## Frontend (EcoVault)

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 19.1.1 |
| Language | TypeScript | 5.9.3 |
| Build Tool | Vite | 7.2.4 |
| Styling | Tailwind CSS | 3.4.18 |
| Routing | React Router | 7.9.4 |
| Animations | Framer Motion | 12.23.24 |
| Web3 | wagmi + viem | 3.6.0 / 2.47.6 |
| UI Components | Radix UI | - |
| Icons | Lucide React | 0.545.0 |
| Testing | Vitest | 4.1.2 |
| State | TanStack Query | 5.95.2 |

### Key Pages

| Page | File | Description |
|------|------|-------------|
| Dashboard | `Dashboard.tsx` | Main dashboard with balance, quick actions, receive modal |
| Contacts | `Contacts.tsx` | Contact management with quick send functionality |
| Transactions | `Transactions.tsx` | Transaction history with search, filter, and export |
| Blockchain | `Blockchain.tsx` | Block explorer view |
| Wallet | `Wallet.tsx` | Wallet management and key operations |
| Settings | `Settings.tsx` | Profile, security, and MFA settings |
| Onboarding | `Onboarding.tsx` | Account type selection (custodial vs non-custodial) |
| Sign Up (Custodial) | `SignUpCustodial.tsx` | Email/password registration |
| Sign Up (Non-Custodial) | `SignUpNonCustodial.tsx` | MetaMask wallet registration |

### Key Contexts

| Context | Purpose |
|---------|---------|
| `AuthContext.tsx` | Authentication state, user session, token management |
| `EthereumContext.tsx` | Ethereum wallet connection, balance, network state |

---

## Environment Variables

### Frontend (.env)

```env
# Backend API URL
VITE_WORKER_URL=https://cryo-worker.your-workers-dev.workers.dev

# Smart Contract Address (Sepolia)
VITE_CONTRACT_ADDRESS=0x9a142DBc7dec674E7b6d8175FcE40aAf88aCE75A

# Ethereum Network
VITE_ETHEREUM_CHAIN_ID=11155111
```

### Backend (wrangler.jsonc secrets)

```jsonc
// Set via: wrangler secret put <SECRET_NAME>

// JWT signing secret
JWT_SECRET=your-jwt-secret-key

// Smart contract address
CRYOPAY_CONTRACT_ADDRESS=0x9a142DBc7dec674E7b6d8175FcE40aAf88aCE75A

// Ethereum RPC URL (Alchemy/Infura)
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

// Ethereum chain ID
ETHEREUM_CHAIN_ID=11155111
```

### Contracts (.env)

```env
# Sepolia RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Deployer wallet private key (without 0x prefix)
DEPLOYER_PRIVATE_KEY=your-private-key-without-0x

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your-etherscan-key
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- pnpm (for backend)
- npm (for frontend and contracts)
- Cloudflare account (for backend deployment)
- MetaMask wallet (for testing)

### 1. Smart Contracts Setup

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your keys:
# - SEPOLIA_RPC_URL (Alchemy/Infura URL)
# - DEPLOYER_PRIVATE_KEY (wallet private key)
# - ETHERSCAN_API_KEY (for verification)

# Compile contracts
npm run compile

# Run tests (13 tests)
npm test

# Deploy to local Hardhat network
npx hardhat node  # In separate terminal
npm run deploy:local

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd cryo-worker

# Install dependencies
pnpm install

# Login to Cloudflare
npx wrangler login

# Run all database migrations (in order)
npx wrangler d1 execute cryo-db --local --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute cryo-db --local --file=./migrations/0002_add_password_hash.sql
npx wrangler d1 execute cryo-db --local --file=./migrations/0003_add_otp_tokens.sql
npx wrangler d1 execute cryo-db --local --file=./migrations/0004_add_mfa.sql
npx wrangler d1 execute cryo-db --local --file=./migrations/0005_add_blockchain_tables.sql

# Generate TypeScript types
npx wrangler types

# Set secrets (for production)
npx wrangler secret put JWT_SECRET
npx wrangler secret put ETHEREUM_RPC_URL
npx wrangler secret put CRYOPAY_CONTRACT_ADDRESS
npx wrangler secret put ETHEREUM_CHAIN_ID

# Start development server
pnpm dev

# Deploy to Cloudflare
pnpm deploy
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd EcoVault

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values:
# - VITE_WORKER_URL (backend URL)
# - VITE_CONTRACT_ADDRESS (smart contract address)
# - VITE_ETHEREUM_CHAIN_ID (11155111 for Sepolia)

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Testing

### Smart Contracts

```bash
cd contracts
npm test
```

- **Test Count**: 13 tests
- **Framework**: Hardhat + Chai

### Backend

```bash
cd cryo-worker
pnpm test
```

- **Test Count**: 475+ tests
- **Framework**: Vitest with Cloudflare Workers pool
- **Coverage**: Routes, middleware, schemas, integration

### Frontend

```bash
cd EcoVault
npm test          # Run once
npm run test:watch # Watch mode
```

- **Framework**: Vitest + React Testing Library
- **Coverage**: Components, contexts, pages

---

## API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | - | Create new account |
| POST | `/login` | - | Email/password login |
| POST | `/mfa-login` | - | Login with MFA code |
| POST | `/refresh` | JWT | Refresh token |
| POST | `/send-otp` | - | Send magic link email |
| POST | `/verify-otp` | - | Verify magic link token |
| POST | `/change-password` | JWT | Change password |
| GET | `/mfa-status` | JWT | Check if MFA enabled |
| POST | `/mfa-enable` | JWT | Initialize MFA setup |
| POST | `/mfa-verify` | JWT | Verify TOTP and enable MFA |
| POST | `/mfa-disable` | JWT | Disable MFA (requires password) |
| GET | `/metamask/nonce` | - | Generate signature nonce |
| POST | `/metamask/connect` | - | Connect/register MetaMask wallet |
| POST | `/metamask/link` | JWT | Link MetaMask to existing account |
| GET | `/metamask/status` | JWT | Get wallet link status |

### Profile (`/api/profile`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | Get current user profile |
| PUT | `/` | JWT | Update profile |
| GET | `/search` | JWT | Search profiles by email, id, or thumbprint |
| POST | `/create-profile-wallet` | JWT | Upsert profile and wallet |

### Wallet (`/api/wallet`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | Get wallet |
| POST | `/` | JWT | Save/update wallet |
| POST | `/verify-wallet` | JWT | Challenge-response verification |

### Blocks (`/api/blocks`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | Get user's blocks (transactions) |
| GET | `/:id` | JWT | Get specific block |
| POST | `/` | JWT | Create new block |

### Contacts (`/api/contacts`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | Get all contacts |
| GET | `/:id` | JWT | Get specific contact |
| POST | `/` | JWT | Create contact |
| PUT | `/:id` | JWT | Update contact |
| DELETE | `/:id` | JWT | Delete contact |

### Blockchain (`/api/blockchain`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/record` | JWT | Record P2P transaction on-chain |
| GET | `/status/:txHash` | JWT | Get transaction status and receipt |
| GET | `/transactions` | JWT | Get user transaction history |
| GET | `/contract-transactions` | JWT | Get on-chain transactions |
| POST | `/sync` | JWT | Sync contract events |

### Ethereum (`/api/ethereum`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/gas-price` | - | Get current gas price |
| GET | `/balance/:addr` | - | Get ETH balance for address |
| GET | `/network` | - | Get chain info |
| GET | `/contract-abi` | - | Get contract ABI |

---

## Database Schema

### Tables Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  profiles ─────────────┐                                                    │
│  (0001, 0002, 0004)    │                                                    │
│  ├── id (PK)           │                                                    │
│  ├── first_name        │                                                    │
│  ├── last_name         ├──────┐                                             │
│  ├── email (UNIQUE)    │      │                                             │
│  ├── phone             │      │                                             │
│  ├── public_key        │      │                                             │
│  ├── encrypted_private │      │                                             │
│  ├── notifications     │      │                                             │
│  ├── mfa_enabled       │      │                                             │
│  ├── mfa_secret        │      │                                             │
│  ├── mfa_backup_codes  │      │                                             │
│  ├── password_hash     │      │                                             │
│  ├── created_at        │      │                                             │
│  └── updated_at        │      │                                             │
│                        │      │                                             │
│  wallets ──────────────┤      │                                             │
│  (0001)                │      │                                             │
│  ├── user_id (PK) ─────┼──────┤                                             │
│  ├── public_key        │      │                                             │
│  ├── encrypted_private │      │                                             │
│  ├── verified          │      │                                             │
│  ├── created_at        │      │                                             │
│  └── updated_at        │      │                                             │
│                        │      │                                             │
│  ethereum_users ───────┤      │                                             │
│  (0005)                │      │                                             │
│  ├── id (PK) ──────────┼──────┘ (same as profiles.id)                       │
│  ├── ethereum_address  │                                                    │
│  ├── verified          │                                                    │
│  ├── balance_wei       │                                                    │
│  ├── nonce             │                                                    │
│  ├── created_at        │                                                    │
│  └── updated_at        │                                                    │
│                        │                                                    │
│  blocks ───────────────┤                                                    │
│  (0001)                │                                                    │
│  ├── id (PK)           │                                                    │
│  ├── data (JSON)       │                                                    │
│  ├── previous_hash     ├──────┐                                             │
│  ├── hash              │      │ user_id → profiles.id                       │
│  ├── user_id ──────────┼──────┘                                             │
│  └── created_at        │                                                    │
│                        │                                                    │
│  contacts ─────────────┤                                                    │
│  (0001)                │                                                    │
│  ├── id (PK)           │                                                    │
│  ├── user_id ──────────┼──────┐ user_id → profiles.id                       │
│  ├── contact_user_id   │      │                                             │
│  ├── name              │      │                                             │
│  ├── address           │      │                                             │
│  ├── email             │      │                                             │
│  ├── label             │      │                                             │
│  ├── public_key        │      │                                             │
│  ├── created_at        │      │                                             │
│  └── updated_at        │      │                                             │
│                        │      │                                             │
│  otp_tokens ───────────┤      │                                             │
│  (0003)                │      │                                             │
│  ├── id (PK)           │      │                                             │
│  ├── email ────────────┼──────┼─── (references profiles.email)              │
│  ├── token             │      │                                             │
│  ├── expires_at        │      │                                             │
│  ├── used              │      │                                             │
│  └── created_at        │      │                                             │
│                        │      │                                             │
│  blockchain_txs ───────┤      │                                             │
│  (0005)                │      │                                             │
│  ├── id (PK)           │      │                                             │
│  ├── user_id ──────────┼──────┘                                             │
│  ├── tx_hash (UNIQUE)  │                                                    │
│  ├── from_address      │                                                    │
│  ├── to_address        │                                                    │
│  ├── amount_wei        │                                                    │
│  ├── currency          │                                                    │
│  ├── status            │                                                    │
│  ├── block_number      │                                                    │
│  ├── confirmations     │                                                    │
│  ├── gas_used          │                                                    │
│  ├── transaction_fee   │                                                    │
│  ├── created_at        │                                                    │
│  └── confirmed_at      │                                                    │
│                        │                                                    │
│  contract_events ──────┘                                                    │
│  (0005)                                                                     │
│  ├── id (PK)                                                                │
│  ├── event_name                                                             │
│  ├── block_number                                                           │
│  ├── transaction_hash                                                       │
│  ├── from_address                                                           │
│  ├── to_address                                                             │
│  ├── amount                                                                 │
│  ├── currency                                                               │
│  ├── log_index                                                              │
│  └── created_at                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Migration History

| Migration | File | Changes |
|-----------|------|---------|
| 0001 | `0001_initial_schema.sql` | profiles, wallets, blocks, contacts |
| 0002 | `0002_add_password_hash.sql` | Add password_hash to profiles |
| 0003 | `0003_add_otp_tokens.sql` | Add otp_tokens table |
| 0004 | `0004_add_mfa.sql` | Add mfa_enabled, mfa_secret, mfa_backup_codes to profiles |
| 0005 | `0005_add_blockchain_tables.sql` | ethereum_users, blockchain_transactions, contract_events |

---

## Cryptography

### WebCrypto API Implementation

EcoVault uses the WebCrypto API for all cryptographic operations, ensuring compatibility with Cloudflare Workers and browser environments.

| Algorithm | Purpose | Parameters |
|-----------|---------|------------|
| **ECDSA P-256** | Key generation, signing | NIST P-256 curve |
| **AES-256-GCM** | Symmetric encryption | 256-bit key, 12-byte IV |
| **PBKDF2-SHA256** | Password hashing | 100,000 iterations, 16-byte salt |
| **SHA-256** | Block hashing | - |
| **HMAC-SHA1** | TOTP generation | RFC 6238 compliant |
| **HMAC-SHA256** | JWT signing | HS256 algorithm |

### Key Storage

- **Simple Account Users**: JWK public keys stored in `profiles.public_key`
- **MetaMask Users**: Ethereum addresses (0x...) stored in `ethereum_users.ethereum_address`
- **Private Keys**: Encrypted with AES-256-GCM, stored in `profiles.encrypted_private_key`

---

## Important Notes

### User Type Identification

1. **MetaMask users** are identified by email ending with `@wallet.ecovault`
2. Email format: `{ethereum_address}@wallet.ecovault`
3. Example: `0x1234...abcd@wallet.ecovault`

### Database Key Structure

The `ethereum_users` table uses `id` as primary key (same value as `profiles.id`), NOT a separate `profile_id` column. This creates a 1:1 relationship between profiles and ethereum_users.

### Key Format Differences

| User Type | Public Key Format | Example |
|-----------|------------------|---------|
| Simple Account | JWK Object | `{"kty":"EC","crv":"P-256",...}` |
| MetaMask | Ethereum Address | `0x742d35Cc6634C0532925a3b844Bc9e7595f...` |

### Dual Transaction Recording

Transactions are recorded in **both** locations:
1. **D1 Database** (`blocks` table) - For fast queries and application state
2. **On-Chain** (Smart Contract) - For immutability and transparency

### Network Configuration

| Environment | Chain | Contract Address |
|-------------|-------|------------------|
| Development | Hardhat (31337) | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| Production | Sepolia (11155111) | `0x9a142DBc7dec674E7b6d8175FcE40aAf88aCE75A` |

---

## Security Considerations

### Implemented

- PBKDF2-SHA256 password hashing (100k iterations)
- AES-256-GCM client-side encryption
- JWT with HS256 signatures
- EIP-191 MetaMask signature verification
- Parameterized SQL queries (no injection)
- Private keys never leave browser

### Recommendations for Production

- Add rate limiting on auth endpoints
- Implement email delivery for OTP
- Add KYC/AML compliance
- Security audit by professionals
- Enable Cloudflare security features

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Note:** This project uses Sepolia testnet. Do not use with real funds without proper auditing and mainnet deployment.
