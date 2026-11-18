import React from 'react';
import { motion } from 'framer-motion';
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

function CircleActionBtn({ children, onClick, disabled, label, size = 66, subLabel }) {
  return (
    <motion.button
      aria-label={label}
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.15 }}
      whileTap={disabled ? undefined : { scale: 0.90 }}
      className="flex flex-col items-center justify-center font-body font-black shrink-0 outline-none select-none transition-transform"
      style={{
        width: size,
        height: size,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
      {subLabel && (
        <span
          className="text-[11px] font-black uppercase tracking-wider text-[#fff4b8] -mt-0.5 leading-none"
          style={{
            textShadow: '0 2px 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9), 0 0 10px rgba(255,215,0,0.7)',
          }}
        >
          {subLabel}
        </span>
      )}
    </motion.button>
  );
}

export default function BottomBar() {
  const { state, userId, actions, toast } = useGame();
  const open = state.phase === PHASES.BETTING;
  const totalBet = state.bets.dragon + state.bets.tie + state.bets.tiger;
  const lastTotal = state.lastBets.dragon + state.lastBets.tie + state.lastBets.tiger;
  const wifiColor = state.ping < 60 ? '#4ade80' : state.ping < 85 ? '#facc15' : '#f87171';

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
      <div
        className="absolute flex items-center pointer-events-auto"
        style={{
          left: 210,
          top: -44,
          width: 382,
          height: 98,
          transform: 'scale(0.80)',
          transformOrigin: 'left center',
        }}
      >
        <div data-user-avatar className="shrink-0 ml-2">
          <Avatar a={userAvatar} size={76} />
        </div>
        <div className="ml-3 flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between pr-3">
            <span className="font-body font-extrabold text-[17px] text-white leading-tight tracking-tight">
              {USER_NAME}
            </span>
            <span
              className="rounded-md px-1.5 py-[1px] text-[10.5px] font-body font-black"
              style={{ background: 'linear-gradient(180deg,#fff1a8,#d9a21b)', color: '#4a2d00' }}
            >
              VIP 3
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
      </div>

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

      {/* 2b. Two Action Circles right next to Chip 29 (Refresh & x2) */}
      <div
        className="absolute pointer-events-auto"
        style={{
          left: 1192 - 33,
          top: -2 - 33,
          width: 66,
          height: 66,
        }}
      >
        <CircleActionBtn label="Repeat previous bet" disabled={!open || !lastTotal} onClick={actions.repeatBet} size={66} subLabel="REPEAT">
          <RotateCcw
            size={30}
            strokeWidth={3.4}
            color="#fff099"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95)) drop-shadow(0 0 10px rgba(255,200,50,0.9))',
            }}
          />
        </CircleActionBtn>
      </div>

      <div
        className="absolute pointer-events-auto"
        style={{
          left: 1274 - 33,
          top: -2 - 33,
          width: 66,
          height: 66,
        }}
      >
        <CircleActionBtn label="Double bet" disabled={!open || !totalBet} onClick={actions.doubleBet} size={66} subLabel="DOUBLE">
          <span
            className="text-[28px] font-black leading-none tracking-tight"
            style={{
              background: 'linear-gradient(180deg,#ffffff 0%,#fff1a8 40%,#ffd233 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.95)) drop-shadow(0 0 10px rgba(255,180,30,0.9))',
              WebkitTextStroke: '1px rgba(90,30,0,0.7)',
            }}
          >
            ×2
          </span>
        </CircleActionBtn>
      </div>

      {/* 3. Bottom-Right Controls & Status (Clear button & ID/Ping info) */}
      <div
        className="absolute flex items-center pointer-events-auto"
        style={{
          left: 1360,
          top: -31,
          width: 480,
          height: 58,
        }}
      >
        <motion.button
          aria-label="Clear bets"
          onClick={actions.clearBets}
          whileHover={open && totalBet ? { scale: 1.08 } : undefined}
          whileTap={open && totalBet ? { scale: 0.92 } : undefined}
          className="flex items-center justify-center font-body font-black text-[19px] rounded-full px-6 shrink-0 outline-none select-none"
          style={{
            height: 54,
            minWidth: 110,
            color: '#4a2d00',
            background: 'linear-gradient(180deg,#fff4b8 0%,#f5b81c 50%,#b87006 100%)',
            border: '3px solid #ffe27a',
            boxShadow: '0 4px 14px rgba(0,0,0,.75), inset 0 2px 3px rgba(255,255,255,.8), 0 0 12px rgba(245,184,28,.5)',
            opacity: open && totalBet ? 1 : 0.45,
            cursor: open && totalBet ? 'pointer' : 'not-allowed',
          }}
        >
          CLEAR
        </motion.button>

        <div className="ml-5 flex-1 flex items-center justify-between pr-4 font-body text-[13px] font-semibold text-white/80">
          <button onClick={copy} className="flex items-center gap-1.5 hover:text-white transition-colors">
            ID: <span className="text-[#ffe27a] font-bold">{userId}</span> <Copy size={13} color="#ffe27a" />
          </button>
          <span className="text-white/60">Round DT{state.roundNo}</span>
          <span className="flex items-center gap-1.5 font-bold" style={{ color: wifiColor }}>
            <Wifi size={15} /> {state.ping}ms
          </span>
        </div>
      </div>
    </div>
  );
}
