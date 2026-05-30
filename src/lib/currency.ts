/**
 * Currency Conversion Utilities
 *
 * Provides robust currency conversion with multiple API fallbacks,
 * caching, and retry logic for both crypto and fiat currencies.
 */

// ============================================================================
// Types
// ============================================================================

/** Result of a price/rate fetch operation */
interface PriceResult {
  price: number;
  source: string;
  isStale: boolean;
}

/** Cached price entry with timestamp */
interface CacheEntry {
  value: number;
  source: string;
  timestamp: number;
}

/** API response from Binance */
interface BinanceTickerResponse {
  symbol: string;
  price: string;
}

/** API response from CoinGecko */
interface CoinGeckoResponse {
  [id: string]: {
    usd: number;
  };
}

/** API response from Frankfurter */
interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

// ============================================================================
// Constants
// ============================================================================

/** Cache duration in milliseconds (30 seconds) */
const CACHE_TTL_MS = 30 * 1000;

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

/** CoinGecko ID mapping for supported cryptocurrencies */
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  SOL: 'solana',
  ADA: 'cardano',
};

/** Hardcoded fallback crypto prices in USD */
const FALLBACK_CRYPTO_PRICES: Record<string, number> = {
  BTC: 67000,
  ETH: 3500,
  BNB: 600,
  SOL: 150,
  ADA: 0.45,
  USDT: 1,
};

/** Hardcoded fallback fiat rates from USD */
const FALLBACK_FIAT_RATES: Record<string, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.5,
  AUD: 1.53,
};

// ============================================================================
// Cache
// ============================================================================

/** In-memory cache for crypto prices */
const cryptoPriceCache = new Map<string, CacheEntry>();

/** In-memory cache for fiat exchange rates */
const fiatRateCache = new Map<string, CacheEntry>();

/**
 * Check if a cache entry is still valid
 */
function isCacheValid(entry: CacheEntry | undefined): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

/**
 * Get cached value if valid
 */
function getCached(
  cache: Map<string, CacheEntry>,
  key: string
): CacheEntry | null {
  const entry = cache.get(key);
  if (isCacheValid(entry)) {
    return entry!;
  }
  return null;
}

/**
 * Set cache value
 */
function setCache(
  cache: Map<string, CacheEntry>,
  key: string,
  value: number,
  source: string
): void {
  cache.set(key, {
    value,
    source,
    timestamp: Date.now(),
  });
}

// ============================================================================
// Fetch Utilities
// ============================================================================

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Retry a fetch operation once on failure
 */
async function fetchWithRetry(url: string): Promise<Response> {
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response;
  } catch (error) {
    // Retry once
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response;
  }
}

// ============================================================================
// Crypto Price Fetching
// ============================================================================

/**
 * Fetch crypto price from Binance API
 */
async function fetchFromBinance(crypto: string): Promise<number | null> {
  try {
    const symbol = crypto.toUpperCase();
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`;
    const response = await fetchWithRetry(url);
    const data: BinanceTickerResponse = await response.json();
    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) {
      return null;
    }
    return price;
  } catch (error) {
    console.warn(`Binance API failed for ${crypto}:`, error);
    return null;
  }
}

/**
 * Fetch crypto price from CoinGecko API
 */
async function fetchFromCoinGecko(crypto: string): Promise<number | null> {
  try {
    const symbol = crypto.toUpperCase();
    const geckoId = COINGECKO_IDS[symbol];
    if (!geckoId) {
      console.warn(`No CoinGecko ID mapping for ${crypto}`);
      return null;
    }
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`;
    const response = await fetchWithRetry(url);
    const data: CoinGeckoResponse = await response.json();
    const price = data[geckoId]?.usd;
    if (typeof price !== 'number' || price <= 0) {
      return null;
    }
    return price;
  } catch (error) {
    console.warn(`CoinGecko API failed for ${crypto}:`, error);
    return null;
  }
}

/**
 * Get hardcoded fallback crypto price
 */
function getFallbackCryptoPrice(crypto: string): number | null {
  const symbol = crypto.toUpperCase();
  const price = FALLBACK_CRYPTO_PRICES[symbol];
  if (price !== undefined) {
    console.warn(
      `Using hardcoded fallback price for ${crypto}. This may be outdated.`
    );
    return price;
  }
  return null;
}

/**
 * Fetch crypto price in USD with multiple fallbacks
 * @internal
 */
