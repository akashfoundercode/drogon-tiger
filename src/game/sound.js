import dragonRoarMp3 from '../assets/sound/drogon_roar.mp3';
import dragonFlyMp3 from '../assets/sound/drogonflying.mp3';
import lionRoarMp3 from '../assets/sound/lionroar.mp3';
import mouseClickMp3 from '../assets/sound/universfield-mouse-click-351398.mp3';
import coinThrowMp3 from '../assets/sound/coin_throw.mp3';
import bgMusicMp3 from '../assets/sound/d_t_bg_music.mp3';

// WebAudio synth + HQ audio elements
let ctx = null;
let enabled = true;
let volume = 0.7;
let lastChip = 0;
let lastClick = 0;

let dragonRoarAudio = null;
let dragonFlyAudio = null;
let lionAudio = null;
let mouseClickAudio = null;
let coinThrowAudio = null;
let bgAudio = null;

let bgBaseVolume = 0.35;
let isDucked = false;
let duckTimeout = null;

function applyBgVolume(targetVol) {
  if (!bgAudio) return;
  bgAudio.volume = Math.max(0, Math.min(1, targetVol * volume));
}

export function duckBackground(durationMs = 2500, duckLevel = 0.08) {
  if (!bgAudio || !enabled) return;
  isDucked = true;
  if (duckTimeout) clearTimeout(duckTimeout);
  applyBgVolume(duckLevel);

  duckTimeout = setTimeout(() => {
    isDucked = false;
    if (enabled) {
      applyBgVolume(bgBaseVolume);
    }
  }, durationMs);
}

export function startBgMusic() {
  if (!bgAudio || !enabled) return;
  try {
    applyBgVolume(isDucked ? 0.08 : bgBaseVolume);
    const p = bgAudio.play();
    if (p && typeof p.then === 'function') {
      p.catch(() => {});
    }
  } catch {}
}

export function stopBgMusic() {
  if (bgAudio) {
    try {
      bgAudio.pause();
    } catch {}
  }
}

if (typeof window !== 'undefined') {
  try {
    dragonRoarAudio = new Audio(dragonRoarMp3);
    dragonRoarAudio.preload = 'auto';
  } catch {}
  try {
    dragonFlyAudio = new Audio(dragonFlyMp3);
    dragonFlyAudio.preload = 'auto';
  } catch {}
  try {
    lionAudio = new Audio(lionRoarMp3);
    lionAudio.preload = 'auto';
  } catch {}
  try {
    mouseClickAudio = new Audio(mouseClickMp3);
    mouseClickAudio.preload = 'auto';
  } catch {}
  try {
    coinThrowAudio = new Audio(coinThrowMp3);
    coinThrowAudio.preload = 'auto';
  } catch {}
  try {
    bgAudio = new Audio(bgMusicMp3);
    bgAudio.preload = 'auto';
    bgAudio.loop = true;
    bgAudio.volume = bgBaseVolume * volume;
  } catch {}
}

// Pre-decoded AudioBuffers for Web Audio API (ensures 100% reliable playback on mobile devices)
const buffers = {
  dragonFly: null,
  dragonRoar: null,
  lionRoar: null,
  mouseClick: null,
  coinThrow: null,
};

