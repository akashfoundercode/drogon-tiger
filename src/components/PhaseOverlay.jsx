import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Lock, Sparkles } from 'lucide-react';
import { useGame } from '../game/GameContext.jsx';
import { PHASES } from '../game/constants.js';
import { formatINR } from '../game/format.js';
import dragonLogoGif from '../assets/gif/dragon_logo.gif';
import tigerLogoGif from '../assets/gif/tiger.gif';

/* Background Cinematic Blur Veil:
   Active during:
   1. IDLE (Dragon vs Tiger VS confrontation popup)
   2. First ~1.5s of BETTING (while "PLACE YOUR BETS" is displaying)
   3. CLOSED (while "BETS LOCKED" is displaying)
   Fades out cleanly when active betting begins and when card reveal begins!
*/
function CinematicBlurVeil() {
  const { state } = useGame();
  const showBlur =
    state.phase === PHASES.VERSUS ||
    state.phase === PHASES.IDLE ||
    state.phase === PHASES.PLACE_BETS ||
    (state.phase === PHASES.BETTING && state.timer >= 14) ||
    state.phase === PHASES.CLOSED;

  return (
    <AnimatePresence>
      {showBlur && (
        <motion.div
          key="cinematic-blur-veil"
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 150,
            background:
              state.phase === PHASES.CLOSED
                ? 'radial-gradient(circle at 50% 45%, rgba(60, 5, 12, 0.65) 0%, rgba(5, 2, 10, 0.78) 100%)'
                : 'radial-gradient(circle at 50% 45%, rgba(12, 6, 25, 0.65) 0%, rgba(5, 2, 12, 0.78) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: 'easeInOut' }}
        />
      )}
    </AnimatePresence>
  );
}

