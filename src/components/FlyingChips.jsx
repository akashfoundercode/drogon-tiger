import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Chip from './Chip.jsx';
import { useGame } from '../game/GameContext.jsx';
import { CHIP_SIZE, PILE_CFG } from '../game/pile.js';
import { sfx } from '../game/sound.js';

// Base pile origins inside the 3 betting boxes (Canvas 1870 x 841 space)
// Dragon Box: left: 405, top: 326, w: 343, h: 228
// Tie Box: left: 770, top: 326, w: 334, h: 228
// Tiger Box: left: 1126, top: 326, w: 343, h: 228
const BOX_PILE_ORIGINS = {
  dragon: { x: 405 + (343 - PILE_CFG.dragon.w) / 2, y: 326 + 228 - 12 - PILE_CFG.dragon.h },
  tie: { x: 770 + (334 - PILE_CFG.tie.w) / 2, y: 326 + 228 - 12 - PILE_CFG.tie.h },
  tiger: { x: 1126 + (343 - PILE_CFG.tiger.w) / 2, y: 326 + 228 - 12 - PILE_CFG.tiger.h },
};

function FlyingChip({ spec }) {
  const { removeFlying, landChip } = useGame();
  const S = CHIP_SIZE;

  const p = useMemo(() => {
    // 1. Origin (Zone 24 User, Zone 1 Left Bot, or Zone 2 Right Bot)
    let cx = 260; // Zone 24: Bottom-Left User Profile Avatar
    let cy = 710;

    const f = spec.from;
    if (f && f.kind === 'player') {
      if (f.sidebar === 'left') {
        // Zone 1: Left Player Panel
        cx = 146;
        cy = 360 + (spec.id % 3) * 60;
      } else {
        // Zone 2: Right Player Panel
        cx = 1724;
        cy = 360 + (spec.id % 3) * 60;
      }
    } else {
      // User coins always originate from Zone 24 (User Profile)
      cx = 260;
      cy = 710;
    }

    // 2. Destination (Straight into Blue, Green, or Red Box)
    const base = BOX_PILE_ORIGINS[spec.side] || BOX_PILE_ORIGINS.tie;
    const x1 = base.x + (spec.slot?.x ?? 80);
    const y1 = base.y + (spec.slot?.y ?? 30);

    const x0 = cx - S / 2;
    const y0 = cy - S / 2;

    // Direct straight toss trajectory up into the box
    const xm = (x0 + x1) * 0.5;
    const ym = Math.min(y0, y1) - 22;
    const dur = 0.30 + Math.random() * 0.04;
    const spin = (Math.random() - 0.5) * 24;

    return {
      x0,
      y0,
      x1,
      y1,
      xm,
      ym,
      dur,
      spin,
      endRot: spec.slot?.rot ?? 0,
    };
  }, [spec, S]);

  const done = () => {
    sfx.chip();
    if (spec.slot) landChip(spec);
    removeFlying(spec.id);
  };

  return (
    <motion.div
      className="absolute left-0 top-0 pointer-events-none"
      style={{
        width: CHIP_SIZE,
        height: CHIP_SIZE,
        filter: 'drop-shadow(0 6px 6px rgba(0,0,0,.6))',
      }}
      initial={{ x: p.x0, y: p.y0, scale: 0.95, rotate: 0, opacity: 0.95 }}
      animate={{
        x: [p.x0, p.xm, p.x1],
        y: [p.y0, p.ym, p.y1],
        scale: [0.95, 1.04, 1],
        rotate: [0, p.spin, p.endRot],
        opacity: 1,
      }}
      transition={{
        duration: p.dur,
        x: { duration: p.dur, ease: 'easeOut', times: [0, 0.5, 1] },
        y: { duration: p.dur, ease: 'easeOut', times: [0, 0.5, 1] },
        scale: { duration: p.dur, times: [0, 0.5, 1], ease: 'easeOut' },
        rotate: { duration: p.dur, ease: 'easeOut' },
      }}
      onAnimationComplete={done}
    >
      <Chip
        value={spec.value}
        size={CHIP_SIZE}
        style={spec.mine ? { boxShadow: '0 0 0 2px #ffe27a, 0 0 10px rgba(255,226,122,0.9)' } : undefined}
      />
    </motion.div>
  );
}

export default function FlyingChips() {
  const { flying } = useGame();
  return (
    <div className="absolute inset-0 pointer-events-none z-[80]">
      {flying.map((spec) => (
        <FlyingChip key={spec.id} spec={spec} />
      ))}
    </div>
  );
}
