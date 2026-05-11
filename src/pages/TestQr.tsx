import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { QrCode, RefreshCw, FlaskConical } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch } from '@/lib/api';

interface Bin {
  bin_id: string;
  location_name: string | null;
  supported_materials: string | null;
  is_active: number;
}

interface AmmResult {
  grn: number;
  rate_per_kg: number;
  weight_kg: number;
}

const MATERIALS = ['plastic', 'glass', 'paper', 'metal', 'ewaste'];

const MATERIAL_RATES: Record<string, number> = {
  plastic: 10,
  glass: 6,
  paper: 5,
  metal: 15,
  ewaste: 25,
};

export default function TestQr() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [selectedBin, setSelectedBin] = useState('');
  const [material, setMaterial] = useState('plastic');
  const [weightGrams, setWeightGrams] = useState(500);
  const [qrData, setQrData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [binsLoading, setBinsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [ammResult, setAmmResult] = useState<AmmResult | null>(null);
  const [ammLoading, setAmmLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiFetch('/api/bins').then((res) => {
      if (res.ok) {
        const b: Bin[] = (res.data as any)?.bins ?? [];
        setBins(b.filter((x) => x.is_active));
        if (b.length > 0) setSelectedBin(b[0].bin_id);
      }
    }).finally(() => setBinsLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAmmLoading(true);
      apiFetch(`/api/amm/simulate?material=${material}&weight_grams=${weightGrams}`)
        .then((res) => {
          if (res.ok) {
            const d = res.data as any;
            setAmmResult({ grn: d.grn, rate_per_kg: d.rate_per_kg, weight_kg: d.weight_kg });
          }
        })
        .finally(() => setAmmLoading(false));
    }, 300);
  }, [material, weightGrams]);

  const generateQr = async () => {
    if (!selectedBin) { setError('Select a bin first'); return; }
    setLoading(true);
    setError(null);
    setGenerated(false);

    const res = await apiFetch(`/api/bins/${selectedBin}/qr`);
    setLoading(false);

    if (!res.ok) { setError(res.error ?? 'Failed to generate QR'); return; }

    const payload = (res.data as any)?.payload;
    // Inject material + weight into payload so the app can display them on scan result
    const enriched = { ...payload, materialType: material, weightGrams };
    setQrData(JSON.stringify(enriched));
    setGenerated(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
            <FlaskConical className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">QR Test Generator</h1>
          <p className="text-slate-400">Generate signed bin QR codes to test the mobile app</p>
        </motion.div>

        <div className="bg-slate-900/80 border border-white/[0.06] rounded-2xl p-6 space-y-6">
          {/* Bin selector */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Select bin</label>
            {binsLoading ? (
              <div className="h-11 bg-slate-800 rounded-xl animate-pulse" />
            ) : bins.length === 0 ? (
              <p className="text-amber-400 text-sm">
                ⚠️ No active bins found. Create a bin via <code className="bg-slate-800 px-1 rounded">POST /api/bins</code> first.
              </p>
            ) : (
              <select
                value={selectedBin}
                onChange={(e) => setSelectedBin(e.target.value)}
                className="w-full bg-slate-800 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              >
                {bins.map((b) => (
                  <option key={b.bin_id} value={b.bin_id}>
                    {b.bin_id.slice(0, 8)}… — {b.location_name ?? 'No location'} {b.supported_materials ? `(${b.supported_materials})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Material */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Material type</label>
            <div className="flex flex-wrap gap-2">
              {MATERIALS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMaterial(m)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${
                    material === m
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Weight: <span className="text-white font-medium">{(weightGrams / 1000).toFixed(2)} kg ({weightGrams} g)</span>
            </label>
            <input
              type="range"
              min={50}
              max={5000}
              step={50}
              value={weightGrams}
              onChange={(e) => setWeightGrams(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>50 g</span><span>5 kg</span>
            </div>
          </div>

          {/* AMM Calculator */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
            <p className="text-slate-400 text-sm font-medium mb-3">💰 Estimated GRN Reward</p>
            {ammLoading || !ammResult ? (
              <div className="space-y-2">
                <div className="h-10 bg-emerald-500/10 rounded-lg animate-pulse w-32" />
                <div className="h-4 bg-slate-700/50 rounded animate-pulse w-48" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-emerald-400">{ammResult.grn}</span>
                  <span className="text-emerald-600 text-xl">GRN</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Rate: {ammResult.rate_per_kg} GRN/kg · Weight: {ammResult.weight_kg.toFixed(3)} kg
                </p>
              </>
            )}

            {/* Rate comparison grid */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {MATERIALS.map((m) => (
                <div
                  key={m}
                  className={`rounded-xl p-2 text-center border transition-all ${
                    m === material
                      ? 'bg-emerald-500/20 border-emerald-500/40'
                      : 'bg-white/[0.03] border-white/[0.06]'
                  }`}
                >
                  <p className="text-xs text-slate-400 capitalize">{m}</p>
                  <p className={`text-sm font-semibold ${m === material ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {MATERIAL_RATES[m]}
                  </p>
                  <p className="text-xs text-slate-500">GRN/kg</p>
                </div>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generateQr}
            disabled={loading || bins.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl text-white font-semibold transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <QrCode className="w-4 h-4" />
            )}
            {loading ? 'Generating…' : 'Generate QR'}
          </button>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>

        {/* QR output */}
        {generated && qrData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 bg-white rounded-2xl p-6 flex flex-col items-center"
          >
            <QRCodeSVG value={qrData} size={240} level="M" />
            <p className="mt-4 text-slate-700 text-sm font-medium">
              {material} · {(weightGrams / 1000).toFixed(2)} kg · bin {selectedBin.slice(0, 8)}…
            </p>
            <p className="text-xs text-slate-400 mt-1">Scan this with the EcoVault app</p>
            <button
              onClick={generateQr}
              className="mt-4 flex items-center gap-2 text-sm text-violet-600 hover:text-violet-500 font-medium"
            >
              <RefreshCw className="w-3 h-3" /> Refresh (new nonce)
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
