export const SUITS = [
  { key: 'hearts', sym: '♥', red: true },
  { key: 'diamonds', sym: '♦', red: true },
  { key: 'spades', sym: '♠', red: false },
  { key: 'clubs', sym: '♣', red: false },
];

export const RANK_LABELS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Ace is low (1), King is high (13)
export function drawCard() {
  return {
    rank: 1 + Math.floor(Math.random() * 13),
    suit: SUITS[Math.floor(Math.random() * 4)],
  };
}

export function compareCards(dragon, tiger) {
  if (dragon.rank > tiger.rank) return 'dragon';
  if (tiger.rank > dragon.rank) return 'tiger';
  return 'tie';
}

export function drawPair(forced) {
  if (forced === 'tiger') {
    const dRank = 1 + Math.floor(Math.random() * 8); // 1 to 8
    const tRank = dRank + 1 + Math.floor(Math.random() * (13 - dRank)); // > dRank
    return {
      dragon: { rank: dRank, suit: SUITS[Math.floor(Math.random() * 4)] },
      tiger: { rank: tRank, suit: SUITS[Math.floor(Math.random() * 4)] },
    };
  }
  if (forced === 'dragon') {
    const tRank = 1 + Math.floor(Math.random() * 8);
    const dRank = tRank + 1 + Math.floor(Math.random() * (13 - tRank));
    return {
      dragon: { rank: dRank, suit: SUITS[Math.floor(Math.random() * 4)] },
      tiger: { rank: tRank, suit: SUITS[Math.floor(Math.random() * 4)] },
    };
  }
  if (forced === 'tie') {
    const rank = 1 + Math.floor(Math.random() * 13);
    const s1 = Math.floor(Math.random() * 4);
    const s2 = (s1 + 1 + Math.floor(Math.random() * 3)) % 4;
    return {
      dragon: { rank, suit: SUITS[s1] },
      tiger: { rank, suit: SUITS[s2] },
    };
  }
  return { dragon: drawCard(), tiger: drawCard() };
}
