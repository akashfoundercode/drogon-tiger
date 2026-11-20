// 52 Standard Playing Card Deck Implementation
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_SYMBOLS = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RANK_NAMES = {
  1: 'Ace',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'Jack',
  12: 'Queen',
  13: 'King',
};

const RANK_LETTERS = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K',
};

export function getCardNumber(rank, suitKey) {
  const suitOffsets = { spades: 1, diamonds: 2, clubs: 3, hearts: 4 };
  const sOff = suitOffsets[String(suitKey).toLowerCase()] || 1;
  const k = rank === 1 ? 12 : rank - 2;
  return k * 4 + sOff;
}

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      const rankStr = RANK_LETTERS[rank] || String(rank);
      const symbol = `${rankStr}${SUIT_SYMBOLS[suit]}`;
      const name = `${RANK_NAMES[rank]} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`;
      const cardNum = getCardNumber(rank, suit);
      deck.push({
        rank,
        suit,
        name,
        symbol,
        card_number: cardNum,
        image: `/images/cards/${suit}_${rank}.png`,
        card_url: `/cards/${cardNum}.png`,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deal Dragon vs Tiger cards based on desired outcome ('D', 'T', 'Tie', or null for random)
 */
export function dealCards(desiredWinner = null) {
  const deck = shuffleDeck(createDeck());
  
  if (!desiredWinner || desiredWinner === 'auto') {
    // Pure random draw without outcome enforcement
    const dragon = deck.pop();
    const tiger = deck.pop();
    const winner = dragon.rank > tiger.rank ? 'D' : tiger.rank > dragon.rank ? 'T' : 'Tie';
    return {
      dragon,
      tiger,
      winner,
      win_number: winner === 'D' ? 1 : winner === 'T' ? 2 : 3,
      multiplier: winner === 'Tie' ? 5 : 2,
    };
  }

  // Find two distinct cards in deck that satisfy the desired winner condition
  if (desiredWinner === 'D') {
    // dragon.rank > tiger.rank
    for (let i = 0; i < deck.length; i++) {
      for (let j = 0; j < deck.length; j++) {
        if (i !== j && deck[i].rank > deck[j].rank) {
          return {
            dragon: deck[i],
            tiger: deck[j],
            winner: 'D',
            win_number: 1,
            multiplier: 2,
          };
        }
      }
    }
  } else if (desiredWinner === 'T') {
    // tiger.rank > dragon.rank
    for (let i = 0; i < deck.length; i++) {
      for (let j = 0; j < deck.length; j++) {
        if (i !== j && deck[j].rank > deck[i].rank) {
          return {
            dragon: deck[i],
            tiger: deck[j],
            winner: 'T',
            win_number: 2,
            multiplier: 2,
          };
        }
      }
    }
  } else if (desiredWinner === 'Tie') {
    // dragon.rank === tiger.rank
    for (let i = 0; i < deck.length; i++) {
      for (let j = 0; j < deck.length; j++) {
        if (i !== j && deck[i].rank === deck[j].rank) {
          return {
            dragon: deck[i],
            tiger: deck[j],
            winner: 'Tie',
            win_number: 3,
            multiplier: 5,
          };
        }
      }
    }
  }

  // Fallback
  const d = deck[0];
  const t = deck[1];
  const w = d.rank > t.rank ? 'D' : t.rank > d.rank ? 'T' : 'Tie';
  return {
    dragon: d,
    tiger: t,
    winner: w,
    win_number: w === 'D' ? 1 : w === 'T' ? 2 : 3,
    multiplier: w === 'Tie' ? 5 : 2,
  };
}

/**
 * Determine lowest bet spot among dragon, tiger, and tie
 * Rule: "Jispe sabse kam bet lage wahi jitega match"
 */
export function determineLowestBetWinner(totals) {
  const d = totals.dragon || 0;
  const t = totals.tiger || 0;
  const tie = totals.tie || 0;

  // If no bets placed anywhere, random winner
  if (d === 0 && t === 0 && tie === 0) {
    const rand = Math.random();
    if (rand < 0.45) return 'D';
    if (rand < 0.90) return 'T';
    return 'Tie';
  }

  // Find minimum value
  const min = Math.min(d, t, tie);
  const candidates = [];
  if (d === min) candidates.push('D');
  if (t === min) candidates.push('T');
  if (tie === min) candidates.push('Tie');

  // If multiple candidates share the lowest bet, pick one randomly among them
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return pick;
}

/**
 * Calculate user payout given winner and placed bets
 * Multipliers: Dragon 2.0x, Tiger 2.0x, Tie 5.0x
 */
export function calculatePayout(bets, winner) {
  let payout = 0;
  if (winner === 'D' && bets.dragon > 0) {
    payout += bets.dragon * 2;
  }
  if (winner === 'T' && bets.tiger > 0) {
    payout += bets.tiger * 2;
  }
  if (winner === 'Tie' && bets.tie > 0) {
    payout += bets.tie * 5;
  }
  return payout;
}
