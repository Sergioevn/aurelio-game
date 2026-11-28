// Mini-gioco di Antonio: IL PORTAFOGLIO
// Fase 1 (shopping): dall'alto cadono cavolate (orologi, sigari, occhiali, offerte lampo).
// Antonio corre a comprarle: Aurelio deve arrivarci prima di lui. Ogni acquisto svuota il portafoglio.
// Se a fine tempo ci sono ancora soldi... si va in barca.
// Fase 2 (barca): CAMERIERE DI BORDO - Un Camparino per Antonio. Barca vista di lato: tieni premuto
// e Aurelio cammina sul ponte verso Antonio; prima di ogni onda la prua si alza, se cammina durante
// il rollio il Camparino trabocca. Antonio si allontana tre volte (Macarena, Saint Barth, poppa).
import { W, H, txt, PLAYER_Y } from '../util.js';
import { sfx } from '../sfx.js';
import { FRIENDS, PORTAFOGLIO as P } from '../data/characters.js';

const DECK_Y = 300;   // ponte della barca (piedi dei personaggi)
const PIVOT_Y = 320;  // centro del beccheggio
const SEA_Y = 338;    // linea dell'acqua davanti allo scafo

export class MiniPortafoglio extends Phaser.Scene {
  constructor() { super('MiniPortafoglio'); }

  init(data) { this.standalone = !!data?.standalone; this.startBarca = !!data?.barca; }

  create() {
    this.phase = 'intro'; this.elapsed = 0; this.targetX = null;
    this.soldi = P.soldi; this.items = []; this.rows = [];
    this.canStart = false; this.canLeave = false; this.win_ = false; this.bubbleObj = null;
    this.pointers = new Set(); this.space = false; this.block = false; this.rig = null; this.camparino = 100; this.gag = 0; this.bubbles = {}; this.wave = null; this.boatIntro = null; this.glassAt = null; this.antReach = 0; this.finalLevel = 0;

    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'road');
    this.player = this.add.image(W / 2 - 50, PLAYER_Y, 'aurelio').setScale(2).setDepth(5);
    this.antonio = this.add.image(W / 2 + 50, PLAYER_Y - 2, 'antonio_ballo1').setScale(2).setDepth(4);

    this.input.on('pointerdown', p => this.onDown(p));
    this.input.on('pointermove', p => { if (p.isDown) this.targetX = p.x; });
    this.input.on('pointerup', p => this.onUp(p));
    this.input.on('pointerupoutside', p => this.onUp(p));
    this.keys = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.addCapture('SPACE');
    this.input.keyboard?.on('keydown-SPACE', e => { if (!e.repeat) this.onDown(null); });
    this.input.keyboard?.on('keyup-SPACE', () => this.onUp(null));
    // dito interrotto, cambio app, perdita del focus: Aurelio si ferma
    const releaseAll = () => { this.pointers.clear(); this.space = false; this.block = false; this.targetX = null; };
    const canvas = this.game.canvas, noMenu = e => e.preventDefault();
    this.game.events.on('blur', releaseAll); this.game.events.on('hidden', releaseAll);
    canvas.addEventListener('touchcancel', releaseAll); canvas.addEventListener('pointercancel', releaseAll);
    canvas.addEventListener('contextmenu', noMenu);
    this.events.once('shutdown', () => {
      this.game.events.off('blur', releaseAll); this.game.events.off('hidden', releaseAll);
      canvas.removeEventListener('touchcancel', releaseAll); canvas.removeEventListener('pointercancel', releaseAll);
      canvas.removeEventListener('contextmenu', noMenu);
    });

    // HUD
    this.add.rectangle(W / 2, 12, W, 24, 0x1a1423, 0.75).setDepth(20);
    this.title = txt(this, 8, 12, 'IL PORTAFOGLIO', 8, '#f4d03f', 0).setOrigin(0, 0.5).setDepth(21);
    this.walletIcon = this.add.image(W - 70, 12, 'portafoglio').setDepth(21);
    this.info = txt(this, W - 8, 12, '', 7, '#ffffff', 0).setOrigin(1, 0.5).setDepth(21);
    this.timeBar = this.add.rectangle(0, 25, W, 3, 0xf08a24).setOrigin(0, 0.5).setDepth(21);
    this.updateWallet();

