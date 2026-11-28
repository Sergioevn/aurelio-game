// Mini-gioco di Sergio: SOLO DIECI
// Area calisthenics. Sergio fa handstand push-up dando le spalle ad Aurelio; ogni tanto si ferma
// in verticale, oscilla, gira la testa e controlla. Aurelio (tieni premuto = flessioni) deve farsi
// contare 10 flessioni facendone il meno possibile: Sergio conta solo quelle che VEDE, e se lo trova
// fermo azzera la serie. Ogni flessione vera riempie la barra "DOMS DI DOMANI".
// In scena anche Ludo (trazioni alla sbarra, complice di Aurelio) e Francesco ("Fra") in panchina.
import { W, H, txt } from '../util.js';
import { sfx } from '../sfx.js';
import { SOLODIECI as C } from '../data/characters.js';

const OUT = 0x1a1423;
const SKIN = 0xeab38b;
const HS = 2;                    // scala delle teste (pixel art)

// --- posizioni della scena ---
const GY = 394;                  // pavimento sotto Aurelio
const A_HAND = { x: 116, y: GY - 2 }, A_TOE = { x: 214, y: GY - 3 };
const SX = 62, GS = 358;         // Sergio: x e pavimento
const HAND_Y = GS - 12;          // mani di Sergio sui parallettes
const BAR_Y = 104, LX = 176, L_GROUND = 212;  // sbarra e Ludo
const FX = 234, FEET_F = 326;    // Francesco in panchina
const SPK = { x: 30, y: 309 };   // cassa della musica (sopra un blocco di cemento)

const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k * k * (3 - 2 * k);
const clamp01 = k => Math.max(0, Math.min(1, k));
const pick = a => a[Math.floor(Math.random() * a.length)];
const rnd = (a, b) => a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const P = (x, y) => ({ x, y });
const lp = (p, q, k) => ({ x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k) });

// Braccio a due segmenti: trova il gomito (sceglie la piega più vicina alla direzione "pref")
function ik(a, b, l1, l2, pref) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
  if (d >= l1 + l2) return lp(a, b, l1 / (l1 + l2));
  const ux = dx / d, uy = dy / d, x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const c1 = { x: a.x + ux * x - uy * h, y: a.y + uy * x + ux * h };
  const c2 = { x: a.x + ux * x + uy * h, y: a.y + uy * x - ux * h };
  const s1 = (c1.x - a.x) * pref.x + (c1.y - a.y) * pref.y, s2 = (c2.x - a.x) * pref.x + (c2.y - a.y) * pref.y;
  return s1 >= s2 ? c1 : c2;
}

export class MiniSoloDieci extends Phaser.Scene {
  constructor() { super('MiniSoloDieci'); }

  init(data) { this.standalone = !!data?.standalone; }

  create() {
    // ---------- stato: tutto azzerato a ogni avvio / riprova ----------
    this.phase = 'intro'; this.canStart = false; this.canLeave = false; this.win_ = false;
    this.t = 0;                                   // orologio delle animazioni (ms)
    this.playT = 0;                               // tempo di gioco vero e proprio (ms)
    this.count = 0; this.real = 0;                // convalidate da Sergio / fatte davvero
    this.domsShown = 0;
    this.repT = null; this.repId = 0; this.repCounted = false; this.lastValidRep = -1;
    this.idleMs = 0;
    this.pointers = new Set(); this.space = false; this.block = false;
    this.aFace = null; this.aFaceMs = 0; this.flatK = 0; this.aLookUp = 0; this.sweatMs = 0; this.slump = 0;
    // Sergio
    this.sMode = 'stand';                         // stand | anim | hs
    this.sPose = null; this.sAnim = null;
    this.queue = []; this.seg = null; this.segT = 0; this.checks = 0; this.check = null;
    this.scattoDone = false; this.scattoAt = rndi(C.scatto.controlli[0], C.scatto.controlli[1]);
    this.sNod = 0; this.sShake = 0; this.sTalkMs = 0;
    // Ludo
    this.lState = 'hang'; this.lT = 0; this.lMs = 900; this.lReps = 0; this.lFace = null; this.lFaceMs = 0;
    this.lWinkDone = false; this.lHop = 0; this.lOneArm = 0;
    this.catanDone = false; this.catanOn = false;
    this.daiCount = 0; this.lastDai = -99999; this.daiHigh = false;
    // Francesco
    this.fLaugh = 0; this.fLookUp = 0; this.fJump = 0; this.fMouth = 0;
    this.bubbles = {};

    this.drawScene();

    // personaggi
    this.gS = this.add.graphics().setDepth(6);            // corpo di Sergio
    this.sHead = this.add.image(0, 0, 'sergio_profilo').setScale(HS).setDepth(7);
    this.gA = this.add.graphics().setDepth(8);            // corpo di Aurelio
    this.aHead = this.add.image(0, 0, 'aurelio_profilo').setScale(HS).setDepth(9);
    this.ludo = this.add.image(LX, 0, 'ludo').setScale(2).setOrigin(0.5, 0).setDepth(3);
    this.gL = this.add.graphics().setDepth(4);            // braccia di Ludo
    this.fra = this.add.image(FX, FEET_F, 'francesco_seduto').setScale(2).setOrigin(0.5, 1).setDepth(5);
    this.gF = this.add.graphics().setDepth(5.5);          // braccia e telefono di Francesco

    this.sPose = this.standPose();
    this.drawHUD();

    // ---------- input: un solo tasto (tocco, mouse, barra spaziatrice) ----------
    this.input.on('pointerdown', p => this.down(p));
    this.input.on('pointerup', p => this.up(p));
    this.input.on('pointerupoutside', p => this.up(p));
    this.input.keyboard?.addCapture('SPACE');
    this.input.keyboard?.on('keydown-SPACE', e => { if (!e.repeat) this.down(null); });
    this.input.keyboard?.on('keyup-SPACE', () => this.up(null));
    const releaseAll = () => { this.pointers.clear(); this.space = false; this.block = false; };
    const onBlur = () => releaseAll();
    const onHidden = () => { releaseAll(); sfx.musicStop(); sfx.ambientStop(); };
    const onVisible = () => { if (['start', 'play', 'end'].includes(this.phase)) { sfx.musicStart(); sfx.ambientStart(0.015); } };
    const canvas = this.game.canvas;
    const onCancel = () => releaseAll();
    const noMenu = e => e.preventDefault();
    this.game.events.on('blur', onBlur);
    this.game.events.on('hidden', onHidden);
    this.game.events.on('visible', onVisible);
    canvas.addEventListener('touchcancel', onCancel);
    canvas.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('contextmenu', noMenu);
    this.events.once('shutdown', () => {
      this.game.events.off('blur', onBlur); this.game.events.off('hidden', onHidden); this.game.events.off('visible', onVisible);
      canvas.removeEventListener('touchcancel', onCancel);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('contextmenu', noMenu);
      sfx.musicStop(); sfx.ambientStop();
    });

    this.render(0);
    this.intro();
  }

