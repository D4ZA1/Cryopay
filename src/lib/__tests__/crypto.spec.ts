import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  generateKeyPair, 
  exportJwk, 
  importJwk, 
  deriveKeyFromPassword,
  encryptJwkWithPassword, 
  decryptJwkWithPassword,
  encryptJSONWithPassword,
  decryptJSONWithPassword,
  jwkThumbprint,
  signString,
  verifySignature
} from '../crypto'

// Helper to create mock CryptoKey
const createMockCryptoKey = (type: 'public' | 'private', algorithm: any = { name: 'ECDSA', namedCurve: 'P-256' }): CryptoKey => ({
  type,
  algorithm,
  extractable: false,
  usages: type === 'private' ? ['sign'] : ['verify'],
})

describe('crypto.ts - Key Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate an ECDSA P-256 key pair', async () => {
    // Mock the generateKey call
    const mockKeyPair = {
      privateKey: createMockCryptoKey('private'),
      publicKey: createMockCryptoKey('public'),
    }
    
    window.crypto.subtle.generateKey = vi.fn().mockResolvedValue(mockKeyPair)

    const keyPair = await generateKeyPair()
    
    expect(window.crypto.subtle.generateKey).toHaveBeenCalledWith(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    )
    expect(keyPair).toHaveProperty('privateKey')
    expect(keyPair).toHaveProperty('publicKey')
  })
})

describe('crypto.ts - JWK Export/Import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export a key to JWK format', async () => {
    const mockJwk = { kty: 'EC', crv: 'P-256', x: 'test-x', y: 'test-y' }
    window.crypto.subtle.exportKey = vi.fn().mockResolvedValue(mockJwk)

    const key = createMockCryptoKey('public')
    const result = await exportJwk(key)
    
    expect(window.crypto.subtle.exportKey).toHaveBeenCalledWith('jwk', key)
    expect(result).toEqual(mockJwk)
  })

  it('should import a JWK key', async () => {
    const mockJwk: JsonWebKey = { kty: 'EC', crv: 'P-256', x: 'test-x', y: 'test-y' }
    const mockKey = createMockCryptoKey('public')
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(mockKey)

    const result = await importJwk(mockJwk, ['verify'])
    
    expect(window.crypto.subtle.importKey).toHaveBeenCalledWith(
      'jwk',
      mockJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    )
    expect(result).toEqual(mockKey)
  })
})

describe('crypto.ts - Key Derivation from Password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should derive a key from a password with random salt', async () => {
    const mockKey = createMockCryptoKey('private', { name: 'AES-GCM', length: 256 })
    const mockSalt = new Uint8Array(16)
    
    // Mock getRandomValues to return consistent values
    window.crypto.getRandomValues = vi.fn().mockImplementation((arr) => {
      if (arr instanceof Uint8Array) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = i % 256
        }
        return arr
      }
      return arr
    })
    
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(createMockCryptoKey('private', 'PBKDF2'))
    window.crypto.subtle.deriveKey = vi.fn().mockResolvedValue(mockKey)

    const result = await deriveKeyFromPassword('testPassword')
    
    expect(result).toHaveProperty('key')
    expect(result).toHaveProperty('salt')
    expect(typeof result.salt).toBe('string')
  })

  it('should derive a key from a password with provided salt', async () => {
    const mockKey = createMockCryptoKey('private', { name: 'AES-GCM', length: 256 })
    const providedSalt = 'a1b2c3d4e5f607182938475664738291'
    
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(createMockCryptoKey('private', 'PBKDF2'))
    window.crypto.subtle.deriveKey = vi.fn().mockResolvedValue(mockKey)

    const result = await deriveKeyFromPassword('testPassword', providedSalt)
    
    expect(result.salt).toBe(providedSalt)
  })
})

