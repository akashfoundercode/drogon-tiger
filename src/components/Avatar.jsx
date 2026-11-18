import React, { useId } from 'react';
import { Crown } from 'lucide-react';

// Procedural illustrated avatar – every seed gives a unique face.
export default function Avatar({ a, size = 56, ring, crown = false, children, ...rest }) {
  const uid = useId().replace(/:/g, '');
  const ringColor = ring || '#f5c542';
  return (
    <div
      className="relative rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        padding: Math.max(2, size * 0.05),
        background: `linear-gradient(145deg, #fff4b8, ${ringColor} 40%, #7a4c06 100%)`,
        boxShadow: ring
          ? `0 0 ${size * 0.35}px ${ringColor}aa, 0 3px 8px rgba(0,0,0,.6)`
          : '0 3px 8px rgba(0,0,0,.6)',
        transition: 'box-shadow .25s',
      }}
      {...rest}
    >
      <svg viewBox="0 0 64 64" className="block w-full h-full rounded-full">
        <defs>
          <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={a.bg1} />
            <stop offset="1" stopColor={a.bg2} />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill={`url(#bg${uid})`} />
        {a.hairStyle === 1 && <path d="M13 32 C11 6 53 6 51 32 L53 56 L11 56 Z" fill={a.hair} />}
        <path d="M5 64 C7 49 21 45 32 45 C43 45 57 49 59 64 Z" fill={a.shirt} />
        <path d="M26 45 L32 52 L38 45Z" fill="rgba(255,255,255,.22)" />
        <rect x="27" y="36" width="10" height="11" rx="3" fill={a.skin} style={{ filter: 'brightness(.85)' }} />
        <ellipse cx="32" cy="28" rx="12" ry="14" fill={a.skin} />
        {a.hairStyle === 0 && <path d="M19.5 26 C18 8 46 8 44.5 26 C41 19 23 19 19.5 26Z" fill={a.hair} />}
        {a.hairStyle === 1 && <path d="M19.5 27 C19 9 45 9 44.5 27 C40 18 25 18 19.5 27Z" fill={a.hair} />}
        {a.hairStyle === 2 && (
          <>
            <path d="M17 24 C16 5 48 5 47 24 C44 28 20 28 17 24Z" fill={a.shirt} style={{ filter: 'brightness(1.15)' }} />
            <path d="M18 22 C28 26 38 26 46 22" stroke="#f5c542" strokeWidth="1.6" fill="none" />
          </>
        )}
        {a.hairStyle === 3 && <path d="M19 22 C22 9 42 9 45 22 C40 17 24 17 19 22Z" fill={a.hair} />}
        {a.beard && <path d="M20.5 30 C21 47 43 47 43.5 30 C40 39 24 39 20.5 30Z" fill={a.hair} />}
        <ellipse cx="26.5" cy="28" rx="1.7" ry="2" fill="#1b1209" />
        <ellipse cx="37.5" cy="28" rx="1.7" ry="2" fill="#1b1209" />
        {a.glasses && (
          <g stroke="#1b1209" strokeWidth="1.2" fill="rgba(255,255,255,.12)">
            <circle cx="26.5" cy="28" r="5" />
            <circle cx="37.5" cy="28" r="5" />
            <path d="M31.5 28 H32.5" />
          </g>
        )}
        <path d="M28 36 Q32 39.5 36 36" stroke={a.beard ? '#fff' : '#7a3b2b'} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {a.bindi && <circle cx="32" cy="20.5" r="1.3" fill="#e11d48" />}
      </svg>
      {crown && (
        <Crown
          size={size * 0.46}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: -size * 0.3, color: '#ffd84a', fill: '#f5b81c', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.7))' }}
        />
      )}
      {children}
    </div>
  );
}
