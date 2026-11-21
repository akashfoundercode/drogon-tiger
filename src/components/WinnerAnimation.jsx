import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../game/GameContext.jsx';
import { PHASES } from '../game/constants.js';
import tigerJumpGif from '../assets/winning/tiger_jump_HD_1280x720_3.4s.gif';
import dragonJumpGif from '../assets/winning/dragon_jump_winning.gif';
import { sfx } from '../game/sound.js';

// Preload heavy winning GIFs in browser memory so they play with 0ms lag
if (typeof window !== 'undefined') {
  try {
    const p1 = new Image(); p1.src = tigerJumpGif;
    const p2 = new Image(); p2.src = dragonJumpGif;
  } catch (e) {}
}

// Section 23 (Tiger Box - Right Red) Coordinates
const BOX_23_X = 1298;
const BOX_23_Y = 468;
const TIGER_GIF_LEFT = 168;
const TIGER_GIF_TOP = 40;

// Section 21 (Dragon Box - Left Blue) Coordinates
const BOX_21_X = 576;
const BOX_21_Y = 468;
// Container dimensions: width 922, height 518 (exact 16:9 ratio, same effective rendered size as Tiger)
// Positioned so the standing dragon is centered dead-center over Section 21 (x: 576)
// and lands right on the table felt (y: 586) above the bottom bar
const DRAGON_GIF_LEFT = 120;
const DRAGON_GIF_TOP = 110;
const DRAGON_GIF_WIDTH = 922;
const DRAGON_GIF_HEIGHT = 518;

// Tiger Flying Wall Shards (Fiery / Terracotta)
const TIGER_WALL_SHARDS = [
  { points: '0,0 32,-14 20,24', dx: -260, dy: -200, rot: 540, size: 1.5, color: '#4a1505' },
  { points: '0,0 -26,-22 -16,28', dx: 240, dy: -230, rot: -480, size: 1.6, color: '#ff6a00' },
  { points: '0,0 34,-8 14,32', dx: -310, dy: 150, rot: 360, size: 1.4, color: '#300a02' },
  { points: '0,0 -20,-15 -34,16', dx: 290, dy: 170, rot: -620, size: 1.7, color: '#ffa834' },
  { points: '0,0 40,-18 24,24', dx: -210, dy: -310, rot: 420, size: 1.9, color: '#5a1c07' },
  { points: '0,0 -26,-30 18,-12', dx: 200, dy: -320, rot: -500, size: 1.5, color: '#ff3700' },
  { points: '0,0 18,36 -22,18', dx: -140, dy: 330, rot: 600, size: 1.8, color: '#ffcc00' },
  { points: '0,0 -24,32 18,26', dx: 160, dy: 350, rot: -440, size: 1.6, color: '#420f04' },
  { points: '0,0 22,-26 36,-6', dx: -370, dy: -40, rot: 720, size: 1.4, color: '#ff8a1f' },
  { points: '0,0 -34,-10 -20,28', dx: 360, dy: -30, rot: -580, size: 1.7, color: '#2b0701' },
  { points: '0,0 14,-22 -10,-28', dx: -70, dy: -380, rot: 480, size: 1.3, color: '#ffd54f' },
  { points: '0,0 -18,-24 22,-26', dx: 90, dy: -370, rot: -390, size: 1.5, color: '#ff5722' },
  { points: '0,0 26,20 -12,38', dx: -90, dy: 390, rot: 510, size: 1.6, color: '#6d2109' },
  { points: '0,0 -28,14 16,40', dx: 100, dy: 400, rot: -620, size: 1.4, color: '#ff9800' },
  { points: '0,0 30,-16 12,28', dx: -220, dy: 240, rot: -360, size: 1.5, color: '#ff3d00' },
  { points: '0,0 -24,-20 -18,22', dx: 230, dy: -140, rot: 450, size: 1.3, color: '#ffe082' },
];

