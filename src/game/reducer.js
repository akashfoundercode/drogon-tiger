import { PHASES, TIMING, START_BALANCE, PAYOUT_MULT, TIE_REFUND_RATE } from './constants.js';
import { createBots } from './bots.js';
import { compareCards } from './cards.js';

const zero = () => ({ dragon: 0, tie: 0, tiger: 0 });
const sum = (b) => b.dragon + b.tie + b.tiger;

function seedHistory() {
  const out = [];
  for (let i = 0; i < 24; i++) {
    const r = Math.random();
    out.push({ id: `seed${i}`, result: r < 0.44 ? 'dragon' : r < 0.88 ? 'tiger' : 'tie' });
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
      const winner = compareCards(dragon, tiger);
      const payoutFor = (bets) =>
        winner === 'tie'
          ? bets.tie * PAYOUT_MULT.tie + (bets.dragon + bets.tiger) * TIE_REFUND_RATE
          : bets[winner] * PAYOUT_MULT[winner];
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
        history: [{ id: `r${state.roundNo}`, result: winner }, ...state.history].slice(0, 60),
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
