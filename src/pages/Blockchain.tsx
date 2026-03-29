import React, { useEffect, useState } from 'react';
import { getBlocks } from '../lib/api';

const Blockchain: React.FC = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      setLoading(true);
      try {
        const response = await getBlocks();
        if (isMounted) {
          if (!response.ok) {
            console.error('Failed to fetch blocks', response.error);
            setBlocks([]);
          } else {
            setBlocks(response.data?.blocks || []);
          }
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch blocks', error);
          setBlocks([]);
          setLoading(false);
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-6 min-h-screen max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Blockchain</h1>
        <p className="text-slate-400">View all blocks in the chain</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Loading blocks...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && blocks.length === 0 && (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-12 text-center">
          <div className="text-slate-400 text-lg">No blocks found.</div>
          <div className="text-slate-500 text-sm mt-2">Blocks will appear here once they are mined.</div>
        </div>
      )}

      {/* Blocks List */}
      <div className="space-y-4">
        {blocks.map(b => (
          <div 
            key={b.id} 
            className="bg-slate-900/60 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.02] transition-all duration-200"
          >
            {/* Block Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className="text-slate-400 text-sm font-medium">Block</div>
                <div className="font-mono text-xl font-bold text-white">#{b.id}</div>
                {b.status && (
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    b.status === 'confirmed' 
                      ? 'bg-emerald-400/10 text-emerald-400' 
                      : 'bg-amber-400/10 text-amber-400'
                  }`}>
                    {b.status}
                  </span>
                )}
              </div>
              <div className="text-slate-500 text-sm">{b.created_at}</div>
            </div>

            {/* Block Data */}
            <div className="space-y-3">
              {/* Hash Display */}
              {b.hash && (
                <div className="flex items-start gap-3">
                  <div className="text-slate-400 text-sm font-medium min-w-[100px]">Hash:</div>
                  <div className="font-mono text-cyan-400 text-sm break-all">{b.hash}</div>
                </div>
              )}
              
              {/* Previous Hash */}
              {b.previous_hash && (
                <div className="flex items-start gap-3">
                  <div className="text-slate-400 text-sm font-medium min-w-[100px]">Prev Hash:</div>
                  <div className="font-mono text-slate-400 text-sm break-all">{b.previous_hash}</div>
                </div>
              )}

              {/* Transactions Count */}
              {b.transactions_count !== undefined && (
                <div className="flex items-start gap-3">
                  <div className="text-slate-400 text-sm font-medium min-w-[100px]">Transactions:</div>
                  <div className="text-white text-sm">{b.transactions_count}</div>
                </div>
              )}

              {/* Block Data JSON */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-slate-400 text-sm font-medium">Block Data:</div>
                  <button className="text-xs px-3 py-1 bg-white/[0.06] hover:bg-white/[0.08] text-slate-400 rounded-lg transition-colors">
                    Copy
                  </button>
                </div>
                <pre className="bg-slate-900/80 border border-white/[0.06] rounded-xl p-4 text-sm text-slate-300 overflow-auto max-h-60 scrollbar-thin scrollbar-thumb-white/[0.06] scrollbar-track-transparent">
{JSON.stringify(b.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blockchain;