/* Dragon vs Tiger Confrontation Popup – pops up on new round start with Dragon on left, Tiger on right, and "VS" in center */
function DragonVsTigerConfrontation() {
  const { state } = useGame();
  const show = state.phase === PHASES.VERSUS || state.phase === PHASES.IDLE;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={`vs-popup-${state.roundNo}`}
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 155 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative flex items-center justify-center" style={{ width: 1400, height: 420, marginTop: 40 }}>
            {/* 1. Left: Dragon Popup (Gliding in from left) */}
            <motion.div
              className="relative flex items-center justify-end"
              style={{ width: 520, height: 320 }}
              initial={{ x: -260, opacity: 0, scale: 0.85 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -220, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            >
              <img
                src={dragonLogoGif}
                alt="Dragon Confrontation"
                className="w-full h-full object-contain pointer-events-none select-none relative"
                style={{
                  filter: 'drop-shadow(0 0 25px rgba(0, 229, 255, 0.85)) drop-shadow(0 10px 20px rgba(0,0,0,0.9))',
                  zIndex: 2,
                }}
              />
            </motion.div>

            {/* 2. Center: 3D Grand Gold/Ruby "VS" Crest (Moving ring removed) */}
            <motion.div
              className="relative flex flex-col items-center justify-center mx-4 shrink-0"
              style={{ zIndex: 10 }}
              initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
              animate={{ scale: [0.3, 1.25, 1], opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18, delay: 0.08 }}
            >
              {/* Gold/Ruby 3D Shield Crest (Static clean background, no moving circle ring) */}
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center relative select-none"
                style={{
                  background: 'radial-gradient(circle at 35% 25%, #8b1010 0%, #3d0505 65%, #180000 100%)',
                  border: '4px solid #ffd84a',
                  boxShadow: '0 0 45px rgba(255, 216, 74, 0.9), inset 0 0 16px rgba(0,0,0,0.9), 0 12px 28px rgba(0,0,0,0.9)',
                }}
              >
                <span
                  className="font-display font-black text-[56px] italic leading-none select-none tracking-tight"
                  style={{
                    backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #fff7c2 25%, #ffd84a 55%, #e08c12 85%, #8a4800 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95)) drop-shadow(0 0 14px rgba(255,215,74,0.75))',
                    WebkitTextStroke: '0.8px rgba(90, 30, 0, 0.9)',
                  }}
                >
                  VS
                </span>
              </div>

              {/* Round number badge */}
              <motion.div
                className="mt-3 px-6 py-1 rounded-full flex items-center justify-center border"
                style={{
                  background: 'linear-gradient(180deg, rgba(30,10,25,0.95), rgba(10,2,8,0.95))',
                  borderColor: 'rgba(255,216,74,0.6)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="font-display font-black text-[15px] tracking-widest text-gold-grad">
                  ROUND DT{state.roundNo}
                </span>
              </motion.div>
            </motion.div>

            {/* 3. Right: Tiger Popup (Gliding in from right) */}
            <motion.div
              className="relative flex items-center justify-start"
              style={{ width: 520, height: 320 }}
              initial={{ x: 260, opacity: 0, scale: 0.85 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 220, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            >
              <img
                src={tigerLogoGif}
                alt="Tiger Confrontation"
                className="w-full h-full object-contain pointer-events-none select-none relative"
                style={{
                  filter: 'drop-shadow(0 0 25px rgba(255, 140, 20, 0.85)) drop-shadow(0 10px 20px rgba(0,0,0,0.9))',
                  zIndex: 2,
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* "PLACE YOUR BETS" flash – shown for the 2 sec place bet pop up */
function BetsOpenFlash() {
  const { state } = useGame();
  const show =
    state.phase === PHASES.PLACE_BETS ||
    (state.phase === PHASES.BETTING && state.timer >= 14);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="open"
          className="absolute left-0 right-0 flex justify-center pointer-events-none"
          style={{ top: 380, zIndex: 155 }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.4 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
          <div
            className="relative px-16 py-3.5 rounded-full flex items-center gap-4 overflow-hidden select-none"
            style={{
              background: 'linear-gradient(180deg, rgba(110,18,55,0.98) 0%, rgba(55,8,30,0.98) 50%, rgba(20,3,15,0.98) 100%)',
              border: '3.5px solid #ffe27a',
              boxShadow:
                '0 0 50px rgba(255,190,60,0.85), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -3px 6px rgba(0,0,0,0.9), 0 12px 36px rgba(0,0,0,0.95)',
            }}
          >
            {/* Left golden diamond accent */}
            <span className="text-[#ffe27a] text-[20px] font-black select-none" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,60,0.8))' }}>◆</span>

            <span
              className="font-display font-black text-[46px] tracking-wider text-gold-grad leading-none"
              style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(255,215,60,0.6))' }}
            >
              PLACE YOUR BETS
            </span>

            {/* Right golden diamond accent */}
            <span className="text-[#ffe27a] text-[20px] font-black select-none" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,60,0.8))' }}>◆</span>

            <div className="sheen-bar" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* "LAST BETS" warning flash – shown when timer is down to last 3 seconds */
function LastBetsFlash() {
  const { state } = useGame();
  const show = state.phase === PHASES.BETTING && state.timer <= 3 && state.timer >= 1;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="last-bets"
          className="absolute left-0 right-0 flex justify-center pointer-events-none"
          style={{ top: 380, zIndex: 155 }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: [1, 1.05, 1] }}
          exit={{ opacity: 0, scale: 1.35 }}
          transition={{
            scale: { repeat: Infinity, duration: 0.65, ease: 'easeInOut' },
            opacity: { duration: 0.2 },
          }}
        >
          <div
            className="relative px-14 py-3 rounded-full flex items-center gap-3"
            style={{
              background: 'linear-gradient(180deg, rgba(160,40,10,0.96), rgba(65,12,3,0.96))',
              border: '4px solid #ff9d26',
              boxShadow: '0 0 60px rgba(255,100,20,0.85), 0 10px 30px rgba(0,0,0,0.85)',
            }}
          >
            <span
              className="font-display font-black text-[46px] tracking-wider text-gold-grad leading-none"
              style={{ filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.8))' }}
            >
              LAST BETS!
            </span>
            <div className="sheen-bar" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Premium lock slam & luxury "BETS LOCKED" badge when betting closes */
function BetsClosed() {
  const { state } = useGame();
  const show = state.phase === PHASES.CLOSED;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="closed"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 155, background: 'radial-gradient(circle at 50% 48%, rgba(120,0,0,.35), transparent 65%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center" style={{ marginTop: 60 }}>
            {/* Padlock Drop & Slam Shockwave */}
            <div className="relative" style={{ width: 120, height: 135 }}>
              <motion.span
                className="absolute left-1/2 top-[76px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: 130, height: 130, border: '4px solid #ffd84a' }}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: [0.3, 3.4], opacity: [0.95, 0] }}
                transition={{ delay: 0.28, duration: 0.8, ease: 'easeOut' }}
              />
              <svg viewBox="0 0 130 150" width="120" height="135" className="relative" style={{ filter: 'drop-shadow(0 10px 14px rgba(0,0,0,.8)) drop-shadow(0 0 24px rgba(255,200,60,.6))' }}>
                <defs>
                  <linearGradient id="lockBody" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fff3b0" />
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
                  transition={{ duration: 0.45, times: [0, 0.3, 1], ease: 'easeIn' }}
                />
                <rect x="14" y="68" width="102" height="72" rx="14" fill="url(#lockBody)" stroke="#6b4208" strokeWidth="4" />
                <circle cx="65" cy="97" r="9" fill="#5c3b06" />
                <rect x="61" y="100" width="8" height="20" rx="3" fill="#5c3b06" />
              </svg>
            </div>

            {/* Premium Gold-bordered "BETS LOCKED" Pill matching "PLACE YOUR BETS" */}
            <motion.div
              className="mt-4 relative px-14 py-3 rounded-full flex items-center gap-4"
              style={{
                background: 'linear-gradient(180deg, rgba(125,18,25,0.96), rgba(42,6,10,0.96))',
                border: '4px solid #f5c542',
                boxShadow: '0 0 60px rgba(255,60,60,0.85), 0 10px 30px rgba(0,0,0,0.85)',
              }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.08, 1], opacity: 1 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 280, damping: 16 }}
            >
              <Lock size={36} className="text-[#ffd84a] shrink-0" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.8))' }} />
              <span
                className="font-display font-black text-[46px] tracking-wider text-gold-grad leading-none"
                style={{ filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.8))' }}
              >
                BETS LOCKED
              </span>
              <div className="sheen-bar" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* "REVEALING CARDS" flash – shown when cards start dealing */
function CardsDealingFlash() {
  const { state } = useGame();
  const show = state.phase === PHASES.REVEAL && !state.reveal.dragon && !state.reveal.tiger;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="revealing"
          className="absolute left-0 right-0 flex justify-center pointer-events-none"
          style={{ top: 380, zIndex: 60 }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.4 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
          <div
            className="relative px-14 py-3 rounded-full"
            style={{
              background: 'linear-gradient(180deg, rgba(15,40,110,0.96), rgba(6,16,50,0.96))',
              border: '4px solid #38bdf8',
              boxShadow: '0 0 60px rgba(56,189,248,0.75), 0 10px 30px rgba(0,0,0,0.85)',
            }}
          >
            <span
              className="font-display font-black text-[46px] tracking-wider leading-none"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #b3f0ff 45%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.8))',
              }}
            >
              REVEALING CARDS
            </span>
            <div className="sheen-bar" />
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
  const isResult = state.phase === PHASES.RESULT;
  const r = isResult ? state.result : null;

  const rawWinner =
    r?.winner ||
    state.serverOutcome?.winner;

  const winner =
    rawWinner === 'D' || rawWinner === 'dragon' || rawWinner === 1 || rawWinner === '1'
      ? 'dragon'
      : rawWinner === 'T' || rawWinner === 'tiger' || rawWinner === 2 || rawWinner === '2'
      ? 'tiger'
      : rawWinner === 'Tie' || rawWinner === 'tie' || rawWinner === 3 || rawWinner === '3'
      ? 'tie'
      : null;

  const show = isResult && (r?.stake > 0 || winner);
  const hasBet = r && r.stake > 0;
  const won = hasBet && r.net > 0;
  const refund = hasBet && r.net <= 0 && r.payout > 0;
  const lost = hasBet && !won && !refund;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={`res${state.roundNo}`}
          className="absolute left-0 right-0 flex justify-center pointer-events-none select-none"
          style={{ top: 400, zIndex: 160 }}
          initial={{ y: 30, opacity: 0, scale: 0.85 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2, ease: 'easeIn' } }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div
            className="flex flex-col items-center rounded-3xl px-10 py-3.5"
            style={{
              background:
                winner === 'dragon'
                  ? 'linear-gradient(180deg, rgba(3,25,75,0.96), rgba(1,10,35,0.96))'
                  : winner === 'tiger'
                  ? 'linear-gradient(180deg, rgba(85,15,3,0.96), rgba(30,4,1,0.96))'
                  : 'linear-gradient(180deg, rgba(20,50,25,0.96), rgba(8,24,10,0.96))',
              border: `3px solid ${winner === 'dragon' ? '#00e5ff' : winner === 'tiger' ? '#ff9d26' : '#4ade80'}`,
              boxShadow:
                winner === 'dragon'
                  ? '0 0 50px rgba(0,229,255,0.7), 0 12px 30px rgba(0,0,0,0.85)'
                  : winner === 'tiger'
                  ? '0 0 50px rgba(255,140,20,0.7), 0 12px 30px rgba(0,0,0,0.85)'
                  : '0 0 50px rgba(74,222,128,0.7), 0 12px 30px rgba(0,0,0,0.85)',
            }}
          >
            {/* Dragon or Tiger Winner Mascot Header */}
            <div className="flex items-center gap-3 mb-1">
              {winner === 'dragon' && (
                <>
                  <img src={dragonLogoGif} alt="Dragon" className="w-12 h-12 object-contain" />
                  <span
                    className="font-display font-black text-[28px] tracking-wider italic"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #b3f0ff 30%, #00e5ff 60%, #0077ff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
                    }}
                  >
                    DRAGON WINS!
                  </span>
                </>
              )}
              {winner === 'tiger' && (
                <>
                  <img src={tigerLogoGif} alt="Tiger" className="w-12 h-12 object-contain" />
                  <span
                    className="font-display font-black text-[28px] tracking-wider italic"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #fff0a0 30%, #ff9d26 60%, #e04400 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
                    }}
                  >
                    TIGER WINS!
                  </span>
                </>
              )}
              {winner === 'tie' && (
                <>
                  <span className="text-[32px]">🤝</span>
                  <span
                    className="font-display font-black text-[28px] tracking-wider italic"
                    style={{
                      background: 'linear-gradient(180deg, #ffffff 0%, #bbf7d0 30%, #4ade80 60%, #15803d 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
                    }}
                  >
                    IT'S A TIE!
                  </span>
                </>
              )}
            </div>

            {/* Personal Bet Result (if player staked on this round) */}
            {hasBet && (
              <div className="flex flex-col items-center pt-1.5 border-t border-white/15 w-full">
                <span
                  className="font-display font-black text-[18px] tracking-[0.2em]"
                  style={{ color: won ? '#fff3b0' : refund ? '#bbf7d0' : '#ffb4b4' }}
                >
                  {won ? 'YOU WON' : refund ? 'PARTIAL REFUND' : 'BETTER LUCK NEXT TIME'}
                </span>
                {(won || refund) && (
                  <span
                    className="flex items-center gap-2 font-body font-extrabold text-[36px] leading-tight text-[#ffe27a]"
                    style={{ textShadow: '0 3px 4px rgba(0,0,0,.8)' }}
                  >
                    <Coins size={30} /> {formatINR(r.payout)}
                  </span>
                )}
                {lost && (
                  <span className="font-body font-bold text-[22px] text-white/80">
                    −{formatINR(r.stake)}
                  </span>
                )}
                {(won || refund) && (
                  <span className="font-body font-semibold text-[13px]" style={{ color: won ? '#bdf5c8' : '#ffb4b4' }}>
                    Net {won ? '+' : '−'}{formatINR(Math.abs(r.net))}
                  </span>
                )}
              </div>
            )}
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
      <CinematicBlurVeil />
      <DragonVsTigerConfrontation />
      <BetsOpenFlash />
      <LastBetsFlash />
      <BetsClosed />
      <CardsDealingFlash />
      <Celebration />
      <MyResult />
      <Toast />
    </>
  );
}
