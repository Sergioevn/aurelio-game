// Effetti sonori chiptune generati al volo (nessun file audio da scaricare)
import { save } from './util.js';

let ctx = null;
export const sfx = {
  muted: save.get('muted', false),
  unlock() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch {}
  },
  toggle() { this.muted = !this.muted; save.set('muted', this.muted); return this.muted; },
  tone(freqs, dur = 0.08, type = 'square', vol = 0.06) {
    if (this.muted || !ctx) return;
    const t0 = ctx.currentTime;
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = f;
      const t = t0 + i * dur;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + dur);
    });
  },
  pick()   { this.tone([660, 990]); },
  boost()  { this.tone([523, 659, 784, 1047], 0.07); },
  hit()    { this.tone([220, 150, 110], 0.09, 'sawtooth', 0.07); },
  friend() { this.tone([784, 988, 1175, 1568], 0.09, 'triangle', 0.09); },
  boss()   { this.tone([196, 185, 175, 165], 0.15, 'square', 0.05); },
  smash()  { this.tone([1200, 600], 0.05, 'square', 0.05); },
  shoot()  { this.tone([900, 1400], 0.03, 'square', 0.03); },
  wind()   { this.tone([180, 220, 200, 160], 0.12, 'triangle', 0.04); },
  fall()   { this.tone([880, 740, 587, 440, 330, 220], 0.09, 'triangle', 0.08); },
  win()    { this.tone([523, 659, 784, 1047, 784, 1047], 0.1, 'triangle', 0.09); },
  ring()   { this.tone([1320, 1100, 1320, 1100, 1320, 1100], 0.05, 'square', 0.04); },
  over()   { this.tone([392, 330, 262, 196], 0.18, 'triangle', 0.08); }
};
