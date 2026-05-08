import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

// Trash items that fall into the bin
const trashItems = [
  { emoji: '🧴', startX: -120, startY: -200, delay: 0 },
  { emoji: '📱', startX: 80, startY: -260, delay: 0.05 },
  { emoji: '🥫', startX: -60, startY: -300, delay: 0.1 },
  { emoji: '📄', startX: 100, startY: -180, delay: 0.15 },
  { emoji: '🍾', startX: -100, startY: -240, delay: 0.2 },
  { emoji: '💻', startX: 50, startY: -320, delay: 0.25 },
];

// Coins that fly out
const coins = [
  { endY: -180, endX: -120, delay: 0 },
  { endY: -240, endX: 40, delay: 0.05 },
  { endY: -160, endX: 140, delay: 0.1 },
  { endY: -200, endX: -80, delay: 0.15 },
  { endY: -260, endX: 100, delay: 0.2 },
  { endY: -150, endX: -160, delay: 0.25 },
];

function TrashItem({ emoji, startX, startY, scrollProgress, delay }: any) {
  // Trash falls in from 0.0 to 0.45 total
  const start = 0.0 + delay;
  const end = 0.2 + delay; 

  const y = useTransform(scrollProgress, [start, end], [startY, 80]); // 80 is inside the bin
  const x = useTransform(scrollProgress, [start, end], [startX, 0]);
  const opacity = useTransform(scrollProgress, [start, start + 0.05, end - 0.02, end], [0, 1, 1, 0]);
  const scale = useTransform(scrollProgress, [start, start + 0.1, end], [1, 1.2, 0]);
  const rotate = useTransform(scrollProgress, [start, end], [0, startX > 0 ? 180 : -180]);

  return (
    <motion.div
      style={{
        position: 'absolute', left: '50%', top: '50%',
        x, y, opacity, scale, rotate,
        fontSize: '3rem', zIndex: 20, pointerEvents: 'none',
        marginLeft: '-1.5rem', marginTop: '-1.5rem', // perfectly center
      }}
    >
      {emoji}
    </motion.div>
  );
}

function CoinItem({ endY, endX, scrollProgress, delay }: any) {
  // Coins fly out from 0.55 to 0.9 total
  const start = 0.55 + delay;
  const end = 0.75 + delay;

  // Fly out from inside bin (y=40, x=0)
  const y = useTransform(scrollProgress, [start, start + 0.1, end], [40, endY - 40, endY]);
  const x = useTransform(scrollProgress, [start, end], [0, endX]); 
  const opacity = useTransform(scrollProgress, [start, start + 0.05, end - 0.05, end], [0, 1, 1, 0]);
  const scale = useTransform(scrollProgress, [start, start + 0.1, end], [0, 1.2, 0.8]);

  return (
    <motion.div
      style={{
        position: 'absolute', left: '50%', top: '50%',
        x, y, opacity, scale,
        zIndex: 25, pointerEvents: 'none',
        marginLeft: '-20px', marginTop: '-20px',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', fontWeight: 800,
        boxShadow: '0 0 20px rgba(245,158,11,0.5)',
        border: '2px solid rgba(255,255,255,0.4)',
        fontFamily: 'var(--font-display)',
        color: '#78350F',
      }}>
        E
      </div>
    </motion.div>
  );
}

