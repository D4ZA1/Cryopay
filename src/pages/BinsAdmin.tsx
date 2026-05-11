import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, Plus, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Bin {
  bin_id: string;
  location_name: string;
  location_lat: number | null;
  location_lng: number | null;
  supported_materials: string[];
  is_active: boolean;
  current_nonce: number;
  created_at: string;
}

interface CreatedBin {
  bin_id: string;
  bin_public_key: string;
  bin_private_key: string;
  nonce: number;
}

export default function BinsAdmin() {
  const [token, setToken] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [materials, setMaterials] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedBin | null>(null);

  const fetchBins = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    const res = await apiFetch('/api/bins');
    if (res.ok) {
      const raw: any[] = (res.data as any)?.bins ?? [];
      // D1 returns supported_materials as a JSON string — parse to array
      const parsed: Bin[] = raw.map((b) => ({
        ...b,
        supported_materials: (() => {
          if (Array.isArray(b.supported_materials)) return b.supported_materials;
          if (typeof b.supported_materials === 'string' && b.supported_materials) {
            try { return JSON.parse(b.supported_materials); } catch { return []; }
          }
          return [];
        })(),
      }));
      setBins(parsed);
    } else {
      setError(res.error ?? 'Failed to load bins');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (token) fetchBins();
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword }),
    });
    setLoginLoading(false);
    if (res.ok && (res.data as any)?.token) {
      setToken((res.data as any).token);
    } else {
      setLoginError((res.data as any)?.error ?? res.error ?? 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreated(null);

    if (!locationName.trim()) {
      setFormError('Location name is required.');
      return;
    }

    setSubmitting(true);

    const body: Record<string, any> = { location_name: locationName.trim() };
    if (lat) body.location_lat = parseFloat(lat);
    if (lng) body.location_lng = parseFloat(lng);
    if (materials.trim()) {
      body.supported_materials = materials.split(',').map((m) => m.trim()).filter(Boolean);
    }

    const res = await apiFetch('/api/bins', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token.trim()}` },
    });

    setSubmitting(false);

    if (res.ok) {
      const d = res.data as any;
      setCreated({
        bin_id: d.bin_id,
        bin_public_key: d.bin_public_key,
        bin_private_key: d.bin_private_key,
        nonce: d.nonce,
      });
      setLocationName('');
      setLat('');
      setLng('');
      setMaterials('');
      fetchBins(true);
    } else {
      setFormError(res.error ?? 'Failed to register bin');
    }
  };

  const inputClass =
    'w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-white placeholder-white/40 focus:border-emerald-500 outline-none transition-colors';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Trash2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">🗑️ Bin Registry</h1>
          <p className="text-white/50">Manage EcoVault recycling bins</p>
        </motion.div>

        {!token ? (
          /* Login Card */
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="w-full max-w-md bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6"
            >
              <h2 className="text-white font-semibold text-xl mb-1">Admin Login</h2>
              <p className="text-white/50 text-sm mb-6">Sign in to register and manage bins</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="admin@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-1 block">Password</label>
                  <input
                    type="password"
                    className={inputClass}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  {loginLoading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Signed-in bar */}
            <div className="flex items-center justify-end gap-3 mb-6">
              <span className="inline-flex items-center gap-2 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full px-3 py-1">
                <CheckCircle className="w-3 h-3" />
                Signed in ✓
              </span>
              <button
                onClick={() => setToken('')}
                className="text-white/50 hover:text-white text-sm transition-colors"
              >
                Sign out
              </button>
            </div>

            {/* Register Bin Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-8"
            >
              <div className="flex items-center gap-2 mb-5">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h2 className="text-white font-semibold text-lg">Register New Bin</h2>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Location Name *</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Prague Main Station Entrance"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Latitude (optional)</label>
                    <input
                      type="number"
                      step="any"
                      className={inputClass}
                      placeholder="50.0755"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-white/50 text-xs mb-1 block">Longitude (optional)</label>
                    <input
                      type="number"
                      step="any"
                      className={inputClass}
                      placeholder="14.4378"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-1 block">Supported Materials (comma-separated, optional)</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="plastic, glass, paper"
                    value={materials}
                    onChange={(e) => setMaterials(e.target.value)}
                  />
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  {submitting ? 'Registering…' : 'Register Bin'}
                </button>
              </form>

              {/* Created Bin Result */}
              {created && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
                    <CheckCircle className="w-5 h-5" />
                    Bin registered successfully!
                  </div>
                  <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 mb-4">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-yellow-300 text-sm">
                      <strong>Save the private key — it won't be shown again.</strong>
                    </p>
                  </div>
                  <pre className="bg-black/40 rounded-xl p-4 text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all">
{JSON.stringify(created, null, 2)}
                  </pre>
                </motion.div>
              )}
            </motion.div>

            {/* Bins List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-lg">Registered Bins</h2>
                <button
                  onClick={() => fetchBins(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {error && <p className="text-red-400 text-center py-8">{error}</p>}

              {loading && (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && bins.length === 0 && !error && (
                <div className="text-center py-20">
                  <Trash2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No bins registered yet.</p>
                </div>
              )}

              {!loading && bins.length > 0 && (
                <div className="space-y-3">
                  {bins.map((bin, idx) => (
                    <motion.div
                      key={bin.bin_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-white font-semibold truncate">{bin.location_name}</p>
                            {bin.is_active ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-0.5 shrink-0">
                                <CheckCircle className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs bg-white/[0.04] text-white/40 border border-white/[0.06] rounded-full px-2.5 py-0.5 shrink-0">
                                <XCircle className="w-3 h-3" /> Inactive
                              </span>
                            )}
                          </div>

                          <p className="text-white/40 text-xs font-mono mb-3 truncate">{bin.bin_id}</p>

                          {bin.supported_materials?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {bin.supported_materials.map((m) => (
                                <span
                                  key={m}
                                  className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-2 py-0.5"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-4 text-xs text-white/40">
                            <span>Nonce: <span className="text-white/60">{bin.current_nonce}</span></span>
                            {bin.location_lat != null && bin.location_lng != null && (
                              <span>
                                {bin.location_lat.toFixed(4)}, {bin.location_lng.toFixed(4)}
                              </span>
                            )}
                            <span>{new Date(bin.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