async function fetchCryptoPriceUSD(
  crypto: string
): Promise<{ price: number; source: string; isStale: boolean }> {
  const symbol = crypto.toUpperCase();

  // Check cache first
  const cached = getCached(cryptoPriceCache, symbol);
  if (cached) {
    return {
      price: cached.value,
      source: `${cached.source} (cached)`,
      isStale: false,
    };
  }

  // Try Binance (primary)
  const binancePrice = await fetchFromBinance(symbol);
  if (binancePrice !== null) {
    setCache(cryptoPriceCache, symbol, binancePrice, 'binance');
    return { price: binancePrice, source: 'binance', isStale: false };
  }

  // Try CoinGecko (fallback 1)
  const geckoPrice = await fetchFromCoinGecko(symbol);
  if (geckoPrice !== null) {
    setCache(cryptoPriceCache, symbol, geckoPrice, 'coingecko');
    return { price: geckoPrice, source: 'coingecko', isStale: false };
  }

  // Try hardcoded fallback (fallback 2)
  const fallbackPrice = getFallbackCryptoPrice(symbol);
  if (fallbackPrice !== null) {
    // Don't cache fallback prices - always try live APIs first
    return { price: fallbackPrice, source: 'hardcoded-fallback', isStale: true };
  }

  throw new Error(`Unable to fetch price for cryptocurrency: ${crypto}`);
}

// ============================================================================
// Fiat Exchange Rate Fetching
// ============================================================================

/**
 * Fetch fiat rate from Frankfurter API
 */
async function fetchFromFrankfurter(
  from: string,
  to: string
): Promise<number | null> {
  try {
    const fromCurrency = from.toUpperCase();
    const toCurrency = to.toUpperCase();

    // Handle same currency
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const url = `https://api.frankfurter.app/latest?from=${fromCurrency}&to=${toCurrency}`;
    const response = await fetchWithRetry(url);
    const data: FrankfurterResponse = await response.json();
    const rate = data.rates[toCurrency];
    if (typeof rate !== 'number' || rate <= 0) {
      return null;
    }
    return rate;
  } catch (error) {
    console.warn(`Frankfurter API failed for ${from}/${to}:`, error);
    return null;
  }
}

/**
 * Fetch fiat rate from exchangerate.host (legacy fallback)
 */
async function fetchFromExchangeRateHost(
  from: string,
  to: string
): Promise<number | null> {
  try {
    const fromCurrency = from.toUpperCase();
    const toCurrency = to.toUpperCase();

    // Handle same currency
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const url = `https://api.exchangerate.host/convert?from=${fromCurrency}&to=${toCurrency}`;
    const response = await fetchWithRetry(url);
    const data = await response.json();
    const rate = data.result;
    if (typeof rate !== 'number' || rate <= 0) {
      return null;
    }
    return rate;
  } catch (error) {
    console.warn(`exchangerate.host API failed for ${from}/${to}:`, error);
    return null;
  }
}

/**
 * Get hardcoded fallback fiat rate
 */
function getFallbackFiatRate(from: string, to: string): number | null {
  const fromCurrency = from.toUpperCase();
  const toCurrency = to.toUpperCase();

  // Handle same currency
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const fromRate = FALLBACK_FIAT_RATES[fromCurrency];
  const toRate = FALLBACK_FIAT_RATES[toCurrency];

  if (fromRate !== undefined && toRate !== undefined) {
    console.warn(
      `Using hardcoded fallback rate for ${from}/${to}. This may be outdated.`
    );
    // Convert through USD: from -> USD -> to
    return toRate / fromRate;
  }

  return null;
}

/**
 * Fetch fiat exchange rate with multiple fallbacks
 * @internal
 */
async function fetchFiatRate(
  from: string,
  to: string
): Promise<{ rate: number; source: string; isStale: boolean }> {
  const fromCurrency = from.toUpperCase();
  const toCurrency = to.toUpperCase();
  const cacheKey = `${fromCurrency}/${toCurrency}`;

  // Handle same currency
  if (fromCurrency === toCurrency) {
    return { rate: 1, source: 'identity', isStale: false };
  }

  // Check cache first
  const cached = getCached(fiatRateCache, cacheKey);
  if (cached) {
    return {
      rate: cached.value,
      source: `${cached.source} (cached)`,
      isStale: false,
    };
  }

  // Try Frankfurter (primary)
  const frankfurterRate = await fetchFromFrankfurter(fromCurrency, toCurrency);
  if (frankfurterRate !== null) {
    setCache(fiatRateCache, cacheKey, frankfurterRate, 'frankfurter');
    return { rate: frankfurterRate, source: 'frankfurter', isStale: false };
  }

  // Try exchangerate.host (fallback 1)
  const exchangeRateHostRate = await fetchFromExchangeRateHost(
    fromCurrency,
    toCurrency
  );
  if (exchangeRateHostRate !== null) {
    setCache(fiatRateCache, cacheKey, exchangeRateHostRate, 'exchangerate.host');
    return {
      rate: exchangeRateHostRate,
      source: 'exchangerate.host',
      isStale: false,
    };
  }

  // Try hardcoded fallback (fallback 2)
  const fallbackRate = getFallbackFiatRate(fromCurrency, toCurrency);
  if (fallbackRate !== null) {
    // Don't cache fallback rates - always try live APIs first
    return { rate: fallbackRate, source: 'hardcoded-fallback', isStale: true };
  }

  throw new Error(`Unable to fetch exchange rate for ${from}/${to}`);
}