// Dragon Flying Wall Shards (Electric Cyan / Deep Azure / Ice Blue)
const DRAGON_WALL_SHARDS = [
  { points: '0,0 32,-14 20,24', dx: -260, dy: -200, rot: -540, size: 1.5, color: '#03254c' },
  { points: '0,0 -26,-22 -16,28', dx: 240, dy: -230, rot: 480, size: 1.6, color: '#0096c7' },
  { points: '0,0 34,-8 14,32', dx: -310, dy: 150, rot: -360, size: 1.4, color: '#011627' },
  { points: '0,0 -20,-15 -34,16', dx: 290, dy: 170, rot: 620, size: 1.7, color: '#00e5ff' },
  { points: '0,0 40,-18 24,24', dx: -210, dy: -310, rot: -420, size: 1.9, color: '#003566' },
  { points: '0,0 -26,-30 18,-12', dx: 200, dy: -320, rot: 500, size: 1.5, color: '#0077b6' },
  { points: '0,0 18,36 -22,18', dx: -140, dy: 330, rot: -600, size: 1.8, color: '#90e0ef' },
  { points: '0,0 -24,32 18,26', dx: 160, dy: 350, rot: 440, size: 1.6, color: '#023e8a' },
  { points: '0,0 22,-26 36,-6', dx: -370, dy: -40, rot: -720, size: 1.4, color: '#48cae4' },
  { points: '0,0 -34,-10 -20,28', dx: 360, dy: -30, rot: 580, size: 1.7, color: '#001219' },
  { points: '0,0 14,-22 -10,-28', dx: -70, dy: -380, rot: -480, size: 1.3, color: '#caf0f8' },
  { points: '0,0 -18,-24 22,-26', dx: 90, dy: -370, rot: 390, size: 1.5, color: '#00b4d8' },
  { points: '0,0 26,20 -12,38', dx: -90, dy: 390, rot: -510, size: 1.6, color: '#0077b6' },
  { points: '0,0 -28,14 16,40', dx: 100, dy: 400, rot: 620, size: 1.4, color: '#0096c7' },
  { points: '0,0 30,-16 12,28', dx: -220, dy: 240, rot: 360, size: 1.5, color: '#00e5ff' },
  { points: '0,0 -24,-20 -18,22', dx: 230, dy: -140, rot: -450, size: 1.3, color: '#ade8f4' },
];

