import dragonRoarMp3 from '../assets/sound/drogon_roar.mp3';
import dragonFlyMp3 from '../assets/sound/drogonflying.mp3';
import lionRoarMp3 from '../assets/sound/lionroar.mp3';

// WebAudio synth + HQ audio elements
let ctx = null;
let enabled = true;
let volume = 0.7;
let lastChip = 0;

let dragonRoarAudio = null;
let dragonFlyAudio = null;
let lionAudio = null;

if (typeof window !== 'undefined') {
  try {
    dragonRoarAudio = new Audio(dragonRoarMp3);
    dragonRoarAudio.preload = 'auto';
  } catch {
    // ignore
  }
  try {
    dragonFlyAudio = new Audio(dragonFlyMp3);
    dragonFlyAudio.preload = 'auto';
  } catch {
    // ignore
  }
  try {
    lionAudio = new Audio(lionRoarMp3);
    lionAudio.preload = 'auto';
  } catch {
    // ignore
  }
}

function audio() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
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
    }
  },
  setVolume(v) {
    volume = v;
    const clamped = Math.max(0, Math.min(1, v));
    [dragonRoarAudio, dragonFlyAudio, lionAudio].forEach((a) => {
      if (a) {
        try {
          a.volume = clamped;
        } catch {}
      }
    });
  },
  chip() {
    const now = performance.now();
    if (now - lastChip < 45) return;
    lastChip = now;
    tone({ freq: 1700 + Math.random() * 500, type: 'triangle', dur: 0.07, vol: 0.09 });
    tone({ freq: 2700, type: 'sine', dur: 0.06, vol: 0.04, delay: 0.015 });
  },
  select() {
    tone({ freq: 1100, type: 'triangle', dur: 0.04, vol: 0.08 });
    tone({ freq: 450, type: 'sine', dur: 0.06, vol: 0.06, slide: -150 });
  },
  tick() {
    tone({ freq: 1200, type: 'square', dur: 0.05, vol: 0.04 });
  },
  open() {
    [523, 659, 784].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.08, delay: i * 0.08 }));
  },
  lock() {
    tone({ freq: 140, type: 'sawtooth', dur: 0.35, vol: 0.14, slide: -80 });
    noise({ dur: 0.2, vol: 0.1, hp: 600 });
  },
  flip() {
    noise({ dur: 0.18, vol: 0.09, hp: 2500 });
    tone({ freq: 320, type: 'triangle', dur: 0.12, vol: 0.05, slide: 200 });
  },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone({ freq: f, type: 'triangle', dur: 0.35, vol: 0.09, delay: i * 0.09 })
    );
  },
  tigerImpact() {
    if (!enabled) return;
    const c = audio();
    if (!c) return;

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

    // Play HQ Lion Roar MP3
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
    } catch {
      // Fallback
    }

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
    const c = audio();
    if (!c) return;

    // Breakthrough wall crack / thunder impact at t=0
    noise({ dur: 0.42, vol: 0.38, hp: 280 });
    tone({ freq: 55, type: 'sawtooth', dur: 0.6, vol: 0.45, slide: -30 });
    tone({ freq: 160, type: 'square', dur: 0.25, vol: 0.24, slide: -90 });
    tone({ freq: 140, type: 'sawtooth', dur: 0.7, vol: 0.26, slide: -65, delay: 0.06 });
    tone({ freq: 80, type: 'sine', dur: 0.95, vol: 0.42, slide: -40, delay: 0.04 });
  },
  dragonFly() {
    if (!enabled) return;
    try {
      if (!dragonFlyAudio) {
        dragonFlyAudio = new Audio(dragonFlyMp3);
      }
      dragonFlyAudio.volume = Math.max(0, Math.min(1, volume));
      dragonFlyAudio.currentTime = 0;

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

      // Flying sound ke baad roar sound thoda aur pehle play ho (2.7s par)
      this._dragonFlyTimer = setTimeout(triggerRoar, 2700);

      const playPromise = dragonFlyAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn('Dragon fly audio prevented:', e);
        });
      }
    } catch (err) {
      console.warn('Dragon fly audio error:', err);
    }
  },
  dragonRoar() {
    if (!enabled) return;

    // 1. Pause fly audio when roar starts so sound is clear
    try {
      if (dragonFlyAudio) {
        dragonFlyAudio.onended = null;
        dragonFlyAudio.pause();
      }
    } catch {}

    // 2. Play real Dragon Roar MP3 when dragon lands in standing position
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

    const c = audio();
    if (!c) return;

    // 3. Regal Dragon victory fanfare in bright celestial chords
    [440, 554, 659, 880, 1108, 1318].forEach((f, i) =>
      tone({ freq: f, type: 'triangle', dur: 0.45, vol: 0.11, delay: 0.2 + i * 0.08 })
    );
  },
  stopDragonAudio() {
    if (this._dragonFlyTimer) {
      clearTimeout(this._dragonFlyTimer);
      this._dragonFlyTimer = null;
    }
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
