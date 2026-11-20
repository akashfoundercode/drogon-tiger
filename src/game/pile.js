// Chip pile geometry: authentic casino overlapping scattered chip heap ("phata phata")
// Chips naturally overlap ("ek dusre pe rahega") without hiding previous coins ("hide nahi hoga"),
// forming a dense, rich heap of 20-30+ coins per betting box.
export const CHIP_SIZE = 34;

export const PILE_CFG = {
  dragon: { w: 230, h: 90 },
  tiger: { w: 230, h: 90 },
  tie: { w: 220, h: 90 },
};

const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// 24 staggered anchor spots across the betting box (w: 230, h: 90)
// Spaced so adjacent chips naturally overlap by ~15-20px ("ek dusre pe rahega")
// but with enough offset that 60-75% of every coin is clearly visible ("hide nahi hoga")
const ANCHOR_SPOTS = [
  // Row 0 (back, y: 8)
  { x: 18, y: 8 },  { x: 52, y: 8 },  { x: 88, y: 8 },  { x: 122, y: 8 },  { x: 156, y: 8 },  { x: 190, y: 8 },
  // Row 1 (mid-back, y: 22)
  { x: 8,  y: 22 }, { x: 42, y: 22 }, { x: 74, y: 22 }, { x: 106, y: 22 }, { x: 138, y: 22 }, { x: 172, y: 22 },
  // Row 2 (mid-front, y: 36)
  { x: 20, y: 36 }, { x: 54, y: 36 }, { x: 88, y: 36 }, { x: 122, y: 36 }, { x: 156, y: 36 }, { x: 190, y: 36 },
  // Row 3 (front, y: 50)
  { x: 10, y: 50 }, { x: 44, y: 50 }, { x: 76, y: 50 }, { x: 108, y: 50 }, { x: 140, y: 50 }, { x: 174, y: 50 },
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
