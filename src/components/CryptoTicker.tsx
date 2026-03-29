import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TickerData {
  symbol: string;
  displaySymbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: number;
  color: string;
}

interface CryptoTickerProps {
  speed?: number;
  className?: string;
}

interface BinanceTickerResponse {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRACKED_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'ADAUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'AVAXUSDT',
  'DOTUSDT',
  'MATICUSDT',
] as const;

const SYMBOL_META: Record<string, { display: string; color: string }> = {
  BTCUSDT: { display: 'BTC', color: '#F7931A' },
  ETHUSDT: { display: 'ETH', color: '#627EEA' },
  SOLUSDT: { display: 'SOL', color: '#9945FF' },
  BNBUSDT: { display: 'BNB', color: '#F3BA2F' },
  ADAUSDT: { display: 'ADA', color: '#0033AD' },
  XRPUSDT: { display: 'XRP', color: '#00AAE4' },
  DOGEUSDT: { display: 'DOGE', color: '#C2A633' },
  AVAXUSDT: { display: 'AVAX', color: '#E84142' },
  DOTUSDT: { display: 'DOT', color: '#E6007A' },
  MATICUSDT: { display: 'MATIC', color: '#8247E5' },
};

const FALLBACK_DATA: TickerData[] = [
  { symbol: 'BTCUSDT', displaySymbol: 'BTC', price: 87420.5, change24h: 1.24, high24h: 88000, low24h: 86200, volume: 32145, color: '#F7931A' },
  { symbol: 'ETHUSDT', displaySymbol: 'ETH', price: 2045.3, change24h: -0.87, high24h: 2080, low24h: 2010, volume: 18234, color: '#627EEA' },
  { symbol: 'SOLUSDT', displaySymbol: 'SOL', price: 142.8, change24h: 3.45, high24h: 148, low24h: 138, volume: 9876, color: '#9945FF' },
  { symbol: 'BNBUSDT', displaySymbol: 'BNB', price: 612.4, change24h: 0.56, high24h: 618, low24h: 605, volume: 5432, color: '#F3BA2F' },
  { symbol: 'ADAUSDT', displaySymbol: 'ADA', price: 0.72, change24h: -1.23, high24h: 0.74, low24h: 0.71, volume: 14567, color: '#0033AD' },
  { symbol: 'XRPUSDT', displaySymbol: 'XRP', price: 2.34, change24h: 2.1, high24h: 2.4, low24h: 2.28, volume: 21345, color: '#00AAE4' },
  { symbol: 'DOGEUSDT', displaySymbol: 'DOGE', price: 0.168, change24h: -2.34, high24h: 0.175, low24h: 0.162, volume: 8765, color: '#C2A633' },
  { symbol: 'AVAXUSDT', displaySymbol: 'AVAX', price: 38.9, change24h: 1.89, high24h: 40.2, low24h: 37.8, volume: 4321, color: '#E84142' },
  { symbol: 'DOTUSDT', displaySymbol: 'DOT', price: 7.42, change24h: -0.45, high24h: 7.6, low24h: 7.3, volume: 6543, color: '#E6007A' },
  { symbol: 'MATICUSDT', displaySymbol: 'MATIC', price: 0.56, change24h: 0.98, high24h: 0.58, low24h: 0.54, volume: 11234, color: '#8247E5' },
];

const REFRESH_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 1) {
    return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 3, maximumFractionDigits: 6 });
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/** Generate mini bar heights based on the price relative to its 24h high/low. */
function getMiniBarHeights(ticker: TickerData): number[] {
  const range = ticker.high24h - ticker.low24h;
  if (range === 0) return [50, 50, 50, 50];

  const normalized = (ticker.price - ticker.low24h) / range; // 0–1
  const isUp = ticker.change24h >= 0;

  if (isUp) {
    return [30 + normalized * 20, 40 + normalized * 25, 50 + normalized * 30, 60 + normalized * 40];
  }
  return [60 + (1 - normalized) * 40, 50 + (1 - normalized) * 30, 40 + (1 - normalized) * 25, 30 + (1 - normalized) * 20];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CryptoIcon({ symbol, color }: { symbol: string; color: string }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-[10px] font-bold tracking-tight select-none"
      style={{ backgroundColor: `${color}22`, color, border: `1.5px solid ${color}55` }}
    >
      {symbol.slice(0, 3)}
    </div>
  );
}

