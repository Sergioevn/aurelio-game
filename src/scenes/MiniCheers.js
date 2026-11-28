// Mini-gioco di Francesco: L'ULTIMA PRIMA CHE ARRIVINO
// Fuori dal Cheers Pub (Milano), di sera. Aurelio vuole finire la pinta e sparire
// prima che arrivino Giorgio e Caiman. Francesco chiacchiera e propone brindisi:
// si preme al "cin" (quando il suo bicchiere va IN ORIZZONTALE verso Aurelio) e si tiene premuto per bere.
// Se il bicchiere sale in verticale è una FINTA. Giorgio e Caiman che si avvicinano sono il timer.
import { W, H, txt } from '../util.js';
import { sfx } from '../sfx.js';
import { FRIENDS, CHEERS as C } from '../data/characters.js';

const SC = 3;                  // scala dei personaggi seduti
const FEET = 334;              // y dei piedi di Aurelio e Francesco
const AUR_X = 68, FRA_X = 202; // posizione dei due al tavolo
const TABLE_X = 135, TABLE_Y = 308;

// Pose dei bicchieri: punto in basso al centro della pinta + inclinazione
const A_REST = { x: 104, y: 305, a: 0 }, A_MEET = { x: 123, y: 297, a: 10 }, A_MOUTH = { x: 92, y: 304, a: -50 };
const A_EARLY = { x: 116, y: 292, a: 4 };
const F_REST = { x: 166, y: 305, a: 0 }, F_LIFT = { x: 173, y: 299, a: 0 }, F_MEET = { x: 147, y: 297, a: -10 };
const F_MOUTH = { x: 178, y: 304, a: 50 }, F_FAKE = { x: 184, y: 250, a: 0 };

// Percorso di Giorgio e Caiman: da lontano (in fondo al marciapiede, a destra) fino al tavolo
const PATH = {
  giorgio: { x0: W - 14, y0: 214, s0: 0.75, x1: 114, y1: 300, s1: 2.8 },
  caiman:  { x0: W + 6,  y0: 216, s0: 0.75, x1: 158, y1: 302, s1: 2.9 }
};

const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k * k * (3 - 2 * k);
const lerpPose = (p, q, k) => ({ x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k), a: lerp(p.a, q.a, k) });

export class MiniCheers extends Phaser.Scene {
  constructor() { super('MiniCheers'); }

  init(data) { this.standalone = !!data?.standalone; }

  create() {
    // ---- stato (tutto azzerato a ogni avvio / riprova) ----
    this.phase = 'intro'; this.canStart = false;
    this.t = 0;                 // tempo di gioco (ms), parte dopo l'intro
    this.penalty = 0;           // ms "regalati" a Giorgio e Caiman con gli errori
    this.level = 100;           // birra nella pinta di Aurelio (0 = vuota)
    this.fLevel = 75;           // birra di Francesco (solo estetica)
    this.holding = false;
    this.aState = 'idle';       // idle | reach | drink | listen | early | gone
    this.aPose = { ...A_REST };
    this.beatIdx = -1; this.beatStart = 0; this.fillerIdx = 0;
    this.toastUsed = false; this.lastPresto = -9999; this.nearDone = false;
    this.mouthMs = 0; this.sipMs = 0; this.fShake = 0; this.aLean = 0;
    this.bubbles = {};
    this.beatLen = 0; this.walkP = undefined; this.walkT = 0; this.keepFriendTint = false;
    this.fOverride = null; this.fTalkMs = 0; this.meetMs = 0; this.canLeave = false; this.win_ = false; this.fPh = null; this.rate = 0; this.credit = 0;

    this.drawScene();

    // Giorgio e Caiman (sagome scure in lontananza)
    this.friends = {
      giorgio: this.add.image(0, 0, 'giorgio').setOrigin(0.5, 1).setDepth(3),
      caiman: this.add.image(0, 0, 'caiman').setOrigin(0.5, 1).setDepth(3)
    };
    this.placeFriends(0, 0);

    // Sgabelli, tavolo, personaggi, braccia, pinte
    this.drawStool(AUR_X); this.drawStool(FRA_X);
    this.drawTable();
    this.aurelio = this.add.image(AUR_X, FEET, 'aurelio_seduto').setOrigin(0.5, 1).setScale(SC).setDepth(5);
    this.francesco = this.add.image(FRA_X, FEET, 'francesco_seduto').setOrigin(0.5, 1).setScale(SC).setDepth(5);
    this.arms = this.add.graphics().setDepth(6);
    this.aPint = this.makePint(); this.fPint = this.makePint();
    this.drawPint(this.aPint, this.level); this.drawPint(this.fPint, this.fLevel);

    // HUD essenziale
    this.add.rectangle(W / 2, 12, W, 24, 0x1a1423, 0.75).setDepth(20);
    txt(this, W / 2, 12, "L'ULTIMA PRIMA CHE ARRIVINO", 7, '#f4d03f').setDepth(21);

    // ---- input: un solo tasto (tocco, mouse o barra spaziatrice) ----
    this.input.on('pointerdown', () => this.down());
    this.input.on('pointerup', () => this.up());
    this.input.on('pointerupoutside', () => this.up());
    this.input.keyboard?.on('keydown-SPACE', e => { if (!e.repeat) this.down(); });
    this.input.keyboard?.on('keyup-SPACE', () => this.up());
    const onBlur = () => this.up();
    const onHidden = () => sfx.ambientStop();
    const onVisible = () => { if (this.phase === 'play') sfx.ambientStart(); };
    this.game.events.on('blur', onBlur);
    this.game.events.on('hidden', onHidden);
    this.game.events.on('visible', onVisible);
    this.events.once('shutdown', () => {
      this.game.events.off('blur', onBlur); this.game.events.off('hidden', onHidden); this.game.events.off('visible', onVisible);
      sfx.ambientStop();
    });

    this.intro();
  }

