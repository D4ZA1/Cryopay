# 🎯 CryoPay Migration Plan: Production Testing with Real Ethereum, MetaMask & Smart Contracts

## Overview
This plan migrates CryoPay from a custodial-only mock blockchain to a **real Ethereum testnet (Sepolia) integration** with **MetaMask self-custody**, **smart contracts for transaction recording**, and **proper blockchain validation**.

---

## Phase 1: Smart Contract Design & Deployment
### 1.1 Transaction Recording Smart Contract
**Purpose:** Record CryoPay transactions on-chain for immutability and transparency
**Contract Features:**
- Record transaction metadata (sender, receiver, amount, description)
- Maintain transaction history per user
- Emit events for frontend indexing
- Support batch operations (gas optimization)
- Owner functions for testing/admin

**Solidity Contract (Sepolia-ready):**
```solidity
pragma solidity ^0.8.0;
contract CryoPayTransactionRecorder {
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
    
    // User registers their wallet with CryoPay
    function registerUser() public {
        transactionCounts[msg.sender] = 0;
        emit UserRegistered(msg.sender);
    }
    // Record a transaction
    function recordTransaction(
        address to,
        uint256 amount,
        string memory currency,
        bytes32 offChainTxHash
    ) public {
        require(to != address(0), "Invalid recipient");
        require(recordedTxHashes[offChainTxHash] == false, "TX already recorded");
        Transaction memory tx = Transaction({
            from: msg.sender,
            to: to,
            amount: amount,
            currency: currency,
            timestamp: block.timestamp,
            txHash: offChainTxHash
        });
        userTransactions[msg.sender].push(tx);
        recordedTxHashes[offChainTxHash] = true;
        transactionCounts[msg.sender]++;
        emit TransactionRecorded(msg.sender, to, amount, currency, block.timestamp, offChainTxHash);
    }
    // Batch record transactions (gas efficient)
    function recordBatchTransactions(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string[] calldata currencies,
        bytes32[] calldata txHashes
    ) public {
        require(recipients.length == amounts.length, "Array length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            recordTransaction(recipients[i], amounts[i], currencies[i], txHashes[i]);
        }
    }
    // Get user transaction count
    function getTransactionCount(address user) public view returns (uint256) {
        return transactionCounts[user];
    }
    // Get user transactions (paginated to avoid gas issues)
    function getTransactions(address user, uint256 offset, uint256 limit) 
        public 
        view 
        returns (Transaction[] memory) 
    {
        require(offset + limit <= userTransactions[user].length, "Out of bounds");
        
        Transaction[] memory result = new Transaction[](limit);
        for (uint256 i = 0; i < limit; i++) {
            result[i] = userTransactions[user][offset + i];
        }
        return result;
    }
}
```

**Deployment Path:**
1. Write contract in Hardhat project
2. Deploy to Sepolia testnet
3. Get contract address for frontend/backend integration
4. Update D1 with contract address

**Testing Tools:**
- Hardhat for local development
- Etherscan Sepolia for verification
- Sepolia faucet for test ETH

---

## Phase 2: Frontend Architecture Changes
### 2.1 New Frontend Dependencies
```
{
  ethers: ^6.x,                    // Ethereum library
  web3modal: ^2.4.x,               // Wallet connection UI
  @web3modal/wagmi: ^1.x,          // Web3Modal for wagmi
  wagmi: ^1.x,                     // React hooks for Ethereum
  viem: ^1.x                       // Low-level Ethereum client
}
```
### 2.2 New Component Structure
/src
├── /pages
│   ├── Onboarding.tsx (UPDATED: 3 paths instead of 2)
│   │   ├── "Custodial Account" (existing)
│   │   ├── "MetaMask Self-Custody" (NEW)
│   │   └── "Import Existing Wallet" (NEW)
│   ├── SignUpCustodial.tsx (UNCHANGED)
│   ├── SignUpMetaMask.tsx (NEW)
│   └── ... rest unchanged
│
├── /components
│   ├── WalletConnect.tsx (NEW: MetaMask button + connection status)
│   ├── TransactionForm.tsx (UPDATED: Add blockchain option)
│   └── TransactionHistory.tsx (UPDATED: Show on-chain confirmations)
│
├── /hooks
│   ├── useMetaMask.ts (NEW: MetaMask connection logic)
│   ├── useEthereumTransaction.ts (NEW: Sign & send transactions)
│   ├── useSmartContract.ts (NEW: Interact with recorder contract)
│   └── useTransaction.ts (UPDATED: Support both custodial & chain)
│
├── /lib
│   ├── web3.ts (NEW: wagmi/ethers setup, chain configs)
│   ├── contractABI.ts (NEW: Import CryoPayTransactionRecorder ABI)
│   ├── ethereum.ts (NEW: RPC client, transaction submission)
│   └── crypto.ts (EXISTING: Still used for custodial accounts)
│
└── /types
    ├── schemas.ts (UPDATED: Add blockchain transaction types)
    └── blockchain.ts (NEW: Ethereum-specific types)
