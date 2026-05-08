import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

const lines = [
  { text: 'Your trash has value.', color: 'white' },
  { text: 'Every bottle. Every can. Every circuit board.', color: 'var(--text-secondary)' },
  { text: 'Weighed by sensors.', color: 'var(--eco-green-light)' },
  { text: 'Priced by the market.', color: 'var(--tech-cyan)' },
  { text: 'Recorded on-chain.', color: 'var(--energy-orange)' },
  { text: 'Deposited in your wallet.', color: 'white' },
];

export default function ValueProposition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section
      ref={containerRef}
      style={{
        minHeight: '120vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle bg glow */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {lines.map((line, i) => {
          const start = 0.1 + i * 0.1;
          const end = start + 0.08;
          return <AnimatedLine key={i} text={line.text} color={line.color} start={start} end={end} progress={scrollYProgress} index={i} />;
        })}

        {/* Final CTA line */}
        <motion.div
          style={{
            marginTop: '3rem',
            opacity: useTransform(scrollYProgress, [0.75, 0.85], [0, 1]),
            y: useTransform(scrollYProgress, [0.75, 0.85], [30, 0]),
            textAlign: 'center',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--eco-green), var(--tech-cyan))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Put in waste. Get rewarded. It's that simple.
          </span>
        </motion.div>
      </div>
    </section>
  );
}

function AnimatedLine({ text, color, start, end, progress, index }: any) {
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [40, 0]);
  const x = useTransform(progress, [start, end], [index % 2 === 0 ? -30 : 30, 0]);

  return (
    <motion.div
      style={{
        opacity, y, x,
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.25rem, 3vw, 2rem)',
        fontWeight: 500,
        lineHeight: 1.8,
        color,
        textAlign: 'center',
      }}
    >
      {text}
    </motion.div>
  );
}
