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
  const r = 21;
  const c = 2 * Math.PI * r;
  const danger = timer <= 5;
  const color = danger ? '#ff4a4a' : '#ffd84a';
  return (
    <motion.div
      className="absolute flex items-center justify-center"
      style={{ left: -16, top: '50%', width: 44, height: 44, marginTop: -22 }}
      animate={danger ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={{ duration: 0.6, repeat: danger ? Infinity : 0 }}
    >
      <svg width="44" height="44" viewBox="0 0 54 54" className="absolute">
        <circle cx="27" cy="27" r="25" fill="#2a0808" stroke="#f5c542" strokeWidth="2.5" />
        <circle cx="27" cy="27" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="4.5" />
        <circle
          cx="27"
          cy="27"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform="rotate(-90 27 27)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s', filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <span className="relative font-body font-extrabold text-[18px] leading-none" style={{ color }}>
        {timer}
      </span>
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
    text = 'PLACE YOUR BETS';
    sub = `Round DT${roundNo}`;
  } else if (phase === PHASES.CLOSED) {
    text = 'BETS CLOSED';
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
            className="flex flex-col items-center leading-none"
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
