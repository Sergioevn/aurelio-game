// Mini-gioco di Lollo: LA NEBBIA
// Lollo fuma e la strada si riempie di fumo: si vede solo un cerchio attorno ad Aurelio.
// Un ladro ruba il telefono ad Aurelio e si nasconde nella nebbia: ogni tanto il telefono
// squilla (si vede dov'è il ladro) e poi lui passa di corsa vicino ad Aurelio. Bisogna placcarlo.
import { W, H, txt, PLAYER_Y, FOG_R } from '../util.js';
import { sfx } from '../sfx.js';
import { FRIENDS, OBSTACLES, NEBBIA as N } from '../data/characters.js';

export class MiniNebbia extends Phaser.Scene {
  constructor() { super('MiniNebbia'); }

  init(data) { this.standalone = !!data?.standalone; }

  create() {
    this.phase = 'intro'; this.elapsed = 0; this.stunMs = 0; this.sigaMs = 0;
    this.fogAlpha = 0; this.radius = N.luce; this.targetX = null;

    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'road');
    this.items = [];
    this.player = this.add.image(W / 2, PLAYER_Y, 'aurelio').setScale(2).setDepth(5);
    this.thief = this.add.image(W + 40, PLAYER_Y, 'ladro').setScale(2).setDepth(6);
    this.stars = this.add.container(0, 0).setDepth(7).setVisible(false);
    for (let i = 0; i < 3; i++) this.stars.add(this.add.image(0, 0, 'stella').setScale(1.5));

    // Nebbia: un rettangolo grigio con un "buco" di luce attorno ad Aurelio
    this.fog = this.add.image(W / 2, PLAYER_Y, 'nebbia').setDepth(15).setAlpha(0);

    // Lollo in alto che fuma (sopra la nebbia: è lui che la produce)
    this.lollo = this.add.container(W / 2, -50).setDepth(16);
    this.lollo.add(this.add.image(0, 0, 'lollo').setScale(3));
    this.lollo.add(this.add.image(16, 14, 'sigaretta').setScale(2));

    this.input.on('pointerdown', p => this.onDown(p));
    this.input.on('pointermove', p => { if (p.isDown && this.phase === 'caccia') this.targetX = p.x; });
    this.input.on('pointerup', () => { this.targetX = null; });
    this.keys = this.input.keyboard?.createCursorKeys();

    // HUD
    this.add.rectangle(W / 2, 12, W, 24, 0x1a1423, 0.75).setDepth(20);
    txt(this, 8, 12, 'LA NEBBIA', 8, '#f4d03f', 0).setOrigin(0, 0.5).setDepth(21);
    this.info = txt(this, W - 8, 12, '', 7, '#ffffff', 0).setOrigin(1, 0.5).setDepth(21);
    this.timeBar = this.add.rectangle(0, 25, W, 3, 0xf08a24).setOrigin(0, 0.5).setDepth(21);

