import React from 'react';
import { motion } from 'framer-motion';

// --- Gradient Orbs ---

interface GradientOrbProps {
  x: string;
  y: string;
  size: number;
  color: string;
  duration: number;
  delay: number;
  opacity: [number, number];
  yDrift: [number, number, number];
  scale: [number, number, number];
}

const GradientOrb: React.FC<GradientOrbProps> = ({
  x,
  y,
  size,
  color,
  duration,
  delay,
  opacity,
  yDrift,
  scale,
}) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      left: x,
      top: y,
      width: size,
      height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(80px)',
    }}
    animate={{
      y: yDrift,
      scale,
      opacity,
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }}
  />
);

const gradientOrbs: GradientOrbProps[] = [
  {
    x: '10%',
    y: '15%',
    size: 500,
    color: 'rgba(16, 185, 129, 0.6)',
    duration: 20,
    delay: 0,
    opacity: [0.04, 0.08],
    yDrift: [0, -40, 0],
    scale: [1, 1.15, 1],
  },
  {
    x: '60%',
    y: '55%',
    size: 450,
    color: 'rgba(59, 130, 246, 0.6)',
    duration: 25,
    delay: 3,
    opacity: [0.03, 0.07],
    yDrift: [0, 35, 0],
    scale: [1, 1.1, 1],
  },
  {
    x: '35%',
    y: '70%',
    size: 400,
    color: 'rgba(139, 92, 246, 0.5)',
    duration: 22,
    delay: 6,
    opacity: [0.03, 0.06],
    yDrift: [0, -30, 0],
    scale: [1.05, 0.95, 1.05],
  },
  {
    x: '75%',
    y: '10%',
    size: 350,
    color: 'rgba(245, 158, 11, 0.5)',
    duration: 28,
    delay: 9,
    opacity: [0.03, 0.06],
    yDrift: [0, 25, 0],
    scale: [1, 1.12, 1],
  },
];

// --- Floating Particles ---

interface FloatingParticleProps {
  x: string;
  size: number;
  duration: number;
  delay: number;
}

const FloatingParticle: React.FC<FloatingParticleProps> = ({
  x,
  size,
  duration,
  delay,
}) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      left: x,
      bottom: '-5%',
      width: size,
      height: size,
      background: 'rgba(255, 255, 255, 0.4)',
    }}
    animate={{
      y: [0, -window.innerHeight * 1.2],
      opacity: [0, 0.06, 0.04, 0],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'linear',
    }}
  />
);

const floatingParticles: FloatingParticleProps[] = [
  { x: '12%', size: 3, duration: 18, delay: 0 },
  { x: '28%', size: 2, duration: 22, delay: 4 },
  { x: '42%', size: 4, duration: 16, delay: 2 },
  { x: '55%', size: 2, duration: 24, delay: 8 },
  { x: '68%', size: 3, duration: 20, delay: 6 },
  { x: '78%', size: 2, duration: 26, delay: 10 },
  { x: '88%', size: 3, duration: 19, delay: 3 },
  { x: '35%', size: 2, duration: 21, delay: 12 },
  { x: '8%', size: 4, duration: 17, delay: 7 },
  { x: '92%', size: 2, duration: 23, delay: 5 },
];

// --- Main Component ---

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />

      {/* Gradient Orbs */}
      {gradientOrbs.map((orb, i) => (
        <GradientOrb key={`orb-${i}`} {...orb} />
      ))}

      {/* Grid Pattern */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.03,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating Particles */}
      {floatingParticles.map((particle, i) => (
        <FloatingParticle key={`particle-${i}`} {...particle} />
      ))}

      {/* Noise Texture Overlay */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* Subtle radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
