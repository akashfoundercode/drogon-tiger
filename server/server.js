import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { dealCards, determineLowestBetWinner, calculatePayout } from './gameLogic.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Namespaces as specified
const playerNamespace = io.of('/dragon-tiger');
const adminNamespace = io.of('/dragon-tiger-admin');

// State Store
let gameId = 10;
let currentPeriod = generatePeriod();
let status = 'versus'; // 'versus' (4s) | 'place_bets' (2s) | 'betting' (15s) | 'revealing' (6s) | 'winner_popup' (5s)
let timeRemaining = 4;
let adminForceWinner = 'auto'; // 'auto' | 'D' | 'T' | 'Tie'

// Current round bets
let currentRoundBets = []; // Array of { id, userid, username, spot, amount, created_at }
let totals = { dragon: 0, tiger: 0, tie: 0, total: 0 };
let counts = { dragon: 0, tiger: 0, tie: 0, total: 0 };
let currentCards = null;
let currentWinner = null;
let currentWinNumber = null;
let currentMultiplier = null;

// User balances and bet history
const userBalances = new Map(); // userid -> balance (starts with default 50000)
const userBetHistory = new Map(); // userid -> array of bet objects

// Seed Last 120 results
const last120Results = [];
function generatePeriod(offset = 0) {
  const now = new Date(Date.now() - offset * 20000);
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const h = pad(now.getHours());
  const min = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  return `${y}${m}${d}${h}${min}${s}`;
}

// Generate initial 120 results
for (let i = 120; i >= 1; i--) {
  const deal = dealCards(null);
  const dt = new Date(Date.now() - i * 20000).toISOString();
  last120Results.push({
    id: 100 + (120 - i + 1),
    period: generatePeriod(i),
    winner: deal.winner,
    win_number: deal.win_number,
    dragon_card: {
      rank: deal.dragon.rank,
      suit: deal.dragon.suit,
      symbol: deal.dragon.symbol,
      name: deal.dragon.name,
      image: deal.dragon.image,
    },
    tiger_card: {
      rank: deal.tiger.rank,
      suit: deal.tiger.suit,
      symbol: deal.tiger.symbol,
      name: deal.tiger.name,
      image: deal.tiger.image,
    },
    created_at: dt,
  });
}

function formatSettledCard(card, fallbackId, fallbackRank, fallbackLabel, fallbackSuit, fallbackSymbol, fallbackColor, fallbackName, fallbackImg) {
  if (!card) {
    return {
      id: fallbackId,
      rank: fallbackRank,
      label: fallbackLabel,
      suit: fallbackSuit,
      symbol: fallbackSymbol,
      colour: fallbackColor,
      name: fallbackName,
      image: fallbackImg,
    };
  }
  const suit = String(typeof card.suit === 'object' ? card.suit.key || card.suit.name : card.suit).toLowerCase();
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const labelMap = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  const label = labelMap[card.rank] || String(card.rank);
  const cardNum = card.card_number || card.id || 1;
  return {
    id: cardNum,
    rank: card.rank,
    label,
    suit,
    symbol: card.symbol || `${label}${suit === 'hearts' ? '♥' : suit === 'diamonds' ? '♦' : suit === 'clubs' ? '♣' : '♠'}`,
    colour: isRed ? 'red' : 'black',
    name: card.name || `${label} of ${suit}`,
    image: card.image || `/images/cards/${suit}_${card.rank}.png`,
  };
}

let lastSettled = {
  games_no: last120Results[0]?.period || '20261120100534',
  winner: 'Tie',
  win_number: 3,
  multiplier: 5,
  cards: {
    dragon: {
      id: 39,
      rank: 13,
      label: 'K',
      suit: 'clubs',
      symbol: 'K♣',
      colour: 'black',
      name: 'King of Clubs',
      image: '/images/cards/clubs_13.png',
    },
    tiger: {
      id: 52,
      rank: 13,
      label: 'K',
      suit: 'diamonds',
      symbol: 'K♦',
      colour: 'red',
      name: 'King of Diamonds',
      image: '/images/cards/diamonds_13.png',
    },
  },
};

