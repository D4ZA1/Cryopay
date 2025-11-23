import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowUpRight, ArrowDownLeft, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const Dashboard = () => {
  const isNonCustodial = true;
  const { user, balance } = useAuth();
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getStatusClass = (status: string) => (status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800');
  const getTransactionIcon = (type: string) => (type === 'Sent' ? <ArrowUpRight className="h-5 w-5 text-red-500" /> : <ArrowDownLeft className="h-5 w-5 text-green-500" />);

  useEffect(() => {
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('blocks')
          .select('data')
          .eq('user_id', user.id)
          .order('id', { ascending: false })
          .limit(6);
        if (error) {
          console.warn('failed to fetch recent blocks', error);
          setRecentTx([]);
        } else {
          setRecentTx((data as any) || []);
        }
      } catch (e) {
        console.warn('recent tx fetch error', e);
        setRecentTx([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500">CURRENT BALANCE</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
            <p className="text-slate-500">~ {(balance / 3000).toFixed(4)} ETH</p>
            {isNonCustodial && (
              <div className="flex items-center text-sm text-slate-500 mt-2"><span>Connected: 0xAbC...dEf</span><button className="ml-2 hover:text-slate-800"><Copy className="h-4 w-4" /></button></div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-slate-500">QUICK ACTIONS</CardTitle></CardHeader>
          <CardContent className="flex gap-4"><Button className="w-full"><ArrowUp className="mr-2 h-4 w-4" /> Send</Button><Button variant="secondary" className="w-full"><ArrowUp className="mr-2 h-4 w-4" /> Receive</Button></CardContent>
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
                  const isSent = s.from === (user?.id) || s.kind === 'buy' || s.kind === 'sell';
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
    </div>
  );
};

export default Dashboard;

