export default function FooterSection() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: '0.5rem',
              background: 'linear-gradient(135deg, var(--eco-green), var(--tech-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M8 12l3 3 5-6" />
            </svg>
          </div>
          <span className="footer-copy" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>EcoVault</span>
        </div>

        <div className="footer-links">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Docs</a>
          <a href="#">GitHub</a>
          <a href="#">Contact</a>
        </div>

        <p className="footer-copy">
          © {new Date().getFullYear()} EcoVault. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