function getUserBalance(userid) {
  if (!userBalances.has(userid)) {
    userBalances.set(userid, 50000);
  }
  return userBalances.get(userid);
}

function setUserBalance(userid, balance) {
  userBalances.set(userid, balance);
}

function setupRoundOutcome() {
  let targetWinner = adminForceWinner;
  if (!targetWinner || targetWinner === 'auto') {
    targetWinner = determineLowestBetWinner(totals);
  }
  const outcome = dealCards(targetWinner);
  currentWinner = outcome.winner;
  currentWinNumber = outcome.win_number;
  currentMultiplier = outcome.multiplier;
  currentCards = {
    dragon: outcome.dragon,
    tiger: outcome.tiger,
  };
  return outcome;
}

// Initialize active round outcome
setupRoundOutcome();

// Broadcast game state to Player Socket (both namespace & root event)
function broadcastPlayerState(payload) {
  const fullPayload = {
    ...payload,
    winner: currentWinner,
    win_number: currentWinNumber,
    cards: currentCards,
    multiplier: currentMultiplier,
    admin_force: adminForceWinner || 'auto',
  };

  // 1. dragon_tiger:state broadcast (Timer and game phase updates)
  playerNamespace.emit('dragon_tiger:state', fullPayload);
  io.emit('dragon_tiger:state', fullPayload);

  // 2. dragon_tiger:result broadcast (Final round result and revealed cards)
  if (payload.status === 'revealing' || payload.status === 'winner_popup') {
    playerNamespace.emit('dragon_tiger:result', fullPayload);
    io.emit('dragon_tiger:result', fullPayload);
  }

  // dragon_tiger:timer broadcast (legacy compatibility)
  const timerPayload = {
    status: payload.status,
    period: payload.period,
    time_remaining: payload.time_remaining,
    game_id: payload.game_id || gameId,
  };
  playerNamespace.emit('dragon_tiger:timer', timerPayload);
  io.emit('dragon_tiger:timer', timerPayload);

  // dragon_tiger:revealing broadcast (legacy compatibility)
  if (payload.status === 'revealing') {
    playerNamespace.emit('dragon_tiger:revealing', fullPayload);
    io.emit('dragon_tiger:revealing', fullPayload);
  }

  // Generic game_state & status event compatibility
  playerNamespace.emit('game_state', fullPayload);
  playerNamespace.emit(payload.status, fullPayload);
}

function broadcastAdminForce(winner) {
  const targetWinner = !winner || winner === 'auto' ? determineLowestBetWinner(totals) : winner;
  const outcome = dealCards(targetWinner);
  currentWinner = outcome.winner;
  currentWinNumber = outcome.win_number;
  currentMultiplier = outcome.multiplier;
  currentCards = {
    dragon: outcome.dragon,
    tiger: outcome.tiger,
  };
  const forcePayload = {
    winner,
    admin_force: winner,
    cards: currentCards,
    win_number: outcome.win_number,
    multiplier: outcome.multiplier,
    period: currentPeriod,
  };
  playerNamespace.emit('dragon_tiger:force', forcePayload);
  io.emit('dragon_tiger:force', forcePayload);
}

// Broadcast live bets to Admin Socket
function broadcastAdminStream(latestBet = null) {
  const lowestSpot = totals.dragon <= totals.tiger && totals.dragon <= totals.tie ? 'dragon' : totals.tiger <= totals.tie ? 'tiger' : 'tie';
  const lowestWinner = lowestSpot === 'dragon' ? 'D' : lowestSpot === 'tiger' ? 'T' : 'Tie';

  const payload = {
    period: currentPeriod,
    game_id: gameId,
    latest_bet: latestBet,
    totals: { ...totals },
    counts: { ...counts },
    lowest_spot: lowestSpot,
    lowest_winner: lowestWinner,
  };

  adminNamespace.emit('dragon_tiger:admin:stream', payload);
  if (latestBet) {
    adminNamespace.emit('dragon_tiger:admin:bet_placed', payload);
  }
  io.emit('dragon_tiger:admin:stream', payload);
}

