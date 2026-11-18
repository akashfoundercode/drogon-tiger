// Tiny WebAudio synth – no audio files needed.
let ctx = null;
let enabled = true;
let volume = 0.7;
let lastChip = 0;

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
  },
  setVolume(v) {
    volume = v;
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
  tigerRoar() {
    if (!enabled) return;
    const c = audio();
    if (!c) return;
    const now = c.currentTime;

    // 0. Violent wall break / shatter impact crunch
    noise({ dur: 0.38, vol: 0.35, hp: 350 });
    tone({ freq: 65, type: 'sawtooth', dur: 0.5, vol: 0.4, slide: -35 });
    tone({ freq: 140, type: 'square', dur: 0.22, vol: 0.22, slide: -80 });

    // 1. Initial jump impact / sub drop
    tone({ freq: 120, type: 'sawtooth', dur: 0.6, vol: 0.24, slide: -70, delay: 0.08 });
    tone({ freq: 90, type: 'sine', dur: 0.85, vol: 0.38, slide: -50, delay: 0.05 });

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
  tigerWin() {
    this.tigerRoar();
  },
  lose() {
    tone({ freq: 300, type: 'sine', dur: 0.4, vol: 0.08, slide: -120 });
  },
  error() {
    tone({ freq: 180, type: 'square', dur: 0.12, vol: 0.06 });
  },
};
