import { describe, it, expect } from 'vitest';
import {
  TransactionKind,
  TransactionDirection,
  TransactionStatus,
  CryptoCurrency,
  FiatCurrency,
  ErrorCode,
  HTTP_STATUS,
  JWT_CONFIG,
  VALIDATION,
  STORAGE_KEYS,
  API_ENDPOINTS,
  ROUTES,
} from '../index';

describe('Frontend Constants', () => {
  describe('TransactionKind', () => {
    it('should have correct transaction kind values', () => {
      expect(TransactionKind.TX).toBe('tx');
      expect(TransactionKind.BUY).toBe('buy');
      expect(TransactionKind.SELL).toBe('sell');
    });

    it('should have exactly 3 transaction kinds', () => {
      const kinds = Object.values(TransactionKind);
      expect(kinds).toHaveLength(3);
    });
  });

  describe('TransactionDirection', () => {
    it('should have correct direction values', () => {
      expect(TransactionDirection.SENT).toBe('Sent');
      expect(TransactionDirection.RECEIVED).toBe('Received');
      expect(TransactionDirection.BUY).toBe('Buy');
      expect(TransactionDirection.SELL).toBe('Sell');
    });

    it('should have exactly 4 directions', () => {
      const directions = Object.values(TransactionDirection);
      expect(directions).toHaveLength(4);
    });
  });

  describe('TransactionStatus', () => {
    it('should have correct status values', () => {
      expect(TransactionStatus.COMPLETED).toBe('Completed');
      expect(TransactionStatus.PENDING).toBe('Pending');
      expect(TransactionStatus.FAILED).toBe('Failed');
    });

    it('should have exactly 3 statuses', () => {
      const statuses = Object.values(TransactionStatus);
      expect(statuses).toHaveLength(3);
    });
  });

  describe('CryptoCurrency', () => {
    it('should have correct cryptocurrency values', () => {
      expect(CryptoCurrency.ETH).toBe('ETH');
      expect(CryptoCurrency.BTC).toBe('BTC');
      expect(CryptoCurrency.USDC).toBe('USDC');
      expect(CryptoCurrency.USDT).toBe('USDT');
    });

    it('should have exactly 4 cryptocurrencies', () => {
      const cryptos = Object.values(CryptoCurrency);
      expect(cryptos).toHaveLength(4);
    });

    it('should include stablecoins', () => {
      const cryptos = Object.values(CryptoCurrency);
      expect(cryptos).toContain('USDC');
      expect(cryptos).toContain('USDT');
    });
  });

  describe('FiatCurrency', () => {
    it('should have correct fiat currency values', () => {
      expect(FiatCurrency.USD).toBe('USD');
      expect(FiatCurrency.EUR).toBe('EUR');
      expect(FiatCurrency.GBP).toBe('GBP');
    });

    it('should have exactly 3 fiat currencies', () => {
      const fiats = Object.values(FiatCurrency);
      expect(fiats).toHaveLength(3);
    });
  });

  describe('ErrorCode', () => {
    describe('Auth errors', () => {
      it('should have correct auth error codes', () => {
        expect(ErrorCode.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
        expect(ErrorCode.EMAIL_EXISTS).toBe('EMAIL_EXISTS');
        expect(ErrorCode.USER_NOT_FOUND).toBe('USER_NOT_FOUND');
        expect(ErrorCode.INVALID_TOKEN).toBe('INVALID_TOKEN');
        expect(ErrorCode.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
        expect(ErrorCode.MFA_REQUIRED).toBe('MFA_REQUIRED');
        expect(ErrorCode.MFA_INVALID).toBe('MFA_INVALID');
      });
    });

    describe('Validation errors', () => {
      it('should have correct validation error codes', () => {
        expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
        expect(ErrorCode.INVALID_EMAIL).toBe('INVALID_EMAIL');
        expect(ErrorCode.WEAK_PASSWORD).toBe('WEAK_PASSWORD');
        expect(ErrorCode.MISSING_REQUIRED_FIELD).toBe('MISSING_REQUIRED_FIELD');
      });
    });

    describe('Resource errors', () => {
      it('should have correct resource error codes', () => {
        expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
        expect(ErrorCode.ALREADY_EXISTS).toBe('ALREADY_EXISTS');
      });
    });

    describe('Permission errors', () => {
      it('should have correct permission error codes', () => {
        expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
        expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
      });
    });

    describe('Server errors', () => {
      it('should have correct server error codes', () => {
        expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
        expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
      });
    });

    it('should have all expected error codes', () => {
      const errorCodes = Object.values(ErrorCode);
      expect(errorCodes).toHaveLength(17);
    });
  });

  describe('HTTP_STATUS', () => {
    it('should have correct success status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
    });

    it('should have correct client error status codes', () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.CONFLICT).toBe(409);
    });

    it('should have correct server error status codes', () => {
      expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
    });

    it('should have exactly 8 status codes', () => {
      const statuses = Object.keys(HTTP_STATUS);
      expect(statuses).toHaveLength(8);
    });
  });

  describe('JWT_CONFIG', () => {
    it('should have correct expiration in seconds (7 days)', () => {
      const sevenDaysInSeconds = 60 * 60 * 24 * 7;
      expect(JWT_CONFIG.EXPIRATION_SECONDS).toBe(sevenDaysInSeconds);
      expect(JWT_CONFIG.EXPIRATION_SECONDS).toBe(604800);
    });

    it('should use HS256 algorithm', () => {
      expect(JWT_CONFIG.ALGORITHM).toBe('HS256');
    });
  });

  describe('VALIDATION', () => {
    it('should have correct password minimum length', () => {
      expect(VALIDATION.PASSWORD_MIN_LENGTH).toBe(8);
    });

    it('should have correct OTP length', () => {
      expect(VALIDATION.OTP_LENGTH).toBe(6);
    });

    it('should have correct MFA code length', () => {
      expect(VALIDATION.MFA_CODE_LENGTH).toBe(6);
    });

    it('should have correct default limits', () => {
      expect(VALIDATION.BLOCKS_DEFAULT_LIMIT).toBe(100);
      expect(VALIDATION.CONTACTS_DEFAULT_LIMIT).toBe(100);
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have correct auth token key', () => {
      expect(STORAGE_KEYS.AUTH_TOKEN).toBe('cryo_auth_token');
    });

    it('should have correct user data key', () => {
      expect(STORAGE_KEYS.USER_DATA).toBe('cryo_user');
    });

    it('should have correct theme key', () => {
      expect(STORAGE_KEYS.THEME).toBe('cryo_theme');
    });

    it('should have cryo_ prefix for all keys', () => {
      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(key).toMatch(/^cryo_/);
      });
    });
  });

  describe('API_ENDPOINTS', () => {
    describe('Auth endpoints', () => {
      it('should have correct registration endpoint', () => {
        expect(API_ENDPOINTS.REGISTER).toBe('/api/auth/register');
      });

      it('should have correct login endpoint', () => {
        expect(API_ENDPOINTS.LOGIN).toBe('/api/auth/login');
      });

      it('should have correct logout endpoint', () => {
        expect(API_ENDPOINTS.LOGOUT).toBe('/api/auth/logout');
      });

      it('should have correct refresh endpoint', () => {
        expect(API_ENDPOINTS.REFRESH).toBe('/api/auth/refresh');
      });

      it('should have correct OTP endpoints', () => {
        expect(API_ENDPOINTS.SEND_OTP).toBe('/api/auth/send-otp');
        expect(API_ENDPOINTS.VERIFY_OTP).toBe('/api/auth/verify-otp');
      });

      it('should have correct password endpoint', () => {
        expect(API_ENDPOINTS.CHANGE_PASSWORD).toBe('/api/auth/change-password');
      });

      it('should have correct MFA endpoints', () => {
        expect(API_ENDPOINTS.MFA_STATUS).toBe('/api/auth/mfa-status');
        expect(API_ENDPOINTS.MFA_ENABLE).toBe('/api/auth/mfa-enable');
        expect(API_ENDPOINTS.MFA_VERIFY).toBe('/api/auth/mfa-verify');
        expect(API_ENDPOINTS.MFA_DISABLE).toBe('/api/auth/mfa-disable');
        expect(API_ENDPOINTS.MFA_LOGIN).toBe('/api/auth/mfa-login');
      });
    });

    describe('Profile endpoints', () => {
      it('should have correct profile endpoint', () => {
        expect(API_ENDPOINTS.PROFILE).toBe('/api/profile');
      });

      it('should have correct profile search endpoint', () => {
        expect(API_ENDPOINTS.PROFILE_SEARCH).toBe('/api/profile/search');
      });
    });

    describe('Wallet endpoints', () => {
      it('should have correct wallet endpoint', () => {
        expect(API_ENDPOINTS.WALLET).toBe('/api/wallet');
      });

      it('should have correct wallet verify endpoint', () => {
        expect(API_ENDPOINTS.WALLET_VERIFY).toBe('/api/wallet/verify-wallet');
      });
    });

    describe('Blocks endpoints', () => {
      it('should have correct blocks endpoint', () => {
        expect(API_ENDPOINTS.BLOCKS).toBe('/api/blocks');
      });
    });

    describe('Contacts endpoints', () => {
      it('should have correct contacts endpoint', () => {
        expect(API_ENDPOINTS.CONTACTS).toBe('/api/contacts');
      });
    });

    it('should have all endpoints starting with /api/', () => {
      Object.values(API_ENDPOINTS).forEach((endpoint) => {
        expect(endpoint).toMatch(/^\/api\//);
      });
    });

    it('should have exactly 18 endpoints', () => {
      const endpoints = Object.keys(API_ENDPOINTS);
      expect(endpoints).toHaveLength(18);
    });
  });

  describe('ROUTES', () => {
    it('should have correct home route', () => {
      expect(ROUTES.HOME).toBe('/');
    });

    it('should have correct auth routes', () => {
      expect(ROUTES.LOGIN).toBe('/login');
      expect(ROUTES.REGISTER).toBe('/register');
    });

    it('should have correct dashboard route', () => {
      expect(ROUTES.DASHBOARD).toBe('/dashboard');
    });

    it('should have correct transactions route', () => {
      expect(ROUTES.TRANSACTIONS).toBe('/transactions');
    });

    it('should have correct contacts route', () => {
      expect(ROUTES.CONTACTS).toBe('/contacts');
    });

    it('should have correct buy/sell route', () => {
      expect(ROUTES.BUY_SELL).toBe('/buy-sell');
    });

    it('should have correct wallet routes', () => {
      expect(ROUTES.WALLET).toBe('/wallet');
      expect(ROUTES.SECURE_WALLET).toBe('/secure-wallet');
      expect(ROUTES.CONFIRM_KEY).toBe('/confirm-key');
    });

    it('should have correct blockchain route', () => {
      expect(ROUTES.BLOCKCHAIN).toBe('/blockchain');
    });

    it('should have correct settings route', () => {
      expect(ROUTES.SETTINGS).toBe('/settings');
    });

    it('should have all routes starting with /', () => {
      Object.values(ROUTES).forEach((route) => {
        expect(route).toMatch(/^\//);
      });
    });

    it('should have exactly 12 routes', () => {
      const routes = Object.keys(ROUTES);
      expect(routes).toHaveLength(12);
    });
  });
});