// 1. 4s Versus -> 2. 2s Place Bet -> 3. 15s Betting -> 4. 6s Revealing -> 5. 5s Winner Pop up
let loopInterval = null;

export function startGameloop() {
  if (loopInterval) clearInterval(loopInterval);

  loopInterval = setInterval(() => {
    // -------------------------------------------------------------
    // Phase 1: 4 sec Versus Pop up (Dragon GIF left, Tiger GIF right, VS center)
    // -------------------------------------------------------------
    if (status === 'versus' || status === 'idle') {
      timeRemaining--;

      const versusPayload = {
        status: 'versus',
        period: currentPeriod,
        time_remaining: timeRemaining,
        game_id: gameId,
      };
      broadcastPlayerState(versusPayload);

      if (timeRemaining <= 0) {
        // Transition to Phase 2: 2 sec Place Bet Pop up
        status = 'place_bets';
        timeRemaining = 2;

        const pbPayload = {
          status: 'place_bets',
          period: currentPeriod,
          time_remaining: 2,
          game_id: gameId,
        };
        broadcastPlayerState(pbPayload);
      }
    }
    // -------------------------------------------------------------
    // Phase 2: 2 sec Place Bet Pop up ("PLACE YOUR BETS" flash)
    // -------------------------------------------------------------
    else if (status === 'place_bets') {
      timeRemaining--;

      const pbPayload = {
        status: 'place_bets',
        period: currentPeriod,
        time_remaining: timeRemaining,
        game_id: gameId,
      };
      broadcastPlayerState(pbPayload);

      if (timeRemaining <= 0) {
        // Transition to Phase 3: 15 sec Place Bets Timer
        status = 'betting';
        timeRemaining = 15;

        const bettingPayload = {
          status: 'betting',
          period: currentPeriod,
          time_remaining: 15,
          game_id: gameId,
        };
        broadcastPlayerState(bettingPayload);
        broadcastAdminStream(null);
      }
    }
    // -------------------------------------------------------------
    // Phase 3: 15 sec Place Bets Timer (Active Betting Window)
    // -------------------------------------------------------------
    else if (status === 'betting') {
      timeRemaining--;

      const bettingPayload = {
        status: 'betting',
        period: currentPeriod,
        time_remaining: timeRemaining,
        game_id: gameId,
      };
      broadcastPlayerState(bettingPayload);

      if (timeRemaining <= 0) {
        // Transition to Phase 4: 6 sec Revealing Cards Winner Decide
        status = 'revealing';
        timeRemaining = 6;

        // Determine winner based on auto mode (lowest bet pool) or admin force
        let targetWinner = adminForceWinner;
        if (!targetWinner || targetWinner === 'auto') {
          targetWinner = determineLowestBetWinner(totals);
        }

        const outcome = dealCards(targetWinner);
        currentCards = {
          dragon: outcome.dragon,
          tiger: outcome.tiger,
        };
        currentWinner = outcome.winner;
        currentWinNumber = outcome.win_number;
        currentMultiplier = outcome.multiplier;

        const revealingPayload = {
          status: 'revealing',
          period: currentPeriod,
          time_remaining: timeRemaining,
          cards: currentCards,
          winner: currentWinner,
          win_number: currentWinNumber,
          multiplier: currentMultiplier,
        };
        broadcastPlayerState(revealingPayload);
      }
    }
    // -------------------------------------------------------------
    // Phase 4: 6 sec Revealing Cards Winner Decide
    // -------------------------------------------------------------
    else if (status === 'revealing') {
      timeRemaining--;

      const revealingPayload = {
        status: 'revealing',
        period: currentPeriod,
        time_remaining: timeRemaining,
        cards: currentCards,
        winner: currentWinner,
        win_number: currentWinNumber,
        multiplier: currentMultiplier,
      };
      broadcastPlayerState(revealingPayload);

      if (timeRemaining <= 0) {
        // Transition to Phase 5: 5 sec Winner Pop up
        status = 'winner_popup';
        timeRemaining = 5;

        // Settle all user bets & update balances
        const userTotals = {};
        for (const bet of currentRoundBets) {
          if (!userTotals[bet.userid]) {
            userTotals[bet.userid] = { dragon: 0, tiger: 0, tie: 0 };
          }
          userTotals[bet.userid][bet.spot] += bet.amount;
        }

        for (const [uidStr, placedBets] of Object.entries(userTotals)) {
          const uid = Number(uidStr);
          const winAmount = calculatePayout(placedBets, currentWinner);
          if (winAmount > 0) {
            setUserBalance(uid, getUserBalance(uid) + winAmount);
          }
          const history = userBetHistory.get(uid) || [];
          for (const spotName of ['dragon', 'tiger', 'tie']) {
            const amt = placedBets[spotName];
            if (amt > 0) {
              const spotNumber = spotName === 'dragon' ? 1 : spotName === 'tiger' ? 2 : 3;
              const isWon =
                (spotName === 'dragon' && currentWinner === 'D') ||
                (spotName === 'tiger' && currentWinner === 'T') ||
                (spotName === 'tie' && currentWinner === 'Tie');
              const mult = spotName === 'tie' ? 5 : 2;
              const winAmt = isWon ? amt * mult : 0;
              const tradeAmt = (amt * 0.98).toFixed(2);
              history.unshift({
                id: ++betIdCounter,
                games_no: currentPeriod,
                spot: spotName,
                number: spotNumber,
                amount: Number(amt).toFixed(2),
                trade_amount: tradeAmt,
                win_amount: winAmt.toFixed(2),
                status: isWon ? 1 : 2, // 1 = Won, 2 = Lost
                win_number: currentWinNumber,
                created_at: new Date().toISOString(),
              });
            }
          }
          userBetHistory.set(uid, history.slice(0, 100));
        }

        lastSettled = {
          games_no: currentPeriod,
          winner: currentWinner,
          win_number: currentWinNumber,
          multiplier: currentMultiplier,
          cards: {
            dragon: formatSettledCard(
              currentCards?.dragon,
              39,
              13,
              'K',
              'clubs',
              'K♣',
              'black',
              'King of Clubs',
              '/images/cards/clubs_13.png'
            ),
            tiger: formatSettledCard(
              currentCards?.tiger,
              52,
              13,
              'K',
              'diamonds',
              'K♦',
              'red',
              'King of Diamonds',
              '/images/cards/diamonds_13.png'
            ),
          },
        };

        // Record round in last120Results
        const newResult = {
          id: last120Results.length > 0 ? last120Results[0].id + 1 : 1,
          period: currentPeriod,
          winner: currentWinner,
          win_number: currentWinNumber,
          dragon_card: {
            rank: currentCards.dragon.rank,
            suit: currentCards.dragon.suit,
            symbol: currentCards.dragon.symbol,
            name: currentCards.dragon.name,
            image: currentCards.dragon.image,
          },
          tiger_card: {
            rank: currentCards.tiger.rank,
            suit: currentCards.tiger.suit,
            symbol: currentCards.tiger.symbol,
            name: currentCards.tiger.name,
            image: currentCards.tiger.image,
          },
          created_at: new Date().toISOString(),
        };
        last120Results.unshift(newResult);
        if (last120Results.length > 120) {
          last120Results.pop();
        }

        // Broadcast round_settled and winner_popup state
        const settledPayload = {
          status: 'winner_popup',
          period: currentPeriod,
          winner: currentWinner,
          win_number: currentWinNumber,
          multiplier: currentMultiplier,
          cards: currentCards,
          time_remaining: 5,
          user_totals: userTotals,
          created_at: new Date().toISOString(),
        };
        playerNamespace.emit('dragon_tiger:round_settled', settledPayload);
        io.emit('dragon_tiger:round_settled', settledPayload);
        broadcastPlayerState(settledPayload);
      }
    }
    // -------------------------------------------------------------
    // Phase 5: 5 sec Winner Pop up (Winning GIF, Roar & Celebration)
    // -------------------------------------------------------------
    else if (status === 'winner_popup') {
      timeRemaining--;

      const winnerPayload = {
        status: 'winner_popup',
        period: currentPeriod,
        time_remaining: timeRemaining,
        cards: currentCards,
        winner: currentWinner,
        win_number: currentWinNumber,
        multiplier: currentMultiplier,
      };
      broadcastPlayerState(winnerPayload);

      if (timeRemaining <= 0) {
        // Round Finished! Prepare Next Round: Start Phase 1 (4 sec Versus Pop up)
        status = 'versus';
        timeRemaining = 4;
        currentPeriod = generatePeriod();
        currentRoundBets = [];
        totals = { dragon: 0, tiger: 0, tie: 0, total: 0 };
        counts = { dragon: 0, tiger: 0, tie: 0, total: 0 };
        setupRoundOutcome();

        const nextRoundPayload = {
          status: 'versus',
          period: currentPeriod,
          time_remaining: 4,
          game_id: gameId,
        };
        broadcastPlayerState(nextRoundPayload);
        broadcastAdminStream(null);
      }
    }
  }, 1000);
}

