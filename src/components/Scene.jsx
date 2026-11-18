import React, { useMemo } from 'react';
import bgImage from '../assets/background/bg.png';

function mulberry(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Petals() {
  const petals = useMemo(() => {
    const r = mulberry(33);
    return Array.from({ length: 20 }, () => ({
      x: r() * 1870,
      d: r() * 14,
      t: 11 + r() * 9,
      s: 7 + r() * 8,
    }));
  }, []);

  return (
    <>
      {petals.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-[60%_40%_60%_40%] pointer-events-none"
          style={{
            left: p.x,
            top: 0,
            width: p.s,
            height: p.s * 0.7,
            background: i % 2 ? '#f9a8d4' : '#d8b4fe',
            opacity: 0,
            animation: `petal ${p.t}s linear ${p.d}s infinite`,
            zIndex: 3,
          }}
        />
      ))}
    </>
  );
}

export default function Scene() {
  return (
    <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
      {/* Background artwork - slightly zoomed for an immersive edge-to-edge frame */}
      <img
        src={bgImage}
        alt="Dragon vs Tiger background"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
        style={{
          transform: 'scale(1.05)',
          transformOrigin: 'center center',
          opacity: 0.75,
        }}
        draggable={false}
      />
      {/* Atmospheric falling cherry blossom petals */}
      <Petals />
    </div>
  );
}
