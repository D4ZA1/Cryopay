import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Leaf, Scale } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Leader {
  rank: number;
  name: string;
  total_earned: number;
  deposit_count: number;
  total_kg: string;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/leaderboard?limit=20').then((res) => {
      if (res.ok) setLeaders((res.data as any)?.leaderboard ?? []);
      else setError(res.error ?? 'Failed to load');
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Recycling Leaderboard</h1>
          <p className="text-slate-400">Top recyclers ranked by GRN tokens earned</p>
        </motion.div>

        {/* Error */}
        {error && <p className="text-red-400 text-center">{error}</p>}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Table */}
        {!loading && leaders.length > 0 && (
          <div className="space-y-3">
            {leaders.map((leader, idx) => (
              <motion.div
                key={leader.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border ${
                  leader.rank === 1 ? 'bg-yellow-500/5 border-yellow-500/20' :
                  leader.rank === 2 ? 'bg-slate-400/5 border-slate-400/20' :
                  leader.rank === 3 ? 'bg-orange-500/5 border-orange-500/20' :
                  'bg-slate-900/60 border-white/[0.06]'
                }`}
              >
                <span className="text-2xl w-8 text-center">
                  {MEDAL[leader.rank] ?? <span className="text-slate-500 text-sm font-bold">#{leader.rank}</span>}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-white">{leader.name}</p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Leaf className="w-3 h-3 text-emerald-400" /> {leader.total_kg} kg
                    </span>
                    <span className="text-xs text-slate-400">
                      {leader.deposit_count} deposits
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold text-lg">{leader.total_earned.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">GRN</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && leaders.length === 0 && !error && (
          <div className="text-center py-20">
            <Scale className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No recycling activity yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}
