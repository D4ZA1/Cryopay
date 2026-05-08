import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react';
import { useRef, useEffect } from 'react';

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => target >= 1000 ? Math.round(v).toLocaleString() : target >= 100 ? Math.round(v).toString() : v.toFixed(1));
  const inView = useInView(ref, { once: true, margin: '-50px' });
  useEffect(() => { if (inView) animate(mv, target, { duration: 2, ease: 'easeOut' }); }, [inView, target, mv]);
  return <span ref={ref}><motion.span>{display}</motion.span>{suffix}</span>;
}

const stats = [
  { value: 12500, suffix: '+', label: 'Tons Recycled' },
  { value: 850000, suffix: '+', label: 'Tokens Distributed' },
  { value: 2400, suffix: '+', label: 'Active Smart Bins' },
  { value: 48, suffix: '', label: 'Cities Connected' },
];

export default function ImpactStats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="impact" className="section stats-section" ref={ref}>
      <div className="section-inner" style={{ textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <span className="section-label" style={{ justifyContent: 'center', display: 'flex' }}>
            <span className="section-label-bar" style={{ background: 'var(--energy-orange)' }} /> Our Impact
          </span>
          <h2 className="section-title">Making a measurable difference</h2>
        </motion.div>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <motion.div key={s.label} className="stat-item" style={{ textAlign: 'center' }} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}>
              <div className="stat-number"><Counter target={s.value} suffix={s.suffix} /></div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