  // ================= SCENA =================
  drawScene() {
    const g = this.add.graphics().setDepth(0);
    // piano di sopra (intonaco, finestre con persiane)
    g.fillStyle(0x34303e).fillRect(0, 24, W, 44);
    for (let x = 14; x < W; x += 64) {
      g.fillStyle(0x23202b).fillRect(x, 32, 34, 26);
      g.fillStyle(0x4a4656).fillRect(x + 2, 34, 30, 22);
      g.fillStyle(0x2c2934); for (let y = 36; y < 56; y += 3) g.fillRect(x + 2, y, 30, 1);
    }
    g.fillStyle(0x56525e).fillRect(0, 66, W, 4);
    // muro in granito
    g.fillStyle(0x5a575e).fillRect(0, 70, W, 140);
    for (let i = 0; i < 260; i++) {
      g.fillStyle([0x4e4b52, 0x67646b, 0x726f75][i % 3]);
      g.fillRect(Math.floor(Math.random() * W), 70 + Math.floor(Math.random() * 140), 2, 1);
    }
    // lampade sopra le insegne (luce calda)
    for (const x of [44, 135, 226]) {
      g.fillStyle(0xffd27a, 0.18).fillCircle(x, 80, 26);
      g.fillStyle(0xb8923a).fillRect(x - 1, 72, 2, 6).fillRect(x - 6, 72, 12, 2);
      g.fillStyle(0xffe9a8).fillRect(x - 3, 77, 6, 3);
    }
    // insegne verdi con bordo dorato
    const sign = (x, w) => { g.fillStyle(0xd9b44a).fillRect(x, 84, w, 22); g.fillStyle(0x1f6b3a).fillRect(x + 2, 86, w - 4, 18); };
    sign(6, 76); sign(92, 86); sign(188, 76);
    // tenda verde con bordo bianco
    g.fillStyle(0x1c5a32).fillRect(0, 110, W, 4);
    g.fillStyle(0x2f8a4a).fillRect(0, 114, W, 14);
    g.fillStyle(0x3aa05a); for (let x = 0; x < W; x += 16) g.fillRect(x, 114, 8, 14);
    g.fillStyle(0xf4f1ea).fillRect(0, 128, W, 2);
    g.fillStyle(0x2f8a4a); for (let x = 0; x < W; x += 12) g.fillTriangle(x, 130, x + 12, 130, x + 6, 135);
    // vetrine illuminate e porta
    const shop = (x, w) => {
      g.fillStyle(0x23202b).fillRect(x, 140, w, 66);
      g.fillStyle(0xc98a3a).fillRect(x + 3, 143, w - 6, 60);
      g.fillStyle(0xe8b04a, 0.6).fillRect(x + 3, 143, w - 6, 24);
      g.fillStyle(0xe6e2d8, 0.45).fillRect(x + 3, 170, w - 6, 33);       // vetro smerigliato
      g.lineStyle(2, 0x2f8a4a).strokeCircle(x + w / 2, 186, 10);         // trifoglio sul vetro
      g.fillStyle(0x2f8a4a).fillCircle(x + w / 2 - 3, 184, 3).fillCircle(x + w / 2 + 3, 184, 3).fillCircle(x + w / 2, 189, 3);
    };
    shop(8, 56); shop(72, 56);
    g.fillStyle(0x15121a).fillRect(140, 140, 40, 68); g.fillStyle(0x2a2632).fillRect(143, 143, 34, 65); // porta
    g.fillStyle(0xf4d03f).fillRect(150, 152, 8, 10); g.fillStyle(0xd03050).fillRect(160, 156, 8, 8);    // adesivi sulla porta
    g.fillStyle(0x1f6b3a).fillRect(192, 140, 70, 68); g.fillStyle(0xd9b44a).fillCircle(227, 174, 12);   // vetrina verde col logo
    g.fillStyle(0x1f6b3a).fillCircle(227, 174, 10);
    g.fillStyle(0xd9b44a).fillCircle(224, 172, 3).fillCircle(230, 172, 3).fillCircle(227, 177, 3);
    g.fillStyle(0x2a2731).fillRect(0, 206, W, 6);
    // marciapiede
    g.fillStyle(0x7c7870).fillRect(0, 212, W, 136);
    g.fillStyle(0x6c6862);
    for (let y = 212; y < 348; y += 17) g.fillRect(0, y, W, 1);
    for (let y = 212, r = 0; y < 348; y += 17, r++) for (let x = (r % 2) * 22; x < W; x += 44) g.fillRect(x, y, 1, 17);
    // luce calda del locale sul marciapiede
    g.fillStyle(0xffd27a, 0.08).fillEllipse(135, 230, 300, 50);
    // panca gialla (come nella foto) a sinistra, contro il muro
    g.fillStyle(0x2f6a3a).fillRect(12, 222, 3, 12).fillRect(54, 222, 3, 12);
    g.fillStyle(0xe0b030).fillRect(6, 216, 58, 6); g.fillStyle(0xb88a20).fillRect(6, 222, 58, 1);
    // palo (in primo piano a destra)
    g.fillStyle(0x8a8a96).fillRect(258, 60, 3, 290); g.fillStyle(0x5a5a66).fillRect(260, 60, 1, 290);
    // cordolo e strada
    g.fillStyle(0xb0aaa0).fillRect(0, 348, W, 4);
    g.fillStyle(0x2e2e36).fillRect(0, 352, W, H - 352);
    for (let i = 0; i < 160; i++) { g.fillStyle(i % 2 ? 0x34343e : 0x282830); g.fillRect(Math.floor(Math.random() * W), 352 + Math.floor(Math.random() * (H - 352)), 2, 1); }
    g.fillStyle(0xd8d4cc); for (let x = 6; x < W; x += 36) g.fillRect(x, 452, 18, 2);
    // auto parcheggiate lungo il marciapiede (viste di lato)
    const car = (x, col, dark) => {
      g.fillStyle(0x15121a).fillRect(x - 1, 361, 102, 30);
      g.fillStyle(col).fillRect(x, 372, 100, 18);
      g.fillStyle(col).fillRect(x + 22, 362, 52, 12);
      g.fillStyle(0x6a8aa0).fillRect(x + 26, 364, 20, 8).fillRect(x + 50, 364, 20, 8);
      g.fillStyle(dark).fillRect(x, 384, 100, 2);
      g.fillStyle(0x15121a).fillCircle(x + 20, 391, 8).fillCircle(x + 80, 391, 8);
      g.fillStyle(0x6e6a66).fillCircle(x + 20, 391, 4).fillCircle(x + 80, 391, 4);
      g.fillStyle(0xffe9a8).fillRect(x + 96, 375, 4, 3);
    };
    car(-40, 0x8a2b2b, 0x5a1a1a); car(120, 0x9a948c, 0x6e6a66);
    // lampione: luce arancione sulla strada
    g.fillStyle(0xf08a24, 0.07).fillCircle(240, 330, 90);

    // scritte delle insegne
    txt(this, 44, 95, 'BEER&FOOD', 6, '#f4f1ea').setDepth(1);
    txt(this, 135, 95, 'CHEERS', 10, '#f4f1ea').setDepth(1);
    txt(this, 226, 95, 'FOOD&DRINK', 6, '#f4f1ea').setDepth(1);
  }

