import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowUp,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Check,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Send,
  Download,
  Activity,
  ExternalLink,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useCallback, useRef } from "react";
import { getBlocks, getWallet } from "../lib/api";
import { TransactionKind } from "../constants";
import { motion, AnimatePresence } from "framer-motion";
import CryptoTicker from "@/components/CryptoTicker";
import {
  FadeInUp,
  FadeInRight,
  StaggerContainer,
  StaggerItem,
  CountUp,
} from "@/components/ScrollAnimations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarketCoin {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  color: string;
  icon: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MARKET_COINS_META: Record<
  string,
  { name: string; color: string; icon: string }
> = {
  BTCUSDT: { name: "Bitcoin", color: "#F7931A", icon: "BTC" },
  ETHUSDT: { name: "Ethereum", color: "#627EEA", icon: "ETH" },
  SOLUSDT: { name: "Solana", color: "#9945FF", icon: "SOL" },
  BNBUSDT: { name: "BNB", color: "#F3BA2F", icon: "BNB" },
};

const PORTFOLIO_SEGMENTS = [
  { label: "BTC", color: "#F7931A", percent: 42 },
  { label: "ETH", color: "#627EEA", percent: 31 },
  { label: "SOL", color: "#9945FF", percent: 15 },
  { label: "Other", color: "#64748B", percent: 12 },
];

// ---------------------------------------------------------------------------
// Mini Sparkline Bars
// ---------------------------------------------------------------------------