```

### 2.3 Onboarding Flow Changes
**Old Flow (Custodial Only):**
User → Select Account Type → Custodial Signup → Setup Password-Protected Keys → Dashboard

**New Flow:**
User → Select Account Type
    ├─ Custodial (original)
    │   └─ SignUpCustodial.tsx
    │
    └─ MetaMask Self-Custody (NEW)
        ├─ Click "Connect MetaMask"
        ├─ MetaMask popup → User approves connection
        ├─ Frontend reads wallet address
        ├─ Backend registers user with address
        ├─ Dashboard (different UI for self-custody)
        └─ Send Transactions (signed in MetaMask)

### 2.4 Transaction Flow for Self-Custody

Frontend:
1. User clicks "Send"
2. Form input: recipient, amount, currency
3. Frontend creates transaction object
4. Call MetaMask: `signMessage()` or `sendTransaction()`
5. User confirms in MetaMask
6. Get transaction hash + signature
7. POST to `/api/transactions/record` with:
   - recipient address
   - amount
   - txHash (from MetaMask)
   - signature (proof of signing)

Backend:
8. Verify signature matches user's address
9. Call smart contract: `recordTransaction(recipient, amount, ...)`
10. Wait for blockchain confirmation
11. Store blockchain receipt in D1
12. Return confirmation to frontend

---

## Phase 3: Backend Architecture Changes
### 3.1 New Cloudflare Workers Dependencies
Add to /cryo-worker/package.json:
```
{
  ethers: ^6.x,           // Ethereum library
  dotenv: ^16.x,          // For environment variables
  axios: ^1.x,            // HTTP client (for external RPC calls)
  viem: ^1.x              // Alternative lightweight client
}
```
### 3.2 New Backend Routes
```
/api/auth/
  └─ /connect-metamask (NEW)      - Register MetaMask user
  
/api/wallet/
  └─ /metamask-info (NEW)         - Get connected MetaMask wallet info
  
/api/transactions/ (NEW FOLDER)
  ├─ /submit-on-chain             - Submit transaction to blockchain
  ├─ /record-on-chain             - Call smart contract
  ├─ /get-blockchain-status       - Check transaction confirmation
  └─ /sync-from-blockchain        - Index on-chain transactions
  
/api/ethereum/ (NEW FOLDER)
  ├─ /gas-price                   - Get current gas prices
  ├─ /balance/:address            - Get address balance
  └─ /contract-abi                - Return contract ABI
```
### 3.3 New Backend Files
```
/cryo-worker/src
├── /routes
│   ├── /ethereum (NEW)
│   │   ├── gas-price.ts
│   │   ├── balance.ts
│   │   └── abi.ts
│   │
│   ├── /blockchain (NEW)
│   │   ├── record-transaction.ts
│   │   ├── get-status.ts
│   │   └── sync.ts
│   │
│   └── /auth
│       └── metamask-register.ts (NEW)
│
├── /lib (NEW FOLDER)
│   ├── ethereum.ts              - Ethers.js setup, RPC calls
│   ├── smartContract.ts         - Contract interaction helpers
│   ├── web3Provider.ts          - Cloudflare-compatible Ethereum provider
│   └── transactionQueue.ts      - Queue for pending transactions
│
├── /middleware
│   └── ethereum-auth.ts (NEW)   - Verify Ethereum signatures
│
└── /schemas
    └── blockchain.ts (NEW)      - Zod schemas for blockchain requests
