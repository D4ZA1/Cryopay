import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();
  const navigate = useNavigate();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 200) setIsHidden(true);
    else setIsHidden(false);
    setIsScrolled(latest > 50);
  });

  return (
    <motion.header
      className={`nav-bar ${isScrolled ? 'scrolled' : ''}`}
      animate={{ y: isHidden ? -100 : 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <nav className="nav-inner">
        <motion.div className="nav-logo" whileHover={{ scale: 1.05 }} onClick={() => navigate('/')}>
          <div className="nav-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M8 12l3 3 5-6" />
            </svg>
          </div>
          <span className="nav-logo-text">EcoVault</span>
        </motion.div>

        <div className="nav-links">
          <a href="/leaderboard">Leaderboard</a>
          <a href="/coupons">Coupons</a>
          <a href="/test-qr">QR Test</a>
          <a href="/bins">Bins</a>
        </div>

        <div className="nav-actions">
          <motion.button className="btn-primary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/bins')}>
            Bin Registry
          </motion.button>
        </div>
      </nav>
    </motion.header>
  );
}
