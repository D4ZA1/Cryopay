import React, { useRef, useEffect, useState } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";

// ---------------------------------------------------------------------------
// Shared types & easing
// ---------------------------------------------------------------------------

interface FadeProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const PREMIUM_EASE: [number, number, number, number] = [0.25, 0.4, 0, 1];

// ---------------------------------------------------------------------------
// 1. FadeInUp
// ---------------------------------------------------------------------------

export function FadeInUp({
  children,
  delay = 0,
  duration = 0.6,
  className,
  once = true,
}: FadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration, delay, ease: PREMIUM_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 2. FadeInLeft
// ---------------------------------------------------------------------------

export function FadeInLeft({
  children,
  delay = 0,
  duration = 0.6,
  className,
  once = true,
}: FadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -60 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
      transition={{ duration, delay, ease: PREMIUM_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 3. FadeInRight
// ---------------------------------------------------------------------------

export function FadeInRight({
  children,
  delay = 0,
  duration = 0.6,
  className,
  once = true,
}: FadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 60 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
      transition={{ duration, delay, ease: PREMIUM_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 4. ScaleIn
// ---------------------------------------------------------------------------

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.6,
  className,
  once = true,
}: FadeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={
        inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
      }
      transition={{ duration, delay, ease: PREMIUM_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 5. StaggerContainer
// ---------------------------------------------------------------------------

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

const staggerContainerVariants = (
  staggerDelay: number
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      variants={staggerContainerVariants(staggerDelay)}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 6. StaggerItem
// ---------------------------------------------------------------------------

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: PREMIUM_EASE,
    },
  },
};

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 7. ParallaxSection
// ---------------------------------------------------------------------------

interface ParallaxSectionProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxSection({
  children,
  speed = 0.3,
  className,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-80 * speed, 80 * speed]);

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. CountUp
// ---------------------------------------------------------------------------

interface CountUpProps {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function CountUp({
  to,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState<string>(
    `${prefix}${(0).toFixed(decimals)}${suffix}`
  );

  useEffect(() => {
    if (!inView) return;

    const startTime = performance.now();
    const durationMs = duration * 1000;

    let rafId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * to;

      setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [inView, to, duration, prefix, suffix, decimals]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.4, ease: PREMIUM_EASE }}
      className={className}
    >
      {display}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// 9. SlideInReveal
// ---------------------------------------------------------------------------

interface SlideInRevealProps {
  children: React.ReactNode;
  color?: string;
  direction?: "left" | "right";
  className?: string;
}

export function SlideInReveal({
  children,
  color = "emerald-500",
  direction = "left",
  className,
}: SlideInRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  const barOrigin = direction === "left" ? "left" : "right";
  const contentSlide = direction === "left" ? -30 : 30;

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className ?? ""}`}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {/* Reveal bar */}
      <motion.div
        className={`absolute inset-0 z-10 bg-${color}`}
        style={{ transformOrigin: barOrigin }}
        variants={{
          hidden: { scaleX: 0 },
          visible: {
            scaleX: [0, 1, 1, 0],
            transition: {
              duration: 1,
              times: [0, 0.4, 0.6, 1],
              ease: PREMIUM_EASE,
            },
          },
        }}
      />

      {/* Content */}
      <motion.div
        variants={{
          hidden: { opacity: 0, x: contentSlide },
          visible: {
            opacity: 1,
            x: 0,
            transition: {
              duration: 0.6,
              delay: 0.5,
              ease: PREMIUM_EASE,
            },
          },
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