```
### 3.4 Environment Variables (Backend)
New .env.local variables for /cryo-worker:
```
# Existing
JWT_SECRET=your-secret-key
# NEW: Ethereum
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHEREUM_CHAIN_ID=11155111
ETHEREUM_NETWORK=sepolia
# NEW: Smart Contract
CRYOPAY_CONTRACT_ADDRESS=0x...
CRYOPAY_CONTRACT_DEPLOYER_KEY=your_private_key_for_admin_functions
CRYOPAY_CONTRACT_OWNER_ADDRESS=0x...
# NEW: Gas & Limits
MAX_GAS_PRICE_GWEI=100
MIN_CONFIRMATIONS=1
TRANSACTION_TIMEOUT_SECONDS=300
```

---

## Phase 4: Database Schema Updates
### 4.1 New D1 Tables
**Table: ethereum_users (Links CryoPay users to Ethereum addresses)**
```sql
CREATE TABLE ethereum_users (
  id TEXT PRIMARY KEY,          -- UUID (same as profiles.id)
  ethereum_address TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT FALSE,  -- Signature verification
  balance_wei TEXT,             -- Last known balance
  nonce INTEGER DEFAULT 0,      -- Transaction nonce
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```
**Table: blockchain_transactions (Records all on-chain transactions)**
```sql
CREATE TABLE blockchain_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount_wei TEXT NOT NULL,
  currency TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, failed
  block_number INTEGER,
  confirmations INTEGER DEFAULT 0,
  gas_used TEXT,
  transaction_fee TEXT,
  created_at TEXT NOT NULL,
  confirmed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES profiles(id)
);
```
**Table: contract_events (Index smart contract events)**
```sql
CREATE TABLE contract_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,      -- TransactionRecorded, UserRegistered
  block_number INTEGER NOT NULL,
  transaction_hash TEXT NOT NULL,
  from_address TEXT,
  to_address TEXT,
  amount TEXT,
  currency TEXT,
  log_index INTEGER,
  created_at TEXT NOT NULL,
  UNIQUE(transaction_hash, log_index)
);
```
**Update: blocks table (Existing, add blockchain reference)**
```sql
ALTER TABLE blocks ADD COLUMN ethereum_tx_hash TEXT;
ALTER TABLE blocks ADD COLUMN on_chain BOOLEAN DEFAULT FALSE;
```

---

## Phase 5: Testing Environment Setup
### 5.1 Local Development (Hardhat)
```
# Create hardhat project in /contracts folder
npx hardhat init
# Test smart contract locally
npx hardhat test
# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```
### 5.2 Testnet Deployment (Sepolia)
**Network RPC Endpoints:**
- Alchemy: https://eth-sepolia.g.alchemy.com/v2/{API_KEY}
- Infura: https://sepolia.infura.io/v3/{API_KEY}
- Public (free): https://sepolia.drpc.org

