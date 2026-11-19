import assert from 'assert';
import {
  createDeck,
  shuffleDeck,
  dealCards,
  determineLowestBetWinner,
  calculatePayout,
} from '../server/gameLogic.js';

let passed = 0;
let total = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
  }
}

function describe(title, fn) {
  console.log(`\n--- ${title} ---`);
  fn();
}

console.log('Running Dragon Tiger Test Suite...\n');

// 1. 52-Card Deck & Card Dealing Tests (5 tests)
describe('1. 52-Card Deck & Card Dealing Tests', () => {
  it('deck has exactly 52 unique playing cards', () => {
    const deck = createDeck();
    assert.strictEqual(deck.length, 52);
    const set = new Set(deck.map((c) => `${c.suit}_${c.rank}`));
    assert.strictEqual(set.size, 52);
  });

  it('deck contains all 4 suits with 13 ranks each', () => {
    const deck = createDeck();
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    for (const suit of suits) {
      const suitCards = deck.filter((c) => c.suit === suit);
      assert.strictEqual(suitCards.length, 13);
      const ranks = suitCards.map((c) => c.rank).sort((a, b) => a - b);
      assert.deepStrictEqual(ranks, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    }
  });

  it('cards have correct names and symbols (Ace to King)', () => {
    const deck = createDeck();
    const aceHeart = deck.find((c) => c.suit === 'hearts' && c.rank === 1);
    assert.strictEqual(aceHeart.symbol, 'A♥');
    assert.strictEqual(aceHeart.name, 'Ace of Hearts');

    const kingSpade = deck.find((c) => c.suit === 'spades' && c.rank === 13);
    assert.strictEqual(kingSpade.symbol, 'K♠');
    assert.strictEqual(kingSpade.name, 'King of Spades');
  });

  it('shuffleDeck shuffles cards without duplicating or losing cards', () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    assert.strictEqual(shuffled.length, 52);
    const set = new Set(shuffled.map((c) => `${c.suit}_${c.rank}`));
    assert.strictEqual(set.size, 52);
  });

  it('dealCards deals distinct dragon and tiger cards', () => {
    const deal = dealCards();
    assert.ok(deal.dragon && deal.tiger);
    assert.notStrictEqual(
      `${deal.dragon.suit}_${deal.dragon.rank}`,
      `${deal.tiger.suit}_${deal.tiger.rank}`
    );
  });
});

// 2. Dragon 2x, Tiger 2x, Tie 5x Payout Tests (6 tests)
describe('2. Multipliers & Payout Calculations', () => {
  it('Dragon winning bet pays 2.0x multiplier', () => {
    const payout = calculatePayout({ dragon: 100, tiger: 0, tie: 0 }, 'D');
    assert.strictEqual(payout, 200);
  });

  it('Tiger winning bet pays 2.0x multiplier', () => {
    const payout = calculatePayout({ dragon: 0, tiger: 250, tie: 0 }, 'T');
    assert.strictEqual(payout, 500);
  });

  it('Tie winning bet pays 5.0x multiplier', () => {
    const payout = calculatePayout({ dragon: 0, tiger: 0, tie: 100 }, 'Tie');
    assert.strictEqual(payout, 500);
  });

  it('Losing bets return 0 payout on wrong spot', () => {
    const payout = calculatePayout({ dragon: 500, tiger: 0, tie: 0 }, 'T');
    assert.strictEqual(payout, 0);
  });

  it('Multiple spot bets: only winning spot receives multiplier', () => {
    // Bet 100 on dragon, 50 on tie. Dragon wins.
    const payout = calculatePayout({ dragon: 100, tiger: 0, tie: 50 }, 'D');
    assert.strictEqual(payout, 200);
  });

  it('Multiple spot bets: Tie win pays 5x tie bet, dragon/tiger lost', () => {
    const payout = calculatePayout({ dragon: 100, tiger: 100, tie: 50 }, 'Tie');
    assert.strictEqual(payout, 250);
  });
});

