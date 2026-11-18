import React, { useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Chip from './Chip.jsx';
import { useGame } from '../game/GameContext.jsx';
import { CANVAS_W } from '../game/constants.js';
import { CHIP_SIZE } from '../game/pile.js';
import { sfx } from '../game/sound.js';

const rectOf = (sel) => {
  const el = document.querySelector(sel);
  return el ? el.getBoundingClientRect() : null;
};

function FlyingChip({ spec }) {
  const { removeFlying, landChip } = useGame();
  const [p, setP] = useState(null);

  useLayoutEffect(() => {
    const root = document.querySelector('[data-canvas]');
    if (!root) {
      removeFlying(spec.id);
      return;
    }
    const rr = root.getBoundingClientRect();
    const sc = rr.width / CANVAS_W;
    const S = CHIP_SIZE;
    const toL = (r) => ({ x: (r.left - rr.left) / sc, y: (r.top - rr.top) / sc, w: r.width / sc, h: r.height / sc });

    // ----- start point (centre of the source) -----
    let cx = CANVAS_W / 2;
    let cy = 750;
    const f = spec.from;
    if (f.kind === 'chip') {
      const r = rectOf(`[data-chip-src="${f.key}"]`);
      if (r) {
        const l = toL(r);
        cx = l.x + l.w / 2;
        cy = l.y + l.h / 2;
      }
    } else if (f.kind === 'player') {
      const r = rectOf(`[data-player="${f.key}"]`);
      const sb = rectOf(`[data-sidebar="${f.sidebar}"]`);
      if (r && sb) {
        const l = toL(r);
        const b = toL(sb);
        cx = l.x + l.w / 2;
        cy = Math.min(Math.max(l.y + l.h / 2, b.y + 40), b.y + b.h - 50);
      } else if (sb) {
        const b = toL(sb);
        cx = b.x + b.w / 2;
        cy = b.y + b.h / 2;
      }
    } else if (f.kind === 'pile') {
      const r = rectOf(`[data-pile="${f.key}"]`);
      if (r) {
        const l = toL(r);
        cx = l.x + l.w / 2 + (Math.random() - 0.5) * 120;
        cy = l.y + l.h / 2;
      }
    }

    // ----- end point (top-left of the chip) -----
    let x1 = cx;
    let y1 = cy;
    if (spec.to === 'user') {
      const r = rectOf('[data-user-avatar]');
      if (r) {
        const l = toL(r);
        x1 = l.x + l.w / 2 - S / 2;
        y1 = l.y + l.h / 2 - S / 2;
      }
    } else {
      const r = rectOf(`[data-pile="${spec.side}"]`);
      if (r) {
        const l = toL(r);
        x1 = l.x + spec.slot.x;
        y1 = l.y + spec.slot.y;
      }
    }
    const x0 = cx - S / 2;
    const y0 = cy - S / 2;
    const arc = Math.max(90, Math.abs(y1 - y0) * 0.35 + 70);
    setP({
      x0,
      y0,
      x1,
      y1,
      xm: x0 + (x1 - x0) * 0.5,
      ym: Math.min(y0, y1) - arc,
      dur: 0.8 + Math.random() * 0.2,
      spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!p) return null;

  const done = () => {
    sfx.chip();
    if (spec.to !== 'user' && spec.slot) landChip(spec);
    removeFlying(spec.id);
  };

  const endRot = spec.slot ? spec.slot.rot : 0;

  return (
    <motion.div
      className="absolute left-0 top-0 pointer-events-none"
      style={{ width: CHIP_SIZE, height: CHIP_SIZE, filter: 'drop-shadow(0 8px 6px rgba(0,0,0,.5))' }}
      initial={{ x: p.x0, y: p.y0, scale: 0.7, rotate: 0, opacity: 0 }}
      animate={{
        x: [p.x0, p.xm, p.x1],
        y: [p.y0, p.ym, p.y1],
        scale: [0.7, 1.3, 1],
        rotate: [0, p.spin, endRot + Math.round(p.spin / 360) * 360],
        opacity: [0, 1, 1],
      }}
      transition={{
        duration: p.dur,
        x: { duration: p.dur, ease: 'easeInOut', times: [0, 0.5, 1] },
        y: { duration: p.dur, ease: ['easeOut', 'easeIn'], times: [0, 0.45, 1] },
        scale: { duration: p.dur, times: [0, 0.45, 1], ease: 'easeInOut' },
        rotate: { duration: p.dur, ease: 'easeInOut' },
        opacity: { duration: p.dur * 0.25, times: [0, 0.5, 1] },
      }}
      onAnimationComplete={done}
    >
      <Chip value={spec.value} size={CHIP_SIZE} style={spec.mine ? { outline: '2px solid #ffe27a', outlineOffset: 1 } : undefined} />
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
