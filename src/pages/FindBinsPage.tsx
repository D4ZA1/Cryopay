import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/landing.css';

const navItems = [
  { icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { icon: '💰', label: 'Wallet', path: '/wallet' },
  { icon: '📋', label: 'Transactions', path: '/transactions' },
  { icon: '🗺️', label: 'Find Bins', path: '/find-bins' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-logo">
        <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, var(--eco-green), var(--tech-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M8 12l3 3 5-6" /></svg>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white' }}>EcoVault</span>
      </div>
      <nav className="dash-sidebar-nav">
        {navItems.map(item => (
          <button key={item.path} className={`dash-sidebar-link ${location.pathname === item.path ? 'active' : ''}`} onClick={() => navigate(item.path)}>
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>
      <button className="dash-sidebar-link" onClick={() => navigate('/')} style={{ marginTop: 'auto' }}><span>🚪</span> Log Out</button>
    </aside>
  );
}

const bins = [
  { id: 'BIN-247', name: 'Central Park Station', address: '123 Central Park West', distance: '0.3 km', materials: ['Plastic', 'Glass', 'Paper'], status: 'Online', fill: 42 },
  { id: 'BIN-103', name: 'Main Street Hub', address: '456 Main St', distance: '0.8 km', materials: ['Plastic', 'Metal', 'E-Waste'], status: 'Online', fill: 67 },
  { id: 'BIN-089', name: 'Tech Hub Station', address: '789 Innovation Dr', distance: '1.2 km', materials: ['E-Waste', 'Metal'], status: 'Online', fill: 23 },
  { id: 'BIN-312', name: 'City Library', address: '321 Library Ave', distance: '1.5 km', materials: ['Paper', 'Plastic'], status: 'Maintenance', fill: 91 },
  { id: 'BIN-156', name: 'Market Square', address: '654 Market Blvd', distance: '2.1 km', materials: ['Glass', 'Metal', 'Plastic'], status: 'Online', fill: 55 },
  { id: 'BIN-201', name: 'University Campus', address: '100 University Rd', distance: '2.8 km', materials: ['Plastic', 'Paper', 'E-Waste', 'Glass'], status: 'Online', fill: 38 },
];

const materialColors: Record<string, string> = {
  Plastic: '#22c55e', Glass: '#06b6d4', Paper: '#eab308', Metal: '#a855f7', 'E-Waste': '#f97316',
};

export default function FindBinsPage() {
  const [search, setSearch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('All');

  const filtered = bins.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.address.toLowerCase().includes(search.toLowerCase());
    const matchesMaterial = selectedMaterial === 'All' || b.materials.includes(selectedMaterial);
    return matchesSearch && matchesMaterial;
  });

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="dash-greeting">Find Smart Bins 🗺️</h1>
          <p className="dash-greeting-sub">Locate the nearest recycling stations around you.</p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="auth-input"
              placeholder="Search by name or address..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['All', 'Plastic', 'Glass', 'Paper', 'Metal', 'E-Waste'].map(m => (
              <motion.button
                key={m}
                onClick={() => setSelectedMaterial(m)}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '0.375rem 0.875rem', borderRadius: 9999, fontSize: '0.8125rem',
                  background: selectedMaterial === m ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedMaterial === m ? 'rgba(34,197,94,0.3)' : 'var(--border-subtle)'}`,
                  color: selectedMaterial === m ? 'var(--eco-green-light)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: selectedMaterial === m ? 600 : 400,
                }}
              >
                {m !== 'All' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: materialColors[m], marginRight: 6, verticalAlign: 'middle' }} />}
                {m}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Map placeholder + Bin list */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }}>
          {/* Map area */}
          <motion.div className="dash-card" style={{ minHeight: '28rem', display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <div className="dash-card-title">Map View</div>
            <div style={{
              flex: 1, borderRadius: '0.75rem', position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(34,197,94,0.05), rgba(6,182,212,0.05))',
              border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Grid lines to simulate a map */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <g key={i}>
                    <line x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="var(--text-muted)" strokeWidth="0.5" />
                    <line x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="var(--text-muted)" strokeWidth="0.5" />
                  </g>
                ))}
              </svg>

              {/* Bin markers */}
              {filtered.map((bin, i) => {
                const positions = [
                  { left: '30%', top: '25%' }, { left: '65%', top: '35%' }, { left: '45%', top: '60%' },
                  { left: '20%', top: '70%' }, { left: '75%', top: '65%' }, { left: '55%', top: '20%' },
                ];
                const pos = positions[i % positions.length];
                return (
                  <motion.div
                    key={bin.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 300 }}
                    style={{
                      position: 'absolute', ...pos,
                      transform: 'translate(-50%, -50%)',
                      cursor: 'pointer', zIndex: 10,
                    }}
                    whileHover={{ scale: 1.3 }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: bin.status === 'Online' ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.2)',
                      border: `2px solid ${bin.status === 'Online' ? 'var(--eco-green)' : 'var(--energy-orange)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.875rem',
                    }}>
                      🗑️
                    </div>
                    <div style={{
                      position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap', fontSize: '0.5625rem', fontWeight: 600,
                      color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-display)',
                    }}>
                      {bin.id}
                    </div>
                  </motion.div>
                );
              })}

              {/* "You are here" marker */}
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#3b82f6', border: '3px solid rgba(59,130,246,0.3)',
                  boxShadow: '0 0 12px rgba(59,130,246,0.4)',
                  zIndex: 20,
                }}
              />
            </div>
          </motion.div>

          {/* Bin list */}
          <motion.div className="dash-card" style={{ maxHeight: '32rem', overflowY: 'auto' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="dash-card-title">Nearby Bins ({filtered.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.map((bin, i) => (
                <motion.div
                  key={bin.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                  style={{
                    padding: '1rem', borderRadius: '0.75rem',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  whileHover={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(255,255,255,0.04)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{bin.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{bin.address}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`dash-badge ${bin.status === 'Online' ? 'green' : 'orange'}`}>{bin.status}</span>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{bin.distance}</div>
                    </div>
                  </div>
                  {/* Fill level bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{
                        width: `${bin.fill}%`, height: '100%', borderRadius: 2,
                        background: bin.fill > 80 ? 'var(--energy-orange)' : bin.fill > 50 ? '#eab308' : 'var(--eco-green)',
                        transition: 'width 0.5s',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', minWidth: 28 }}>{bin.fill}%</span>
                  </div>
                  {/* Material tags */}
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {bin.materials.map(m => (
                      <span key={m} style={{
                        padding: '0.125rem 0.5rem', borderRadius: 9999, fontSize: '0.625rem', fontWeight: 500,
                        background: `${materialColors[m]}15`, color: materialColors[m],
                        border: `1px solid ${materialColors[m]}30`,
                      }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
                  No bins match your search.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