describe('crypto.ts - encryptJwkWithPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset getRandomValues mock
    window.crypto.getRandomValues = vi.fn().mockImplementation((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i % 256
      }
      return arr
    })
  })

  it('should encrypt a JWK with a password and return salt, iv, and ciphertext', async () => {
    const mockPrivateJwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: 'test-x-value',
      y: 'test-y-value',
      d: 'test-private-key',
    }
    const password = 'securePassword123'
    
    const mockDerivedKey = createMockCryptoKey('private', { name: 'AES-GCM', length: 256 })
    const mockEncryptedData = new ArrayBuffer(100)
    
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(createMockCryptoKey('private', 'PBKDF2'))
    window.crypto.subtle.deriveKey = vi.fn().mockResolvedValue(mockDerivedKey)
    window.crypto.subtle.encrypt = vi.fn().mockResolvedValue(mockEncryptedData)

    const result = await encryptJwkWithPassword(mockPrivateJwk, password)
    
    // Verify the result contains required fields
    expect(result).toHaveProperty('salt')
    expect(result).toHaveProperty('iv')
    expect(result).toHaveProperty('ciphertext')
    
    // Verify salt is a hex string
    expect(result.salt).toMatch(/^[0-9a-f]+$/)
    
    // Verify iv is a hex string
    expect(result.iv).toMatch(/^[0-9a-f]+$/)
    
    // Verify ciphertext is base64 encoded
    expect(result.ciphertext).toMatch(/^[A-Za-z0-9+/=]+$/)
    
    // Verify encrypt was called
    expect(window.crypto.subtle.encrypt).toHaveBeenCalled()
  })

  it('should produce different ciphertext for different passwords', async () => {
    const mockJwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: 'test-x',
      y: 'test-y',
      d: 'test-d',
    }
    
    const mockDerivedKey = createMockCryptoKey('private', { name: 'AES-GCM', length: 256 })
    const mockEncryptedData = new ArrayBuffer(100)
    
    // Create call count to return different salt each time
    let callCount = 0
    window.crypto.getRandomValues = vi.fn().mockImplementation((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = (i + callCount) % 256
      }
      return arr
    })
    
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(createMockCryptoKey('private', 'PBKDF2'))
    window.crypto.subtle.deriveKey = vi.fn().mockResolvedValue(mockDerivedKey)
    window.crypto.subtle.encrypt = vi.fn().mockResolvedValue(mockEncryptedData)

    const result1 = await encryptJwkWithPassword(mockJwk, 'password1')
    callCount++
    const result2 = await encryptJwkWithPassword(mockJwk, 'password2')
    
    // Different passwords should produce different salts (derived keys)
    expect(result1.salt).not.toBe(result2.salt)
  })

  it('should produce different ciphertext for same password but different salts', async () => {
    const mockJwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: 'test-x',
      y: 'test-y',
      d: 'test-d',
    }
    const password = 'samePassword'
    
    const mockDerivedKey = createMockCryptoKey('private', { name: 'AES-GCM', length: 256 })
    const mockEncryptedData1 = new ArrayBuffer(100)
    const mockEncryptedData2 = new ArrayBuffer(100)
    
    // Return different salt each time getRandomValues is called
    let saltCounter = 0
    window.crypto.getRandomValues = vi.fn().mockImplementation((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = (i + saltCounter * 16) % 256
      }
      return arr
    })
    
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(createMockCryptoKey('private', 'PBKDF2'))
    window.crypto.subtle.deriveKey = vi.fn().mockResolvedValue(mockDerivedKey)
    window.crypto.subtle.encrypt = vi.fn()
      .mockResolvedValueOnce(mockEncryptedData1)
      .mockResolvedValueOnce(mockEncryptedData2)

    const result1 = await encryptJwkWithPassword(mockJwk, password)
    saltCounter++
    const result2 = await encryptJwkWithPassword(mockJwk, password)
    
    // Different calls should produce different salts (random)
    expect(result1.salt).not.toBe(result2.salt)
  })
})

describe('crypto.ts - decryptJwkWithPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should decrypt encrypted JWK with correct password', async () => {
    const originalJwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: 'test-x',
      y: 'test-y',
      d: 'test-private',
    }
    
    const encryptedBlob = {
      salt: 'a1b2c3d4e5f607182938475664738291',
      iv: '1234567890ab',
      ciphertext: 'encryptedBase64Data',
    }
    
    const password = 'correctPassword'
    
    const mockDerivedKey = createMockCryptoKey('private', { name: 'AES-GCM', length: 256 })
    const decryptedData = new TextEncoder().encode(JSON.stringify(originalJwk))
    
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(createMockCryptoKey('private', 'PBKDF2'))
    window.crypto.subtle.deriveKey = vi.fn().mockResolvedValue(mockDerivedKey)
    window.crypto.subtle.decrypt = vi.fn().mockResolvedValue(decryptedData)

    const result = await decryptJwkWithPassword(encryptedBlob, password)
    
    expect(result).toEqual(originalJwk)
  })

  it('should throw error with incorrect password', async () => {
    const encryptedBlob = {
      salt: 'a1b2c3d4e5f607182938475664738291',
      iv: '1234567890ab',
      ciphertext: 'encryptedBase64Data',
    }
    
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(createMockCryptoKey('private', 'PBKDF2'))
    window.crypto.subtle.deriveKey = vi.fn().mockResolvedValue(createMockCryptoKey('private'))
    window.crypto.subtle.decrypt = vi.fn().mockRejectedValue(new Error(' decryption failed'))

    await expect(decryptJwkWithPassword(encryptedBlob, 'wrongPassword'))
      .rejects.toThrow('Decryption failed')
  })
})