  drawStool(x) {
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(0x1a1423).fillRect(x - 13, 318, 3, 30).fillRect(x + 10, 318, 3, 30);
    g.fillStyle(0x5e3a1c).fillRect(x - 12, 318, 1, 29).fillRect(x + 11, 318, 1, 29).fillRect(x - 12, 336, 24, 2);
    g.fillStyle(0x1a1423).fillEllipse(x, 318, 34, 9);
    g.fillStyle(0x7a4a2e).fillEllipse(x, 317, 31, 7);
  }

  drawTable() {
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(0x1a1423).fillRect(TABLE_X - 7, TABLE_Y, 14, 40).fillEllipse(TABLE_X, 348, 46, 10);
    g.fillStyle(0x1f6b3a).fillRect(TABLE_X - 5, TABLE_Y, 10, 38).fillEllipse(TABLE_X, 347, 42, 7);
    g.fillStyle(0x1a1423).fillEllipse(TABLE_X, TABLE_Y, 96, 22);
    g.fillStyle(0x4a2a1a).fillEllipse(TABLE_X, TABLE_Y + 1, 92, 18);
    g.fillStyle(0x6a3e26).fillEllipse(TABLE_X, TABLE_Y - 1, 88, 14);
    g.fillStyle(0xf4f1ea).fillRect(TABLE_X - 30, TABLE_Y - 3, 8, 3).fillRect(TABLE_X + 18, TABLE_Y - 1, 7, 3); // tovaglioli
  }

