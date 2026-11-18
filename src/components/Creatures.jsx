import React, { useId, useMemo } from 'react';
import { ART } from '../game/constants.js';

/* ------------------------------------------------------------------ *
 * Vector dragon + tiger. All motion is CSS (see index.css) so pivots *
 * stay in SVG user space. To use your own art, set ART.dragon /      *
 * ART.tiger in game/constants.js to an image path.                   *
 * ------------------------------------------------------------------ */

const glowFilter = (id, d = 4) => (
  <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation={d} result="b" />
    <feMerge>
      <feMergeNode in="b" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);

const FLAME = 'M0,0 C-16,-30 8,-52 0,-92 C26,-62 34,-26 14,0 Z';

function FlameRing({ from, to, count, radius, fill, scale = 1, delayStep = 0.17 }) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const a = from + ((to - from) * i) / Math.max(1, count - 1);
    const s = scale * (0.75 + ((i * 37) % 10) / 22);
    items.push(
      <g key={i} transform={`rotate(${a}) translate(0,${-radius}) scale(${s})`}>
        <path
          d={FLAME}
          fill={fill}
          className="anim-flame"
          style={{ animationDelay: `${(i * delayStep).toFixed(2)}s`, transformOrigin: '0px 0px' }}
        />
      </g>
    );
  }
  return <g>{items}</g>;
}

/* ------------------------------- DRAGON ------------------------------- */
export function DragonHead({ uid = 'dh', animated = true }) {
  const A = (cls) => (animated ? cls : '');
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-skin`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4fe0ff" />
          <stop offset=".45" stopColor="#1f6dff" />
          <stop offset="1" stopColor="#0a2a8a" />
        </linearGradient>
        <linearGradient id={`${uid}-jaw`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b56d8" />
          <stop offset="1" stopColor="#081d66" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset=".5" stopColor="#f5c542" />
          <stop offset="1" stopColor="#9a6a12" />
        </linearGradient>
        <radialGradient id={`${uid}-wisp`} cx="0.5" cy="0.8" r="0.8">
          <stop offset="0" stopColor="#e6fbff" />
          <stop offset=".5" stopColor="#4fe0ff" />
          <stop offset="1" stopColor="#1f6dff" stopOpacity=".0" />
        </radialGradient>
        {glowFilter(`${uid}-glow`, 4)}
      </defs>

      {/* energy mane */}
      <g transform="translate(-30,-10)">
        <FlameRing from={-150} to={-60} count={9} radius={52} fill={`url(#${uid}-wisp)`} scale={1.15} />
      </g>

      {/* gold horns */}
      <path d="M-30,-52 C-60,-100 -120,-120 -190,-100 C-130,-100 -90,-80 -60,-40Z" fill={`url(#${uid}-gold)`} stroke="#7a4c06" strokeWidth="1.5" />
      <path d="M0,-58 C-20,-110 -70,-135 -130,-130 C-80,-120 -40,-95 -25,-50Z" fill={`url(#${uid}-gold)`} stroke="#7a4c06" strokeWidth="1.5" />

      {/* mouth interior */}
      <path d="M-40,6 L150,0 L140,22 L-40,32Z" fill="#3a0614" />

      {/* lower jaw (pivot at hinge) */}
      <g transform="translate(-52,10)">
        <g className={A('anim-jaw')} style={{ transformOrigin: '0px 0px' }}>
          <path d="M8,-2 C48,2 108,2 172,-4 C198,-6 208,4 194,12 C172,28 122,38 72,38 C32,38 2,28 -8,-2Z" fill={`url(#${uid}-jaw)`} stroke="#061548" strokeWidth="1.5" />
          <path d="M150,-4 L156,-18 L162,-4Z M126,-3 L131,-14 L137,-3Z M100,-2 L104,-11 L110,-2Z" fill="#fff" />
          <path d="M20,16 C50,26 100,26 150,16" stroke="#4fe0ff" strokeWidth="2" fill="none" opacity=".5" />
          {/* beard spikes */}
          <path d="M40,34 L30,62 L58,38Z M80,38 L74,70 L100,36Z" fill={`url(#${uid}-gold)`} />
        </g>
      </g>

      {/* skull + upper jaw */}
      <path
        d="M-70,-10 C-60,-50 -10,-66 40,-58 C80,-52 110,-40 150,-22 C162,-17 164,-6 152,-2 L128,2 C110,6 90,8 60,10 C20,12 -30,14 -70,10Z"
        fill={`url(#${uid}-skin)`}
        stroke="#061548"
        strokeWidth="2"
      />
      {/* upper teeth */}
      <path d="M96,6 L102,22 L108,6Z M120,4 L126,18 L132,4Z M70,9 L74,20 L80,9Z M140,-1 L146,27 L152,-3Z" fill="#fff" stroke="#c9d6ee" strokeWidth=".6" />
      {/* scales on cheek */}
      <g stroke="#9fe9ff" strokeWidth="1.4" fill="none" opacity=".55">
        <path d="M-30,-20 q8,-8 16,0 M-14,-12 q8,-8 16,0 M2,-4 q8,-8 16,0 M-44,-4 q8,-8 16,0 M-28,4 q8,-8 16,0" />
      </g>
      {/* brow */}
      <path d="M8,-50 C38,-74 82,-66 104,-42 C72,-54 40,-54 8,-50Z" fill={`url(#${uid}-gold)`} stroke="#7a4c06" strokeWidth="1" />
      {/* eye */}
      <g filter={`url(#${uid}-glow)`} className={A('anim-glow')}>
        <ellipse cx="62" cy="-31" rx="12" ry="6.5" transform="rotate(-18 62 -31)" fill="#ffe15a" />
        <ellipse cx="64" cy="-31" rx="2.2" ry="5.5" transform="rotate(-18 64 -31)" fill="#2a0a00" />
      </g>
      {/* nostril */}
      <ellipse cx="146" cy="-12" rx="4" ry="2.5" fill="#06133f" />
      {/* whiskers */}
      <g transform="translate(150,-6)">
        <g className={A('anim-whisker')} style={{ transformOrigin: '0px 0px' }}>
          <path d="M0,0 C40,-34 80,-26 112,-66" stroke={`url(#${uid}-gold)`} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M0,8 C50,14 90,40 124,32" stroke={`url(#${uid}-gold)`} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      </g>
      {/* breath wisp */}
      <circle cx="176" cy="-6" r="10" fill={`url(#${uid}-wisp)`} className={A('anim-glow')} />
    </g>
  );
}

