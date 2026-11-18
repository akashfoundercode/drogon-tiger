import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../game/GameContext.jsx';
import dragonFireGif from '../assets/gif/dragon_blue_fire_transparent.gif';
import tigerFireGif from '../assets/gif/tiger_HD_1280x720_1.75s.gif';
import tigerStillPng from '../assets/gif/tiger_still.png';

// Exact centers of the 14 small history boxes (#7 to #20) inside bg.png
export const HISTORY_BOXES = [
  { id: 7, x: 656 },
  { id: 8, x: 709 },
  { id: 9, x: 762 },
  { id: 10, x: 815 },
  { id: 11, x: 867 },
  { id: 12, x: 920 },
  { id: 13, x: 972 },
  { id: 14, x: 1024 },
  { id: 15, x: 1075 },
  { id: 16, x: 1127 },
  { id: 17, x: 1179 },
  { id: 18, x: 1231 },
  { id: 19, x: 1283 },
  { id: 20, x: 1335 },
];

// In bg.png, golden octagonal history boxes (#7 to #20) are from y=264 to y=294 (center = 279).
// Badge is 36px wide × 30px high, so top = 279 - 15 = 264.
export const BADGE_TOP = 264;
export const BADGE_W = 36;
export const BADGE_H = 30;

const BADGE_CONFIG = {
  dragon: {
    bg: 'radial-gradient(circle at 35% 30%, #38bdf8, #1d4ed8)',
    text: 'D',
    color: '#ffffff',
    border: '#93c5fd',
  },
  tiger: {
    bg: 'radial-gradient(circle at 35% 30%, #fbbf24, #d97706)',
    text: 'T',
    color: '#ffffff',
    border: '#fde68a',
  },
  tie: {
    bg: 'radial-gradient(circle at 35% 30%, #4ade80, #15803d)',
    text: 'Tie',
    color: '#ffffff',
    border: '#bbf7d0',
  },
};