// -------------------------------------------------------------
// Sockets Connection Handlers
// -------------------------------------------------------------
playerNamespace.on('connection', (socket) => {
  // Send active round state on connect
  const payload = {
    status,
    period: currentPeriod,
    time_remaining: timeRemaining,
    game_id: gameId,
    cards: currentCards,
    winner: currentWinner,
    win_number: currentWinNumber,
    multiplier: currentMultiplier,
  };
  // 1. dragon_tiger:state on connection
  socket.emit('dragon_tiger:state', payload);
  // 2. dragon_tiger:timer on connection
  socket.emit('dragon_tiger:timer', {
    status,
    period: currentPeriod,
    time_remaining: timeRemaining,
    game_id: gameId,
  });
  socket.emit('game_state', payload);
  socket.emit(status, payload);

  // 6. dragon_tiger:place_bet (Client -> Server)
  socket.on('dragon_tiger:place_bet', (data, cb) => {
    const res = handlePlaceBet(data);
    if (res.status === 200) {
      // 7. dragon_tiger:bet_success
      socket.emit('dragon_tiger:bet_success', res);
    } else {
      // 8. dragon_tiger:bet_error
      socket.emit('dragon_tiger:bet_error', res);
    }
    if (cb) cb(res);
  });

  socket.on('place_bet', (data, cb) => {
    const res = handlePlaceBet(data);
    if (res.status === 200) {
      socket.emit('dragon_tiger:bet_success', res);
    } else {
      socket.emit('dragon_tiger:bet_error', res);
    }
    if (cb) cb(res);
  });
});

