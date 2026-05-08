import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { MeshGradient } from '@paper-design/shaders-react';
import '../styles/landing.css';

const wallets = [
  { name: 'MetaMask', icon: '🦊', desc: 'Connect with MetaMask browser extension' },
  { name: 'WalletConnect', icon: '🔗', desc: 'Scan QR code with any compatible wallet' },
  { name: 'Coinbase Wallet', icon: '🔵', desc: 'Connect with Coinbase Wallet' },
  { name: 'Phantom', icon: '👻', desc: 'Connect with Phantom wallet' },
];

export default function ConnectWalletPage() {
  const navigate = useNavigate();

  const handleConnect = (walletName: string) => {
    console.log('Connecting with:', walletName);
    // TODO: integrate actual wallet connection
    navigate('/dashboard');
  };

  return (
    <div className="auth-page">
      {/* Shader BG */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
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
        {/* Logo */}
        <div className="auth-logo">
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, var(--eco-green), var(--tech-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M8 12l3 3 5-6" />
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'white' }}>EcoVault</span>
        </div>

        <h1 className="auth-title">Connect Your Wallet</h1>
        <p className="auth-subtitle">Link your wallet to start earning recycling rewards on the blockchain.</p>

        {/* Wallet Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {wallets.map((w, i) => (
            <motion.button
              key={w.name}
              className="wallet-btn"
              onClick={() => handleConnect(w.name)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              whileHover={{ scale: 1.02, borderColor: 'rgba(34,197,94,0.3)' }}
              whileTap={{ scale: 0.98 }}
            >
              <span style={{ fontSize: '1.5rem' }}>{w.icon}</span>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{w.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{w.desc}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </motion.button>
          ))}
        </div>

        <div className="auth-divider">or</div>

        {/* Manual Address */}
        <div className="auth-field">
          <label className="auth-label">Wallet Address</label>
          <input className="auth-input" placeholder="0x..." />
        </div>
        <motion.button className="auth-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          Connect Manually
        </motion.button>

        <p className="auth-footer-text">
          Already connected? <a className="auth-link" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Log in instead</a>
        </p>
      </motion.div>
    </div>
  );
}
