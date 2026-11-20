import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Copy, Wifi } from 'lucide-react';
import Avatar from './Avatar.jsx';
import Chip from './Chip.jsx';
import { useGame } from '../game/GameContext.jsx';
import { CHIP_VALUES, PHASES, USER_NAME } from '../game/constants.js';
import { makeUserAvatar } from '../game/bots.js';
import { formatINR } from '../game/format.js';

const userAvatar = makeUserAvatar();

// Centers of the 5 gold rings painted in bg.png
const CHIP_CENTERS_X = [650, 750, 850, 950, 1051];
const CHIP_CENTER_Y = 694;
const CHIP_SIZE = 74;

function CircleActionBtn({ children, onClick, disabled, label, size = 66, name }) {
  return (
    <div className="flex flex-col items-center select-none">
      {/* 1. Transparent Button - relies on background image, no extra circle drawn */}
      <motion.button
        aria-label={label}
        onClick={onClick}
        whileHover={disabled ? undefined : { scale: 1.14 }}
        whileTap={disabled ? undefined : { scale: 0.90, y: 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
        className="flex items-center justify-center outline-none select-none transition-transform cursor-pointer"
        style={{
          width: size,
          height: size,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          opacity: disabled ? 0.65 : 1,
          filter: disabled ? 'grayscale(0.2)' : undefined,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {children}
      </motion.button>

      {/* 2. Name OUTSIDE the circle (underneath) - High-visibility Dark badge */}
      {name && (
        <div
          className="mt-1 px-3 py-[3px] rounded-md flex items-center justify-center pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(22,7,10,0.98), rgba(8,2,4,0.98))',
            border: '1.5px solid rgba(255,215,74,0.75)',
            boxShadow: '0 3px 8px rgba(0,0,0,0.9), 0 0 10px rgba(255,200,40,0.25)',
            opacity: disabled ? 0.68 : 1,
          }}
        >
          <span
            className="text-[12px] font-body font-black uppercase tracking-wider leading-none select-none"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #fff0a0 35%, #ffd84a 75%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.95))',
            }}
          >
            {name}
          </span>
        </div>
      )}
    </div>
  );
}