adminNamespace.on('connection', (socket) => {
  broadcastAdminStream(null);

  // Admin socket event to force winner in real-time
  socket.on('dragon_tiger:admin:set_control', (data, cb) => {
    const { winner } = data || {};
    if (['D', 'T', 'Tie', 'auto'].includes(winner)) {
      adminForceWinner = winner;
      broadcastAdminForce(winner);
      const res = { status: 200, message: `Admin force winner set to ${winner}`, current_setting: adminForceWinner };
      socket.emit('dragon_tiger:admin:control_success', res);
      if (cb) cb(res);
    } else {
      const err = { status: 400, message: 'Invalid winner option. Use D, T, Tie, or auto' };
      socket.emit('dragon_tiger:admin:control_error', err);
      if (cb) cb(err);
    }
  });
});

// Root namespace connections
io.on('connection', (socket) => {
  socket.emit('dragon_tiger:state', {
    status,
    period: currentPeriod,
    time_remaining: timeRemaining,
    game_id: gameId,
    cards: currentCards,
    winner: currentWinner,
    win_number: currentWinNumber,
    multiplier: currentMultiplier,
  });
});

// -------------------------------------------------------------
// Bet Placement Logic (Shared between Socket & REST)
// -------------------------------------------------------------
let betIdCounter = 100;
function handlePlaceBet({ spot, amount, dragon, tiger, tie, userid = 12, username = 'Akash_Rai' }) {
  if (status !== 'betting' && status !== 'place_bets') {
    return { status: 400, message: 'Betting is closed for this round' };
  }

  const spotNumberMap = { dragon: 1, tiger: 2, tie: 3 };
  const numberSpotMap = { 1: 'dragon', 2: 'tiger', 3: 'tie', '1': 'dragon', '2': 'tiger', '3': 'tie' };

  const betsToPlace = [];
  if (spot !== undefined && spot !== null && amount > 0) {
    let s = String(spot).toLowerCase();
    if (numberSpotMap[s]) s = numberSpotMap[s];
    if (['dragon', 'tiger', 'tie'].includes(s)) {
      betsToPlace.push({ spot: s, amount: Number(amount) });
    }
  } else {
    if (dragon > 0) betsToPlace.push({ spot: 'dragon', amount: Number(dragon) });
    if (tiger > 0) betsToPlace.push({ spot: 'tiger', amount: Number(tiger) });
    if (tie > 0) betsToPlace.push({ spot: 'tie', amount: Number(tie) });
  }

  if (betsToPlace.length === 0) {
    return { status: 400, message: 'Invalid bet parameters' };
  }

  const totalAmount = betsToPlace.reduce((sum, b) => sum + b.amount, 0);
  const currentBal = getUserBalance(userid);
  if (currentBal < totalAmount) {
    return { status: 400, message: 'Insufficient balance' };
  }

  setUserBalance(userid, currentBal - totalAmount);

  let lastPlaced = null;
  for (const b of betsToPlace) {
    totals[b.spot] += b.amount;
    totals.total += b.amount;
    counts[b.spot] += 1;
    counts.total += 1;

    lastPlaced = {
      id: ++betIdCounter,
      userid,
      username,
      spot: b.spot,
      amount: b.amount,
      created_at: new Date().toISOString(),
    };
    currentRoundBets.push(lastPlaced);

    // Record pending bet in userBetHistory
    const history = userBetHistory.get(userid) || [];
    history.unshift({
      id: lastPlaced.id,
      games_no: currentPeriod,
      spot: b.spot,
      number: spotNumberMap[b.spot] || 1,
      amount: Number(b.amount).toFixed(2),
      trade_amount: (b.amount * 0.98).toFixed(2),
      win_amount: '0.00',
      status: 0, // 0 = Pending
      win_number: 0,
      created_at: lastPlaced.created_at,
    });
    userBetHistory.set(userid, history.slice(0, 100));

    // Broadcast dragon_tiger:bet to animate table coins update
    const betPayload = {
      spot: b.spot,
      amount: b.amount,
      userid,
      username,
      period: currentPeriod,
      balance: getUserBalance(userid),
    };
    playerNamespace.emit('dragon_tiger:bet', betPayload);
    io.emit('dragon_tiger:bet', betPayload);

    // Legacy bet_pulse
    playerNamespace.emit('dragon_tiger:bet_pulse', pulsePayload);
    io.emit('dragon_tiger:bet_pulse', pulsePayload);
  }

  broadcastAdminStream(lastPlaced);

  const mainSpot = lastPlaced ? lastPlaced.spot : betsToPlace[0].spot;
  const spotNum = spotNumberMap[mainSpot] || 1;
  const newBalance = getUserBalance(userid);

  return {
    status: 200,
    message: `Bet placed successfully on ${mainSpot}`,
    data: {
      bet_id: lastPlaced ? lastPlaced.id : ++betIdCounter,
      games_no: currentPeriod,
      spot: mainSpot,
      spot_number: spotNum,
      amount: totalAmount,
      wallet_balance: newBalance,
    },
    period: currentPeriod,
    balance: newBalance,
    totals: { ...totals },
    latest_bet: lastPlaced,
  };
}

