import { useRef } from 'react';
import { MeshGradient, PulsingBorder } from '@paper-design/shaders-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start start', 'end start'],
  });

  // Pinned scroll-driven transforms
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, -120]);
  const titleScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const titleOpacity = useTransform(scrollYProgress, [0.3, 0.6], [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const overlayOpacity = useTransform(scrollYProgress, [0.4, 0.8], [0, 0.7]);

  // Smart bin transforms
  const binRotateY = useTransform(scrollYProgress, [0, 0.4, 0.8], [0, 15, 35]);
  const binRotateX = useTransform(scrollYProgress, [0, 0.5], [0, -10]);
  const binY = useTransform(scrollYProgress, [0, 0.6], [0, -60]);
  const binScale = useTransform(scrollYProgress, [0, 0.3, 0.7], [0.9, 1.1, 0.7]);
  const binOpacity = useTransform(scrollYProgress, [0.5, 0.8], [1, 0]);

  return (
    <div ref={wrapperRef} className="hero-pin-wrapper">
      <div className="hero-sticky">
        {/* SVG Filters */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
              <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            </filter>
            <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="gooey" />
              <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
            </filter>
          </defs>
        </svg>

        {/* Shader Backgrounds — handled by global ScrollBackground */}
        <motion.div style={{ scale: bgScale }} className="hero-shader-bg">
          <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }} />
        </motion.div>

        {/* Smart Bin - scroll animated */}
        <motion.div
          style={{
            position: 'absolute', right: '8%', top: '50%', zIndex: 18,
            rotateY: binRotateY, rotateX: binRotateX, y: binY, scale: binScale, opacity: binOpacity,
            translateY: '-50%',
          }}
        >
          <div style={{ position: 'absolute', inset: '-40%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.12), transparent 70%)', animation: 'float 4s ease-in-out infinite' }} />
          <svg width="180" height="260" viewBox="0 0 200 280" fill="none">
            <rect x="30" y="80" width="140" height="180" rx="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            <motion.rect x="20" y="60" width="160" height="28" rx="8" fill="rgba(34,197,94,0.12)" stroke="rgba(34,197,94,0.35)" strokeWidth="1.5" animate={{ y: [60, 55, 60] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
            <rect x="75" y="50" width="50" height="8" rx="4" fill="rgba(34,197,94,0.25)" />
            <motion.circle cx="100" cy="130" r="18" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="2" animate={{ r: [18, 22, 18], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
            <motion.circle cx="100" cy="130" r="5" fill="rgba(34,197,94,0.7)" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            <rect x="72" y="168" width="56" height="56" rx="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            {[0,1,2,3,4].map(r => [0,1,2,3,4].map(c => (r+c)%2===0 ? <rect key={`${r}${c}`} x={78+c*9} y={174+r*9} width="6" height="6" rx="1" fill="rgba(255,255,255,0.15)" /> : null))}
            <text x="50" y="250" fontSize="13" fill="rgba(34,197,94,0.4)">♻</text>
            <text x="85" y="250" fontSize="13" fill="rgba(6,182,212,0.4)">🧴</text>
            <text x="120" y="250" fontSize="13" fill="rgba(249,115,22,0.4)">📱</text>
          </svg>
        </motion.div>

        {/* Hero Content */}
        <div className="hero-content-wrap">
          <motion.div className="hero-center" style={{ y: titleY, scale: titleScale, opacity: titleOpacity }}>
            <motion.div className="hero-badge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              🌱 Blockchain-Powered Recycling Rewards
            </motion.div>

            <motion.h1 className="hero-title" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
              <span className="gradient-text">Turn Your Waste</span>
              <br />
              <span style={{ color: 'white' }}>Into Wealth</span>
            </motion.h1>

            <motion.p className="hero-desc" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}>
              Smart bins weigh your recyclables and instantly reward you with blockchain-verified tokens. Real materials, real value, real impact.
            </motion.p>

            <motion.div className="hero-btns" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1 }}>
              <motion.button className="btn-primary btn-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/connect-wallet')}>
                Start Recycling
              </motion.button>
              <motion.button className="btn-outline" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Watch Demo
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Pulsing Border Element */}
        <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', zIndex: 30 }}>
          <div style={{ position: 'relative', width: '5rem', height: '5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PulsingBorder
              colors={['#22c55e', '#06b6d4', '#f97316', '#4ade80', '#FFD700', '#ffffff']}
              colorBack="#00000000"
              speed={1.5} roundness={1} thickness={0.1} softness={0.2}
              intensity={5} spotsPerColor={5} spotSize={0.1} pulse={0.1}
              smoke={0.5} smokeSize={4} scale={0.65} rotation={0}
              style={{ width: '60px', height: '60px', borderRadius: '50%' }}
            />
            <motion.svg
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scale(1.6)' }}
              viewBox="0 0 100 100"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <defs><path id="circle" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" /></defs>
              <text style={{ fontSize: '7px', fill: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                <textPath href="#circle" startOffset="0%">EcoVault • Recycle & Earn • Smart Bins • Blockchain •</textPath>
              </text>
            </motion.svg>
          </div>
        </div>
      </div>
    </div>
  );
}
