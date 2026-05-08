import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

const items = [
  { icon: '🔍', title: 'Full Auditability', desc: 'Every deposit, every gram, every token — verifiable on-chain. Real-time dashboard for municipalities.', color: 'rgba(6,182,212,0.15)' },
  { icon: '🏢', title: 'Bin Registration', desc: 'Station operators register bins with unique wallet addresses. Each bin is a verified network node.', color: 'rgba(34,197,94,0.15)' },
  { icon: '📜', title: 'Smart Contracts', desc: 'Automated reward calculation. No middlemen, no delays. Weight × price = instant tokens.', color: 'rgba(249,115,22,0.15)' },
  { icon: '🔐', title: 'Tamper-Proof Records', desc: 'Nonce-based replay protection and time-limited signed QR codes ensure every transaction is genuine.', color: 'rgba(168,85,247,0.15)' },
];

const nodes = [
  { x: '15%', y: '20%', emoji: '🗑️', delay: 0 },
  { x: '75%', y: '15%', emoji: '🏛️', delay: 0.3 },
  { x: '50%', y: '50%', emoji: '📊', delay: 0.6 },
  { x: '20%', y: '75%', emoji: '🔗', delay: 0.9 },
  { x: '80%', y: '70%', emoji: '✅', delay: 1.2 },
];

export default function BlockchainSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="blockchain" className="section" ref={ref}>
      <div className="section-inner">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <span className="section-label"><span className="section-label-bar" style={{ background: 'var(--tech-cyan)' }} /> For Municipalities</span>
          <h2 className="section-title">Complete transparency<br />for public programs</h2>
          <p className="section-subtitle">Governments get full on-chain auditability of every recycling deposit.</p>
        </motion.div>

        <div className="bc-grid">
          <motion.div className="bc-visual" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 0.3 }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              {nodes.map((n, i) => nodes.slice(i + 1).map((t, j) => (
                <motion.line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={t.x} y2={t.y} stroke="rgba(34,197,94,0.12)" strokeWidth="1" initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ duration: 1.5, delay: 0.5 + i * 0.15 }} />
              )))}
            </svg>
            {nodes.map((n, i) => (
              <motion.div key={i} className="bc-node" style={{ left: n.x, top: n.y, transform: 'translate(-50%,-50%)' }} initial={{ opacity: 0, scale: 0 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay: 0.4 + n.delay, type: 'spring', stiffness: 200 }}>
                {n.emoji}
              </motion.div>
            ))}
          </motion.div>

          <div className="bc-features">
            {items.map((f, i) => (
              <motion.div key={f.title} className="bc-feature" initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}>
                <div className="bc-feature-icon" style={{ background: f.color }}>{f.icon}</div>
                <div>
                  <div className="bc-feature-title">{f.title}</div>
                  <div className="bc-feature-desc">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
