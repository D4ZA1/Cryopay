import { describe, it, expect } from 'vitest';
import {
  PublicSummarySchema,
  BlockOutputSchema,
  ContactInputSchema,
  WalletSaveInputSchema,
  BlockDataSchema,
  EncryptedBlobSchema,
  TransactionKindEnum,
  RegisterInputSchema,
  LoginInputSchema,
  UserSchema,
  ProfileOutputSchema,
  ProfileUpdateInputSchema,
  ProfileSearchInputSchema,
  ContactOutputSchema,
  ContactUpdateInputSchema,
  WalletOutputSchema,
  WalletVerifyInputSchema,
  MfaLoginInputSchema,
  MfaVerifyInputSchema,
  MfaDisableInputSchema,
  ChangePasswordInputSchema,
  PaginationSchema,
  ApiSuccessSchema,
  ApiErrorSchema,
  createApiResponseSchema,
  type Transaction,
  type TransactionStatus,
  type TransactionType,
  type JWK,
  type EncryptedPrivateKey,
  type WalletState,
  type UserProfile,
  type ContactDisplay,
} from '../schemas';
import { z } from 'zod';

// ============================================================================
// Transaction Interface Type Tests
// ============================================================================

describe('Transaction Interface', () => {
  it('should have the correct structure', () => {
    const validTransaction: Transaction = {
      id: 'tx-123',
      type: 'Sent',
      to: '0xabc123',
      toDisplayName: 'Alice',
      from: '0xdef456',
      fromDisplayName: 'Bob',
      date: '2024-01-15',
      amountUSD: 100.50,
      amountCrypto: 0.005,
      crypto: 'ETH',
      status: 'Completed',
      raw: {
        id: 1,
        data: null,
        previous_hash: null,
        hash: 'hash123',
        created_at: '2024-01-15T00:00:00Z',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
      },
      relevant: true,
    };

    expect(validTransaction.id).toBe('tx-123');
    expect(validTransaction.type).toBe('Sent');
    expect(validTransaction.status).toBe('Completed');
  });

  it('should allow optional txHash field', () => {
    const transactionWithHash: Transaction = {
      id: 'tx-456',
      type: 'Received',
      to: '0xabc123',
      toDisplayName: 'Alice',
      from: '0xdef456',
      fromDisplayName: 'Bob',
      date: '2024-01-15',
      amountUSD: 50.00,
      amountCrypto: 0.002,
      crypto: 'BTC',
      status: 'Pending',
      txHash: '0x789abc...',
      raw: {
        id: 2,
        data: null,
        previous_hash: 'prevhash',
        hash: 'hash456',
        created_at: '2024-01-15T00:00:00Z',
        user_id: null,
      },
      relevant: false,
    };

    expect(transactionWithHash.txHash).toBe('0x789abc...');
  });

  it('should support all TransactionType values', () => {
    const types: TransactionType[] = ['Sent', 'Received', 'Buy', 'Sell'];
    expect(types).toHaveLength(4);
    expect(types).toContain('Sent');
    expect(types).toContain('Received');
    expect(types).toContain('Buy');
    expect(types).toContain('Sell');
  });

  it('should support all TransactionStatus values', () => {
    const statuses: TransactionStatus[] = ['Completed', 'Pending', 'Failed'];
    expect(statuses).toHaveLength(3);
    expect(statuses).toContain('Completed');
    expect(statuses).toContain('Pending');
    expect(statuses).toContain('Failed');
  });
});

// ============================================================================
// PublicSummarySchema Tests
// ============================================================================

