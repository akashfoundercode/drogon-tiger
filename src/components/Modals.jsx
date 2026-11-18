import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useGame } from '../game/GameContext.jsx';
import { sfx } from '../game/sound.js';
import { PAYOUT_MULT, TIE_REFUND_RATE } from '../game/constants.js';
import { formatINR } from '../game/format.js';

function Modal({ title, onClose, children }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 120, background: 'rgba(5,2,12,.72)', backdropFilter: 'blur(3px)' }}
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
        style={{ width: 560, background: 'linear-gradient(160deg,#fff1a8,#b8801a 45%,#5c3b06)', boxShadow: '0 20px 60px rgba(0,0,0,.8), 0 0 40px rgba(245,197,66,.35)' }}
      >
        <div className="rounded-[20px] p-7" style={{ background: 'linear-gradient(180deg,#2c0a1c,#12040f)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-black text-[28px] text-gold-grad">{title}</h2>
            <button aria-label="Close" onClick={onClose} className="rounded-full p-1.5" style={{ background: 'rgba(255,255,255,.08)' }}>
              <X size={22} color="#ffe27a" />
            </button>
          </div>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function StatsModal({ onClose }) {
  const { state } = useGame();
  const h = state.history;
  const count = (k) => h.filter((x) => x.result === k).length;
  const rows = [
    { k: 'dragon', label: 'Dragon', color: '#3b82f6' },
    { k: 'tiger', label: 'Tiger', color: '#f5b81c' },
    { k: 'tie', label: 'Tie', color: '#22c55e' },
  ];
  return (
    <Modal title="Statistics" onClose={onClose}>
      <p className="text-white/60 text-sm font-body mb-4">Last {h.length} rounds</p>
      <div className="flex flex-col gap-3">
        {rows.map((r) => {
          const n = count(r.k);
          const pct = h.length ? Math.round((n / h.length) * 100) : 0;
          return (
            <div key={r.k}>
              <div className="flex justify-between text-white font-body font-semibold text-[15px] mb-1">
                <span>{r.label}</span>
                <span>
                  {n} · {pct}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: r.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
              </div>
            </div>
          );
        })}
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
