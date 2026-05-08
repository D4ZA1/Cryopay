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

const tokenHistory = [
  { date: '2026-05-08', type: 'Earned', amount: '+48', desc: 'Plastic recycling deposit', txHash: '0x3f4a...82b1' },
  { date: '2026-05-07', type: 'Earned', amount: '+32', desc: 'Glass recycling deposit', txHash: '0x7bc9...1a2f' },
  { date: '2026-05-06', type: 'Redeemed', amount: '-100', desc: 'Amazon gift card', txHash: '0x9ed1...5cb8' },
  { date: '2026-05-05', type: 'Earned', amount: '+67', desc: 'Metal recycling deposit', txHash: '0x1af4...3e7d' },
  { date: '2026-05-04', type: 'Earned', amount: '+19', desc: 'Paper recycling deposit', txHash: '0x5cb8...9a1e' },
];

const redeemOptions = [
  { name: 'Amazon Gift Card', tokens: 100, icon: '🛒' },
  { name: 'Coffee Voucher', tokens: 25, icon: '☕' },
  { name: 'Transit Pass', tokens: 50, icon: '🚌' },
  { name: 'Plant a Tree', tokens: 10, icon: '🌳' },
];

export default function WalletPage() {
  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="dash-greeting">Wallet 💰</h1>
          <p className="dash-greeting-sub">Manage your tokens and redeem rewards.</p>
        </motion.div>

        {/* Balance Card */}
        <motion.div className="dash-card" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(6,182,212,0.08))', border: '1px solid rgba(34,197,94,0.15)', marginTop: '1.5rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Balance</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 700 }}>1,284 <span style={{ fontSize: '1.25rem', color: 'var(--eco-green-light)' }}>ECO</span></div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>≈ $128.40 USD</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <motion.button className="btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Send</motion.button>
              <motion.button className="btn-outline" style={{ padding: '0.5rem 1.5rem' }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Receive</motion.button>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', fontFamily: 'monospace' }}>Wallet: 0x3f4a...82b1</div>
        </motion.div>

        <motion.div className="dash-grid-2" style={{ marginTop: '1.25rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          {/* Token History */}
          <div className="dash-card">
            <div className="dash-card-title">Token History</div>
            <table className="dash-table">
              <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th></tr></thead>
              <tbody>
                {tokenHistory.map((t, i) => (
                  <tr key={i}>
                    <td>{t.date}</td>
                    <td><span className={`dash-badge ${t.type === 'Earned' ? 'green' : 'orange'}`}>{t.type}</span></td>
                    <td style={{ color: t.amount.startsWith('+') ? 'var(--eco-green-light)' : 'var(--energy-orange)', fontWeight: 600 }}>{t.amount}</td>
                    <td>{t.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Redeem */}
          <div className="dash-card">
            <div className="dash-card-title">Redeem Tokens</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {redeemOptions.map(r => (
                <motion.div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', borderRadius: '0.625rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }} whileHover={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{r.icon}</span>
                    <span style={{ fontWeight: 500 }}>{r.name}</span>
                  </div>
                  <span className="dash-badge cyan">{r.tokens} ECO</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
