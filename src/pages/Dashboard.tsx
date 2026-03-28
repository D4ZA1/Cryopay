import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowUp, ArrowUpRight, ArrowDownLeft, Copy, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getBlocks, getWallet } from '../lib/api';
import { TransactionKind } from '../constants';

const Dashboard = () => {
  const isNonCustodial = true;
  const { user, balance, setBalance } = useAuth();
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const getStatusClass = (status: string) => (status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800');
  const getTransactionIcon = (type: string) => (type === 'Sent' ? <ArrowUpRight className="h-5 w-5 text-red-500" /> : <ArrowDownLeft className="h-5 w-5 text-green-500" />);

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
        console.warn('wallet fetch error', e);
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
          console.warn('failed to fetch recent blocks', response.error);
          setRecentTx([]);
        } else {
          const userBlocks = (response.data?.blocks || []).filter((b: any) => b.user_id === user.id);
          setRecentTx(userBlocks.slice(0, 6));
          
          // Calculate balance from blocks
          let totalBalance = 0;
          userBlocks.forEach((block: any) => {
            const s = block?.data?.public_summary || {};
            if (s.amountFiat) {
              const kind = s.kind || TransactionKind.TX;
              let amount = 0;
              
              if (kind === TransactionKind.BUY) {
                // Buying crypto = spending fiat (negative)
                amount = -Math.abs(s.amountFiat);
              } else if (kind === TransactionKind.SELL) {
                // Selling crypto = receiving fiat (positive)
                amount = Math.abs(s.amountFiat);
              } else {
                // For peer-to-peer transactions, check if user is sender or recipient
                const isSender = s.from_user_id === user?.id || 
                                 block.user_id === user?.id ||
                                 s.from === user?.id;
                amount = isSender ? -Math.abs(s.amountFiat) : Math.abs(s.amountFiat);
              }
              
              totalBalance += amount;
            }
          });
          setBalance(Math.max(0, totalBalance));
        }
      } catch (e) {
        console.warn('recent tx fetch error', e);
        setRecentTx([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, setBalance]);

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
    navigate('/transactions');
  };

  // Handle receive button click - show wallet address
  const handleReceive = () => {
    if (walletAddress) {
      setShowReceiveModal(true);
    } else {
      alert('No wallet address found. Please set up your wallet first.');
    }
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500">CURRENT BALANCE</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
            <p className="text-slate-500">~ {(balance / 3000).toFixed(4)} ETH</p>
            {isNonCustodial && walletAddress && (
              <div className="flex items-center text-sm text-slate-500 mt-2">
                <span>Connected: {walletAddress.slice(0, 10)}...{walletAddress.slice(-6)}</span>
                <button className="ml-2 hover:text-slate-800" onClick={copyAddress}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500">QUICK ACTIONS</CardTitle></CardHeader>
          <CardContent className="flex gap-4">
            <Button className="w-full" onClick={handleSend}>
              <ArrowUp className="mr-2 h-4 w-4" /> Send
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleReceive}>
              <ArrowDownLeft className="mr-2 h-4 w-4" /> Receive
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Recent Activity</CardTitle><Link to="/transactions" className="text-sm font-medium text-slate-600 hover:text-slate-900">View All</Link></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Details</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {recentTx.length === 0 && !loading ? (
                <TableRow><TableCell colSpan={3}><div className="text-sm text-slate-500">No recent activity</div></TableCell></TableRow>
              ) : (
                recentTx.map((row: any, i: number) => {
                  const s = row?.data?.public_summary || {};
                  // Determine direction
                  const kind = s.kind || TransactionKind.TX;
                  const isSent = kind === TransactionKind.BUY || kind === TransactionKind.SELL || 
                                 s.from_user_id === user?.id || 
                                 row.user_id === user?.id ||
                                 s.from === user?.id;
                  const displayTitle = isSent ? (s.to ? `To ${s.to}` : `${s.kind || 'Sent'}`) : (s.from ? `From ${s.from}` : (s.kind || 'Received'));
                  const amountUSD = s.amountFiat ?? null;
                  const amountCrypto = s.amountCrypto ?? null;
                  const date = s.timestamp ? new Date(s.timestamp).toLocaleString() : '';
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="p-2 bg-slate-100 rounded-full">{getTransactionIcon(isSent ? 'Sent' : 'Received')}</span>
                          <div>
                            <div className="font-medium">{displayTitle}</div>
                            <div className="text-sm text-slate-500">{date}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${amountUSD && amountUSD > 0 ? 'text-green-600' : 'text-slate-800'}`}>
                          {amountUSD != null ? amountUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '—'}
                        </div>
                        <div className="text-sm text-slate-500">{amountCrypto != null ? `~ ${Math.abs(amountCrypto)} ${s.crypto || ''}` : ''}</div>
                      </TableCell>
                      <TableCell className="text-center"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass('Completed')}`}>Completed</span></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Receive Modal */}
      <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Crypto</DialogTitle>
            <DialogDescription>Share this address to receive crypto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 rounded-lg break-all">
              <p className="text-sm text-slate-500 mb-1">Your Wallet Address</p>
              <p className="font-mono text-sm">{walletAddress || 'No wallet address found'}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyAddress} className="flex-1">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Address'}
              </Button>
              <Button variant="secondary" onClick={() => setShowReceiveModal(false)}>
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

