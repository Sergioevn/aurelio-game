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
  coin()   { this.tone([988, 1319, 1568], 0.05, 'square', 0.05); },
  splash() { this.tone([400, 300, 200, 140, 100], 0.05, 'sawtooth', 0.06); },
  sing()   { this.tone([392, 523, 659, 784, 659, 784], 0.08, 'triangle', 0.08); },
  wave()   { this.tone([140, 110], 0.05, 'sine', 0.05); },
  over()   { this.tone([392, 330, 262, 196], 0.18, 'triangle', 0.08); },
  cin()    { this.tone([2093, 2794], 0.06, 'triangle', 0.09); },
  sip()    { this.tone([170, 130], 0.06, 'sine', 0.08); },
  near()   { this.tone([660, 0, 660], 0.08, 'square', 0.05); },
  order()  { this.tone([392, 370, 349, 262], 0.2, 'sawtooth', 0.05); },

  // Rumore di sottofondo leggero (strada e pub): rumore filtrato in loop, rispetta il tasto audio
  ambientStart(vol = 0.025) {
    if (this.muted || !ctx || this._amb) return;
    try {
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf; src.loop = true; f.type = 'lowpass'; f.frequency.value = 600; g.gain.value = vol;
      src.connect(f).connect(g).connect(ctx.destination); src.start();
      this._amb = src;
    } catch {}
  },
  ambientStop() { try { this._amb?.stop(); } catch {} this._amb = null; },

  // ---- SOLO DIECI (Sergio) ----
  thud()   { this.tone([95, 70], 0.04, 'sine', 0.09); },                 // mani di Aurelio sul tappeto
  conta()  { this.tone([784, 1175], 0.06, 'square', 0.05); },             // Sergio convalida
  buzz()   { this.tone([180, 120], 0.16, 'sawtooth', 0.06); },            // Sergio azzera
  flop()   { this.tone([660, 520, 400, 300, 200, 120], 0.06, 'triangle', 0.08); this.noise(0.12, 300, 0.12, 0.36); }, // Aurelio crolla
  whoosh() { this.noise(0.18, 900, 0.05); },
  // Rumore breve (filtrato): per il "psst" di Ludo e i tonfi
  noise(dur = 0.1, freq = 4000, vol = 0.05, delay = 0, type = 'bandpass') {
    if (this.muted || !ctx) return;
    try {
      const len = Math.ceil(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf; f.type = type; f.frequency.value = freq; g.gain.value = vol;
      src.connect(f).connect(g).connect(ctx.destination); src.start(ctx.currentTime + delay);
    } catch {}
  },
  psst() { this.noise(0.09, 5000, 0.05); this.noise(0.16, 6500, 0.05, 0.14); },

  // Musica "russa": loop chiptune ORIGINALE (la minore armonica, ritmo da polka slava).
  // Per sostituirla basta cambiare MELODIA / ACCORDI qui sotto (oppure caricare un file nello stesso punto).
  musicStart() {
    if (this.muted || !ctx || this._mus) return;
    const m = this._mus = { step: 0, next: ctx.currentTime + 0.06, boostUntil: 0, vol: 1 };
    m.timer = setInterval(() => this._musicTick(), 25);
  },
  musicStop() { if (this._mus) { clearInterval(this._mus.timer); this._mus = null; } },
  musicBoost(ms = 2500) { if (this._mus && ctx) this._mus.boostUntil = ctx.currentTime + ms / 1000; },
  _musicTick() {
    const m = this._mus;
    if (!m || !ctx || this.muted) { this.musicStop(); return; }
    while (m.next < ctx.currentTime + 0.12) {
      const boost = m.next < m.boostUntil;
      const eighth = 60 / (boost ? 172 : 152) / 2;
      const i = m.step % MELODIA.length;
      const note = MELODIA[i];
      if (note) this._note(note, m.next, eighth * 0.9, 'square', boost ? 0.05 : 0.032);
      // basso "oom-pah": fondamentale sui tempi forti, accordo sui deboli
      const ch = ACCORDI[Math.floor(i / 8)][Math.floor((i % 8) / 4)];
      if (i % 2 === 0) {
        const low = (i % 4 === 0) ? ch[0] - 12 : ch[1];
        this._note(low, m.next, eighth * 0.8, 'triangle', boost ? 0.09 : 0.07);
      } else if (boost || i % 4 === 3) this._note(ch[2], m.next, eighth * 0.35, 'square', 0.014);
      m.next += eighth; m.step++;
    }
  },
  _note(midi, t, dur, type, vol) {
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch {}
  }
};

// Melodia originale (note MIDI, 0 = pausa), 8 battute da 8 crome
const MELODIA = [
  69, 0, 72, 76, 81, 0, 76, 72,
  74, 0, 77, 81, 80, 0, 76, 0,
  77, 76, 74, 72, 71, 72, 74, 76,
  69, 0, 76, 0, 69, 0, 0, 0,
  72, 72, 71, 69, 68, 69, 71, 68,
  64, 0, 68, 71, 76, 0, 74, 72,
  74, 74, 72, 71, 72, 71, 69, 68,
  69, 64, 69, 72, 69, 0, 0, 0
];
// Accordi per mezza battuta: [fondamentale, quinta, terza alta]
const Am = [57, 52, 60], Dm = [62, 57, 65], E = [52, 59, 56];
const ACCORDI = [[Am, Am], [Dm, E], [Dm, Dm], [Am, E], [Am, Am], [E, E], [Dm, E], [Am, Am]];
