import { motion, useInView } from 'motion/react';
import { useRef, useState } from 'react';

const items = [
  { icon: '🔍', title: 'Full Auditability', desc: 'Every deposit, every gram, every token — verifiable on-chain. Real-time dashboard for municipalities.', color: 'rgba(6,182,212,0.15)', borderColor: 'rgba(6,182,212,0.3)' },
  { icon: '🏢', title: 'Bin Registration', desc: 'Station operators register bins with unique wallet addresses. Each bin is a verified network node.', color: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.3)' },
  { icon: '📜', title: 'Smart Contracts', desc: 'Automated reward calculation. No middlemen, no delays. Weight x price = instant tokens.', color: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.3)' },
  { icon: '🔐', title: 'Tamper-Proof Records', desc: 'Nonce-based replay protection and time-limited signed QR codes ensure every transaction is genuine.', color: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.3)' },
];

// Node positions as percentages — icon center is at these exact coordinates
const nodes = [
  { x: 20, y: 22, emoji: '🗑️', label: 'Smart Bin', color: '#22c55e', delay: 0 },
  { x: 80, y: 22, emoji: '🏛️', label: 'Municipality', color: '#06b6d4', delay: 0.3 },
  { x: 50, y: 50, emoji: '⛓️', label: 'Blockchain', color: '#f97316', delay: 0.6 },
  { x: 20, y: 78, emoji: '👤', label: 'User Wallet', color: '#a855f7', delay: 0.9 },
  { x: 80, y: 78, emoji: '📊', label: 'Analytics', color: '#eab308', delay: 1.2 },
];

const connections = [
  [0, 2], [1, 2], [2, 3], [2, 4], [0, 3], [1, 4],
];

export default function BlockchainSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <section id="for-cities" className="section bg-cool-gradient" ref={ref}>
      <div className="section-inner">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <span className="section-label"><span className="section-label-bar" style={{ background: 'var(--tech-cyan)' }} /> For Municipalities</span>
          <h2 className="section-title">Complete transparency<br />for public programs</h2>
          <p className="section-subtitle">Governments get full on-chain auditability of every recycling deposit.</p>
        </motion.div>

        <div className="bc-grid">
          {/* Interactive Network Diagram */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              position: 'relative',
              aspectRatio: '1 / 1',
              maxHeight: '24rem',
              width: '100%',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '1.25rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Connection lines — SVG matches the container exactly */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              {connections.map(([from, to], idx) => {
                const n1 = nodes[from];
                const n2 = nodes[to];
                const isActive = hoveredNode === from || hoveredNode === to;
                return (
                  <motion.line
                    key={idx}
                    x1={n1.x} y1={n1.y}
                    x2={n2.x} y2={n2.y}
                    stroke={isActive ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isActive ? 0.6 : 0.3}
                    initial={{ pathLength: 0 }}
                    animate={inView ? { pathLength: 1 } : {}}
                    transition={{ duration: 1.5, delay: 0.5 + idx * 0.15 }}
                    style={{ transition: 'stroke 0.3s, stroke-width 0.3s' }}
                  />
                );
              })}

              {/* Animated data packets */}
              {hoveredNode !== null && connections
                .filter(([from, to]) => from === hoveredNode || to === hoveredNode)
                .map(([from, to], idx) => {
                  const n1 = nodes[from];
                  const n2 = nodes[to];
                  return (
                    <motion.circle
                      key={`packet-${idx}`}
                      r="1"
                      fill="#22c55e"
                      initial={{ cx: n1.x, cy: n1.y }}
                      animate={{ cx: [n1.x, n2.x], cy: [n1.y, n2.y] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  );
                })}
            </svg>

            {/* Nodes — positioned with % to match the SVG viewBox */}
            {nodes.map((n, i) => (
              <motion.div
                key={i}
                onMouseEnter={() => setHoveredNode(i)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  position: 'absolute',
                  left: `${n.x}%`, top: `${n.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer', zIndex: 10,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + n.delay, type: 'spring', stiffness: 200 }}
                whileHover={{ scale: 1.15 }}
              >
                <div
                  style={{
                    width: '3rem', height: '3rem', borderRadius: '0.75rem',
                    background: hoveredNode === i ? `${n.color}22` : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${hoveredNode === i ? n.color : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem',
                    boxShadow: hoveredNode === i ? `0 0 20px ${n.color}33` : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  {n.emoji}
                </div>
                <span style={{
                  fontSize: '0.625rem', fontWeight: 600, fontFamily: 'var(--font-display)',
                  color: hoveredNode === i ? n.color : 'var(--text-muted)',
                  transition: 'color 0.3s',
                  whiteSpace: 'nowrap',
                }}>
                  {n.label}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Feature cards */}
          <div className="bc-features">
            {items.map((f, i) => (
              <motion.div
                key={f.title}
                className="bc-feature"
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
                initial={{ opacity: 0, x: 30 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
                style={{
                  borderColor: hoveredFeature === i ? f.borderColor : undefined,
                  background: hoveredFeature === i ? f.color : undefined,
                  transform: hoveredFeature === i ? 'translateX(6px)' : undefined,
                  transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                  cursor: 'pointer',
                }}
              >
                <div className="bc-feature-icon" style={{
                  background: f.color,
                  transform: hoveredFeature === i ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.3s',
                }}>{f.icon}</div>
                <div style={{ flex: 1 }}>
                  <div className="bc-feature-title">{f.title}</div>
                  <div className="bc-feature-desc">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