// -------------------------------------------------------------
// REST API Endpoints as Specified
// -------------------------------------------------------------

// 0. User Login API (https://api.wingo4all.site/api/login)
app.post('/api/login', (req, res) => {
  const { mobile, country_code = '91', password } = req.body || {};
  if (!mobile || !password) {
    return res.status(400).json({ status: 400, message: 'Mobile and password are required' });
  }
  const userid = 12;
  const username = `User_${String(mobile).slice(-4)}`;
  const balance = getUserBalance(userid);
  const token = `dt_token_${Date.now()}_${userid}`;
  return res.json({
    status: 200,
    message: 'Login successful',
    token,
    data: {
      id: userid,
      userid,
      mobile,
      country_code,
      username,
      wallet: balance,
      balance,
      vip_level: 3,
    },
  });
});

// 0.1 User Profile API (https://api.wingo4all.site/api/profile)
app.get('/api/profile', (req, res) => {
  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
    req.headers.token ||
    req.query.token;
  const userid = 12;
  const balance = getUserBalance(userid);
  return res.json({
    status: 200,
    message: 'Profile fetched successfully',
    data: {
      id: userid,
      userid,
      username: 'Akash_Rai',
      mobile: '9876543210',
      wallet: balance,
      balance,
      vip_level: 3,
      token: token || `dt_token_${userid}`,
    },
    wallet: balance,
    balance,
  });
});