function DragonElectricAura() {
  const embers = [
    { left: '25%', top: '65%', size: 10, delay: 0, dur: 2.1, xOffset: -12 },
    { left: '38%', top: '70%', size: 14, delay: 0.4, dur: 1.8, xOffset: 16 },
    { left: '48%', top: '60%', size: 12, delay: 0.8, dur: 2.3, xOffset: -8 },
    { left: '60%', top: '68%', size: 16, delay: 1.2, dur: 2.0, xOffset: 14 },
    { left: '32%', top: '55%', size: 8, delay: 1.6, dur: 1.9, xOffset: -18 },
    { left: '70%', top: '62%', size: 12, delay: 0.6, dur: 2.4, xOffset: 10 },
    { left: '42%', top: '75%', size: 15, delay: 1.4, dur: 2.2, xOffset: -15 },
    { left: '55%', top: '58%', size: 9, delay: 0.2, dur: 1.7, xOffset: 12 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-visible">
      {/* 1. Pulsing Electric Flame Plasma Core */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          scale: [1, 1.14, 0.96, 1.08, 1],
          opacity: [0.55, 0.85, 0.6, 0.9, 0.55],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(56,189,248,0.5) 0%, rgba(14,116,224,0.35) 45%, rgba(99,102,241,0.15) 70%, transparent 85%)',
          filter: 'blur(16px)',
        }}
      />

      {/* 2. Floating Electric Flame Wisps / Embers */}
      {embers.map((e, idx) => (
        <motion.span
          key={idx}
          className="absolute"
          style={{
            left: e.left,
            top: e.top,
            width: e.size,
            height: e.size * 1.5,
            background: 'radial-gradient(circle at 40% 30%, #ffffff 0%, #67e8f9 45%, #0284c7 100%)',
            boxShadow: '0 0 10px #38bdf8, 0 0 20px #0284c7, 0 0 30px #0369a1',
            borderRadius: '50% 50% 35% 35%',
          }}
          animate={{
            y: [0, -110],
            x: [0, e.xOffset, e.xOffset * 0.5],
            opacity: [0, 0.95, 0],
            scale: [0.6, 1.3, 0.4],
            rotate: [0, e.xOffset * 3],
          }}
          transition={{
            duration: e.dur,
            repeat: Infinity,
            delay: e.delay,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* 3. Crackling Lightning Tendrils */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none anim-lightning"
        viewBox="0 0 450 240"
        fill="none"
        style={{ filter: 'drop-shadow(0 0 8px #67e8f9)' }}
      >
        <path
          d="M 120 140 Q 180 90, 230 110 T 310 85 T 380 120"
          stroke="#67e8f9"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="12 8"
          opacity="0.8"
        />
        <path
          d="M 160 170 Q 210 130, 260 145 T 340 120"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="8 6"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}

function TigerFlameAura() {
  const embers = [
    { left: '28%', top: '65%', size: 10, delay: 0.1, dur: 2.0, xOffset: 12 },
    { left: '40%', top: '70%', size: 14, delay: 0.5, dur: 1.8, xOffset: -14 },
    { left: '50%', top: '60%', size: 12, delay: 0.9, dur: 2.2, xOffset: 10 },
    { left: '62%', top: '68%', size: 15, delay: 1.3, dur: 2.0, xOffset: -12 },
    { left: '35%', top: '55%', size: 9, delay: 1.7, dur: 1.9, xOffset: 16 },
    { left: '72%', top: '62%', size: 13, delay: 0.7, dur: 2.3, xOffset: -8 },
    { left: '45%', top: '75%', size: 15, delay: 1.5, dur: 2.1, xOffset: 14 },
    { left: '58%', top: '58%', size: 10, delay: 0.3, dur: 1.7, xOffset: -10 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* 1. Core breathing plasma glow behind tiger */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: '20%',
          top: '20%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.32) 0%, rgba(234,88,12,0.18) 50%, transparent 75%)',
          filter: 'blur(26px)',
        }}
        animate={{
          scale: [0.92, 1.12, 0.92],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* 2. Rising Fiery Amber Wisps / Flame Embers */}
      {embers.map((e, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: e.left,
            top: e.top,
            width: e.size,
            height: e.size * 1.4,
            background: 'radial-gradient(circle, #fef08a 15%, #f59e0b 60%, transparent 100%)',
            boxShadow: '0 0 8px 1px #f59e0b',
          }}
          animate={{
            y: [-10, -55, -95],
            x: [0, e.xOffset, e.xOffset * 1.5],
            opacity: [0, 0.55, 0],
            scale: [0.6, 1.1, 0.4],
          }}
          transition={{
            duration: e.dur,
            repeat: Infinity,
            delay: e.delay,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* 3. Crackling Golden Lightning Tendrils */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none anim-lightning"
        viewBox="0 0 450 240"
        fill="none"
        style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' }}
      >
        <path
          d="M 330 140 Q 270 90, 220 110 T 140 85 T 70 120"
          stroke="#fde047"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="12 8"
          opacity="0.5"
        />
        <path
          d="M 290 170 Q 240 130, 190 145 T 110 120"
          stroke="#fb923c"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeDasharray="8 6"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}

export default function ResultHistory() {
  const { state } = useGame();
  const recent = state.history.slice(0, 14).reverse();

  return (
    <>
      {/* Animated dragon blue fire GIF with electric aura layer (behind top playing cards) */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          left: 360,
          top: 8,
          width: 450,
          height: 240,
          zIndex: 25,
        }}
      >
        {/* Background Electric Flame & Lightning Layer */}
        <DragonElectricAura />

        <img
          src={dragonFireGif}
          alt="Dragon Blue Fire"
          className="relative w-full h-full object-contain pointer-events-none select-none"
          style={{
            WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 50%, black 50%, transparent 92%)',
            maskImage: 'radial-gradient(ellipse 75% 70% at 50% 50%, black 50%, transparent 92%)',
            filter: 'drop-shadow(0 0 16px rgba(59,156,255,0.75))',
          }}
        />
      </div>

      {/* Animated Tiger Fire GIF with fiery aura layer (right top, above last result right side) */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          left: 1000,
          top: -48,
          width: 610,
          height: 345,
          zIndex: 25,
        }}
      >
        {/* Background Fiery Flame & Lightning Layer */}
        <TigerFlameAura />

        {/* 1. Animated Tiger Fire GIF (flames continuously run and animate) */}
        <img
          src={tigerFireGif}
          alt="Tiger Fire Animation"
          className="relative w-full h-full object-contain pointer-events-none select-none"
          style={{
            WebkitMaskImage: 'radial-gradient(ellipse 72% 66% at 50% 50%, black 50%, transparent 88%)',
            maskImage: 'radial-gradient(ellipse 72% 66% at 50% 50%, black 50%, transparent 88%)',
            filter: 'drop-shadow(0 0 12px rgba(245,158,11,0.45))',
          }}
        />

        {/* 2. Static Mouth Freeze Patch (locks the mouth in closed pose while letting all outer flames dance) */}
        <img
          src={tigerStillPng}
          alt="Tiger Mouth Freeze"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          style={{
            WebkitMaskImage: 'radial-gradient(ellipse 14% 18% at 40.2% 54.2%, black 60%, transparent 95%)',
            maskImage: 'radial-gradient(ellipse 14% 18% at 40.2% 54.2%, black 60%, transparent 95%)',
          }}
        />
      </div>

      {/* History badges & Last Result text */}
      <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 130 }}>
        {/* Pure text "Last Result" aligned with history boxes */}
      <div
        className="absolute flex items-center justify-end pointer-events-none select-none"
        style={{
          left: 374,
          top: 260,
          width: 250,
          height: 38,
        }}
      >
        <span
          className="font-display font-black tracking-wider text-[22px] whitespace-nowrap leading-none italic"
          style={{
            backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #fff7c2 22%, #ffd84a 50%, #e08c12 85%, #8a4800 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95)) drop-shadow(0 0 10px rgba(255,215,74,0.55))',
            WebkitTextStroke: '0.6px rgba(70, 25, 0, 0.8)',
          }}
        >
          Last Result
        </span>
      </div>

      {HISTORY_BOXES.map((box, idx) => {
        const item = recent[idx];
        if (!item) return null;
        const cfg = BADGE_CONFIG[item.result] || BADGE_CONFIG.dragon;
        const isLatest = idx === recent.length - 1;

        return (
          <motion.div
            key={box.id}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute flex items-center justify-center font-body font-black"
            style={{
              left: box.x - Math.floor(BADGE_W / 2),
              top: BADGE_TOP,
              width: BADGE_W,
              height: BADGE_H,
              borderRadius: 6,
              background: cfg.bg,
              color: cfg.color,
              border: `1.5px solid ${isLatest ? '#ffe27a' : cfg.border}`,
              boxShadow: isLatest
                ? '0 0 10px 2px #ffe27a, 0 2px 4px rgba(0,0,0,0.85)'
                : '0 2px 4px rgba(0,0,0,0.6)',
              lineHeight: 1,
              transformOrigin: 'center center',
            }}
          >
            {isLatest && (
              <motion.span
                className="absolute -inset-1 rounded-lg pointer-events-none"
                style={{ border: '2px solid #ffe27a', zIndex: 3 }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.08, 0.95] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}

            {/* T, D, Tie badge text */}
            <span
              className="relative select-none"
              style={{
                fontSize: item.result === 'tie' ? 11 : 16,
                zIndex: 2,
                fontWeight: 900,
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              {cfg.text}
            </span>
          </motion.div>
        );
      })}
      </div>
    </>
  );
}
