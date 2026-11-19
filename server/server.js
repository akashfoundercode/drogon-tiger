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

function getUserBalance(userid) {
  if (!userBalances.has(userid)) {
    userBalances.set(userid, 50000);
  }
  return userBalances.get(userid);
}

function setUserBalance(userid, balance) {
  userBalances.set(userid, balance);
}

// Broadcast game state to Player Socket (both namespace & root event)
function broadcastPlayerState(payload) {
  // 1. dragon_tiger:timer broadcast
  const timerPayload = {
    status: payload.status,
    period: payload.period,
    time_remaining: payload.time_remaining,
    game_id: payload.game_id || gameId,
  };
  playerNamespace.emit('dragon_tiger:timer', timerPayload);
  io.emit('dragon_tiger:timer', timerPayload);

  // 2. dragon_tiger:state broadcast
  playerNamespace.emit('dragon_tiger:state', payload);
  io.emit('dragon_tiger:state', payload);

  // 3. dragon_tiger:revealing broadcast
  if (payload.status === 'revealing') {
    playerNamespace.emit('dragon_tiger:revealing', payload);
    io.emit('dragon_tiger:revealing', payload);
  }

  // Generic game_state & status event compatibility
  playerNamespace.emit('game_state', payload);
  playerNamespace.emit(payload.status, payload);
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
          history.unshift({
            period: currentPeriod,
            bets: placedBets,
            winner: currentWinner,
            winAmount,
            created_at: new Date().toISOString(),
          });
          userBetHistory.set(uid, history.slice(0, 50));
        }

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
        currentCards = null;
        currentWinner = null;
        currentWinNumber = null;
        currentMultiplier = null;

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

  const betsToPlace = [];
  if (spot && amount > 0) {
    const s = String(spot).toLowerCase();
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

    // 5. Broadcast dragon_tiger:bet_pulse to animate chips on table for all players
    const pulsePayload = {
      spot: b.spot,
      amount: b.amount,
      userid,
      username,
      period: currentPeriod,
    };
    playerNamespace.emit('dragon_tiger:bet_pulse', pulsePayload);
    io.emit('dragon_tiger:bet_pulse', pulsePayload);
  }

  broadcastAdminStream(lastPlaced);

  return {
    status: 200,
    message: 'Bet placed successfully',
    period: currentPeriod,
    balance: getUserBalance(userid),
    totals: { ...totals },
    latest_bet: lastPlaced,
  };
}

// -------------------------------------------------------------
// REST API Endpoints as Specified
// -------------------------------------------------------------

// 1. Place Bet (supports /api/dragon/bet and /api/dragon_bet)
const placeBetHandler = (req, res) => {
  const result = handlePlaceBet(req.body || {});
  return res.status(result.status === 200 ? 200 : 400).json(result);
};
app.post('/api/dragon/bet', placeBetHandler);
app.post('/api/dragon_bet', placeBetHandler);

// 2. Last 120 Results
app.get('/api/dragon/results', (req, res) => {
  res.json({
    status: 200,
    message: 'Data found',
    total_results: last120Results.length,
    data: last120Results,
  });
});

// 3. Current Round
app.get('/api/dragon/current-round', (req, res) => {
  res.json({
    status: 200,
    data: {
      period: currentPeriod,
      game_id: gameId,
      status,
      time_remaining: timeRemaining,
      cards: currentCards,
      winner: currentWinner,
      multiplier: currentMultiplier,
    },
  });
});

// 4. My Bet History
app.get('/api/dragon/bet-history', (req, res) => {
  const userid = Number(req.query.userid || 12);
  const history = userBetHistory.get(userid) || [];
  res.json({
    status: 200,
    message: 'History fetched',
    total: history.length,
    data: history,
  });
});

// 5. Admin Force Winner
app.post('/api/admin/dragon/control', (req, res) => {
  const { winner } = req.body || {};
  if (!['D', 'T', 'Tie', 'auto'].includes(winner)) {
    return res.status(400).json({ status: 400, message: 'Invalid winner option. Use D, T, Tie, or auto' });
  }
  adminForceWinner = winner;
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
