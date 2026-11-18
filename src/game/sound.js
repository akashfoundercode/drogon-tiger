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
    tone({ freq: 900, type: 'sine', dur: 0.05, vol: 0.05 });
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
  lose() {
    tone({ freq: 300, type: 'sine', dur: 0.4, vol: 0.08, slide: -120 });
  },
  error() {
    tone({ freq: 180, type: 'square', dur: 0.12, vol: 0.06 });
  },
};
