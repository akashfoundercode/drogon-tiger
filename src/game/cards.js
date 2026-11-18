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
