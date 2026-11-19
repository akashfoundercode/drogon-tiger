import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useGame } from '../game/GameContext.jsx';
import { PHASES, TIMING } from '../game/constants.js';

function Laurel({ flip }) {
  return (
    <svg viewBox="0 0 60 70" width="34" height="42" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <g fill="#f5c542" stroke="#7a4c06" strokeWidth="1">
        <path d="M44 62 C20 56 8 38 10 12 C24 20 34 34 44 62Z" />
        <path d="M42 50 C28 44 18 32 18 18 C30 24 38 34 42 50Z" opacity=".9" />
      </g>
    </svg>
  );
}

function TimerRing({ timer }) {
  const total = TIMING.betting;
  const frac = Math.max(0, timer / total);
  const r = 23;
  const c = 2 * Math.PI * r;
  const danger = timer <= 5;
  const critical = timer <= 3;

  return (
    <motion.div
      className="absolute flex items-center justify-center select-none"
      style={{
        right: 18,
        top: '50%',
        width: 46,
        height: 46,
        marginTop: -23,
        zIndex: 30,
      }}
      animate={
        critical
          ? { scale: [1, 1.12, 1] }
          : danger
            ? { scale: [1, 1.06, 1] }
            : { scale: 1 }
      }
      transition={{ duration: critical ? 0.45 : 0.65, repeat: danger ? Infinity : 0 }}
    >
      {/* Outer pulsing energy shockwave when in danger countdown */}
      {danger && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{ scale: [1, 1.35], opacity: [0.85, 0] }}
          transition={{ duration: 0.75, repeat: Infinity, ease: 'easeOut' }}
          style={{
            border: critical ? '2.5px solid #ff2222' : '2px solid #ff5555',
            boxShadow: critical
              ? '0 0 18px 4px rgba(255,0,0,0.85)'
              : '0 0 12px 2px rgba(255,60,60,0.65)',
          }}
        />
      )}

      <svg width="46" height="46" viewBox="0 0 64 64" className="absolute overflow-visible">
        <defs>
          {/* 3D Metallic Gold Rim Gradient */}
          <linearGradient id="timerGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#ffe680" />
            <stop offset="60%" stopColor="#f5b81c" />
            <stop offset="85%" stopColor="#b36e05" />
            <stop offset="100%" stopColor="#4a2600" />
          </linearGradient>

          {/* 3D Crimson Danger Rim Gradient */}
          <linearGradient id="timerDangerRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#ff8080" />
            <stop offset="65%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#550505" />
          </linearGradient>

          {/* Liquid Gold Progress Arc */}
          <linearGradient id="timerTrackGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#ffea75" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Fiery Red Danger Arc */}
          <linearGradient id="timerTrackRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#ff6b6b" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>

          {/* Inner Ruby-Enamel Jewel Background */}
          <radialGradient id="timerInnerPlate" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor={danger ? '#5a0a14' : '#380a18'} />
            <stop offset="65%" stopColor={danger ? '#260206' : '#180208'} />
            <stop offset="100%" stopColor="#080002" />
          </radialGradient>
        </defs>

        {/* 1. Medallion Outer Shadow & Body */}
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="url(#timerInnerPlate)"
          stroke={danger ? 'url(#timerDangerRim)' : 'url(#timerGoldRim)'}
          strokeWidth="3.2"
          style={{
            filter: danger
              ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.95)) drop-shadow(0 0 14px rgba(255,30,30,0.7))'
              : 'drop-shadow(0 4px 10px rgba(0,0,0,0.95)) drop-shadow(0 0 12px rgba(245,184,28,0.5))',
          }}
        />

        {/* 2. Inset Inner Border Ring */}
        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="1" />

        {/* 3. Subtle Background Arc Track */}
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={danger ? 'rgba(255,80,80,0.18)' : 'rgba(255,215,80,0.18)'}
          strokeWidth="4.8"
        />

        {/* 4. Active Countdown Energy Arc */}
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={danger ? 'url(#timerTrackRed)' : 'url(#timerTrackGold)'}
          strokeWidth="4.8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform="rotate(-90 32 32)"
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
            filter: danger
              ? 'drop-shadow(0 0 6px #ff3b3b) drop-shadow(0 0 12px rgba(255,0,0,0.8))'
              : 'drop-shadow(0 0 6px #ffd94a) drop-shadow(0 0 10px rgba(255,180,20,0.75))',
          }}
        />

        {/* 5. 4 Luxury Chronometer Jewel Pips (12, 3, 6, 9 o'clock) */}
        <circle cx="32" cy="7" r="1.5" fill="#ffe27a" />
        <circle cx="57" cy="32" r="1.5" fill="#ffe27a" />
        <circle cx="32" cy="57" r="1.5" fill="#ffe27a" />
        <circle cx="7" cy="32" r="1.5" fill="#ffe27a" />
      </svg>

      {/* 6. Dynamic Scaling 3D Number Digit */}
      <motion.span
        key={timer}
        initial={{ scale: 1.25, opacity: 0.85 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 25 }}
        className="relative font-display font-black text-[19px] leading-none select-none"
        style={{
          color: danger ? '#ff9999' : '#fff5b8',
          textShadow: danger
            ? '0 2px 4px rgba(0,0,0,0.95), 0 0 10px rgba(255,30,30,0.9), 0 0 18px rgba(255,0,0,0.6)'
            : '0 2px 4px rgba(0,0,0,0.95), 0 0 10px rgba(255,215,60,0.9), 0 0 16px rgba(255,160,20,0.5)',
        }}
      >
        {timer}
      </motion.span>
    </motion.div>
  );
}

