import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useGame } from '../game/GameContext.jsx';
import { sfx } from '../game/sound.js';
import { PAYOUT_MULT, TIE_REFUND_RATE } from '../game/constants.js';
import { formatINR } from '../game/format.js';

function Modal({ title, onClose, children, width = 560 }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 160, background: 'rgba(5,2,12,.78)', backdropFilter: 'blur(5px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="relative rounded-3xl p-[4px]"
        style={{
          width,
          maxWidth: '96vw',
          background: 'linear-gradient(160deg,#fff1a8,#b8801a 45%,#5c3b06)',
          boxShadow: '0 20px 60px rgba(0,0,0,.85), 0 0 40px rgba(245,197,66,.35)',
        }}
      >
        <div
          className="rounded-[20px] p-6 max-h-[85vh] overflow-y-auto"
          style={{ background: 'linear-gradient(180deg,#240817,#0f030d)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-black text-[26px] text-gold-grad tracking-wider">{title}</h2>
            <button
              aria-label="Close"
              onClick={onClose}
              className="rounded-full p-1.5 transition-transform hover:scale-110 active:scale-90"
              style={{ background: 'rgba(255,255,255,.08)' }}
            >
              <X size={22} color="#ffe27a" />
            </button>
          </div>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

const BEAD_CFG = {
  dragon: {
    bg: 'radial-gradient(circle at 35% 30%, #38bdf8, #1d4ed8)',
    border: '#93c5fd',
    text: 'D',
    label: 'DRAGON',
    color: '#ffffff',
    glow: 'rgba(56,189,248,0.45)',
  },
  tiger: {
    bg: 'radial-gradient(circle at 35% 30%, #fbbf24, #d97706)',
    border: '#fde68a',
    text: 'T',
    label: 'TIGER',
    color: '#ffffff',
    glow: 'rgba(245,158,11,0.45)',
  },
  tie: {
    bg: 'radial-gradient(circle at 35% 30%, #4ade80, #15803d)',
    border: '#bbf7d0',
    text: 'Tie',
    label: 'TIE',
    color: '#ffffff',
    glow: 'rgba(34,197,94,0.45)',
  },
};

export function StatsModal({ onClose }) {
  const { state } = useGame();
  const h = state.history || [];
  const total = h.length;

  const count = (k) => h.filter((x) => x.result === k).length;
  const dCount = count('dragon');
  const tCount = count('tiger');
  const tieCount = count('tie');

  const dPct = total ? Math.round((dCount / total) * 100) : 0;
  const tPct = total ? Math.round((tCount / total) * 100) : 0;
  const tiePct = total ? Math.max(0, 100 - dPct - tPct) : 0;

  // Chronological order (oldest to newest) for bead plate
  const chronological = React.useMemo(() => [...h].reverse(), [h]);
  const latestRoundNo = h[0]?.roundNo;

  const [hovered, setHovered] = React.useState(null);
  const activeItem = hovered || h[0] || null;

  // 120 cells: 20 columns × 6 rows in column-major order
  const cells = React.useMemo(() => {
    const list = [];
    for (let c = 0; c < 20; c++) {
      for (let r = 0; r < 6; r++) {
        const idx = c * 6 + r;
        const item = chronological[idx] || null;
        list.push({ col: c + 1, row: r + 1, idx, item });
      }
    }
    return list;
  }, [chronological]);

  return (
    <Modal title="120 ROUNDS ROADMAP & HISTORY" onClose={onClose} width={920}>
      {/* Top summary row: Dragon / Tie / Tiger stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Dragon Card */}
        <div
          className="rounded-xl px-4 py-2.5 flex items-center justify-between border"
          style={{
            background: 'linear-gradient(135deg, rgba(30,58,138,0.45), rgba(15,23,42,0.6))',
            borderColor: 'rgba(96,165,250,0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm text-white"
              style={{ background: BEAD_CFG.dragon.bg, border: `1.5px solid ${BEAD_CFG.dragon.border}` }}
            >
              D
            </span>
            <span className="font-display font-extrabold text-[15px] text-[#93c5fd]">DRAGON</span>
          </div>
          <div className="text-right">
            <span className="font-display font-black text-[20px] text-white">{dCount}</span>
            <span className="font-body text-xs text-white/60 ml-1.5">({dPct}%)</span>
          </div>
        </div>

        {/* Tie Card */}
        <div
          className="rounded-xl px-4 py-2.5 flex items-center justify-between border"
          style={{
            background: 'linear-gradient(135deg, rgba(20,83,45,0.45), rgba(15,23,42,0.6))',
            borderColor: 'rgba(74,222,128,0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white"
              style={{ background: BEAD_CFG.tie.bg, border: `1.5px solid ${BEAD_CFG.tie.border}` }}
            >
              Tie
            </span>
            <span className="font-display font-extrabold text-[15px] text-[#86efac]">TIE</span>
          </div>
          <div className="text-right">
            <span className="font-display font-black text-[20px] text-white">{tieCount}</span>
            <span className="font-body text-xs text-white/60 ml-1.5">({tiePct}%)</span>
          </div>
        </div>

        {/* Tiger Card */}
        <div
          className="rounded-xl px-4 py-2.5 flex items-center justify-between border"
          style={{
            background: 'linear-gradient(135deg, rgba(120,53,15,0.45), rgba(15,23,42,0.6))',
            borderColor: 'rgba(251,191,36,0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm text-white"
              style={{ background: BEAD_CFG.tiger.bg, border: `1.5px solid ${BEAD_CFG.tiger.border}` }}
            >
              T
            </span>
            <span className="font-display font-extrabold text-[15px] text-[#fde047]">TIGER</span>
          </div>
          <div className="text-right">
            <span className="font-display font-black text-[20px] text-white">{tCount}</span>
            <span className="font-body text-xs text-white/60 ml-1.5">({tPct}%)</span>
          </div>
        </div>
      </div>

      {/* Proportional ratio bar */}
      <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden flex mb-4 border border-white/10">
        <div style={{ width: `${dPct}%`, background: '#3b82f6' }} title={`Dragon ${dPct}%`} />
        <div style={{ width: `${tiePct}%`, background: '#22c55e' }} title={`Tie ${tiePct}%`} />
        <div style={{ width: `${tPct}%`, background: '#f59e0b' }} title={`Tiger ${tPct}%`} />
      </div>

      {/* 120 Beads Roadmap Plate (Standard Casino 20 Columns × 6 Rows) */}
      <div
        className="rounded-2xl p-4 border relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #180512 0%, #0c0209 100%)',
          borderColor: 'rgba(245,197,66,0.25)',
          boxShadow: 'inset 0 4px 16px rgba(0,0,0,0.8)',
        }}
      >
        <div className="flex items-center justify-between text-xs text-white/50 mb-2 px-1 font-body">
          <span className="font-semibold text-gold-grad tracking-wider">BEAD ROAD (120 ROUNDS)</span>
          <span>Columns 1 – 20 • Standard 6-Row Bead Plate</span>
        </div>

        {/* The 20x6 Grid */}
        <div
          className="grid grid-rows-6 grid-flow-col gap-1.5 justify-center"
          style={{ width: '100%', overflowX: 'auto' }}
        >
          {cells.map(({ col, row, idx, item }) => {
            if (!item) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="w-8 h-8 rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center select-none"
                >
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                </div>
              );
            }

            const cfg = BEAD_CFG[item.result] || BEAD_CFG.dragon;
            const isLatest = item.roundNo === latestRoundNo;

            return (
              <motion.button
                key={item.id || `bead-${idx}`}
                onMouseEnter={() => setHovered(item)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setHovered(item)}
                whileHover={{ scale: 1.25, zIndex: 10 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 rounded-full flex items-center justify-center font-body font-black text-xs relative select-none cursor-pointer focus:outline-none transition-shadow"
                style={{
                  background: cfg.bg,
                  color: cfg.color,
                  border: `1.5px solid ${isLatest ? '#ffe27a' : cfg.border}`,
                  boxShadow: isLatest
                    ? '0 0 10px 2px #ffe27a, 0 2px 4px rgba(0,0,0,0.8)'
                    : `0 2px 4px rgba(0,0,0,0.6), 0 0 6px ${cfg.glow}`,
                }}
              >
                {isLatest && (
                  <motion.span
                    className="absolute -inset-1 rounded-full pointer-events-none"
                    style={{ border: '2px solid #ffe27a' }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.95, 1.15, 0.95] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                <span
                  style={{
                    fontSize: item.result === 'tie' ? 10 : 13,
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  }}
                >
                  {cfg.text}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected/Hovered Round Inspector footer */}
      <div
        className="mt-3.5 rounded-xl px-4 py-2.5 flex items-center justify-between border"
        style={{
          background: 'rgba(255,255,255,0.04)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          {activeItem && (
            <>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs text-white"
                style={{
                  background: (BEAD_CFG[activeItem.result] || BEAD_CFG.dragon).bg,
                  border: `1px solid ${(BEAD_CFG[activeItem.result] || BEAD_CFG.dragon).border}`,
                }}
              >
                {(BEAD_CFG[activeItem.result] || BEAD_CFG.dragon).text}
              </span>
              <span className="font-display font-extrabold text-[15px] text-white">
                Round #{activeItem.roundNo || '---'}
              </span>
              <span
                className="font-display font-bold text-sm tracking-wider uppercase px-2 py-0.5 rounded"
                style={{
                  background:
                    activeItem.result === 'dragon'
                      ? 'rgba(59,130,246,0.2)'
                      : activeItem.result === 'tiger'
                      ? 'rgba(245,158,11,0.2)'
                      : 'rgba(34,197,94,0.2)',
                  color:
                    activeItem.result === 'dragon'
                      ? '#93c5fd'
                      : activeItem.result === 'tiger'
                      ? '#fde047'
                      : '#86efac',
                }}
              >
                {activeItem.result === 'dragon'
                  ? '🐲 DRAGON WIN'
                  : activeItem.result === 'tiger'
                  ? '🐯 TIGER WIN'
                  : '🤝 TIE'}
              </span>
              {activeItem.roundNo === latestRoundNo && (
                <span className="text-[11px] font-body font-semibold px-2 py-0.5 rounded-full bg-yellow-400/20 text-[#ffe27a] border border-yellow-400/40">
                  LATEST ROUND
                </span>
              )}
            </>
          )}
        </div>
        <p className="text-white/40 text-xs font-body">Tap or hover any bead for details</p>
      </div>
    </Modal>
  );
}

export function HelpModal({ onClose }) {
  return (
    <Modal title="How to Play" onClose={onClose}>
      <ol className="list-decimal pl-5 text-white/85 font-body text-[15px] leading-relaxed space-y-1.5">
        <li>Pick a chip, then tap <b className="text-[#8ccaff]">Dragon</b>, <b className="text-[#7dffa8]">Tie</b> or <b className="text-[#ffa04a]">Tiger</b> before the timer ends.</li>
        <li>One card is dealt to each side. Ace is low, King is high.</li>
        <li>The higher card wins.</li>
      </ol>
      <div className="mt-5 rounded-xl p-4 text-[14px] font-body text-white/85" style={{ background: 'rgba(255,255,255,.06)' }}>
        <div className="flex justify-between py-1"><span>Dragon / Tiger win</span><b className="text-[#ffe27a]">1 : 1</b></div>
        <div className="flex justify-between py-1"><span>Tie bet wins</span><b className="text-[#ffe27a]">{PAYOUT_MULT.tie - 1} : 1</b></div>
        <div className="flex justify-between py-1"><span>Dragon / Tiger bets on a Tie</span><b className="text-[#ffe27a]">{TIE_REFUND_RATE * 100}% returned</b></div>
      </div>
      <p className="mt-4 text-white/40 text-xs font-body">Demo game with virtual currency only – no real money.</p>
    </Modal>
  );
}

export function SettingsModal({ onClose }) {
  const { state, actions } = useGame();
  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="flex flex-col gap-5 font-body text-white">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Sound effects</span>
          <button
            onClick={actions.toggleSound}
            aria-pressed={state.soundOn}
            className="relative rounded-full transition-colors"
            style={{ width: 62, height: 32, background: state.soundOn ? '#22c55e' : '#4b5563' }}
          >
            <motion.span className="absolute top-1 w-6 h-6 rounded-full bg-white" animate={{ left: state.soundOn ? 34 : 4 }} />
          </button>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="font-semibold">Volume</span>
          <input type="range" min="0" max="1" step="0.05" defaultValue="0.7" onChange={(e) => sfx.setVolume(parseFloat(e.target.value))} className="flex-1 accent-yellow-400" />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">Balance <span className="text-[#ffe27a]">{formatINR(state.balance)}</span></span>
          <button
            onClick={() => {
              actions.resetBalance();
              onClose();
            }}
            className="rounded-full px-5 py-2 font-extrabold text-[14px]"
            style={{ background: 'linear-gradient(180deg,#fff1a8,#d9a21b)', color: '#4a2d00' }}
          >
            Reset to ₹50,000
          </button>
        </div>
      </div>
    </Modal>
  );
}
