export const SUITS = [
  { key: 'hearts', sym: '♥', red: true },
  { key: 'diamonds', sym: '♦', red: true },
  { key: 'spades', sym: '♠', red: false },
  { key: 'clubs', sym: '♣', red: false },
];

export const RANK_LABELS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function getCardNumber(rank, suitKey) {
  const suitOffsets = { spades: 1, diamonds: 2, clubs: 3, hearts: 4 };
  const sOff = suitOffsets[suitKey.toLowerCase()] || 1;
  const k = rank === 1 ? 12 : rank - 2;
  return k * 4 + sOff;
}

// Ace is low (1), King is high (13)
export function drawCard() {
  const rank = 1 + Math.floor(Math.random() * 13);
  const suit = SUITS[Math.floor(Math.random() * 4)];
  const cardNum = getCardNumber(rank, suit.key);
  return {
    rank,
    suit,
    symbol: `${RANK_LABELS[rank - 1]}${suit.sym}`,
    card_number: cardNum,
    image: `/cards/${cardNum}.png`,
  };
}

export function compareCards(dragon, tiger) {
  if (dragon.rank > tiger.rank) return 'dragon';
  if (tiger.rank > dragon.rank) return 'tiger';
  return 'tie';
}

function makeCard(rank, suit) {
  const cardNum = getCardNumber(rank, suit.key);
  return {
    rank,
    suit,
    symbol: `${RANK_LABELS[rank - 1]}${suit.sym}`,
    card_number: cardNum,
    image: `/cards/${cardNum}.png`,
  };
}

export function drawPair(forced) {
  if (forced === 'tiger') {
    const dRank = 1 + Math.floor(Math.random() * 8); // 1 to 8
    const tRank = dRank + 1 + Math.floor(Math.random() * (13 - dRank)); // > dRank
    return {
      dragon: makeCard(dRank, SUITS[Math.floor(Math.random() * 4)]),
      tiger: makeCard(tRank, SUITS[Math.floor(Math.random() * 4)]),
    };
  }
  if (forced === 'dragon') {
    const tRank = 1 + Math.floor(Math.random() * 8);
    const dRank = tRank + 1 + Math.floor(Math.random() * (13 - tRank));
    return {
      dragon: makeCard(dRank, SUITS[Math.floor(Math.random() * 4)]),
      tiger: makeCard(tRank, SUITS[Math.floor(Math.random() * 4)]),
    };
  }
  if (forced === 'tie') {
    const rank = 1 + Math.floor(Math.random() * 13);
    const s1 = Math.floor(Math.random() * 4);
    const s2 = (s1 + 1 + Math.floor(Math.random() * 3)) % 4;
    return {
      dragon: makeCard(rank, SUITS[s1]),
      tiger: makeCard(rank, SUITS[s2]),
    };
  }
  return { dragon: drawCard(), tiger: drawCard() };
}
