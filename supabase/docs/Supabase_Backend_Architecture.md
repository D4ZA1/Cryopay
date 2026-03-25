# Supabase Backend Architecture Documentation

## Overview
This document provides a comprehensive analysis of the Cryopay Supabase backend architecture, including database schema, functions, authentication setup, API endpoints, and integrations. This documentation is essential for planning the migration to Cloudflare D1 + Workers.

## 1. Database Schema

### Tables

#### 1.1 Profiles Table
```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  public_key jsonb,
  encrypted_private_key jsonb,
  email text,
  phone text,
  notifications jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose**: Stores user profile information separate from authentication data, including wallet-related cryptographic keys.

**Key Features**:
- Row Level Security (RLS) policies recommended but commented out
- Trigger to auto-update `updated_at` timestamp
- Index on email for faster lookups

#### 1.2 Wallets Table
```sql
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key jsonb,
  encrypted_private_key jsonb,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Purpose**: Manages user wallet information and verification status.

**Key Features**:
- One-to-one relationship with users
- Verification status for wallet ownership
- RLS policies recommended but commented out

#### 1.3 Blocks Table
```sql
CREATE TABLE IF NOT EXISTS public.blocks (
  id bigserial PRIMARY KEY,
  data jsonb,
  previous_hash text,
  hash text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);
```

**Purpose**: Implements a simple blockchain for transaction storage and verification.

**Key Features**:
- Chain integrity through `previous_hash` and `hash` fields
- Global transaction storage (not user-scoped by default)
- RLS policies recommended but commented out

#### 1.4 Contacts Table
```sql
CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  address text NOT NULL,
  email text NULL,
  label text NULL,
  public_key jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Purpose**: Stores user-specific contact information for quick transactions.

**Key Features**:
- Self-referential relationship for contact users
- Optional labels for categorization
- Index on `user_id` for performance

## 2. Supabase Functions

### 2.1 create_profile_wallet Function
**Location**: `supabase/functions/create_profile_wallet/index.ts`

**Purpose**: Automatically creates profile and wallet records when a new user is created via Supabase Auth webhook.

**Trigger**: `user.created` webhook event

**Implementation**:
- Uses service role key for privileged operations
- Upserts profile and wallet records
- Handles user metadata for public keys and encrypted private keys
- Returns success/failure response

**Security Considerations**:
- Requires SUPABASE_SERVICE_ROLE_KEY environment variable
- Should be configured to only accept Auth webhook events

### 2.2 verify_wallet Function
**Location**: `supabase/functions/verify_wallet/index.ts`

**Purpose**: Verifies wallet ownership through cryptographic signature verification.

**Input**: JSON POST with `user_id`, `public_key`, `challenge`, and `signature`

**Implementation**:
- Uses WebCrypto API for ECDSA P-256 signature verification
- Updates wallet verification status on successful verification
- Returns verification result

**Security Considerations**:
- Uses service role key for database updates
- Validates all required fields
- Returns appropriate HTTP status codes

## 3. Authentication Setup

### 3.1 Supabase Auth Configuration
- **Client Library**: `@supabase/supabase-js`
- **Environment Variables**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 3.2 Authentication Context
**Location**: `src/context/AuthContext.tsx`

**Features**:
- Session management with `onAuthStateChange` listener
- User data normalization and storage
- Token management
- Balance tracking
- Logout functionality with cleanup

### 3.3 User Metadata Structure
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "public_key": {"kty": "EC", "crv": "P-256", ...},
  "encrypted_private_key": {"salt": "...", "iv": "...", "ciphertext": "..."},
  "notifications": {
    "emailNotifications": true,
    "transactionAlerts": true,
    "weeklyReports": false,
    "marketingEmails": false
  }
}
```

## 4. API Endpoints and Integrations

### 4.1 Frontend API Usage
**Location**: `src/supabase.ts`

**Configuration**:
- Client-side Supabase instance
- Environment variable validation
- Error handling for missing configuration

### 4.2 External API Integrations

#### 4.2.1 Cryptocurrency Price Data
**Sources**:
- **Binance API**: `https://api.binance.com/api/v3/ticker/price`
- **ExchangeRate.host**: `https://api.exchangerate.host/convert`
- **CoinGecko API**: `https://api.coingecko.com/api/v3/simple/price`

**Purpose**: Real-time cryptocurrency price conversion for trading features

#### 4.2.2 Blockchain Data
**Source**: Supabase Blocks table
**Purpose**: Transaction history and blockchain visualization

## 5. Background Jobs and Scheduled Tasks

### 5.1 Thumbprint Backfill Script
**Location**: `supabase/scripts/backfill_thumbprints.js`

**Purpose**: Populates missing `public_thumbprint` fields in profiles and wallets tables.

**Implementation**:
- Node.js script using Supabase client
- Computes SHA-256 thumbprints from JWK public keys
- Processes profiles and wallets in batches
- Handles errors gracefully

**Usage**:
```bash
SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey... node supabase/scripts/backfill_thumbprints.js
```

## 6. Security Features

### 6.1 Cryptographic Operations
**Location**: `src/lib/crypto.ts`

**Features**:
- ECDSA P-256 key generation and management
- AES-GCM encryption with PBKDF2 key derivation
- Base64 encoding/decoding
- JWK thumbprint generation
- SHA-256 hashing

### 6.2 Symmetric Session Management
**Location**: `src/lib/symmetricSession.ts`

**Features**:
- In-memory symmetric key storage
- Secure key lifecycle management
- Session-based key persistence

### 6.3 Data Encryption
- Transaction data encrypted with wallet-derived keys
- Chain integrity through salted encryption
- Public metadata for indexing and search

## 7. Application Architecture

### 7.1 Frontend Structure
- **Framework**: React with TypeScript
- **State Management**: React Context for authentication
- **Styling**: Tailwind CSS
- **Routing**: React Router

### 7.2 Key Features
- **Wallet Management**: Client-side wallet generation and storage
- **Transaction Processing**: Encrypted transaction storage with blockchain
- **Contact Management**: User-specific contact storage
- **Real-time Trading**: Live price integration and trading interface
- **Security**: Two-factor authentication and biometric options

## 8. Performance Considerations

### 8.1 Database Performance
- **Indexes**: Email index on profiles, user_id index on contacts
- **Query Optimization**: RLS policies and proper indexing
- **Connection Pooling**: Supabase client connection management

### 8.2 Frontend Performance
- **Lazy Loading**: Route-based code splitting
- **Caching**: Supabase client caching
- **Optimization**: Bundle optimization with Vite

### 8.3 Security Performance
- **Encryption Overhead**: Client-side encryption impact
- **Signature Verification**: WebCrypto performance
- **Session Management**: In-memory key storage efficiency

---

This documentation provides a complete overview of the Cryopay Supabase backend architecture, serving as a foundation for planning the migration to Cloudflare D1 + Workers. The next steps would involve creating a detailed migration plan based on this analysis.