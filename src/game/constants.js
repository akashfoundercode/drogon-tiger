export const CANVAS_W = 1870;
export const CANVAS_H = 841;

export const PHASES = {
  VERSUS: 'VERSUS',
  PLACE_BETS: 'PLACE_BETS',
  BETTING: 'BETTING',
  CLOSED: 'CLOSED',
  REVEAL: 'REVEAL',
  RESULT: 'RESULT',
  IDLE: 'VERSUS',
};

// Durations in seconds as specified:
// 4s Versus -> 2s Place Bet -> 15s Place Bets Timer -> 6s Revealing -> 5s Winner Pop up
export const TIMING = {
  versus: 4,
  placeBets: 2,
  betting: 15,
  revealing: 6,
  winnerPopup: 5,
  revealDragon: 1600,
  revealTiger: 3600,
  resolve: 5500,
  idle: 4000,
  closed: 2000,
  result: 5000,
};

export const CHIP_VALUES = [10, 50, 100, 500, 1000];

export const CHIP_STYLES = {
  10: { base: '#16a34a', light: '#5bea8a', dark: '#07461f', edge: '#eafff0' },
  50: { base: '#2563eb', light: '#7db4ff', dark: '#10286f', edge: '#e8f1ff' },
  100: { base: '#8b2fd6', light: '#d19bff', dark: '#3d0b6b', edge: '#f6eaff' },
  500: { base: '#ea580c', light: '#ffa862', dark: '#7a2a05', edge: '#fff1e6' },
  1000: { base: '#e0a912', light: '#ffeb99', dark: '#7a5200', edge: '#fffbe6' },
  5000: { base: '#dc2626', light: '#f87171', dark: '#7f1d1d', edge: '#fee2e2' },
};

export const SIDES = {
  dragon: { key: 'dragon', label: 'DRAGON', letter: 'D', emoji: '🐲' },
  tie: { key: 'tie', label: 'TIE', letter: 'Tie', emoji: '🤝' },
  tiger: { key: 'tiger', label: 'TIGER', letter: 'T', emoji: '🐯' },
};

// Total return multiplier on the stake when the side wins (stake included)
export const PAYOUT_MULT = { dragon: 2, tiger: 2, tie: 9 };
// Share of a Dragon/Tiger stake returned when the round ends in a Tie
export const TIE_REFUND_RATE = 0.5;

export const START_BALANCE = 50000;
export const USER_ID = '1000121897';
export const USER_NAME = 'Akash Rai';

// Optional: drop real artwork here (png/webp paths) to replace the built-in vector characters.
export const ART = { dragon: null, tiger: null };
