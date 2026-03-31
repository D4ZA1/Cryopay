import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Download, ArrowUpRight, ArrowDownLeft, RefreshCw, Link2, Unlink } from 'lucide-react';
import { getBlocks, getProfile, apiFetch, getBlockchainTransactions } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useEthereum } from '@/context/EthereumContext';
import { decryptJSONWithPassword } from '../lib/crypto';
import { setSymKey, getSymKey } from '../lib/symmetricSession';
import { 
  Transaction, 
  Block, 
  PublicSummary
} from '../types/schemas';
import { 
  TransactionKind, 
  TransactionDirection
} from '../constants';
import { getErrorMessage } from '@/lib/utils';
import { toast, Slide } from 'react-toastify';

// Helper function to determine transaction direction
const determineTransactionDirection = (
  block: Block, 
  currentUserId: string, 
  currentThumbprint?: string | null
): TransactionDirection => {
  const ps = block.data?.public_summary;
  if (!ps) return TransactionDirection.SENT;
  
  const kind = ps.kind;
  
  if (kind === TransactionKind.BUY) return TransactionDirection.BUY;
  if (kind === TransactionKind.SELL) return TransactionDirection.SELL;
  
  // For peer-to-peer transactions
  const isRecipient = 
    ps.to_user_id === currentUserId || 
    (currentThumbprint && ps.to_thumbprint === currentThumbprint);
  
  return isRecipient ? TransactionDirection.RECEIVED : TransactionDirection.SENT;
};

// Helper function to resolve display names
const resolveDisplayName = (
  userId?: string | null, 
  thumbprint?: string | null, 
  fallback?: string,
  profileMap?: Record<string, string>
): string => {
  if (userId && profileMap?.[userId]) return profileMap[userId];
  if (thumbprint && profileMap?.[thumbprint]) return profileMap[thumbprint];
  if (fallback) return fallback;
  if (thumbprint) return `${thumbprint.slice(0, 8)}...`;
  if (userId) return `User ${userId.slice(0, 8)}...`;
  return 'Unknown';
};

