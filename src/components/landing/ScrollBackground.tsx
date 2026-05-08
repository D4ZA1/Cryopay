import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

/**
 * CSS-only scroll background — uses radial gradients with opacity transitions
 * instead of WebGL MeshGradient shaders. 99% lighter on the GPU.
 */
export default function ScrollBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const layer1 = useTransform(scrollYProgress, [0, 0.2, 0.3], [1, 1, 0]);
  const layer2 = useTransform(scrollYProgress, [0.2, 0.3, 0.5, 0.6], [0, 1, 1, 0]);
  const layer3 = useTransform(scrollYProgress, [0.5, 0.6, 0.75, 0.85], [0, 1, 1, 0]);
  const layer4 = useTransform(scrollYProgress, [0.75, 0.85, 1], [0, 1, 1]);

  const base: React.CSSProperties = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    transition: 'opacity 0.1s linear',
  };

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none', background: '#050505',
      }}
    >
      {/* Layer 1: Green / Cyan — Hero */}
      <motion.div style={{ ...base, opacity: layer1,
        background: `
          radial-gradient(ellipse 80% 70% at 20% 30%, rgba(34,197,94,0.18) 0%, transparent 70%),
          radial-gradient(ellipse 60% 60% at 80% 60%, rgba(6,182,212,0.14) 0%, transparent 70%),
          radial-gradient(ellipse 50% 50% at 50% 80%, rgba(249,115,22,0.08) 0%, transparent 70%)
        `,
      }} />

      {/* Layer 2: Teal / Emerald — Bin & Value */}
      <motion.div style={{ ...base, opacity: layer2,
        background: `
          radial-gradient(ellipse 70% 70% at 60% 40%, rgba(5,150,105,0.16) 0%, transparent 70%),
          radial-gradient(ellipse 60% 60% at 20% 70%, rgba(34,211,238,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 50% 50% at 80% 20%, rgba(20,78,74,0.1) 0%, transparent 70%)
        `,
      }} />

      {/* Layer 3: Orange / Amber — Features & Impact */}
      <motion.div style={{ ...base, opacity: layer3,
        background: `
          radial-gradient(ellipse 70% 60% at 70% 40%, rgba(217,119,6,0.14) 0%, transparent 70%),
          radial-gradient(ellipse 60% 60% at 30% 60%, rgba(22,163,74,0.1) 0%, transparent 70%),
          radial-gradient(ellipse 50% 50% at 50% 20%, rgba(234,88,12,0.08) 0%, transparent 70%)
        `,
      }} />

      {/* Layer 4: Purple / Cyan — Blockchain & CTA */}
      <motion.div style={{ ...base, opacity: layer4,
        background: `
          radial-gradient(ellipse 70% 60% at 40% 50%, rgba(124,58,237,0.14) 0%, transparent 70%),
          radial-gradient(ellipse 60% 60% at 80% 30%, rgba(6,182,212,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 50% 50% at 20% 80%, rgba(34,197,94,0.08) 0%, transparent 70%)
        `,
      }} />

      {/* Noise texture overlay for depth */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
        opacity: 0.4,
        mixBlendMode: 'overlay',
      }} />
    </div>
  );
}