function MiniBars({ heights, isPositive }: { heights: number[]; isPositive: boolean }) {
  const barColor = isPositive ? 'bg-emerald-400' : 'bg-red-400';
  return (
    <div className="flex items-end gap-[2px] h-4 ml-2">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-sm ${barColor}`}
          style={{ height: `${Math.min(Math.max(h, 15), 100)}%`, opacity: 0.5 + i * 0.15 }}
        />
      ))}
    </div>
  );
}

function TickerItem({ data }: { data: TickerData }) {
  const isPositive = data.change24h >= 0;
  const barHeights = getMiniBarHeights(data);

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 border-r border-white/[0.06] last:border-r-0 select-none whitespace-nowrap">
      <CryptoIcon symbol={data.displaySymbol} color={data.color} />

      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
          {data.displaySymbol}
          <span className="text-slate-500/70 font-normal ml-0.5">/USD</span>
        </span>
        <span className="text-sm font-semibold text-white tabular-nums">
          {formatPrice(data.price)}
        </span>
      </div>

      <div className="flex items-center gap-1 ml-1">
        {isPositive ? (
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
        )}
        <span
          className={`text-xs font-medium tabular-nums ${
            isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {formatChange(data.change24h)}
        </span>
      </div>

      <MiniBars heights={barHeights} isPositive={isPositive} />
    </div>
  );
}

function TickerSkeleton() {
  return (
    <div className="flex items-center gap-6 px-4 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4">
          <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
          <div className="flex flex-col gap-1.5">
            <div className="w-12 h-2.5 rounded bg-white/[0.06]" />
            <div className="w-20 h-3 rounded bg-white/[0.08]" />
          </div>
          <div className="w-14 h-3 rounded bg-white/[0.06] ml-2" />
          <div className="flex items-end gap-[2px] h-4 ml-1">
            {[40, 55, 65, 80].map((h, j) => (
              <div key={j} className="w-[3px] rounded-sm bg-white/[0.06]" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CryptoTicker({ speed = 30, className = '' }: CryptoTickerProps) {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrices = useCallback(async (isInitial = false) => {
    try {
      const params = TRACKED_SYMBOLS.map((s) => `"${s}"`).join(',');
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=[${params}]`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`Binance API responded with ${res.status}`);

      const data: BinanceTickerResponse[] = await res.json();

      const mapped: TickerData[] = TRACKED_SYMBOLS.map((sym) => {
        const item = data.find((d) => d.symbol === sym);
        const meta = SYMBOL_META[sym];

        if (!item) {
          const fb = FALLBACK_DATA.find((f) => f.symbol === sym)!;
          return fb;
        }

        return {
          symbol: sym,
          displaySymbol: meta.display,
          price: parseFloat(item.lastPrice),
          change24h: parseFloat(item.priceChangePercent),
          high24h: parseFloat(item.highPrice),
          low24h: parseFloat(item.lowPrice),
          volume: parseFloat(item.volume),
          color: meta.color,
        };
      });

      setTickers(mapped);
      setError(null);
      setUsingFallback(false);
    } catch (err) {
      console.error('[CryptoTicker] Failed to fetch prices:', err);

      if (isInitial) {
        setTickers(FALLBACK_DATA);
        setUsingFallback(true);
      }

      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices(true);
    intervalRef.current = setInterval(() => fetchPrices(false), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchPrices]);

  // Duplicate content for seamless loop
  const tickerContent = tickers.length > 0 ? [...tickers, ...tickers] : [];

  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-950/80 backdrop-blur-xl border-y border-white/[0.06] ${className}`}
    >
      {/* Gradient fade — left */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-slate-950/90 to-transparent" />
      {/* Gradient fade — right */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-slate-950/90 to-transparent" />

      {/* Fallback / error badge */}
      <AnimatePresence>
        {usingFallback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-1 right-24 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20"
          >
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] text-amber-400 font-medium">Offline data</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {loading ? (
        <div className="py-1">
          <TickerSkeleton />
        </div>
      ) : (
        <div className="relative flex py-1">
          <motion.div
            className="flex"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              x: {
                duration: speed,
                ease: 'linear',
                repeat: Infinity,
                repeatType: 'loop',
              },
            }}
          >
            {tickerContent.map((ticker, index) => (
              <TickerItem key={`${ticker.symbol}-${index}`} data={ticker} />
            ))}
          </motion.div>
        </div>
      )}

      {/* Subtle top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      {/* Subtle bottom highlight line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
    </div>
  );
}
