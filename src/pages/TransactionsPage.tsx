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

const transactions = [
  { id: '0x3f4a82b1', date: '2026-05-08 14:32', material: 'Plastic', weight: '2.4 kg', price: '$0.42/kg', tokens: '+48', bin: 'Bin #247 (Central Park)', status: 'Confirmed', block: '#1,284,391' },
  { id: '0x7bc91a2f', date: '2026-05-07 11:15', material: 'Glass', weight: '1.8 kg', price: '$0.18/kg', tokens: '+32', bin: 'Bin #103 (Main St)', status: 'Confirmed', block: '#1,284,287' },
  { id: '0x1af43e7d', date: '2026-05-07 09:45', material: 'E-Waste', weight: '0.5 kg', price: '$3.20/kg', tokens: '+85', bin: 'Bin #89 (Tech Hub)', status: 'Pending', block: 'Pending' },
  { id: '0x9ed15cb8', date: '2026-05-06 16:20', material: 'Paper', weight: '3.2 kg', price: '$0.11/kg', tokens: '+19', bin: 'Bin #312 (Library)', status: 'Confirmed', block: '#1,283,991' },
  { id: '0x5cb89a1e', date: '2026-05-05 13:08', material: 'Metal', weight: '1.1 kg', price: '$1.85/kg', tokens: '+67', bin: 'Bin #156 (Market)', status: 'Confirmed', block: '#1,283,756' },
  { id: '0x2d6f4e8a', date: '2026-05-04 10:55', material: 'Plastic', weight: '1.9 kg', price: '$0.42/kg', tokens: '+38', bin: 'Bin #247 (Central Park)', status: 'Confirmed', block: '#1,283,504' },
];

export default function TransactionsPage() {
  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="dash-greeting">Transactions 📋</h1>
          <p className="dash-greeting-sub">All your on-chain recycling deposit records.</p>
        </motion.div>

        <motion.div className="dash-card" style={{ marginTop: '1.5rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {['All', 'Plastic', 'Glass', 'Paper', 'Metal', 'E-Waste'].map((f, i) => (
              <button key={f} style={{ padding: '0.375rem 1rem', borderRadius: 9999, background: i === 0 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`, color: i === 0 ? 'var(--eco-green-light)' : 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                {f}
              </button>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>TX Hash</th>
                  <th>Date</th>
                  <th>Material</th>
                  <th>Weight</th>
                  <th>Price</th>
                  <th>Tokens</th>
                  <th>Bin</th>
                  <th>Block</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <motion.tr key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.05 * i }}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{tx.id}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{tx.date}</td>
                    <td>{tx.material}</td>
                    <td>{tx.weight}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{tx.price}</td>
                    <td style={{ color: 'var(--eco-green-light)', fontWeight: 600 }}>{tx.tokens}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{tx.bin}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{tx.block}</td>
                    <td><span className={`dash-badge ${tx.status === 'Confirmed' ? 'green' : 'orange'}`}>{tx.status}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