// 1. Place Bet (supports /dragon/bet, /dragon_bet, /dragon-tiger/bet and /api/ prefixes)
const placeBetRoutes = [
  '/dragon/bet',
  '/dragon_bet',
  '/dragon-tiger/bet',
  '/api/dragon/bet',
  '/api/dragon_bet',
  '/api/dragon-tiger/bet',
];
const placeBetHandler = (req, res) => {
  const result = handlePlaceBet(req.body || {});
  return res.status(result.status === 200 ? 200 : 400).json(result);
};
placeBetRoutes.forEach((route) => app.post(route, placeBetHandler));

// 2. Current Round State & Timer (/dragon/current-round, /dragon/status, /dragon-tiger/current-round)
const currentRoundRoutes = [
  '/dragon/current-round',
  '/dragon/status',
  '/dragon-tiger/current-round',
  '/api/dragon/current-round',
  '/api/dragon/status',
  '/api/dragon-tiger/current-round',
];
const currentRoundHandler = (req, res) => {
  const phaseDuration =
    status === 'betting'
      ? 15
      : status === 'revealing'
      ? 6
      : status === 'versus'
      ? 4
      : status === 'place_bets'
      ? 2
      : 5;

  const isRevealingOrWinner = status === 'revealing' || status === 'winner_popup';

  const roundData = {
    status: 200,
    period: currentPeriod,
    game_id: gameId,
    phase: status,
    game_status: status,
    time_remaining: timeRemaining,
    phase_duration: phaseDuration,
    admin_force: adminForceWinner || 'auto',
    winner: currentWinner,
    win_number: currentWinNumber,
    cards: currentCards,
    multiplier: currentMultiplier,
    last_settled: lastSettled,
    timings: {
      versus: 4,
      place_bet_popup: 2,
      betting: 15,
      revealing: 6,
      winner_popup: 5,
    },
  };

  res.json({
    ...roundData,
    message: 'Current Dragon Tiger round state',
    data: {
      ...roundData,
      online_count: 94,
    },
  });
};
currentRoundRoutes.forEach((route) => app.get(route, currentRoundHandler));

