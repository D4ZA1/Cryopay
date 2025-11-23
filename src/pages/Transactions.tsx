import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Download, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { decryptJSONWithPassword } from '../lib/crypto';
import { setSymKey, getSymKey } from '../lib/symmetricSession';

// We'll load transactions (blocks) from Supabase

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [transactions, setTransactions] = useState<any[]>([]);
  const { user, setBalance } = useAuth();
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [passwords, setPasswords] = useState<Record<string,string>>({});
  const [decryptedMap, setDecryptedMap] = useState<Record<string, any>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      // fetch current user's profile thumbprint (if any) to determine Sent/Received by thumbprint
      let currentThumb: string | null = null;
      try {
        if (user && user.id) {
          const { data: profs } = await supabase.from('profiles').select('public_key').eq('id', user.id).limit(1);
          if (profs && (profs as any).length) {
            currentThumb = (profs as any)[0]?.public_key?.thumbprint || null;
          }
        }
      } catch (e) { /* ignore */ }
      try {
        // We'll try to query by a top-level `user_id` column first (preferred),
        // and fall back to the JSON `data->>user_id` path if the column doesn't exist
        let data: any = null;
        let error: any = null;
  const baseSelect = () => supabase.from('blocks').select('id, data, hash, previous_hash, created_at, user_id').order('id', { ascending: false }).limit(100);

        // Central transaction page: load the most recent blocks globally (not per-user)
        const all = await baseSelect();
        data = all.data;
        error = all.error;
        if (error) {
          console.error('Failed to fetch blocks', error);
          return;
        }
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
            // Try to resolve thumbprints to profile ids in a single query. If the driver doesn't support JSON->>in for .in(),
            // this may fail; wrap in try/catch and ignore on failure.
            const { data: profs } = await supabase.from('profiles').select('id, public_key').in('public_key->>thumbprint', thumbprints as any[]);
            if (profs && (profs as any).length) {
              (profs as any).forEach((p: any) => {
                const tp = p?.public_key?.thumbprint;
                if (tp) thumbToProfile[tp] = p.id;
              });
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
    })();
    return () => { mounted = false; };
  }, [user]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || tx.status === filterStatus;
    const matchesType = filterType === 'All' || tx.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type === 'Sent' || type === 'Sell') {
      return <ArrowUpRight className="h-5 w-5 text-red-500" />;
    } else {
      return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
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
        <h1 className="text-3xl font-bold text-slate-900">Transaction History</h1>
        <p className="text-slate-600 mt-2">View and manage all your transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {(() => {
          const relevantTx = transactions.filter((t: any) => t.relevant);
          const totalReceived = relevantTx.filter((t: any) => t.amountUSD > 0).reduce((acc: number, t: any) => acc + t.amountUSD, 0);
          const totalSent = relevantTx.filter((t: any) => t.amountUSD < 0).reduce((acc: number, t: any) => acc + t.amountUSD, 0);
          return (
            <>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-500">Total Transactions</p>
                  <p className="text-2xl font-bold mt-2">{relevantTx.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-500">Total Received</p>
                  <p className="text-2xl font-bold mt-2 text-green-600">
                    ${totalReceived.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-500">Total Sent</p>
                  <p className="text-2xl font-bold mt-2 text-red-600">
                    ${Math.abs(totalSent).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-slate-500">Pending</p>
                  <p className="text-2xl font-bold mt-2 text-yellow-600">
                    {relevantTx.filter((t: any) => t.status === 'Pending').length}
                  </p>
                </CardContent>
              </Card>
            </>
          );
        })()}
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                name="txn_search"
                autoComplete="off"
                placeholder="Search by ID, address, or recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-slate-200 rounded-md text-sm"
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
                className="px-4 py-2 border border-slate-200 rounded-md text-sm"
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Transaction</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Date & Time</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700">Amount</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-700">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <React.Fragment key={tx.id}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                          <span className="p-2 bg-slate-100 rounded-full">
                            {getTransactionIcon(tx.type)}
                          </span>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {getTransactionLabel(tx)}
                              {/* Visual indicator when this row has been decrypted in-session */}
                              {decryptedMap[tx.id] && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800">Decrypted</span>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">ID: {tx.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">{tx.date}</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className={`font-medium ${tx.amountUSD > 0 ? 'text-green-600' : 'text-slate-800'}`}>
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
                          <Button type="button" variant="ghost" size="sm" className="text-slate-600" onClick={() => {
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
                        <td colSpan={5} className="bg-slate-50 px-4 py-3">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1">
                              <input
                                type="password"
                                autoComplete="current-password"
                                placeholder="Enter wallet key to decrypt"
                                value={passwords[tx.id] || ''}
                                onChange={(e) => setPasswords({ ...passwords, [tx.id]: e.target.value })}
                                className="border rounded px-3 py-2 w-full md:w-80"
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
                                  return alert('Enter a key or unlock your wallet (session key may be available)');
                                }
                                try {
                                  const blob = tx.raw?.data?.encrypted_blob;
                                  // encrypted blob for tx is available in blob
                                  if (!blob) {
                                    console.warn('[Transactions] no encrypted_blob present for tx', tx.id);
                                    return alert('No encrypted data for this transaction');
                                  }
                                  const plain = await decryptJSONWithPassword(blob, pw);
                                  // decrypt success
                                  setDecryptedMap({ ...decryptedMap, [tx.id]: plain });
                                  setSymKey(pw);
                                } catch (e: any) {
                                  console.error('decrypt failed', e);
                                  alert('Decryption failed: ' + (e?.message || String(e)));
                                }
                              }}>Decrypt</Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => { setOpenRow(null); }}>Close</Button>
                            </div>
                          </div>
                          {decryptedMap[tx.id] && (
                            <div className="mt-3 p-3 bg-white rounded border">
                              <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(decryptedMap[tx.id], null, 2)}</pre>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))
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