    this.intro();
  }

  intro() {
    const f = FRIENDS.lollo;
    const g = this.add.container(0, 0).setDepth(40);
    g.add(this.add.rectangle(W / 2, H / 2, W - 30, 230, 0x1a1423, 0.95).setStrokeStyle(3, 0xf4d03f));
    g.add(this.add.image(W / 2, H / 2 - 62, 'lollo').setScale(4));
    g.add(this.add.image(W / 2 + 22, H / 2 - 44, 'sigaretta').setScale(2.5));
    g.add(txt(this, W / 2, H / 2 - 2, f.name, 14, '#f4d03f'));
    g.add(txt(this, W / 2, H / 2 + 24, '"' + f.line + '"', 8, '#ffffff'));
    g.add(txt(this, W / 2, H / 2 + 52, 'NELLA NEBBIA SI VEDE\nPOCO... OCCHIO!', 7, '#bfe3f0'));
    const go = txt(this, W / 2, H / 2 + 86, 'TOCCA PER PARTIRE', 7, '#f08a24');
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
      this.steal();
      return;
    }
    if (this.phase === 'caccia') { this.targetX = p.x; return; }
    if (this.phase === 'result' && this.canLeave) this.leave();
  }

  // ---------- il furto (scena automatica) ----------
  steal() {
    this.phase = 'furto';
    // Lollo arriva e comincia a fumare: la nebbia sale
    this.tweens.add({ targets: this.lollo, y: 62, duration: 700, ease: 'Back.out' });
    this.tweens.add({ targets: this, fogAlpha: 0.97, duration: 1600, delay: 300 });
    // il ladro arriva di corsa, prende il telefono e scappa nella nebbia
    const t = this.thief;
    t.setPosition(W + 30, PLAYER_Y - 10);
    this.tweens.add({ targets: t, x: this.player.x + 16, duration: 700, delay: 900, ease: 'Quad.in', onComplete: () => {
      sfx.hit(); this.cameras.main.shake(120, 0.008);
      const ph = this.add.image(this.player.x + 10, this.player.y - 6, 'telefono').setScale(2).setDepth(7);
      this.tweens.add({ targets: ph, x: t.x, y: t.y - 10, duration: 200, onComplete: () => ph.destroy() });
      this.floatText(this.player.x, this.player.y - 46, N.stealLine, '#ffffff');
      this.tweens.add({ targets: t, x: 60, y: 120, duration: 700, delay: 150, ease: 'Quad.out', onComplete: () => this.startHunt() });
    } });
  }

  startHunt() {
    this.phase = 'caccia'; this.elapsed = 0;
    this.spawnMs = 1200; this.ringMs = 1500; this.windMs = N.ventoEvery;
    this.th = { state: 'lurk', ms: 1500, tx: Phaser.Math.Between(40, W - 40), ty: Phaser.Math.Between(80, 200) };
    const hint = txt(this, W / 2, PLAYER_Y - 80, 'QUANDO SQUILLA IL TELEFONO\nIL LADRO STA PER PASSARE!\nPLACCALO!', 7, '#ffffff').setDepth(25);
    this.tweens.add({ targets: hint, alpha: 0, delay: 2600, duration: 400, onComplete: () => hint.destroy() });
  }

  update(t, dt) {
    if (this.phase !== 'intro' && this.phase !== 'result') this.bg.tilePositionY -= 90 * dt / 1000;
    if (this.phase === 'caccia') this.updateHunt(dt);
    if (this.lollo.y > 0 && !this.lolloStill) this.lollo.x = W / 2 + Math.sin(this.time.now / 900) * 70;
    this.drawFog();
  }

  drawFog() {
    this.fog.setAlpha(this.fogAlpha).setPosition(this.player.x, this.player.y).setScale(this.radius / FOG_R);
  }

  updateHunt(dt) {
    const s = dt / 1000;
    this.elapsed += dt;
    const p = this.player;

    // Movimento di Aurelio
    if (this.stunMs > 0) {
      this.stunMs -= dt;
      this.stars.setVisible(true).setPosition(p.x, p.y - 26);
      this.stars.getAll().forEach((st, i) => { const a = this.elapsed / 150 + i * 2.1; st.setPosition(Math.cos(a) * 14, Math.sin(a) * 4); });
    } else {
      this.stars.setVisible(false);
      const step = 230 * s;
      if (this.keys?.left.isDown) p.x -= step;
      else if (this.keys?.right.isDown) p.x += step;
      else if (this.targetX !== null) { const dx = this.targetX - p.x; p.x += Math.sign(dx) * Math.min(Math.abs(dx), step); }
      p.x = Phaser.Math.Clamp(p.x, 34, W - 34);
      p.y = PLAYER_Y + Math.abs(Math.sin(this.elapsed / 120)) * 2;
    }

    // Raggio di visibilità (si stringe se ti prende un anello di fumo)
    if (this.sigaMs > 0) this.sigaMs -= dt;
    const want = this.sigaMs > 0 ? N.luceSiga : N.luce;
    this.radius += (want - this.radius) * Math.min(1, s * 6);

    // Folata di vento: il fumo si dirada per un attimo
    this.windMs -= dt;
    if (this.windMs <= 0) {
      this.windMs = N.ventoEvery + Phaser.Math.Between(-1000, 1000);
      sfx.wind();
      const w = txt(this, W / 2, 60, '~ VENTO ~', 9, '#ffffff').setDepth(25);
      this.tweens.add({ targets: w, alpha: 0, delay: 900, duration: 300, onComplete: () => w.destroy() });
      this.tweens.add({ targets: this, fogAlpha: 0.15, duration: 250, yoyo: true, hold: 900 });
    }

    this.updateThief(dt);

    // Ostacoli nascosti nella nebbia + anelli di fumo di Lollo
    this.spawnMs -= dt;
    if (this.spawnMs <= 0) {
      this.spawnMs = Phaser.Math.Between(700, 1100);
      const kind = Math.random() < 0.35 ? 'anello' : (Math.random() < 0.5 ? 'pizza' : 'roccia');
      const x = kind === 'anello' ? this.lollo.x + Phaser.Math.Between(-20, 20) : Phaser.Math.Between(40, W - 40);
      const o = this.add.image(x, kind === 'anello' ? this.lollo.y + 30 : -20, kind).setScale(2).setDepth(kind === 'anello' ? 17 : 4);
      o.kind = kind; o.vx = kind === 'anello' ? (p.x - x) * 0.25 : 0;
      this.items.push(o);
    }
    const stink = Math.floor(this.elapsed / 260) % 2 ? 'pizza_b' : 'pizza';
    for (const o of this.items) {
      o.y += (o.kind === 'anello' ? 150 : 90) * s; o.x += o.vx * s;
      if (o.kind === 'pizza' && o.texture.key !== stink) o.setTexture(stink);
      if (o.kind === 'anello') o.setScale(2 + Math.sin(this.elapsed / 150) * 0.2).setAlpha(0.85);
      if (!o.hit && Math.abs(o.x - p.x) < 20 && Math.abs(o.y - p.y) < 22) {
        o.hit = true; o.setVisible(false);
        if (o.kind === 'anello') { this.sigaMs = N.sigaMs; this.floatText(p.x, p.y - 44, 'SIGA!', '#c8b49a'); sfx.hit(); }
        else if (this.stunMs <= 0) {
          this.stunMs = 900; sfx.hit(); this.cameras.main.shake(120, 0.01);
          this.floatText(p.x, p.y - 44, OBSTACLES[o.kind].label, '#ff6b5b');
        }
      }
    }
    this.items = this.items.filter(o => { if (o.y > H + 30 || o.hit) { o.destroy(); return false; } return true; });

    // Tempo
    const left = Math.max(0, N.durataMs - this.elapsed);
    this.info.setText(Math.ceil(left / 1000) + ' S');
    this.timeBar.width = W * left / N.durataMs;
    if (left <= 0) this.lose();
  }

  // Il ladro si nasconde in alto; quando il telefono squilla sta per scendere
  // e passa di corsa nella fila di Aurelio. Se si avvicina troppo, a volte cambia direzione.
  updateThief(dt) {
    const s = dt / 1000, t = this.thief, th = this.th, p = this.player;
    th.ms -= dt;
    const moveTo = (x, y, sp) => {
      const dx = x - t.x, dy = y - t.y, d = Math.hypot(dx, dy);
      if (d < 2) return true;
      const k = Math.min(1, sp * s / d); t.x += dx * k; t.y += dy * k; t.setFlipX(dx < 0);
      return false;
    };
    if (th.state === 'lurk') {
      if (moveTo(th.tx, th.ty, 120)) { th.tx = Phaser.Math.Between(40, W - 40); th.ty = Phaser.Math.Between(80, 200); }
      if (th.ms <= 0) {
        th.state = 'ring'; th.ms = 900; sfx.ring();
        // il telefono squilla: si vede (sopra la nebbia) da dove partirà
        const icon = this.add.image(t.x, t.y - 26, 'telefono').setScale(2.5).setDepth(18);
        const dr = txt(this, t.x, t.y - 46, 'DRIIN!', 7, '#f4d03f').setDepth(18);
        this.tweens.add({ targets: icon, angle: { from: -15, to: 15 }, duration: 70, yoyo: true, repeat: 6 });
        this.tweens.add({ targets: [icon, dr], alpha: 0, delay: 800, duration: 250, onComplete: () => { icon.destroy(); dr.destroy(); } });
      }
    } else if (th.state === 'ring') {
      if (th.ms <= 0) {
        th.state = 'down';
        // non atterra mai addosso ad Aurelio
        if (Math.abs(t.x - p.x) < 50) t.x = Phaser.Math.Clamp(p.x + (t.x < p.x ? -55 : 55), 25, W - 25);
        th.dir = Math.random() < 0.5 ? 1 : -1;
        if (t.x + th.dir * 60 < 25 || t.x + th.dir * 60 > W - 25) th.dir *= -1;
        th.endX = Phaser.Math.Clamp(t.x + th.dir * Phaser.Math.Between(120, 190), 25, W - 25);
        th.turned = false;
      }
    } else if (th.state === 'down') {
      if (moveTo(t.x, PLAYER_Y, 260)) th.state = 'run';
    } else if (th.state === 'run') {
      // passa di corsa nella fila di Aurelio
      // se si trova Aurelio davanti, gira e scappa dall'altra parte (una volta sola)
      const ahead = (p.x - t.x) * th.dir;
      if (!th.turned && ahead > 0 && ahead < 60) {
        th.turned = true; th.dir *= -1;
        th.endX = Phaser.Math.Clamp(t.x + th.dir * 140, 25, W - 25);
      }
      t.y = PLAYER_Y + Math.sin(this.elapsed / 60) * 2;
      if (moveTo(th.endX, PLAYER_Y, N.ladroSpeed)) { th.state = 'up'; th.tx = Phaser.Math.Between(40, W - 40); th.ty = Phaser.Math.Between(80, 180); }
    } else if (th.state === 'up') {
      if (moveTo(th.tx, th.ty, 240)) { th.state = 'lurk'; th.ms = Phaser.Math.Between(1500, 2600); }
    }

    // Placcaggio!
    if (this.stunMs <= 0 && Math.abs(t.x - p.x) < 22 && Math.abs(t.y - p.y) < 24) this.win();
  }

  win() {
    this.phase = 'done'; sfx.win();
    this.stars.setVisible(false);
    const t = this.thief;
    this.cameras.main.shake(200, 0.015);
    this.floatText(t.x, t.y - 40, 'PRESO!', '#f4d03f');
    // il telefono torna ad Aurelio, il ladro scappa, il fumo si dirada
    const ph = this.add.image(t.x, t.y, 'telefono').setScale(2.5).setDepth(19);
    this.tweens.add({ targets: ph, x: this.player.x, y: this.player.y - 40, duration: 500, ease: 'Back.out' });
    this.tweens.add({ targets: t, x: t.x < W / 2 ? -40 : W + 40, angle: 720, duration: 800, ease: 'Quad.in' });
    this.tweens.add({ targets: this, fogAlpha: 0, duration: 800 });
    this.items.forEach(o => o.destroy()); this.items = [];
    this.time.delayedCall(900, () => this.lolloSays(FRIENDS.lollo.winLine, () => this.result(true)));
  }

  lose() {
    this.phase = 'done'; sfx.over();
    this.stars.setVisible(false);
    this.items.forEach(o => o.destroy()); this.items = [];
    const t = this.thief;
    t.setPosition(this.player.x + 60, PLAYER_Y - 60);
    this.tweens.add({ targets: this, fogAlpha: 0.5, duration: 500 });
    this.floatText(W / 2, PLAYER_Y - 90, 'IL LADRO È SPARITO...', '#ff6b5b');
    this.tweens.add({ targets: t, y: -40, duration: 900, delay: 300 });
    this.time.delayedCall(1300, () => this.lolloSays(FRIENDS.lollo.loseLine, () => this.result(false)));
  }

  // Lollo scende al centro con la sigaretta e dice la sua
  lolloSays(line, then) {
    this.lolloStill = true;
    this.tweens.add({ targets: this.lollo, x: W / 2, y: 110, duration: 500, ease: 'Back.out' });
    const box = this.add.rectangle(W / 2, 190, W - 20, 64, 0x1a1423, 0.92).setStrokeStyle(2, 0xf4d03f).setDepth(30).setAlpha(0);
    const tx = txt(this, W / 2, 190, line, 9, '#ffffff').setDepth(31).setAlpha(0);
    this.tweens.add({ targets: [box, tx], alpha: 1, delay: 500, duration: 300 });
    // sbuffi di fumo
    const e = this.add.particles(0, 0, 'spark', { follow: this.lollo, followOffset: { x: 30, y: 10 }, speedY: { min: -40, max: -20 }, speedX: { min: -10, max: 10 },
      scale: { start: 2, end: 5 }, alpha: { start: 0.6, end: 0 }, tint: 0xc8c8cc, lifespan: 1200, frequency: 160 }).setDepth(17);
    this.time.delayedCall(3200, () => { box.destroy(); tx.destroy(); e.destroy(); then(); });
  }

  result(win) {
    this.phase = 'result'; this.canLeave = false; this.win_ = win;
    const R = N.reward;
    const g = this.add.container(0, 0).setDepth(50);
    g.add(this.add.rectangle(W / 2, H / 2, W - 30, 220, 0x1a1423, 0.95).setStrokeStyle(3, win ? 0x3a8a3a : 0xc0392b));
    if (win) {
      g.add(txt(this, W / 2, H / 2 - 74, 'RECUPERATO!', 14, '#f4d03f'));
      g.add(this.add.image(W / 2, H / 2 - 40, 'telefono').setScale(3));
      g.add(txt(this, W / 2, H / 2 - 6, '+' + R.points + ' PUNTI', 9, '#ffffff'));
      g.add(this.add.image(W / 2, H / 2 + 26, 'ventilatore').setScale(2));
      g.add(txt(this, W / 2, H / 2 + 56, 'VENTILATORE! SOFFIA VIA\nPIZZE, ROCCE E ASINI', 7, '#bfe3f0'));
    } else {
      g.add(txt(this, W / 2, H / 2 - 74, 'NIENTE TELEFONO', 11, '#ff6b5b'));
      g.add(this.add.image(W / 2, H / 2 - 30, 'ladro').setScale(3));
      g.add(txt(this, W / 2, H / 2 + 30, 'TORNI NEL LIVELLO\nCON LA NEBBIA', 8, '#c8b49a'));
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
    this.scene.resume('Level', { mini: 'lollo', win: this.win_ });
  }

  floatText(x, y, s, color) {
    const t = txt(this, Phaser.Math.Clamp(x, 80, W - 80), y, s, 8, color).setDepth(25);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, delay: 500, duration: 900, onComplete: () => t.destroy() });
  }
}
