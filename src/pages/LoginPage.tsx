import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MeshGradient } from '@paper-design/shaders-react';
import '../styles/landing.css';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate wallet-based auth
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
        <MeshGradient
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          colors={['#000000', '#22c55e', '#06b6d4', '#164e63', '#050505']}
          speed={0.15}
          backgroundColor="#050505"
        />
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-logo">
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, var(--eco-green), var(--tech-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M8 12l3 3 5-6" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'white' }}>EcoVault</span>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Connect your wallet to access your recycling dashboard.</p>

        {/* Quick Wallet Connect */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { name: 'MetaMask', icon: '🦊' },
            { name: 'WalletConnect', icon: '🔗' },
          ].map((w, i) => (
            <motion.button
              key={w.name}
              className="wallet-btn"
              onClick={() => navigate('/dashboard')}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              whileHover={{ scale: 1.02, borderColor: 'rgba(34,197,94,0.3)' }}
              whileTap={{ scale: 0.98 }}
            >
              <span style={{ fontSize: '1.5rem' }}>{w.icon}</span>
              <span style={{ fontWeight: 600 }}>Connect with {w.name}</span>
            </motion.button>
          ))}
        </div>

        <div className="auth-divider">or sign in with email</div>

        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input className="auth-input" type="email" placeholder="you@example.com" />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input className="auth-input" type="password" placeholder="••••••••" />
          </div>
          <motion.button className="auth-btn" type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Sign In
          </motion.button>
        </form>

        <p className="auth-footer-text">
          New to EcoVault? <a className="auth-link" onClick={() => navigate('/connect-wallet')} style={{ cursor: 'pointer' }}>Connect your wallet</a>
        </p>
      </motion.div>
    </div>
  );
}
