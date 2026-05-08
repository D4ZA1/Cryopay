import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Leaf, AlertCircle } from 'lucide-react';
import { getRecycleDeposits } from '@/lib/api';

interface Deposit {
  id: string;
  material_type: string;
  weight_grams: number;
  tokens_awarded: number;
  dynamic_tokens_per_kg: number;
  status: 'pending' | 'confirmed' | 'failed';
  on_chain_tx_hash: string | null;
  created_at: number;
}

const MATERIAL_LABELS: Record<string, string> = {
  plastic: '♻️ Plastic',
  glass: '🫙 Glass',
  paper: '📄 Paper',
  metal: '🔩 Metal',
  ewaste: '⚡ E-Waste',
};

const MATERIAL_EMOJI: Record<string, string> = {
  plastic: '♻️',
  glass: '🫙',
  paper: '📄',
  metal: '🔩',
  ewaste: '⚡',
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const RecycleHistory = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecycleDeposits(50).then((res) => {
      if (res.ok) setDeposits(res.data ?? []);
      else setError(res.error ?? 'Failed to load history');
    }).finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recycling History</h1>
        <p className="text-slate-500 text-sm mt-1">All your deposit records</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!isLoading && deposits.length === 0 && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <Leaf className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No deposits yet</p>
            <p className="text-sm text-slate-400 mt-1">Scan a recycling bin to earn your first GRN tokens.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {deposits.map((d) => (
          <Card key={d.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{MATERIAL_EMOJI[d.material_type] ?? '⚡'}</div>
                  <div>
                    <p className="font-medium text-slate-800">{MATERIAL_LABELS[d.material_type] ?? d.material_type}</p>
                    <p className="text-sm text-slate-500">{(d.weight_grams / 1000).toFixed(2)} kg · {d.dynamic_tokens_per_kg} GRN/kg</p>
                    <p className="text-xs text-slate-400">{new Date(d.created_at * 1000).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700">+{d.tokens_awarded} GRN</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[d.status] ?? ''}`}>
                    {d.status}
                  </span>
                </div>
              </div>
              {d.on_chain_tx_hash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${d.on_chain_tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-xs text-blue-500 hover:underline font-mono truncate"
                >
                  {d.on_chain_tx_hash}
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecycleHistory;
