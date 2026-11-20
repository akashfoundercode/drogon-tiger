import { io } from 'socket.io-client';

const API_BASE = ''; // Uses Vite proxy to server or relative path

// Authentication Token Helpers
export function getAuthToken() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('dt_auth_token') || null;
    }
  } catch (e) {}
  return null;
}

export function setAuthToken(token) {
  try {
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem('dt_auth_token', token);
      } else {
        localStorage.removeItem('dt_auth_token');
      }
    }
  } catch (e) {}
}

export const api = {
  async login({ mobile, country_code = '91', password }) {
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, country_code, password }),
      });
      return await res.json();
    } catch (e) {
      console.warn('API login proxy error, trying direct:', e);
      try {
        const res2 = await fetch('https://api.wingo4all.site/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, country_code, password }),
        });
        return await res2.json();
      } catch (err2) {
        console.warn('Direct login error:', err2);
        return { status: 500, message: 'Network connection failed' };
      }
    }
  },

  async getProfile(tokenOverride) {
    const token = tokenOverride || getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['token'] = token;
    }
    try {
      const res = await fetch(`${API_BASE}/api/profile`, { headers });
      return await res.json();
    } catch (e) {
      console.warn('API getProfile proxy error, trying direct:', e);
      try {
        const res2 = await fetch('https://api.wingo4all.site/api/profile', { headers });
        return await res2.json();
      } catch (err2) {
        console.warn('Direct getProfile error:', err2);
        return null;
      }
    }
  },

  async getResults(limit = 10, offset = 0) {
    const query = `limit=${limit}&offset=${offset}`;
    try {
      const res = await fetch(`${API_BASE}/dragon_results?${query}`);
      return await res.json();
    } catch (e) {
      console.warn('API getResults error, trying aliases/direct:', e);
      try {
        const res2 = await fetch(`${API_BASE}/api/dragon/results?${query}`);
        return await res2.json();
      } catch (err2) {
        try {
          const res3 = await fetch(`https://api.wingo4all.site/dragon_results?${query}`);
          return await res3.json();
        } catch (err3) {
          console.warn('Direct getResults error:', err3);
          return null;
        }
      }
    }
  },

  async getCurrentRound() {
    try {
      const res = await fetch(`${API_BASE}/dragon/current-round`);
      return await res.json();
    } catch (e) {
      console.warn('API getCurrentRound error, trying aliases/direct:', e);
      try {
        const res2 = await fetch(`${API_BASE}/api/dragon/current-round`);
        return await res2.json();
      } catch (err2) {
        try {
          const res3 = await fetch('https://api.wingo4all.site/dragon/current-round');
          return await res3.json();
        } catch (err3) {
          console.warn('Direct getCurrentRound error:', err3);
          return null;
        }
      }
    }
  },

  async placeBet({ spot, amount, dragon, tiger, tie, tokenOverride, userid = 12, username = 'Akash_Rai' }) {
    const token = tokenOverride || getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['token'] = token;
    }

    const payload = spot
      ? { spot, amount, userid, username }
      : { dragon, tiger, tie, userid, username };

    try {
      const res = await fetch(`${API_BASE}/dragon/bet`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e) {
      console.warn('API placeBet error, trying aliases/direct:', e);
      try {
        const res2 = await fetch(`${API_BASE}/api/dragon/bet`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        return await res2.json();
      } catch (err2) {
        try {
          const res3 = await fetch('https://api.wingo4all.site/dragon/bet', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          return await res3.json();
        } catch (err3) {
          console.warn('Direct placeBet error:', err3);
          return null;
        }
      }
    }
  },

  async getBetHistory({ limit = 10, offset = 0, tokenOverride, userid = 12 } = {}) {
    const token = tokenOverride || getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['token'] = token;
    }
    const query = `limit=${limit}&offset=${offset}&userid=${userid}`;

    try {
      const res = await fetch(`${API_BASE}/dragon/bet-history?${query}`, { headers });
      return await res.json();
    } catch (e) {
      console.warn('API getBetHistory error, trying aliases/direct:', e);
      try {
        const res2 = await fetch(`${API_BASE}/api/dragon/bet-history?${query}`, { headers });
        return await res2.json();
      } catch (err2) {
        try {
          const res3 = await fetch(`https://api.wingo4all.site/dragon/bet-history?${query}`, { headers });
          return await res3.json();
        } catch (err3) {
          console.warn('Direct getBetHistory error:', err3);
          return null;
        }
      }
    }
  },

  async setAdminControl(winner) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/dragon/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner }),
      });
      return await res.json();
    } catch (e) {
      console.warn('API setAdminControl error:', e);
      return null;
    }
  },

  async getAdminBets() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/dragon/bets`);
      return await res.json();
    } catch (e) {
      console.warn('API getAdminBets error:', e);
      return null;
    }
  },

  async getBalance(userid = 12) {
    try {
      const res = await fetch(`${API_BASE}/api/user/balance?userid=${userid}`);
      return await res.json();
    } catch (e) {
      console.warn('API getBalance error:', e);
      return null;
    }
  },
};

/**
 * Socket Manager for Socket 1 (/dragon-tiger) and Socket 2 (/dragon-tiger-admin)
 * Primary URL: https://api.wingo4all.site/dragon-tiger
 */
let playerSocket = null;
let adminSocket = null;

export const PRIMARY_SOCKET_URL =
  (typeof window !== 'undefined' && window.DRAGON_TIGER_SOCKET_URL) ||
  import.meta.env?.VITE_SOCKET_URL ||
  'https://api.wingo4all.site/dragon-tiger';

export function connectGameSockets(callbacks = {}) {
  const {
    onTimer,
    onState,
    onRevealing,
    onRoundSettled,
    onBetPulse,
    onBetSuccess,
    onBetError,
    onGameUpdate,
    onBetting,
    onAdminStream,
  } = callbacks;

  try {
    // 1. Socket 1: Player Game Flow Namespace (/dragon-tiger)
    // Tries PRIMARY_SOCKET_URL (https://api.wingo4all.site/dragon-tiger)
    // with automatic fallback to local /dragon-tiger proxy if remote is unreachable
    const socketOpts = {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
    };

    try {
      playerSocket = io(PRIMARY_SOCKET_URL, socketOpts);
    } catch (e) {
      playerSocket = io('/dragon-tiger', socketOpts);
    }

    // Fallback to local if remote connection fails
    playerSocket.on('connect_error', () => {
      if (playerSocket.io.uri !== '/dragon-tiger' && !playerSocket.io.uri.includes('localhost') && !playerSocket.io.uri.includes('127.0.0.1')) {
        console.warn('Switching to local proxy /dragon-tiger');
        try {
          playerSocket.disconnect();
          playerSocket = io('/dragon-tiger', socketOpts);
          attachPlayerEvents(playerSocket);
        } catch (err) {}
      }
    });

    function attachPlayerEvents(sock) {
      sock.on('connect', () => {
        console.log('Connected to Player Socket (/dragon-tiger)');
      });

      // 1. dragon_tiger:timer (Server -> Client)
      sock.on('dragon_tiger:timer', (data) => {
        if (onTimer) onTimer(data);
        if (onBetting && data?.status === 'betting') onBetting(data);
      });

      // 2. dragon_tiger:state (Server -> Client)
      sock.on('dragon_tiger:state', (data) => {
        if (onState) onState(data);
        if (onGameUpdate) onGameUpdate(data);
      });

      // 3. dragon_tiger:revealing (Server -> Client)
      sock.on('dragon_tiger:revealing', (data) => {
        if (onRevealing) onRevealing(data);
      });

      // 4. dragon_tiger:round_settled (Server -> Client)
      sock.on('dragon_tiger:round_settled', (data) => {
        if (onRoundSettled) onRoundSettled(data);
      });

      // 5. dragon_tiger:bet_pulse (Server -> Client)
      sock.on('dragon_tiger:bet_pulse', (data) => {
        if (onBetPulse) onBetPulse(data);
      });

      // 7. dragon_tiger:bet_success (Server -> Client)
      sock.on('dragon_tiger:bet_success', (data) => {
        if (onBetSuccess) onBetSuccess(data);
      });

      // 8. dragon_tiger:bet_error (Server -> Client)
      sock.on('dragon_tiger:bet_error', (data) => {
        if (onBetError) onBetError(data);
      });

      // Backward compatibility with legacy events
      sock.on('game_state', (data) => {
        if (onGameUpdate) onGameUpdate(data);
      });
      sock.on('betting', (data) => {
        if (onBetting) onBetting(data);
      });
      sock.on('revealing', (data) => {
        if (onRevealing) onRevealing(data);
      });
    }

    attachPlayerEvents(playerSocket);

    // 2. Socket 2: Admin Live Bets Stream Namespace (/dragon-tiger-admin)
    adminSocket = io('/dragon-tiger-admin', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    adminSocket.on('connect', () => {
      console.log('Connected to Admin Socket (/dragon-tiger-admin)');
    });

    adminSocket.on('dragon_tiger:admin:stream', (data) => {
      if (onAdminStream) onAdminStream(data);
    });

    adminSocket.on('dragon_tiger:admin:bet_placed', (data) => {
      if (onAdminStream) onAdminStream(data);
    });

    return () => {
      if (playerSocket) playerSocket.disconnect();
      if (adminSocket) adminSocket.disconnect();
    };
  } catch (err) {
    console.warn('Socket connection error:', err);
    return () => {};
  }
}

/**
 * Event 6: dragon_tiger:place_bet (Client -> Server)
 * Emits bet over socket with REST API fallback
 */
export function placeBetSocket({ spot, amount, dragon, tiger, tie, userid = 12, username = 'Akash_Rai' }) {
  const payload = spot
    ? { spot, amount, userid, username }
    : { dragon, tiger, tie, userid, username };

  if (playerSocket && playerSocket.connected) {
    return new Promise((resolve) => {
      let resolved = false;
      playerSocket.emit('dragon_tiger:place_bet', payload, (res) => {
        if (!resolved) {
          resolved = true;
          resolve(res);
        }
      });
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          // In case server emitted bet_success/bet_error instead of callback
          resolve({ status: 200, message: 'Bet transmitted via socket' });
        }
      }, 1000);
    });
  } else {
    return api.placeBet(payload);
  }
}

export function getPlayerSocket() {
  return playerSocket;
}

export function getAdminSocket() {
  return adminSocket;
}
