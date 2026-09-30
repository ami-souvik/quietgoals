'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  originX: number; // percentage along row [0..100]
  originY: number; // percentage height [0..100]
  targetX: number; // px delta
  targetY: number; // px delta
  size: number; // px
  color: string;
  delay: number; // seconds
  duration: number; // seconds
}

const GOLD_PALETTE = [
  '#dfb15b', // primary brand gold
  '#f5cb68', // luminous warm gold
  '#ffe399', // sparkling highlight
  '#ffffff', // hot incandescent core
  '#cf9738', // deep amber gold
];

// Pre-generate 24 particles with explosive, physical trajectories
function createParticleData(): Particle[] {
  const particles: Particle[] = [];
  const TOTAL = 24;

  for (let i = 0; i < TOTAL; i++) {
    // Fuse ends at the right edge (~90-96% across the row)
    // 18 particles burst radially from where the fuse reaches the end
    // 6 particles lift off as upward sparks along the fuse trail
    const isTrailSpark = i < 6;

    if (isTrailSpark) {
      // Sparks along the sweep path
      const originX = 25 + i * 12; // 25%, 37%, 49%, 61%, 73%, 85%
      const originY = 80;
      const angle = -Math.PI / 2 + ((i - 2.5) * 0.35); // upwards
      const speed = 16 + (i * 5);
      particles.push({
        id: i,
        originX,
        originY,
        targetX: Math.cos(angle) * speed,
        targetY: Math.sin(angle) * speed,
        size: 2 + (i % 2),
        color: GOLD_PALETTE[i % GOLD_PALETTE.length],
        delay: 0.02 * i,
        duration: 0.45 + (i % 3) * 0.06,
      });
    } else {
      // Explosive radial burst at the fuse culmination point
      const radialIndex = i - 6;
      const radialCount = TOTAL - 6; // 18 particles
      // Spread across 360 degrees with pseudo-random jitter
      const angle = (radialIndex / radialCount) * 2 * Math.PI + Math.sin(radialIndex * 37) * 0.3;
      // Elliptical scaling: wider horizontally
      const distance = 20 + ((radialIndex * 19) % 36);
      const targetX = Math.cos(angle) * distance * 1.2;
      const targetY = Math.sin(angle) * distance * 0.75;
      const size = 2 + (radialIndex % 3); // 2px to 4px
      const color = GOLD_PALETTE[radialIndex % GOLD_PALETTE.length];
      const delay = (radialIndex % 4) * 0.015;

      particles.push({
        id: i,
        originX: 92,
        originY: 50,
        targetX,
        targetY,
        size,
        color,
        delay,
        duration: 0.52 + (radialIndex % 3) * 0.05,
      });
    }
  }

  return particles;
}

export function CompleteParticles() {
  const particles = useMemo(() => createParticleData(), []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-50 overflow-visible"
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{
            opacity: 1,
            scale: 0,
            x: 0,
            y: 0,
          }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.3, 0],
            x: p.targetX,
            y: p.targetY,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1], // snappy explosive launch with smooth decel
          }}
          style={{
            position: 'absolute',
            left: `${p.originX}%`,
            top: `${p.originY}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '9999px',
            boxShadow: `0 0 6px ${p.color}, 0 0 2px #fff`,
          }}
        />
      ))}
    </div>
  );
}