  // ================= SCENA =================
  drawScene() {
    const g = this.add.graphics().setDepth(0);
    // cielo e città lontana
    g.fillStyle(0x9fd3ef).fillRect(0, 24, W, 180);
    g.fillStyle(0xbfe3f0).fillRect(0, 120, W, 84);
    g.fillStyle(0xffffff, 0.8).fillEllipse(48, 84, 50, 10).fillEllipse(70, 80, 30, 10).fillEllipse(205, 92, 56, 10);
    const bld = [[0, 132, 30], [28, 118, 26], [52, 140, 22], [74, 126, 30], [210, 124, 28], [236, 112, 34]];
    for (const [x, y, w] of bld) {
      g.fillStyle(0x8a96aa).fillRect(x, y, w, 210 - y);
      g.fillStyle(0xa6b2c4); for (let yy = y + 5; yy < 196; yy += 9) for (let xx = x + 4; xx < x + w - 4; xx += 7) g.fillRect(xx, yy, 3, 4);
    }
    // alberi del parco
    for (const [x, r, c] of [[16, 22, 0x3f7d3a], [98, 26, 0x2f5e2c], [150, 18, 0x3f7d3a], [252, 24, 0x2f5e2c], [210, 16, 0x3f7d3a]]) {
      g.fillStyle(0x5e3a1c).fillRect(x - 2, 196 - 10, 4, 14);
      g.fillStyle(OUT).fillCircle(x, 186 - r * 0.6, r + 1);
      g.fillStyle(c).fillCircle(x, 186 - r * 0.6, r);
      g.fillStyle(0x5a9a4a).fillCircle(x - r * 0.3, 186 - r * 0.9, r * 0.45);
    }
    g.fillStyle(0x6a9a46).fillRect(0, 196, W, 14);       // prato
    // pavimentazione in gomma (EPDM) con granuli colorati
    g.fillStyle(0x3b4048).fillRect(0, 210, W, H - 210);
    for (let i = 0; i < 520; i++) {
      g.fillStyle([0x464c56, 0x32363e, 0x8a3a3a, 0x3a5a8a, 0x3f6a3a][i % 5 < 2 ? i % 5 : (i % 11 === 0 ? 2 + (i % 3) : 0)]);
      g.fillRect(Math.floor(Math.random() * W), 210 + Math.floor(Math.random() * (H - 210)), 2, 1);
    }
    g.fillStyle(0x2c3038).fillRect(0, 210, W, 2);
    for (let y = 250; y < H; y += 48) g.fillStyle(0x353a42).fillRect(0, y, W, 1);   // giunte dei tappeti
    // parallele (dip bar) sullo sfondo, a destra
    g.fillStyle(OUT).fillRect(195, 168, 5, 46).fillRect(237, 168, 5, 46);
    g.fillStyle(0x6e6a76).fillRect(196, 169, 3, 44).fillRect(238, 169, 3, 44);
    g.fillStyle(OUT).fillRect(190, 165, 58, 5); g.fillStyle(0xb0b0bc).fillRect(191, 166, 56, 3);
    g.fillStyle(OUT).fillRect(190, 178, 58, 5); g.fillStyle(0x9a9aa6).fillRect(191, 179, 56, 3);
    // sbarra alta (quella di Ludo)
    g.fillStyle(OUT).fillRect(124, BAR_Y - 6, 7, L_GROUND - BAR_Y + 6).fillRect(221, BAR_Y - 6, 7, L_GROUND - BAR_Y + 6);
    g.fillStyle(0x5a5a66).fillRect(125, BAR_Y - 5, 5, L_GROUND - BAR_Y + 4).fillRect(222, BAR_Y - 5, 5, L_GROUND - BAR_Y + 4);
    g.fillStyle(0x3a3a44).fillRect(122, L_GROUND - 2, 11, 4).fillRect(219, L_GROUND - 2, 11, 4);
    const bar = this.add.graphics().setDepth(2);
    bar.fillStyle(OUT).fillRect(126, BAR_Y - 2, 100, 5);
    bar.fillStyle(0xd0d0da).fillRect(127, BAR_Y - 1, 98, 3); bar.fillStyle(0xffffff).fillRect(127, BAR_Y - 1, 98, 1);
    // ombra di Ludo
    g.fillStyle(0x2c3038).fillEllipse(LX, L_GROUND + 2, 30, 5);
    // panchina di Francesco + zaino e borracce
    const b = this.add.graphics().setDepth(4);
    b.fillStyle(OUT).fillRect(204, FEET_F - 14, 4, 16).fillRect(260, FEET_F - 14, 4, 16);
    b.fillStyle(OUT).fillRect(198, FEET_F - 20, 70, 8);
    b.fillStyle(0x9a6a3a).fillRect(199, FEET_F - 19, 68, 6); b.fillStyle(0x7a4a2e).fillRect(199, FEET_F - 15, 68, 1);
    b.fillStyle(OUT).fillRect(198, FEET_F - 40, 70, 7); b.fillStyle(0x9a6a3a).fillRect(199, FEET_F - 39, 68, 5); // schienale
    b.fillStyle(OUT).fillRect(203, FEET_F - 34, 3, 16).fillRect(261, FEET_F - 34, 3, 16);
    this.add.image(190, FEET_F, 'zaino').setScale(2).setOrigin(0.5, 1).setDepth(5);
    this.add.image(176, FEET_F + 2, 'borraccia').setScale(2).setOrigin(0.5, 1).setDepth(5);
    this.add.image(254, FEET_F + 14, 'borraccia_r').setScale(2).setOrigin(0.5, 1).setDepth(5);
    // parallettes di Sergio (visti di lato) e blocco di cemento con la cassa
    g.fillStyle(OUT).fillRect(SX - 14, HAND_Y - 2, 28, 5).fillRect(SX - 12, HAND_Y, 4, 13).fillRect(SX + 8, HAND_Y, 4, 13);
    g.fillStyle(0xf08a24).fillRect(SX - 13, HAND_Y - 1, 26, 3);
    g.fillStyle(0x3a3a44).fillRect(SX - 11, HAND_Y + 1, 2, 11).fillRect(SX + 9, HAND_Y + 1, 2, 11);
    g.fillStyle(OUT).fillRect(10, SPK.y + 6, 42, GS - SPK.y - 4);
    g.fillStyle(0x9a948c).fillRect(11, SPK.y + 7, 40, GS - SPK.y - 6);
    g.fillStyle(0x8a847c).fillRect(11, SPK.y + 7, 40, 2);
    g.fillStyle(0x2c3038).fillEllipse(SX, GS + 2, 54, 6);
    g.fillStyle(0x2c3038).fillEllipse(166, GY + 2, 120, 6);
    this.speaker = this.add.image(SPK.x, SPK.y + 7, 'cassa').setScale(2).setOrigin(0.5, 1).setDepth(5);
    this.musicOn = false;
  }

  drawHUD() {
    this.add.rectangle(W / 2, 12, W, 24, OUT, 0.85).setDepth(20);
    txt(this, W / 2, 12, 'SOLO SETTE', 8, '#f4d03f').setDepth(21);
    this.add.rectangle(W / 2, 46, W - 8, 40, OUT, 0.9).setDepth(20).setStrokeStyle(1, 0x3a3a44);
    txt(this, 48, 36, 'SERGIO', 7, '#bfe3f0').setDepth(21);
    this.countText = txt(this, 48, 54, '0/' + C.target, 12, '#ffffff').setDepth(21);
    txt(this, 182, 35, 'DOMS DI DOMANI', 6, '#ff9ecb').setDepth(21);
    this.add.rectangle(182, 52, 146, 12, OUT).setDepth(21).setStrokeStyle(1, 0x6e6a76);
    this.domsBar = this.add.rectangle(110, 52, 0, 8, 0xf4d03f).setOrigin(0, 0.5).setDepth(22);
  }