    this.intro();
  }

  intro() {
    const f = FRIENDS.antonio;
    const g = this.add.container(0, 0).setDepth(40);
    g.add(this.add.rectangle(W / 2, H / 2, W - 30, 240, 0x1a1423, 0.95).setStrokeStyle(3, 0xf4d03f));
    g.add(this.add.image(W / 2, H / 2 - 66, 'antonio').setScale(4));
    g.add(this.add.image(W / 2 + 30, H / 2 - 50, 'sigaro').setScale(2));
    g.add(txt(this, W / 2, H / 2 - 6, f.name, 14, '#f4d03f'));
    g.add(txt(this, W / 2, H / 2 + 20, '"' + f.line + '"', 8, '#ffffff'));
    g.add(txt(this, W / 2, H / 2 + 52, this.startBarca ? 'PORTA UN CAMPARINO\nAD ANTONIO!' : 'PRENDI LE CAVOLATE\nPRIMA DI LUI, O SPENDE\nTUTTI I SOLDI!', 7, '#bfe3f0'));
    const go = txt(this, W / 2, H / 2 + 94, 'TOCCA PER PARTIRE', 7, '#f08a24');
    g.add(go);
    this.tweens.add({ targets: go, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
    this.introBox = g;
    this.time.delayedCall(500, () => { this.canStart = true; });
  }

  onDown(p) {
    if (this.phase === 'intro') {
      if (!this.canStart) return;
      sfx.unlock(); sfx.pick();
      this.introBox.destroy(); this.block = true;
      if (this.startBarca) this.startBoat(); else this.startShop();
      return;
    }
    if (this.phase === 'boatIntro') { if (this.canStart) this.startWalk(); return; }
    if (this.phase === 'result') { if (this.canLeave) this.leave(); return; }
    if (p) { this.pointers.add(p.id); this.targetX = p.x; } else this.space = true;
  }

  onUp(p) {
    if (p) this.pointers.delete(p.id); else this.space = false;
    if (!this.pointers.size) this.targetX = null;
    if (!this.pointers.size && !this.space) this.block = false;
  }

  update(t, dt) {
    if (this.phase === 'shop') this.updateShop(dt);
    else if (['boatIntro', 'walk', 'gag', 'deliver', 'done'].includes(this.phase) && this.rig) this.updateBoat(dt);
    if (this.phase === 'shop' || this.phase === 'intro') this.bg.tilePositionY -= 30 * dt / 1000;
  }

  movePlayer(obj, dt, speed, minX = 34, maxX = W - 34) {
    const step = speed * dt / 1000;
    if (this.keys?.left.isDown) obj.x -= step;
    else if (this.keys?.right.isDown) obj.x += step;
    else if (this.targetX !== null) { const dx = this.targetX - obj.x; obj.x += Math.sign(dx) * Math.min(Math.abs(dx), step); }
    obj.x = Phaser.Math.Clamp(obj.x, minX, maxX);
  }

  // ================= FASE 1: SHOPPING =================
  startShop() {
    this.phase = 'shop'; this.elapsed = 0; this.spawnMs = 500; this.lineIdx = 0;
    const hint = txt(this, W / 2, PLAYER_Y - 90, 'ARRIVA PRIMA DI ANTONIO!', 7, '#ffffff').setDepth(25);
    this.tweens.add({ targets: hint, alpha: 0, delay: 2200, duration: 400, onComplete: () => hint.destroy() });
  }

  updateShop(dt) {
    const s = dt / 1000;
    this.elapsed += dt;
    const p = this.player, a = this.antonio;
    this.movePlayer(p, dt, 230);
    p.y = PLAYER_Y + Math.abs(Math.sin(this.elapsed / 120)) * 2;

    // Cavolate dall'alto
    this.spawnMs -= dt;
    if (this.spawnMs <= 0) {
      this.spawnMs = Phaser.Math.Between(P.spawnEvery[0], P.spawnEvery[1]);
      const kind = this.pickKind();
      const o = this.add.image(Phaser.Math.Between(30, W - 30), -16, kind).setScale(2).setDepth(3);
      o.kind = kind; o.vel = P.cavolate[kind].vel;
      if (kind === 'polo') this.antonioSay(P.poloLine, 1300);   // nell'euforia Antonio urla
      this.items.push(o);
    }

    // Antonio: corre verso la cavolata più vicina a terra che riesce a raggiungere
    let best = null, bestT = Infinity;
    for (const o of this.items) {
      if (o.done) continue;
      const tLand = (PLAYER_Y - o.y) / o.vel;
      if (tLand < -0.1) continue;
      const reach = Math.abs(o.x - a.x) / P.antonioSpeed;
      if (reach <= tLand + 0.15 && tLand < bestT) { best = o; bestT = tLand; }
    }
    const goal = best ? best.x : W / 2 + Math.sin(this.elapsed / 700) * 60;
    const dx = goal - a.x;
    a.x += Math.sign(dx) * Math.min(Math.abs(dx), P.antonioSpeed * s);
    a.x = Phaser.Math.Clamp(a.x, 30, W - 30);
    a.setFlipX(dx < 0);
    a.y = PLAYER_Y - 2 + Math.abs(Math.sin(this.elapsed / 100)) * 3;

    // Chi la prende prima?
    for (const o of this.items) {
      if (o.done) continue;
      o.y += o.vel * s;
      o.setAngle(Math.sin((this.elapsed + o.x * 10) / 200) * 12);
      if (o.y > PLAYER_Y - 24 && o.y < PLAYER_Y + 14) {
        if (Math.abs(o.x - p.x) < 20) { this.saved(o); continue; }
        if (Math.abs(o.x - a.x) < 20) { this.bought(o); continue; }
      }
      if (o.y > PLAYER_Y + 30) { o.done = true; this.tweens.add({ targets: o, alpha: 0, duration: 250, onComplete: () => o.destroy() }); }
    }
    this.items = this.items.filter(o => !o.done);
    if (this.phase !== 'shop') return;

    const left = Math.max(0, P.shopMs - this.elapsed);
    this.timeBar.width = W * left / P.shopMs;
    if (left <= 0) this.shopDone();
  }

  pickKind() {
    const e = Object.entries(P.pesi);
    let r = Math.random() * e.reduce((t, [, w]) => t + w, 0);
    for (const [k, w] of e) if ((r -= w) < 0) return k;
    return e[0][0];
  }

  // Aurelio gliela soffia: Antonio commenta
  saved(o) {
    o.done = true; sfx.pick();
    this.tweens.add({ targets: o, y: o.y - 30, alpha: 0, scale: 3, duration: 300, onComplete: () => o.destroy() });
    this.antonioSay(P.saveLines[this.lineIdx++ % P.saveLines.length]);
  }

  // Antonio la compra: soldi che volano via
  bought(o) {
    o.done = true; sfx.coin();
    const c = P.cavolate[o.kind];
    this.soldi = Math.max(0, this.soldi - c.prezzo);
    this.updateWallet();
    this.tweens.add({ targets: this.walletIcon, scale: 1.6, duration: 120, yoyo: true });
    this.floatText(this.antonio.x, this.antonio.y - 40, '-' + c.prezzo + '€ ' + c.label, '#ff6b5b');
    this.tweens.add({ targets: o, x: this.antonio.x, y: this.antonio.y, scale: 0.5, alpha: 0, duration: 200, onComplete: () => o.destroy() });
    if (this.soldi <= 0) this.shopLost();
  }

  updateWallet() { this.info.setText(this.soldi + '€'); this.info.setColor(this.soldi <= 150 ? '#ff6b5b' : '#ffffff'); }

  antonioSay(line, hold = 700) {
    if (this.bubbleObj) this.bubbleObj.destroy();
    const b = txt(this, Phaser.Math.Clamp(this.antonio.x, 70, W - 70), this.antonio.y - 46, line, 7, '#ff9ecb').setDepth(22);
    this.bubbleObj = b;
    this.tweens.add({ targets: b, y: b.y - 10, alpha: 0, delay: hold, duration: 400, onComplete: () => { b.destroy(); if (this.bubbleObj === b) this.bubbleObj = null; } });
  }

  clearItems() { this.items.forEach(o => o.destroy()); this.items = []; }

  shopLost() {
    this.phase = 'done'; sfx.over(); this.clearItems();
    this.loseReason = 'PORTAFOGLIO VUOTO';
    this.floatText(W / 2, PLAYER_Y - 90, 'PORTAFOGLIO VUOTO!', '#ff6b5b');
    this.time.delayedCall(1200, () => this.antonioSays(FRIENDS.antonio.loseLine, () => this.result(false)));
  }

  shopDone() {
    this.phase = 'sbarco'; sfx.win(); this.clearItems(); this.targetX = null;
    const t1 = txt(this, W / 2, H / 2 - 60, 'SOLDI SALVATI: ' + this.soldi + '€', 9, '#f4d03f').setDepth(30);
    const t2 = txt(this, W / 2, H / 2 - 30, 'E ORA... IN BARCA!', 9, '#ffffff').setDepth(30).setAlpha(0);
    this.tweens.add({ targets: t2, alpha: 1, delay: 900, duration: 300 });
    this.time.delayedCall(2300, () => {
      this.cameras.main.fadeOut(300, 26, 20, 35);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        t1.destroy(); t2.destroy();
        this.startBoat();
        this.cameras.main.fadeIn(300, 26, 20, 35);
      });
    });
  }

  // ================= FASE 2: CAMERIERE DI BORDO =================
  // Barca vista di lato (poppa a sinistra, prua a destra). Aurelio porta un Camparino ad Antonio:
  // tieni premuto = cammina verso di lui, sollevi il dito = si ferma e stabilizza il bicchiere.
  // Prima di ogni onda la prua si alza (preavviso); se cammina durante il rollio il Camparino trabocca.
  // Tre volte Antonio si allontana proprio sul più bello (Macarena, Saint Barth, richiamo di poppa).
  startBoat() {
    const B = P.barca;
    this.phase = 'boatIntro'; this.elapsed = 0;
    this.camparino = 100; this.gag = 0; this.offer = 0; this.seated = false;
    this.camX = Phaser.Math.Clamp(B.aurelioX - W / 2, -70, B.lunghezza - W + 30); this.camFollow = 'aurelio';
    this.pitch = 0; this.wave = null; this.waveIdx = 0; this.resumeCalm = false; this.doppia = 0;
    this.walking = false; this.dir = -1; this.danceMs = 0; this.frame = 1; this.antDance = true; this.antHold = false;
    this.bubbles = {}; this.dropMs = 0;
    this.bg.setVisible(false);
    this.player.setVisible(false); this.antonio.setVisible(false);
    this.title.setText('CAMERIERE DI BORDO'); this.walletIcon.setVisible(false); this.info.setText(''); this.timeBar.setVisible(false);

    this.drawSeaBack();
    // la barca e chi ci sta sopra: "rig" ruota (beccheggio), "world" scorre con l'inquadratura
    this.rig = this.add.container(W / 2, PIVOT_Y).setDepth(6);
    this.world = this.add.container(0, -PIVOT_Y);
    this.rig.add(this.world);
    this.drawBoat();
    this.caiman = this.add.image(B.caimanX, DECK_Y, 'caiman_costume').setScale(2).setOrigin(0.5, 1);
    this.ant = this.add.image(B.antonioX, DECK_Y, 'antonio_ballo1').setScale(2).setOrigin(0.5, 1);
    this.aur = this.add.image(B.aurelioX, DECK_Y, 'aurelio').setScale(2).setOrigin(0.5, 1);
    this.gArms = this.add.graphics();
    this.world.add([this.caiman, this.ant, this.aur, this.gArms]);
    this.drawSeaFront();

    // HUD: bicchiere grande (si svuota insieme a quello in mano), segnale dell'onda, freccia verso Antonio
    this.hudGlass = this.add.graphics().setDepth(22);
    this.add.rectangle(W - 26, 52, 40, 46, 0x1a1423, 0.75).setDepth(21).setStrokeStyle(1, 0x6e6a76);
    this.ondaText = txt(this, W / 2 - 14, 54, 'ONDA!', 12, '#ffffff').setDepth(23).setAlpha(0);
    // indicatore dell'onda: la barra si riempie fino all'arrivo dell'onda; piena e rossa = FERMO
    this.gauge = this.add.graphics().setDepth(23);
    this.gaugeLbl = txt(this, 22, 34, 'ONDA', 6, '#ffffff', 0).setOrigin(0, 0.5).setDepth(23);
    this.arrow = txt(this, 0, DECK_Y - 70, '', 7, '#f4d03f').setDepth(23);

    // spiegazione iniziale: solo le due regole
    const g = this.add.container(0, 0).setDepth(40);
    g.add(this.add.rectangle(W / 2, H / 2 - 30, W - 30, 250, 0x1a1423, 0.95).setStrokeStyle(3, 0xf4d03f));
    g.add(this.add.image(W / 2, H / 2 - 128, 'camparino').setScale(3));
    g.add(txt(this, W / 2, H / 2 - 88, "MISSIONE: CONSEGNA IL\nCAMPARINO ALL'ULTRAECCITATO\nANTONIO", 7, '#f4d03f'));
    g.add(txt(this, W / 2, H / 2 - 50, 'TIENI PREMUTO\nPER CAMMINARE', 9, '#ffffff'));
    g.add(txt(this, W / 2, H / 2 + 4, "SOLLEVA IL DITO\nQUANDO LA BARRA\nDELL'ONDA È PIENA", 8, '#ff9ecb'));
    const go = txt(this, W / 2, H / 2 + 60, 'TOCCA PER PARTIRE', 7, '#f08a24');
    g.add(go); this.tweens.add({ targets: go, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
    this.boatIntro = g; this.canStart = false;
    this.time.delayedCall(500, () => { this.canStart = true; });
    this.renderBoat(0);
  }

  startWalk() {
    this.boatIntro.destroy(); this.boatIntro = null;
    sfx.pick();
    this.phase = 'walk'; this.block = true;          // il tocco che chiude la spiegazione non fa camminare
    this.resumeCalm = true; this.nextWave();
  }

  drawSeaBack() {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x7ec8ee).fillRect(0, 24, W, 230);
    g.fillStyle(0xa8dcf4).fillRect(0, 150, W, 104);
    g.fillStyle(0xffe9a8).fillCircle(214, 70, 16); g.fillStyle(0xfff4c8).fillCircle(214, 70, 11);
    g.fillStyle(0xffffff, 0.85).fillEllipse(60, 64, 54, 10).fillEllipse(84, 58, 30, 10);
    this.island = this.add.graphics().setDepth(1);
    this.island.fillStyle(0x4f8a5a).fillEllipse(0, 254, 120, 26); this.island.fillStyle(0x3f7448).fillEllipse(-14, 250, 60, 22);
    this.island.fillStyle(0xe8d8a8).fillRect(-58, 252, 116, 3);
    this.island.x = 200;
    this.seaBack = this.add.tileSprite(W / 2, (254 + H) / 2, W, H - 254, 'mare').setDepth(2);
  }

  drawSeaFront() {
    // acqua davanti allo scafo (non ruota): copre la parte bassa e fa da zona per il pollice
    this.seaFront = this.add.tileSprite(W / 2, (SEA_Y + H) / 2, W, H - SEA_Y, 'mare').setDepth(8).setAlpha(0.96);
    const g = this.add.graphics().setDepth(8);
    g.fillStyle(0xffffff, 0.7); for (let x = 0; x < W; x += 14) g.fillRect(x, SEA_Y, 8, 2);
    this.foam = g;
    // la cresta dell'onda che arriva dalla prua (si vede durante il preavviso)
    this.crest = this.add.container(W + 40, SEA_Y - 4).setDepth(9).setVisible(false);
    for (let i = 0; i < 3; i++) this.crest.add(this.add.image(i * 30 - 30, i === 1 ? -6 : 0, 'onda').setScale(1.3, 2));
  }

  drawBoat() {
    const B = P.barca, L = B.lunghezza, g = this.add.graphics();
    // scafo bianco con riga rossa, prua a punta a destra
    const hull = (inset, col) => {
      g.fillStyle(col);
      g.fillPoints([{ x: 6 + inset, y: DECK_Y - 2 + inset }, { x: L - 40, y: DECK_Y - 2 + inset }, { x: L + 6 - inset * 2, y: DECK_Y - 14 + inset },
        { x: L - 60, y: DECK_Y + 52 - inset }, { x: 18 + inset, y: DECK_Y + 52 - inset }], true);
    };
    hull(0, 0x1a1423); hull(2, 0xf4f1ea);
    g.fillStyle(0xc0392b).fillRect(10, DECK_Y + 16, L - 70, 4);
    g.fillStyle(0x2f4b7c).fillRect(10, DECK_Y + 22, L - 80, 2);
    for (let x = 60; x < L - 80; x += 70) { g.fillStyle(0x1a1423).fillCircle(x, DECK_Y + 9, 4); g.fillStyle(0x7ec8ee).fillCircle(x, DECK_Y + 9, 2.5); } // oblò
    // ponte in legno
    g.fillStyle(0x1a1423).fillRect(6, DECK_Y - 4, L - 44, 6);
    g.fillStyle(0xb07a44).fillRect(7, DECK_Y - 3, L - 46, 4);
    g.fillStyle(0x8a5a2e); for (let x = 20; x < L - 40; x += 18) g.fillRect(x, DECK_Y - 3, 1, 4);
    // tuga (cabina) in mezzo, dietro ai personaggi
    g.fillStyle(0x1a1423).fillRect(348, DECK_Y - 44, 104, 42);
    g.fillStyle(0xe8e4dc).fillRect(350, DECK_Y - 42, 100, 40);
    g.fillStyle(0x1a1423).fillRect(358, DECK_Y - 36, 84, 14); g.fillStyle(0x5a8aa8).fillRect(360, DECK_Y - 34, 80, 10);
    g.fillStyle(0x1a1423).fillRect(340, DECK_Y - 50, 120, 7); g.fillStyle(0x2f4b7c).fillRect(342, DECK_Y - 49, 116, 5);
    // parapetto (tubi cromati)
    g.fillStyle(0x9a9aa6);
    for (let x = 14; x < L - 40; x += 34) g.fillRect(x, DECK_Y - 26, 2, 24);
    g.fillRect(12, DECK_Y - 27, L - 52, 2); g.fillRect(L - 42, DECK_Y - 27, 30, 2);
    // poppa: parapetto più alto e bandiera
    g.fillStyle(0x1a1423).fillRect(4, DECK_Y - 40, 4, 38); g.fillStyle(0xd0d0da).fillRect(5, DECK_Y - 39, 2, 36);
    g.fillStyle(0x3a8a3a).fillRect(8, DECK_Y - 60, 6, 8); g.fillStyle(0xffffff).fillRect(14, DECK_Y - 60, 6, 8); g.fillStyle(0xc0392b).fillRect(20, DECK_Y - 60, 6, 8);
    g.fillStyle(0x6e6a66).fillRect(7, DECK_Y - 62, 1, 24);
    this.world.add(g);
    // scia dietro la poppa
    this.wake = this.add.particles(2, SEA_Y - 5, 'spark', { x: { min: -6, max: 4 }, y: { min: -4, max: 6 }, speedX: { min: -90, max: -40 },
      speedY: { min: -10, max: 10 }, scale: { start: 2.5, end: 0.4 }, alpha: { start: 0.9, end: 0 }, lifespan: 900, frequency: 35, tint: [0xffffff, 0xbfe3f0] });
    this.world.add(this.wake);
  }

  // ---------- input della barca ----------
  holding() { return !this.block && (this.pointers.size > 0 || this.space); }

  // ---------- onde ----------
  nextWave() {
    const B = P.barca, i = this.waveIdx++;
    const light = i < B.lightWaves;
    let calm = Phaser.Math.Between(B.calmMs[0], B.calmMs[1]);
    if (this.doppia === 1) { calm = B.doppiaCalmMs; this.doppia = 0; }   // seconda delle due onde ravvicinate
    if (this.resumeCalm) { calm = B.resumeCalmMs; this.resumeCalm = false; }
    this.wave = { st: 'calm', t: 0, ms: calm, power: light ? B.lightPower : 1, warn: light ? B.warnMs[0] : B.warnMs[1] };
  }

  updateWave(dt) {
    const w = this.wave, B = P.barca;
    w.t += dt;
    if (w.t < w.ms) return;
    w.t -= w.ms;
    if (w.st === 'calm') { w.st = 'warn'; w.ms = w.warn; this.crest.setVisible(true).setX(W + 60); sfx.tone([330, 392], 0.08, 'triangle', 0.05); }
    else if (w.st === 'warn') {
      w.st = 'roll'; w.ms = B.rollMs; sfx.splash();
      const e = this.add.particles(B.lunghezza - 20, DECK_Y - 6, 'spark', { speed: { min: 80, max: 200 }, angle: { min: 200, max: 300 }, gravityY: 400,
        lifespan: 600, tint: [0xffffff, 0xbfe3f0], scale: 2, emitting: false });
      this.world.add(e); e.explode(24); this.time.delayedCall(700, () => e.destroy());
    } else {
      this.crest.setVisible(false);
      if (this.doppia === 2) this.doppia = 1;
      this.nextWave();
    }
  }

  wavePitch() {
    const w = this.wave, A = P.barca.pitch * (w ? (w.power === 1 ? 1 : 0.7) : 1);
    if (!w || this.phase !== 'walk') return 0;
    const k = Math.min(1, w.t / w.ms);
    if (w.st === 'warn') return -A * 0.75 * (k * k * (3 - 2 * k));            // la prua si alza
    if (w.st === 'roll') return -A * 0.75 * Math.cos(k * Math.PI * 3) * (1 - 0.7 * k);
    return Math.sin(this.elapsed / 700) * 0.5;
  }

  // Barra dell'onda (in alto): verde = vai tranquillo, gialla = sta arrivando, rossa piena = FERMO!
  drawGauge(st) {
    const g = this.gauge, x0 = 52, x1 = W - 56, y = 34, w = x1 - x0;
    g.clear();
    const show = this.phase === 'walk' && this.wave;
    this.gaugeLbl.setVisible(!!show);
    if (!show) return;
    const k = Math.min(1, this.wave.t / this.wave.ms);
    let f, col;
    if (st === 'calm') { f = 0.6 * k; col = 0x3a8a3a; }
    else if (st === 'warn') { f = 0.6 + 0.4 * k; col = Math.floor(this.elapsed / 90) % 2 ? 0xf4d03f : 0xf08a24; }
    else { f = 1; col = Math.floor(this.elapsed / 80) % 2 ? 0xff3b2e : 0xc0392b; }
    g.fillStyle(0x1a1423, 0.85).fillRect(x0 - 2, y - 5, w + 4, 10);
    g.fillStyle(col).fillRect(x0, y - 3, w * f, 6);
    if (st === 'roll') g.fillStyle(0xffffff, 0.5).fillRect(x0, y - 3, w * (1 - k), 2);   // quanto manca alla fine del rollio
    g.lineStyle(1, 0xffffff, 0.8).strokeRect(x0 - 2, y - 5, w + 4, 10);
    g.fillStyle(0xffffff).fillRect(x0 + w * 0.6, y - 5, 1, 10);   // da qui in poi l'onda sta arrivando
  }

  // ---------- ciclo ----------
  updateBoat(dt) {
    const B = P.barca, s = dt / 1000;
    this.elapsed += dt;
    if (this.phase === 'walk') {
      this.updateWave(dt);
      const target = this.ant.x, dx = target - this.aur.x;
      this.walking = this.holding() && Math.abs(dx) > B.reach;
      if (this.walking) {
        this.dir = Math.sign(dx);
        this.aur.x += this.dir * Math.min(Math.abs(dx) - B.reach + 0.01, B.walkSpeed * s);
      }
      // rollio + camminare = il Camparino trabocca
      if (this.walking && this.wave.st === 'roll') {
        this.camparino = Math.max(0, this.camparino - B.spillRate * this.wave.power * s);
        this.dropMs -= dt; if (this.dropMs <= 0) { this.dropMs = 90; this.spillDrop(); }
        if (this.camparino <= 0) { this.boatLost(); return; }
      }
      if (Math.abs(this.ant.x - this.aur.x) <= B.reach + 0.5) this.reached();
    } else this.walking = false;
    this.renderBoat(dt);
  }

  renderBoat(dt) {
    const B = P.barca;
    // inquadratura: segue Aurelio (o Antonio quando corre via)
    const fx = this.camFollow === 'antonio' ? this.ant.x : this.camFollow === 'both' ? (this.ant.x + this.aur.x) / 2 : this.aur.x;
    const tx = Phaser.Math.Clamp(fx - W / 2, -70, B.lunghezza - W + 30);   // si vede anche il mare dietro la poppa (scia)
    this.camX += (tx - this.camX) * Math.min(1, dt / 160);
    this.world.x = -this.camX - W / 2;
    const target = this.wavePitch();
    this.pitch += (target - this.pitch) * Math.min(1, dt / 90);
    this.rig.setAngle(this.pitch);
    this.seaBack.tilePositionX += dt * 0.05; this.seaFront.tilePositionX += dt * 0.09;
    this.island.x -= dt * 0.004; if (this.island.x < -80) this.island.x = W + 80;
    // cresta dell'onda che arriva verso la prua
    if (this.wave && this.crest.visible) {
      const bowX = B.lunghezza - this.camX;
      const k = this.wave.st === 'warn' ? this.wave.t / this.wave.ms : 1;
      this.crest.x = Phaser.Math.Linear(Math.max(W + 50, bowX + 120), Math.min(W - 10, bowX), k);
      this.crest.y = SEA_Y - 4 + Math.sin(this.elapsed / 120) * 2;
    }
    // segnale ONDA! (preavviso e rollio)
    const st = this.phase === 'walk' && this.wave ? this.wave.st : 'calm';
    this.ondaText.setAlpha(st === 'warn' ? 0.6 + 0.4 * Math.sin(this.elapsed / 70) : st === 'roll' ? 1 : 0)
      .setColor(st === 'roll' ? '#ff6b5b' : '#ffffff').setText(st === 'roll' ? 'FERMO!' : 'ONDA!');
    this.drawGauge(st);

    // Aurelio: cammina (dondola) o sta fermo a gambe piantate
    const a = this.aur;
    if (!this.seated) {
      a.setTexture('aurelio');
      a.y = DECK_Y - (this.walking ? Math.abs(Math.sin(this.elapsed / 110)) * 2 : 0);
      a.setAngle(this.walking ? Math.sin(this.elapsed / 110) * 4 : 0);
    }
    // Antonio balla (quando non è impegnato in una gag)
    if (this.antDance) {
      this.danceMs -= dt;
      if (this.danceMs <= 0) { this.danceMs = 320; this.frame = 3 - this.frame; this.ant.setTexture('antonio_ballo' + this.frame).setFlipX(this.frame === 2); }
      this.ant.y = DECK_Y - Math.abs(Math.sin(this.elapsed / 160)) * 3;
    }
    // braccio teso e bicchieri
    const g = this.gArms; g.clear();
    const side = this.dir || -1;
    let glass = null;
    if (this.glassAt) glass = this.glassAt;
    else if (!this.seated) {
      const sh = { x: a.x + side * 12, y: a.y - 26 };
      const hand = this.offer > 0 ? { x: a.x + side * (12 + 22 * this.offer), y: a.y - 30 } : { x: a.x + side * 15, y: a.y - 14 };
      if (this.offer > 0) { g.lineStyle(7, 0x1a1423).lineBetween(sh.x, sh.y, hand.x, hand.y); g.lineStyle(4, 0xeab38b).lineBetween(sh.x, sh.y, hand.x, hand.y); }
      glass = hand;
    }
    if (glass) this.drawGlass(g, glass.x, glass.y + 6, 10, 15, this.camparino, -this.pitch * 2 + (this.walking ? Math.sin(this.elapsed / 90) * 4 : 0));
    if (this.antReach) { const sh = { x: this.ant.x - 12, y: this.ant.y - 26 }; g.lineStyle(7, 0x1a1423).lineBetween(sh.x, sh.y, sh.x - 16 * this.antReach, sh.y - 4); g.lineStyle(4, 0xeab38b).lineBetween(sh.x, sh.y, sh.x - 16 * this.antReach, sh.y - 4); }
    // HUD: bicchiere grande, stesso livello e stessa inclinazione
    this.hudGlass.clear();
    const danger = st !== 'calm';
    this.drawGlass(this.hudGlass, W - 26, 70, 22, 34, this.camparino, -this.pitch * 3 + (this.walking ? Math.sin(this.elapsed / 90) * 5 : 0), danger && Math.floor(this.elapsed / 120) % 2 ? 0xff6b5b : 0xf4f1ea);
    // freccia verso Antonio quando è fuori dallo schermo
    const ax = this.ant.x - this.camX;
    if (this.phase === 'walk' && (ax < 6 || ax > W - 6)) {
      this.arrow.setText(ax < 6 ? '< ANTONIO' : 'ANTONIO >').setPosition(ax < 6 ? 42 : W - 42, DECK_Y - 92).setAlpha(0.6 + 0.4 * Math.sin(this.elapsed / 150));
    } else this.arrow.setAlpha(0);
    for (const [who, b] of Object.entries(this.bubbles)) this.placeBubble(who, b);
  }

  // bicchiere con il Camparino che si inclina (tilt in px di dislivello tra i bordi)
  drawGlass(g, cx, by, w, h, lvl, tilt, rim = 0xf4f1ea) {
    const x0 = cx - w / 2, x1 = cx + w / 2, top = by - h;
    g.fillStyle(0x1a1423).fillRect(x0 - 2, top - 1, w + 4, h + 3);
    g.fillStyle(0xbfe3f0, 0.55).fillRect(x0, top, w, h);
    const lh = (h - 2) * Math.max(0, lvl) / 100;
    if (lh > 0.3) {
      const t = Phaser.Math.Clamp(tilt, -lh, lh) * (w / 22);
      const yl = Math.max(top, by - 1 - lh + t), yr = Math.max(top, by - 1 - lh - t);
      g.fillStyle(0xc0182a).fillPoints([{ x: x0, y: by - 1 }, { x: x1, y: by - 1 }, { x: x1, y: yr }, { x: x0, y: yl }], true);
      g.fillStyle(0xe8505a).fillPoints([{ x: x0, y: yl }, { x: x1, y: yr }, { x: x1, y: yr + 1.5 }, { x: x0, y: yl + 1.5 }], true);
    }
    g.fillStyle(0xffffff, 0.9).fillRect(x0 + 1, top + 2, 1, h - 5);     // ghiaccio / riflesso
    if (lvl > 0) { g.fillStyle(0xffffff, 0.8).fillRect(cx - 1, by - 3 - Math.min(lh, h - 6), 3, 3); }
    g.fillStyle(0xf08a24).fillRect(x1 - 2, top - 3, 4, 3);              // fettina d'arancia
    g.lineStyle(1, rim).strokeRect(x0 - 1, top - 1, w + 2, h + 2);
  }

  spillDrop() {
    const a = this.aur, side = this.dir || -1;
    const d = this.add.rectangle(a.x + side * 15, a.y - 22, 2, 3, 0xc0182a);
    this.world.add(d);
    this.tweens.add({ targets: d, x: d.x + side * Phaser.Math.Between(4, 14), y: DECK_Y - 2, duration: 300, ease: 'Quad.in', onComplete: () => d.destroy() });
  }

  // ---------- fumetti (nel mondo, dentro lo schermo) ----------
  bubble(who, line, ms, color = '#ffffff', size = 8) {
    this.bubbles[who]?.destroy();
    const t = txt(this, 0, 0, line, size, color).setOrigin(0.5, 1);
    this.world.add(t);
    this.bubbles[who] = t; this.placeBubble(who, t);
    this.time.delayedCall(ms, () => { if (this.bubbles[who] === t) { t.destroy(); delete this.bubbles[who]; } });
  }
  placeBubble(who, t) {
    const o = { ant: this.ant, aur: this.aur, caiman: this.caiman }[who];
    const x = Phaser.Math.Clamp(o.x, this.camX + t.width / 2 + 6, this.camX + W - t.width / 2 - 6);
    t.setPosition(x, Math.max(DECK_Y - 120 + t.height, o.y - 58));
  }

  // ---------- le tre volte che Antonio si allontana ----------
  reached() {
    this.walking = false;
    this.gag++;
    if (this.gag === 1) this.gagMacarena();
    else if (this.gag === 2) this.gagSaintBarth();
    else if (this.gag === 3) this.gagPoppa();
    else this.deliver();
  }

  gagPhase() { this.phase = 'gag'; this.crest.setVisible(false); this.wave = null; }
  gagEnd() {
    this.phase = 'walk'; this.camFollow = 'aurelio';
    this.resumeCalm = true; this.nextWave();
  }

  // 1. LA MACARENA
  gagMacarena() {
    const B = P.barca;
    this.gagPhase(); this.camFollow = 'both';
    this.tweens.add({ targets: this, offer: 1, duration: 220 });
    this.time.delayedCall(300, () => {
      this.antDance = false;
      this.ant.setTexture('antonio_fianchi').setFlipX(false); sfx.pick();
      this.tweens.add({ targets: this.ant, y: DECK_Y - 10, duration: 140, yoyo: true });      // saltello
    });
    this.time.delayedCall(620, () => {
      this.ant.setTexture('antonio_retro');                                                  // quarto di giro: di spalle
      this.tweens.add({ targets: this.ant, x: B.macarenaX, duration: 1100, ease: 'Sine.inOut' });
      this.tweens.add({ targets: this.ant, y: DECK_Y - 6, duration: 140, yoyo: true, repeat: 3 });
    });
    this.time.delayedCall(1100, () => this.bubble('ant', P.balloLines[0], 1500, '#ff9ecb'));
    this.time.delayedCall(2300, () => { this.tweens.add({ targets: this, offer: 0, duration: 200 }); this.antDance = true; });
    this.time.delayedCall(2600, () => this.gagEnd());
  }

  // 2. IL SAINT BARTH
  gagSaintBarth() {
    const B = P.barca;
    this.gagPhase(); this.camFollow = 'both';
    this.antDance = false;
    this.ant.setTexture('antonio_fianchi').setFlipX(false).setY(DECK_Y);
    this.tweens.add({ targets: this, offer: 1, duration: 220 });
    this.antReach = 0;
    this.tweens.add({ targets: this, antReach: this.aur.x < this.ant.x ? 1 : -1, duration: 350, delay: 200 });
    this.time.delayedCall(800, () => {                                                       // vede Caiman
      this.antReach = 0;
      this.bubble('ant', '!', 500, '#f4d03f', 12);
      sfx.tone([880, 1175], 0.06, 'square', 0.05);
    });
    this.time.delayedCall(1250, () => {                                                      // corre da lui, passando accanto ad Aurelio
      this.camFollow = 'antonio';
      this.tweens.add({ targets: this.ant, x: B.caimanX - 36, duration: 900, ease: 'Sine.inOut' });
      this.tweens.add({ targets: this.ant, y: DECK_Y - 5, duration: 110, yoyo: true, repeat: 3 });
      this.tweens.add({ targets: this, offer: 0, duration: 200 });
    });
    this.time.delayedCall(2200, () => {
      this.bubble('ant', P.saintBarth, 2600, '#ffffff', 7);
      this.ant.setOrigin(0.5, 1);
      this.tweens.add({ targets: this.ant, angle: 12, duration: 300 });                     // si china a guardare il costume
    });
    this.time.delayedCall(4000, () => { this.camFollow = 'aurelio'; });
    this.time.delayedCall(4500, () => { this.doppia = 2; this.gagEnd(); });                 // due onde ravvicinate
  }

  // 3. IL RICHIAMO DI POPPA
  gagPoppa() {
    const B = P.barca;
    this.gagPhase(); this.camFollow = 'both';
    this.tweens.add({ targets: this, offer: 1, duration: 220 });
    this.tweens.add({ targets: this.ant, angle: 0, duration: 200 });
    this.time.delayedCall(350, () => this.tweens.add({ targets: this.ant, scaleX: 2.2, scaleY: 2.15, duration: 300, yoyo: true }));   // prende fiato
    this.time.delayedCall(1050, () => {                                                      // si volta e corre a poppa, in silenzio
      this.ant.setTexture('antonio_retro');
      this.camFollow = 'antonio';
      this.tweens.add({ targets: this, offer: 0, duration: 200 });
      this.tweens.add({ targets: this.ant, x: B.poppaX, duration: 1300, ease: 'Sine.inOut' });
      this.tweens.add({ targets: this.ant, y: DECK_Y - 5, duration: 110, yoyo: true, repeat: 5 });
    });
    this.time.delayedCall(2450, () => {                                                      // al parapetto, con la scia dietro
      this.ant.setTexture('antonio_ballo1').setFlipX(false);
      this.tweens.add({ targets: this.ant, y: DECK_Y - 8, duration: 150, yoyo: true });
      this.bubble('ant', P.hyyyha, 1800, '#ff9ecb', 12);
      sfx.sing();
    });
    this.time.delayedCall(3900, () => { this.ant.setTexture('antonio_retro'); this.camFollow = 'aurelio'; });
    this.time.delayedCall(4500, () => this.gagEnd());
  }

  // ---------- consegna automatica e finale ----------
  deliver() {
    const B = P.barca;
    this.phase = 'deliver'; this.wave = null; this.crest.setVisible(false); this.camFollow = 'both';
    this.finalLevel = this.camparino;                         // registra il livello al momento della consegna
    this.antDance = false;
    this.ant.setTexture('antonio_fianchi').setAngle(0).setY(DECK_Y);
    this.tweens.add({ targets: this, offer: 1, duration: 220 });
    this.time.delayedCall(400, () => {                        // il bicchiere passa ad Antonio
      const side = this.dir || -1;
      this.glassAt = { x: this.aur.x + side * 34, y: this.aur.y - 30 };
      this.tweens.add({ targets: this.glassAt, x: this.ant.x + 14, y: this.ant.y - 22, duration: 350 });
      this.tweens.add({ targets: this, offer: 0, duration: 250, delay: 150 });
      sfx.cin();
    });
    this.time.delayedCall(1000, () => { this.ant.setTexture('antonio_retro'); });          // guarda il mare
    this.time.delayedCall(1300, () => {                                                      // Aurelio si siede sul ponte
      this.seated = true; this.aur.setTexture('aurelio_seduto').setAngle(-4).setY(DECK_Y + 9);
    });
    this.time.delayedCall(2300, () => this.bubble('ant', P.karaoke, 2800, '#ffffff', 8));                // sempre guardando il mare
    this.time.delayedCall(5300, () => this.result(true));
  }

  boatLost() {
    this.phase = 'done'; this.walking = false; this.wave = null; this.crest.setVisible(false);
    sfx.over();
    this.loseReason = 'CAMPARINO FINITO';
    this.bubble('aur', 'NOOO...', 1400, '#ff6b5b');
    this.time.delayedCall(1600, () => this.result(false));
  }

  // Antonio in primo piano dice la sua (con un camparino in mano, se si vince)
  antonioSays(line, then, prop) {
    const g = this.add.container(0, 0).setDepth(30).setAlpha(0);
    g.add(this.add.rectangle(W / 2, 170, W - 20, 130, 0x1a1423, 0.92).setStrokeStyle(2, 0xf4d03f));
    g.add(this.add.image(W / 2, 140, 'antonio').setScale(3));
    if (prop) g.add(this.add.image(W / 2 + 34, 150, prop).setScale(2.5));
    g.add(txt(this, W / 2, 205, line, 11, '#ffffff'));
    this.tweens.add({ targets: g, alpha: 1, duration: 300 });
    this.time.delayedCall(2800, () => { g.destroy(); then(); });
  }

  result(win) {
    this.phase = 'result'; this.canLeave = false; this.win_ = win;
    this.block = true; this.pointers.clear(); this.space = false;   // il dito rimasto giù non attiva la schermata
    for (const b of Object.values(this.bubbles || {})) b.destroy(); this.bubbles = {};
    const g = this.add.container(0, 0).setDepth(50);
    g.add(this.add.rectangle(W / 2, H / 2, W - 30, 220, 0x1a1423, 0.95).setStrokeStyle(3, win ? 0x3a8a3a : 0xc0392b));
    if (win) {
      const B = P.barca, lvl = this.finalLevel;
      const voto = lvl >= B.impeccabile ? 'CAMPARINO\nIMPECCABILE' : lvl < B.goccio ? 'HAI SALVATO\nIL GHIACCIO' : 'CAMPARINO\nCONSEGNATO';
      g.add(txt(this, W / 2, H / 2 - 80, voto, 11, '#f4d03f'));
      const gl = this.add.graphics(); this.drawGlass(gl, W / 2, H / 2 - 14, 22, 34, lvl, 0); g.add(gl);
      g.add(txt(this, W / 2, H / 2 + 2, '+' + P.reward.points + ' PUNTI', 9, '#ffffff'));
      g.add(txt(this, W / 2, H / 2 + 40, 'DA ORA IN POI\nGLI SPRITZ SONO\nCAMPARINI. PER SEMPRE.', 7, '#bfe3f0'));
    } else {
      g.add(txt(this, W / 2, H / 2 - 76, this.loseReason || 'SGRADEVOLE', 11, '#ff6b5b'));
      if (this.loseReason === 'CAMPARINO FINITO') { const gl = this.add.graphics(); this.drawGlass(gl, W / 2, H / 2 - 14, 22, 34, 0, 0); g.add(gl); }
      else g.add(this.add.image(W / 2, H / 2 - 32, 'portafoglio').setScale(4));
      g.add(txt(this, W / 2, H / 2 + 24, 'IL CONTO LO PAGHI TU:\n-' + P.losePoints + ' PUNTI', 8, '#c8b49a'));
    }
    const go = txt(this, W / 2, H / 2 + 92, 'TOCCA PER CONTINUARE', 7, '#f08a24');
    g.add(go);
    this.tweens.add({ targets: go, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
    g.setAlpha(0).setY(30);
    this.tweens.add({ targets: g, alpha: 1, y: 0, duration: 250, ease: 'Back.out' });
    this.time.delayedCall(800, () => { this.canLeave = true; });
  }

  leave() {
    this.phase = 'left';
    if (this.standalone) { this.scene.start('Menu'); return; }
    this.scene.stop();
    this.scene.resume('Level', { mini: 'antonio', win: this.win_ });
  }

  floatText(x, y, s, color) {
    const t = txt(this, Phaser.Math.Clamp(x, 80, W - 80), y, s, 8, color).setDepth(25);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, delay: 500, duration: 900, onComplete: () => t.destroy() });
  }
}