let buffersLoading = false;
function loadBuffers() {
  if (buffersLoading || typeof window === 'undefined') return;
  const c = audio();
  if (!c) return;
  buffersLoading = true;

  const fetchAndDecode = async (url, key) => {
    try {
      const res = await fetch(url);
      const arrayBuf = await res.arrayBuffer();
      c.decodeAudioData(
        arrayBuf,
        (decoded) => {
          if (key === 'mouseClick') {
            // universfield-mouse-click MP3 contains 2 clicks (press at 0.13s and release at 0.25s).
            // Trim to strictly 0.19s to guarantee a single crisp click!
            const trimFrames = Math.min(decoded.length, Math.floor(decoded.sampleRate * 0.19));
            const singleBuf = c.createBuffer(decoded.numberOfChannels, trimFrames, decoded.sampleRate);
            for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
              singleBuf.copyToChannel(decoded.getChannelData(ch).subarray(0, trimFrames), ch);
            }
            buffers[key] = singleBuf;
          } else {
            buffers[key] = decoded;
          }
        },
        (err) => {
          console.warn('Decode error for', key, err);
        }
      );
    } catch (err) {
      console.warn('Fetch error for', key, err);
    }
  };

  fetchAndDecode(dragonFlyMp3, 'dragonFly');
  fetchAndDecode(dragonRoarMp3, 'dragonRoar');
  fetchAndDecode(lionRoarMp3, 'lionRoar');
  fetchAndDecode(mouseClickMp3, 'mouseClick');
  fetchAndDecode(coinThrowMp3, 'coinThrow');
}

// Mobile Audio Auto-unlocker: unlocks Web Audio & HTML5 Audio on the first user interaction
let unlocked = false;
function unlockAudio() {
  const c = audio();
  if (c && c.state === 'suspended') {
    c.resume().catch(() => {});
  }

  if (c && !unlocked) {
    try {
      // 1-sample silent sound to unlock iOS Safari Web Audio
      const b = c.createBuffer(1, 1, 22050);
      const s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch {}
  }

  // Pre-unlock HTML5 audio elements on mobile
  if (!unlocked) {
    [dragonFlyAudio, dragonRoarAudio, lionAudio, mouseClickAudio, coinThrowAudio, bgAudio].forEach((a) => {
      if (a) {
        try {
          const p = a.play();
          if (p && typeof p.then === 'function') {
            p.then(() => {
              if (a !== bgAudio) {
                a.pause();
                a.currentTime = 0;
              }
            }).catch(() => {});
          }
        } catch {}
      }
    });
  }

  loadBuffers();
  startBgMusic();
  unlocked = true;
}

if (typeof window !== 'undefined') {
  ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'click', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { capture: true, passive: true });
    document.addEventListener(evt, unlockAudio, { capture: true, passive: true });
  });

  const onPointerDown = (e) => {
    const el = e.target;
    if (!el) return;
    const isInteractive = el.closest(
      'button, [role="button"], a, input, select, [data-panel], [data-chip-src], .cursor-pointer'
    );
    if (isInteractive) {
      sfx.click();
    }
  };
  window.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(loadBuffers, 100);
  } else {
    window.addEventListener('DOMContentLoaded', () => setTimeout(loadBuffers, 100));
  }
}

