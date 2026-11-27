// Mini-gioco di Antonio: IL PORTAFOGLIO
// Fase 1 (shopping): dall'alto cadono cavolate (orologi, sigari, occhiali, offerte lampo).
// Antonio corre a comprarle: Aurelio deve arrivarci prima di lui. Ogni acquisto svuota il portafoglio.
// Se a fine tempo ci sono ancora soldi... si va in barca.
// Fase 2 (barca): Aurelio, col cappello da capitano, guida la barca tra le onde passando nei varchi.
// Sul retro Antonio balla la Macarena. 3 onde prese = affondati.
import { W, H, txt, PLAYER_Y } from '../util.js';
import { sfx } from '../sfx.js';
import { FRIENDS, PORTAFOGLIO as P } from '../data/characters.js';

const BOAT_Y = PLAYER_Y - 20;

export class MiniPortafoglio extends Phaser.Scene {
  constructor() { super('MiniPortafoglio'); }

  init(data) { this.standalone = !!data?.standalone; this.startBarca = !!data?.barca; }

  create() {
    this.phase = 'intro'; this.elapsed = 0; this.targetX = null;
    this.soldi = P.soldi; this.items = []; this.rows = [];

    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'road');
    this.player = this.add.image(W / 2 - 50, PLAYER_Y, 'aurelio').setScale(2).setDepth(5);
    this.antonio = this.add.image(W / 2 + 50, PLAYER_Y - 2, 'antonio_ballo1').setScale(2).setDepth(4);