// We'll load transactions (blocks) from Supabase

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user, setBalance } = useAuth();
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [passwords, setPasswords] = useState<Record<string,string>>({});
  const [decryptedMap, setDecryptedMap] = useState<Record<string, PublicSummary>>({});
  
  // Blockchain transactions state
  const { isConnected: isEthConnected, address: ethAddress } = useEthereum();
  const [blockchainTx, setBlockchainTx] = useState<any[]>([]);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [showBlockchain, setShowBlockchain] = useState(false);

  // Helper to check if current user is a MetaMask wallet user
  const isMetaMaskUser = user?.email?.endsWith('@wallet.cryopay') ?? false;

  // Function to fetch transactions (extracted for refresh button)
  const fetchTransactions = async () => {
    let mounted = true;
    // fetch current user's profile thumbprint (if any) to determine Sent/Received by thumbprint
    let currentThumb: string | null = null;
    try {
      if (user && user.id) {
        const profRes = await getProfile();
        if (profRes.ok && profRes.data?.profile) {
          currentThumb = profRes.data.profile.public_key?.thumbprint || null;
        }
      }
    } catch (e) { /* ignore */ }
    try {
      // Load the most recent blocks globally (not per-user)
      const blocksRes = await getBlocks();
      if (!blocksRes.ok) {
        console.error('Failed to fetch blocks', blocksRes.error);
        return;
      }
      const data = blocksRes.data?.blocks || [];
      if (!mounted || !data) return;
      // Map each block to a display transaction using data.public_summary when present
      // First, build a map of thumbprint -> profile id for any thumbprints mentioned in the fetched blocks
      const thumbprints = Array.from(new Set(data.flatMap((b: any) => {
        const ps = (b.data && b.data.public_summary) || {};
        return [ps.from_thumbprint, ps.to_thumbprint].filter(Boolean);
      })));

      let thumbToProfile: Record<string, string> = {};
      if (thumbprints.length > 0) {
        try {
          // Try to resolve thumbprints to profile ids - we'll try each one
          for (const tp of thumbprints as string[]) {
            const profRes = await apiFetch(`/api/profile/search?thumbprint=${encodeURIComponent(tp)}`);
            if (profRes.ok && (profRes.data as any)?.profile) {
              thumbToProfile[tp] = (profRes.data as any).profile.id;
            }
          }
        } catch (e) {
          // ignore lookup failures; we'll still match by myThumbprint or user_id
        }
      }

        const rows = data.map((b: any) => {
        const ps = (b.data && b.data.public_summary) || {};
        const kind = ps.kind || 'tx';
        // Resolve thumbprints to profile ids where possible, and determine whether this is a Sent or Received tx for the current user
        const resolvedFrom = (ps.from_user_id) || (ps.from_thumbprint && thumbToProfile[ps.from_thumbprint]) || b.user_id || ps.from || null;
        const resolvedTo = (ps.to_user_id) || (ps.to_thumbprint && thumbToProfile[ps.to_thumbprint]) || ps.to || null;
        let isSent = false;
        if (user && user.id) {
          if (resolvedFrom && resolvedFrom === user.id) isSent = true;
          else if (resolvedTo && resolvedTo === user.id) isSent = false;
          else if (ps.from_thumbprint && currentThumb && ps.from_thumbprint === currentThumb) isSent = true;
          else if (ps.to_thumbprint && currentThumb && ps.to_thumbprint === currentThumb) isSent = false;
          else if (b.user_id && b.user_id === user.id) isSent = true;
          else if (ps.from && ps.from === user.id) isSent = true;
          else isSent = false;
        }

        let amountUSD = 0;
        if (kind === 'buy') amountUSD = -Math.abs(ps.amountFiat || 0);
        else if (kind === 'sell') amountUSD = Math.abs(ps.amountFiat || 0);
        else amountUSD = isSent ? -Math.abs(ps.amountFiat || 0) : (ps.amountFiat || 0);

        const txType = kind === 'buy' ? 'Buy' : kind === 'sell' ? 'Sell' : (kind === 'tx' ? (isSent ? 'Sent' : 'Received') : kind);

        const relevant = Boolean(user && (
          (resolvedFrom && resolvedFrom === user.id) ||
          (resolvedTo && resolvedTo === user.id) ||
          (ps?.from_thumbprint && currentThumb && ps.from_thumbprint === currentThumb) ||
          (ps?.to_thumbprint && currentThumb && ps.to_thumbprint === currentThumb) ||
          (b.user_id && user.id && b.user_id === user.id) ||
          (ps?.from && user.id && ps.from === user.id) ||
          (ps?.to && user.id && ps.to === user.id)
        ));

        return {
          id: String(b.id),
          type: txType,
          to: ps.to || 'You',
          from: ps.from || 'CryoPay',
          date: ps.timestamp || b.created_at,
          amountUSD,
          amountCrypto: ps.amountCrypto || 0,
          crypto: ps.crypto || '',
          status: 'Completed',
          txHash: b.hash,
          raw: b,
          relevant,
        };
      });
      setTransactions(rows);
      // compute balance as sum of amountUSD for transactions relevant to current user and store in auth context
      try {
        const relevant = rows.filter((r: any) => r.relevant);
        const bal = relevant.reduce((acc: number, r: any) => acc + (r.amountUSD || 0), 0);
        // setBalance is injected from AuthContext where available
        (setBalance as any)?.(bal);
      } catch (e) {
        // ignore if setBalance not available
      }
    } catch (e) {
      console.error('blocks fetch error', e);
    }
  };

  // Function to fetch blockchain transactions
  const fetchBlockchainTransactions = async () => {
    if (!(isMetaMaskUser && isEthConnected)) return;
    setBlockchainLoading(true);
    try {
      const response = await getBlockchainTransactions(50, 0);
      if (response.ok && response.data?.data?.transactions) {
        setBlockchainTx(response.data.data.transactions);
      }
    } catch (e) {
      console.error('Failed to fetch blockchain transactions', e);
    } finally {
      setBlockchainLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    return () => {};
  }, [user]);

  // Fetch blockchain transactions when connected
  useEffect(() => {
    if (isMetaMaskUser && isEthConnected) {
      fetchBlockchainTransactions();
    }
  }, [isEthConnected]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.crypto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || tx.status === filterStatus;
    const matchesType = filterType === 'All' || tx.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'Pending': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'Failed': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'Sent' || type === 'Sell') {
      return <ArrowUpRight className="h-5 w-5 text-red-400" />;
    } else {
      return <ArrowDownLeft className="h-5 w-5 text-emerald-400" />;
    }
  };

  const getTransactionLabel = (tx: any) => {
    if (tx.type === 'Sent') return `To ${tx.to}`;
    if (tx.type === 'Received') return `From ${tx.from}`;
    if (tx.type === 'Buy') return `Bought ${tx.crypto}`;
    if (tx.type === 'Sell') return `Sold to ${tx.to}`;
    return tx.type;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Transaction History</h1>
        <p className="text-slate-400 mt-2">View and manage all your transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {(() => {
          const relevantTx = transactions.filter((t: any) => t.relevant);
          const totalReceived = relevantTx.filter((t: any) => t.amountUSD > 0).reduce((acc: number, t: any) => acc + t.amountUSD, 0);
          const totalSent = relevantTx.filter((t: any) => t.amountUSD < 0).reduce((acc: number, t: any) => acc + t.amountUSD, 0);
          return (
            <>
              <Card className="bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-400">Total Transactions</p>
                  <p className="text-2xl font-bold mt-2 text-white">{relevantTx.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-400">Total Received</p>
                  <p className="text-2xl font-bold mt-2 text-emerald-400">
                    ${totalReceived.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-400">Total Sent</p>
                  <p className="text-2xl font-bold mt-2 text-red-400">
                    ${Math.abs(totalSent).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-400">Pending</p>
                  <p className="text-2xl font-bold mt-2 text-yellow-400">
                    {relevantTx.filter((t: any) => t.status === 'Pending').length}
                  </p>
                </CardContent>
              </Card>
            </>
          );
        })()}
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                name="txn_search"
                autoComplete="off"
                placeholder="Search by ID, address, crypto, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-white/[0.06] text-white placeholder:text-slate-500 focus:border-emerald-500/50"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {/* Off-chain / Blockchain toggle */}
              {isMetaMaskUser && isEthConnected && (
                <div className="flex gap-2">
                  <Button
                    variant={!showBlockchain ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowBlockchain(false)}
                    className={!showBlockchain ? "bg-emerald-500 text-black hover:bg-emerald-600" : "bg-white/[0.06] text-slate-400 border-white/[0.06] hover:bg-white/[0.1]"}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Off-chain
                  </Button>
                  <Button
                    variant={showBlockchain ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowBlockchain(true)}
                    className={showBlockchain ? "bg-emerald-500 text-black hover:bg-emerald-600" : "bg-white/[0.06] text-slate-400 border-white/[0.06] hover:bg-white/[0.1]"}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Blockchain
                  </Button>
                </div>
              )}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-slate-800/50 border border-white/[0.06] rounded-md text-sm text-white focus:border-emerald-500/50 focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="Sent">Sent</option>
                <option value="Received">Received</option>
                <option value="Buy">Buy</option>
                <option value="Sell">Sell</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-slate-800/50 border border-white/[0.06] rounded-md text-sm text-white focus:border-emerald-500/50 focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
              <Button variant="outline" size="icon" onClick={fetchTransactions} className="bg-white/[0.06] border-white/[0.06] hover:bg-white/[0.1] text-slate-400">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => {
                const csvContent = [
                  ['ID', 'Type', 'From', 'To', 'Date', 'Amount (USD)', 'Amount (Crypto)', 'Crypto', 'Status', 'Transaction Hash'].join(','),
                  ...filteredTransactions.map(tx => [
                    tx.id,
                    tx.type,
                    `"${tx.from}"`,
                    `"${tx.to}"`,
                    tx.date,
                    tx.amountUSD.toFixed(2),
                    tx.amountCrypto,
                    tx.crypto,
                    tx.status,
                    tx.txHash || ''
                  ].join(','))
                ].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }} className="bg-white/[0.06] border-white/[0.06] hover:bg-white/[0.1] text-slate-400">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-slate-900/80 backdrop-blur-xl border-white/[0.06] rounded-2xl">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Transaction</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-400">Date & Time</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-400">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-400">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Blockchain transactions view */}
                {showBlockchain && isMetaMaskUser && isEthConnected ? (
                  blockchainLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        Loading blockchain transactions...
                      </td>
                    </tr>
                  ) : blockchainTx.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        No blockchain transactions found
                      </td>
                    </tr>
                  ) : (
                    blockchainTx.map((tx) => {
                      const isSent = ethAddress && tx.from_address?.toLowerCase() === ethAddress.toLowerCase();
                      const statusDisplay = tx.status === 'confirmed' ? 'Completed' : tx.status === 'pending' ? 'Pending' : 'Failed';
                      const amountEth = tx.amount_wei ? parseFloat(tx.amount_wei) / 1e18 : 0;
                      
                      return (
                        <tr key={tx.id} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <span className="p-2 bg-white/[0.06] rounded-full">
                                {isSent ? (
                                  <ArrowUpRight className="h-5 w-5 text-red-400" />
                                ) : (
                                  <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
                                )}
                              </span>
                              <div>
                                <div className="font-medium flex items-center gap-2 text-white">
                                  {isSent ? `To ${tx.to_address?.slice(0, 8)}...` : `From ${tx.from_address?.slice(0, 8)}...`}
                                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    <Link2 className="h-3 w-3 inline mr-1" />
                                    On-chain
                                  </span>
                                </div>
                                <div className="text-sm text-slate-500">
                                  TX: {tx.tx_hash?.slice(0, 12)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-slate-400">
                              {tx.confirmed_at || tx.created_at}
                            </div>
                            {tx.block_number && (
                              <div className="text-xs text-slate-500">Block #{tx.block_number}</div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className={`font-medium ${!isSent ? 'text-emerald-400' : 'text-white'}`}>
                              {isSent ? '-' : '+'}{amountEth.toFixed(6)} {tx.currency || 'ETH'}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(statusDisplay)}`}>
                              {statusDisplay}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end">
                              {tx.tx_hash && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-400 hover:text-white hover:bg-white/[0.06]"
                                  onClick={() => window.open(`https://etherscan.io/tx/${tx.tx_hash}`, '_blank')}
                                >
                                  View on Etherscan
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )
                ) : (
                  /* Off-chain transactions view (existing code) */
                  filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <React.Fragment key={tx.id}>
                    <tr className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                          <span className="p-2 bg-white/[0.06] rounded-full">
                            {getTransactionIcon(tx.type)}
                          </span>
                          <div>
                            <div className="font-medium flex items-center gap-2 text-white">
                              {getTransactionLabel(tx)}
                              {/* Visual indicator when this row has been decrypted in-session */}
                              {decryptedMap[tx.id] && (
                                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Decrypted</span>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">ID: {tx.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-slate-400">{tx.date}</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className={`font-medium ${tx.amountUSD > 0 ? 'text-emerald-400' : 'text-white'}`}>
                          {tx.amountUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </div>
                        <div className="text-sm text-slate-500">
                          ~ {Math.abs(tx.amountCrypto)} {tx.crypto}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-white/[0.06]" onClick={() => {
                            const willOpen = openRow !== Number(tx.id);
                            // If we're opening the row and a session sym key exists, prefill the password
                            if (willOpen) {
                              try {
                                const sessionKey = getSymKey();
                                if (sessionKey) {
                                  setPasswords({ ...passwords, [tx.id]: sessionKey });
                                }
                              } catch (e) { console.warn('prefill symKey failed', e); }
                            }
                            setOpenRow(willOpen ? Number(tx.id) : null);
                          }}>
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {openRow === Number(tx.id) && (
                      <tr>
                        <td colSpan={5} className="bg-slate-800/50 px-4 py-3">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1">
                              <input
                                type="password"
                                autoComplete="current-password"
                                placeholder="Enter wallet key to decrypt"
                                value={passwords[tx.id] || ''}
                                onChange={(e) => setPasswords({ ...passwords, [tx.id]: e.target.value })}
                                className="bg-slate-800/50 border border-white/[0.06] text-white placeholder:text-slate-500 rounded px-3 py-2 w-full md:w-80 focus:border-emerald-500/50 focus:outline-none"
                                spellCheck={false}
                                autoCapitalize="none"
                                autoCorrect="off"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button type="button" size="sm" onClick={async () => {
                                const pw = passwords[tx.id];
                                // user attempted decrypt
                                if (!pw) {
                                  return toast.warning('Enter a key or unlock your wallet', {
                                    position: "top-center",
                                    autoClose: 5000,
                                    hideProgressBar: false,
                                    closeOnClick: false,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: "dark",
                                    transition: Slide,
                                  });
                                }
                                try {
                                  const blob = tx.raw?.data?.encrypted_blob;
                                  // encrypted blob for tx is available in blob
                                  if (!blob) {
                                    console.warn('[Transactions] no encrypted_blob present for tx', tx.id);
                                    return toast.error('No encrypted data for this transaction', {
                                      position: "top-center",
                                      autoClose: 5000,
                                      hideProgressBar: false,
                                      closeOnClick: false,
                                      pauseOnHover: true,
                                      draggable: true,
                                      progress: undefined,
                                      theme: "dark",
                                      transition: Slide,
                                    });
                                  }
                                  const plain = await decryptJSONWithPassword(blob, pw);
                                  // decrypt success
                                  setDecryptedMap({ ...decryptedMap, [tx.id]: plain });
                                  setSymKey(pw);
                                 } catch (e: any) {
                                   console.error('decrypt failed', e);
                                   toast.error('Decryption failed: ' + getErrorMessage(e), {
                                     position: "top-center",
                                     autoClose: 5000,
                                     hideProgressBar: false,
                                     closeOnClick: false,
                                     pauseOnHover: true,
                                     draggable: true,
                                     progress: undefined,
                                     theme: "dark",
                                     transition: Slide,
                                   });
                                }
                              }} className="bg-emerald-500 hover:bg-emerald-600 text-white">Decrypt</Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => { setOpenRow(null); }} className="bg-white/[0.06] border-white/[0.06] hover:bg-white/[0.1] text-slate-400">Close</Button>
                            </div>
                          </div>
                          {decryptedMap[tx.id] && (
                            <div className="mt-3 p-3 bg-slate-900/80 rounded border border-white/[0.06]">
                              <pre className="text-xs whitespace-pre-wrap text-slate-300">{JSON.stringify(decryptedMap[tx.id], null, 2)}</pre>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))
                )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {/* Inline decrypt UI replaced modal; no modal rendered here */}
    </div>
  );
};

export default Transactions;