import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock ResizeObserver for Radix UI components
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Mock IntersectionObserver for scroll animations
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock window.crypto.subtle for testing
const mockSubtle = {
  generateKey: vi.fn(),
  exportKey: vi.fn(),
  importKey: vi.fn(),
  deriveKey: vi.fn(),
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  digest: vi.fn(),
  sign: vi.fn(),
  verify: vi.fn(),
}

// Mock window.crypto
const mockCrypto = {
  subtle: mockSubtle,
  getRandomValues: vi.fn((arr: Uint8Array) => {
    // Fill with random values for testing
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256)
    }
    return arr
  }),
}

// Set up global mocks
Object.defineProperty(window, 'crypto', {
  value: mockCrypto,
  writable: true,
})

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-blob-url')
global.URL.revokeObjectURL = vi.fn()

// Mock localStorage with actual storage
const localStorageStore: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach(key => delete localStorageStore[key]); }),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
  configurable: true,
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    pathname: '/',
  },
  writable: true,
})

// Mock import.meta.env for tests
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_WORKER_URL: 'http://localhost:8787',
      },
    },
  },
  writable: true,
});

window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))
