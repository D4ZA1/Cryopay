import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Gift, Filter } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Coupon {
  id: string;
  type: string;
  label: string;
  description: string;
  cost_grn: number;
  icon: string;
  partner: string;
  validity_days: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  all: 'All',
  transit: '🚌 Transit',
  grocery: '🛒 Grocery',
  charity: '🌱 Charity',
  food: '☕ Food & Drink',
};

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/coupons').then((res) => {
      if (res.ok) setCoupons((res.data as any)?.coupons ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? coupons : coupons.filter((c) => c.type === filter);
  const types = ['all', ...Array.from(new Set(coupons.map((c) => c.type)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Gift className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Coupon Catalog</h1>
          <p className="text-slate-400">Spend your GRN tokens on real-world rewards</p>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap justify-center mb-10">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                filter === t
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((coupon, idx) => (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-5 flex flex-col hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{coupon.icon}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {coupon.cost_grn} GRN
                  </span>
                </div>
                <h3 className="text-white font-semibold text-base mb-1">{coupon.label}</h3>
                <p className="text-slate-400 text-sm flex-1 mb-4">{coupon.description}</p>
                <div className="border-t border-white/[0.06] pt-3 flex justify-between items-center">
                  <span className="text-xs text-slate-500">{coupon.partner}</span>
                  {coupon.validity_days && (
                    <span className="text-xs text-slate-500">{coupon.validity_days}d validity</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-slate-500 text-sm mt-12"
        >
          Redeem coupons in the <span className="text-emerald-400">EcoVault mobile app</span>
        </motion.p>
      </div>
    </div>
  );
}