export default function BinAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  // We use start start to end end so it maps exactly to the sticky duration
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Bin lid opens when trash falls (0 to 0.45), closes after
  const lidRotate = useTransform(scrollYProgress, [0, 0.05, 0.45, 0.5], [0, -45, -45, 0]);
  
  // Bin processes the trash (0.45 to 0.55)
  const sensorScale = useTransform(scrollYProgress, [0.45, 0.5, 0.55], [1, 1.8, 1]);
  const sensorOpacity = useTransform(scrollYProgress, [0.45, 0.5, 0.55], [0.3, 1, 0.3]);
  const binGlow = useTransform(scrollYProgress, [0.45, 0.5, 0.8], [0, 1, 0]);
  const binY = useTransform(scrollYProgress, [0.45, 0.5, 0.55], [0, 10, 0]); // subtle bounce

  // Label appears once coins start flying out
  const labelOpacity = useTransform(scrollYProgress, [0.6, 0.7], [0, 1]);
  const labelY = useTransform(scrollYProgress, [0.6, 0.7], [30, 0]);

  return (
    <section
      ref={containerRef}
      style={{
        height: '400vh', // Huge height so the scroll takes a long time
        position: 'relative',
      }}
    >
      <div style={{
        position: 'sticky', top: 0, height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Background radial glow */}
        <motion.div
          style={{
            position: 'absolute', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%)',
            opacity: binGlow,
            filter: 'blur(40px)',
            zIndex: 0,
          }}
        />

        {/* The Bin */}
        <motion.div
          style={{
            position: 'relative', y: binY, zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
        >
          {/* Bin SVG */}
          <svg width="220" height="300" viewBox="0 0 220 300" fill="none">
            {/* Bin Body */}
            <rect x="30" y="90" width="160" height="190" rx="18"
              fill="rgba(255,255,255,0.04)"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.5"
            />
            {/* Body inner gradient */}
            <rect x="35" y="95" width="150" height="180" rx="15"
              fill="url(#binBodyGrad)"
              opacity="0.5"
            />
            {/* Sensor ring */}
            <motion.circle cx="110" cy="160" r="22"
              fill="none" stroke="rgba(34,197,94,0.5)" strokeWidth="2"
              style={{ scale: sensorScale, opacity: sensorOpacity, transformOrigin: '110px 160px' }}
            />
            <circle cx="110" cy="160" r="7" fill="rgba(34,197,94,0.6)" />
            {/* QR code area */}
            <rect x="80" y="200" width="60" height="60" rx="6"
              fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1"
            />
            {[0,1,2,3,4].map(r => [0,1,2,3,4].map(c =>
              (r+c) % 2 === 0 ? (
                <rect key={`${r}${c}`} x={86+c*10} y={206+r*10} width="7" height="7" rx="1" fill="rgba(255,255,255,0.12)" />
              ) : null
            ))}
            {/* Recycling symbol */}
            <text x="95" y="285" fontSize="18" fill="rgba(34,197,94,0.3)">♻️</text>
            {/* Gradient defs */}
            <defs>
              <linearGradient id="binBodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34,197,94,0.05)" />
                <stop offset="100%" stopColor="rgba(6,182,212,0.02)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Lid - separate so it can rotate */}
          <motion.div
            style={{
              position: 'absolute', top: 0, left: 0, zIndex: 30,
              rotateX: lidRotate,
              transformOrigin: 'top center',
            }}
          >
            <svg width="220" height="50" viewBox="0 0 220 50" fill="none">
              <rect x="18" y="20" width="184" height="30" rx="10"
                fill="rgba(34,197,94,0.15)"
                stroke="rgba(34,197,94,0.4)"
                strokeWidth="1.5"
                style={{ backdropFilter: 'blur(10px)' }}
              />
              <rect x="80" y="10" width="60" height="12" rx="6" fill="rgba(34,197,94,0.3)" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Trash items falling in */}
        {trashItems.map((item, i) => (
          <TrashItem key={`trash-${i}`} {...item} scrollProgress={scrollYProgress} />
        ))}

        {/* Coins flying out */}
        {coins.map((coin, i) => (
          <CoinItem key={`coin-${i}`} {...coin} scrollProgress={scrollYProgress} />
        ))}

        {/* Label that appears */}
        <motion.div
          style={{
            position: 'absolute', bottom: '15%',
            opacity: labelOpacity,
            y: labelY,
            textAlign: 'center',
            zIndex: 40,
          }}
        >
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.25rem, 3vw, 2rem)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #F59E0B, #FCD34D)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '0.05em',
          }}>
            Waste In → Tokens Out
          </div>
        </motion.div>
      </div>
    </section>
  );
}