// ============================================================================
// Exported Functions
// ============================================================================

/**
 * Get the price of a cryptocurrency in a specified fiat currency
 *
 * @param crypto - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @param fiat - Fiat currency code (e.g., 'USD', 'EUR', 'INR')
 * @returns Price result with price, source, and staleness indicator
 *
 * @example
 * ```typescript
 * const result = await getCryptoPrice('BTC', 'EUR');
 * console.log(`1 BTC = ${result.price} EUR (source: ${result.source})`);
 * if (result.isStale) {
 *   console.warn('Warning: Price may be outdated');
 * }
 * ```
 */
export async function getCryptoPrice(
  crypto: string,
  fiat: string
): Promise<PriceResult> {
  const fiatCurrency = fiat.toUpperCase();

  // Get crypto price in USD
  const cryptoResult = await fetchCryptoPriceUSD(crypto);

  // If requesting USD, return directly
  if (fiatCurrency === 'USD') {
    return cryptoResult;
  }

  // Get fiat exchange rate from USD to target currency
  const fiatResult = await fetchFiatRate('USD', fiatCurrency);

  // Calculate final price
  const finalPrice = cryptoResult.price * fiatResult.rate;
  const isStale = cryptoResult.isStale || fiatResult.isStale;

  // Combine sources
  const sources = [cryptoResult.source, fiatResult.source]
    .filter((s) => s !== 'identity')
    .join(' + ');

  return {
    price: finalPrice,
    source: sources,
    isStale,
  };
}

/**
 * Get the exchange rate between two fiat currencies
 *
 * @param from - Source fiat currency code (e.g., 'USD')
 * @param to - Target fiat currency code (e.g., 'EUR')
 * @returns Price result with rate, source, and staleness indicator
 *
 * @example
 * ```typescript
 * const result = await getFiatRate('USD', 'INR');
 * console.log(`1 USD = ${result.price} INR`);
 * ```
 */
export async function getFiatRate(
  from: string,
  to: string
): Promise<PriceResult> {
  const result = await fetchFiatRate(from, to);
  return {
    price: result.rate,
    source: result.source,
    isStale: result.isStale,
  };
}

/**
 * Get the rate to convert a currency to USD
 *
 * @param currency - Currency code (e.g., 'EUR', 'INR')
 * @returns Price result with rate, source, and staleness indicator
 *
 * @example
 * ```typescript
 * const result = await getUSDRate('EUR');
 * console.log(`1 EUR = ${result.price} USD`);
 * ```
 */
export async function getUSDRate(currency: string): Promise<PriceResult> {
  return getFiatRate(currency, 'USD');
}

/**
 * Convert a cryptocurrency amount to a fiat currency value
 *
 * @param amount - Amount of cryptocurrency
 * @param crypto - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @param fiat - Target fiat currency code (e.g., 'USD', 'EUR')
 * @returns Price result with converted value, source, and staleness indicator
 *
 * @example
 * ```typescript
 * const result = await convertCryptoToFiat(0.5, 'BTC', 'USD');
 * console.log(`0.5 BTC = ${result.price} USD`);
 * ```
 */
export async function convertCryptoToFiat(
  amount: number,
  crypto: string,
  fiat: string
): Promise<PriceResult> {
  const priceResult = await getCryptoPrice(crypto, fiat);
  return {
    price: amount * priceResult.price,
    source: priceResult.source,
    isStale: priceResult.isStale,
  };
}

/**
 * Convert a fiat currency amount to a cryptocurrency value
 *
 * @param amount - Amount of fiat currency
 * @param fiat - Source fiat currency code (e.g., 'USD', 'EUR')
 * @param crypto - Target cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @returns Price result with converted value, source, and staleness indicator
 *
 * @example
 * ```typescript
 * const result = await convertFiatToCrypto(1000, 'USD', 'ETH');
 * console.log(`1000 USD = ${result.price} ETH`);
 * ```
 */
export async function convertFiatToCrypto(
  amount: number,
  fiat: string,
  crypto: string
): Promise<PriceResult> {
  const priceResult = await getCryptoPrice(crypto, fiat);
  return {
    price: amount / priceResult.price,
    source: priceResult.source,
    isStale: priceResult.isStale,
  };
}

/**
 * Clear all cached prices and rates
 * Useful for testing or forcing fresh data
 */
export function clearCache(): void {
  cryptoPriceCache.clear();
  fiatRateCache.clear();
}

/**
 * Get cache statistics
 * @returns Object with cache entry counts
 */
export function getCacheStats(): {
  cryptoPriceEntries: number;
  fiatRateEntries: number;
} {
  return {
    cryptoPriceEntries: cryptoPriceCache.size,
    fiatRateEntries: fiatRateCache.size,
  };
}