describe('PublicSummarySchema', () => {
  const validBaseSummary = {
    kind: 'tx' as const,
    to: '0xrecipient123',
    from: '0xsender456',
    amountFiat: 100.50,
    amountCrypto: 0.005,
    crypto: 'ETH',
    fiatCurrency: 'USD',
    timestamp: '2024-01-15T10:30:00Z',
  };

  describe('valid transactions', () => {
    it('should accept valid tx transaction', () => {
      const result = PublicSummarySchema.safeParse(validBaseSummary);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.kind).toBe('tx');
      }
    });

    it('should accept valid buy transaction', () => {
      const buyTransaction = { ...validBaseSummary, kind: 'buy' as const };
      const result = PublicSummarySchema.safeParse(buyTransaction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.kind).toBe('buy');
      }
    });

    it('should accept valid sell transaction', () => {
      const sellTransaction = { ...validBaseSummary, kind: 'sell' as const };
      const result = PublicSummarySchema.safeParse(sellTransaction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.kind).toBe('sell');
      }
    });

    it('should accept timestamp as number (epoch)', () => {
      const withEpochTimestamp = { ...validBaseSummary, timestamp: 1705315800 };
      const result = PublicSummarySchema.safeParse(withEpochTimestamp);
      expect(result.success).toBe(true);
    });
  });

  describe('optional fields', () => {
    it('should accept optional to_user_id', () => {
      const withToUserId = {
        ...validBaseSummary,
        to_user_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = PublicSummarySchema.safeParse(withToUserId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.to_user_id).toBe('550e8400-e29b-41d4-a716-446655440000');
      }
    });

    it('should accept null to_user_id', () => {
      const withNullToUserId = { ...validBaseSummary, to_user_id: null };
      const result = PublicSummarySchema.safeParse(withNullToUserId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.to_user_id).toBeNull();
      }
    });

    it('should accept optional thumbprints', () => {
      const withThumbprints = {
        ...validBaseSummary,
        to_thumbprint: 'thumb123',
        from_thumbprint: 'thumb456',
      };
      const result = PublicSummarySchema.safeParse(withThumbprints);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.to_thumbprint).toBe('thumb123');
        expect(result.data.from_thumbprint).toBe('thumb456');
      }
    });

    it('should accept all optional fields as null', () => {
      const withAllNulls = {
        ...validBaseSummary,
        to_user_id: null,
        to_thumbprint: null,
        from_user_id: null,
        from_thumbprint: null,
      };
      const result = PublicSummarySchema.safeParse(withAllNulls);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid transactions', () => {
    it('should reject invalid kind', () => {
      const invalidKind = { ...validBaseSummary, kind: 'transfer' };
      const result = PublicSummarySchema.safeParse(invalidKind);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const missingTo = { ...validBaseSummary };
      delete (missingTo as Partial<typeof missingTo>).to;
      const result = PublicSummarySchema.safeParse(missingTo);
      expect(result.success).toBe(false);
    });

    it('should reject invalid amountFiat type', () => {
      const invalidAmount = { ...validBaseSummary, amountFiat: 'not-a-number' };
      const result = PublicSummarySchema.safeParse(invalidAmount);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for to_user_id', () => {
      const invalidUuid = { ...validBaseSummary, to_user_id: 'not-a-uuid' };
      const result = PublicSummarySchema.safeParse(invalidUuid);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// TransactionKindEnum Tests
// ============================================================================

describe('TransactionKindEnum', () => {
  it('should accept tx kind', () => {
    const result = TransactionKindEnum.safeParse('tx');
    expect(result.success).toBe(true);
  });

  it('should accept buy kind', () => {
    const result = TransactionKindEnum.safeParse('buy');
    expect(result.success).toBe(true);
  });

  it('should accept sell kind', () => {
    const result = TransactionKindEnum.safeParse('sell');
    expect(result.success).toBe(true);
  });

  it('should reject invalid kind', () => {
    const result = TransactionKindEnum.safeParse('trade');
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// BlockOutputSchema Tests
// ============================================================================

describe('BlockOutputSchema', () => {
  const validPublicSummary = {
    kind: 'tx' as const,
    to: '0xrecipient',
    from: '0xsender',
    amountFiat: 100,
    amountCrypto: 0.01,
    crypto: 'ETH',
    fiatCurrency: 'USD',
    timestamp: '2024-01-15T00:00:00Z',
  };

  const validBlockData = {
    public_summary: validPublicSummary,
    encrypted_blob: null,
    user_id: '550e8400-e29b-41d4-a716-446655440000',
  };

  describe('valid block structure', () => {
    it('should accept valid block with all fields', () => {
      const validBlock = {
        id: 1,
        data: validBlockData,
        previous_hash: 'abc123',
        hash: 'def456',
        created_at: '2024-01-15T00:00:00Z',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = BlockOutputSchema.safeParse(validBlock);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.data?.public_summary.kind).toBe('tx');
      }
    });

    it('should accept block with null data', () => {
      const blockWithNullData = {
        id: 2,
        data: null,
        previous_hash: null,
        hash: 'hash789',
        created_at: '2024-01-15T00:00:00Z',
        user_id: null,
      };
      const result = BlockOutputSchema.safeParse(blockWithNullData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toBeNull();
      }
    });

    it('should accept block with encrypted blob', () => {
      const blockWithEncryption = {
        id: 3,
        data: {
          ...validBlockData,
          encrypted_blob: {
            salt: 'salthex123',
            iv: 'ivhex456',
            ciphertext: 'Y2lwaGVydGV4dA==',
          },
        },
        previous_hash: 'prevhash',
        hash: 'currenthash',
        created_at: '2024-01-15T00:00:00Z',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = BlockOutputSchema.safeParse(blockWithEncryption);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data?.encrypted_blob?.salt).toBe('salthex123');
      }
    });

    it('should accept genesis block with null previous_hash', () => {
      const genesisBlock = {
        id: 0,
        data: validBlockData,
        previous_hash: null,
        hash: 'genesis_hash',
        created_at: '2024-01-01T00:00:00Z',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = BlockOutputSchema.safeParse(genesisBlock);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.previous_hash).toBeNull();
      }
    });
  });

  describe('invalid block structure', () => {
    it('should reject missing id', () => {
      const missingId = {
        data: validBlockData,
        previous_hash: null,
        hash: 'hash',
        created_at: '2024-01-15T00:00:00Z',
        user_id: null,
      };
      const result = BlockOutputSchema.safeParse(missingId);
      expect(result.success).toBe(false);
    });

    it('should reject invalid id type', () => {
      const invalidId = {
        id: 'not-a-number',
        data: validBlockData,
        previous_hash: null,
        hash: 'hash',
        created_at: '2024-01-15T00:00:00Z',
        user_id: null,
      };
      const result = BlockOutputSchema.safeParse(invalidId);
      expect(result.success).toBe(false);
    });

    it('should reject missing created_at', () => {
      const missingCreatedAt = {
        id: 1,
        data: validBlockData,
        previous_hash: null,
        hash: 'hash',
        user_id: null,
      };
      const result = BlockOutputSchema.safeParse(missingCreatedAt);
      expect(result.success).toBe(false);
    });

    it('should reject invalid user_id format', () => {
      const invalidUserId = {
        id: 1,
        data: validBlockData,
        previous_hash: null,
        hash: 'hash',
        created_at: '2024-01-15T00:00:00Z',
        user_id: 'not-a-uuid',
      };
      const result = BlockOutputSchema.safeParse(invalidUserId);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// BlockDataSchema Tests
// ============================================================================

describe('BlockDataSchema', () => {
  const validPublicSummary = {
    kind: 'tx' as const,
    to: '0xrecipient',
    from: '0xsender',
    amountFiat: 100,
    amountCrypto: 0.01,
    crypto: 'ETH',
    fiatCurrency: 'USD',
    timestamp: '2024-01-15T00:00:00Z',
  };

  it('should accept valid block data with public summary only', () => {
    const data = {
      public_summary: validPublicSummary,
    };
    const result = BlockDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept block data with encrypted blob', () => {
    const data = {
      public_summary: validPublicSummary,
      encrypted_blob: {
        salt: 'salt',
        iv: 'iv',
        ciphertext: 'cipher',
      },
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    };
    const result = BlockDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept null encrypted blob', () => {
    const data = {
      public_summary: validPublicSummary,
      encrypted_blob: null,
    };
    const result = BlockDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// EncryptedBlobSchema Tests
// ============================================================================

describe('EncryptedBlobSchema', () => {
  it('should accept valid encrypted blob', () => {
    const blob = {
      salt: 'a1b2c3d4e5f6',
      iv: '112233445566',
      ciphertext: 'Y2lwaGVydGV4dGRhdGE=',
    };
    const result = EncryptedBlobSchema.safeParse(blob);
    expect(result.success).toBe(true);
  });

  it('should reject missing salt', () => {
    const blob = {
      iv: '112233',
      ciphertext: 'Y2lwaGVy',
    };
    const result = EncryptedBlobSchema.safeParse(blob);
    expect(result.success).toBe(false);
  });

  it('should reject missing iv', () => {
    const blob = {
      salt: 'a1b2c3',
      ciphertext: 'Y2lwaGVy',
    };
    const result = EncryptedBlobSchema.safeParse(blob);
    expect(result.success).toBe(false);
  });

  it('should reject missing ciphertext', () => {
    const blob = {
      salt: 'a1b2c3',
      iv: '112233',
    };
    const result = EncryptedBlobSchema.safeParse(blob);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ContactInputSchema Tests
// ============================================================================

describe('ContactInputSchema', () => {
  describe('required fields', () => {
    it('should accept valid contact with required fields only', () => {
      const contact = {
        name: 'Alice',
        address: '0xabc123',
      };
      const result = ContactInputSchema.safeParse(contact);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Alice');
        expect(result.data.address).toBe('0xabc123');
      }
    });

    it('should reject missing name', () => {
      const contact = {
        address: '0xabc123',
      };
      const result = ContactInputSchema.safeParse(contact);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('name'))).toBe(true);
      }
    });

    it('should reject empty name', () => {
      const contact = {
        name: '',
        address: '0xabc123',
      };
      const result = ContactInputSchema.safeParse(contact);
      expect(result.success).toBe(false);
    });

    it('should reject missing address', () => {
      const contact = {
        name: 'Alice',
      };
      const result = ContactInputSchema.safeParse(contact);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('address'))).toBe(true);
      }
    });

    it('should reject empty address', () => {
      const contact = {
        name: 'Alice',
        address: '',
      };
      const result = ContactInputSchema.safeParse(contact);
      expect(result.success).toBe(false);
    });
  });

  describe('optional fields', () => {
    it('should accept all optional fields', () => {
      const contact = {
        name: 'Alice',
        address: '0xabc123',
        email: 'alice@example.com',
        label: 'Work',
        public_key: '{"kty":"EC"}',
        contact_user_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = ContactInputSchema.safeParse(contact);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('alice@example.com');
        expect(result.data.label).toBe('Work');
      }
    });

    it('should accept null optional fields', () => {
      const contact = {
        name: 'Alice',
        address: '0xabc123',
        email: null,
        label: null,
        public_key: null,
        contact_user_id: null,
      };
      const result = ContactInputSchema.safeParse(contact);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const contact = {
        name: 'Alice',
        address: '0xabc123',
        email: 'not-an-email',
      };
      const result = ContactInputSchema.safeParse(contact);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for contact_user_id', () => {
      const contact = {
        name: 'Alice',
        address: '0xabc123',
        contact_user_id: 'not-a-uuid',
      };
      const result = ContactInputSchema.safeParse(contact);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// ContactUpdateInputSchema Tests
// ============================================================================

describe('ContactUpdateInputSchema', () => {
  it('should accept partial updates', () => {
    const update = { name: 'Bob' };
    const result = ContactUpdateInputSchema.safeParse(update);
    expect(result.success).toBe(true);
  });

  it('should accept empty object', () => {
    const result = ContactUpdateInputSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject empty name when provided', () => {
    const update = { name: '' };
    const result = ContactUpdateInputSchema.safeParse(update);
    expect(result.success).toBe(false);
  });

  it('should reject empty address when provided', () => {
    const update = { address: '' };
    const result = ContactUpdateInputSchema.safeParse(update);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ContactOutputSchema Tests
// ============================================================================

describe('ContactOutputSchema', () => {
  it('should accept valid contact output', () => {
    const contact = {
      id: 1,
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      contact_user_id: null,
      name: 'Alice',
      address: '0xabc123',
      email: null,
      label: null,
      public_key: null,
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    };
    const result = ContactOutputSchema.safeParse(contact);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// WalletSaveInputSchema Tests
// ============================================================================

describe('WalletSaveInputSchema', () => {
  describe('JSON validation', () => {
    it('should accept valid JSON for public_key', () => {
      const wallet = {
        public_key: '{"kty":"EC","crv":"P-256","x":"abc","y":"def"}',
        encrypted_private_key: '{"salt":"a1","iv":"b2","ciphertext":"c3"}',
      };
      const result = WalletSaveInputSchema.safeParse(wallet);
      expect(result.success).toBe(true);
    });

    it('should reject invalid JSON for public_key', () => {
      const wallet = {
        public_key: 'not-valid-json',
        encrypted_private_key: '{"valid":"json"}',
      };
      const result = WalletSaveInputSchema.safeParse(wallet);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => 
          i.message.includes('valid JSON string')
        )).toBe(true);
      }
    });

    it('should reject invalid JSON for encrypted_private_key', () => {
      const wallet = {
        public_key: '{"valid":"json"}',
        encrypted_private_key: '{invalid json}',
      };
      const result = WalletSaveInputSchema.safeParse(wallet);
      expect(result.success).toBe(false);
    });

    it('should accept empty string as valid (edge case)', () => {
      const wallet = {
        public_key: '',
        encrypted_private_key: '',
      };
      // Empty strings return true in the refine check
      const result = WalletSaveInputSchema.safeParse(wallet);
      expect(result.success).toBe(true);
    });
  });

  describe('verified field', () => {
    it('should default verified to false', () => {
      const wallet = {
        public_key: '{}',
        encrypted_private_key: '{}',
      };
      const result = WalletSaveInputSchema.safeParse(wallet);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.verified).toBe(false);
      }
    });

    it('should accept verified as true', () => {
      const wallet = {
        public_key: '{}',
        encrypted_private_key: '{}',
        verified: true,
      };
      const result = WalletSaveInputSchema.safeParse(wallet);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.verified).toBe(true);
      }
    });
  });
});

// ============================================================================
// WalletOutputSchema Tests
// ============================================================================

describe('WalletOutputSchema', () => {
  it('should transform verified number to boolean', () => {
    const wallet = {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      public_key: '{}',
      encrypted_private_key: '{}',
      verified: 1,
    };
    const result = WalletOutputSchema.safeParse(wallet);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.verified).toBe(true);
    }
  });

  it('should handle verified as boolean', () => {
    const wallet = {
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      public_key: null,
      encrypted_private_key: null,
      verified: false,
    };
    const result = WalletOutputSchema.safeParse(wallet);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.verified).toBe(false);
    }
  });
});

// ============================================================================
// WalletVerifyInputSchema Tests
// ============================================================================

describe('WalletVerifyInputSchema', () => {
  it('should accept valid verification input', () => {
    const input = {
      public_key: { kty: 'EC', crv: 'P-256', x: 'abc', y: 'def' },
      challenge: 'random_challenge_string',
      signature: 'base64signature==',
    };
    const result = WalletVerifyInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should accept public_key with extra fields (passthrough)', () => {
    const input = {
      public_key: { kty: 'EC', crv: 'P-256', x: 'abc', y: 'def', use: 'sig' },
      challenge: 'challenge',
      signature: 'sig',
    };
    const result = WalletVerifyInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.public_key.use).toBe('sig');
    }
  });

  it('should reject empty challenge', () => {
    const input = {
      public_key: { kty: 'EC' },
      challenge: '',
      signature: 'sig',
    };
    const result = WalletVerifyInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject empty signature', () => {
    const input = {
      public_key: { kty: 'EC' },
      challenge: 'challenge',
      signature: '',
    };
    const result = WalletVerifyInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Auth Schemas Tests
// ============================================================================

describe('Auth Schemas', () => {
  describe('RegisterInputSchema', () => {
    it('should accept valid registration', () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
      };
      const result = RegisterInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const input = {
        email: 'not-an-email',
        password: 'password123',
        first_name: 'John',
      };
      const result = RegisterInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const input = {
        email: 'test@example.com',
        password: 'short',
        first_name: 'John',
      };
      const result = RegisterInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject empty first_name', () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        first_name: '',
      };
      const result = RegisterInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginInputSchema', () => {
    it('should accept valid login', () => {
      const input = {
        email: 'test@example.com',
        password: 'anypassword',
      };
      const result = LoginInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const input = {
        email: 'test@example.com',
        password: '',
      };
      const result = LoginInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('MfaLoginInputSchema', () => {
    it('should accept valid MFA login', () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        mfa_code: '123456',
      };
      const result = MfaLoginInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject non-numeric MFA code', () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        mfa_code: 'abcdef',
      };
      const result = MfaLoginInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject wrong length MFA code', () => {
      const input = {
        email: 'test@example.com',
        password: 'password123',
        mfa_code: '12345',
      };
      const result = MfaLoginInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('MfaVerifyInputSchema', () => {
    it('should accept valid 6-digit code', () => {
      const input = { code: '654321' };
      const result = MfaVerifyInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject non-6-digit code', () => {
      const result1 = MfaVerifyInputSchema.safeParse({ code: '12345' });
      expect(result1.success).toBe(false);
      
      const result2 = MfaVerifyInputSchema.safeParse({ code: '1234567' });
      expect(result2.success).toBe(false);
    });
  });

  describe('MfaDisableInputSchema', () => {
    it('should accept password', () => {
      const input = { password: 'mypassword' };
      const result = MfaDisableInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const input = { password: '' };
      const result = MfaDisableInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('ChangePasswordInputSchema', () => {
    it('should accept valid password', () => {
      const input = { password: 'newpassword123' };
      const result = ChangePasswordInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const input = { password: 'short' };
      const result = ChangePasswordInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// UserSchema Tests
// ============================================================================

describe('UserSchema', () => {
  it('should accept valid user', () => {
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      first_name: 'John',
      last_name: 'Doe',
    };
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(true);
  });

  it('should accept nullable names', () => {
    const user = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      first_name: null,
      last_name: null,
    };
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const user = {
      id: 'not-a-uuid',
      email: 'user@example.com',
      first_name: 'John',
    };
    const result = UserSchema.safeParse(user);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Profile Schemas Tests
// ============================================================================

describe('Profile Schemas', () => {
  describe('ProfileOutputSchema', () => {
    it('should accept valid profile with mfa_enabled as number', () => {
      const profile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        public_key: '{}',
        notifications: '{"email":true}',
        mfa_enabled: 1,
      };
      const result = ProfileOutputSchema.safeParse(profile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mfa_enabled).toBe(true);
      }
    });

    it('should transform mfa_enabled 0 to false', () => {
      const profile = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        public_key: null,
        notifications: '{}',
        mfa_enabled: 0,
      };
      const result = ProfileOutputSchema.safeParse(profile);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mfa_enabled).toBe(false);
      }
    });
  });

  describe('ProfileUpdateInputSchema', () => {
    it('should accept valid JSON for public_key', () => {
      const update = {
        public_key: '{"kty":"EC"}',
      };
      const result = ProfileUpdateInputSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should reject invalid JSON for public_key', () => {
      const update = {
        public_key: '{not valid}',
      };
      const result = ProfileUpdateInputSchema.safeParse(update);
      expect(result.success).toBe(false);
    });

    it('should reject empty encrypted_private_key', () => {
      const update = {
        encrypted_private_key: '',
      };
      const result = ProfileUpdateInputSchema.safeParse(update);
      expect(result.success).toBe(false);
    });
  });

  describe('ProfileSearchInputSchema', () => {
    it('should accept search by email', () => {
      const search = { email: 'test@example.com' };
      const result = ProfileSearchInputSchema.safeParse(search);
      expect(result.success).toBe(true);
    });

    it('should accept search by id', () => {
      const search = { id: '550e8400-e29b-41d4-a716-446655440000' };
      const result = ProfileSearchInputSchema.safeParse(search);
      expect(result.success).toBe(true);
    });

    it('should accept search by thumbprint', () => {
      const search = { thumbprint: 'abc123thumbprint' };
      const result = ProfileSearchInputSchema.safeParse(search);
      expect(result.success).toBe(true);
    });

    it('should reject empty search', () => {
      const result = ProfileSearchInputSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => 
          i.message.includes('At least one search parameter')
        )).toBe(true);
      }
    });
  });
});

// ============================================================================
// API Schemas Tests
// ============================================================================

describe('API Schemas', () => {
  describe('ApiSuccessSchema', () => {
    it('should accept success response', () => {
      const response = { ok: true };
      const result = ApiSuccessSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should accept success with message', () => {
      const response = { ok: true, message: 'Operation successful' };
      const result = ApiSuccessSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should reject ok: false', () => {
      const response = { ok: false };
      const result = ApiSuccessSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe('ApiErrorSchema', () => {
    it('should accept error response', () => {
      const response = { error: 'Something went wrong' };
      const result = ApiErrorSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe('createApiResponseSchema', () => {
    it('should create typed response schema', () => {
      const DataSchema = z.object({ value: z.number() });
      const ResponseSchema = createApiResponseSchema(DataSchema);

      const validResponse = { ok: true, data: { value: 42 } };
      const result = ResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('PaginationSchema', () => {
    it('should accept valid pagination', () => {
      const pagination = { limit: 50, offset: 10 };
      const result = PaginationSchema.safeParse(pagination);
      expect(result.success).toBe(true);
    });

    it('should use defaults', () => {
      const result = PaginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should reject limit over 100', () => {
      const pagination = { limit: 101 };
      const result = PaginationSchema.safeParse(pagination);
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const pagination = { offset: -1 };
      const result = PaginationSchema.safeParse(pagination);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// Frontend-Specific Type Tests
// ============================================================================

describe('Frontend-Specific Types', () => {
  describe('JWK Interface', () => {
    it('should have correct structure', () => {
      const jwk: JWK = {
        kty: 'EC',
        crv: 'P-256',
        x: 'base64x',
        y: 'base64y',
        use: 'sig',
        key_ops: ['sign', 'verify'],
        alg: 'ES256',
        kid: 'key-id-1',
        thumbprint: 'thumb123',
      };
      expect(jwk.kty).toBe('EC');
      expect(jwk.crv).toBe('P-256');
    });
  });

  describe('EncryptedPrivateKey Interface', () => {
    it('should have required encryption fields', () => {
      const encrypted: EncryptedPrivateKey = {
        salt: 'hexsalt',
        iv: 'hexiv',
        ciphertext: 'base64cipher',
      };
      expect(encrypted.salt).toBe('hexsalt');
      expect(encrypted.iv).toBe('hexiv');
      expect(encrypted.ciphertext).toBe('base64cipher');
    });
  });

  describe('WalletState Interface', () => {
    it('should represent loaded wallet', () => {
      const state: WalletState = {
        isLoaded: true,
        isVerified: true,
        publicKey: { kty: 'EC', crv: 'P-256' },
        thumbprint: 'thumb123',
        hasPrivateKey: true,
      };
      expect(state.isLoaded).toBe(true);
      expect(state.isVerified).toBe(true);
    });

    it('should represent empty wallet state', () => {
      const state: WalletState = {
        isLoaded: false,
        isVerified: false,
        publicKey: null,
        thumbprint: null,
        hasPrivateKey: false,
      };
      expect(state.publicKey).toBeNull();
    });
  });

  describe('UserProfile Interface', () => {
    it('should have correct structure', () => {
      const profile: UserProfile = {
        id: 'user-id',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        mfaEnabled: true,
        notifications: { email: true, push: false },
      };
      expect(profile.mfaEnabled).toBe(true);
      expect(profile.notifications.email).toBe(true);
    });
  });

  describe('ContactDisplay Interface', () => {
    it('should have correct structure', () => {
      const contact: ContactDisplay = {
        id: 1,
        name: 'Alice',
        address: '0xabc123',
        email: 'alice@example.com',
        label: 'Work',
        isUser: true,
        publicKey: { kty: 'EC' },
      };
      expect(contact.isUser).toBe(true);
    });

    it('should allow null fields', () => {
      const contact: ContactDisplay = {
        id: 2,
        name: 'Bob',
        address: '0xdef456',
        email: null,
        label: null,
        isUser: false,
        publicKey: null,
      };
      expect(contact.email).toBeNull();
      expect(contact.publicKey).toBeNull();
    });
  });
});