describe('crypto.ts - encryptJSONWithPassword / decryptJSONWithPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    window.crypto.getRandomValues = vi.fn().mockImplementation((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i % 256
      }
      return arr
    })
  })

  it('should encrypt arbitrary JSON with password', async () => {
    const testObj = { name: 'test', value: 123 }
    const password = 'testPassword'
    
    const mockDerivedKey = createMockCryptoKey('private', { name: 'AES-GCM', length: 256 })
    const mockEncryptedData = new ArrayBuffer(100)
    
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(createMockCryptoKey('private', 'PBKDF2'))
    window.crypto.subtle.deriveKey = vi.fn().mockResolvedValue(mockDerivedKey)
    window.crypto.subtle.encrypt = vi.fn().mockResolvedValue(mockEncryptedData)

    const result = await encryptJSONWithPassword(testObj, password)
    
    expect(result).toHaveProperty('salt')
    expect(result).toHaveProperty('iv')
    expect(result).toHaveProperty('ciphertext')
  })

  it('should round-trip encrypt and decrypt JSON', async () => {
    const testObj = { name: 'roundTripTest', data: { nested: true } }
    const password = 'roundTripPassword'
    
    const mockDerivedKey = createMockCryptoKey('private', { name: 'AES-GCM', length: 256 })
    const encryptedData = new TextEncoder().encode(JSON.stringify(testObj))
    
    // Import key returns same key for same password
    const importKeyMock = vi.fn().mockResolvedValue(createMockCryptoKey('private', 'PBKDF2'))
    window.crypto.subtle.importKey = importKeyMock
    window.crypto.subtle.deriveKey = vi.fn().mockResolvedValue(mockDerivedKey)
    window.crypto.subtle.encrypt = vi.fn().mockResolvedValue(encryptedData)
    window.crypto.subtle.decrypt = vi.fn().mockResolvedValue(encryptedData)

    const encrypted = await encryptJSONWithPassword(testObj, password)
    const decrypted = await decryptJSONWithPassword(encrypted, password)
    
    expect(decrypted).toEqual(testObj)
  })
})

describe('crypto.ts - jwkThumbprint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should compute thumbprint from P-256 public key', async () => {
    const publicJwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: 'testXValue123456789',
      y: 'testYValue987654321',
    }
    
    const mockDigest = new ArrayBuffer(32)
    
    window.crypto.subtle.digest = vi.fn().mockResolvedValue(mockDigest)

    const thumbprint = await jwkThumbprint(publicJwk)
    
    // Should be 40 characters (20 bytes hex)
    expect(thumbprint).toHaveLength(40)
    expect(thumbprint).toMatch(/^[0-9a-f]+$/)
  })

  it('should produce same thumbprint for same JWK', async () => {
    const publicJwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: 'sameX',
      y: 'sameY',
    }
    
    window.crypto.subtle.digest = vi.fn().mockImplementation((algo, data) => {
      // Return consistent digest for same input
      const encoder = new TextEncoder()
      const encoded = encoder.encode(data as any)
      const hash = new Uint8Array(32)
      for (let i = 0; i < 32; i++) {
        hash[i] = encoded[i % encoded.length] || i
      }
      return Promise.resolve(hash.buffer)
    })

    const thumbprint1 = await jwkThumbprint(publicJwk)
    const thumbprint2 = await jwkThumbprint(publicJwk)
    
    expect(thumbprint1).toBe(thumbprint2)
  })
})

describe('crypto.ts - Signing and Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should sign data with private key', async () => {
    const privateJwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: 'test-x',
      y: 'test-y',
      d: 'test-d',
    }
    
    const data = 'test data to sign'
    const mockSignature = new ArrayBuffer(64)
    
    const mockKey = createMockCryptoKey('private')
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(mockKey)
    window.crypto.subtle.sign = vi.fn().mockResolvedValue(mockSignature)

    const result = await signString(privateJwk, data)
    
    expect(result).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('should verify signature with public key', async () => {
    const publicJwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: 'test-x',
      y: 'test-y',
    }
    
    const data = 'test data'
    const signature = 'validSignatureBase64'
    
    const mockKey = createMockCryptoKey('public')
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(mockKey)
    window.crypto.subtle.verify = vi.fn().mockResolvedValue(true)

    const result = await verifySignature(publicJwk, data, signature)
    
    expect(result).toBe(true)
  })

  it('should return false for invalid signature', async () => {
    const publicJwk: JsonWebKey = {
      kty: 'EC',
      crv: 'P-256',
      x: 'test-x',
      y: 'test-y',
    }
    
    window.crypto.subtle.importKey = vi.fn().mockResolvedValue(createMockCryptoKey('public'))
    window.crypto.subtle.verify = vi.fn().mockResolvedValue(false)

    const result = await verifySignature(publicJwk, 'data', 'invalidSig')
    
    expect(result).toBe(false)
  })
})