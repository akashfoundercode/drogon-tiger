import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Users, Crown } from 'lucide-react';
import Chip from './Chip.jsx';
import { useGame } from '../game/GameContext.jsx';
import { PHASES } from '../game/constants.js';
import { PILE_CFG, CHIP_SIZE } from '../game/pile.js';
import { formatCompact, formatINR } from '../game/format.js';
import tigerGif from '../assets/gif/tiger.gif';
import dragonLogoGif from '../assets/gif/dragon_logo.gif';
import dragonFireGif from '../assets/gif/dragon_blue_fire_transparent.gif';

const THEMES = {
  dragon: {
    w: 343,
    h: 284,
    glow: '#3b9cff',
    title: 'linear-gradient(180deg,#f2fcff,#7fd2ff 55%,#2f86ff)',
    pill: 'rgba(4,14,62,.75)',
    pillBorder: '#4aa3ff',
    mult: '1:1',
  },
  tie: {
    w: 334,
    h: 284,
    glow: '#2ee66a',
    title: 'linear-gradient(180deg,#fff7c2,#f5c542 55%,#b8801a)',
    pill: 'rgba(3,40,18,.75)',
    pillBorder: '#4ade80',
    mult: '8:1',
  },
  tiger: {
    w: 343,
    h: 284,
    glow: '#ff6a1a',
    title: 'linear-gradient(180deg,#fff3b0,#ffa31a 55%,#e3350d)',
    pill: 'rgba(62,4,4,.75)',
    pillBorder: '#ff8a3d',
    mult: '1:1',
  },
};

const TITLES = { dragon: 'DRAGON', tie: 'TIE', tiger: 'TIGER' };

const PileChip = memo(function PileChip({ chip }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: chip.x, top: chip.y, zIndex: Math.round(chip.y), width: CHIP_SIZE, height: CHIP_SIZE }}
      initial={{ scale: 1.35, rotate: chip.rot }}
      animate={{ scale: 1, rotate: chip.rot }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 14 }}
    >
      <motion.span
        className="absolute rounded-full"
        style={{ inset: -2, border: '2px solid rgba(255,255,255,.8)' }}
        initial={{ scale: 0.7, opacity: 0.9 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <Chip
        value={chip.value}
        size={CHIP_SIZE}
        style={chip.mine ? { boxShadow: '0 0 0 2px #ffe27a, 0 0 8px rgba(255,226,122,0.85)' } : undefined}
      />
    </motion.div>
  );
});

function Laurel({ flip }) {
  return (
    <svg viewBox="0 0 60 70" width="46" height="54" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <g fill="#f5c542" stroke="#7a4c06" strokeWidth="1">
        <path d="M44 62 C20 56 8 38 10 12 C24 20 34 34 44 62Z" />
        <path d="M42 50 C28 44 18 32 18 18 C30 24 38 34 42 50Z" opacity=".9" />
        <path d="M36 36 C28 34 22 26 22 18 C30 20 34 28 36 36Z" opacity=".8" />
      </g>
    </svg>
  );
}

