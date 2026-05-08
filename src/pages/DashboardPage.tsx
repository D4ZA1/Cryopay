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

const recentDeposits = [
  { date: '2026-05-08', material: 'Plastic', weight: '2.4 kg', tokens: '+48', status: 'Confirmed', bin: 'Bin #0x3f..a2' },
  { date: '2026-05-07', material: 'Glass', weight: '1.8 kg', tokens: '+32', status: 'Confirmed', bin: 'Bin #0x7b..c9' },
  { date: '2026-05-07', material: 'E-Waste', weight: '0.5 kg', tokens: '+85', status: 'Pending', bin: 'Bin #0x1a..f4' },
  { date: '2026-05-06', material: 'Paper', weight: '3.2 kg', tokens: '+19', status: 'Confirmed', bin: 'Bin #0x9e..d1' },
  { date: '2026-05-05', material: 'Metal', weight: '1.1 kg', tokens: '+67', status: 'Confirmed', bin: 'Bin #0x5c..b8' },
];

const materialPrices = [
  { name: 'Plastic', price: '$0.42/kg', change: '+2.1%' },
  { name: 'Glass', price: '$0.18/kg', change: '-0.5%' },
  { name: 'Paper', price: '$0.11/kg', change: '+1.3%' },
  { name: 'Metal', price: '$1.85/kg', change: '+4.2%' },
  { name: 'E-Waste', price: '$3.20/kg', change: '+8.7%' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="dash-sidebar">
      <div className="dash-sidebar-logo">
        <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'linear-gradient(135deg, var(--eco-green), var(--tech-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M8 12l3 3 5-6" />
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white' }}>EcoVault</span>
      </div>
      <nav className="dash-sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.path}
            className={`dash-sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </nav>
      <button className="dash-sidebar-link" onClick={() => navigate('/')} style={{ marginTop: 'auto' }}>
        <span>🚪</span> Log Out
      </button>
    </aside>
  );
}

export default function DashboardPage() {
  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="dash-header">
            <div>
              <h1 className="dash-greeting">Good morning! 🌿</h1>
              <p className="dash-greeting-sub">Here is your recycling activity overview.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>0x3f4a...82b1</span>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: 'linear-gradient(135deg, var(--eco-green), var(--tech-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>🌱</div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div className="dash-stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          {[
            { label: 'Token Balance', value: '1,284', change: '+12.5% this week', positive: true },
            { label: 'Total Recycled', value: '47.3 kg', change: '+3.2 kg this week', positive: true },
            { label: 'Deposits Made', value: '23', change: '+4 this week', positive: true },
            { label: 'Carbon Offset', value: '18.6 kg', change: 'CO₂ saved', positive: true },
          ].map((s, i) => (
            <motion.div key={s.label} className="dash-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}>
              <div className="dash-stat-label">{s.label}</div>
              <div className="dash-stat-value">{s.value}</div>
              <div className={`dash-stat-change ${s.positive ? 'positive' : ''}`}>{s.change}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Content Grid */}
        <motion.div className="dash-grid-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          {/* Recent Deposits */}
          <div className="dash-card">
            <div className="dash-card-title">Recent Deposits</div>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Material</th>
                  <th>Weight</th>
                  <th>Tokens</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDeposits.map((d, i) => (
                  <tr key={i}>
                    <td>{d.date}</td>
                    <td>{d.material}</td>
                    <td>{d.weight}</td>
                    <td style={{ color: 'var(--eco-green-light)', fontWeight: 600 }}>{d.tokens}</td>
                    <td>
                      <span className={`dash-badge ${d.status === 'Confirmed' ? 'green' : 'orange'}`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Live Material Prices */}
          <div className="dash-card">
            <div className="dash-card-title">Live Material Prices</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {materialPrices.map(m => (
                <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontWeight: 500 }}>{m.name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{m.price}</div>
                    <div style={{ fontSize: '0.75rem', color: m.change.startsWith('+') ? 'var(--eco-green)' : 'var(--energy-orange)' }}>{m.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
