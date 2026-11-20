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
import { CHIP_VALUES, PHASES, TIMING, USER_ID, USER_NAME } from './constants.js';
import { drawCard, drawPair } from './cards.js';
import { getSlot } from './pile.js';
import { pickBotBet } from './bots.js';
import { sfx } from './sound.js';
import { api, connectGameSockets, placeBetSocket, getAuthToken, setAuthToken } from './apiClient.js';

const GameContext = createContext(null);
export const useGame = () => useContext(GameContext);

function normalizeWinner(value) {
  if (value === 'D' || value === 'dragon' || value === 1 || value === '1') return 'dragon';
  if (value === 'T' || value === 'tiger' || value === 2 || value === '2') return 'tiger';
  if (value === 'Tie' || value === 'tie' || value === 'TIE' || value === 3 || value === '3') return 'tie';
  return null;
}

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

  // Stored user profile & authentication
  const getStoredUser = () => {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('dt_user_profile') : null;
      const cachedToken = getAuthToken();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (cachedToken && !parsed.token) parsed.token = cachedToken;
        return parsed;
      }
      if (cachedToken) {
        return {
          isLoggedIn: true,
          userId: USER_ID,
          userName: USER_NAME,
          mobile: '',
          token: cachedToken,
          vipLevel: 3,
        };
      }
    } catch (e) {}
    return {
      isLoggedIn: false,
      userId: USER_ID,
      userName: USER_NAME,
      mobile: '',
      token: null,
      vipLevel: 3,
    };
  };

  const [user, setUser] = useState(getStoredUser);
  const userRef = useRef(user);
  userRef.current = user;

  const saveUser = useCallback((u) => {
    setUser(u);
    try {
      localStorage.setItem('dt_user_profile', JSON.stringify(u));
    } catch (e) {}
  }, []);

  const [forceWinner, setForceWinner] = useState(null);
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

  /* -------------------------- activity & session tracking ------------------------- */
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes of zero interaction
  const lastActiveRef = useRef(Date.now());

  const recordActivity = useCallback(() => {
    lastActiveRef.current = Date.now();
    try {
      localStorage.setItem('dt_last_active', String(Date.now()));
    } catch (e) {}
  }, []);

  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'touchstart', 'click'];
    const handler = () => recordActivity();
    events.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handler));
    };
  }, [recordActivity]);

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
      chip: {
        id: spec.id,
        value: spec.value,
        mine: spec.mine,
        idx: spec.slot.idx,
        x: spec.slot.x,
        y: spec.slot.y,
        rot: spec.slot.rot,
        zIndex: spec.slot.zIndex,
        height: spec.slot.height,
      },
    });
  }, []);

  const hasServer = useRef(false);

  /* --------------------------------- actions -------------------------------- */
  const placeBet = useCallback(
    (side, amountOverride) => {
      if (!userRef.current.isLoggedIn) {
        toast('Please login to place bets', 'error');
        setModal('login');
        sfx.error();
        return false;
      }
      recordActivity();
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
      const currentUid = userRef.current.userId;
      const currentUname = userRef.current.userName;
      placeBetSocket({ spot: side, amount, userid: currentUid, username: currentUname }).then((res) => {
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

    // 2. Fetch current round from REST API & synchronize admin_force and round state
    const syncFromRound = (res) => {
      if (!res) return;
      hasServer.current = true;
      const data = res.data && typeof res.data === 'object' ? res.data : res;

      // Synchronize cards and winner from response
      const responseCards = res.cards || data.cards;
      const responseWinner = res.winner ?? data.winner ?? res.admin_force ?? data.admin_force;
      const responseWinNumber = res.win_number ?? data.win_number;
      const winner = normalizeWinner(responseWinner, responseWinNumber);

      if (responseWinner) {
        setForceWinner(winner);
        forceWinnerRef.current = winner;
      }

      const pStatus = res.phase || res.game_status || data.phase || data.game_status || res.status || data.status;
      const period = res.period || data.period;
      const tRem = res.time_remaining ?? data.time_remaining;

      if (pStatus === 'betting') {
        dispatch({
          type: 'SERVER_BETTING',
          period,
          time_remaining: tRem,
          winner,
          win_number: responseWinNumber,
          cards: responseCards,
          multiplier: res.multiplier ?? data.multiplier,
        });
      } else if (pStatus === 'versus' || pStatus === 'idle') {
        dispatch({
          type: 'SERVER_VERSUS',
          period,
          time_remaining: tRem,
          winner,
          win_number: responseWinNumber,
          cards: responseCards,
        });
      } else if (pStatus === 'place_bets' || pStatus === 'place_bet_popup') {
        dispatch({
          type: 'SERVER_PLACE_BETS',
          period,
          time_remaining: tRem,
          winner,
          win_number: responseWinNumber,
          cards: responseCards,
        });
      } else if ((pStatus === 'revealing' || pStatus === 'winner_popup' || pStatus === 'result') && (responseCards || responseWinner || responseWinNumber)) {
        const winnerAction = pStatus === 'winner_popup' || pStatus === 'result' ? 'SERVER_WINNER_POPUP' : 'SERVER_REVEALING';
        dispatch({
          type: winnerAction,
          period,
          time_remaining: tRem,
          cards: responseCards,
          winner: responseWinner ?? responseWinNumber,
          win_number: responseWinNumber,
          multiplier: res.multiplier || data.multiplier,
        });
      }
    };

    api.getCurrentRound().then(syncFromRound);
    let pollingCurrentRound = false;
    const currentRoundPoll = setInterval(() => {
      if (pollingCurrentRound) return;
      pollingCurrentRound = true;
      api.getCurrentRound()
        .then(syncFromRound)
        .catch(() => {})
        .finally(() => { pollingCurrentRound = false; });
    }, 1000);

    // 3. Connect to Sockets using strictly the 4 core events
    const cleanup = connectGameSockets({
      // Event 1: dragon_tiger:force (Admin ke force karte hi cards aur winner turant yahan milenge)
      onForce: (data) => {
        hasServer.current = true;
        if (!data) return;
        const forced = normalizeWinner(data.winner ?? data.admin_force) || data.winner || data.admin_force;
        if (forced) {
          forceWinnerRef.current = forced;
          setForceWinner(forced);
        }
        if (data.cards) {
          dispatch({
            type: 'UPDATE_CARDS',
            cards: data.cards,
            winner: forced,
            win_number: data.win_number,
          });
        }
      },

      // Event 2: dragon_tiger:state (Timer aur game phase updates)
      onState: (data) => {
        hasServer.current = true;
        if (!data) return;
        const curPhase = data.phase || data.status;

        // Phase 1: Versus
        if (curPhase === 'versus' || curPhase === 'idle') {
          const s = stateRef.current;
          if (s.phase !== PHASES.VERSUS || String(s.roundNo) !== String(data.period)) {
            slotCounters.current = { dragon: 0, tie: 0, tiger: 0 };
            dispatch({
              type: 'SERVER_VERSUS',
              period: data.period,
              time_remaining: data.time_remaining,
              cards: data.cards,
              winner: data.winner ?? data.win_number,
              win_number: data.win_number,
            });
            api.getCurrentRound().then(syncFromRound).catch(() => {});
          } else {
            dispatch({ type: 'SERVER_TICK', time_remaining: data.time_remaining });
          }
          return;
        }

        // Phase 2: Place Bet Pop up
        if (curPhase === 'place_bets' || curPhase === 'place_bet_popup') {
          const s = stateRef.current;
          if (s.phase !== PHASES.PLACE_BETS) {
            dispatch({
              type: 'SERVER_PLACE_BETS',
              period: data.period,
              time_remaining: data.time_remaining,
              cards: data.cards,
              winner: data.winner ?? data.win_number,
              win_number: data.win_number,
            });
          } else {
            dispatch({ type: 'SERVER_TICK', time_remaining: data.time_remaining });
          }
          return;
        }

        // Phase 3: Active Betting Window
        if (curPhase === 'betting') {
          const s = stateRef.current;
          const winner = data.winner ?? data.win_number;
          if (s.phase !== PHASES.BETTING || String(s.roundNo) !== String(data.period)) {
            dispatch({
              type: 'SERVER_BETTING',
              period: data.period,
              time_remaining: data.time_remaining,
              cards: data.cards,
              winner,
              win_number: data.win_number,
              multiplier: data.multiplier,
            });
          } else {
            if (winner || data.cards) {
              dispatch({
                type: 'SERVER_BETTING',
                period: data.period,
                time_remaining: data.time_remaining,
                cards: data.cards,
                winner,
                win_number: data.win_number,
                multiplier: data.multiplier,
              });
            }
            dispatch({ type: 'SERVER_TICK', time_remaining: data.time_remaining });
          }
          return;
        }

        // Phase 4: Revealing Cards
        if (curPhase === 'revealing') {
          const s = stateRef.current;
          const winner = data.winner ?? data.win_number;
          if (s.phase !== PHASES.REVEAL && s.phase !== PHASES.RESULT) {
            dispatch({
              type: 'SERVER_REVEALING',
              period: data.period,
              time_remaining: data.time_remaining,
              cards: data.cards,
              winner,
              win_number: data.win_number,
              multiplier: data.multiplier,
            });
            later(() => dispatch({ type: 'REVEAL_CARD', who: 'dragon' }), 1600);
            later(() => dispatch({ type: 'REVEAL_CARD', who: 'tiger' }), 3600);
          } else {
            dispatch({ type: 'SERVER_TICK', time_remaining: data.time_remaining });
          }
          return;
        }

        // Phase 5: Winner Pop up / Result (Dispatched ONCE per round, ticks thereafter)
        if (curPhase === 'winner_popup' || curPhase === 'result') {
          const s = stateRef.current;
          const resultWinner = data.winner ?? data.win_number;
          if (s.phase !== PHASES.RESULT) {
            dispatch({
              type: 'SERVER_WINNER_POPUP',
              period: data.period,
              time_remaining: data.time_remaining,
              cards: data.cards,
              winner: resultWinner,
              win_number: data.win_number,
            });
          } else {
            dispatch({ type: 'SERVER_TICK', time_remaining: data.time_remaining });
          }
          return;
        }
      },

      // Event 3: dragon_tiger:result (Final round result aur revealed cards)
      onResult: (data) => {
        hasServer.current = true;
        if (!data) return;
        const s = stateRef.current;
        const curPhase = data.status || data.phase;
        const resultWinner = data.winner ?? data.win_number;

        if (curPhase === 'winner_popup' || curPhase === 'result') {
          if (s.phase !== PHASES.RESULT) {
            dispatch({
              type: 'SERVER_WINNER_POPUP',
              period: data.period,
              time_remaining: data.time_remaining,
              cards: data.cards,
              winner: resultWinner,
              win_number: data.win_number,
            });
          } else {
            dispatch({ type: 'SERVER_TICK', time_remaining: data.time_remaining });
          }
        } else if (curPhase === 'revealing' || data.cards) {
          if (s.phase !== PHASES.REVEAL && s.phase !== PHASES.RESULT) {
            dispatch({
              type: 'SERVER_REVEALING',
              period: data.period,
              time_remaining: data.time_remaining,
              cards: data.cards,
              winner: resultWinner,
              win_number: data.win_number,
              multiplier: data.multiplier,
            });
            later(() => dispatch({ type: 'REVEAL_CARD', who: 'dragon' }), 1600);
            later(() => dispatch({ type: 'REVEAL_CARD', who: 'tiger' }), 3600);
          }
        }

        if (data.balance !== undefined) {
          dispatch({ type: 'SET_BALANCE', balance: Number(data.balance) });
        }
      },

      // Event 4: dragon_tiger:bet (Table par live betting coins update)
      onBet: (data) => {
        if (!data) return;
        if (data.balance !== undefined) {
          dispatch({ type: 'SET_BALANCE', balance: Number(data.balance) });
        }
        if (data.userid !== USER_ID) {
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
    });

    return () => {
      clearInterval(currentRoundPoll);
      cleanup();
    };
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

    // Dynamic round bias: in some rounds Tie is dominant, in others Dragon or Tiger ("kabhi tie me zyada, kabhi dragon me")
    const roundSeed = Math.abs(Number(stateRef.current.roundNo) || Date.now());
    const mode = roundSeed % 5;
    const weights =
      mode === 2
        ? { dragon: 25, tiger: 25, tie: 50 } // Tie dominant
        : mode === 0 || mode === 3
        ? { dragon: 50, tiger: 24, tie: 26 } // Dragon dominant
        : { dragon: 24, tiger: 50, tie: 26 }; // Tiger dominant

    const iv = setInterval(() => {
      const s = stateRef.current;
      if (s.phase !== PHASES.BETTING || s.timer <= 1) return;
      const pick = pickBotBet(stateRef.current.bots, weights);
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
      later(() => dispatch({ type: 'BOT_IDLE', botId: bot.id }), 600);
    }, 180);
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

  // Sync profile & wallet from /api/profile on mount if token exists
  useEffect(() => {
    const token = getAuthToken() || userRef.current?.token;
    if (token) {
      api.getProfile(token).then((res) => {
        if (res && (res.status === 200 || res.data || res.wallet !== undefined)) {
          const data = res.data || res;
          const bal = data.wallet ?? data.balance;
          if (bal !== undefined && bal !== null) {
            dispatch({ type: 'SET_BALANCE', balance: Number(bal) });
          }
          if (data.username || data.userid || data.id) {
            setUser((prev) => ({
              ...prev,
              isLoggedIn: true,
              userId: data.userid || data.id || prev.userId,
              userName: data.username || prev.userName,
              mobile: data.mobile || prev.mobile,
              token,
              vipLevel: data.vip_level ?? prev.vipLevel,
            }));
          }
        }
      }).catch((e) => console.warn('Initial profile sync error:', e));
    }
  }, []);

  const [modal, setModal] = useState(null);

  const login = useCallback(async ({ mobile, country_code = '91', password }) => {
    const res = await api.login({ mobile, country_code, password });
    if (res && (res.status === 200 || res.token || res.data)) {
      const data = res.data || {};
      const token = res.token || data.token || `dt_token_${Date.now()}`;
      setAuthToken(token);

      // Match and sync wallet directly from /api/profile
      let profileData = null;
      try {
        const profileRes = await api.getProfile(token);
        if (profileRes && (profileRes.status === 200 || profileRes.data || profileRes.wallet !== undefined)) {
          profileData = profileRes.data || profileRes;
        }
      } catch (e) {
        console.warn('Profile fetch after login failed:', e);
      }

      const activeWallet = profileData?.wallet ?? profileData?.balance ?? data.wallet ?? data.balance;
      const newUser = {
        isLoggedIn: true,
        userId: profileData?.userid || profileData?.id || data.userid || data.id || USER_ID,
        userName: profileData?.username || data.username || `User_${String(mobile).slice(-4)}`,
        mobile: profileData?.mobile || data.mobile || mobile,
        token,
        vipLevel: profileData?.vip_level ?? data.vip_level ?? 3,
      };
      saveUser(newUser);

      if (activeWallet !== undefined && activeWallet !== null) {
        dispatch({ type: 'SET_BALANCE', balance: Number(activeWallet) });
      }

      toast(`Welcome back, ${newUser.userName}!`, 'success');
      return { ok: true, user: newUser, balance: activeWallet };
    } else {
      const msg = res?.message || 'Login failed. Please check mobile and password.';
      toast(msg, 'error');
      sfx.error();
      return { ok: false, message: msg };
    }
  }, [saveUser, toast]);

  const logout = useCallback(() => {
    setAuthToken(null);
    try {
      localStorage.removeItem('dt_user_profile');
      localStorage.removeItem('dt_last_active');
    } catch (e) {}
    const guestUser = {
      isLoggedIn: false,
      userId: USER_ID,
      userName: USER_NAME,
      mobile: '',
      token: null,
      vipLevel: 3,
    };
    saveUser(guestUser);
    dispatch({ type: 'SET_BALANCE', balance: 0 });
    toast('Logged out successfully');
  }, [saveUser, toast]);

  // Inactivity auto-logout and initial new device login prompt
  useEffect(() => {
    // 1. If not logged in on initial device launch, open login modal after brief mount delay
    if (!userRef.current.isLoggedIn) {
      const t = setTimeout(() => {
        setModal('login');
      }, 500);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    // 2. Check session expiry when returning to tab / window focus
    const checkExpiry = () => {
      if (document.hidden) return;
      try {
        const storedLastActive = Number(localStorage.getItem('dt_last_active')) || lastActiveRef.current;
        const elapsed = Date.now() - storedLastActive;
        if (elapsed > INACTIVITY_TIMEOUT && userRef.current.isLoggedIn) {
          logout();
          setModal('login');
          toast('Session expired due to inactivity. Please login again.', 'info');
        } else {
          recordActivity();
        }
      } catch (e) {}
    };

    document.addEventListener('visibilitychange', checkExpiry);
    window.addEventListener('focus', checkExpiry);

    // 3. Background periodic inactivity timer (every 20s)
    const interval = setInterval(() => {
      if (!userRef.current.isLoggedIn) return;
      const elapsed = Date.now() - lastActiveRef.current;
      if (elapsed > INACTIVITY_TIMEOUT) {
        logout();
        setModal('login');
        toast('Logged out due to inactivity', 'info');
      }
    }, 20000);

    return () => {
      document.removeEventListener('visibilitychange', checkExpiry);
      window.removeEventListener('focus', checkExpiry);
      clearInterval(interval);
    };
  }, [logout, toast, recordActivity]);

  const refreshBalance = useCallback(async () => {
    try {
      const res = await api.getProfile();
      if (res && (res.status === 200 || res.data || res.wallet !== undefined)) {
        const data = res.data || res;
        const bal = data.wallet ?? data.balance;
        if (bal !== undefined && bal !== null) {
          dispatch({ type: 'SET_BALANCE', balance: Number(bal) });
          toast(`Wallet balance synced: ₹${Number(bal).toLocaleString('en-IN')}`, 'success');
          return Number(bal);
        }
      }
    } catch (e) {
      console.warn('Refresh balance error:', e);
    }
    toast(`Wallet balance: ₹${stateRef.current.balance.toLocaleString('en-IN')}`, 'info');
  }, [toast]);

  const depositBalance = useCallback((amount) => {
    const newBal = stateRef.current.balance + amount;
    dispatch({ type: 'SET_BALANCE', balance: newBal });
    toast(`Added ₹${amount.toLocaleString('en-IN')} to wallet!`, 'success');
    sfx.chip();
  }, [toast]);

  const handleSetForceWinner = useCallback((val) => {
    setForceWinner(val);
    const target = val === 'dragon' ? 'D' : val === 'tiger' ? 'T' : val === 'tie' ? 'Tie' : val;
    api.setAdminControl(target);
  }, []);

  const value = useMemo(
    () => ({
      state,
      user,
      userId: user.userId,
      userName: user.userName,
      flying,
      removeFlying,
      landChip,
      toast,
      forceWinner,
      setForceWinner: handleSetForceWinner,
      modal,
      setModal,
      login,
      logout,
      refreshBalance,
      depositBalance,
      actions: { placeBet, repeatBet, doubleBet, clearBets, selectChip, toggleSound, resetBalance },
    }),
    [state, user, flying, removeFlying, landChip, toast, forceWinner, handleSetForceWinner, modal, setModal, login, logout, refreshBalance, depositBalance, placeBet, repeatBet, doubleBet, clearBets, selectChip, toggleSound, resetBalance]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