export default function BottomBar() {
  const { state, userId, actions, toast, user, setModal } = useGame();
  const open = state.phase === PHASES.BETTING || state.phase === PHASES.PLACE_BETS;
  const totalBet = state.bets.dragon + state.bets.tie + state.bets.tiger;
  const lastTotal = state.lastBets.dragon + state.lastBets.tie + state.lastBets.tiger;
  const wifiColor = state.ping < 60 ? '#4ade80' : state.ping < 85 ? '#facc15' : '#f87171';

  const [winBurst, setWinBurst] = useState(null);
  useEffect(() => {
    const onWin = (e) => {
      setWinBurst(e.detail);
      const timer = setTimeout(() => setWinBurst(null), 2400);
      return () => clearTimeout(timer);
    };
    window.addEventListener('dt_wallet_win', onWin);
    return () => window.removeEventListener('dt_wallet_win', onWin);
  }, []);

  const copy = () => {
    try {
      navigator.clipboard?.writeText(userId);
    } catch (e) {
      /* ignore */
    }
    toast('ID copied');
  };

  return (
    <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ height: 145, zIndex: 40 }}>
      {/* 1. Bottom-Left user card (fits into left oval frame of bg.png) */}
      <motion.div
        whileHover={{ scale: 0.83 }}
        whileTap={{ scale: 0.78 }}
        onClick={() => setModal(user.isLoggedIn ? 'profile' : 'login')}
        className="absolute flex items-center pointer-events-auto cursor-pointer"
        style={{
          left: 210,
          top: -44,
          width: 382,
          height: 98,
          transform: 'scale(0.80)',
          transformOrigin: 'left center',
        }}
        animate={
          winBurst
            ? {
                scale: [0.80, 0.88, 0.80],
                filter: [
                  'drop-shadow(0 0 0px #ffe27a)',
                  'drop-shadow(0 0 25px #ffd700)',
                  'drop-shadow(0 0 0px #ffe27a)',
                ],
              }
            : {}
        }
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <AnimatePresence>
          {winBurst && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.7 }}
              animate={{ opacity: 1, y: -45, scale: 1.15 }}
              exit={{ opacity: 0, y: -70, scale: 0.8 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute left-24 top-0 z-50 pointer-events-none font-display font-black text-[26px] text-[#ffd700]"
              style={{
                filter:
                  'drop-shadow(0 2px 8px rgba(0,0,0,0.95)) drop-shadow(0 0 14px rgba(255,215,0,0.9))',
              }}
            >
              +{formatINR(winBurst.payout)}
            </motion.div>
          )}
        </AnimatePresence>
        <div data-user-avatar className="shrink-0 ml-2">
          <Avatar a={userAvatar} size={76} />
        </div>
        <div className="ml-3 flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between pr-3">
            <span className="font-body font-extrabold text-[17px] text-white leading-tight tracking-tight truncate max-w-[170px]">
              {user.userName || USER_NAME}
            </span>
            <span
              className="rounded-md px-1.5 py-[1px] text-[10.5px] font-body font-black shrink-0"
              style={{ background: 'linear-gradient(180deg,#fff1a8,#d9a21b)', color: '#4a2d00' }}
            >
              VIP {user.vipLevel || 3}
            </span>
          </div>
          <motion.div
            key={state.balance}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            className="mt-0.5 font-body font-extrabold text-[23px] text-[#ffe27a] leading-none"
          >
            {formatINR(state.balance)}
          </motion.div>
          <div className="mt-1 flex items-center gap-2 text-[11.5px] font-body font-semibold text-white/75">
            <span>
              Chip: <b className="text-white">{formatINR(state.selectedChip)}</b>
            </span>
            <span>•</span>
            <span>
              Bet: <b className="text-[#ffe27a]">{formatINR(totalBet)}</b>
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. Center 5 Chips (aligned directly over the 5 rings in bg.png) */}
      {CHIP_VALUES.map((v, idx) => {
        const cx = CHIP_CENTERS_X[idx] ?? (650 + idx * 100);
        const cy = CHIP_CENTER_Y;
        // Since container top is 841 - 145 = 696, cy relative to container is 694 - 696 = -2
        const relY = cy - (841 - 145);
        const selected = state.selectedChip === v;
        const unaffordable = v > state.balance;

        return (
          <div
            key={v}
            className="absolute pointer-events-auto"
            style={{
              left: cx - CHIP_SIZE / 2,
              top: relY - CHIP_SIZE / 2,
              width: CHIP_SIZE,
              height: CHIP_SIZE,
            }}
          >
            <motion.button
              data-chip-src={v}
              aria-label={`Select chip ${v}`}
              aria-pressed={selected}
              onClick={() => actions.selectChip(v)}
              animate={{ y: 0, scale: 1 }}
              whileHover={{ scale: 1 }}
              whileTap={{
                scale: 0.88,
                y: 5,
                transition: { duration: 0.06 },
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="relative w-full h-full rounded-full outline-none select-none"
              style={{
                opacity: unaffordable ? 0.45 : 1,
                filter: selected
                  ? 'drop-shadow(0 0 10px rgba(255,214,90,0.85))'
                  : undefined,
              }}
            >
              {selected && (
                <motion.span
                  className="absolute -inset-1.5 rounded-full pointer-events-none"
                  style={{
                    border: '3px solid #ffe27a',
                    boxShadow: '0 0 16px 3px rgba(255,214,90,.9), inset 0 0 8px rgba(255,214,90,.5)',
                  }}
                  animate={{ opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              <Chip value={v} size={CHIP_SIZE} label />
            </motion.button>
          </div>
        );
      })}

      {/* 2b. Two Action Circles right next to Chip 29 (Repeat & Into/Double) */}
      <div
        className="absolute pointer-events-auto"
        style={{
          left: 1192 - 35,
          top: -30,
          width: 70,
          height: 84,
        }}
      >
        <CircleActionBtn
          label="Repeat previous bet"
          disabled={!open || !lastTotal}
          onClick={actions.repeatBet}
          size={60}
          name="REPEAT"
        >
          <RotateCcw
            size={36}
            strokeWidth={3.8}
            color="#ffe27a"
            style={{
              filter:
                'drop-shadow(0 2px 4px rgba(0,0,0,0.95)) drop-shadow(0 0 10px rgba(255,215,50,0.9)) drop-shadow(0 0 18px rgba(255,160,20,0.5))',
            }}
          />
        </CircleActionBtn>
      </div>

      {/* x2 Button: Hidden circle hit area, no background, just the ×2 button */}
      <div
        className="absolute pointer-events-auto flex items-center justify-center"
        style={{
          left: 1274 - 33,
          top: -2 - 33,
          width: 66,
          height: 66,
        }}
      >
        <motion.button
          aria-label="Double bet (x2)"
          disabled={!open || !totalBet}
          onClick={actions.doubleBet}
          whileHover={!open || !totalBet ? undefined : { scale: 1.15 }}
          whileTap={!open || !totalBet ? undefined : { scale: 0.90, y: 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          className="w-full h-full rounded-full flex items-center justify-center outline-none select-none transition-transform cursor-pointer"
          style={{
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            opacity: !open || !totalBet ? 0.65 : 1,
            filter: !open || !totalBet ? 'grayscale(0.2)' : undefined,
            cursor: !open || !totalBet ? 'not-allowed' : 'pointer',
          }}
        >
          <span
            className="text-[34px] font-black leading-none tracking-tight select-none"
            style={{
              background: 'linear-gradient(180deg,#ffffff 0%,#fff2a8 40%,#ffd233 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter:
                'drop-shadow(0 2px 4px rgba(0,0,0,0.95)) drop-shadow(0 0 10px rgba(255,215,50,0.9)) drop-shadow(0 0 18px rgba(255,160,20,0.5))',
              WebkitTextStroke: '1px rgba(100,35,0,0.7)',
            }}
          >
            ×2
          </span>
        </motion.button>
      </div>

      {/* 3. Bottom-Right Controls & Status: Gold CLEAR button + ID/Round/Ping info */}
      <div
        className="absolute flex items-center pointer-events-auto"
        style={{
          left: 1345,
          top: -32,
          width: 505,
          height: 62,
        }}
      >
        <motion.button
          aria-label="Clear bets"
          onClick={actions.clearBets}
          whileHover={open && totalBet > 0 ? { scale: 1.05 } : undefined}
          whileTap={open && totalBet > 0 ? { scale: 0.94 } : undefined}
          className="relative flex items-center justify-center font-display font-black text-[22px] tracking-[0.18em] rounded-full outline-none select-none shrink-0 overflow-hidden"
          style={{
            width: 310,
            height: 58,
            background: 'linear-gradient(180deg, #3d0c18 0%, #22040d 50%, #120106 100%)',
            border: open && totalBet > 0 ? '2px solid #e5ad35' : '2px solid #805814',
            boxShadow:
              '0 4px 14px rgba(0,0,0,0.95), inset 0 1px 2px rgba(255,215,100,0.35), inset 0 -2px 4px rgba(0,0,0,0.8), 0 0 12px rgba(229,173,53,0.35)',
            opacity: 1,
            cursor: open && totalBet > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          <span
            style={{
              color: open && totalBet > 0 ? '#ffe580' : '#caa765',
              textShadow:
                open && totalBet > 0
                  ? '0 2px 4px rgba(0,0,0,0.95), 0 0 10px rgba(255,215,60,0.85), 0 0 18px rgba(255,160,20,0.5)'
                  : '0 2px 4px rgba(0,0,0,0.9)',
            }}
          >
            CLEAR
          </span>
          {Boolean(open && totalBet > 0) && <div className="sheen-bar" />}
        </motion.button>

        <div className="ml-4 flex-1 flex items-center justify-between pr-3 font-body text-[12.5px] font-semibold text-white/80">
          <button onClick={copy} className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
            ID: <span className="text-[#ffe27a] font-bold">{userId}</span> <Copy size={12} color="#ffe27a" />
          </button>
          <span className="text-white/60 text-[11.5px]">DT{state.roundNo}</span>
          <span className="flex items-center gap-1 font-bold text-[12px]" style={{ color: wifiColor }}>
            <Wifi size={13} /> {state.ping}ms
          </span>
        </div>
      </div>
    </div>
  );
}
