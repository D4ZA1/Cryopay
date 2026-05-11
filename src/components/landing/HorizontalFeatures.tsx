import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'motion/react';

const features = [
  { icon: '⛓️', title: 'On-Chain Verification', desc: 'Every recycling deposit recorded on our custom L2 blockchain. Immutable and tamper-proof.', color: 'rgba(6,182,212,0.15)' },
  { icon: '📊', title: 'Live Market Pricing', desc: 'Material values update in real-time. Plastic, glass, paper, metal, e-waste — all at current market rates.', color: 'rgba(34,197,94,0.15)' },
  { icon: '🛡️', title: 'Anti-Fraud Protection', desc: "Time-limited QR codes signed by the bin's wallet with nonces prevent replay attacks.", color: 'rgba(249,115,22,0.15)' },
  { icon: '🏛️', title: 'Government Auditability', desc: 'Municipalities verify all deposits on-chain. Full transparency for public recycling programs.', color: 'rgba(168,85,247,0.15)' },
  { icon: '⚡', title: 'Instant Rewards', desc: 'Smart contracts calculate and distribute tokens the moment your deposit is verified.', color: 'rgba(234,179,8,0.15)' },
  { icon: '🌍', title: 'Multi-Material Support', desc: 'Plastic, glass, paper, metal, and electronic waste — each identified and valued independently.', color: 'rgba(56,189,248,0.15)' },
];

export default function HorizontalFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-100px' });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['5%', '-60%']);

  return (
    <section id="features" ref={containerRef} className="hscroll-wrapper" style={{ height: '300vh' }}>
      <div className="hscroll-sticky">
        <div style={{ padding: '0 4rem', width: '100%' }}>
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: '3rem' }}
          >
            <span className="section-label">
              <span className="section-label-bar" style={{ background: 'var(--tech-cyan)' }} />
              Features
            </span>
            <h2 className="section-title">Built for trust, designed for impact</h2>
          </motion.div>

          <motion.div className="hscroll-track" style={{ x }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="hscroll-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              >
                <div className="hscroll-card-icon" style={{ background: f.color }}>{f.icon}</div>
                <h3 className="hscroll-card-title">{f.title}</h3>
                <p className="hscroll-card-desc">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
