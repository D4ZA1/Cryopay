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

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--eco-green)' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.3s',
      }}
    >
      <motion.div
        style={{
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 3,
        }}
        animate={{ left: checked ? 23 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [autoRedeem, setAutoRedeem] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="dash-greeting">Settings ⚙️</h1>
          <p className="dash-greeting-sub">Manage your account and preferences.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.5rem' }}>
          {/* Profile */}
          <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="dash-card-title">Profile</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--eco-green), var(--tech-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🌱</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.0625rem' }}>Eco User</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>0x3f4a...82b1</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="auth-label">Display Name</label>
                <input className="auth-input" defaultValue="Eco User" />
              </div>
              <div>
                <label className="auth-label">Email (optional)</label>
                <input className="auth-input" placeholder="you@example.com" />
              </div>
              <motion.button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                Save Changes
              </motion.button>
            </div>
          </motion.div>

          {/* Wallet */}
          <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <div className="dash-card-title">Connected Wallet</div>
            <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🦊</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>MetaMask</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>0x3f4a8b...2b1e82b1</div>
                  </div>
                </div>
                <span className="dash-badge green">Connected</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <motion.button className="btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }} whileHover={{ scale: 1.03 }}>
                Switch Wallet
              </motion.button>
              <button style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem', borderRadius: 9999, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Disconnect
              </button>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="dash-card-title">Notifications</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { label: 'Push Notifications', desc: 'Get notified when deposits are confirmed', state: notifications, set: () => setNotifications(!notifications) },
                { label: 'Email Alerts', desc: 'Receive weekly recycling summary', state: emailAlerts, set: () => setEmailAlerts(!emailAlerts) },
                { label: 'Auto-Redeem', desc: 'Automatically redeem tokens above threshold', state: autoRedeem, set: () => setAutoRedeem(!autoRedeem) },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{item.desc}</div>
                  </div>
                  <Toggle checked={item.state} onChange={item.set} />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Appearance */}
          <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
            <div className="dash-card-title">Appearance & Security</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>Dark Mode</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>Interface theme</div>
                </div>
                <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              </div>
              <div>
                <label className="auth-label">Auto-Redeem Threshold</label>
                <input className="auth-input" type="number" defaultValue="500" placeholder="Token amount" />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>Tokens will auto-redeem when balance exceeds this amount</div>
              </div>
              <div>
                <label className="auth-label">Preferred Reward</label>
                <select className="auth-input" defaultValue="gift-card" style={{ cursor: 'pointer' }}>
                  <option value="gift-card">Amazon Gift Card</option>
                  <option value="coffee">Coffee Voucher</option>
                  <option value="transit">Transit Pass</option>
                  <option value="tree">Plant a Tree</option>
                  <option value="fiat">Convert to Fiat</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Danger Zone */}
        <motion.div className="dash-card" style={{ marginTop: '1.25rem', borderColor: 'rgba(239,68,68,0.15)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <div className="dash-card-title" style={{ color: '#f87171' }}>Danger Zone</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>Delete Account</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Permanently remove your account and all data. This cannot be undone.</div>
            </div>
            <button style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem', borderRadius: 9999, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
              Delete Account
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
