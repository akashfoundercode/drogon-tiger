import React from 'react';
import { CHIP_STYLES } from '../game/constants.js';

// Premium 3D casino chip – each denomination has its own palette.
export default function Chip({ value, size = 44, label = false, className = '', style }) {
  const c = CHIP_STYLES[value] || CHIP_STYLES[10];
  const fs = value >= 1000 ? size * 0.27 : size * 0.34;
  return (
    <div
      className={`relative shrink-0 rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 34% 28%, ${c.light}, ${c.base} 55%, ${c.dark})`,
        boxShadow: `0 ${size * 0.07}px 0 ${c.dark}, 0 ${size * 0.13}px ${size * 0.12}px rgba(0,0,0,.55), inset 0 0 0 ${Math.max(1, size * 0.03)}px ${c.dark}`,
        ...style,
      }}
    >
      {/* edge notches */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `repeating-conic-gradient(from 0deg, ${c.edge} 0 13deg, transparent 13deg 45deg)`,
          WebkitMask: 'radial-gradient(circle, transparent 68%, #000 69%)',
          mask: 'radial-gradient(circle, transparent 68%, #000 69%)',
          opacity: 0.92,
        }}
      />
      {/* inner ring + face */}
      <div
        className="absolute rounded-full"
        style={{
          inset: '17%',
          background: `radial-gradient(circle at 40% 30%, ${c.light}, ${c.base} 70%)`,
          border: `${Math.max(1, size * 0.035)}px dashed ${c.edge}`,
          boxShadow: `inset 0 ${size * 0.03}px ${size * 0.06}px rgba(0,0,0,.35)`,
        }}
      />
      <div
        className="absolute inset-0 flex flex-col items-center justify-center font-body font-extrabold text-white leading-none"
        style={{ fontSize: fs, textShadow: `0 1px 2px ${c.dark}, 0 0 ${size * 0.1}px ${c.dark}` }}
      >
        {value}
        {label && size >= 60 && (
          <span style={{ fontSize: size * 0.12, letterSpacing: 1, marginTop: 1, opacity: 0.9 }}>CHIP</span>
        )}
      </div>
      {/* gloss */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: '14%',
          top: '8%',
          width: '46%',
          height: '28%',
          background: 'linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,0))',
          transform: 'rotate(-28deg)',
          filter: 'blur(1px)',
        }}
      />
    </div>
  );
}
