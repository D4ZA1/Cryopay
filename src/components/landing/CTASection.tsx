import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const navigate = useNavigate();

  return (
    <section className="cta-section" ref={ref}>
      <div className="cta-glow" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.2), transparent)', top: '-20%', left: '10%' }} />
      <div className="cta-glow" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15), transparent)', bottom: '-20%', right: '10%' }} />

      <motion.div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 10 }} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }}>
        <motion.div style={{ display: 'inline-flex', padding: '0.375rem 1rem', borderRadius: 9999, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '2rem', fontSize: '0.8125rem', color: 'var(--eco-green-light)', fontWeight: 500 }} initial={{ opacity: 0, scale: 0.8 }} animate={inView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.5, delay: 0.2 }}>
          🌱 Join the Movement
        </motion.div>
        <h2 className="section-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1.5rem' }}>
          Ready to turn your<br />
          <span style={{ background: 'linear-gradient(135deg, var(--eco-green), var(--tech-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>waste into wealth?</span>
        </h2>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto' }}>
          Join thousands earning real rewards for recycling. Every scan, every deposit, every token makes a difference.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <motion.button className="btn-primary btn-lg" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/bins')}>View Bin Registry</motion.button>
          <motion.button className="btn-outline" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/test-qr')}>Test QR Code</motion.button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem', flexWrap: 'wrap' }}>
          {['🔒 Blockchain Secured', '⚡ Instant Rewards', '🌍 48 Cities'].map(t => (
            <span key={t} style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t}</span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
