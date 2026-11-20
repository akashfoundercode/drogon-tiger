import { PHASES, TIMING, START_BALANCE, PAYOUT_MULT, TIE_REFUND_RATE } from './constants.js';
import { createBots } from './bots.js';
import { compareCards } from './cards.js';

const zero = () => ({ dragon: 0, tie: 0, tiger: 0 });
const sum = (b) => b.dragon + b.tie + b.tiger;

function seedHistory() {
  const out = [];
  const baseRound = 1000120;
  for (let i = 0; i < 120; i++) {
    const r = Math.random();
    const result = r < 0.45 ? 'dragon' : r < 0.90 ? 'tiger' : 'tie';
    out.push({
      id: `seed${i}`,
      roundNo: baseRound - i,
      result,
    });
  }
  return out;
}

export function createInitialState() {
  return {
    phase: PHASES.IDLE,
    timer: TIMING.betting,
    roundNo: 1000121,
    balance: START_BALANCE,
    selectedChip: 50,
    bets: zero(),
    lastBets: zero(),
    totals: zero(),
    players: zero(),
    piles: { dragon: [], tie: [], tiger: [] },
    history: seedHistory(),
    cards: { dragon: null, tiger: null },
    reveal: { dragon: false, tiger: false },
    result: null,
    bots: createBots(),
    activeBots: {},
    soundOn: true,
    toast: null,
    ping: 68,
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_CHIP':
      return { ...state, selectedChip: action.value };

    case 'OPEN_BETTING':
      return { ...state, phase: PHASES.BETTING, timer: TIMING.betting };

    case 'TICK': {
      if (state.phase !== PHASES.BETTING) return state;
      const t = state.timer - 1;
      if (t <= 0) return { ...state, timer: 0, phase: PHASES.CLOSED };
      return { ...state, timer: t };
    }

    case 'SET_HISTORY':
      return { ...state, history: action.history };

    case 'SET_BALANCE':
      return { ...state, balance: action.balance };

    case 'SERVER_VERSUS':
    case 'SERVER_IDLE': {
      const stake = sum(state.bets);
      return {
        ...state,
        phase: PHASES.VERSUS,
        timer: action.time_remaining ?? 4,
        roundNo: action.period || state.roundNo,
        lastBets: stake > 0 ? state.bets : state.lastBets,
        bets: zero(),
        totals: zero(),
        players: zero(),
        piles: { dragon: [], tie: [], tiger: [] },
        cards: { dragon: null, tiger: null },
        reveal: { dragon: false, tiger: false },
        result: null,
      };
    }

    case 'SERVER_PLACE_BETS': {
      return {
        ...state,
        phase: PHASES.PLACE_BETS,
        timer: action.time_remaining ?? 2,
        roundNo: action.period || state.roundNo,
      };
    }

    case 'SERVER_CLOSED': {
      return {
        ...state,
        phase: PHASES.CLOSED,
        timer: 0,
      };
    }

    case 'SERVER_BETTING': {
      return {
        ...state,
        phase: PHASES.BETTING,
        timer: action.time_remaining ?? 15,
        roundNo: action.period || state.roundNo,
      };
    }

    case 'SERVER_TICK': {
      return { ...state, timer: action.time_remaining };
    }

    case 'UPDATE_CARDS': {
      return {
        ...state,
        cards: action.cards || state.cards,
        forcedWinner: action.winner || state.forcedWinner,
      };
    }

    case 'SERVER_REVEALING': {
      const winner =
        action.winner === 'D'
          ? 'dragon'
          : action.winner === 'T'
            ? 'tiger'
            : 'tie';
      return {
        ...state,
        phase: PHASES.REVEAL,
        timer: action.time_remaining ?? 6,
        roundNo: action.period || state.roundNo,
        cards: action.cards,
        serverOutcome: {
          winner,
          win_number: action.win_number,
          multiplier: action.multiplier,
        },
        reveal: { dragon: false, tiger: false },
      };
    }

    case 'SERVER_WINNER_POPUP': {
      const winner =
        action.winner === 'D'
          ? 'dragon'
          : action.winner === 'T'
            ? 'tiger'
            : action.winner === 'Tie'
              ? 'tie'
              : (state.serverOutcome?.winner || 'dragon');
      const payoutFor = (bets) =>
        winner === 'tie'
          ? bets.tie * 5
          : bets[winner] * 2;
      const stake = sum(state.bets);
      const payout = payoutFor(state.bets);
      return {
        ...state,
        phase: PHASES.RESULT,
        timer: action.time_remaining ?? 5,
        cards: action.cards || state.cards,
        balance: state.balance + payout,
        history: [{ id: `r${state.roundNo}`, roundNo: state.roundNo, result: winner }, ...state.history].slice(0, 120),
        result: { winner, stake, payout, net: payout - stake },
      };
    }

    case 'START_REVEAL':
      return {
        ...state,
        phase: PHASES.REVEAL,
        cards: action.cards,
        reveal: { dragon: false, tiger: false },
      };

    case 'REVEAL_CARD':
      return { ...state, reveal: { ...state.reveal, [action.who]: true } };

    case 'RESOLVE': {
      const { dragon, tiger } = state.cards;
      const winner = state.serverOutcome
        ? state.serverOutcome.winner
        : compareCards(dragon, tiger);
      const payoutFor = (bets) =>
        winner === 'tie'
          ? bets.tie * 5
          : bets[winner] * 2;
      const stake = sum(state.bets);
      const payout = payoutFor(state.bets);
      const bots = state.bots.map((b) => {
        const p = payoutFor(b.bet);
        return p > 0 ? { ...b, balance: b.balance + p } : b;
      });
      return {
        ...state,
        phase: PHASES.RESULT,
        balance: state.balance + payout,
        bots,
        history: [{ id: `r${state.roundNo}`, roundNo: state.roundNo, result: winner }, ...state.history].slice(0, 120),
        result: { winner, stake, payout, net: payout - stake },
      };
    }

    case 'NEXT_ROUND': {
      const stake = sum(state.bets);
      return {
        ...state,
        phase: PHASES.IDLE,
        roundNo: state.roundNo + 1,
        timer: TIMING.betting,
        lastBets: stake > 0 ? state.bets : state.lastBets,
        bets: zero(),
        totals: zero(),
        players: zero(),
        piles: { dragon: [], tie: [], tiger: [] },
        cards: { dragon: null, tiger: null },
        reveal: { dragon: false, tiger: false },
        result: null,
        activeBots: {},
        bots: state.bots.map((b) => ({
          ...b,
          bet: zero(),
          balance: b.balance < 20000 ? b.balance + 200000 + Math.floor(Math.random() * 400000) : b.balance,
        })),
      };
    }

    case 'PLACE_BET': {
      const { side, amount } = action;
      if (state.phase !== PHASES.BETTING || amount > state.balance) return state;
      return {
        ...state,
        balance: state.balance - amount,
        bets: { ...state.bets, [side]: state.bets[side] + amount },
        totals: { ...state.totals, [side]: state.totals[side] + amount },
        players: { ...state.players, [side]: state.players[side] + (state.bets[side] === 0 ? 1 : 0) },
      };
    }

    case 'CLEAR_BETS': {
      if (state.phase !== PHASES.BETTING) return state;
      const refund = sum(state.bets);
      if (!refund) return state;
      const totals = {};
      const players = {};
      const piles = {};
      ['dragon', 'tie', 'tiger'].forEach((s) => {
        totals[s] = state.totals[s] - state.bets[s];
        players[s] = state.players[s] - (state.bets[s] > 0 ? 1 : 0);
        piles[s] = state.piles[s].filter((c) => !c.mine);
      });
      return { ...state, balance: state.balance + refund, bets: zero(), totals, players, piles };
    }

    case 'LAND_CHIP': {
      if (action.roundNo !== state.roundNo) return state;
      const list = state.piles[action.side].filter((c) => c.idx !== action.chip.idx);
      list.push(action.chip);
      return { ...state, piles: { ...state.piles, [action.side]: list } };
    }

    case 'BOT_BET': {
      const { botId, side, amount } = action;
      if (state.phase !== PHASES.BETTING) return state;
      return {
        ...state,
        totals: { ...state.totals, [side]: state.totals[side] + amount },
        players: { ...state.players, [side]: state.players[side] + (Math.random() < 0.75 ? 1 : 0) },
        bots: state.bots.map((b) =>
          b.id === botId
            ? { ...b, balance: b.balance - amount, bet: { ...b.bet, [side]: b.bet[side] + amount } }
            : b
        ),
        activeBots: { ...state.activeBots, [botId]: side },
      };
    }

    case 'BOT_IDLE': {
      if (!(action.botId in state.activeBots)) return state;
      const next = { ...state.activeBots };
      delete next[action.botId];
      return { ...state, activeBots: next };
    }

    case 'TOAST':
      return { ...state, toast: { id: Math.random(), msg: action.msg, kind: action.kind || 'info' } };
    case 'CLEAR_TOAST':
      return { ...state, toast: null };
    case 'TOGGLE_SOUND':
      return { ...state, soundOn: !state.soundOn };
    case 'RESET_BALANCE':
      return { ...state, balance: START_BALANCE };
    case 'SET_PING':
      return { ...state, ping: action.value };

    default:
      return state;
  }
}
