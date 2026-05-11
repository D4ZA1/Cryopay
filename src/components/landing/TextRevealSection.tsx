import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

const words = "We believe recycling should be rewarding. Every bottle, every can, every piece of e-waste has real value. Our smart bins measure it, our blockchain records it, and your wallet receives it — instantly.".split(' ');

export default function TextRevealSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  return (
    <section ref={containerRef} className="text-reveal-section">
      <div className="text-reveal-inner">
        <p className="text-reveal-heading">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            return <Word key={i} word={word} range={[start, end]} progress={scrollYProgress} />;
          })}
        </p>
      </div>
    </section>
  );
}

function Word({ word, range, progress }: { word: string; range: [number, number]; progress: any }) {
  const opacity = useTransform(progress, range, [0.15, 1]);
  const color = useTransform(progress, range, ['rgba(255,255,255,0.15)', 'rgba(255,255,255,1)']);

  return (
    <motion.span className="text-reveal-word" style={{ opacity, color }}>
      {word}
    </motion.span>
  );
}
