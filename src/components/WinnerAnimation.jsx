import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../game/GameContext.jsx';
import { PHASES } from '../game/constants.js';
import tigerJumpGif from '../assets/winning/tiger_jump_HD_1280x720_3.4s.gif';

// Section 23 (Tiger Box) Breakthrough Center Coordinates
const BOX_23_X = 1298;
const BOX_23_Y = 468;

// Exact container offsets so the GIF's internal tiger (at frame 1: x=981..1280, y=233..625)
// aligns 100% dead-center inside the Right Red Box (Section 23: x=1126..1469, y=326..610)
const TIGER_GIF_LEFT = 168;
const TIGER_GIF_TOP = 40;

// Jagged flying debris shards from the smashed wall/background
const WALL_SHARDS = [
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

export default function WinnerAnimation() {
  const { state } = useGame();
  const isResult = state.phase === PHASES.RESULT;
  const winner = state.result?.winner;
  const isTigerWin = isResult && winner === 'tiger';

  // Explosive fiery embers blasting outward
  const embers = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => {
      const angle = (i / 36) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = 220 + Math.random() * 280;
      return {
        id: i,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist * 0.75 - 30,
        size: 5 + Math.random() * 11,
        delay: Math.random() * 0.25,
        color: i % 3 === 0 ? '#ffea79' : i % 3 === 1 ? '#ff7a00' : '#e53935',
      };
    });
  }, [state.roundNo]);

  return (
    <AnimatePresence>
      {isTigerWin && (
        <motion.div
          key={`tiger-win-${state.roundNo}`}
          className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          style={{ zIndex: 145 }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            x: [0, -9, 9, -6, 6, -3, 0],
            y: [0, 7, -7, 4, -4, 2, 0],
          }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          transition={{
            opacity: { duration: 0.2 },
            x: { duration: 0.42, ease: 'easeOut' },
            y: { duration: 0.42, ease: 'easeOut' },
          }}
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

          {/* 2. Deep Broken Void / Rupture Crater inside the background */}
          <div
            className="absolute pointer-events-none"
            style={{ left: BOX_23_X, top: BOX_23_Y, transform: 'translate(-50%, -50%)' }}
          >
            {/* The dark fiery abyss hole broken through the wall */}
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

          {/* 3. Violent Jagged Wall Fractures & Glass/Stone Cracks Spreading Across Section 23 */}
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
              <linearGradient id="crackGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff3b0" />
                <stop offset="40%" stopColor="#ff9d26" />
                <stop offset="100%" stopColor="#d82500" />
              </linearGradient>
            </defs>

            {/* Main Primary Deep Fissures exploding from center (280, 240) */}
            <motion.path
              d="M 280 240 L 220 180 L 170 190 L 110 130 L 60 140 L 10 90"
              stroke="url(#crackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 330 170 L 390 180 L 460 120 L 520 135 L 555 80"
              stroke="url(#crackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 340 310 L 400 330 L 470 400 L 540 420"
              stroke="url(#crackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 210 300 L 160 320 L 90 410 L 30 430"
              stroke="url(#crackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 270 140 L 295 80 L 280 15"
              stroke="url(#crackGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
            <motion.path
              d="M 280 240 L 290 340 L 275 410 L 285 470"
              stroke="url(#crackGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />

            {/* Secondary Webbing Branch Cracks */}
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

          {/* 4. Flying Shattered Wall Shards & Debris bursting out into foreground */}
          <div
            className="absolute pointer-events-none"
            style={{ left: BOX_23_X, top: BOX_23_Y }}
          >
            {WALL_SHARDS.map((shard, i) => (
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
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.9)) drop-shadow(0 0 6px rgba(255,100,0,0.8))',
                  }}
                />
              </motion.svg>
            ))}
          </div>

          {/* 5. Golden Fiery Embers & Shockwave Blast */}
          <div
            className="absolute pointer-events-none"
            style={{ left: BOX_23_X, top: BOX_23_Y }}
          >
            {embers.map((e) => (
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

          {/* 6. HERO TIGER JUMP GIF – Starts inside Section 23 and leaps across */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: TIGER_GIF_LEFT,
              top: TIGER_GIF_TOP,
              width: 1280,
              height: 720,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ duration: 0.15 }}
          >
            <img
              src={`${tigerJumpGif}?round=${state.roundNo}`}
              alt="Tiger Breakthrough Winning"
              className="w-full h-full object-contain pointer-events-none select-none"
              style={{
                filter: 'drop-shadow(0 0 35px rgba(255,140,20,0.85)) drop-shadow(0 16px 30px rgba(0,0,0,0.95))',
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
    </AnimatePresence>
  );
}
