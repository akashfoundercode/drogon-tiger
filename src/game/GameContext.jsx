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
import { drawCard, drawPair } from './cards.js';
import { getSlot } from './pile.js';
import { pickBotBet } from './bots.js';
import { sfx } from './sound.js';
import { api, connectGameSockets, placeBetSocket } from './apiClient.js';

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

  const [forceWinner, setForceWinner] = useState('tiger'); // default to 'tiger' for testing
  const forceWinnerRef = useRef(forceWinner);
  forceWinnerRef.current = forceWinner;

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

  const hasServer = useRef(false);

  /* --------------------------------- actions -------------------------------- */
  const placeBet = useCallback(
    (side, amountOverride) => {
      const s = stateRef.current;
      if (s.phase !== PHASES.BETTING && s.phase !== PHASES.PLACE_BETS) {
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

      // Sync bet with backend API / Socket (Event 6: dragon_tiger:place_bet)
      placeBetSocket({ spot: side, amount, userid: USER_ID }).then((res) => {
        if (res && res.balance !== undefined) {
          dispatch({ type: 'SET_BALANCE', balance: res.balance });
        } else if (res && res.status >= 400) {
          toast(res.message || 'Bet failed', 'error');
          sfx.error();
        }
      });

      const chips = amountOverride ? decompose(amount) : [amount];
      chips.forEach((value, i) =>
        later(() => {
          const k = slotCounters.current[side]++;
          const slot = getSlot(side, k);
          launchChip({
            side,
            value,
            mine: true,
            from: { kind: 'user' },
            slot,
            roundNo: stateRef.current.roundNo,
          });
        }, i * 200)
      );
      return true;
    },
    [later, launchChip, toast]
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
    let delayAcc = 0;
    ['dragon', 'tie', 'tiger'].forEach((side) => {
      if (last[side] > 0) {
        later(() => placeBet(side, last[side]), delayAcc);
        const count = decompose(last[side]).length;
        delayAcc += count * 220 + 100;
      }
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
    let delayAcc = 0;
    ['dragon', 'tie', 'tiger'].forEach((side) => {
      const extra = s.bets[side];
      if (extra > 0) {
        later(() => placeBet(side, extra), delayAcc);
        const count = decompose(extra).length;
        delayAcc += count * 220 + 100;
      }
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

  /* --------------------- Socket.IO & REST API Synchronization --------------------- */
  useEffect(() => {
    // 1. Fetch initial last 120 results from REST API
    api.getResults().then((res) => {
      if (res && res.data && res.data.length > 0) {
        const historyData = res.data.map((item) => ({
          id: item.id || `r${item.period}`,
          roundNo: item.period,
          result: item.winner === 'D' ? 'dragon' : item.winner === 'T' ? 'tiger' : 'tie',
        }));
        dispatch({ type: 'SET_HISTORY', history: historyData });
      }
    });

    // 2. Fetch current round from REST API
    api.getCurrentRound().then((res) => {
      if (res && res.data) {
        hasServer.current = true;
        if (res.data.status === 'betting') {
          dispatch({
            type: 'SERVER_BETTING',
            period: res.data.period,
            time_remaining: res.data.time_remaining,
          });
        }
      }
    });

    // 3. Connect to Socket 1 (/dragon-tiger) & Socket 2 (/dragon-tiger-admin)
    const cleanup = connectGameSockets({
      // Event 1: dragon_tiger:timer
      onTimer: (data) => {
        hasServer.current = true;
        if (!data) return;

        // 1. 4 sec Versus Pop up
        if (data.status === 'versus' || data.status === 'idle') {
          const s = stateRef.current;
          if (s.phase !== PHASES.VERSUS || String(s.roundNo) !== String(data.period)) {
            slotCounters.current = { dragon: 0, tie: 0, tiger: 0 };
            dispatch({
              type: 'SERVER_VERSUS',
              period: data.period,
              time_remaining: data.time_remaining,
            });
          } else {
            dispatch({ type: 'SERVER_TICK', time_remaining: data.time_remaining });
          }
          return;
        }

        // 2. 2 sec Place Bet Pop up
        if (data.status === 'place_bets') {
          const s = stateRef.current;
          if (s.phase !== PHASES.PLACE_BETS) {
            dispatch({
              type: 'SERVER_PLACE_BETS',
              period: data.period,
              time_remaining: data.time_remaining,
            });
          } else {
            dispatch({ type: 'SERVER_TICK', time_remaining: data.time_remaining });
          }
          return;
        }

        // 3. 15 sec Place Bets Timer (Active Betting Window)
        if (data.status === 'betting') {
          const s = stateRef.current;
          if (s.phase !== PHASES.BETTING || String(s.roundNo) !== String(data.period)) {
            dispatch({
              type: 'SERVER_BETTING',
              period: data.period,
              time_remaining: data.time_remaining,
            });
          } else {
            dispatch({ type: 'SERVER_TICK', time_remaining: data.time_remaining });
          }
          return;
        }

        // 4. 6 sec Revealing Cards Winner Decide
        if (data.status === 'revealing') {
          const s = stateRef.current;
          if (s.phase !== PHASES.REVEAL) {
            dispatch({
              type: 'SERVER_REVEALING',
              period: data.period,
              time_remaining: data.time_remaining,
              cards: data.cards,
              winner: data.winner,
              win_number: data.win_number,
              multiplier: data.multiplier,
            });
            // Card 1: Reveal Dragon Card at ~1.6s
            later(() => dispatch({ type: 'REVEAL_CARD', who: 'dragon' }), 1600);
            // Card 2: Reveal Tiger Card at ~3.6s
            later(() => dispatch({ type: 'REVEAL_CARD', who: 'tiger' }), 3600);
          } else {
            dispatch({ type: 'SERVER_TICK', time_remaining: data.time_remaining });
          }
          return;
        }

        // 5. 5 sec Winner Pop up
        if (data.status === 'winner_popup' || data.status === 'result') {
          const s = stateRef.current;
          if (s.phase !== PHASES.RESULT) {
            dispatch({
              type: 'SERVER_WINNER_POPUP',
              period: data.period,
              time_remaining: data.time_remaining,
              cards: data.cards,
              winner: data.winner,
            });
          } else {
            dispatch({ type: 'SERVER_TICK', time_remaining: data.time_remaining });
          }
          return;
        }
      },
      // Event 2: dragon_tiger:state
      onState: (data) => {
        hasServer.current = true;
        if (!data) return;
        if (data.status === 'versus' || data.status === 'idle') {
          dispatch({
            type: 'SERVER_VERSUS',
            period: data.period,
            time_remaining: data.time_remaining,
          });
        } else if (data.status === 'place_bets') {
          dispatch({
            type: 'SERVER_PLACE_BETS',
            period: data.period,
            time_remaining: data.time_remaining,
          });
        } else if (data.status === 'betting') {
          dispatch({
            type: 'SERVER_BETTING',
            period: data.period,
            time_remaining: data.time_remaining,
          });
        }
      },
      // Event 3: dragon_tiger:revealing
      onRevealing: (data) => {
        hasServer.current = true;
        if (!data) return;
        const s = stateRef.current;
        if (s.phase !== PHASES.REVEAL && s.phase !== PHASES.RESULT) {
          dispatch({
            type: 'SERVER_REVEALING',
            period: data.period,
            time_remaining: data.time_remaining,
            cards: data.cards,
            winner: data.winner,
            win_number: data.win_number,
            multiplier: data.multiplier,
          });
          later(() => dispatch({ type: 'REVEAL_CARD', who: 'dragon' }), 1600);
          later(() => dispatch({ type: 'REVEAL_CARD', who: 'tiger' }), 3600);
        }
      },
      // Event 4: dragon_tiger:round_settled
      onRoundSettled: (data) => {
        hasServer.current = true;
        api.getBalance(USER_ID).then((res) => {
          if (res && res.balance !== undefined) {
            dispatch({ type: 'SET_BALANCE', balance: res.balance });
          }
        });
      },
      // Event 5: dragon_tiger:bet_pulse (Animate other players' bets)
      onBetPulse: (data) => {
        if (data && data.userid !== USER_ID) {
          const side = data.spot;
          if (['dragon', 'tiger', 'tie'].includes(side)) {
            const k = slotCounters.current[side]++;
            const slot = getSlot(side, k);
            launchChip({
              side,
              value: data.amount || 100,
              mine: false,
              from: { kind: 'player', key: data.userid, sidebar: 'left' },
              slot,
              roundNo: stateRef.current.roundNo,
            });
          }
        }
      },
      // Event 7: dragon_tiger:bet_success
      onBetSuccess: (data) => {
        if (data && data.balance !== undefined) {
          dispatch({ type: 'SET_BALANCE', balance: data.balance });
        }
      },
      // Event 8: dragon_tiger:bet_error
      onBetError: (data) => {
        toast(data?.message || 'Bet rejected', 'error');
        sfx.error();
      },
      onGameUpdate: () => {
        hasServer.current = true;
      },
    });

    return cleanup;
  }, [later]);

  /* ----------------------------- round state machine fallback ---------------------------- */
  useEffect(() => {
    const { phase } = state;
    if (hasServer.current) {
      // Driven by server sockets
      return undefined;
    }

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
        () => dispatch({ type: 'START_REVEAL', cards: drawPair(forceWinnerRef.current) }),
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
      const isDragon = state.result?.winner === 'dragon';
      const isTiger = state.result?.winner === 'tiger';
      const dur = isDragon ? 5800 : isTiger ? 4400 : TIMING.result;
      const t = setTimeout(() => dispatch({ type: 'NEXT_ROUND' }), dur);
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
      const pick = pickBotBet(stateRef.current.bots);
      if (!pick) return;
      const { bot, side, chip, amount } = pick;
      dispatch({ type: 'BOT_BET', botId: bot.id, side, amount });
      const k = slotCounters.current[side]++;
      const slot = getSlot(side, k);
      launchChip({
        side,
        value: chip,
        mine: false,
        from: { kind: 'player', key: bot.id, sidebar: bot.sidebar },
        slot,
        roundNo: stateRef.current.roundNo,
      });
      later(() => dispatch({ type: 'BOT_IDLE', botId: bot.id }), 900);
    }, 550);
    return () => clearInterval(iv);
  }, [state.phase, launchChip, later]);

  /* ----------------------------------- effects ----------------------------------- */
  // phase sounds
  useEffect(() => {
    if (state.phase === PHASES.BETTING) sfx.open();
    if (state.phase === PHASES.CLOSED) sfx.lock();
    if (state.phase === PHASES.RESULT && state.result) {
      if (state.result.winner === 'tiger') {
        sfx.tigerWin();
      } else if (state.result.winner === 'dragon') {
        sfx.dragonWin();
      } else if (state.result.net > 0) {
        sfx.win();
      } else if (state.result.stake > 0) {
        sfx.lose();
      } else {
        sfx.select();
      }
    }
  }, [state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.reveal.dragon || state.reveal.tiger) sfx.flip();
  }, [state.reveal.dragon, state.reveal.tiger]);

  useEffect(() => {
    if (state.phase === PHASES.BETTING && state.timer > 0 && state.timer <= 5) sfx.tick();
  }, [state.timer, state.phase]);

  useEffect(() => sfx.setEnabled(state.soundOn), [state.soundOn]);

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

  const [modal, setModal] = useState(null);

  const handleSetForceWinner = useCallback((val) => {
    setForceWinner(val);
    const target = val === 'dragon' ? 'D' : val === 'tiger' ? 'T' : val === 'tie' ? 'Tie' : val;
    api.setAdminControl(target);
  }, []);

  const value = useMemo(
    () => ({
      state,
      userId: USER_ID,
      flying,
      removeFlying,
      landChip,
      toast,
      forceWinner,
      setForceWinner: handleSetForceWinner,
      modal,
      setModal,
      actions: { placeBet, repeatBet, doubleBet, clearBets, selectChip, toggleSound, resetBalance },
    }),
    [state, flying, removeFlying, landChip, toast, forceWinner, handleSetForceWinner, modal, placeBet, repeatBet, doubleBet, clearBets, selectChip, toggleSound, resetBalance]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