function audio() {
  if (!ctx && typeof window !== 'undefined') {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

// Track currently active Web Audio BufferSource nodes so they can be stopped on demand
const activeBufferNodes = {
  dragonFly: null,
  dragonRoar: null,
  lionRoar: null,
};

function playAudioBuffer(key, vol = 1) {
  if (!enabled) return;
  const c = audio();
  if (!c) return;

  const buf = buffers[key];
  if (!buf) {
    loadBuffers();
    return;
  }

  try {
    if (c.state === 'suspended') {
      c.resume().catch(() => {});
    }

    // Stop any currently playing node for this key
    stopAudioBuffer(key);

    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    const effectiveVol = Math.max(0, Math.min(1, vol * volume));
    gain.gain.setValueAtTime(effectiveVol, c.currentTime);

    src.connect(gain);
    gain.connect(c.destination);
    src.start(0);

    activeBufferNodes[key] = src;
    src.onended = () => {
      if (activeBufferNodes[key] === src) {
        activeBufferNodes[key] = null;
      }
    };
  } catch (err) {
    console.warn('playAudioBuffer error:', key, err);
  }
}

function stopAudioBuffer(key) {
  const node = activeBufferNodes[key];
  if (node) {
    try {
      node.stop(0);
      node.disconnect();
    } catch {}
    activeBufferNodes[key] = null;
  }
}

function tone({ freq = 440, type = 'sine', dur = 0.1, vol = 0.1, slide = 0, delay = 0 }) {
  if (!enabled) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol * volume, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({ dur = 0.12, vol = 0.08, delay = 0, hp = 1500 }) {
  if (!enabled) return;
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = c.createGain();
  g.gain.value = vol * volume;
  src.connect(f);
  f.connect(g);
  g.connect(c.destination);
  src.start(t);
}

export const sfx = {
  setEnabled(v) {
    enabled = v;
    if (!v) {
      this.stopTigerAudio();
      this.stopDragonAudio();
      stopBgMusic();
    } else {
      startBgMusic();
    }
  },
  setVolume(v) {
    volume = v;
    const clamped = Math.max(0, Math.min(1, v));
    [dragonRoarAudio, dragonFlyAudio, lionAudio, mouseClickAudio, coinThrowAudio].forEach((a) => {
      if (a) {
        try {
          a.volume = clamped;
        } catch {}
      }
    });
    if (bgAudio) {
      applyBgVolume(isDucked ? 0.08 : bgBaseVolume);
    }
  },
  duck(dur = 2500, level = 0.08) {
    duckBackground(dur, level);
  },
  click() {
    if (!enabled) return;
    const now = performance.now();
    if (now - lastClick < 160) return;
    lastClick = now;

    const c = audio();
    if (c && buffers.mouseClick) {
      try {
        if (c.state === 'suspended') {
          c.resume().catch(() => {});
        }
        const src = c.createBufferSource();
        src.buffer = buffers.mouseClick;
        const gain = c.createGain();
        const effectiveVol = Math.max(0, Math.min(1, 0.95 * volume));
        gain.gain.setValueAtTime(effectiveVol, c.currentTime);
        src.connect(gain);
        gain.connect(c.destination);
        src.start(0);
        return;
      } catch {}
    }

    try {
      if (mouseClickAudio) {
        const clone = mouseClickAudio.cloneNode();
        clone.volume = Math.max(0, Math.min(1, volume));
        clone.currentTime = 0;
        clone.play().catch(() => {});
        setTimeout(() => {
          try {
            clone.pause();
            clone.currentTime = 0;
          } catch {}
        }, 190);
      }
    } catch {}
  },
  // Coin Throw sound – plays coin_throw.mp3 alongside background music (does NOT duck BGM!)
  chip() {
    if (!enabled) return;
    const now = performance.now();
    if (now - lastChip < 35) return;
    lastChip = now;

    // 1. Zero-latency polyphonic playback via Web Audio API Buffer
    const c = audio();
    if (c && buffers.coinThrow) {
      try {
        if (c.state === 'suspended') {
          c.resume().catch(() => {});
        }
        const src = c.createBufferSource();
        src.buffer = buffers.coinThrow;
        // Natural micro pitch variation (0.94 - 1.06) so rapid coin throws sound lively
        src.playbackRate.value = 0.94 + Math.random() * 0.12;

        const gain = c.createGain();
        const effectiveVol = Math.max(0, Math.min(1, 0.88 * volume));
        gain.gain.setValueAtTime(effectiveVol, c.currentTime);
        src.connect(gain);
        gain.connect(c.destination);
        src.start(0);
        return;
      } catch {}
    }

    // 2. HTML5 Audio clone fallback
    try {
      if (coinThrowAudio) {
        const clone = coinThrowAudio.cloneNode();
        clone.volume = Math.max(0, Math.min(1, 0.88 * volume));
        clone.play().catch(() => {});
      }
    } catch {}
  },
  coinThrow() {
    this.chip();
  },
  select() {
    this.click();
  },
  tick() {
    tone({ freq: 1200, type: 'square', dur: 0.05, vol: 0.04 });
  },
  open() {
    duckBackground(1500, 0.14);
    [523, 659, 784].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.08, delay: i * 0.08 }));
  },
  lock() {
    duckBackground(1500, 0.12);
    tone({ freq: 140, type: 'sawtooth', dur: 0.35, vol: 0.14, slide: -80 });
    noise({ dur: 0.2, vol: 0.1, hp: 600 });
  },
  flip() {
    duckBackground(1200, 0.14);
    noise({ dur: 0.18, vol: 0.09, hp: 2500 });
    tone({ freq: 320, type: 'triangle', dur: 0.12, vol: 0.05, slide: 200 });
  },
  win() {
    duckBackground(2800, 0.08);
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone({ freq: f, type: 'triangle', dur: 0.35, vol: 0.09, delay: i * 0.09 })
    );
  },
  tigerImpact() {
    if (!enabled) return;
    duckBackground(2000, 0.08);
    // 0. Violent wall break / shatter impact crunch at t=0
    noise({ dur: 0.38, vol: 0.35, hp: 350 });
    tone({ freq: 65, type: 'sawtooth', dur: 0.5, vol: 0.4, slide: -35 });
    tone({ freq: 140, type: 'square', dur: 0.22, vol: 0.22, slide: -80 });

    // 1. Initial jump impact / sub drop
    tone({ freq: 120, type: 'sawtooth', dur: 0.6, vol: 0.24, slide: -70, delay: 0.08 });
    tone({ freq: 90, type: 'sine', dur: 0.85, vol: 0.38, slide: -50, delay: 0.05 });
  },
  tigerRoar() {
    if (!enabled) return;
    duckBackground(3800, 0.06);

    // 1. Play via Web Audio API Buffer (bypasses mobile browser autoplay restrictions!)
    playAudioBuffer('lionRoar', 1);

    // 2. Play HQ Lion Roar MP3 as dual-fallback
    try {
      if (!lionAudio) {
        lionAudio = new Audio(lionRoarMp3);
      }
      lionAudio.volume = Math.max(0, Math.min(1, volume));
      lionAudio.currentTime = 0;
      const playPromise = lionAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } catch {}

    const c = audio();
    if (!c) return;
    const now = c.currentTime;

    // 2. Growling beast vocal cord modulation (noise + bandpass + tremolo)
    try {
      const dur = 2.4;
      const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const tSec = i / c.sampleRate;
        const tremolo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 28 * tSec); // 28Hz gut rattle
        data[i] = (Math.random() * 2 - 1) * tremolo;
      }
      const noiseSrc = c.createBufferSource();
      noiseSrc.buffer = buf;

      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(260, now);
      bp.frequency.exponentialRampToValueAtTime(420, now + 0.35);
      bp.frequency.exponentialRampToValueAtTime(150, now + dur);
      bp.Q.setValueAtTime(3.4, now);

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.35 * volume, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noiseSrc.connect(bp);
      bp.connect(gain);
      gain.connect(c.destination);
      noiseSrc.start(now);
    } catch {}

    // 3. Dual detuned roar pitch slide
    tone({ freq: 96, type: 'sawtooth', dur: 1.8, vol: 0.2, slide: 35, delay: 0.05 });
    tone({ freq: 100, type: 'sawtooth', dur: 1.7, vol: 0.2, slide: -30, delay: 0.1 });

    // 4. Triumphant victory fanfare chimes
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      tone({ freq: f, type: 'triangle', dur: 0.45, vol: 0.11, delay: 0.25 + i * 0.08 })
    );
  },
  dragonImpact() {
    if (!enabled) return;
    duckBackground(2000, 0.08);
    // Breakthrough wall crack / thunder impact at t=0
    noise({ dur: 0.42, vol: 0.38, hp: 280 });
    tone({ freq: 55, type: 'sawtooth', dur: 0.6, vol: 0.45, slide: -30 });
    tone({ freq: 160, type: 'square', dur: 0.25, vol: 0.24, slide: -90 });
    tone({ freq: 140, type: 'sawtooth', dur: 0.7, vol: 0.26, slide: -65, delay: 0.06 });
    tone({ freq: 80, type: 'sine', dur: 0.95, vol: 0.42, slide: -40, delay: 0.04 });
  },
  dragonFly() {
    if (!enabled) return;
    duckBackground(3800, 0.06);

    // 1. Play via Web Audio API Buffer (bypasses mobile browser autoplay restrictions!)
    playAudioBuffer('dragonFly', 1);

    // 2. Play via HTML5 Audio
    try {
      if (!dragonFlyAudio) {
        dragonFlyAudio = new Audio(dragonFlyMp3);
      }
      dragonFlyAudio.volume = Math.max(0, Math.min(1, volume));
      dragonFlyAudio.currentTime = 0;

      const playPromise = dragonFlyAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn('Dragon fly audio prevented:', e);
        });
      }
    } catch (err) {
      console.warn('Dragon fly audio error:', err);
    }

    if (this._dragonFlyTimer) {
      clearTimeout(this._dragonFlyTimer);
      this._dragonFlyTimer = null;
    }

    let roarTriggered = false;
    const triggerRoar = () => {
      if (!roarTriggered && enabled) {
        roarTriggered = true;
        if (this._dragonFlyTimer) {
          clearTimeout(this._dragonFlyTimer);
          this._dragonFlyTimer = null;
        }
        this.dragonRoar();
      }
    };

    // Flying sound ke baad roar sound 2.7s par trigger hoga
    this._dragonFlyTimer = setTimeout(triggerRoar, 2700);
  },
  dragonRoar() {
    if (!enabled) return;
    duckBackground(3800, 0.06);

    // 1. Stop fly audio
    stopAudioBuffer('dragonFly');
    try {
      if (dragonFlyAudio) {
        dragonFlyAudio.onended = null;
        dragonFlyAudio.pause();
      }
    } catch {}

    // 2. Play via Web Audio API Buffer
    playAudioBuffer('dragonRoar', 1);

    // 3. Play via HTML5 Audio
    try {
      if (!dragonRoarAudio) {
        dragonRoarAudio = new Audio(dragonRoarMp3);
      }
      dragonRoarAudio.volume = Math.max(0, Math.min(1, volume));
      dragonRoarAudio.currentTime = 0;
      const playPromise = dragonRoarAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn('Dragon audio play prevented:', e);
        });
      }
    } catch (err) {
      console.warn('Dragon audio error:', err);
    }

    // 4. Regal Dragon victory fanfare in bright celestial chords
    [440, 554, 659, 880, 1108, 1318].forEach((f, i) =>
      tone({ freq: f, type: 'triangle', dur: 0.45, vol: 0.11, delay: 0.2 + i * 0.08 })
    );
  },
  stopDragonAudio() {
    if (this._dragonFlyTimer) {
      clearTimeout(this._dragonFlyTimer);
      this._dragonFlyTimer = null;
    }
    stopAudioBuffer('dragonFly');
    stopAudioBuffer('dragonRoar');
    [dragonFlyAudio, dragonRoarAudio].forEach((a) => {
      if (a) {
        try {
          a.onended = null;
          a.pause();
          a.currentTime = 0;
        } catch {}
      }
    });
  },
  dragonWin() {
    // 1. Wall break impact
    this.dragonImpact();
    // 2. Dragon fly audio starts when dragon starts flying
    this.dragonFly();
  },
  stopTigerAudio() {
    if (this._tigerTimer) {
      clearTimeout(this._tigerTimer);
      this._tigerTimer = null;
    }
    stopAudioBuffer('lionRoar');
    if (lionAudio) {
      try {
        lionAudio.pause();
        lionAudio.currentTime = 0;
      } catch {}
    }
  },
  tigerWin() {
    // 0. Wall break shatter impact at t=0
    this.tigerImpact();

    // 1. Thoda ruk kar (~1.25s par) jab tiger jump karke aage land kare aur muh khole tab roar bajega
    if (this._tigerTimer) clearTimeout(this._tigerTimer);
    this._tigerTimer = setTimeout(() => {
      this.tigerRoar();
    }, 1250);
  },
  lose() {
    tone({ freq: 300, type: 'sine', dur: 0.4, vol: 0.08, slide: -120 });
  },
  error() {
    tone({ freq: 180, type: 'square', dur: 0.12, vol: 0.06 });
  },
};
