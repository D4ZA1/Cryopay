import React, { useEffect, useState, useCallback } from 'react';
import { Database, RefreshCw, ChevronDown, ChevronUp, Copy, CheckCheck, ArrowRightLeft, Boxes, Hash, Clock, Link, AlertCircle } from 'lucide-react';

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? 'https://cryo-worker.jaswanthwork84-cc7.workers.dev';

interface BlockchainTransaction {
  id: number;
  user_id: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount_wei: string;
  currency: string;
  status: string;
  block_number: number | null;
  confirmations: number;
  gas_used: string | null;
  transaction_fee: string | null;
  created_at: string;
  confirmed_at: string | null;
}

interface Block {
  id: number;
  data: any;
  previous_hash: string | null;
  hash: string;
  created_at: string;
  user_id: string;
  transactions: BlockchainTransaction[];
  transactions_count: number;
}

interface Stats {
  total_blocks: number;
  total_transactions: number;
  confirmed_transactions: number;
  pending_transactions: number;
}

function truncateHash(hash: string | null | undefined, chars = 12): string {
  if (!hash) return '—';
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}

function weiToEth(wei: string | null | undefined): string {
  if (!wei) return '—';
  try {
    const num = BigInt(wei);
    const eth = Number(num) / 1e18;
    return eth.toFixed(6);
  } catch {
    return wei;
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded hover:bg-white/[0.08] text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
      title="Copy"
    >
      {copied
        ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
        : <Copy className="h-3.5 w-3.5" />
      }
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    confirmed: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
    pending:   'bg-amber-400/10 text-amber-400 border border-amber-400/20',
    failed:    'bg-red-400/10 text-red-400 border border-red-400/20',
  };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${styles[status] ?? 'bg-slate-400/10 text-slate-400 border border-slate-400/20'}`}>
      {status}
    </span>
  );
}

function TransactionRow({ tx }: { tx: BlockchainTransaction }) {
  return (
    <div className="bg-slate-950/60 border border-white/[0.05] rounded-xl p-4 space-y-3">
      {/* Top row: hash + status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ArrowRightLeft className="h-4 w-4 text-cyan-400 flex-shrink-0" />
          <span className="font-mono text-xs text-cyan-400 truncate">{truncateHash(tx.tx_hash, 16)}</span>
          {tx.tx_hash && <CopyButton text={tx.tx_hash} />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{tx.currency ?? 'ETH'}</span>
          <StatusBadge status={tx.status} />
        </div>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-start gap-2">
          <span className="text-xs text-slate-500 min-w-[36px] pt-0.5">From</span>
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-mono text-xs text-slate-300 truncate">{truncateHash(tx.from_address, 10)}</span>
            {tx.from_address && <CopyButton text={tx.from_address} />}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs text-slate-500 min-w-[24px] pt-0.5">To</span>
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-mono text-xs text-slate-300 truncate">{truncateHash(tx.to_address, 10)}</span>
            {tx.to_address && <CopyButton text={tx.to_address} />}
          </div>
        </div>
      </div>

      {/* Amount + meta */}
      <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-white/[0.04]">
        <div>
          <span className="text-xs text-slate-500">Amount </span>
          <span className="text-sm font-semibold text-white">{weiToEth(tx.amount_wei)} ETH</span>
        </div>
        {tx.gas_used && (
          <div>
            <span className="text-xs text-slate-500">Gas </span>
            <span className="text-xs text-slate-400">{tx.gas_used}</span>
          </div>
        )}
        {tx.confirmations !== undefined && tx.confirmations !== null && (
          <div>
            <span className="text-xs text-slate-500">Confirmations </span>
            <span className="text-xs text-slate-400">{tx.confirmations}</span>
          </div>
        )}
        <div className="ml-auto">
          <span className="text-xs text-slate-500">{formatDate(tx.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

function BlockCard({ block, index }: { block: Block; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const isGenesis = !block.previous_hash;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.10] transition-all duration-200">
      {/* Block Header */}
      <div
        className="flex items-center justify-between px-6 py-5 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Block icon + number */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Boxes className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Block</span>
              <span className="font-mono text-lg font-bold text-white">#{block.id}</span>
              {isGenesis && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-400/10 text-indigo-400 border border-indigo-400/20">
                  Genesis
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3 text-slate-600" />
              <span className="text-xs text-slate-500">{formatDate(block.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Transaction count badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 rounded-lg border border-white/[0.05]">
            <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">
              {block.transactions_count} tx{block.transactions_count !== 1 ? 's' : ''}
            </span>
          </div>
          {/* Expand toggle */}
          <div className="text-slate-500">
            {expanded
              ? <ChevronUp className="h-5 w-5" />
              : <ChevronDown className="h-5 w-5" />
            }
          </div>
        </div>
      </div>

      {/* Block Hash Row — always visible */}
      <div className="px-6 pb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <Hash className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-500 mb-0.5">Hash</div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-cyan-400 truncate">{block.hash}</span>
              <CopyButton text={block.hash} />
            </div>
          </div>
        </div>
        {block.previous_hash && (
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Link className="h-3.5 w-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500 mb-0.5">Prev Hash</div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs text-slate-400 truncate">{truncateHash(block.previous_hash, 20)}</span>
                <CopyButton text={block.previous_hash} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-white/[0.06] px-6 py-5 space-y-5">

          {/* Blockchain Transactions */}
          {block.transactions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowRightLeft className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">
                  Blockchain Transactions ({block.transactions.length})
                </span>
              </div>
              <div className="space-y-2">
                {block.transactions.map(tx => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            </div>
          )}

          {/* Block Data */}
          {block.data !== null && block.data !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-300">Block Data</span>
                </div>
                <button
                  onClick={() => setShowRaw(v => !v)}
                  className="text-xs px-3 py-1 bg-white/[0.05] hover:bg-white/[0.08] text-slate-400 rounded-lg transition-colors"
                >
                  {showRaw ? 'Collapse' : 'Expand'}
                </button>
              </div>
              {showRaw && (
                <pre className="bg-slate-950/80 border border-white/[0.05] rounded-xl p-4 text-xs text-slate-300 overflow-auto max-h-80 scrollbar-thin scrollbar-thumb-white/[0.06] scrollbar-track-transparent leading-relaxed">
                  {JSON.stringify(block.data, null, 2)}
                </pre>
              )}
              {!showRaw && (
                <div className="text-xs text-slate-500 italic">Click "Expand" to view raw block data</div>
              )}
            </div>
          )}

          {/* No transactions note */}
          {block.transactions.length === 0 && (block.data === null || block.data === undefined) && (
            <div className="text-center py-4 text-slate-600 text-sm">No transaction data in this block.</div>
          )}
        </div>
      )}
    </div>
  );
}

const Blockchain: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${WORKER_URL}/api/blocks`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Failed to fetch blocks');
        setBlocks([]);
      } else {
        setBlocks(json.blocks ?? []);
        setStats(json.stats ?? null);
        setLastRefreshed(new Date());
      }
    } catch (e) {
      setError((e as Error).message ?? 'Network error');
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  return (
    <div className="p-6 min-h-screen max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Boxes className="h-5 w-5 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Blockchain</h1>
          </div>
          <p className="text-slate-400 text-sm ml-12">
            All blocks and on-chain transactions in the chain
            {lastRefreshed && (
              <span className="ml-2 text-slate-600">
                · Last updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchBlocks}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Blocks', value: stats.total_blocks, color: 'text-indigo-400' },
            { label: 'Total Transactions', value: stats.total_transactions, color: 'text-cyan-400' },
            { label: 'Confirmed', value: stats.confirmed_transactions, color: 'text-emerald-400' },
            { label: 'Pending', value: stats.pending_transactions, color: 'text-amber-400' },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-xl px-4 py-3"
            >
              <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          <div className="text-slate-400 text-sm">Loading blocks…</div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-red-400 font-semibold mb-1">Failed to load blocks</div>
            <div className="text-red-400/70 text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && blocks.length === 0 && (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-16 text-center">
          <Boxes className="h-12 w-12 text-slate-700 mx-auto mb-4" />
          <div className="text-slate-400 text-lg font-medium">No blocks found</div>
          <div className="text-slate-600 text-sm mt-2">
            Blocks will appear here once transactions are recorded.
          </div>
        </div>
      )}

      {/* Chain visualiser strip */}
      {!loading && !error && blocks.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max pb-2">
            {[...blocks].reverse().slice(0, 12).map((b, i, arr) => (
              <React.Fragment key={b.id}>
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center">
                    <span className="text-xs text-slate-500">#{b.id}</span>
                    <span className="text-xs font-bold text-indigo-400">{b.transactions_count}tx</span>
                  </div>
                  <span className="text-[10px] text-slate-600 mt-1">{b.hash.slice(0, 6)}…</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-500/40 to-indigo-500/10 mx-0.5" />
                )}
              </React.Fragment>
            ))}
            {blocks.length > 12 && (
              <div className="ml-2 text-xs text-slate-600">+{blocks.length - 12} more</div>
            )}
          </div>
        </div>
      )}

      {/* Block Cards */}
      {!loading && !error && (
        <div className="space-y-4">
          {blocks.map((block, idx) => (
            <BlockCard key={block.id} block={block} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Blockchain;
