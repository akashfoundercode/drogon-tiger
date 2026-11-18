// Chip pile geometry: every panel owns a fixed pile area; each landed chip owns a slot.
export const CHIP_SIZE = 34;

export const PILE_CFG = {
  dragon: { w: 230, h: 90, cols: 6, rows: 3, mult: 7 },
  tiger: { w: 230, h: 90, cols: 6, rows: 3, mult: 7 },
  tie: { w: 220, h: 90, cols: 6, rows: 3, mult: 5 },
};

const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// k = running chip counter for the side. Returns top-left position inside the pile container.
export function getSlot(side, k) {
  const c = PILE_CFG[side] || PILE_CFG.dragon;
  const N = c.cols * c.rows;
  const cell = ((k % N) * c.mult) % N;
  const col = cell % c.cols;
  const row = Math.floor(cell / c.cols);
  const stepX = (c.w - CHIP_SIZE) / (c.cols - 1);
  const stepY = (c.h - CHIP_SIZE) / (c.rows - 1);
  const jx = (hash(k + 1) - 0.5) * 6;
  const jy = (hash(k + 7) - 0.5) * 4;
  const x = Math.max(2, Math.min(c.w - CHIP_SIZE - 2, col * stepX + (row % 2 ? stepX * 0.2 : 0) + jx));
  const y = Math.max(2, Math.min(c.h - CHIP_SIZE - 2, row * stepY + jy));
  const rot = (hash(k + 13) - 0.5) * 60;
  return { idx: cell, x, y, rot };
}
