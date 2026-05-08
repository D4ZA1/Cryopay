import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, AlertCircle, CheckCircle, Bus, ShoppingCart, Heart } from 'lucide-react';
import { redeemVoucher, getRecycleBalance } from '@/lib/api';

const VOUCHERS = [
  {
    type: 'transit' as const,
    label: 'Transit Pass',
    description: 'Public transport day pass',
    cost: 100,
    icon: Bus,
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
  },
  {
    type: 'grocery' as const,
    label: 'Grocery Voucher',
    description: '€5 off at partner stores',
    cost: 200,
    icon: ShoppingCart,
    color: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-600',
  },
  {
    type: 'charity' as const,
    label: 'Charity Donation',
    description: 'Donate to environmental NGO',
    cost: 50,
    icon: Heart,
    color: 'bg-pink-50 border-pink-200',
    iconColor: 'text-pink-600',
  },
];

const RedeemVoucher = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [selected, setSelected] = useState<typeof VOUCHERS[0] | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ voucherCode: string; type: string } | null>(null);

  useEffect(() => {
    getRecycleBalance().then((res) => {
      if (res.ok) setBalance(res.data?.balance ?? 0);
    });
  }, []);

  const handleRedeem = async () => {
    if (!selected) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await redeemVoucher(selected.cost, selected.type);
      if (res.ok && res.data) {
        setSuccess({ voucherCode: res.data.voucher_code, type: selected.label });
        setIsConfirming(false);
        setBalance((b) => (b !== null ? b - selected.cost : null));
      } else {
        setError(res.error ?? 'Redemption failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Redemption failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Voucher Redeemed!</h1>
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-slate-500 mb-2">{success.type}</p>
            <p className="text-2xl font-mono font-bold text-slate-800">{success.voucherCode}</p>
            <p className="text-xs text-slate-400 mt-2">Save this code — it won't be shown again.</p>
          </CardContent>
        </Card>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/recycle/wallet')}>
            Back to Wallet
          </Button>
          <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => setSuccess(null)}>
            Redeem Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Redeem Tokens</h1>
        <p className="text-slate-500 text-sm mt-1">
          Balance: <span className="font-bold text-green-700">{balance ?? '...'} GRN</span>
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {VOUCHERS.map((v) => {
          const canAfford = (balance ?? 0) >= v.cost;
          const Icon = v.icon;
          return (
            <Card
              key={v.type}
              className={`cursor-pointer border-2 transition-all ${v.color} ${!canAfford ? 'opacity-50' : 'hover:shadow-md'}`}
              onClick={() => { if (canAfford) { setSelected(v); setIsConfirming(true); setError(null); } }}
            >
              <CardContent className="py-4 flex items-center gap-4">
                <div className={`p-3 rounded-full bg-white ${v.iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{v.label}</p>
                  <p className="text-sm text-slate-500">{v.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{v.cost} GRN</p>
                  {!canAfford && <p className="text-xs text-red-500">Insufficient</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Confirmation dialog */}
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Redemption</DialogTitle>
            <DialogDescription>
              This will burn <strong>{selected?.cost} GRN</strong> tokens and issue a <strong>{selected?.label}</strong>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsConfirming(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleRedeem} disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</> : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RedeemVoucher;
