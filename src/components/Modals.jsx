import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Eye,
  EyeOff,
  Lock,
  Phone,
  User,
  Wallet,
  LogIn,
  LogOut,
  RefreshCw,
  Copy,
  Check,
  PlusCircle,
  ShieldCheck,
  Crown,
} from 'lucide-react';
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

/* ========================================================================= */
/* 🔑 LOGIN MODAL (https://api.wingo4all.site/api/login)                     */
/* ========================================================================= */
export function LoginModal({ onClose }) {
  const { user, login, setModal } = useGame();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savePassword, setSavePassword] = useState(false);

  // Load saved credentials on mount if user previously selected "Save Password"
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('dt_saved_creds');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mobile) setMobile(parsed.mobile);
        if (parsed.password) setPassword(parsed.password);
        setSavePassword(true);
      }
    } catch (e) {}
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!mobile.trim()) {
      setErrorMsg('Please enter your 10-digit mobile number');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await login({
      mobile: mobile.trim(),
      country_code: countryCode,
      password: password.trim(),
    });
    setLoading(false);
    if (res.ok) {
      // Save or clear remembered password based on user checkbox
      try {
        if (savePassword) {
          localStorage.setItem(
            'dt_saved_creds',
            JSON.stringify({ mobile: mobile.trim(), password: password.trim() })
          );
        } else {
          localStorage.removeItem('dt_saved_creds');
        }
      } catch (err) {}
      onClose();
    } else {
      setErrorMsg(res.message || 'Login failed. Invalid credentials.');
    }
  };

  const handleDemoFill = () => {
    setMobile('9876543210');
    setPassword('dragon123');
    setSavePassword(true);
    setErrorMsg('');
  };

  return (
    <Modal title="Member Login" onClose={onClose} width={450}>
      {user.isLoggedIn ? (
        <div className="flex flex-col items-center gap-4 text-center py-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-yellow-400/20 border-2 border-yellow-400 text-yellow-300">
            <User size={36} />
          </div>
          <div>
            <h3 className="font-display font-black text-[22px] text-white">Already Logged In</h3>
            <p className="text-white/70 font-body text-sm mt-1">Logged in as <b className="text-[#ffe27a]">{user.userName}</b> ({user.mobile || '9876543210'})</p>
          </div>
          <div className="flex items-center gap-3 mt-2 w-full">
            <button
              onClick={() => setModal('profile')}
              className="flex-1 py-3 rounded-xl font-body font-black text-sm tracking-wider uppercase text-[#4a2d00]"
              style={{ background: 'linear-gradient(180deg,#fff1a8,#d9a21b)' }}
            >
              Open Profile
            </button>
            <button
              onClick={() => setModal('wallet')}
              className="flex-1 py-3 rounded-xl font-body font-black text-sm tracking-wider uppercase text-white bg-white/10 hover:bg-white/15 border border-white/20"
            >
              Wallet
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 font-body">
          <p className="text-white/75 text-xs sm:text-sm -mt-1 leading-snug">
            Login to save your wallet balance, bet history, and VIP privileges across sessions.
          </p>

          {errorMsg && (
            <div className="px-3.5 py-2 rounded-xl bg-red-900/40 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Country code & Mobile number */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Mobile Number</label>
            <div className="flex items-center rounded-xl overflow-hidden border border-white/20 bg-black/40 focus-within:border-yellow-400 transition-colors">
              <div className="flex items-center gap-1 px-3 py-2.5 bg-white/10 text-white font-bold text-xs sm:text-sm shrink-0 border-r border-white/15">
                <span>🇮🇳</span>
                <span>+{countryCode}</span>
              </div>
              <div className="relative flex-1 flex items-center">
                <Phone size={17} className="absolute left-3 text-white/40" />
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit mobile"
                  className="w-full pl-9 pr-3 py-2.5 bg-transparent text-white font-semibold text-xs sm:text-sm outline-none placeholder:text-white/30"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Password</label>
            <div className="relative flex items-center rounded-xl border border-white/20 bg-black/40 focus-within:border-yellow-400 transition-colors">
              <Lock size={17} className="absolute left-3 text-white/40" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter account password"
                className="w-full pl-9 pr-10 py-2.5 bg-transparent text-white font-semibold text-xs sm:text-sm outline-none placeholder:text-white/30"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 p-1 text-white/50 hover:text-white transition-colors"
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Save Password / Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-0.5">
            <label
              onClick={() => setSavePassword(!savePassword)}
              className="flex items-center gap-2 cursor-pointer select-none text-white/80 hover:text-white transition-colors"
            >
              <div
                className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                  savePassword
                    ? 'bg-gradient-to-b from-[#fff1a8] to-[#e0a912] border-[#ffe27a] text-[#4a2d00]'
                    : 'bg-black/50 border-white/30 text-transparent'
                }`}
              >
                <Check size={12} className="stroke-[3]" />
              </div>
              <span className="font-semibold text-[11.5px] sm:text-xs tracking-wide">
                Save Password (Remember Me)
              </span>
            </label>
          </div>

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-1 w-full py-3 rounded-xl font-display font-black text-[15px] sm:text-[16px] tracking-wider text-[#4a2d00] flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            style={{
              background: 'linear-gradient(180deg,#fff1a8,#e0a912 60%,#b8801a)',
              boxShadow: '0 4px 18px rgba(224,169,18,0.45)',
            }}
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin text-[#4a2d00]" />
            ) : (
              <>
                <LogIn size={18} />
                <span>SIGN IN NOW</span>
              </>
            )}
          </motion.button>

          {/* Demo fill quick link */}
          <div className="mt-1 flex items-center justify-between text-xs text-white/60">
            <button
              type="button"
              onClick={handleDemoFill}
              className="text-[#ffe27a] hover:underline font-semibold"
            >
              ⚡ Fill Demo Account
            </button>
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-green-400" /> 256-bit Encrypted
            </span>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ========================================================================= */
/* 👤 PROFILE MODAL                                                          */
/* ========================================================================= */
export function ProfileModal({ onClose }) {
  const { user, logout, state, setModal } = useGame();
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    try {
      navigator.clipboard?.writeText(String(user.userId));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {}
  };

  return (
    <Modal title="Player Profile" onClose={onClose} width={480}>
      <div className="flex flex-col gap-5 font-body text-white">
        {/* User Card */}
        <div
          className="relative rounded-2xl p-4 flex items-center gap-4 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(60,20,30,0.8), rgba(20,5,15,0.95))',
            border: '1.5px solid rgba(255,215,74,0.3)',
          }}
        >
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-black relative"
              style={{
                background: 'radial-gradient(circle at 35% 25%, #ffcc00, #b8801a)',
                boxShadow: '0 0 20px rgba(255,200,40,0.5)',
              }}
            >
              👑
            </div>
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-black">
              VIP {user.vipLevel || 3}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-xl text-white truncate">{user.userName}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-500/20 text-green-300 border border-green-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-white/60 mt-0.5">{user.mobile ? `+91 ${user.mobile}` : 'Verified Player'}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-white/75 font-mono">ID: {user.userId}</span>
              <button
                onClick={handleCopyId}
                className="p-1 rounded hover:bg-white/10 text-[#ffe27a] transition-colors"
                title="Copy User ID"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(180deg, rgba(35,15,25,0.7), rgba(15,5,10,0.8))',
            border: '1px solid rgba(255,215,74,0.2)',
          }}
        >
          <div>
            <span className="text-xs uppercase font-bold text-white/60 tracking-wider">Wallet Balance</span>
            <div className="text-2xl font-black text-gold-grad mt-0.5">{formatINR(state.balance)}</div>
          </div>
          <button
            onClick={() => {
              onClose();
              setModal('wallet');
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs tracking-wider text-[#4a2d00]"
            style={{ background: 'linear-gradient(180deg,#fff1a8,#d9a21b)' }}
          >
            <Wallet size={16} />
            <span>MANAGE</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          {user.isLoggedIn ? (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-wider text-red-300 bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut size={16} />
              <span>LOGOUT OF THIS DEVICE</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                setModal('login');
              }}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-wider text-[#4a2d00] flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(180deg,#fff1a8,#d9a21b)' }}
            >
              <LogIn size={16} />
              <span>LOGIN WITH MOBILE NUMBER</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ========================================================================= */
/* 💳 WALLET MODAL                                                           */
/* ========================================================================= */
export function WalletModal({ onClose }) {
  const { state, refreshBalance, depositBalance } = useGame();
  const [customAmount, setCustomAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const presets = [500, 1000, 2000, 5000, 10000, 50000];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleRecharge = (amount) => {
    depositBalance(amount);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const val = Number(customAmount);
    if (val > 0) {
      handleRecharge(val);
      setCustomAmount('');
    }
  };

  return (
    <Modal title="Wallet & Balance" onClose={onClose} width={500}>
      <div className="flex flex-col gap-5 font-body text-white">
        {/* Luxury Gold Balance Banner */}
        <div
          className="rounded-2xl p-5 flex items-center justify-between relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #4a1505 0%, #200508 60%, #100204 100%)',
            border: '2px solid #ffd84a',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 15px rgba(255,200,40,0.2)',
          }}
        >
          <div>
            <span className="text-xs font-bold text-[#ffd84a] uppercase tracking-wider flex items-center gap-1.5">
              <Wallet size={16} /> Total Available Balance
            </span>
            <div className="font-display font-black text-[32px] text-gold-grad leading-tight mt-1">
              {formatINR(state.balance)}
            </div>
            <span className="text-[11px] text-white/60">Instant settlement on Dragon, Tiger & Tie wins</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-[#ffe27a] transition-transform active:scale-90"
            title="Refresh Live Balance"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Quick Add Presets */}
        <div>
          <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
            Quick Add Chips (Demo Mode)
          </span>
          <div className="grid grid-cols-3 gap-2.5 mt-2">
            {presets.map((amt) => (
              <motion.button
                key={amt}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleRecharge(amt)}
                className="py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold text-sm border transition-colors"
                style={{
                  background: 'linear-gradient(180deg, rgba(40,15,25,0.8), rgba(20,5,12,0.9))',
                  borderColor: 'rgba(255,215,74,0.3)',
                  color: '#ffe27a',
                }}
              >
                <PlusCircle size={15} />
                <span>+{formatINR(amt)}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2 items-center">
          <input
            type="number"
            min="10"
            step="10"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom amount (e.g. 2500)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white font-semibold text-sm outline-none focus:border-yellow-400 placeholder:text-white/30"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold text-sm tracking-wider text-[#4a2d00]"
            style={{ background: 'linear-gradient(180deg,#fff1a8,#d9a21b)' }}
          >
            ADD
          </button>
        </form>

        <div className="text-center text-xs text-white/40 pt-1 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-green-400" />
          <span>Real-time wallet balance synced with server API & sockets</span>
        </div>
      </div>
    </Modal>
  );
}