function SparklineBars({
  isPositive,
  seed,
}: {
  isPositive: boolean;
  seed: number;
}) {
  const heights = isPositive
    ? [35 + seed, 45 + seed, 55 + seed, 70 + seed, 85 + seed]
    : [85 - seed, 70 - seed, 55 - seed, 45 - seed, 35 - seed];

  return (
    <div className="flex items-end gap-[3px] h-8">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="w-[4px] rounded-sm"
          style={{
            backgroundColor: isPositive
              ? "rgba(52, 211, 153, 0.7)"
              : "rgba(248, 113, 113, 0.7)",
          }}
          initial={{ height: 0 }}
          animate={{ height: `${Math.min(Math.max(h, 20), 100)}%` }}
          transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard Component
// ---------------------------------------------------------------------------

const Dashboard = () => {
  const isNonCustodial = true;
  const { user, balance, setBalance } = useAuth();
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [marketData, setMarketData] = useState<MarketCoin[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const navigate = useNavigate();
  const portfolioRef = useRef<HTMLDivElement>(null);
  const [portfolioVisible, setPortfolioVisible] = useState(false);

  // Observe portfolio bar entering viewport
  useEffect(() => {
    if (!portfolioRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPortfolioVisible(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(portfolioRef.current);
    return () => observer.disconnect();
  }, []);

  const getStatusClass = (status: string) =>
    status === "Completed"
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      : "bg-amber-500/10 text-amber-400 border border-amber-500/20";

  const getTransactionIcon = (type: string) =>
    type === "Sent" ? (
      <ArrowUpRight className="h-5 w-5 text-red-400" />
    ) : (
      <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
    );

  // Fetch wallet address
  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const response = await getWallet();
        if (response.ok && response.data?.wallet?.public_key) {
          setWalletAddress(response.data.wallet.public_key);
        }
      } catch (e) {
        console.warn("wallet fetch error", e);
      }
    })();
  }, [user]);

  // Fetch balance from blocks
  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await getBlocks();
        if (!response.ok) {
          console.warn("failed to fetch recent blocks", response.error);
          setRecentTx([]);
        } else {
          const userBlocks = (response.data?.blocks || []).filter(
            (b: any) => b.user_id === user.id
          );
          setRecentTx(userBlocks.slice(0, 6));

          // Calculate balance from blocks
          let totalBalance = 0;
          userBlocks.forEach((block: any) => {
            const s = block?.data?.public_summary || {};
            if (s.amountFiat) {
              const kind = s.kind || TransactionKind.TX;
              let amount = 0;

              if (kind === TransactionKind.BUY) {
                amount = -Math.abs(s.amountFiat);
              } else if (kind === TransactionKind.SELL) {
                amount = Math.abs(s.amountFiat);
              } else {
                const isSender =
                  s.from_user_id === user?.id ||
                  block.user_id === user?.id ||
                  s.from === user?.id;
                amount = isSender
                  ? -Math.abs(s.amountFiat)
                  : Math.abs(s.amountFiat);
              }

              totalBalance += amount;
            }
          });
          setBalance(Math.max(0, totalBalance));
        }
      } catch (e) {
        console.warn("recent tx fetch error", e);
        setRecentTx([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, setBalance]);

  // Fetch market data from Binance
  const fetchMarketData = useCallback(async () => {
    try {
      const symbols = Object.keys(MARKET_COINS_META);
      const params = symbols.map((s) => `"${s}"`).join(",");
      const res = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=[${params}]`
      );
      if (!res.ok) throw new Error("Market data fetch failed");
      const data = await res.json();

      const coins: MarketCoin[] = symbols.map((sym) => {
        const meta = MARKET_COINS_META[sym];
        const item = data.find((d: any) => d.symbol === sym);
        return {
          symbol: sym,
          name: meta.name,
          price: item ? parseFloat(item.lastPrice) : 0,
          change24h: item ? parseFloat(item.priceChangePercent) : 0,
          color: meta.color,
          icon: meta.icon,
        };
      });

      setMarketData(coins);
    } catch {
      // Fallback data
      setMarketData([
        { symbol: "BTCUSDT", name: "Bitcoin", price: 87420.5, change24h: 1.24, color: "#F7931A", icon: "BTC" },
        { symbol: "ETHUSDT", name: "Ethereum", price: 2045.3, change24h: -0.87, color: "#627EEA", icon: "ETH" },
        { symbol: "SOLUSDT", name: "Solana", price: 142.8, change24h: 3.45, color: "#9945FF", icon: "SOL" },
        { symbol: "BNBUSDT", name: "BNB", price: 612.4, change24h: 0.56, color: "#F3BA2F", icon: "BNB" },
      ]);
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30_000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Handle copy address
  const copyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle send button click
  const handleSend = () => {
    navigate("/transactions");
  };

  // Handle receive button click - show wallet address
  const handleReceive = () => {
    if (walletAddress) {
      setShowReceiveModal(true);
    } else {
      alert("No wallet address found. Please set up your wallet first.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* ------------------------------------------------------------------ */}
      {/* Crypto Ticker Strip */}
      {/* ------------------------------------------------------------------ */}
      <CryptoTicker />

      {/* ------------------------------------------------------------------ */}
      {/* Main Content */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Greeting */}
        <FadeInUp delay={0.05}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Welcome back
                {user?.email ? (
                  <span className="text-emerald-400">
                    , {user.email.split("@")[0]}
                  </span>
                ) : null}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Here's your portfolio overview
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              Live
            </div>
          </div>
        </FadeInUp>

        {/* -------------------------------------------------------------- */}
        {/* Balance + Quick Actions Row */}
        {/* -------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card */}
          <FadeInUp delay={0.1} className="lg:col-span-2">
            <div className="relative group">
              {/* Gradient glow border */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 opacity-60 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
              <Card className="relative bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl overflow-hidden">
                {/* Background decorations */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

                <CardHeader className="relative pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <Wallet className="h-4 w-4 text-emerald-400" />
                    Total Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl md:text-5xl font-bold text-white tabular-nums">
                      <CountUp
                        to={balance}
                        duration={2}
                        prefix="$"
                        decimals={2}
                        className="text-4xl md:text-5xl font-bold text-white"
                      />
                    </span>
                    <span className="text-sm text-slate-400 font-medium">
                      USD
                    </span>
                  </div>

                  <p className="text-sm text-slate-500">
                    ≈ {(balance / 3000).toFixed(4)} ETH
                  </p>

                  {isNonCustodial && walletAddress && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-slate-400 font-mono">
                          {walletAddress.slice(0, 10)}...
                          {walletAddress.slice(-6)}
                        </span>
                        <button
                          className="ml-1 text-slate-500 hover:text-white transition-colors"
                          onClick={copyAddress}
                        >
                          <AnimatePresence mode="wait">
                            {copied ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="copy"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </FadeInUp>

          {/* Quick Actions Card */}
          <FadeInRight delay={0.2}>
            <Card className="bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold h-11 rounded-xl transition-colors"
                    onClick={handleSend}
                  >
                    <Send className="mr-2 h-4 w-4" /> Send
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="secondary"
                    className="w-full bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.06] font-semibold h-11 rounded-xl transition-colors"
                    onClick={handleReceive}
                  >
                    <Download className="mr-2 h-4 w-4" /> Receive
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to="/buy-sell" className="block">
                    <Button
                      variant="secondary"
                      className="w-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-cyan-400 border border-cyan-500/20 font-semibold h-11 rounded-xl transition-colors"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" /> Buy Crypto
                    </Button>
                  </Link>
                </motion.div>
              </CardContent>
            </Card>
          </FadeInRight>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Market Overview Cards */}
        {/* -------------------------------------------------------------- */}
        <div>
          <FadeInUp delay={0.15}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Market Overview
            </h2>
          </FadeInUp>
          <StaggerContainer
            staggerDelay={0.1}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {marketLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <StaggerItem key={i}>
                    <Card className="bg-slate-900/60 border-white/[0.06] rounded-2xl animate-pulse">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="w-16 h-3 bg-white/[0.06] rounded" />
                            <div className="w-24 h-5 bg-white/[0.08] rounded" />
                            <div className="w-14 h-3 bg-white/[0.06] rounded" />
                          </div>
                          <div className="w-10 h-8 bg-white/[0.04] rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))
              : marketData.map((coin, idx) => (
                  <StaggerItem key={coin.symbol}>
                    <motion.div
                      whileHover={{ scale: 1.03, y: -2 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Card className="bg-slate-900/60 backdrop-blur-xl border-white/[0.06] rounded-2xl hover:border-white/[0.12] transition-colors cursor-pointer group">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                                  style={{
                                    backgroundColor: `${coin.color}22`,
                                    color: coin.color,
                                    border: `1.5px solid ${coin.color}55`,
                                  }}
                                >
                                  {coin.icon}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {coin.name}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    {coin.icon}/USD
                                  </p>
                                </div>
                              </div>
                              <p className="text-lg font-bold text-white tabular-nums pt-1">
                                {coin.price >= 1000
                                  ? `$${coin.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : coin.price >= 1
                                    ? `$${coin.price.toFixed(2)}`
                                    : `$${coin.price.toFixed(4)}`}
                              </p>
                              <div className="flex items-center gap-1">
                                {coin.change24h >= 0 ? (
                                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                                )}
                                <span
                                  className={`text-xs font-medium tabular-nums ${
                                    coin.change24h >= 0
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {coin.change24h >= 0 ? "+" : ""}
                                  {coin.change24h.toFixed(2)}%
                                </span>
                                <span className="text-[10px] text-slate-600 ml-1">
                                  24h
                                </span>
                              </div>
                            </div>
                            <SparklineBars
                              isPositive={coin.change24h >= 0}
                              seed={(idx * 7) % 15}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </StaggerItem>
                ))}
          </StaggerContainer>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Portfolio Distribution */}
        {/* -------------------------------------------------------------- */}
        <FadeInUp delay={0.2}>
          <Card className="bg-slate-900/60 backdrop-blur-xl border-white/[0.06] rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Portfolio Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Bar */}
              <div
                ref={portfolioRef}
                className="flex h-4 rounded-full overflow-hidden bg-white/[0.04]"
              >
                {PORTFOLIO_SEGMENTS.map((seg, i) => (
                  <motion.div
                    key={seg.label}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ backgroundColor: seg.color }}
                    initial={{ width: 0 }}
                    animate={{
                      width: portfolioVisible ? `${seg.percent}%` : 0,
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.15,
                      ease: [0.25, 0.4, 0, 1],
                    }}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4">
                {PORTFOLIO_SEGMENTS.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-xs text-slate-400">
                      {seg.label}{" "}
                      <span className="text-slate-500">{seg.percent}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeInUp>

        {/* -------------------------------------------------------------- */}
        {/* Recent Activity */}
        {/* -------------------------------------------------------------- */}
        <FadeInUp delay={0.25}>
          <Card className="bg-slate-900/60 backdrop-blur-xl border-white/[0.06] rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                Recent Activity
              </CardTitle>
              <Link
                to="/transactions"
                className="text-xs font-medium text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                View All <ExternalLink className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="text-slate-500 text-xs font-medium">
                      Details
                    </TableHead>
                    <TableHead className="text-right text-slate-500 text-xs font-medium">
                      Amount
                    </TableHead>
                    <TableHead className="text-center text-slate-500 text-xs font-medium">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTx.length === 0 && !loading ? (
                    <TableRow className="border-white/[0.06] hover:bg-white/[0.02]">
                      <TableCell colSpan={3}>
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                          <Activity className="h-10 w-10 text-slate-700 mb-3" />
                          <p className="text-sm font-medium">
                            No recent activity
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            Your transactions will appear here
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTx.map((row: any, i: number) => {
                      const s = row?.data?.public_summary || {};
                      const kind = s.kind || TransactionKind.TX;
                      const isSent =
                        kind === TransactionKind.BUY ||
                        kind === TransactionKind.SELL ||
                        s.from_user_id === user?.id ||
                        row.user_id === user?.id ||
                        s.from === user?.id;
                      const displayTitle = isSent
                        ? s.to
                          ? `To ${s.to}`
                          : `${s.kind || "Sent"}`
                        : s.from
                          ? `From ${s.from}`
                          : s.kind || "Received";
                      const amountUSD = s.amountFiat ?? null;
                      const amountCrypto = s.amountCrypto ?? null;
                      const date = s.timestamp
                        ? new Date(s.timestamp).toLocaleString()
                        : "";

                      return (
                        <motion.tr
                          key={i}
                          className="border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: i * 0.05,
                            ease: "easeOut",
                          }}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <span className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                                {getTransactionIcon(
                                  isSent ? "Sent" : "Received"
                                )}
                              </span>
                              <div>
                                <div className="font-medium text-white text-sm">
                                  {displayTitle}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {date}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <div
                              className={`font-semibold text-sm ${
                                amountUSD && amountUSD > 0
                                  ? "text-emerald-400"
                                  : "text-white"
                              }`}
                            >
                              {amountUSD != null
                                ? amountUSD.toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                  })
                                : "—"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {amountCrypto != null
                                ? `≈ ${Math.abs(amountCrypto)} ${s.crypto || ""}`
                                : ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-4">
                            <span
                              className={`px-2.5 py-1 text-[10px] font-semibold rounded-full ${getStatusClass("Completed")}`}
                            >
                              Completed
                            </span>
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </FadeInUp>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Receive Modal */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
        <DialogContent className="bg-slate-900 border-white/[0.08] text-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Download className="h-5 w-5 text-emerald-400" />
              Receive Crypto
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Share this address to receive crypto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-xl break-all">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-medium">
                Your Wallet Address
              </p>
              <p className="font-mono text-sm text-white">
                {walletAddress || "No wallet address found"}
              </p>
            </div>
            <div className="flex gap-3">
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={copyAddress}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl"
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy Address"}
                </Button>
              </motion.div>
              <Button
                variant="secondary"
                className="bg-white/[0.06] hover:bg-white/[0.1] text-white border-white/[0.06] rounded-xl"
                onClick={() => setShowReceiveModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