  // Pinta disegnata a mano: così il livello della birra si legge direttamente dal bicchiere
  makePint() {
    const g = this.add.graphics();
    return this.add.container(0, 0, [g]).setScale(SC).setDepth(7);
  }

  drawPint(pint, lvl) {
    const g = pint.list[0];
    g.clear();
    g.fillStyle(0x1a1423).fillRect(-4.5, -12.5, 9, 12.5);       // contorno
    g.fillStyle(0x7fa2b2).fillRect(-3.5, -11.5, 7, 10.5);       // vetro vuoto
    const h = 10 * Math.max(0, Math.min(100, lvl)) / 100;       // birra (fino a 10 unità)
    if (h > 0) {
      g.fillStyle(0xf0a830).fillRect(-3.5, -1 - h, 7, h);
      g.fillStyle(0xd98a20).fillRect(1.5, -1 - h, 2, h);
      g.fillStyle(0xf4f1ea).fillRect(-3.5, -1 - h - 0.01, 7, Math.min(1.4, h));   // schiuma
    }
    g.fillStyle(0xffffff, 0.7).fillRect(-2.6, -10.5, 0.8, 8);   // riflesso
    g.fillStyle(0x4a5a62).fillRect(-3.5, -1, 7, 1);             // fondo spesso
  }

  setPint(pint, pose) { pint.setPosition(pose.x, pose.y).setAngle(pose.a); }

  // centro della pinta (dove sta la mano)
  hand(pose) {
    const r = Phaser.Math.DegToRad(pose.a);
    return { x: pose.x + Math.sin(r) * 18, y: pose.y - Math.cos(r) * 18 };
  }

  drawArm(sx, sy, pose, sleeve) {
    const h = this.hand(pose), g = this.arms;
    const mx = lerp(sx, h.x, 0.35), my = lerp(sy, h.y, 0.35);
    g.lineStyle(9, 0x1a1423).lineBetween(sx, sy, h.x, h.y);
    g.lineStyle(6, 0xeab38b).lineBetween(mx, my, h.x, h.y);
    g.lineStyle(7, sleeve).lineBetween(sx, sy, mx, my);
    g.fillStyle(0x1a1423).fillCircle(h.x, h.y, 4.5);
    g.fillStyle(0xeab38b).fillCircle(h.x, h.y, 3.2);
  }