export default function WinnerAnimation() {
  const { state, modal } = useGame();
  const isResult = state.phase === PHASES.RESULT;
  const rawWinner =
    state.result?.winner ||
    state.serverOutcome?.winner;

  const isTigerWin =
    isResult &&
    (rawWinner === 'tiger' || rawWinner === 'T' || rawWinner === 2 || rawWinner === '2');
  const isDragonWin =
    isResult &&
    (rawWinner === 'dragon' || rawWinner === 'D' || rawWinner === 1 || rawWinner === '1');

  useEffect(() => {
    if (isTigerWin) {
      return () => {
        sfx.stopTigerAudio();
      };
    }
    sfx.stopTigerAudio();
    return undefined;
  }, [isTigerWin, state.roundNo]);

  useEffect(() => {
    if (isDragonWin) {
      // Dragon fly sound starts, and at 2.7s roar plays
      sfx.dragonFly();
      return () => {
        sfx.stopDragonAudio();
      };
    }
    sfx.stopDragonAudio();
    return undefined;
  }, [isDragonWin, state.roundNo]);

  // Tiger fiery embers (streamlined for smooth mobile 60fps)
  const tigerEmbers = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 180 + Math.random() * 200;
      return {
        id: i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist * 0.75 - 20,
        size: 5 + Math.random() * 7,
        delay: Math.random() * 0.2,
        color: i % 3 === 0 ? '#ffea79' : i % 3 === 1 ? '#ff7a00' : '#e53935',
      };
    });
  }, [state.roundNo]);

  // Dragon electric cyan/azure embers (streamlined for smooth mobile 60fps)
  const dragonEmbers = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 180 + Math.random() * 200;
      return {
        id: i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist * 0.75 - 20,
        size: 5 + Math.random() * 7,
        delay: Math.random() * 0.2,
        color: i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#00e5ff' : '#0077ff',
      };
    });
  }, [state.roundNo]);

  if (modal) return null;

  return (
    <AnimatePresence>
      {/* ============================================================== */}
      {/* 🐯 TIGER WINNING ANIMATION (Smashing out of Section 23)        */}
      {/* ============================================================== */}
      {isTigerWin && (
        <motion.div
          key={`tiger-win-${state.roundNo}`}
          className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          style={{ zIndex: 145, transform: 'translateZ(0)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          transition={{ opacity: { duration: 0.15 } }}
        >
          {/* 1. Dramatic Flash of light from behind the wall break */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${BOX_23_X}px ${BOX_23_Y}px, rgba(255,140,20,0.65) 0%, rgba(240,40,0,0.28) 40%, transparent 70%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.45, 0] }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />

          {/* 2. Deep Broken Void / Rupture Crater inside Section 23 */}
          <div
            className="absolute pointer-events-none"
            style={{ left: BOX_23_X, top: BOX_23_Y, transform: 'translate(-50%, -50%)' }}
          >
            <motion.div
              className="rounded-[40%_60%_70%_30%/50%_40%_60%_50%]"
              style={{
                width: 320,
                height: 270,
                background: 'radial-gradient(ellipse at center, #020104 20%, #200402 60%, rgba(70,12,3,0.8) 85%, transparent 100%)',
                boxShadow: 'inset 0 0 40px #ff3b00, 0 0 60px rgba(255,70,0,0.85)',
                border: '3px solid rgba(255,140,20,0.9)',
              }}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: [0.1, 1.08, 1], opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>

          {/* 3. Violent Jagged Wall Fractures & Cracks across Section 23 */}
          <svg
            className="absolute pointer-events-none"
            style={{
              left: BOX_23_X - 280,
              top: BOX_23_Y - 240,
              width: 560,
              height: 480,
              filter: 'drop-shadow(0 0 10px #ff5100) drop-shadow(0 0 4px #ffe27a)',
            }}
            viewBox="0 0 560 480"
            fill="none"
          >
            <defs>
              <linearGradient id="tigerCrackGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff3b0" />
                <stop offset="40%" stopColor="#ff9d26" />
                <stop offset="100%" stopColor="#d82500" />
              </linearGradient>
            </defs>

            <motion.path
              d="M 280 240 L 220 180 L 170 190 L 110 130 L 60 140 L 10 90"
              stroke="url(#tigerCrackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 330 170 L 390 180 L 460 120 L 520 135 L 555 80"
              stroke="url(#tigerCrackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 340 310 L 400 330 L 470 400 L 540 420"
              stroke="url(#tigerCrackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 210 300 L 160 320 L 90 410 L 30 430"
              stroke="url(#tigerCrackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 270 140 L 295 80 L 280 15"
              stroke="url(#tigerCrackGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 290 340 L 275 410 L 285 470"
              stroke="url(#tigerCrackGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
            <motion.path
              d="M 220 180 L 240 120 M 170 190 L 180 250 M 330 170 L 320 100 M 390 180 L 420 230 M 340 310 L 310 370 M 210 300 L 240 360 M 110 130 L 80 80 M 460 120 L 490 60"
              stroke="#ffd84a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.08, duration: 0.25, ease: 'easeOut' }}
            />
          </svg>

          {/* 4. Flying Shattered Wall Shards & Debris */}
          <div className="absolute pointer-events-none" style={{ left: BOX_23_X, top: BOX_23_Y }}>
            {TIGER_WALL_SHARDS.map((shard, i) => (
              <motion.svg
                key={i}
                className="absolute"
                style={{ overflow: 'visible' }}
                initial={{ x: 0, y: 0, scale: 0.3, rotate: 0, opacity: 1 }}
                animate={{
                  x: shard.dx,
                  y: shard.dy,
                  rotate: shard.rot,
                  scale: [0.3, shard.size * 1.5, shard.size * 0.3],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1.3,
                  ease: [0.1, 0.9, 0.2, 1],
                }}
              >
                <polygon
                  points={shard.points}
                  fill={shard.color}
                  stroke="#ffe27a"
                  strokeWidth="1.5"
                  style={{
                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.85))',
                  }}
                />
              </motion.svg>
            ))}
          </div>

          {/* 5. Golden Fiery Embers & Shockwave */}
          <div className="absolute pointer-events-none" style={{ left: BOX_23_X, top: BOX_23_Y }}>
            {tigerEmbers.map((e) => (
              <motion.span
                key={e.id}
                className="absolute rounded-full"
                style={{
                  width: e.size,
                  height: e.size,
                  background: e.color,
                  boxShadow: `0 0 14px 3px ${e.color}`,
                }}
                initial={{ x: 0, y: 0, scale: 1.8, opacity: 1 }}
                animate={{ x: e.dx, y: e.dy, scale: 0.2, opacity: 0 }}
                transition={{ duration: 1.7, delay: e.delay, ease: 'easeOut' }}
              />
            ))}
          </div>

          {/* 6. HERO TIGER JUMP GIF – Leaps from Section 23 (scaled to table proportion) */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: TIGER_GIF_LEFT,
              top: TIGER_GIF_TOP,
              width: 1280,
              height: 720,
              transformOrigin: '1130px 428px',
              transform: 'translateZ(0)',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
            initial={{ opacity: 0, scale: 0.72 }}
            animate={{ opacity: 1, scale: 0.72 }}
            exit={{ opacity: 0, scale: 0.72, transition: { duration: 0.3 } }}
            transition={{ opacity: { duration: 0.15 } }}
          >
            <img
              key={`tiger-${state.roundNo}`}
              src={tigerJumpGif}
              alt="Tiger Breakthrough Winning"
              loading="eager"
              decoding="async"
              className="w-full h-full object-contain pointer-events-none select-none"
              style={{
                transform: 'translateZ(0)',
                willChange: 'transform',
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.65))',
              }}
            />
          </motion.div>

          {/* 7. "TIGER WINS" Crown Banner */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: BOX_23_X,
              top: 235,
              transform: 'translateX(-50%)',
            }}
            initial={{ y: -50, scale: 0.3, opacity: 0 }}
            animate={{ y: 0, scale: [0.3, 1.2, 1], opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ delay: 0.22, type: 'spring', stiffness: 380, damping: 18 }}
          >
            <div
              className="relative px-11 py-2.5 rounded-full flex items-center gap-3"
              style={{
                background: 'linear-gradient(180deg, rgba(85,15,3,0.96), rgba(30,4,1,0.96))',
                border: '3px solid #ff9d26',
                boxShadow: '0 0 45px rgba(255,140,20,0.9), 0 10px 25px rgba(0,0,0,0.85)',
              }}
            >
              <span
                className="font-display font-black text-[42px] tracking-widest leading-none select-none italic"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #fff0a0 22%, #ff9d26 52%, #e04400 82%, #7a1000 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.95)) drop-shadow(0 0 18px rgba(255,140,0,0.8))',
                }}
              >
                TIGER WINS
              </span>
              <div className="sheen-bar" />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ============================================================== */}
      {/* 🐲 DRAGON WINNING ANIMATION (Smashing out of Section 21)       */}
      {/* ============================================================== */}
      {isDragonWin && (
        <motion.div
          key={`dragon-win-${state.roundNo}`}
          className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          style={{ zIndex: 145, transform: 'translateZ(0)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          transition={{ opacity: { duration: 0.15 } }}
        >
          {/* 1. Dramatic Flash of electric cyan / deep blue light behind Section 21 */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${BOX_21_X}px ${BOX_21_Y}px, rgba(0,229,255,0.65) 0%, rgba(0,80,240,0.28) 40%, transparent 70%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.45, 0] }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />

          {/* 2. Deep Broken Void / Rupture Crater inside Section 21 */}
          <div
            className="absolute pointer-events-none"
            style={{ left: BOX_21_X, top: BOX_21_Y, transform: 'translate(-50%, -50%)' }}
          >
            <motion.div
              className="rounded-[50%_40%_60%_50%/40%_60%_50%_70%]"
              style={{
                width: 320,
                height: 270,
                background: 'radial-gradient(ellipse at center, #01040a 20%, #031528 60%, rgba(2,35,70,0.8) 85%, transparent 100%)',
                boxShadow: 'inset 0 0 40px #00e5ff, 0 0 60px rgba(0,180,255,0.85)',
                border: '3px solid rgba(0,229,255,0.9)',
              }}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{ scale: [0.1, 1.08, 1], opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>

          {/* 3. Violent Jagged Wall Fractures & Ice/Crystal Lightning Cracks across Section 21 */}
          <svg
            className="absolute pointer-events-none"
            style={{
              left: BOX_21_X - 280,
              top: BOX_21_Y - 240,
              width: 560,
              height: 480,
              filter: 'drop-shadow(0 0 10px #00b4d8) drop-shadow(0 0 4px #00e5ff)',
            }}
            viewBox="0 0 560 480"
            fill="none"
          >
            <defs>
              <linearGradient id="dragonCrackGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#00e5ff" />
                <stop offset="100%" stopColor="#0052cc" />
              </linearGradient>
            </defs>

            <motion.path
              d="M 280 240 L 220 180 L 170 190 L 110 130 L 60 140 L 10 90"
              stroke="url(#dragonCrackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 330 170 L 390 180 L 460 120 L 520 135 L 555 80"
              stroke="url(#dragonCrackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 340 310 L 400 330 L 470 400 L 540 420"
              stroke="url(#dragonCrackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 210 300 L 160 320 L 90 410 L 30 430"
              stroke="url(#dragonCrackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 270 140 L 295 80 L 280 15"
              stroke="url(#dragonCrackGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 290 340 L 275 410 L 285 470"
              stroke="url(#dragonCrackGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
            <motion.path
              d="M 220 180 L 240 120 M 170 190 L 180 250 M 330 170 L 320 100 M 390 180 L 420 230 M 340 310 L 310 370 M 210 300 L 240 360 M 110 130 L 80 80 M 460 120 L 490 60"
              stroke="#00e5ff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.08, duration: 0.25, ease: 'easeOut' }}
            />
          </svg>

          {/* 4. Flying Shattered Wall Shards & Cyan Debris */}
          <div className="absolute pointer-events-none" style={{ left: BOX_21_X, top: BOX_21_Y }}>
            {DRAGON_WALL_SHARDS.map((shard, i) => (
              <motion.svg
                key={i}
                className="absolute"
                style={{ overflow: 'visible' }}
                initial={{ x: 0, y: 0, scale: 0.3, rotate: 0, opacity: 1 }}
                animate={{
                  x: shard.dx,
                  y: shard.dy,
                  rotate: shard.rot,
                  scale: [0.3, shard.size * 1.5, shard.size * 0.3],
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1.3,
                  ease: [0.1, 0.9, 0.2, 1],
                }}
              >
                <polygon
                  points={shard.points}
                  fill={shard.color}
                  stroke="#00e5ff"
                  strokeWidth="1.5"
                  style={{
                    filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.85))',
                  }}
                />
              </motion.svg>
            ))}
          </div>

          {/* 5. Electric Cyan / Azure Embers & Shockwave */}
          <div className="absolute pointer-events-none" style={{ left: BOX_21_X, top: BOX_21_Y }}>
            {dragonEmbers.map((e) => (
              <motion.span
                key={e.id}
                className="absolute rounded-full"
                style={{
                  width: e.size,
                  height: e.size,
                  background: e.color,
                  boxShadow: `0 0 14px 3px ${e.color}`,
                }}
                initial={{ x: 0, y: 0, scale: 1.8, opacity: 1 }}
                animate={{ x: e.dx, y: e.dy, scale: 0.2, opacity: 0 }}
                transition={{ duration: 1.7, delay: e.delay, ease: 'easeOut' }}
              />
            ))}
          </div>

          {/* 6. HERO DRAGON FLY & WINNING ANIMATION (plays continuously without stopping) */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: DRAGON_GIF_LEFT,
              top: DRAGON_GIF_TOP,
              width: DRAGON_GIF_WIDTH,
              height: DRAGON_GIF_HEIGHT,
              transformOrigin: '50% 88%',
              transform: 'translateZ(0)',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}
            initial={{ opacity: 0, scale: 0.74 }}
            animate={{ opacity: 1, scale: 0.74 }}
            exit={{ opacity: 0, scale: 0.74, transition: { duration: 0.3 } }}
            transition={{ opacity: { duration: 0.15 } }}
          >
            <img
              key={`fly-${state.roundNo}`}
              src={dragonJumpGif}
              alt="Dragon Breakthrough Winning"
              loading="eager"
              decoding="async"
              className="w-full h-full object-contain pointer-events-none select-none"
              style={{
                transform: 'translateZ(0)',
                willChange: 'transform',
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.65))',
              }}
            />
          </motion.div>

          {/* 7. "DRAGON WINS" Crown Banner - Exactly mirrors Tiger Wins banner over Section 21 */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: BOX_21_X,
              top: 235,
              transform: 'translateX(-50%)',
            }}
            initial={{ y: -50, scale: 0.3, opacity: 0 }}
            animate={{ y: 0, scale: [0.3, 1.2, 1], opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ delay: 0.22, type: 'spring', stiffness: 380, damping: 18 }}
          >
            <div
              className="relative px-11 py-2.5 rounded-full flex items-center gap-3"
              style={{
                background: 'linear-gradient(180deg, rgba(3,25,75,0.96), rgba(1,10,35,0.96))',
                border: '3px solid #00e5ff',
                boxShadow: '0 0 45px rgba(0,229,255,0.9), 0 10px 25px rgba(0,0,0,0.85)',
              }}
            >
              <span
                className="font-display font-black text-[42px] tracking-widest leading-none select-none italic"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #b3f0ff 22%, #00e5ff 52%, #0077ff 82%, #002b80 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.95)) drop-shadow(0 0 18px rgba(0,200,255,0.8))',
                }}
              >
                DRAGON WINS
              </span>
              <div className="sheen-bar" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