// 3. Past Results History (/dragon_results, /dragon/results, /dragon-tiger/results)
const resultsRoutes = [
  '/dragon_results',
  '/dragon/results',
  '/dragon-tiger/results',
  '/api/dragon_results',
  '/api/dragon/results',
  '/api/dragon-tiger/results',
];
const resultsHandler = (req, res) => {
  const limit = Math.min(Number(req.query.limit || 10), 120);
  const offset = Number(req.query.offset || 0);

  const formattedResults = last120Results.map((r, i) => {
    const dCard = r.dragon_card || {};
    const tCard = r.tiger_card || {};
    const cardName = `${dCard.symbol || 'K♠'} vs ${tCard.symbol || '7♥'}`;
    const winnerCardImg =
      r.winner === 'T'
        ? tCard.image || '/images/cards/hearts_7.png'
        : dCard.image || '/images/cards/spades_13.png';

    return {
      id: r.id || 19820 - i,
      games_no: r.period,
      number: String(r.win_number || (r.winner === 'D' ? 1 : r.winner === 'T' ? 2 : 3)),
      win_number: String(r.win_number || (r.winner === 'D' ? 1 : r.winner === 'T' ? 2 : 3)),
      card_name: cardName,
      image: winnerCardImg,
      multiplier: Number(r.multiplier || (r.winner === 'Tie' ? 5 : 2)).toFixed(2),
      winner: r.winner,
      created_at: r.created_at || new Date().toISOString(),
    };
  });

  const sliced = formattedResults.slice(offset, offset + limit);
  res.json({
    status: 200,
    message: 'Data found',
    total_result: last120Results.length,
    count: sliced.length,
    data: sliced,
  });
};
resultsRoutes.forEach((route) => app.get(route, resultsHandler));

// 4. My Bet History (/dragon/bet-history, /dragon_bet_history)
const betHistoryRoutes = [
  '/dragon/bet-history',
  '/dragon_bet_history',
  '/api/dragon/bet-history',
  '/api/dragon_bet_history',
];
const betHistoryHandler = (req, res) => {
  const userid = Number(req.query.userid || req.body?.userid || 12);
  const limit = Number(req.query.limit || req.body?.limit || 10);
  const offset = Number(req.query.offset || req.body?.offset || 0);

  const history = userBetHistory.get(userid) || [];
  const sliced = history.slice(offset, offset + limit);
  res.json({
    status: 200,
    message: 'Data found',
    count: sliced.length,
    data: sliced,
  });
};
betHistoryRoutes.forEach((route) => {
  app.get(route, betHistoryHandler);
  app.post(route, betHistoryHandler);
});

// 5. Admin Force Winner
app.post('/api/admin/dragon/control', (req, res) => {
  const { winner } = req.body || {};
  if (!['D', 'T', 'Tie', 'auto'].includes(winner)) {
    return res.status(400).json({ status: 400, message: 'Invalid winner option. Use D, T, Tie, or auto' });
  }
  adminForceWinner = winner;
  broadcastAdminForce(winner);
  res.json({
    status: 200,
    message: `Admin force winner set to ${winner}`,
    current_setting: adminForceWinner,
  });
});

// 6. Admin Live Bets
app.get('/api/admin/dragon/bets', (req, res) => {
  const lowestSpot = totals.dragon <= totals.tiger && totals.dragon <= totals.tie ? 'dragon' : totals.tiger <= totals.tie ? 'tiger' : 'tie';
  res.json({
    status: 200,
    period: currentPeriod,
    game_id: gameId,
    totals,
    counts,
    lowest_spot: lowestSpot,
    lowest_winner: lowestSpot === 'dragon' ? 'D' : lowestSpot === 'tiger' ? 'T' : 'Tie',
    bets: currentRoundBets,
  });
});

// User wallet balance endpoint (convenience for game init)
app.get('/api/user/balance', (req, res) => {
  const userid = Number(req.query.userid || 12);
  res.json({ status: 200, balance: getUserBalance(userid) });
});

export { app, server, io };

// Only listen if run directly
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  startGameloop();
  server.listen(PORT, () => {
    console.log(`Dragon vs Tiger Game Server running on port ${PORT}`);
  });
}