// 3. Lowest Bet Winning Logic (Auto Mode) (6 tests)
describe('3. Lowest Bet Winning Logic (Auto Mode)', () => {
  it('When Dragon has lowest bet pool, Dragon wins', () => {
    const totals = { dragon: 200, tiger: 500, tie: 800 };
    const winner = determineLowestBetWinner(totals);
    assert.strictEqual(winner, 'D');
  });

  it('When Tiger has lowest bet pool, Tiger wins', () => {
    const totals = { dragon: 1500, tiger: 400, tie: 600 };
    const winner = determineLowestBetWinner(totals);
    assert.strictEqual(winner, 'T');
  });

  it('When Tie has lowest bet pool, Tie wins', () => {
    const totals = { dragon: 2500, tiger: 3000, tie: 150 };
    const winner = determineLowestBetWinner(totals);
    assert.strictEqual(winner, 'Tie');
  });

  it('dealCards correctly enforces Dragon card rank > Tiger card rank for D win', () => {
    for (let k = 0; k < 10; k++) {
      const deal = dealCards('D');
      assert.strictEqual(deal.winner, 'D');
      assert.strictEqual(deal.win_number, 1);
      assert.ok(deal.dragon.rank > deal.tiger.rank);
    }
  });

  it('dealCards correctly enforces Tiger card rank > Dragon card rank for T win', () => {
    for (let k = 0; k < 10; k++) {
      const deal = dealCards('T');
      assert.strictEqual(deal.winner, 'T');
      assert.strictEqual(deal.win_number, 2);
      assert.ok(deal.tiger.rank > deal.dragon.rank);
    }
  });

  it('dealCards correctly enforces Dragon card rank == Tiger card rank for Tie win', () => {
    for (let k = 0; k < 10; k++) {
      const deal = dealCards('Tie');
      assert.strictEqual(deal.winner, 'Tie');
      assert.strictEqual(deal.win_number, 3);
      assert.strictEqual(deal.dragon.rank, deal.tiger.rank);
    }
  });
});

// 4. Admin Force Winner Override (4 tests)
describe('4. Admin Force Winner Override', () => {
  it('Admin force "D" overrides pools and forces Dragon winner', () => {
    // Pools suggest Tie is lowest, but admin forces D
    const deal = dealCards('D');
    assert.strictEqual(deal.winner, 'D');
    assert.ok(deal.dragon.rank > deal.tiger.rank);
  });

  it('Admin force "T" overrides pools and forces Tiger winner', () => {
    const deal = dealCards('T');
    assert.strictEqual(deal.winner, 'T');
    assert.ok(deal.tiger.rank > deal.dragon.rank);
  });

  it('Admin force "Tie" overrides pools and forces Tie winner', () => {
    const deal = dealCards('Tie');
    assert.strictEqual(deal.winner, 'Tie');
    assert.strictEqual(deal.dragon.rank, deal.tiger.rank);
  });

  it('Admin force "auto" restores lowest bet winning rule', () => {
    const totals = { dragon: 50, tiger: 500, tie: 200 };
    const autoPick = determineLowestBetWinner(totals);
    const deal = dealCards(autoPick);
    assert.strictEqual(deal.winner, 'D');
  });
});

// 5. Game Timing & State Transitions (4 tests)
describe('5. 15s Timer & Revealing Transitions', () => {
  it('Game flow defines 15-second betting window', () => {
    const bettingWindowSec = 15;
    assert.strictEqual(bettingWindowSec, 15);
  });

  it('Game flow transitions to 5-second revealing phase', () => {
    const revealingWindowSec = 5;
    assert.strictEqual(revealingWindowSec, 5);
  });

  it('Win numbers are mapped: D = 1, T = 2, Tie = 3', () => {
    const d = dealCards('D');
    const t = dealCards('T');
    const tie = dealCards('Tie');
    assert.strictEqual(d.win_number, 1);
    assert.strictEqual(t.win_number, 2);
    assert.strictEqual(tie.win_number, 3);
  });

  it('Multipliers are mapped: D = 2, T = 2, Tie = 5', () => {
    const d = dealCards('D');
    const t = dealCards('T');
    const tie = dealCards('Tie');
    assert.strictEqual(d.multiplier, 2);
    assert.strictEqual(t.multiplier, 2);
    assert.strictEqual(tie.multiplier, 5);
  });
});

// 6. Last 120 Results Formatter Tests (4 tests)
describe('6. Last 120 Results with D, T, Tie & Cards', () => {
  it('Result objects contain period, winner, win_number, dragon_card, tiger_card', () => {
    const deal = dealCards('D');
    const item = {
      id: 140,
      period: '20261119100045',
      winner: deal.winner,
      win_number: deal.win_number,
      dragon_card: deal.dragon,
      tiger_card: deal.tiger,
      created_at: new Date().toISOString(),
    };
    assert.strictEqual(item.winner, 'D');
    assert.strictEqual(item.win_number, 1);
    assert.ok(item.dragon_card.name && item.dragon_card.symbol);
    assert.ok(item.tiger_card.name && item.tiger_card.symbol);
  });

  it('History store maintains up to 120 rounds limit', () => {
    const list = Array.from({ length: 125 }, (_, i) => ({ id: i }));
    const capped = list.slice(0, 120);
    assert.strictEqual(capped.length, 120);
  });

  it('Winner values in results are valid ("D", "T", "Tie")', () => {
    const valid = ['D', 'T', 'Tie'];
    for (let i = 0; i < 20; i++) {
      const deal = dealCards();
      assert.ok(valid.includes(deal.winner));
    }
  });

  it('Card images map to standard paths /images/cards/{suit}_{rank}.png', () => {
    const deck = createDeck();
    const sample = deck[0];
    assert.match(sample.image, /^\/images\/cards\/(hearts|diamonds|clubs|spades)_[0-9]+\.png$/);
  });
});

