const zero = () => ({ dragon: 0, tie: 0, tiger: 0 });

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SKIN = ['#f3cfae', '#e3b08a', '#c98f62', '#a86b41', '#7b4b2b'];
const HAIR = ['#1a1109', '#2b1a0d', '#4a2c14', '#c9a24b', '#0e0e0e', '#6b3a1e'];
const SHIRT = ['#b91c1c', '#1d4ed8', '#047857', '#7c3aed', '#d97706', '#0f766e', '#be185d', '#334155'];
const BG = [
  ['#7c3aed', '#1e1b4b'],
  ['#e11d48', '#3b0a1a'],
  ['#0284c7', '#0c1f3a'],
  ['#d97706', '#3a1a05'],
  ['#059669', '#06261c'],
];
const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

export function makeAvatar(r) {
  const bg = pick(r, BG);
  return {
    skin: pick(r, SKIN),
    hair: pick(r, HAIR),
    shirt: pick(r, SHIRT),
    bg1: bg[0],
    bg2: bg[1],
    hairStyle: Math.floor(r() * 4),
    beard: r() < 0.3,
    glasses: r() < 0.25,
    bindi: r() < 0.25,
  };
}

function randomName(r, len = 10) {
  let s = '';
  for (let i = 0; i < len; i++) s += ALNUM[Math.floor(r() * ALNUM.length)];
  return s;
}

export function createBots() {
  const r = rng(20260617);
  const bots = [];
  for (let i = 0; i < 20; i++) {
    const avatar = makeAvatar(r);
    if (i % 10 === 0) avatar.hairStyle = 1;
    bots.push({
      id: `bot${i}`,
      sidebar: i < 10 ? 'left' : 'right',
      name: randomName(r),
      balance: Math.round((60000 + r() * 840000) / 10) * 10,
      bet: zero(),
      avatar,
    });
  }
  return bots;
}

export function makeUserAvatar() {
  return {
    skin: '#e0ac82',
    hair: '#1a1109',
    shirt: '#b91c1c',
    bg1: '#e11d48',
    bg2: '#3b0a1a',
    hairStyle: 1,
    beard: false,
    glasses: false,
    bindi: true,
  };
}

const weighted = (pairs) => {
  const total = pairs.reduce((s, p) => s + p[1], 0);
  let x = Math.random() * total;
  for (const [v, w] of pairs) {
    x -= w;
    if (x <= 0) return v;
  }
  return pairs[0][0];
};

export function pickBotBet(bots, weightsOverride) {
  const eligible = bots.filter((b) => b.balance >= 10000);
  if (!eligible.length) return null;
  const bot = eligible[Math.floor(Math.random() * eligible.length)];
  const side = weighted(
    weightsOverride
      ? [
          ['dragon', weightsOverride.dragon || 46],
          ['tiger', weightsOverride.tiger || 46],
          ['tie', weightsOverride.tie || 8],
        ]
      : [
          ['dragon', 46],
          ['tiger', 46],
          ['tie', 8],
        ]
  );
  const chip = weighted([
    [10, 22],
    [50, 28],
    [100, 26],
    [500, 16],
    [1000, 8],
  ]);
  const mult = side === 'tie' ? weighted([[1, 5], [2, 3], [5, 2]]) : weighted([[1, 4], [5, 4], [10, 3], [25, 2], [50, 1]]);
  let amount = chip * mult;
  if (amount > bot.balance) amount = chip;
  return { bot, side, chip, amount };
}
