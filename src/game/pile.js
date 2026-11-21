// Chip pile geometry: authentic casino overlapping scattered chip heap ("phata phata")
// Chips naturally overlap ("ek dusre pe rahega") without hiding previous coins ("hide nahi hoga"),
// forming a dense, rich heap of 20-30+ coins per betting box.
export const CHIP_SIZE = 48;

export const PILE_CFG = {
  dragon: { w: 242, h: 96 },
  tiger: { w: 242, h: 96 },
  tie: { w: 232, h: 96 },
};

const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// 24 staggered anchor spots across the betting box (w: 242, h: 96)
// Spaced so adjacent chips naturally overlap by ~14-16px ("ek dusre pe rahega")
// but with enough offset that 68-75% of every coin is clearly visible ("hide nahi hoga")
const ANCHOR_SPOTS = [
  // Row 0 (back, y: 4)
  { x: 8,  y: 4 },  { x: 44, y: 4 },  { x: 80, y: 4 },  { x: 116, y: 4 },  { x: 152, y: 4 },  { x: 188, y: 4 },
  // Row 1 (mid-back, y: 18)
  { x: 4,  y: 18 }, { x: 40, y: 18 }, { x: 76, y: 18 }, { x: 112, y: 18 }, { x: 148, y: 18 }, { x: 184, y: 18 },
  // Row 2 (mid-front, y: 32)
  { x: 10, y: 32 }, { x: 46, y: 32 }, { x: 82, y: 32 }, { x: 118, y: 32 }, { x: 154, y: 32 }, { x: 190, y: 32 },
  // Row 3 (front, y: 44)
  { x: 6,  y: 44 }, { x: 42, y: 44 }, { x: 78, y: 44 }, { x: 114, y: 44 }, { x: 150, y: 44 }, { x: 186, y: 44 },
];

// Scattered order so incoming chips land dynamically across the entire box ("phata phata")
const SCATTER_ORDER = [
  9, 2, 15, 7, 21, 1, 13, 18, 4, 11, 20, 16, 8, 22, 0, 12, 19, 5, 10, 3, 17, 6, 23, 14
];

export function getSlot(side, k) {
  const c = PILE_CFG[side] || PILE_CFG.dragon;
  const spotIdx = SCATTER_ORDER[k % SCATTER_ORDER.length];
  const spot = ANCHOR_SPOTS[spotIdx] || ANCHOR_SPOTS[0];
  const layer = Math.floor(k / SCATTER_ORDER.length);

  // Micro-jitter so chips don't look robotic
  const jx = (hash(k * 17 + 3) - 0.5) * 4.0;
  const jy = (hash(k * 23 + 7) - 0.5) * 3.0;

  // Stacking elevation for layer > 0
  const dy = -layer * 3.2;

  const rawX = spot.x + jx;
  const rawY = spot.y + dy + jy;

  const x = Math.max(2, Math.min(c.w - CHIP_SIZE - 2, rawX));
  const y = Math.max(2, Math.min(c.h - CHIP_SIZE - 2, rawY));

  // Natural organic rotation
  const rot = (hash(k * 31 + 11) - 0.5) * 36;

  // 3D zIndex: Front rows render on top of back rows, higher layers on top of lower
  const zIndex = Math.round(y * 100 + k * 5);

  return { idx: k, x, y, rot, zIndex, height: layer };
}
