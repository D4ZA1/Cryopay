import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const Blockchain: React.FC = () => {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('blocks').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to fetch blocks', error);
        setBlocks([]);
      } else {
        setBlocks(data || []);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Blockchain</h1>
      {loading && <div>Loading blocks...</div>}
      {!loading && blocks.length === 0 && <div>No blocks found.</div>}
      <div className="space-y-4">
        {blocks.map(b => (
          <div key={b.id} className="border rounded p-3 bg-white">
            <div className="text-xs text-slate-500">#{b.id} — {b.created_at}</div>
            <pre className="text-sm mt-2 overflow-auto max-h-40">{JSON.stringify(b.data, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blockchain;