export function DragonArt({ uid = 'dragon' }) {
  return (
    <svg viewBox="0 0 540 270" width="540" height="270" className="overflow-visible">
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0a2a8a" />
          <stop offset=".5" stopColor="#1f6dff" />
          <stop offset="1" stopColor="#4fe0ff" />
        </linearGradient>
        {glowFilter(`${uid}-bglow`, 6)}
      </defs>
      <g className="anim-breathe" style={{ transformOrigin: '270px 260px' }}>
        {/* serpent body */}
        <g filter={`url(#${uid}-bglow)`} opacity=".9">
          <path d="M-20,262 C40,170 100,270 170,198 C230,136 300,236 332,150 C346,112 336,98 352,104" stroke="#06133f" strokeWidth="70" fill="none" strokeLinecap="round" />
        </g>
        <path d="M-20,262 C40,170 100,270 170,198 C230,136 300,236 332,150 C346,112 336,98 352,104" stroke={`url(#${uid}-body)`} strokeWidth="60" fill="none" strokeLinecap="round" />
        <path d="M-20,262 C40,170 100,270 170,198 C230,136 300,236 332,150 C346,112 336,98 352,104" stroke="#aaf0ff" strokeWidth="46" fill="none" strokeLinecap="round" strokeDasharray="3 11" opacity=".35" />
        <path d="M-20,272 C40,180 100,280 170,208 C230,146 300,246 332,160" stroke="#f5c542" strokeWidth="14" fill="none" strokeDasharray="10 6" opacity=".55" />
        {/* head */}
        <g transform="translate(388,112) rotate(-6)">
          <g className="anim-sway" style={{ transformOrigin: '-60px 10px' }}>
            <DragonHead uid={uid} />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function DragonCrest({ uid = 'dcrest' }) {
  return (
    <svg viewBox="-210 -140 440 220" className="w-full h-full overflow-visible">
      <DragonHead uid={uid} animated={false} />
    </svg>
  );
}

/* -------------------------------- TIGER -------------------------------- */
export function TigerHead({ uid = 'th', animated = true }) {
  const A = (cls) => (animated ? cls : '');
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-fur`} cx=".5" cy=".35" r=".75">
          <stop offset="0" stopColor="#ffb84a" />
          <stop offset=".55" stopColor="#f2740f" />
          <stop offset="1" stopColor="#b53a05" />
        </radialGradient>
        <radialGradient id={`${uid}-fire`} cx=".5" cy="1" r="1">
          <stop offset="0" stopColor="#fff3a0" />
          <stop offset=".45" stopColor="#ffa31a" />
          <stop offset="1" stopColor="#e3350d" />
        </radialGradient>
        {glowFilter(`${uid}-glow`, 4)}
      </defs>

      {/* fire mane */}
      <FlameRing from={-130} to={130} count={15} radius={78} fill={`url(#${uid}-fire)`} scale={1.25} delayStep={0.13} />

      {/* ears */}
      <circle cx="-76" cy="-62" r="27" fill="#e0630a" stroke="#4a1c05" strokeWidth="2" />
      <circle cx="-76" cy="-60" r="14" fill="#2a0a05" />
      <circle cx="76" cy="-62" r="27" fill="#e0630a" stroke="#4a1c05" strokeWidth="2" />
      <circle cx="76" cy="-60" r="14" fill="#2a0a05" />

      {/* head */}
      <path d="M0,-84 C52,-84 94,-50 98,-4 C102,42 72,80 0,86 C-72,80 -102,42 -98,-4 C-94,-50 -52,-84 0,-84Z" fill={`url(#${uid}-fur)`} stroke="#4a1c05" strokeWidth="2.5" />
      {/* white cheeks + muzzle */}
      <ellipse cx="-64" cy="36" rx="36" ry="26" fill="#fff1dc" />
      <ellipse cx="64" cy="36" rx="36" ry="26" fill="#fff1dc" />
      <ellipse cx="0" cy="30" rx="36" ry="24" fill="#fff6e8" />
      {/* stripes */}
      <g fill="#1a0804">
        <path d="M0,-82 L-7,-48 L0,-36 L7,-48Z" />
        <path d="M-30,-77 L-24,-52 L-35,-43 L-44,-70Z" />
        <path d="M30,-77 L24,-52 L35,-43 L44,-70Z" />
        <path d="M-98,-6 L-64,4 L-98,16Z" />
        <path d="M98,-6 L64,4 L98,16Z" />
        <path d="M-94,26 L-66,26 L-90,44Z" />
        <path d="M94,26 L66,26 L90,44Z" />
        <path d="M-70,-52 L-56,-34 L-76,-38Z" />
        <path d="M70,-52 L56,-34 L76,-38Z" />
      </g>
      {/* eyes */}
      <g filter={`url(#${uid}-glow)`} className={A('anim-glow')}>
        <ellipse cx="-34" cy="-14" rx="15" ry="9" transform="rotate(16 -34 -14)" fill="#ffe14a" />
        <ellipse cx="34" cy="-14" rx="15" ry="9" transform="rotate(-16 34 -14)" fill="#ffe14a" />
      </g>
      <ellipse cx="-33" cy="-14" rx="3" ry="8" transform="rotate(16 -33 -14)" fill="#160600" />
      <ellipse cx="33" cy="-14" rx="3" ry="8" transform="rotate(-16 33 -14)" fill="#160600" />
      <path d="M-56,-32 L-14,-18 L-20,-30Z M56,-32 L14,-18 L20,-30Z" fill="#1a0804" />
      {/* mouth */}
      <path d="M-34,40 C-24,82 24,82 34,40 C16,50 -16,50 -34,40Z" fill="#5a0612" />
      <g className={A('anim-jaw')} style={{ transformOrigin: '0px 44px' }}>
        <path d="M-30,48 C-20,86 20,86 30,48 C14,54 -14,54 -30,48Z" fill="#7a0c1a" />
        <ellipse cx="0" cy="66" rx="14" ry="8" fill="#e65a6a" />
        <path d="M-18,52 L-13,38 L-8,52Z M18,52 L13,38 L8,52Z" fill="#fff" />
      </g>
      <path d="M-27,40 L-20,66 L-12,42Z M27,40 L20,66 L12,42Z" fill="#fff" stroke="#e3d6bf" strokeWidth=".6" />
      {/* nose */}
      <path d="M-12,8 L12,8 L0,26Z" fill="#f08a86" stroke="#7a2418" strokeWidth="1.5" />
      <path d="M0,26 L0,38" stroke="#7a2418" strokeWidth="2" />
      {/* whiskers */}
      <g stroke="#fff" strokeWidth="1.3" opacity=".85" fill="none" className={A('anim-whisker')} style={{ transformOrigin: '0px 36px' }}>
        <path d="M-34,30 L-112,16 M-34,38 L-116,42 M-30,46 L-104,66" />
        <path d="M34,30 L112,16 M34,38 L116,42 M30,46 L104,66" />
      </g>
    </g>
  );
}

export function TigerArt({ uid = 'tiger' }) {
  return (
    <svg viewBox="0 0 540 270" width="540" height="270" className="overflow-visible">
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2740f" />
          <stop offset="1" stopColor="#7a2205" />
        </linearGradient>
      </defs>
      <g className="anim-breathe" style={{ transformOrigin: '270px 260px' }}>
        {/* tail */}
        <g transform="translate(470,236)">
          <g className="anim-tail" style={{ transformOrigin: '0px 0px' }}>
            <path d="M0,0 C50,-10 76,-60 60,-110" stroke="#4a1c05" strokeWidth="30" fill="none" strokeLinecap="round" />
            <path d="M0,0 C50,-10 76,-60 60,-110" stroke="#f2740f" strokeWidth="24" fill="none" strokeLinecap="round" />
            <path d="M0,0 C50,-10 76,-60 60,-110" stroke="#1a0804" strokeWidth="24" fill="none" strokeDasharray="6 16" />
            <circle cx="60" cy="-110" r="12" fill="#1a0804" />
          </g>
        </g>
        {/* shoulders */}
        <path d="M80,270 C80,190 170,176 270,176 C370,176 470,190 470,270Z" fill={`url(#${uid}-body)`} stroke="#4a1c05" strokeWidth="3" />
        <g fill="#1a0804" opacity=".85">
          <path d="M130,270 L146,214 L160,270Z M200,270 L214,196 L230,270Z M330,270 L346,196 L360,270Z M400,270 L414,214 L430,270Z" />
        </g>
        {/* head */}
        <g transform="translate(272,100)">
          <g className="anim-sway" style={{ transformOrigin: '0px 60px' }}>
            <TigerHead uid={uid} />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function TigerCrest({ uid = 'tcrest' }) {
  return (
    <svg viewBox="-140 -170 280 330" className="w-full h-full overflow-visible">
      <TigerHead uid={uid} animated={false} />
    </svg>
  );
}

/* ------------------------- particle emitters ------------------------- */
export function Particles({ kind, className = '' }) {
  const items = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        left: 8 + ((i * 53) % 84),
        size: 4 + ((i * 7) % 7),
        delay: (i * 0.43) % 3.5,
        dur: 2.6 + ((i * 29) % 18) / 10,
      })),
    []
  );
  const color = kind === 'dragon' ? ['#e6fbff', '#4fe0ff'] : ['#fff3a0', '#ff7a1a'];
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      {items.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: 0,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${color[0]}, ${color[1]})`,
            boxShadow: `0 0 8px 2px ${color[1]}`,
            animation: `rise ${p.dur}s ease-out ${p.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

/* -------------------- header character with art override -------------------- */
export function Creature({ kind }) {
  const raw = useId().replace(/:/g, '');
  const src = ART[kind];
  if (src) return <img src={src} alt={kind} className="w-[540px] h-[270px] object-contain" draggable={false} />;
  return kind === 'dragon' ? <DragonArt uid={`dr${raw}`} /> : <TigerArt uid={`ti${raw}`} />;
}