    this.input.on('pointerdown', p => this.onDown(p));
    this.input.on('pointermove', p => { if (p.isDown) this.targetX = p.x; });
    this.input.on('pointerup', () => { this.targetX = null; });
    this.keys = this.input.keyboard?.createCursorKeys();

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
    g.add(txt(this, W / 2, H / 2 + 52, this.startBarca ? 'EVITA LE ONDE:\nPASSA NEI VARCHI!' : 'PRENDI LE CAVOLATE\nPRIMA DI LUI, O SPENDE\nTUTTI I SOLDI!', 7, '#bfe3f0'));
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
      this.introBox.destroy();
      if (this.startBarca) this.startBoat(); else this.startShop();
      return;
    }
    if (this.phase === 'result' && this.canLeave) { this.leave(); return; }
    this.targetX = p.x;
  }

  update(t, dt) {
    if (this.phase === 'shop') this.updateShop(dt);
    else if (this.phase === 'barca') this.updateBoat(dt);
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
      if (kind === 'offerta') this.floatText(o.x, 60, 'OFFERTA LAMPO!', '#f4d03f');
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

  antonioSay(line) {
    if (this.bubble) this.bubble.destroy();
    const b = txt(this, Phaser.Math.Clamp(this.antonio.x, 60, W - 60), this.antonio.y - 46, line, 7, '#ff9ecb').setDepth(22);
    this.bubble = b;
    this.tweens.add({ targets: b, y: b.y - 10, alpha: 0, delay: 700, duration: 400, onComplete: () => { b.destroy(); if (this.bubble === b) this.bubble = null; } });
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

  // ================= FASE 2: IN BARCA =================
  startBoat() {
    this.phase = 'barca'; this.elapsed = 0; this.hits = 0; this.hurtMs = 0;
    this.rowMs = 900; this.danceMs = 0; this.shoutMs = 1200; this.shoutIdx = 0; this.frame = 1;
    this.lastGap = W / 2;
    this.bg.setTexture('mare');
    this.player.setVisible(false); this.antonio.setVisible(false);
    this.title.setText('IN BARCA'); this.walletIcon.setVisible(false); this.info.setText('');

    this.boat = this.add.container(W / 2, BOAT_Y).setDepth(6);
    this.boat.add(this.add.image(0, 0, 'barca').setScale(1.8));
    this.capitano = this.add.image(0, -22, 'aurelio_capitano').setScale(1.3);
    this.ballo = this.add.image(0, 22, 'antonio_ballo1').setScale(1.2);
    this.boat.add([this.ballo, this.capitano]);
    // scia dietro la barca
    this.wake = this.add.particles(0, 0, 'spark', {
      follow: this.boat, followOffset: { x: 0, y: 46 }, speedY: { min: 60, max: 120 }, speedX: { min: -30, max: 30 },
      scale: { start: 2, end: 0.5 }, alpha: { start: 0.8, end: 0 }, lifespan: 500, frequency: 40 }).setDepth(5);

    // salvagenti in alto: le "vite" della barca
    this.lifeIcons = [];
    for (let i = 0; i < P.maxOnde; i++) this.lifeIcons.push(this.add.image(W - 14 - i * 16, 12, 'salvagente').setScale(1.4).setDepth(21));

    const hint = txt(this, W / 2, BOAT_Y - 100, 'PASSA NEI VARCHI\nTRA LE ONDE!', 8, '#ffffff').setDepth(25);
    this.tweens.add({ targets: hint, alpha: 0, delay: 2000, duration: 400, onComplete: () => hint.destroy() });
  }

  updateBoat(dt) {
    const s = dt / 1000;
    this.elapsed += dt;
    const k = Math.min(1, this.elapsed / P.barcaMs);
    const sea = P.seaStart + (P.seaEnd - P.seaStart) * k;
    this.bg.tilePositionY -= sea * s;

    const b = this.boat;
    const prevX = b.x;
    this.movePlayer(b, dt, 210, 22, W - 22);
    const tilt = Phaser.Math.Clamp((b.x - prevX) / Math.max(s, 0.001) / 25, -12, 12);
    if (!this.rocking) b.setAngle(b.angle + (tilt - b.angle) * Math.min(1, s * 8));

    // Antonio balla la Macarena sul retro
    this.danceMs -= dt;
    if (this.danceMs <= 0) {
      this.danceMs = 320; this.frame = 3 - this.frame;
      this.ballo.setTexture('antonio_ballo' + this.frame);
      this.ballo.setFlipX(Math.floor(this.elapsed / 640) % 2 === 0);
    }
    this.ballo.x = Math.sin(this.elapsed / 160) * 2;
    this.shoutMs -= dt;
    if (this.shoutMs <= 0) { this.shoutMs = Phaser.Math.Between(2000, 2800); this.shout(P.balloLines[this.shoutIdx++ % P.balloLines.length]); }

    // File di onde con un varco
    this.rowMs -= dt;
    if (this.rowMs <= 0 && this.elapsed < P.barcaMs - 1800) { this.rowMs = P.ondaEvery; this.spawnRow(k); }

    if (this.hurtMs > 0) { this.hurtMs -= dt; b.setAlpha(Math.floor(this.hurtMs / 80) % 2 ? 0.4 : 1); } else b.setAlpha(1);

    for (const r of this.rows) {
      r.y += sea * s;
      r.imgs.forEach((im, i) => { im.y = r.y + Math.sin(this.elapsed / 180 + i) * 2; });
      if (!r.checked && r.y > BOAT_Y - 44 && r.y < BOAT_Y + 40) {
        if (b.x - 14 < r.freeL || b.x + 14 > r.freeR) { r.checked = true; this.boatHit(); }
      }
      if (r.y > BOAT_Y + 40) r.checked = true;
      if (r.y > H + 20) { r.imgs.forEach(im => im.destroy()); r.dead = true; }
    }
    this.rows = this.rows.filter(r => !r.dead);
    if (this.phase !== 'barca') return;

    const left = Math.max(0, P.barcaMs - this.elapsed);
    this.timeBar.width = W * left / P.barcaMs;
    if (left <= 0) this.boatWin();
  }

  spawnRow(k) {
    const gap = P.gapStart + (P.gapEnd - P.gapStart) * k;
    const half = gap / 2;
    const gx = Phaser.Math.Clamp(this.lastGap + Phaser.Math.Between(-85, 85), half + 6, W - half - 6);
    this.lastGap = gx;
    const row = { y: -10, imgs: [], freeL: 0, freeR: W };
    // onde larghe 40 px, una attaccata all'altra; il varco resta libero
    const L = gx - half, R = gx + half;
    for (let x = L; x > -20; x -= 36) { row.imgs.push(this.add.image(x - 20, -10, 'onda').setScale(1, 1.7).setDepth(4)); }
    for (let x = R; x < W + 20; x += 36) { row.imgs.push(this.add.image(x + 20, -10, 'onda').setScale(1, 1.7).setDepth(4)); }
    row.freeL = L; row.freeR = R;
    this.rows.push(row);
  }

  boatHit() {
    if (this.hurtMs > 0) return;
    this.hits++; this.hurtMs = 900; sfx.splash();
    this.cameras.main.shake(150, 0.012);
    this.lifeIcons[this.hits - 1]?.setTint(0x333333).setAlpha(0.6);
    const e = this.add.particles(this.boat.x, this.boat.y - 30, 'spark', { speed: { min: 60, max: 180 }, angle: { min: 200, max: 340 },
      gravityY: 300, lifespan: 600, quantity: 18, tint: [0xffffff, 0xbfe3f0], scale: 2, emitting: false }).setDepth(7);
    e.explode(18); this.time.delayedCall(700, () => e.destroy());
    this.rocking = true;
    this.tweens.add({ targets: this.boat, angle: { from: -18, to: 18 }, duration: 120, yoyo: true, repeat: 2, onComplete: () => { this.rocking = false; } });
    this.tweens.add({ targets: this.ballo, y: 2, duration: 200, yoyo: true, ease: 'Quad.out' }); // Antonio salta
    this.floatText(this.boat.x, this.boat.y - 60, 'SPLASH!', '#bfe3f0');
    if (this.hits >= P.maxOnde) this.boatLost();
  }

  shout(line) {
    const t = txt(this, Phaser.Math.Clamp(this.boat.x, 70, W - 70), this.boat.y + 60, line, 8, '#ff9ecb').setDepth(22);
    this.tweens.add({ targets: t, y: t.y + 12, alpha: 0, delay: 800, duration: 400, onComplete: () => t.destroy() });
  }

  stopBoat() {
    this.wake?.stop();
    this.rows.forEach(r => this.tweens.add({ targets: r.imgs, alpha: 0, duration: 300 }));
  }

  boatLost() {
    this.phase = 'done'; sfx.over(); this.stopBoat();
    this.loseReason = 'AFFONDATI!';
    this.tweens.add({ targets: this.boat, y: BOAT_Y + 20, alpha: 0.4, angle: 40, duration: 1200 });
    this.floatText(W / 2, BOAT_Y - 100, 'AFFONDATI!', '#ff6b5b');
    this.time.delayedCall(1400, () => this.antonioSays(FRIENDS.antonio.loseLine, () => this.result(false)));
  }

  boatWin() {
    this.phase = 'done'; sfx.win(); this.stopBoat();
    this.floatText(W / 2, BOAT_Y - 100, 'TERRA!', '#f4d03f');
    this.tweens.add({ targets: this.boat, angle: 0, x: W / 2, duration: 500 });
    this.time.delayedCall(1000, () => this.antonioSays(FRIENDS.antonio.winLine, () => this.result(true), 'camparino'));
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
    const g = this.add.container(0, 0).setDepth(50);
    g.add(this.add.rectangle(W / 2, H / 2, W - 30, 220, 0x1a1423, 0.95).setStrokeStyle(3, win ? 0x3a8a3a : 0xc0392b));
    if (win) {
      g.add(txt(this, W / 2, H / 2 - 76, 'CAMPARINO!', 14, '#f4d03f'));
      g.add(this.add.image(W / 2, H / 2 - 38, 'camparino').setScale(3));
      g.add(txt(this, W / 2, H / 2 + 2, '+' + P.reward.points + ' PUNTI', 9, '#ffffff'));
      g.add(txt(this, W / 2, H / 2 + 40, 'DA ORA IN POI\nGLI SPRITZ SONO\nCAMPARINI. PER SEMPRE.', 7, '#bfe3f0'));
    } else {
      g.add(txt(this, W / 2, H / 2 - 76, this.loseReason || 'SGRADEVOLE', 11, '#ff6b5b'));
      g.add(this.add.image(W / 2, H / 2 - 32, 'portafoglio').setScale(4));
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