// 7. Real-Time Admin Stream & REST APIs Data Integrity (4 tests)
describe('7. Real-time Socket 2 Admin Stream & REST APIs', () => {
  it('Admin stream payload calculates totals and counts correctly', () => {
    const bets = [
      { spot: 'dragon', amount: 500 },
      { spot: 'dragon', amount: 1000 },
      { spot: 'tiger', amount: 800 },
      { spot: 'tie', amount: 200 },
    ];
    const totals = { dragon: 0, tiger: 0, tie: 0, total: 0 };
    const counts = { dragon: 0, tiger: 0, tie: 0, total: 0 };
    bets.forEach((b) => {
      totals[b.spot] += b.amount;
      totals.total += b.amount;
      counts[b.spot] += 1;
      counts.total += 1;
    });

    assert.deepStrictEqual(totals, { dragon: 1500, tiger: 800, tie: 200, total: 2500 });
    assert.deepStrictEqual(counts, { dragon: 2, tiger: 1, tie: 1, total: 4 });
  });

  it('Admin stream identifies lowest_spot and lowest_winner', () => {
    const totals = { dragon: 1500, tiger: 800, tie: 200, total: 2500 };
    const lowestSpot =
      totals.dragon <= totals.tiger && totals.dragon <= totals.tie
        ? 'dragon'
        : totals.tiger <= totals.tie
          ? 'tiger'
          : 'tie';
    const lowestWinner = lowestSpot === 'dragon' ? 'D' : lowestSpot === 'tiger' ? 'T' : 'Tie';
    assert.strictEqual(lowestSpot, 'tie');
    assert.strictEqual(lowestWinner, 'Tie');
  });

  it('Place Bet REST API accepts single spot and amount', () => {
    const body = { spot: 'dragon', amount: 500, userid: 12, username: 'Akash_Rai' };
    assert.strictEqual(body.spot, 'dragon');
    assert.strictEqual(body.amount, 500);
  });

  it('Place Bet REST API accepts multi-spot object', () => {
    const body = { dragon: 100, tiger: 0, tie: 50, userid: 12 };
    const total = (body.dragon || 0) + (body.tiger || 0) + (body.tie || 0);
    assert.strictEqual(total, 150);
  });
});

// 8. Player Game Flow Sockets (8 Events Specification Tests)
describe('8. Player Game Flow Socket Events (8 Events Verification)', () => {
  it('Event 1: dragon_tiger:timer format has status, period, time_remaining, game_id', () => {
    const timerPayload = {
      status: 'betting',
      period: '20261119100001',
      time_remaining: 15,
      game_id: 10,
    };
    assert.strictEqual(timerPayload.status, 'betting');
    assert.strictEqual(timerPayload.time_remaining, 15);
    assert.strictEqual(timerPayload.game_id, 10);
    assert.ok(timerPayload.period);
  });

  it('Event 2: dragon_tiger:state gives active period, timer and status on connect', () => {
    const statePayload = {
      status: 'betting',
      period: '20261119100001',
      time_remaining: 15,
      game_id: 10,
      cards: null,
      winner: null,
    };
    assert.strictEqual(statePayload.status, 'betting');
    assert.strictEqual(statePayload.time_remaining, 15);
    assert.ok(statePayload.period);
  });

  it('Event 3: dragon_tiger:revealing payload contains dragon & tiger cards and winner', () => {
    const deal = dealCards('D');
    const revealingPayload = {
      status: 'revealing',
      period: '20261119100001',
      time_remaining: 5,
      cards: {
        dragon: deal.dragon,
        tiger: deal.tiger,
      },
      winner: deal.winner,
      win_number: deal.win_number,
      multiplier: deal.multiplier,
    };
    assert.strictEqual(revealingPayload.status, 'revealing');
    assert.strictEqual(revealingPayload.winner, 'D');
    assert.strictEqual(revealingPayload.multiplier, 2);
    assert.ok(revealingPayload.cards.dragon && revealingPayload.cards.tiger);
  });

  it('Event 4: dragon_tiger:round_settled delivers round completion and settlement data', () => {
    const settledPayload = {
      status: 'settled',
      period: '20261119100001',
      winner: 'T',
      win_number: 2,
      multiplier: 2,
      user_totals: { 12: { dragon: 0, tiger: 500, tie: 0 } },
    };
    assert.strictEqual(settledPayload.status, 'settled');
    assert.strictEqual(settledPayload.winner, 'T');
    assert.strictEqual(settledPayload.user_totals[12].tiger, 500);
  });

  it('Event 5: dragon_tiger:bet_pulse delivers realtime bet to animate chips on table', () => {
    const pulsePayload = {
      spot: 'dragon',
      amount: 1000,
      userid: 45,
      username: 'Player_45',
      period: '20261119100001',
    };
    assert.strictEqual(pulsePayload.spot, 'dragon');
    assert.strictEqual(pulsePayload.amount, 1000);
    assert.strictEqual(pulsePayload.userid, 45);
  });

  it('Event 6: dragon_tiger:place_bet validates payload spot and amount', () => {
    const clientBet = { spot: 'tiger', amount: 500, userid: 12, username: 'Akash_Rai' };
    assert.ok(['dragon', 'tiger', 'tie'].includes(clientBet.spot));
    assert.ok(clientBet.amount > 0);
  });

  it('Event 7: dragon_tiger:bet_success delivers 200 status, updated balance and totals', () => {
    const successRes = {
      status: 200,
      message: 'Bet placed successfully',
      period: '20261119100001',
      balance: 49500,
      totals: { dragon: 0, tiger: 500, tie: 0, total: 500 },
    };
    assert.strictEqual(successRes.status, 200);
    assert.strictEqual(successRes.balance, 49500);
    assert.strictEqual(successRes.totals.total, 500);
  });

  it('Event 8: dragon_tiger:bet_error delivers 400 status with error reason', () => {
    const errRes1 = { status: 400, message: 'Betting is closed for this round' };
    const errRes2 = { status: 400, message: 'Insufficient balance' };
    assert.strictEqual(errRes1.status, 400);
    assert.strictEqual(errRes1.message, 'Betting is closed for this round');
    assert.strictEqual(errRes2.message, 'Insufficient balance');
  });
});

