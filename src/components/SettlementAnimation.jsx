import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Chip from './Chip.jsx';
import { useGame } from '../game/GameContext.jsx';
import { PHASES } from '../game/constants.js';
import { CHIP_SIZE } from '../game/pile.js';
import { sfx } from '../game/sound.js';

// Table Betting Box Center Coordinates (in 1870 x 841 canvas space)
const BOX_CENTERS = {
  dragon: { x: 576.5, y: 468 },
  tie: { x: 937, y: 468 },
  tiger: { x: 1297.5, y: 468 },
};

// Target Coordinates
const USER_WALLET = { x: 260, y: 710 }; // Zone 24: Bottom-Left User Profile / Wallet

const LEFT_BOTS = [
  { x: 146, y: 360 },
  { x: 146, y: 420 },
  { x: 146, y: 480 },
];

const RIGHT_BOTS = [
  { x: 1724, y: 360 },
  { x: 1724, y: 420 },
  { x: 1724, y: 480 },
];

export default function SettlementAnimation() {
  const { state, dispatch } = useGame();
  const [sweepingChips, setSweepingChips] = useState([]);
  const [payoutChips, setPayoutChips] = useState([]);
  const lastRoundSettled = useRef(null);

  useEffect(() => {
    // Trigger strictly when winner is decided in RESULT phase
    if (state.phase !== PHASES.RESULT || !state.result || !state.result.winner) {
      return;
    }

    const curRound = String(state.roundNo);
    if (lastRoundSettled.current === curRound) return;
    lastRoundSettled.current = curRound;

    const winner = state.result.winner;
    const winCenter = BOX_CENTERS[winner] || BOX_CENTERS.tie;
    const losingSides = ['dragon', 'tie', 'tiger'].filter((s) => s !== winner);

    // -------------------------------------------------------------------
    // Step 1: Sweep Losing Chips into the Winning Betting Box
    // -------------------------------------------------------------------
    const sweepList = [];
    let sweepId = 0;

    losingSides.forEach((lSide) => {
      const fromCenter = BOX_CENTERS[lSide];
      const count = 18; // 18 chips swept per losing spot
      for (let i = 0; i < count; i++) {
        const x0 = fromCenter.x + (Math.random() - 0.5) * 110;
        const y0 = fromCenter.y + (Math.random() - 0.5) * 55;
        const x1 = winCenter.x + (Math.random() - 0.5) * 60;
        const y1 = winCenter.y + (Math.random() - 0.5) * 45;
        const xm = (x0 + x1) * 0.5;
        const ym = Math.min(y0, y1) - 25;
        const dur = 0.38 + Math.random() * 0.08;
        const delay = Math.random() * 0.10;
        sweepList.push({
          id: `sweep-${sweepId++}`,
          x0,
          y0,
          x1,
          y1,
          xm,
          ym,
          dur,
          delay,
          value: [10, 50, 100, 500, 1000][i % 5],
        });
      }
    });

    setSweepingChips(sweepList);
    sfx.chip();

    // -------------------------------------------------------------------
    // Step 2: Winning Chips Disperse from Winner Box to User and Winning Bots
    // -------------------------------------------------------------------
    const userPayout =
      state.result.payout ||
      (state.bets[winner] ? state.bets[winner] * (winner === 'tie' ? 5 : 2) : 0);
    const userWon = userPayout > 0;

    const payoutTimer = setTimeout(() => {
      // Clear sweeping chips as they have merged into the winning box
      setSweepingChips([]);

      const disperseList = [];
      let payId = 0;

      // A. If User Won: Cascade of chips flying straight into User Wallet (cx: 260, cy: 710)
      if (userWon) {
        const userChipCount = 24;
        for (let i = 0; i < userChipCount; i++) {
          const x0 = winCenter.x + (Math.random() - 0.5) * 60;
          const y0 = winCenter.y + (Math.random() - 0.5) * 40;
          const x1 = USER_WALLET.x + (Math.random() - 0.5) * 35;
          const y1 = USER_WALLET.y + (Math.random() - 0.5) * 25;
          const xm = (x0 + x1) * 0.5 - 20;
          const ym = Math.min(y0, y1) - 75; // Arching trajectory
          const dur = 0.50 + Math.random() * 0.06;
          const delay = i * 0.025; // Staggered cascade

          disperseList.push({
            id: `pay-user-${payId++}`,
            x0,
            y0,
            x1,
            y1,
            xm,
            ym,
            dur,
            delay,
            isUser: true,
            value: [100, 500, 1000, 5000][i % 4],
          });
        }
      }

      // B. Winning Bots: Chips flying to winning bots on left and right sidebars
      const botTargets = [...LEFT_BOTS, ...RIGHT_BOTS];
      botTargets.forEach((target, bIdx) => {
        const chipsForBot = 4;
        for (let i = 0; i < chipsForBot; i++) {
          const x0 = winCenter.x + (Math.random() - 0.5) * 40;
          const y0 = winCenter.y + (Math.random() - 0.5) * 30;
          const x1 = target.x + (Math.random() - 0.5) * 20;
          const y1 = target.y + (Math.random() - 0.5) * 20;
          const xm = (x0 + x1) * 0.5;
          const ym = Math.min(y0, y1) - 45;
          const dur = 0.48 + Math.random() * 0.06;
          const delay = bIdx * 0.04 + i * 0.03;

          disperseList.push({
            id: `pay-bot-${payId++}`,
            x0,
            y0,
            x1,
            y1,
            xm,
            ym,
            dur,
            delay,
            isUser: false,
            value: [50, 100, 500][i % 3],
          });
        }
      });

      setPayoutChips(disperseList);
      sfx.chip();

      // Trigger wallet win event and celebration sound upon chips arrival
      if (userWon) {
        setTimeout(() => {
          sfx.win();
          window.dispatchEvent(
            new CustomEvent('dt_wallet_win', { detail: { payout: userPayout } })
          );
        }, 550);
      }

      // Clean table piles once chips have dispersed
      setTimeout(() => {
        dispatch({ type: 'CLEAR_PILES' });
      }, 700);

      // Clean payout animation elements
      setTimeout(() => {
        setPayoutChips([]);
      }, 1400);
    }, 450);

    return () => {
      clearTimeout(payoutTimer);
    };
  }, [state.phase, state.result, state.roundNo, state.bets, dispatch]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[85]">
      {/* 1. Sweeping Chips from Losing Boxes to Winner Box */}
      <AnimatePresence>
        {sweepingChips.map((c) => (
          <motion.div
            key={c.id}
            className="absolute left-0 top-0 pointer-events-none"
            style={{ width: CHIP_SIZE, height: CHIP_SIZE }}
            initial={{ x: c.x0, y: c.y0, scale: 0.95, opacity: 0.95 }}
            animate={{
              x: [c.x0, c.xm, c.x1],
              y: [c.y0, c.ym, c.y1],
              scale: [0.95, 1.05, 0.9],
              opacity: [0.95, 1, 0.85],
            }}
            transition={{
              duration: c.dur,
              delay: c.delay,
              ease: 'easeIn',
              times: [0, 0.6, 1],
            }}
          >
            <Chip value={c.value} size={CHIP_SIZE} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 2. Payout Chips Dispersing from Winner Box to User and Bots */}
      <AnimatePresence>
        {payoutChips.map((c) => (
          <motion.div
            key={c.id}
            className="absolute left-0 top-0 pointer-events-none"
            style={{
              width: CHIP_SIZE,
              height: CHIP_SIZE,
              filter: c.isUser
                ? 'drop-shadow(0 0 8px rgba(255,215,0,0.85)) drop-shadow(0 4px 6px rgba(0,0,0,0.6))'
                : 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
            }}
            initial={{ x: c.x0, y: c.y0, scale: 0.9, opacity: 0.9 }}
            animate={{
              x: [c.x0, c.xm, c.x1],
              y: [c.y0, c.ym, c.y1],
              scale: [0.9, 1.15, 1],
              rotate: [0, c.isUser ? 360 : 180],
              opacity: [0.9, 1, 1],
            }}
            transition={{
              duration: c.dur,
              delay: c.delay,
              ease: 'easeOut',
              times: [0, 0.5, 1],
            }}
          >
            <Chip
              value={c.value}
              size={CHIP_SIZE}
              style={
                c.isUser
                  ? { boxShadow: '0 0 0 2px #ffe27a, 0 0 12px rgba(255,226,122,0.95)' }
                  : undefined
              }
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