  // ================= INTRO =================
  intro() {
    const f = FRIENDS.francesco;
    const g = this.add.container(0, 0).setDepth(40);
    g.add(this.add.rectangle(W / 2, H / 2, W - 30, 250, 0x1a1423, 0.95).setStrokeStyle(3, 0xf4d03f));
    g.add(this.add.image(W / 2, H / 2 - 76, 'francesco').setScale(4));
    g.add(this.add.image(W / 2 + 36, H / 2 - 66, 'birra').setScale(2.5));
    g.add(txt(this, W / 2, H / 2 - 18, f.name, 14, '#f4d03f'));
    g.add(txt(this, W / 2, H / 2 + 6, '"' + f.line + '"', 8, '#ffffff'));
    g.add(txt(this, W / 2, H / 2 + 46, "FINISCI L'ULTIMA BIRRA\nPRIMA CHE ARRIVINO\nGIORGIO E CAIMAN", 7, '#bfe3f0'));
    const go = txt(this, W / 2, H / 2 + 100, 'TOCCA PER PARTIRE', 7, '#f08a24');
    g.add(go);
    this.tweens.add({ targets: go, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
    this.introBox = g;
    this.time.delayedCall(500, () => { this.canStart = true; });
  }

  startGame() {
    sfx.unlock(); sfx.pick();
    this.introBox.destroy();
    this.phase = 'play'; this.t = 0;
    this.nextBeat();
    sfx.ambientStart();
    const hint = txt(this, W / 2, 418, 'PREMI AL CIN\nTIENI PREMUTO PER BERE', 8, '#ffffff').setDepth(25);
    this.tweens.add({ targets: hint, alpha: 0, delay: 2400, duration: 400, onComplete: () => hint.destroy() });
  }

  // ================= INPUT =================
  down() {
    if (this.phase === 'intro') { if (this.canStart) this.startGame(); return; }
    if (this.phase === 'result') {
      if (this.canLeave) this.leave();
      return;
    }
    if (this.phase !== 'play' || this.holding) return;
    this.holding = true;

    const b = this.beat, lt = this.t - this.beatStart;
    if (b.toast) {
      if (this.toastUsed) return;                      // già brindato (o perso) in questo brindisi
      const w = b.tutorial ? C.tutorial : C.finestra;
      const d = lt - b.reach;                          // ms rispetto al contatto dei bicchieri
      if (d < -w.primaBuono) { this.presto(); return; }
      if (d <= w.dopoBuono) { this.cin(Math.abs(d) <= w.perfetto ? 'perfetto' : 'buono', Math.max(0, d)); return; }
      if (lt < b.reach + b.drink) { this.cin('tardi', 0); return; }
      return;                                          // sta già abbassando il bicchiere: nessuna penalità
    }
    this.presto();
  }

  up() {
    if (!this.holding) return;
    this.holding = false;
    if (this.aState === 'drink' || this.aState === 'listen') this.aState = 'idle';
  }

  // Troppo presto: Aurelio prova a brindare mentre Francesco parla
  presto() {
    if (this.t - this.lastPresto < C.cooldownPresto) return;
    this.lastPresto = this.t;
    this.penalty += C.penaltyPresto;
    this.aState = 'early'; this.earlyMs = 260;
    this.fShake = 300;
    sfx.hit();
    this.say('francesco', C.prestoLine, 1100);
  }

  // Cin! (perfetto / buono / tardi). credit = ms di sorso già "maturati" se premuto subito dopo il contatto
  cin(quality, credit) {
    const b = this.beat;
    this.toastUsed = true;
    this.quality = quality;
    const val = (quality === 'perfetto' ? C.sorso.perfetto : C.sorso.buono) * (b.half ? 0.5 : 1);
    this.rate = val / b.drink;
    this.credit = credit;
    if (quality === 'tardi' || this.t - this.beatStart >= b.reach) this.clink();
    else this.aState = 'reach';                        // i bicchieri si toccano al contatto
  }

  clink() {
    const b = this.beat;
    this.aState = 'drink';
    if (this.credit) { this.level -= this.rate * this.credit; this.credit = 0; }
    sfx.cin();
    const x = TABLE_X, y = 266;
    this.meetMs = 120;
    const lab = this.quality === 'perfetto' ? 'CIN!!' : this.quality === 'tardi' ? 'TARDI...' : 'CIN!';
    const col = this.quality === 'perfetto' ? '#f4d03f' : this.quality === 'tardi' ? '#c8b49a' : '#ffffff';
    const t = txt(this, x, y, lab, this.quality === 'perfetto' ? 10 : 8, col).setDepth(25);
    this.tweens.add({ targets: t, y: y - 18, alpha: 0, delay: 250, duration: 450, onComplete: () => t.destroy() });
    if (this.quality !== 'tardi') {
      const e = this.add.particles(x, 282, 'spark', { speed: { min: 40, max: 110 }, lifespan: 300, quantity: 10,
        tint: [0xffffff, 0xf4d03f], scale: 1.5, emitting: false }).setDepth(24);
      e.explode(this.quality === 'perfetto' ? 14 : 8); this.time.delayedCall(350, () => e.destroy());
    }
    if (!this.holding) this.aState = 'idle';
  }

  // ================= SEQUENZA DEI BRINDISI =================
  nextBeat() {
    this.beatIdx++;
    if (this.beatIdx < C.beats.length) this.beat = C.beats[this.beatIdx];
    else this.beat = C.filler[this.fillerIdx++ % C.filler.length];
    this.beatStart = this.beatIdx === 0 ? 0 : this.beatStart + this.beatLen;
    const b = this.beat;
    this.beatLen = b.toast ? b.reach + b.drink + C.abbassaMs : (b.talk || b.fake);
    this.toastUsed = false;
    if (b.say) this.say('francesco', b.say, Math.max(1300, this.beatLen + 400));
  }

  // fase di Francesco e posa del suo bicchiere al tempo locale lt
  francescoPose(lt) {
    const b = this.beat;
    if (b.fake) {
      const k = lt / b.fake;
      if (k < 0.3) return { ph: 'fake', pose: lerpPose(F_REST, F_FAKE, ease(k / 0.3)), lean: 0 };
      if (k < 0.7) { const p = { ...F_FAKE }; p.y += Math.sin(lt / 90) * 3; p.a = Math.sin(lt / 130) * 6; return { ph: 'fake', pose: p, lean: 0 }; }
      return { ph: 'fake', pose: lerpPose(F_FAKE, F_REST, ease((k - 0.7) / 0.3)), lean: 0 };
    }
    if (b.toast) {
      if (lt < b.reach) {
        const k = lt / b.reach;
        const pose = k < 0.3 ? lerpPose(F_REST, F_LIFT, ease(k / 0.3)) : lerpPose(F_LIFT, F_MEET, ease((k - 0.3) / 0.7));
        return { ph: 'reach', pose, lean: -9 * ease(k) };
      }
      if (lt < b.reach + b.drink) {
        const k = Math.max(0, Math.min(1, (lt - b.reach - 120) / 160));   // i bicchieri restano un attimo a contatto
        return { ph: 'drink', pose: lerpPose(F_MEET, F_MOUTH, ease(k)), lean: -9 * (1 - k) };
      }
      const k = Math.min(1, (lt - b.reach - b.drink) / C.abbassaMs);
      return { ph: 'lower', pose: lerpPose(F_MOUTH, F_REST, ease(k)), lean: 0 };
    }
    return { ph: 'talk', pose: { ...F_REST }, lean: 0 };
  }

  // ================= CICLO =================
  update(time, delta) {
    const dt = Math.min(delta, 50);
    if (this.phase === 'play') this.updatePlay(dt);
    this.updateFriendsWalk(dt);
    this.render(dt);
  }

  updatePlay(dt) {
    this.t += dt;
    while (this.t - this.beatStart >= this.beatLen) this.nextBeat();
    const lt = this.t - this.beatStart;
    const fp = this.francescoPose(lt);
    this.fPh = fp;

    // contatto dei bicchieri (se Aurelio ha premuto un attimo prima)
    if (this.aState === 'reach' && fp.ph !== 'reach') this.clink();

    // Aurelio beve solo mentre si tiene premuto E Francesco sta bevendo
    if (this.aState === 'drink') {
      if (fp.ph === 'drink') {
        this.level -= this.rate * dt;
        this.sipMs -= dt;
        if (this.sipMs <= 0) { this.sipMs = 320; sfx.sip(); }
      } else if (fp.ph === 'lower') { this.aState = 'listen'; this.listenMs = C.graziaMs; }
    }
    if (fp.ph === 'drink') this.fLevel = Math.max(25, this.fLevel - 0.0035 * dt);
    // Tiene premuto dopo il sorso: Francesco se ne accorge
    if (this.aState === 'listen') {
      this.listenMs -= dt;
      if (this.listenMs <= 0) {
        this.aState = 'idle'; this.penalty += C.penaltyAscolto; sfx.hit();
        this.say('francesco', C.ascoltoLine, 1400);
      }
    }
    if (this.aState === 'early') { this.earlyMs -= dt; if (this.earlyMs <= 0) this.aState = 'idle'; }

    // Prima controlla la birra, poi l'arrivo degli amici (stesso istante = vinto)
    if (this.level <= 0.001) { this.level = 0; this.win(); return; }
    const p = this.progress();
    if (!this.nearDone && p >= 0.8) { this.nearDone = true; sfx.near(); this.say('giorgio', '!', 700); }
    if (p >= 1) this.lose();
  }

  progress() { return Phaser.Math.Clamp((this.t + this.penalty) / C.arriveMs, 0, 1); }

  updateFriendsWalk(dt) {
    let p;
    if (this.phase === 'intro') p = 0;
    else if (this.walkP !== undefined) p = this.walkP;          // finale: animazione forzata
    else p = this.progress();
    this.walkT = (this.walkT || 0) + dt;
    this.placeFriends(p, p < 1 ? this.walkT : 0);
  }

  placeFriends(p, wt) {
    const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x221c2e), Phaser.Display.Color.ValueToColor(0xffffff), 100, Math.min(100, p / 0.6 * 100));
    const col = Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b);
    for (const [k, im] of Object.entries(this.friends)) {
      const P = PATH[k], ph = k === 'caiman' ? 1.3 : 0;
      const bob = wt ? Math.abs(Math.sin(wt / 150 + ph)) * 2 * lerp(0.5, 1.5, p) : 0;
      im.setPosition(lerp(P.x0, P.x1, p), lerp(P.y0, P.y1, p) - bob)
        .setScale(lerp(P.s0, P.s1, Math.pow(p, 1.2)))
        .setAngle(wt ? Math.sin(wt / 150 + ph) * 3 : 0);
      if (!this.keepFriendTint) im.setTint(col);
    }
  }

  render(dt) {
    // Francesco: posa, bocca che si muove quando parla, scossone quando lo interrompi
    const fp = this.phase === 'play' ? this.fPh : (this.fOverride || { ph: 'talk', pose: { ...F_REST }, lean: 0 });
    const talking = this.phase === 'play' && (fp.ph === 'talk' || fp.ph === 'fake' || (fp.ph === 'reach' && this.beat.say)) || this.fTalkMs > 0;
    this.mouthMs -= dt; this.fTalkMs = (this.fTalkMs || 0) - dt;
    if (talking && this.mouthMs <= 0) { this.mouthMs = 140; this.francesco.setTexture(this.francesco.texture.key === 'francesco_parla' ? 'francesco_seduto' : 'francesco_parla'); }
    if (!talking) this.francesco.setTexture('francesco_seduto');
    this.fShake = Math.max(0, this.fShake - dt);
    const shake = this.fShake > 0 ? Math.sin(this.fShake / 25) * 2 : 0;
    this.francesco.setX(FRA_X + fp.lean + shake).setAngle(fp.lean * 0.6);
    const fPose = { ...fp.pose, x: fp.pose.x + shake };

    // Aurelio: il bicchiere segue lo stato (con un po' di morbidezza)
    this.meetMs = Math.max(0, (this.meetMs || 0) - dt);
    const target = this.meetMs > 0 && this.aState === 'drink' ? A_MEET
      : ({ idle: A_REST, reach: A_MEET, drink: A_MOUTH, listen: A_MOUTH, early: A_EARLY }[this.aState] || A_REST);
    const k = Math.min(1, dt * 0.022);
    this.aPose = lerpPose(this.aPose, target, k);
    if (this.aState !== 'gone') {
      const lean = this.aState === 'reach' || this.aState === 'early' ? 5 : 0;
      this.aLean = lerp(this.aLean, lean, k);
      this.aurelio.setX(AUR_X + this.aLean).setAngle(this.aLean * 0.6);
    }

    this.drawPint(this.aPint, this.level); this.drawPint(this.fPint, this.fLevel);
    this.setPint(this.fPint, fPose);
    this.arms.clear();
    this.drawArm(FRA_X - 18 + fp.lean, FEET - 30, fPose, 0xf4f1ea);
    if (this.aState !== 'gone') { this.setPint(this.aPint, this.aPose); this.drawArm(AUR_X + 18 + this.aLean, FEET - 30, this.aPose, 0xf4f1ea); }

    // nuvolette che seguono chi parla
    for (const [who, b] of Object.entries(this.bubbles)) this.placeBubble(who, b);
  }

  // ================= DIALOGHI =================
  say(who, line, ms) {
    this.bubbles[who]?.destroy();
    const t = txt(this, 0, 0, line, 7, who === 'francesco' ? '#ffffff' : '#bfe3f0').setDepth(26).setOrigin(0.5, 1);
    this.bubbles[who] = t;
    this.placeBubble(who, t);
    if (who === 'francesco') this.fTalkMs = Math.min(ms, 900);
    this.time.delayedCall(ms, () => { if (this.bubbles[who] === t) { t.destroy(); delete this.bubbles[who]; } });
  }

  placeBubble(who, t) {
    let x, y;
    if (who === 'francesco') { x = this.francesco.x; y = FEET - 82; }
    else if (who === 'aurelio') { x = this.aurelio.x; y = FEET - 82; }
    else { const im = this.friends[who]; x = im.x; y = im.y - im.displayHeight - 4; }
    t.setPosition(Phaser.Math.Clamp(x, t.width / 2 + 4, W - t.width / 2 - 4), Math.max(36 + t.height, y));
  }

  // ================= FINALE =================
  win() {
    this.phase = 'end'; this.holding = false; sfx.ambientStop(); sfx.boost();
    this.fOverride = { ph: 'talk', pose: { ...F_REST }, lean: 0 };
    this.aState = 'idle';
    // Aurelio posa la pinta vuota, si alza e scappa a sinistra
    this.time.delayedCall(350, () => {
      this.aState = 'gone';
      this.setPint(this.aPint, A_REST);
      this.tweens.add({ targets: this.aurelio, y: FEET - 8, duration: 120, onComplete: () => {
        this.tweens.add({ targets: this.aurelio, x: -40, duration: 650, ease: 'Quad.in' });
        this.tweens.add({ targets: this.aurelio, y: FEET - 14, duration: 90, yoyo: true, repeat: 3 });
      } });
      const d = this.add.particles(AUR_X, FEET - 4, 'spark', { speedX: { min: 20, max: 80 }, speedY: { min: -30, max: 0 },
        lifespan: 400, quantity: 10, tint: 0xc8b49a, scale: 2, emitting: false }).setDepth(8);
      d.explode(10); this.time.delayedCall(450, () => d.destroy());
    });
    // Giorgio e Caiman arrivano subito dopo
    this.walkP = this.progress();
    this.tweens.add({ targets: this, walkP: 1, delay: 700, duration: Math.max(500, (1 - this.walkP) * 2200), onComplete: () => {
      this.walkT = 0;
      this.say('giorgio', C.winLines[0], 1600);
      this.time.delayedCall(1000, () => {
        // Francesco, ancora con il bicchiere alzato
        this.fOverride = { ph: 'talk', pose: { ...F_FAKE }, lean: 0 };
        this.say('francesco', C.winLines[1], 1800);
        this.time.delayedCall(2000, () => this.result(true));
      });
    } });
  }

  lose() {
    this.phase = 'end'; this.holding = false; sfx.ambientStop(); sfx.over();
    this.walkP = 1; this.walkT = 0;
    this.fOverride = { ph: 'talk', pose: { ...F_REST }, lean: 0 };
    if (this.aState !== 'idle') this.aState = 'idle';
    this.time.delayedCall(400, () => {
      this.say('giorgio', C.loseLines[0], 1700);
      this.time.delayedCall(1500, () => {
        this.keepFriendTint = true;
        this.friends.caiman.setTexture('caiman_retro');   // si gira verso il locale
        this.say('caiman', C.loseLines[1], 1500);
        sfx.order();
        // una pinta nuova, piena, davanti ad Aurelio
        this.time.delayedCall(700, () => {
          const np = this.makePint(); this.drawPint(np, 100);
          np.setPosition(120, 200).setAlpha(0);
          this.tweens.add({ targets: np, y: 307, alpha: 1, duration: 450, ease: 'Bounce.out' });
          this.time.delayedCall(1500, () => this.result(false));
        });
      });
    });
  }

  result(win) {
    this.phase = 'result'; this.canLeave = false; this.win_ = win;
    const g = this.add.container(0, 0).setDepth(50);
    g.add(this.add.rectangle(W / 2, H / 2, W - 30, 230, 0x1a1423, 0.95).setStrokeStyle(3, win ? 0x3a8a3a : 0xc0392b));
    const pint = this.makePint(); this.drawPint(pint, win ? 0 : 100);
    pint.setPosition(W / 2, H / 2 - 22).setScale(4).setDepth(51);
    if (win) {
      g.add(txt(this, W / 2, H / 2 - 86, 'FUGA RIUSCITA!', 12, '#f4d03f'));
      g.add(txt(this, W / 2, H / 2 + 8, '+' + C.reward.points + ' PUNTI', 9, '#ffffff'));
      g.add(txt(this, W / 2, H / 2 + 34, 'TURBO DI FUGA\nNEL LIVELLO', 7, '#bfe3f0'));
    } else {
      g.add(txt(this, W / 2, H / 2 - 86, 'SERATA INFINITA', 12, '#ff6b5b'));
      g.add(txt(this, W / 2, H / 2 + 14, this.standalone ? 'GIORGIO E CAIMAN\nTI HANNO PRESO' : 'ESCI SBRONZO:\nTUTTO ONDEGGIA', 7, '#c8b49a'));
    }
    const go = txt(this, W / 2, H / 2 + 86, 'TOCCA PER CONTINUARE', 7, '#f08a24');
    g.add(go);
    this.tweens.add({ targets: go, alpha: 0.3, duration: 450, yoyo: true, repeat: -1 });
    g.setAlpha(0).setY(30); pint.setAlpha(0);
    this.tweens.add({ targets: [g, pint], alpha: 1, duration: 250 });
    this.tweens.add({ targets: g, y: 0, duration: 250, ease: 'Back.out' });
    this.time.delayedCall(800, () => { this.canLeave = true; });
  }

  leave() {
    this.phase = 'left';
    if (this.standalone) { this.scene.start('Menu'); return; }
    this.scene.stop();
    this.scene.resume('Level', { mini: 'francesco', win: this.win_ });
  }
}