  // ================= INTRO =================
  intro() {
    const g = this.add.container(0, 0).setDepth(40);
    g.add(this.add.rectangle(W / 2, H / 2, W - 24, 316, OUT, 0.95).setStrokeStyle(3, 0xf4d03f));
    g.add(this.add.image(W / 2, H / 2 - 118, 'sergio').setScale(4));
    g.add(txt(this, W / 2, H / 2 - 70, 'SOLO SETTE', 14, '#f4d03f'));
    g.add(txt(this, W / 2, H / 2 - 38, 'FAI CONTARE A SERGIO\n' + C.target + ' FLESSIONI', 8, '#ffffff'));
    const rules = this.add.container(0, 0).setAlpha(0);
    rules.add(txt(this, W / 2, H / 2 + 4, 'TIENI PREMUTO\nPER FARE FLESSIONI', 7, '#bfe3f0'));
    rules.add(txt(this, W / 2, H / 2 + 38, 'SERGIO CONTA\nSOLO QUANDO GUARDA', 7, '#bfe3f0'));
    rules.add(txt(this, W / 2, H / 2 + 72, 'SE TI TROVA FERMO\nRIPARTI DA ZERO', 7, '#ff9ecb'));
    const go = txt(this, W / 2, H / 2 + 118, 'TOCCA PER PARTIRE', 7, '#f08a24').setAlpha(0);
    rules.add(go);
    g.add(rules);
    this.tweens.add({ targets: rules, alpha: 1, delay: 350, duration: 250 });
    this.time.delayedCall(600, () => {
      this.canStart = true;
      go.setAlpha(1); this.tweens.add({ targets: go, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
    });
    this.introBox = g;
  }

  startGame() {
    sfx.unlock(); sfx.pick();
    this.introBox.destroy();
    this.phase = 'start'; this.playT = 0;
    sfx.ambientStart(0.015);
    // Sergio indica Fra: "Vedi che Fra ne ha fatte 10!" (sfida), poi accende la musica e sale in verticale
    const D = 1700;
    this.sAnimTo([this.standPose(), this.pointPose(true)], 240);
    this.say('sergio', C.startLine, 1500);
    this.fLookUp = 1500;
    this.time.delayedCall(D - 420, () => this.sAnimTo([this.pointPose(true), this.tapPose()], 380));
    this.time.delayedCall(D, () => {
      this.musicOn = true; sfx.musicStart(); sfx.pick();
      this.tweens.add({ targets: this.speaker, scaleY: 2.3, duration: 90, yoyo: true });
      this.sAnimTo([this.tapPose(), this.standPose()], 260);
    });
    this.time.delayedCall(D + 380, () => {
      sfx.whoosh();
      this.sAnimTo([this.standPose(), this.pikePose(), this.hsPose(0, 0, 'away')], 620, () => {
        this.sMode = 'hs'; this.phase = 'play';
        this.nextCycle();
      });
    });
    const hint = txt(this, W / 2, 440, 'TIENI PREMUTO', 9, '#ffffff').setDepth(25);
    this.tweens.add({ targets: hint, alpha: 0, delay: 3800, duration: 400, onComplete: () => hint.destroy() });
  }

  // ================= INPUT =================
  down(p) {
    if (this.phase === 'intro') {
      if (this.canStart) { this.block = true; this.startGame(); }
      return;
    }
    if (this.phase === 'result') {
      if (!this.canLeave) return;
      if (this.win_) { this.block = true; this.morning(); }
      else this.leave();   // perso: niente RIPROVA, si continua
      return;
    }
    if (this.phase === 'morning') { if (this.canLeave) this.leave(); return; }
    if (p) this.pointers.add(p.id); else this.space = true;
  }

  up(p) {
    if (p) this.pointers.delete(p.id); else this.space = false;
    if (!this.pointers.size && !this.space) this.block = false;
  }

  holding() { return !this.block && (this.pointers.size > 0 || this.space); }

  // ================= CICLO =================
  update(time, delta) {
    const dt = Math.min(delta, 50);
    this.t += dt;
    if (this.phase === 'start' || this.phase === 'play') {
      this.playT += dt;
      if (this.phase === 'play') this.updateSergio(dt);
      if (this.phase === 'play' || this.phase === 'start') this.updateAurelio(dt);
    } else if (this.phase === 'end' && this.repT !== null) {
      // la flessione già iniziata si conclude (solo animazione)
      this.repT += dt; if (this.repT >= C.repMs) this.repT = null;
    }
    if (this.sAnim) this.stepAnim(dt);
    this.updateLudo(dt);
    this.updateFx(dt);
    this.render(dt);
  }

  // ---------- Aurelio ----------
  updateAurelio(dt) {
    if (this.repT === null) {
      this.idleMs += dt;
      if (this.holding()) { this.repT = 0; this.repId++; this.repCounted = false; this.idleMs = 0; }
    }
    if (this.repT === null) return;
    this.repT += dt;
    if (!this.repCounted && this.repT >= this.bottomAt() * C.repMs) {
      this.repCounted = true; this.real++; sfx.thud();
      if (this.real >= C.domsMax) { this.lose(); return; }
      if (!this.daiHigh && this.real >= C.domsMax * 0.8) { this.daiHigh = true; this.dai(); }
    }
    if (this.repT >= C.repMs) {
      if (this.holding()) { this.repT -= C.repMs; this.repId++; this.repCounted = false; }
      else { this.repT = null; this.idleMs = 0; }
    }
  }

  fatigue() { return clamp01(this.real / C.domsMax); }
  bottomAt() { return C.bottomAt - 0.1 * this.fatigue(); }
  moving() { return this.repT !== null && this.repT < C.repMs; }

  // profondità della flessione (0 = braccia tese, 1 = giù)
  repDepth() {
    if (this.repT === null) return 0;
    const p = clamp01(this.repT / C.repMs), b = this.bottomAt(), f = this.fatigue();
    if (p < b) return ease(p / b);
    return 1 - Math.pow((p - b) / (1 - b), 1 + 1.4 * f);   // affaticato: fatica a ripartire dal basso
  }

  // ---------- Sergio: sequenza degli handstand push-up e dei controlli ----------
  fase() { let f = C.fasi[0]; for (const x of C.fasi) if (this.checks >= x.daControllo) f = x; return f; }

  nextCycle() {
    const f = this.fase(), q = [];
    if (f.pausa[1] > 0) q.push({ type: 'hold', ms: rnd(f.pausa[0], f.pausa[1]) });
    let n = rndi(f.reps[0], f.reps[1]);
    if (f.double && Math.random() < f.double) { q.push({ type: 'rep', ms: f.repMs * 0.7 }, { type: 'rep', ms: f.repMs * 0.7 }); n = 0; }
    for (let i = 0; i < n; i++) q.push({ type: 'rep', ms: f.repMs });
    if (f.hold && Math.random() < f.hold) q.push({ type: 'hold', ms: rnd(C.holdMs[0], C.holdMs[1]) });
    // il segnale (sempre uguale): ultima ripetizione rallentata, oscillazione, testa che ruota
    // una volta per partita: girata di scatto (stesso segnale, ma molto più rapido)
    const sc = !this.scattoDone && this.checks >= this.scattoAt ? C.scatto : null;
    if (sc) this.scattoDone = true;
    q.push({ type: 'slow', ms: sc ? sc.slow : f.slow }, { type: 'sway', ms: sc ? sc.sway : f.sway }, { type: 'turn', ms: sc ? sc.turn : f.turn },
           { type: 'look', ms: f.look }, { type: 'back', ms: f.back });
    this.queue = q.filter(s => s.ms > 0);
    this.nextSeg();
  }

  nextSeg() {
    if (!this.queue.length) { this.nextCycle(); return; }
    this.seg = this.queue.shift(); this.segT = 0;
    if (this.seg.type === 'look') this.check = { resolved: false };
  }

  updateSergio(dt) {
    this.segT += dt;
    const s = this.seg;
    if (s.type === 'look' && !this.check.resolved) {
      if (this.moving() && this.repId !== this.lastValidRep) this.validate();
      else if (this.segT >= C.graceMs) this.resetSeries();
      if (this.phase !== 'play') return;
    }
    while (this.seg && this.segT >= this.seg.ms) { this.segT -= this.seg.ms; this.nextSeg(); }
    this.sPose = this.sergioNow();
  }

  // ms che mancano all'inizio del prossimo segnale (ripetizione lenta)
  msToSignal() {
    if (!['rep', 'hold'].includes(this.seg.type)) return -1;
    let ms = this.seg.ms - this.segT;
    for (const q of this.queue) { if (q.type === 'slow') break; ms += q.ms; }
    return ms;
  }

  // posa attuale di Sergio in verticale
  sergioNow() {
    const s = this.seg, k = clamp01(this.segT / s.ms);
    let d = 0, sway = 0, head = 'away';
    if (s.type === 'rep' || s.type === 'slow') d = Math.sin(Math.PI * (s.type === 'slow' ? ease(k) : k));
    if (s.type === 'sway') sway = Math.sin(k * Math.PI * 2);
    if (s.type === 'turn') { head = 'mid'; sway = Math.sin(k * Math.PI) * 0.25; }
    if (s.type === 'look') head = 'look';
    if (s.type === 'back') head = k < 0.6 ? 'mid' : 'away';
    return this.hsPose(d, sway, head);
  }

  validate() {
    this.check.resolved = true; this.checks++;
    this.lastValidRep = this.repId;
    this.count++;
    sfx.conta();
    this.sNod = 320;
    const n = C.numeri[this.count - 1];
    const line = this.count >= 4 && this.count < C.target && Math.random() < 0.35 ? n + '\n' + pick(C.extra) : n;
    this.say('sergio', line, 900);
    this.popCount('#f4d03f');
    const pop = txt(this, SX + 16, HAND_Y - 70, String(this.count), 14, '#f4d03f').setDepth(26);
    this.tweens.add({ targets: pop, y: pop.y - 26, alpha: 0, duration: 700, onComplete: () => pop.destroy() });
    const e = this.add.particles(SX + 2, HAND_Y + 4, 'spark', { speed: { min: 40, max: 100 }, lifespan: 300, tint: [0xf4d03f, 0xffffff], scale: 1.5, emitting: false }).setDepth(26);
    e.explode(10); this.time.delayedCall(350, () => e.destroy());
    if (this.count >= C.target) { this.win(); return; }
    if (this.count === 3 || this.count === 7) this.dai();
  }

  resetSeries() {
    this.check.resolved = true; this.checks++;
    const had = this.count;
    this.count = 0;
    sfx.buzz();
    this.sShake = 520; this.seg.ms += 350;          // Sergio scuote la testa
    this.say('sergio', pick(C.resetLines), 1500);
    this.popCount('#ff6b5b');
    if (had > 0) this.cameras.main.shake(140, 0.006);
    this.aFace = 'aurelio_disperato'; this.aFaceMs = 900; this.slump = 1;
    if (!this.catanOn) { this.lFace = 'ludo_triste'; this.lFaceMs = 700; }
    if (had > 0) this.time.delayedCall(900, () => { if (this.phase === 'play') this.dai(); });
  }

  popCount(color) {
    this.countText.setText(this.count + '/' + C.target).setColor(color).setScale(1.5);
    this.tweens.add({ targets: this.countText, scale: 1, duration: 260, ease: 'Back.out' });
    this.time.delayedCall(500, () => this.countText.setColor('#ffffff'));
  }

  // ---------- pose di Sergio ----------
  hsPose(d, sway, head) {
    const sh = P(SX + sway * 3, HAND_Y - lerp(32, 13, d));
    const a = sway * 0.12, a2 = sway * 0.3;
    const hip = P(sh.x + Math.sin(a) * 36, sh.y - Math.cos(a) * 36);
    const foot = P(hip.x + Math.sin(a2) * 42, hip.y - Math.cos(a2) * 42);
    const hand = P(SX, HAND_Y);
    return { hand, elbow: ik(sh, hand, 17, 17, P(1, 0)), sh, hip, foot,
      head: { x: sh.x + (head === 'look' ? 2 : head === 'mid' ? 0 : -2), y: sh.y + 12,
              key: head === 'mid' ? 'sergio_testa' : 'sergio_profilo', flipX: head === 'away', flipY: true, angle: 0 } };
  }
  standPose(arm) {
    const sh = P(SX, GS - 78), hip = P(SX, GS - 42), foot = P(SX + 1, GS);
    const hand = arm || P(SX + 4, GS - 46);
    return { hand, elbow: ik(sh, hand, 17, 17, P(0.3, -1)), sh, hip, foot,
      head: { x: SX + 1, y: GS - 90, key: 'sergio_profilo', flipX: false, flipY: false, angle: 0 } };
  }
  tapPose() { const p = this.standPose(P(SPK.x + 8, SPK.y - 4)); p.head.flipX = true; p.head.angle = -14; return p; }
  pointPose(toFra) {
    const p = this.standPose(P(SX + 34, GS - 60));
    p.head.angle = toFra ? -6 : 18;  // verso Francesco (in alto a destra) o verso Aurelio (a terra)
    return p;
  }
  pikePose() {
    const hand = P(SX, HAND_Y), sh = P(SX + 3, HAND_Y - 30);
    return { hand, elbow: ik(sh, hand, 17, 17, P(1, 0)), sh, hip: P(SX - 12, HAND_Y - 60), foot: P(SX - 44, HAND_Y - 38),
      head: { x: SX + 2, y: HAND_Y - 18, key: 'sergio_testa', flipX: false, flipY: true, angle: 0 } };
  }

  // animazione tra pose chiave
  sAnimTo(keys, ms, done) { this.sMode = 'anim'; this.sAnim = { keys, ms, t: 0, done }; }
  stepAnim(dt) {
    const a = this.sAnim; a.t += dt;
    const k = clamp01(a.t / a.ms), n = a.keys.length - 1, x = ease(k) * n, i = Math.min(n - 1, Math.floor(x)), f = x - i;
    const p = a.keys[i], q = a.keys[i + 1];
    this.sPose = {
      hand: lp(p.hand, q.hand, f), elbow: lp(p.elbow, q.elbow, f), sh: lp(p.sh, q.sh, f), hip: lp(p.hip, q.hip, f), foot: lp(p.foot, q.foot, f),
      head: { ...(f < 0.5 ? p.head : q.head), x: lerp(p.head.x, q.head.x, f), y: lerp(p.head.y, q.head.y, f), angle: lerp(p.head.angle, q.head.angle, f) }
    };
    if (k >= 1) { this.sAnim = null; if (this.sMode === 'anim') this.sMode = 'still'; a.done?.(); }
  }

  // ---------- Ludo: trazioni con un ritmo tutto suo ----------
  updateLudo(dt) {
    this.lT += dt;
    if (this.lFaceMs > 0) { this.lFaceMs -= dt; if (this.lFaceMs <= 0) this.lFace = null; }
    this.lHop = Math.max(0, this.lHop - dt);
    const st = this.lState;
    if (st === 'catan' || st === 'final') return;
    // occasione per il patto sul Catan: Aurelio fermo, Sergio di spalle (non sta per girarsi)
    if (this.phase === 'play' && !this.catanDone && this.checks >= C.catanDopo && ['hang', 'pull', 'lookA', 'lookS'].includes(st)
        && this.repT === null && this.idleMs > 250 && this.msToSignal() >= 0 && (this.seg.type === 'rep' || this.seg.type === 'hold')) {
      this.catan(); return;
    }
    if (st === 'lookA' && !this.lWinkDone && this.lT > 400) {
      this.lWinkDone = true;
      if (this.repT === null) { this.lFace = 'ludo_occhiolino'; this.lFaceMs = 380; }   // lo vede fermo: occhiolino, nessuna denuncia
    }
    if (this.lT < this.lMs) return;
    const next = {
      pull: () => pick(['hang', 'hang', 'lookS', 'lookA', 'drop']),
      hang: () => pick(['pull', 'pull', 'lookA', 'lookS']),
      lookA: () => pick(['pull', 'hang']), lookS: () => pick(['pull', 'lookA']),
      drop: () => 'rest', rest: () => 'jump', jump: () => 'pull'
    }[st]();
    this.ludoGo(next);
  }

  ludoGo(st) {
    this.lState = st; this.lT = 0; this.lWinkDone = false;
    this.lMs = { pull: rndi(2, 4) * rnd(1050, 1350), hang: rnd(600, 1300), lookA: rnd(800, 1200), lookS: rnd(700, 1000),
                 drop: 280, rest: rnd(1500, 2600), jump: 340, catan: 99999, final: 99999 }[st];
  }

  // posa di Ludo: y delle spalle e posizione delle mani
  ludoPose() {
    const hangY = BAR_Y + 28, topY = BAR_Y + 6, restY = L_GROUND - 30;
    const hb = [P(LX - 9, BAR_Y), P(LX + 9, BAR_Y)];
    const st = this.lState, k = clamp01(this.lT / this.lMs);
    if (st === 'pull') { const r = (this.lT % (this.lMs / Math.max(1, Math.round(this.lMs / 1200)))) / (this.lMs / Math.max(1, Math.round(this.lMs / 1200))); return { y: lerp(hangY, topY, Math.sin(Math.PI * r)), hands: hb, ground: false }; }
    if (st === 'drop') { const y = lerp(hangY, restY, ease(k)); return { y, hands: [lp(hb[0], P(LX - 12, y + 24), k), lp(hb[1], P(LX + 12, y + 24), k)], ground: k > 0.8 }; }
    if (st === 'jump') { const y = lerp(restY, hangY, ease(k)); return { y, hands: [lp(P(LX - 12, restY + 24), hb[0], k), lp(P(LX + 12, restY + 24), hb[1], k)], ground: k < 0.2 }; }
    if (st === 'rest') { const sh = Math.sin(this.lT / 70) * 2; return { y: restY, hands: [P(LX - 13 + sh, restY + 24), P(LX + 13 - sh, restY + 24)], ground: true }; }
    return { y: hangY, hands: hb, ground: false };
  }

  dai() {
    if (this.daiCount >= C.ludoDaiMax || this.catanOn || this.t - this.lastDai < 3000) return;
    this.daiCount++; this.lastDai = this.t;
    this.lFace = 'ludo'; this.lFaceMs = 900; this.lHop = 300;
    this.say('ludo', C.ludoDai, 1300);
  }

  // Il patto sul Catan (una volta sola per partita)
  catan() {
    this.catanDone = true; this.catanOn = true;
    if (['drop', 'rest', 'jump'].includes(this.lState)) this.lState = 'hang';
    this.ludoGo('catan');
    // Sergio continua a fare ripetizioni: il prossimo controllo arriva solo dopo la battuta (+ un margine)
    const need = 5200 - this.msToSignal();
    if (need > 0) {
      const f = this.fase(), extra = Math.ceil(need / f.repMs), at = this.queue.findIndex(q => q.type === 'slow');
      for (let i = 0; i < extra; i++) this.queue.splice(Math.max(0, at), 0, { type: 'rep', ms: f.repMs });
    }
    const steps = [
      [0, () => { this.lFace = 'ludo_giu'; this.lFaceMs = 9999; }],                     // 1-2: si ferma e guarda Aurelio
      [450, () => { this.aFace = 'aurelio_preoccupato'; this.aFaceMs = 650; this.sweatBurst(); }], // 3: Aurelio preoccupato
      [950, () => { this.lFace = 'ludo_sx'; }],                                          // 4: controlla Sergio
      [1350, () => { this.lFace = 'ludo_occhiolino'; }],                                 // 5: occhiolino
      [1750, () => { this.lFace = 'ludo_psst'; sfx.psst(); this.catanBubble(C.catan[0], 1300, true); }],  // 6: sottovoce
      [3100, () => { this.lFace = 'ludo_psst'; this.catanBubble(C.catan[1], 1800, false); }],
      [4950, () => { this.lFace = null; this.lFaceMs = 0; this.catanOn = false; if (this.lState === 'catan') this.ludoGo('hang'); }]
    ];
    for (const [ms, fn] of steps) this.time.delayedCall(ms, () => { if (this.phase === 'play') fn(); else this.catanOn = false; });
  }

  catanBubble(line, ms, psst) {
    this.bubbles.ludo?.destroy();
    const c = this.add.container(0, 0).setDepth(27);
    const t = txt(this, 0, 0, line, 7, '#d8c8e8').setOrigin(0.5).setStroke('#2a2234', 0);
    const bw = t.width + 12, bh = t.height + 10;
    const bg = this.add.graphics();
    bg.fillStyle(0x2a2234, 0.88).fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 5);
    bg.lineStyle(1, 0x8a7aa0, 0.9).strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 5);
    c.add([bg, t]);
    if (psst) c.add(txt(this, -bw / 2 + 14, -bh / 2 - 6, 'psst', 6, '#9a8ab0'));
    c.setPosition(Math.max(bw / 2 + 4, LX - 74), BAR_Y + 46);
    c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 150 });
    this.bubbles.ludo = c;
    this.time.delayedCall(ms, () => { if (this.bubbles.ludo === c) { c.destroy(); delete this.bubbles.ludo; } });
  }

  // ---------- effetti: sudore, note musicali, Francesco ----------
  updateFx(dt) {
    if (this.aFaceMs > 0) { this.aFaceMs -= dt; if (this.aFaceMs <= 0) this.aFace = null; }
    this.sNod = Math.max(0, this.sNod - dt); this.sShake = Math.max(0, this.sShake - dt);
    this.slump = Math.max(0, this.slump - dt / 700);
    const f = this.fatigue();
    if (f > 0.35 && this.phase !== 'result') {
      this.sweatMs -= dt;
      if (this.sweatMs <= 0) { this.sweatMs = lerp(900, 260, (f - 0.35) / 0.65); this.sweatDrop(); }
    }
    // note musicali dalla cassa
    if (this.musicOn && Math.random() < dt / 600) {
      const n = this.add.image(SPK.x + rnd(-6, 6), SPK.y - 10, 'nota').setScale(1.5).setDepth(6);
      this.tweens.add({ targets: n, y: n.y - 34, x: n.x + rnd(-10, 10), alpha: 0, duration: 1100, onComplete: () => n.destroy() });
    }
    // barra dei DOMS (si riempie in modo morbido)
    const target = this.fatigue();
    this.domsShown += (target - this.domsShown) * Math.min(1, dt / 120);
    const col = target < 0.5 ? 0xf4d03f : target < 0.8 ? 0xf08a24 : 0xe23b2e;
    this.domsBar.width = 142 * this.domsShown; this.domsBar.fillColor = col;
    this.domsBar.setAlpha(target >= 0.8 ? 0.7 + 0.3 * Math.sin(this.t / 90) : 1);
    // Francesco
    this.fLaugh = Math.max(0, this.fLaugh - dt); this.fJump = Math.max(0, this.fJump - dt);
    this.fMouth -= dt;
    if (this.fLaugh > 0 && this.fMouth <= 0) { this.fMouth = 130; this.fra.setTexture(this.fra.texture.key === 'francesco_parla' ? 'francesco_seduto' : 'francesco_parla'); }
    if (this.fLaugh <= 0) this.fra.setTexture('francesco_seduto');
  }

  sweatDrop() {
    const h = this.aHead;
    const d = this.add.rectangle(h.x + rnd(-8, 8), h.y - 6, 2, 3, 0x9fd3ef).setDepth(10);
    this.tweens.add({ targets: d, y: d.y + rnd(14, 24), x: d.x + rnd(-6, 6), alpha: 0, duration: 520, onComplete: () => d.destroy() });
  }
  sweatBurst() { for (let i = 0; i < 4; i++) this.time.delayedCall(i * 60, () => this.sweatDrop()); }

  // ================= DISEGNO =================
  render(dt) {
    // --- Sergio ---
    const sp = this.sPose;
    const g = this.gS; g.clear();
    this.limbs(g, [
      [sp.hip, sp.foot, 8, SKIN], [sp.hip, lp(sp.hip, sp.foot, 0.42), 11, 0x4a4a55],
      [sp.sh, sp.hip, 14, 0x2a2a30],
      [sp.sh, sp.elbow, 8, SKIN], [sp.elbow, sp.hand, 7, SKIN]
    ]);
    // scarpe e mani
    g.fillStyle(OUT).fillCircle(sp.foot.x, sp.foot.y, 4.5); g.fillStyle(0xf4f1ea).fillCircle(sp.foot.x, sp.foot.y, 3.3);
    g.fillStyle(OUT).fillCircle(sp.hand.x, sp.hand.y, 4); g.fillStyle(SKIN).fillCircle(sp.hand.x, sp.hand.y, 2.8);
    const hd = sp.head;
    let hx = hd.x, hy = hd.y + (this.sNod > 0 ? Math.sin(this.sNod / 40) * 2 : 0), flipX = hd.flipX;
    if (this.sShake > 0) flipX = Math.floor(this.sShake / 90) % 2 === 0;
    const talk = this.sTalkMs > 0 && Math.floor(this.t / 120) % 2 === 0;
    this.sTalkMs = Math.max(0, this.sTalkMs - dt);
    const key = hd.key === 'sergio_testa' ? (talk ? 'sergio_testa_parla' : 'sergio_testa') : (talk ? 'sergio_profilo_parla' : 'sergio_profilo');
    this.sHead.setTexture(key).setPosition(hx, hy).setFlip(flipX, hd.flipY).setAngle(hd.angle);

    // --- Aurelio ---
    this.drawAurelio();

    // --- Ludo ---
    const lpz = this.ludoPose();
    const hop = this.lHop > 0 ? Math.sin(this.lHop / 300 * Math.PI) * 3 : 0;
    const sy = lpz.y - hop;
    this.ludo.setPosition(LX, sy - 28);
    let lk = this.lFace || { lookA: 'ludo_giu', lookS: 'ludo_sx', catan: 'ludo_giu' }[this.lState] || 'ludo';
    this.ludo.setTexture(lk);
    const gl = this.gL; gl.clear();
    const shL = P(LX - 9, sy + 1), shR = P(LX + 9, sy + 1);
    const hands = lpz.hands.map(h => P(h.x, h.y - (lpz.ground ? hop : 0)));
    if (this.lOneArm) hands[1] = P(LX + 20, sy + 6 + Math.sin(this.t / 60) * 2);
    this.limbs(gl, [
      [shL, ik(shL, hands[0], 15, 15, P(-1, 0.2)), 5, SKIN], [ik(shL, hands[0], 15, 15, P(-1, 0.2)), hands[0], 5, SKIN],
      [shR, ik(shR, hands[1], 15, 15, P(1, 0.2)), 5, SKIN], [ik(shR, hands[1], 15, 15, P(1, 0.2)), hands[1], 5, SKIN]
    ]);

    // --- Francesco: telefono in mano, ogni tanto alza lo sguardo ---
    const jump = this.fJump > 0 ? Math.sin(this.fJump / 400 * Math.PI) * 5 : 0;
    const bounce = this.fLaugh > 0 ? Math.abs(Math.sin(this.t / 90)) * 2 : 0;
    this.fra.setY(FEET_F - jump - bounce);
    const gf = this.gF; gf.clear();
    const fy = FEET_F - jump - bounce;
    const phone = this.fLookUp > 0 ? P(FX, fy - 14) : P(FX, fy - 20);
    const sl = P(FX - 10, fy - 22), sr = P(FX + 10, fy - 22);
    this.limbs(gf, [[sl, P(phone.x - 3, phone.y), 5, SKIN], [sr, P(phone.x + 3, phone.y), 5, SKIN]]);
    gf.fillStyle(OUT).fillRect(phone.x - 4, phone.y - 6, 8, 11);
    gf.fillStyle(0x222222).fillRect(phone.x - 3, phone.y - 5, 6, 9);
    gf.fillStyle(0x6ab0e8, this.fLookUp > 0 ? 0.4 : 0.9).fillRect(phone.x - 2, phone.y - 4, 4, 6);
    if (this.fLookUp > 0) this.fLookUp = Math.max(0, this.fLookUp - dt);

    for (const [who, b] of Object.entries(this.bubbles)) this.placeBubble(who, b);
  }

  drawAurelio() {
    const f = this.fatigue(), d = this.repDepth();
    // posa della flessione (vista di lato, testa a sinistra verso Sergio)
    const breathe = this.repT === null && this.flatK === 0 ? Math.sin(this.t / 260) * 0.8 : 0;
    const slump = this.slump * 7;
    let sh = P(A_HAND.x + 4 - 4 * d, GY - lerp(30, 12, d) + breathe + slump);
    const toe = A_TOE;
    let hip = lp(sh, toe, 0.46); hip.y += lerp(0, 5, f) * (0.4 + 0.6 * d);   // la pancia cede quando è stanco
    let hand = A_HAND;
    // a terra (crollato o distrutto)
    if (this.flatK > 0) {
      const k = this.flatK;
      sh = lp(sh, P(A_HAND.x + 2, GY - 6), k); hip = lp(hip, P(166, GY - 5), k);
      hand = lp(hand, P(A_HAND.x - 26, GY - 3), k);
    }
    let elbow = ik(sh, hand, 16, 16, P(1, -0.4));
    if (f > 0.3 && this.repT !== null) { elbow = P(elbow.x + rnd(-1, 1) * f * 2, elbow.y + rnd(-1, 1) * f * 1.5); } // braccia che tremano
    const g = this.gA; g.clear();
    this.limbs(g, [
      [hip, toe, 9, 0x3d5a8a], [sh, hip, 13, 0xf4f1ea],
      [sh, elbow, 6, SKIN], [elbow, hand, 6, SKIN]
    ]);
    g.fillStyle(OUT).fillRect(toe.x - 2, toe.y - 4, 9, 7); g.fillStyle(0x222222).fillRect(toe.x - 1, toe.y - 3, 7, 5);
    g.fillStyle(OUT).fillRect(hand.x - 5, hand.y - 3, 9, 5); g.fillStyle(SKIN).fillRect(hand.x - 4, hand.y - 2, 7, 3);
    // testa
    const dx = sh.x - toe.x, dy = sh.y - toe.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const tilt = Math.atan2(-dy, -dx);
    const hx = sh.x + ux * 14 - (this.flatK > 0 ? 0 : 1), hy = sh.y + uy * 14 - 6 * (1 - this.flatK) - 2;
    let key = this.aFace || (f < 0.45 ? 'aurelio_profilo' : f < 0.75 ? 'aurelio_fatica' : (this.repT !== null ? 'aurelio_disperato' : 'aurelio_fatica'));
    const red = Math.floor(lerp(255, 175, f)), tint = (255 << 16) | (red << 8) | red;
    this.aHead.setTexture(key).setPosition(hx, hy).setFlip(this.aLookUp <= 0, false)
      .setRotation(this.aLookUp > 0 ? -0.5 : tilt * (1 - this.flatK) + this.flatK * 0.15).setTint(tint);
  }

  // segmenti spessi con contorno scuro (stile pixel art del gioco)
  limbs(g, list) {
    for (const [a, b, w] of list) {
      g.lineStyle(w + 3, OUT).lineBetween(a.x, a.y, b.x, b.y);
      g.fillStyle(OUT).fillCircle(a.x, a.y, (w + 3) / 2).fillCircle(b.x, b.y, (w + 3) / 2);
    }
    for (const [a, b, w, c] of list) {
      g.lineStyle(w, c).lineBetween(a.x, a.y, b.x, b.y);
      g.fillStyle(c).fillCircle(a.x, a.y, w / 2).fillCircle(b.x, b.y, w / 2);
    }
  }

  // ================= DIALOGHI =================
  say(who, line, ms) {
    this.bubbles[who]?.destroy();
    const col = { sergio: '#ffffff', ludo: '#ff9ecb', aurelio: '#f4d03f' }[who] || '#ffffff';
    const t = txt(this, 0, 0, line, 7, col).setDepth(26).setOrigin(0.5, 1);
    this.bubbles[who] = t;
    if (who === 'sergio') this.sTalkMs = Math.min(ms, 800);
    this.placeBubble(who, t);
    this.time.delayedCall(ms, () => { if (this.bubbles[who] === t) { t.destroy(); delete this.bubbles[who]; } });
  }

  placeBubble(who, t) {
    if (who === 'ludo' && t.type === 'Container') return;   // il fumetto del Catan resta fermo
    let x, y;
    if (who === 'sergio') {
      if (this.sMode === 'hs') { x = 128; y = 306; }        // a destra di Sergio in verticale
      else { x = this.sHead.x + 10; y = this.sHead.y - 16; }
    } else if (who === 'ludo') { x = LX - 70; y = BAR_Y + 54; }
    else { x = W / 2; y = GY - 50; }
    t.setPosition(Phaser.Math.Clamp(x, t.width / 2 + 4, W - t.width / 2 - 4), Math.max(70 + t.height, y));
  }

  // ================= FINALE =================
  win() {
    this.phase = 'end'; this.win_ = true;
    if (this.repT !== null && !this.repCounted) { this.repCounted = true; this.real++; }   // la flessione vista conta anche tra quelle vere
    this.real = Math.min(this.real, C.domsMax);
    sfx.win();
    this.lState = 'final'; this.lFace = 'ludo'; this.lFaceMs = 0;
    // 1-2: Sergio finisce la verticale e scende
    this.time.delayedCall(500, () => { sfx.whoosh(); this.sAnimTo([this.sPose, this.pikePose(), this.standPose()], 650); });
    // 3: Aurelio resta a terra distrutto
    this.time.delayedCall(700, () => { this.repT = null; this.tweens.add({ targets: this, flatK: 1, duration: 300, ease: 'Bounce.out' }); this.aFace = 'aurelio_fatica'; this.aFaceMs = 99999; });
    // 4-6: indica Aurelio, la frase sulla musica russa, la musica sale; Francesco alza gli occhi dal telefono
    this.time.delayedCall(1300, () => {
      this.sAnimTo([this.standPose(), this.pointPose(false)], 260);
      this.fLookUp = 99999;
      this.say('sergio', C.winLines[0], 2600);
      sfx.musicBoost(2600);
    });
    // Francesco ride
    this.time.delayedCall(2200, () => { this.fLaugh = 1300; this.fJump = 400; });
    // Aurelio guarda Ludo, lei gli ricorda il patto (occhiolino + lancio dei dadi)
    this.time.delayedCall(3200, () => { this.aLookUp = 1; this.aFace = 'aurelio_preoccupato'; });
    this.time.delayedCall(3600, () => { this.lFace = 'ludo_occhiolino'; this.lFaceMs = 500; this.diceMime(); });
    this.time.delayedCall(5500, () => this.result(true));
  }

  diceMime() {
    this.lOneArm = 1;
    this.time.delayedCall(450, () => {
      for (const dx of [-4, 4]) {
        const d = this.add.image(LX + 22, BAR_Y + 34, 'dado').setScale(2).setDepth(12);
        this.tweens.add({ targets: d, x: LX + 22 + dx * 6, duration: 600 });
        this.tweens.add({ targets: d, y: BAR_Y + 18, duration: 250, ease: 'Quad.out', yoyo: true, onComplete: () => this.tweens.add({ targets: d, alpha: 0, duration: 300, onComplete: () => d.destroy() }) });
        this.tweens.add({ targets: d, angle: 360, duration: 600 });
      }
      sfx.tone([1400, 1100], 0.04, 'square', 0.04);
    });
    this.time.delayedCall(1300, () => { this.lOneArm = 0; this.lFace = 'ludo_occhiolino'; this.lFaceMs = 500; });
  }

  lose() {
    this.phase = 'end'; this.win_ = false;
    this.real = C.domsMax;
    sfx.flop(); this.cameras.main.shake(180, 0.008);
    this.repT = null;
    this.tweens.add({ targets: this, flatK: 1, duration: 260, ease: 'Bounce.out' });
    this.aFace = 'aurelio_disperato'; this.aFaceMs = 99999;
    const fl = txt(this, 166, GY - 40, 'CRAMPO!', 8, '#ff6b5b').setDepth(26);
    this.tweens.add({ targets: fl, y: fl.y - 16, alpha: 0, delay: 500, duration: 500, onComplete: () => fl.destroy() });
    // Ludo resta appesa, dispiaciuta
    if (this.lState !== 'final') { this.lState = 'final'; this.lT = 0; }
    this.lFace = 'ludo_triste'; this.lFaceMs = 99999;
    this.catanOn = false; this.bubbles.ludo?.destroy(); delete this.bubbles.ludo;
    // Sergio interrompe la verticale e lo guarda
    this.time.delayedCall(450, () => { sfx.whoosh(); this.sAnimTo([this.sPose, this.pikePose(), this.standPose()], 650); });
    this.time.delayedCall(1150, () => {
      this.sAnimTo([this.standPose(), this.pointPose(false)], 220);
      const left = C.target - this.count;
      this.say('sergio', left === 2 ? C.loseDue : C.losePoche, 2200);
    });
    this.time.delayedCall(1700, () => { this.fLookUp = 99999; this.fJump = 400; });
    this.time.delayedCall(3700, () => this.result(false));
  }

  voto() { for (const [max, s] of C.voti) if (this.real <= max) return s; return C.voti[C.voti.length - 1][1]; }

  result(win) {
    this.phase = 'result'; this.canLeave = false; this.block = this.holding() || this.block;
    for (const b of Object.values(this.bubbles)) b.destroy();
    this.bubbles = {};
    const g = this.add.container(0, 0).setDepth(50);
    g.add(this.add.rectangle(W / 2, H / 2, W - 24, 282, OUT, 0.95).setStrokeStyle(3, win ? 0x3a8a3a : 0xc0392b));
    g.add(txt(this, W / 2, H / 2 - 112, win ? 'SOLO SETTE!' : 'DOMS MORTALI', 13, win ? '#f4d03f' : '#ff6b5b'));
    g.add(txt(this, W / 2, H / 2 - 76, 'SERGIO NE HA CONTATE', 7, '#bfe3f0'));
    g.add(txt(this, W / 2, H / 2 - 56, String(this.count), 14, '#ffffff'));
    g.add(txt(this, W / 2, H / 2 - 28, 'AURELIO NE HA FATTE DAVVERO', 7, '#ff9ecb'));
    const realT = txt(this, W / 2, H / 2 - 8, '0', 14, '#ffffff'); g.add(realT);
    // il numero vero "sale" fino al valore reale
    const cnt = { v: 0 };
    this.tweens.add({ targets: cnt, v: this.real, delay: 400, duration: 700, onUpdate: () => realT.setText(String(Math.round(cnt.v))) });
    if (win) {
      g.add(txt(this, W / 2, H / 2 + 24, this.voto(), 9, this.real <= C.voti[0][0] ? '#8bd650' : this.real <= C.voti[1][0] ? '#f08a24' : '#ff6b5b'));
      if (!this.standalone) g.add(txt(this, W / 2, H / 2 + 48, '+' + C.reward.points + ' PUNTI', 8, '#f4d03f'));
      const go = txt(this, W / 2, H / 2 + 100, 'TOCCA PER CONTINUARE', 7, '#f08a24');
      g.add(go); this.tweens.add({ targets: go, alpha: 0.3, duration: 450, yoyo: true, repeat: -1 });
    } else {
      g.add(txt(this, W / 2, H / 2 + 26, this.standalone ? 'LE BRACCIA NON\nRISPONDONO PIÙ' : 'NEL LIVELLO: DOMS\n(NON PUOI MANGIARE)', 7, '#c8b49a'));
    }
    if (!win) {
      const go = txt(this, W / 2, H / 2 + 100, 'TOCCA PER CONTINUARE', 7, '#f08a24');
      g.add(go); this.tweens.add({ targets: go, alpha: 0.3, duration: 450, yoyo: true, repeat: -1 });
    }
    g.setAlpha(0).setY(30);
    this.tweens.add({ targets: g, alpha: 1, y: 0, duration: 250, ease: 'Back.out' });
    this.time.delayedCall(900, () => { this.canLeave = true; });
  }

  // Il mattino dopo: Aurelio bloccato nel letto
  morning() {
    this.phase = 'morning'; this.canLeave = false;
    sfx.musicStop(); sfx.ambientStop();
    const c = this.add.container(0, 0).setDepth(60);
    const g = this.add.graphics();
    g.fillStyle(0x2a2234).fillRect(0, 0, W, H);
    g.fillStyle(0x4a3f5a).fillRect(0, 0, W, 250);                         // parete
    g.fillStyle(OUT).fillRect(168, 60, 76, 70); g.fillStyle(0xffe9a8).fillRect(171, 63, 70, 64);  // finestra con il sole
    g.fillStyle(0xf4d03f).fillCircle(214, 88, 12); g.fillStyle(OUT).fillRect(204, 63, 3, 64).fillRect(171, 93, 70, 3);
    g.fillStyle(0xffe9a8, 0.12).fillTriangle(171, 127, 241, 127, 120, 330);
    g.fillStyle(0x6a4a3a).fillRect(0, 250, W, H - 250);                   // pavimento
    g.fillStyle(OUT).fillRect(28, 236, 220, 70); g.fillStyle(0x9a6a3a).fillRect(30, 238, 216, 66);  // letto
    g.fillStyle(0xf4f1ea).fillRect(36, 228, 60, 26);                       // cuscino
    g.fillStyle(OUT).fillRect(70, 244, 172, 40); g.fillStyle(0x3d5a8a).fillRect(72, 246, 168, 36);  // coperta
    g.fillStyle(0x2c4166); for (let x = 80; x < 240; x += 16) g.fillRect(x, 246, 2, 36);
    c.add(g);
    const head = this.add.image(68, 236, 'aurelio_testa').setScale(2.5).setAngle(-90);
    c.add(head);
    const arms = this.add.graphics(); c.add(arms);
    c.add(txt(this, W / 2, 40, 'IL MATTINO DOPO...', 9, '#f4d03f'));
    const z = txt(this, 110, 196, '...', 10, '#ffffff'); c.add(z);
    c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 400 });
    // prova ad alzare le braccia... e ricadono
    let t = 0;
    const ev = this.time.addEvent({ delay: 30, loop: true, callback: () => {
      t += 30; arms.clear();
      const cyc = (t % 1400) / 1400, lift = cyc < 0.6 ? Math.sin(cyc / 0.6 * Math.PI / 2) * 0.6 : Math.max(0, 0.6 - (cyc - 0.6) * 6);
      const shake = lift > 0.2 ? Math.sin(t / 25) * 1.5 : 0;
      for (const [sx, dir] of [[90, 1], [96, 1]]) {
        const sh = P(sx, 258), hand = P(sx + 40 * dir * Math.cos(lift * 1.4), 258 - 40 * Math.sin(lift * 1.4) + shake);
        this.limbs(arms, [[sh, hand, 6, SKIN]]);
      }
      head.setAngle(-90 + shake * 2);
      if (lift > 0.5 && Math.random() < 0.15) { const d = this.add.rectangle(head.x + rnd(-10, 10), head.y - 16, 2, 3, 0x9fd3ef).setDepth(61); this.tweens.add({ targets: d, y: d.y + 18, alpha: 0, duration: 450, onComplete: () => d.destroy() }); }
    } });
    this.events.once('shutdown', () => ev.remove());
    this.time.delayedCall(900, () => { this.canLeave = true; });
    this.time.delayedCall(3600, () => { if (this.phase === 'morning') this.leave(); });
  }

  leave() {
    if (this.phase === 'left') return;
    this.phase = 'left';
    sfx.musicStop(); sfx.ambientStop();
    if (this.standalone) { this.scene.start('Menu'); return; }
    this.scene.stop();
    this.scene.resume('Level', { mini: 'sergio', win: this.win_ });
  }
}
