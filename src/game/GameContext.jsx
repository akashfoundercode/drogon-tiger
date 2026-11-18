import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { reducer, createInitialState } from './reducer.js';
import { CHIP_VALUES, PHASES, TIMING, USER_ID } from './constants.js';
import { drawCard } from './cards.js';
import { getSlot } from './pile.js';
import { pickBotBet } from './bots.js';
import { sfx } from './sound.js';

const GameContext = createContext(null);
export const useGame = () => useContext(GameContext);

// Break an amount into chip denominations (largest first), capped for visuals.
function decompose(amount, cap = 10) {
  const out = [];
  let rest = amount;
  for (const v of [...CHIP_VALUES].reverse()) {
    while (rest >= v && out.length < cap) {
      out.push(v);
      rest -= v;
    }
  }
  return out;
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const [flying, setFlying] = useState([]);
  const flyId = useRef(0);
  const slotCounters = useRef({ dragon: 0, tie: 0, tiger: 0 });
  const timers = useRef(new Set());

  const later = useCallback((fn, ms) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
    return t;
  }, []);

  useEffect(() => {
    const set = timers.current;
    return () => set.forEach(clearTimeout);
  }, []);

  const toast = useCallback((msg, kind = 'info') => dispatch({ type: 'TOAST', msg, kind }), []);

  /* ------------------------------ flying chips ------------------------------ */
  const launchChip = useCallback((spec) => {
    setFlying((f) => [...f.slice(-70), { ...spec, id: ++flyId.current }]);
  }, []);

  const removeFlying = useCallback((id) => setFlying((f) => f.filter((c) => c.id !== id)), []);

  const launchToPile = useCallback(
    ({ side, value, mine, from }) => {
      const k = slotCounters.current[side]++;
      const slot = getSlot(side, k);
      launchChip({ side, value, mine, from, slot, roundNo: stateRef.current.roundNo });
    },
    [launchChip]
  );

  const landChip = useCallback((spec) => {
    dispatch({
      type: 'LAND_CHIP',
      side: spec.side,
      roundNo: spec.roundNo,
      chip: { id: spec.id, value: spec.value, mine: spec.mine, idx: spec.slot.idx, x: spec.slot.x, y: spec.slot.y, rot: spec.slot.rot },
    });
  }, []);

  /* --------------------------------- actions -------------------------------- */
  const placeBet = useCallback(
    (side, amountOverride) => {
      const s = stateRef.current;
      if (s.phase !== PHASES.BETTING) {
        toast('Betting is closed', 'error');
        sfx.error();
        return false;
      }
      const amount = amountOverride ?? s.selectedChip;
      if (amount <= 0) return false;
      if (amount > s.balance) {
        toast('Insufficient balance', 'error');
        sfx.error();
        return false;
      }
      dispatch({ type: 'PLACE_BET', side, amount });
      const chips = amountOverride ? decompose(amount) : [amount];
      chips.forEach((value, i) =>
        later(() => launchToPile({ side, value, mine: true, from: { kind: 'chip', key: value } }), i * 110)
      );
      return true;
    },
    [later, launchToPile, toast]
  );

  const repeatBet = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== PHASES.BETTING) return toast('Betting is closed', 'error');
    const last = s.lastBets;
    const total = last.dragon + last.tie + last.tiger;
    if (!total) return toast('No previous bet to repeat');
    if (total > s.balance) {
      sfx.error();
      return toast('Insufficient balance', 'error');
    }
    ['dragon', 'tie', 'tiger'].forEach((side, i) => {
      if (last[side] > 0) later(() => placeBet(side, last[side]), i * 160);
    });
  }, [later, placeBet, toast]);

  const doubleBet = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== PHASES.BETTING) return toast('Betting is closed', 'error');
    const total = s.bets.dragon + s.bets.tie + s.bets.tiger;
    if (!total) return toast('Place a bet first');
    if (total > s.balance) {
      sfx.error();
      return toast('Insufficient balance for x2', 'error');
    }
    ['dragon', 'tie', 'tiger'].forEach((side, i) => {
      const extra = s.bets[side];
      if (extra > 0) later(() => placeBet(side, extra), i * 160);
    });
  }, [later, placeBet, toast]);

  const clearBets = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== PHASES.BETTING) return toast('Betting is closed', 'error');
    if (!(s.bets.dragon + s.bets.tie + s.bets.tiger)) return;
    dispatch({ type: 'CLEAR_BETS' });
    sfx.select();
  }, [toast]);

  const selectChip = useCallback((value) => {
    dispatch({ type: 'SELECT_CHIP', value });
    sfx.select();
  }, []);

  const toggleSound = useCallback(() => dispatch({ type: 'TOGGLE_SOUND' }), []);
  const resetBalance = useCallback(() => {
    dispatch({ type: 'RESET_BALANCE' });
    toast('Balance reset');
  }, [toast]);

  /* ----------------------------- round state machine ---------------------------- */
  useEffect(() => {
    const { phase } = state;
    if (phase === PHASES.IDLE) {
      slotCounters.current = { dragon: 0, tie: 0, tiger: 0 };
      const t = setTimeout(() => dispatch({ type: 'OPEN_BETTING' }), TIMING.idle);
      return () => clearTimeout(t);
    }
    if (phase === PHASES.BETTING) {
      const iv = setInterval(() => dispatch({ type: 'TICK' }), 1000);
      return () => clearInterval(iv);
    }
    if (phase === PHASES.CLOSED) {
      const t = setTimeout(
        () => dispatch({ type: 'START_REVEAL', cards: { dragon: drawCard(), tiger: drawCard() } }),
        TIMING.closed
      );
      return () => clearTimeout(t);
    }
    if (phase === PHASES.REVEAL) {
      const ts = [
        setTimeout(() => dispatch({ type: 'REVEAL_CARD', who: 'dragon' }), TIMING.revealDragon),
        setTimeout(() => dispatch({ type: 'REVEAL_CARD', who: 'tiger' }), TIMING.revealTiger),
        setTimeout(() => dispatch({ type: 'RESOLVE' }), TIMING.resolve),
      ];
      return () => ts.forEach(clearTimeout);
    }
    if (phase === PHASES.RESULT) {
      const t = setTimeout(() => dispatch({ type: 'NEXT_ROUND' }), TIMING.result);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [state.phase]);

  /* ------------------------------- simulated players ------------------------------ */
  useEffect(() => {
    if (state.phase !== PHASES.BETTING) return undefined;
    const iv = setInterval(() => {
      const s = stateRef.current;
      if (s.phase !== PHASES.BETTING || s.timer <= 1) return;
      for (let k = 0; k < 2; k++) {
        const pick = pickBotBet(stateRef.current.bots);
        if (!pick) return;
        const { bot, side, chip, amount } = pick;
        dispatch({ type: 'BOT_BET', botId: bot.id, side, amount });
        launchToPile({
          side,
          value: chip,
          mine: false,
          from: { kind: 'player', key: bot.id, sidebar: bot.sidebar },
        });
        later(() => dispatch({ type: 'BOT_IDLE', botId: bot.id }), 900);
      }
    }, 420);
    return () => clearInterval(iv);
  }, [state.phase, launchToPile, later]);

  /* ----------------------------------- effects ----------------------------------- */
  // phase sounds
  useEffect(() => {
    if (state.phase === PHASES.BETTING) sfx.open();
    if (state.phase === PHASES.CLOSED) sfx.lock();
    if (state.phase === PHASES.RESULT && state.result) {
      if (state.result.net > 0) sfx.win();
      else if (state.result.stake > 0) sfx.lose();
      else sfx.select();
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.reveal.dragon || state.reveal.tiger) sfx.flip();
  }, [state.reveal.dragon, state.reveal.tiger]);

  useEffect(() => {
    if (state.phase === PHASES.BETTING && state.timer > 0 && state.timer <= 5) sfx.tick();
  }, [state.timer, state.phase]);

  useEffect(() => sfx.setEnabled(state.soundOn), [state.soundOn]);

  // payout chips fly from the winning pile to the player's avatar
  useEffect(() => {
    if (state.phase !== PHASES.RESULT || !state.result || state.result.payout <= 0) return;
    const { winner, payout } = state.result;
    const b = state.bets;
    const from = b[winner] > 0 ? winner : b.dragon > 0 ? 'dragon' : 'tiger';
    const n = Math.min(8, Math.max(3, Math.ceil(payout / 1000)));
    for (let i = 0; i < n; i++) {
      later(
        () =>
          launchChip({
            kind: 'payout',
            to: 'user',
            value: CHIP_VALUES[Math.floor(Math.random() * CHIP_VALUES.length)],
            from: { kind: 'pile', key: from },
          }),
        900 + i * 120
      );
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // toast auto-dismiss
  useEffect(() => {
    if (!state.toast) return undefined;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 1800);
    return () => clearTimeout(t);
  }, [state.toast]);

  // fluctuating network latency
  useEffect(() => {
    const iv = setInterval(() => dispatch({ type: 'SET_PING', value: 42 + Math.floor(Math.random() * 55) }), 3000);
    return () => clearInterval(iv);
  }, []);

  const value = useMemo(
    () => ({
      state,
      userId: USER_ID,
      flying,
      removeFlying,
      landChip,
      toast,
      actions: { placeBet, repeatBet, doubleBet, clearBets, selectChip, toggleSound, resetBalance },
    }),
    [state, flying, removeFlying, landChip, toast, placeBet, repeatBet, doubleBet, clearBets, selectChip, toggleSound, resetBalance]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