**Get Test ETH:**
- Sepolia Faucet (PoW) (https://sepolia-faucet.pk910.de/)
- Alchemy Faucet
- Google Cloud Faucet

**Frontend .env Updates:**
```
# Existing
VITE_WORKER_URL=http://localhost:8787
# NEW: Ethereum
VITE_ETHEREUM_CHAIN_ID=11155111
VITE_ETHEREUM_NETWORK_NAME=sepolia
VITE_CONTRACT_ADDRESS=0x...
VITE_ALCHEMY_API_KEY=your_key
VITE_WEB3MODAL_PROJECT_ID=your_project_id
```

### 5.3 Integration Testing Strategy
**Test Scenarios:**
1. Custodial Account Tests (unchanged)
   - Register, login, 2FA
   - Create transactions in DB
   - No blockchain calls
2. MetaMask Self-Custody Tests (NEW)
   - Connect MetaMask wallet
   - Verify signature
   - Send transaction via MetaMask
   - Wait for blockchain confirmation
   - Query smart contract
3. Smart Contract Tests
   - Deploy contract to testnet
   - Register user
   - Record transaction
   - Check event emission
   - Verify transaction history
4. Cross-Flow Tests
   - Custodial → Self-Custody migration
   - Self-Custody → Send to Custodial
   - Batch transaction recording

---

## Phase 6: Implementation Sequence
**Priority Order:**
1. Week 1: Smart Contract & Testing
   - Write & test smart contract in Hardhat
   - Deploy to Sepolia
   - Set up contract verification on Etherscan
2. Week 2: Backend Ethereum Integration
   - Add ethers.js to cryo-worker
   - Create RPC client wrapper
   - Implement contract interaction functions
   - Update D1 schema
3. Week 3: Backend API Endpoints
   - Create /api/ethereum/* routes
   - Create /api/blockchain/* routes
   - Implement signature verification middleware
   - Write tests
4. Week 4: Frontend UI & Hooks
   - Install wagmi + web3modal
   - Create MetaMask connection component
   - Create custom hooks for transactions
   - Update onboarding flow
5. Week 5: Frontend Integration
   - Connect to backend endpoints
   - Implement transaction signing
   - Add blockchain status tracking
   - Update transaction history to show on-chain data
6. Week 6: Testing & Refinement
   - End-to-end testing on Sepolia
   - Gas optimization
   - Error handling & edge cases
   - Documentation

---

## Architecture Diagram (After Migration)
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  Custodial Flow  │        │  MetaMask Flow   │          │
│  │  (Unchanged)     │        │  (NEW)           │          │
│  └────────┬─────────┘        └────────┬─────────┘          │
│           │                           │                      │
│           └───────────┬────────────────┘                    │
│                       │                                      │
│                ┌──────▼──────┐                              │
│                │   Wagmi     │                              │
│                │   Web3Modal │                              │
│                └──────┬──────┘                              │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐   ┌──────▼──────┐  ┌───▼──────┐
   │ Backend  │   │  Ethereum   │  │ MetaMask │
   │ (Hono)   │   │  Network    │  │          │
   └────┬────┘   │ (Sepolia)   │  └──────────┘
        │        └──────┬──────┘
        │               │
   ┌────▼───────────────┼────────────┐
   │                    │            │
   │  ┌────────────────▼─────────┐  │
   │  │ Smart Contract (Sepolia) │  │
   │  │ - Record Transactions    │  │
   │  │ - Emit Events            │  │
   │  │ - Verify Signatures      │  │
   │  └────────────────┬─────────┘  │
   │                   │            │
   │  ┌────────────────▼─────────┐  │
   │  │  D1 Database (SQLite)    │  │
   │  │  - profiles (users)      │  │
   │  │  - wallets               │  │
   │  │  - blocks                │  │
   │  │  - ethereum_users (NEW)  │  │
   │  │  - blockchain_txs (NEW)  │  │
   │  │  - contract_events (NEW) │  │
   │  └──────────────────────────┘  │
   │                                │
   └────────────────────────────────┘
```

---

## Key Decisions & Tradeoffs
| Decision          | Choice             | Reasoning                                                   |
| ----------------- | ------------------ | ----------------------------------------------------------- |
| Testnet           | Sepolia            | Large ecosystem, easy RPC access, ample faucets             |
| Self-Custody      | MetaMask           | Most widely adopted, user controls keys, simple integration |
| Contract Type     | Simple recorder    | No money handling, just records metadata on-chain           |
| Backend           | Cloudflare Workers | Stays serverless, scales easily, already deployed           |
| RPC Provider      | Alchemy (primary)  | Reliable, good docs, free tier sufficient for testing       |
| Transaction Queue | Simple async queue | Avoids overloading Ethereum network during testing          |

---

## Migration Path for Existing Custodial Users
1. Keep custodial path unchanged - No data migration needed
2. New MetaMask users - Register with Ethereum address
3. Optional: Allow linking - Later, allow custodial users to connect MetaMask (advanced feature)
4. Backward compatibility - Existing auth, 2FA, contacts all still work

---

## Post-MVP Considerations
Once testing is complete and stable:
- Mainnet deployment (production Ethereum)
- Additional chains (Polygon, Arbitrum)
- Hardware wallet support (Ledger, Trezor via WalletConnect)
- ERC-4337 Account Abstraction for better UX
- USDC/USDT payments instead of plain Ethereum
- Gas abstraction (sponsored transactions)

---

This plan provides a clear implementation roadmap that:
✅ Moves from mock blockchain to real Ethereum  
✅ Adds MetaMask for true self-custody  
✅ Implements smart contracts for transaction immutability  
✅ Uses Sepolia testnet (zero real cost)  
✅ Maintains backward compatibility with custodial flow  
✅ Provides a foundation for mainnet deployment
