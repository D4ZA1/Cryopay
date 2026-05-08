import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, TrendingUp, QrCode, Gift } from 'lucide-react';
import { getRecycleBalance, getMaterialPrices } from '@/lib/api';
import { useWallet } from '@/context/EthereumContext';

interface MaterialPrice {
  material_type: string;
  base_tokens_per_kg: number;
  current_dynamic_tokens_per_kg: number;
  s_factor: number;
  u_multiplier: number;
  updated_at: number;
}

const MATERIAL_EMOJI: Record<string, string> = {
  plastic: '♻️', glass: '🫙', paper: '📄', metal: '🔩', ewaste: '⚡',
};

const TokenWallet = () => {
  const { address } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [prices, setPrices] = useState<MaterialPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRecycleBalance(), getMaterialPrices()]).then(([balRes, pricesRes]) => {
      if (balRes.ok) setBalance(balRes.data?.balance ?? 0);
      if (pricesRes.ok) setPrices(pricesRes.data ?? []);
    }).finally(() => setIsLoading(false));
  }, []);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Token Wallet</h1>

      {/* Balance card */}
      <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0">
        <CardContent className="py-8">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-medium">GRN Balance</span>
          </div>
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <p className="text-5xl font-bold">{balance ?? 0}</p>
          )}
          <p className="text-green-200 text-sm mt-1">GreenToken (GRN)</p>
          {address && (
            <p className="text-green-300 text-xs font-mono mt-3">{formatAddress(address)}</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/recycle/scan">
          <Button variant="outline" className="w-full h-14 flex-col gap-1">
            <QrCode className="w-5 h-5 text-green-600" />
            <span className="text-xs">Scan Bin</span>
          </Button>
        </Link>
        <Link to="/recycle/redeem">
          <Button variant="outline" className="w-full h-14 flex-col gap-1">
            <Gift className="w-5 h-5 text-purple-600" />
            <span className="text-xs">Redeem</span>
          </Button>
        </Link>
      </div>

      {/* Live prices */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Live GRN Rates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-green-600" />}
          {prices.map((p) => {
            const change = p.current_dynamic_tokens_per_kg - p.base_tokens_per_kg;
            const changePercent = ((change / p.base_tokens_per_kg) * 100).toFixed(0);
            const isUp = change >= 0;
            return (
              <div key={p.material_type} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{MATERIAL_EMOJI[p.material_type] ?? '♻️'}</span>
                  <div>
                    <p className="text-sm font-medium capitalize">{p.material_type}</p>
                    <p className="text-xs text-slate-400">Base: {p.base_tokens_per_kg} GRN/kg</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{p.current_dynamic_tokens_per_kg} GRN/kg</p>
                  <p className={`text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                    {isUp ? '+' : ''}{changePercent}%
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="text-center">
        <Link to="/recycle/history" className="text-sm text-green-600 hover:underline">
          View recycling history →
        </Link>
      </div>
    </div>
  );
};

export default TokenWallet;