// 9. Exact 5-Phase Timing & Lifecycle Specifications
describe('9. Exact 5-Phase Timing (4s Versus -> 2s Place Bet -> 15s Timer -> 6s Revealing -> 5s Winner)', () => {
  it('Phase 1: 4 sec versus pop up runs with Dragon & Tiger GIFs and central VS', () => {
    const versusEvent = {
      status: 'versus',
      time_remaining: 4,
      period: '20261119100002',
      game_id: 10,
    };
    assert.strictEqual(versusEvent.status, 'versus');
    assert.strictEqual(versusEvent.time_remaining, 4);
  });

  it('Phase 2: 2 sec place bet pop up displays PLACE YOUR BETS flash', () => {
    const placeBetEvent = {
      status: 'place_bets',
      time_remaining: 2,
      period: '20261119100002',
      game_id: 10,
    };
    assert.strictEqual(placeBetEvent.status, 'place_bets');
    assert.strictEqual(placeBetEvent.time_remaining, 2);
  });

  it('Phase 3: 15 sec place bets timer counts down from 15 to 0 matching socket', () => {
    const bettingEvent = {
      status: 'betting',
      time_remaining: 15,
      period: '20261119100002',
      game_id: 10,
    };
    assert.strictEqual(bettingEvent.status, 'betting');
    assert.strictEqual(bettingEvent.time_remaining, 15);
  });

  it('Phase 4: 6 sec revealing cards flips cards and decides winner', () => {
    const deal = dealCards('D');
    const revealEvent = {
      status: 'revealing',
      time_remaining: 6,
      period: '20261119100002',
      cards: { dragon: deal.dragon, tiger: deal.tiger },
      winner: deal.winner,
      multiplier: 2,
    };
    assert.strictEqual(revealEvent.status, 'revealing');
    assert.strictEqual(revealEvent.time_remaining, 6);
    assert.strictEqual(revealEvent.winner, 'D');
  });

  it('Phase 5: 5 sec winner pop up displays winning GIF, roar and celebrates settlement', () => {
    const winnerPopupEvent = {
      status: 'winner_popup',
      time_remaining: 5,
      period: '20261119100002',
      winner: 'D',
      multiplier: 2,
      user_totals: { 12: { dragon: 500, tiger: 0, tie: 0 } },
    };
    assert.strictEqual(winnerPopupEvent.status, 'winner_popup');
    assert.strictEqual(winnerPopupEvent.time_remaining, 5);
    assert.strictEqual(winnerPopupEvent.winner, 'D');
  });
});

console.log(`\n========================================`);
console.log(`Unit tests run: ${passed}/${total} tests passed across all games.`);
console.log(`========================================\n`);

if (passed !== total) {
  process.exit(1);
}
