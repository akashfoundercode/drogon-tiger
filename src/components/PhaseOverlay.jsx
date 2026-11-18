import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';
import { useGame } from '../game/GameContext.jsx';
import { PHASES } from '../game/constants.js';
import { formatINR } from '../game/format.js';

/* "PLACE YOUR BETS" flash – shown for the first ~1.4s of the betting phase */
function BetsOpenFlash() {
  const { state } = useGame();
  const show = state.phase === PHASES.BETTING && state.timer >= 14;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="open"
          className="absolute left-0 right-0 flex justify-center pointer-events-none"
          style={{ top: 380, zIndex: 60 }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.4 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
          <div
            className="relative px-14 py-3 rounded-full"
            style={{ background: 'linear-gradient(180deg,rgba(90,16,48,.95),rgba(30,6,28,.95))', border: '4px solid #f5c542', boxShadow: '0 0 60px rgba(255,190,60,.7), 0 10px 30px rgba(0,0,0,.7)' }}
          >
            <span className="font-display font-black text-[46px] tracking-wider text-gold-grad" style={{ filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.8))' }}>
              PLACE YOUR BETS
            </span>
            <div className="sheen-bar" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Premium lock slam when betting closes */
function BetsClosed() {
  const { state } = useGame();
  const show = state.phase === PHASES.CLOSED;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="closed"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 60, background: 'radial-gradient(circle at 50% 55%,rgba(120,0,0,.35),transparent 60%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center" style={{ marginTop: 130 }}>
            <div className="relative" style={{ width: 130, height: 150 }}>
              {/* shockwave */}
              <motion.span
                className="absolute left-1/2 top-[88px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: 120, height: 120, border: '4px solid #ffd84a' }}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: [0.3, 3.2], opacity: [0.9, 0] }}
                transition={{ delay: 0.35, duration: 0.8, ease: 'easeOut' }}
              />
              <svg viewBox="0 0 130 150" width="130" height="150" className="relative" style={{ filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.7)) drop-shadow(0 0 20px rgba(255,200,60,.5))' }}>
                <defs>
                  <linearGradient id="lockBody" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fff3b0" />
                    <stop offset=".5" stopColor="#f5c542" />
                    <stop offset="1" stopColor="#8a5a0a" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M32 72 V46 C32 20 98 20 98 46 V72"
                  fill="none"
                  stroke="#d9d9e6"
                  strokeWidth="14"
                  strokeLinecap="round"
                  initial={{ y: -26 }}
                  animate={{ y: [-26, -26, 0] }}
                  transition={{ duration: 0.55, times: [0, 0.4, 1], ease: 'easeIn' }}
                />
                <rect x="14" y="68" width="102" height="72" rx="14" fill="url(#lockBody)" stroke="#6b4208" strokeWidth="4" />
                <circle cx="65" cy="97" r="9" fill="#5c3b06" />
                <rect x="61" y="100" width="8" height="20" rx="3" fill="#5c3b06" />
              </svg>
            </div>
            <motion.div
              className="mt-2 font-display font-black text-[54px] tracking-widest"
              style={{ color: '#ff4a4a', textShadow: '0 0 24px rgba(255,60,60,.9), 0 4px 6px rgba(0,0,0,.9)' }}
              initial={{ scale: 2.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 14 }}
            >
              BETS CLOSED
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Sparks from the winning side */
function Celebration() {
  const { state } = useGame();
  const r = state.phase === PHASES.RESULT ? state.result : null;
  const origin = r ? (r.winner === 'dragon' ? { x: 575, y: 120 } : r.winner === 'tiger' ? { x: 1300, y: 120 } : { x: 935, y: 380 }) : null;
  const color = r ? (r.winner === 'dragon' ? ['#8ccaff', '#e6fbff', '#ffe27a'] : r.winner === 'tiger' ? ['#ffa04a', '#fff3a0', '#ffe27a'] : ['#7dffa8', '#e8ffee', '#ffe27a']) : [];
  const sparks = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2 + Math.random() * 0.4;
        const d = 120 + Math.random() * 260;
        return { dx: Math.cos(a) * d, dy: Math.sin(a) * d * 0.8 - 40, s: 5 + Math.random() * 8, delay: Math.random() * 0.25, c: i % 3 };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.roundNo, state.phase === PHASES.RESULT]
  );
  return (
    <AnimatePresence>
      {r && (
        <motion.div key={`cel${state.roundNo}`} className="absolute inset-0 pointer-events-none" style={{ zIndex: 55 }} initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="absolute rounded-full"
            style={{ left: origin.x - 260, top: origin.y - 200, width: 520, height: 400, background: `radial-gradient(circle,${color[0]}88,transparent 65%)` }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0, 1, 0.5], scale: [0.4, 1.2, 1] }}
            transition={{ duration: 1.4 }}
          />
          {sparks.map((s, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{ left: origin.x, top: origin.y, width: s.s, height: s.s, background: color[s.c], boxShadow: `0 0 10px 2px ${color[s.c]}` }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: s.dx, y: s.dy + 140, opacity: 0, scale: 0.3 }}
              transition={{ duration: 1.5, delay: s.delay, ease: 'easeOut' }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Personal result popup */
function MyResult() {
  const { state } = useGame();
  const r = state.phase === PHASES.RESULT ? state.result : null;
  const show = r && r.stake > 0;
  const won = r && r.net > 0;
  const refund = r && r.net <= 0 && r.payout > 0;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={`res${state.roundNo}`}
          className="absolute left-0 right-0 flex justify-center pointer-events-none"
          style={{ top: 430, zIndex: 65 }}
          initial={{ y: 40, opacity: 0, scale: 0.6 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 240, damping: 16 }}
        >
          <div
            className="flex flex-col items-center rounded-3xl px-12 py-4"
            style={{
              background: won ? 'linear-gradient(180deg,rgba(120,70,0,.95),rgba(50,24,0,.95))' : 'linear-gradient(180deg,rgba(40,20,50,.95),rgba(16,8,24,.95))',
              border: `4px solid ${won ? '#ffd84a' : '#8a7aa8'}`,
              boxShadow: won ? '0 0 60px rgba(255,200,60,.8), 0 12px 30px rgba(0,0,0,.7)' : '0 12px 30px rgba(0,0,0,.7)',
            }}
          >
            <span className="font-display font-black text-[22px] tracking-[0.25em]" style={{ color: won ? '#fff3b0' : '#c9bde6' }}>
              {won ? 'YOU WON' : r.winner === 'tie' && refund ? 'PARTIAL REFUND' : refund ? 'PAYOUT' : 'BETTER LUCK NEXT TIME'}
            </span>
            {(won || refund) && (
              <span className="flex items-center gap-3 font-body font-extrabold text-[44px] leading-tight text-[#ffe27a]" style={{ textShadow: '0 3px 4px rgba(0,0,0,.8)' }}>
                <Coins size={38} /> {formatINR(r.payout)}
              </span>
            )}
            {!won && !refund && <span className="font-body font-bold text-[26px] text-white/80">−{formatINR(r.stake)}</span>}
            {(won || refund) && <span className="font-body font-semibold text-[14px]" style={{ color: won ? '#bdf5c8' : '#ffb4b4' }}>Net {won ? '+' : '−'}{formatINR(Math.abs(r.net))}</span>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toast() {
  const { state } = useGame();
  const t = state.toast;
  return (
    <AnimatePresence>
      {t && (
        <motion.div
          key={t.id}
          className="absolute left-0 right-0 flex justify-center pointer-events-none"
          style={{ top: 650, zIndex: 100 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
        >
          <div
            className="rounded-full px-6 py-2 font-body font-bold text-[16px] text-white"
            style={{ background: t.kind === 'error' ? 'rgba(160,20,20,.95)' : 'rgba(30,14,40,.95)', border: `2px solid ${t.kind === 'error' ? '#ff6a6a' : '#f5c542'}`, boxShadow: '0 6px 16px rgba(0,0,0,.6)' }}
          >
            {t.msg}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function PhaseOverlay() {
  return (
    <>
      <BetsOpenFlash />
      <BetsClosed />
      <Celebration />
      <MyResult />
      <Toast />
    </>
  );
}
