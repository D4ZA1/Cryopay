import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

const steps = [
  { number: '01', icon: '📱', title: 'Scan QR Code', desc: 'Open your EcoVault wallet and scan the QR code on any registered Smart Bin near you.', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))' },
  { number: '02', icon: '♻️', title: 'Deposit Materials', desc: 'Drop in your recyclables — plastic, glass, paper, metal, or e-waste. The bin weighs and identifies the material automatically.', gradient: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))' },
  { number: '03', icon: '💰', title: 'Earn Tokens', desc: 'Based on weight × live material market price, tokens are minted to your wallet via smart contract. Instantly.', gradient: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))' },
  { number: '04', icon: '🎁', title: 'Redeem Rewards', desc: 'Use your tokens for vouchers, discounts, gift cards, or convert to fiat. Your recycling has real monetary value.', gradient: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))' },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" className="section bg-green-glow" ref={ref}>
      <div className="section-inner">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <span className="section-label"><span className="section-label-bar" /> How It Works</span>
          <h2 className="section-title">Four simple steps to<br />start earning</h2>
          <p className="section-subtitle">Our smart bins make recycling rewarding. Every deposit is weighed, valued, and recorded on-chain.</p>
        </motion.div>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <motion.div key={s.number} className="step-card" initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}>
              <div className="step-number">{s.number}</div>
              <div className="step-icon" style={{ background: s.gradient }}>{s.icon}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