function BetPanel({ side }) {
  const { state, actions } = useGame();
  const th = THEMES[side];
  const open = state.phase === PHASES.BETTING || state.phase === PHASES.PLACE_BETS;
  const showResult = state.phase === PHASES.RESULT && state.result;
  const winner = showResult && state.result.winner === side;
  const loser = showResult && state.result.winner !== side;
  const frozen = !open && !showResult;
  const mine = state.bets[side];
  const pileCfg = PILE_CFG[side];
  const pile = state.piles[side];

  const click = () => actions.placeBet(side);

  return (
    <motion.div
      role="button"
      tabIndex={open ? 0 : -1}
      aria-label={`Bet on ${TITLES[side]}`}
      aria-disabled={!open}
      data-panel={side}
      onClick={click}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          click();
        }
      }}
      className="relative rounded-[28px] outline-none shrink-0"
      style={{
        width: th.w,
        height: th.h,
        background: 'transparent',
        cursor: open ? 'pointer' : 'not-allowed',
      }}
      animate={{
        boxShadow: winner
          ? [
              `0 0 35px 8px ${th.glow}cc, 0 0 0 3px #ffe27a`,
              `0 0 75px 22px #ffd84a, 0 0 0 4px #fff3b0`,
              `0 0 35px 8px ${th.glow}cc, 0 0 0 3px #ffe27a`,
            ]
          : open
            ? `0 0 16px ${th.glow}55`
            : 'none',
        scale: winner ? [1, 1.03, 1] : 1,
        filter: loser ? 'saturate(.4) brightness(.6)' : 'saturate(1) brightness(1)',
      }}
      transition={{ duration: winner ? 1.2 : 0.4, repeat: winner ? Infinity : 0 }}
      whileHover={open ? { scale: 1.015 } : undefined}
      whileTap={open ? { scale: 0.985 } : undefined}
    >
      <div className="relative w-full h-full rounded-[26px]">
        {/* header */}
        <div className="absolute left-0 right-0 top-0 flex flex-col items-center pt-1 z-10">
          {side === 'tie' ? (
            <div className="flex flex-col items-center" style={{ marginTop: 10 }}>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-[34px] leading-none tracking-wider" style={{ backgroundImage: th.title, WebkitBackgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.8))' }}>
                  TIE
                </span>
                <span className="rounded px-1.5 py-0.5 text-[11px] font-body font-black" style={{ background: 'linear-gradient(180deg,#fff1a8,#e0a912)', color: '#4a2d00' }}>
                  {th.mult}
                </span>
              </div>
              <span className="text-[10px] font-body font-semibold text-white/70 -mt-0.5">Tie returns 50% on D/T</span>
            </div>
          ) : side === 'dragon' ? (
            <div className="flex items-center gap-2 -mt-4">
              <img
                src={dragonLogoGif}
                alt="Dragon"
                className="h-[88px] object-contain pointer-events-none select-none"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(59,156,255,0.85))',
                }}
              />
              <span className="rounded px-1.5 py-0.5 text-[11px] font-body font-black self-center" style={{ background: 'linear-gradient(180deg,#fff1a8,#e0a912)', color: '#4a2d00' }}>
                {th.mult}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 -mt-4">
              <img
                src={tigerGif}
                alt="Tiger"
                className="h-[88px] object-contain pointer-events-none select-none"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(255,106,26,0.85))',
                }}
              />
              <span className="rounded px-1.5 py-0.5 text-[11px] font-body font-black self-center" style={{ background: 'linear-gradient(180deg,#fff1a8,#e0a912)', color: '#4a2d00' }}>
                {th.mult}
              </span>
            </div>
          )}
        </div>

        {/* total + players */}
        <div
          className="absolute left-4 right-4 flex items-center justify-between rounded-full px-3.5 h-[32px] z-10"
          style={{ top: side === 'tie' ? 62 : 66, background: th.pill, border: `1.5px solid ${th.pillBorder}`, boxShadow: `0 0 10px ${th.glow}66, inset 0 2px 5px rgba(0,0,0,.6)` }}
        >
          <motion.span
            key={state.totals[side]}
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="font-body font-extrabold text-[20px] text-white leading-none"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,.7)' }}
          >
            {formatCompact(state.totals[side])}
          </motion.span>
          <span className="flex items-center gap-1.5 text-white/90 font-body font-semibold text-[13.5px]">
            <Users size={15} className="opacity-80" />
            {state.players[side]}
          </span>
        </div>

        {/* my bet tag (reserved row so layout never jumps) */}
        <div className="absolute left-0 right-0 flex justify-center" style={{ top: side === 'tie' ? 96 : 98, height: 24 }}>
          <AnimatePresence>
            {mine > 0 && (
              <motion.div
                key="mine"
                initial={{ opacity: 0, y: -4, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 rounded-full px-2.5 h-[22px] text-[11.5px] font-body font-bold"
                style={{ background: 'linear-gradient(180deg,#fff1a8,#e0a912)', color: '#4a2d00', boxShadow: '0 2px 6px rgba(0,0,0,.5)' }}
              >
                YOUR BET
                <span className="font-extrabold">{formatINR(mine)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* chip pile – fixed area, chips land into individual slots */}
        <div
          data-pile={side}
          className="absolute"
          style={{ left: '50%', marginLeft: -pileCfg.w / 2, bottom: 70, width: pileCfg.w, height: pileCfg.h }}
        >
          <AnimatePresence>
            {pile.map((c) => (
              <PileChip key={c.id} chip={c} />
            ))}
          </AnimatePresence>
        </div>

        {/* freeze overlay */}
        <AnimatePresence>
          {frozen && (
            <motion.div
              key="frozen"
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.38))' }}
            >
              <motion.div
                className="absolute right-4 top-3 rounded-full p-1.5"
                style={{ background: 'rgba(0,0,0,.55)', border: '1.5px solid #f5c542' }}
                initial={{ scale: 2, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
              >
                <Lock size={16} color="#f5c542" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* winner shine */}
        {winner && <div className="sheen-bar" />}
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div
            className="absolute left-1/2 -top-4 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full px-4 py-1 font-display font-black text-[15px] tracking-widest"
            initial={{ y: 14, opacity: 0, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            style={{ background: 'linear-gradient(180deg,#fff1a8,#e0a912)', color: '#4a2d00', border: '2px solid #7a4c06', boxShadow: '0 4px 12px rgba(0,0,0,.6), 0 0 18px #ffd84a' }}
          >
            <Crown size={16} /> WINNER
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default BetPanel;