export default function StatusBanner() {
  const { state } = useGame();
  const { phase, timer, result, reveal, roundNo } = state;

  let text = '';
  let sub = '';
  let icon = null;
  let tone = 'normal';
  if (phase === PHASES.IDLE) {
    text = 'GET READY';
    sub = `Round DT${roundNo} is about to begin`;
  } else if (phase === PHASES.BETTING) {
    text = timer <= 3 ? 'LAST BETS!' : 'PLACE YOUR BETS';
    sub = `Round DT${roundNo}`;
  } else if (phase === PHASES.CLOSED) {
    text = 'BETS LOCKED';
    icon = <Lock size={22} color="#ffd84a" />;
    tone = 'closed';
  } else if (phase === PHASES.REVEAL) {
    text = reveal.dragon && reveal.tiger ? 'COMPARING CARDS…' : 'REVEALING CARDS…';
  } else if (phase === PHASES.RESULT && result) {
    tone = 'result';
    if (result.winner === 'dragon') {
      text = 'Dragon Wins!';
      icon = <span className="text-[26px]">🐲</span>;
    } else if (result.winner === 'tiger') {
      text = 'Tiger Wins!';
      icon = <span className="text-[26px]">🐯</span>;
    } else {
      text = "It's a Tie!";
      icon = <span className="text-[26px]">🤝</span>;
    }
  }

  const bg =
    tone === 'closed'
      ? 'linear-gradient(180deg,#7a1010,#3a0505)'
      : tone === 'result'
        ? 'linear-gradient(180deg,#7a1a2a,#2c0a22)'
        : 'linear-gradient(180deg,#5a1030,#240a24)';

  return (
    <div className="absolute flex items-center justify-center pointer-events-none select-none" style={{ left: 755, width: 380, top: 198, height: 36, zIndex: 25 }}>
      <div
        className="relative flex flex-col items-center justify-center w-full h-full"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={text}
            className={`flex flex-col items-center leading-none ${phase === PHASES.BETTING ? '-translate-x-10' : ''}`}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2">
              {icon}
              <span
                className="font-display font-black tracking-wider"
                style={{
                  fontSize: tone === 'result' ? 24 : 20,
                  backgroundImage: 'linear-gradient(180deg,#fff7c2,#ffc933 55%,#e0870f)',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.9))',
                }}
              >
                {text}
              </span>
            </div>
            {sub && <span className="text-[10px] font-body font-semibold text-white/75 mt-0.5 tracking-wider">{sub}</span>}
          </motion.div>
        </AnimatePresence>
        {phase === PHASES.BETTING && <TimerRing timer={timer} />}
      </div>
    </div>
  );
}
