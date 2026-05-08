import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    icon: '⛓️',
    title: 'On-Chain Verification',
    description: 'Every recycling deposit is recorded on our custom L2 blockchain. Immutable, transparent, and tamper-proof.',
    color: 'rgba(6,182,212,0.15)',
    glowColor: 'rgba(6,182,212,0.08)',
  },
  {
    icon: '📊',
    title: 'Live Market Pricing',
    description: 'Material values update in real-time. Plastic, glass, paper, metal, and e-waste — all priced at current market rates.',
    color: 'rgba(34,197,94,0.15)',
    glowColor: 'rgba(34,197,94,0.08)',
  },
  {
    icon: '🛡️',
    title: 'Anti-Fraud Protection',
    description: "Time-limited QR codes signed by the bin's wallet with nonces prevent replay attacks and fraudulent deposits.",
    color: 'rgba(249,115,22,0.15)',
    glowColor: 'rgba(249,115,22,0.08)',
  },
  {
    icon: '🏛️',
    title: 'Government Auditability',
    description: 'Municipalities can verify all deposits on-chain. Full transparency for public recycling programs.',
    color: 'rgba(168,85,247,0.15)',
    glowColor: 'rgba(168,85,247,0.08)',
  },
  {
    icon: '⚡',
    title: 'Instant Rewards',
    description: 'Smart contracts automatically calculate and distribute tokens the moment your deposit is verified. No waiting.',
    color: 'rgba(234,179,8,0.15)',
    glowColor: 'rgba(234,179,8,0.08)',
  },
  {
    icon: '🌍',
    title: 'Multi-Material Support',
    description: 'Plastic, glass, paper, metal, and electronic waste. Each material type is identified and valued independently.',
    color: 'rgba(56,189,248,0.15)',
    glowColor: 'rgba(56,189,248,0.08)',
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="features" className="section" ref={sectionRef}>
      <div className="section-inner">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">
            <span style={{ display: 'inline-block', width: '1.5rem', height: '2px', background: 'var(--tech-cyan)', borderRadius: '1px' }} />
            Features
          </span>
          <h2 className="section-title">Built for trust,<br />designed for impact</h2>
          <p className="section-subtitle">
            Every feature is engineered to make recycling transparent, rewarding, and fraud-proof.
          </p>
        </motion.div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div
                className="feature-card-glow"
                style={{ background: `radial-gradient(circle at 30% 30%, ${feature.glowColor}, transparent 60%)` }}
              />
              <div className="feature-icon" style={{ background: feature.color }}>
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
