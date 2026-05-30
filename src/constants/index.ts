/**
 * CryoPay Frontend Constants (extended)
 * Centralized enums, keys, and reusable values
 */

// Transaction types/kinds
export enum TransactionKind {
  TX = 'tx',        // peer-to-peer transfer
  BUY = 'buy',      // buying crypto with fiat
  SELL = 'sell'     // selling crypto for fiat
}

// Transaction direction (for display purposes)
export enum TransactionDirection {
  SENT = 'Sent',
  RECEIVED = 'Received',
  BUY = 'Buy',
  SELL = 'Sell'
}

// Transaction status
export enum TransactionStatus {
  COMPLETED = 'Completed',
  PENDING = 'Pending',
  FAILED = 'Failed'
}

// Supported cryptocurrencies
export enum CryptoCurrency {
  ETH = 'ETH',
  BTC = 'BTC',
  USDC = 'USDC',
  USDT = 'USDT'
}

// Fiat currencies
export enum FiatCurrency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP'
}

// Contact label options (for selects, enums, type safety)
export enum ContactLabel {
  FRIEND = "Friend",
  FAMILY = "Family",
  MERCHANT = "Merchant",
  COLLEAGUE = "Colleague"
}

export const CONTACT_LABEL_OPTIONS: Array<{ label: string; value: ContactLabel }> = [
  { label: "Friend", value: ContactLabel.FRIEND },
  { label: "Family", value: ContactLabel.FAMILY },
  { label: "Merchant", value: ContactLabel.MERCHANT },
  { label: "Colleague", value: ContactLabel.COLLEAGUE }
];

// Universal email regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// API Error codes (extended)
export enum ErrorCode {
  // Auth errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_EXISTS = 'EMAIL_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  MFA_REQUIRED = 'MFA_REQUIRED',
  MFA_INVALID = 'MFA_INVALID',
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_EMAIL = 'INVALID_EMAIL',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  // Auth/permission errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  // --- Contacts (new) ---
  CONTACT_ADD_FAILED = 'CONTACT_ADD_FAILED',
  CONTACT_UPDATE_FAILED = 'CONTACT_UPDATE_FAILED',
  CONTACT_DELETE_FAILED = 'CONTACT_DELETE_FAILED',
  CONTACT_INVALID_PUBLIC_KEY = 'CONTACT_INVALID_PUBLIC_KEY',
  CONTACT_NOT_FOUND = 'CONTACT_NOT_FOUND'
}

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
} as const;

export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

// JWT configuration
export const JWT_CONFIG = {
  EXPIRATION_SECONDS: 60 * 60 * 24 * 7, // 7 days
  ALGORITHM: 'HS256'
} as const;

// Validation constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  OTP_LENGTH: 6,
  MFA_CODE_LENGTH: 6,
  BLOCKS_DEFAULT_LIMIT: 100,
  CONTACTS_DEFAULT_LIMIT: 100
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'cryo_auth_token',
  USER_DATA: 'cryo_user',
  THEME: 'cryo_theme'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  SEND_OTP: '/api/auth/send-otp',
  VERIFY_OTP: '/api/auth/verify-otp',
  CHANGE_PASSWORD: '/api/auth/change-password',
  MFA_STATUS: '/api/auth/mfa-status',
  MFA_ENABLE: '/api/auth/mfa-enable',
  MFA_VERIFY: '/api/auth/mfa-verify',
  MFA_DISABLE: '/api/auth/mfa-disable',
  MFA_LOGIN: '/api/auth/mfa-login',
  // Profile
  PROFILE: '/api/profile',
  PROFILE_SEARCH: '/api/profile/search',
  // Wallet
  WALLET: '/api/wallet',
  WALLET_VERIFY: '/api/wallet/verify-wallet',
  // Blocks
  BLOCKS: '/api/blocks',
  // Contacts
  CONTACTS: '/api/contacts'
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];

// Routes (frontend navigation)
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  CONTACTS: '/contacts',
  BUY_SELL: '/buy-sell',
  WALLET: '/wallet',
  SECURE_WALLET: '/secure-wallet',
  CONFIRM_KEY: '/confirm-key',
  BLOCKCHAIN: '/blockchain',
  SETTINGS: '/settings'
} as const;

export type Route = typeof ROUTES[keyof typeof ROUTES];

