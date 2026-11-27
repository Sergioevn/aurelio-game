// Mini-gioco di Lollo: LA NEBBIA
// Un ladro ruba il telefono ad Aurelio e sparisce. Lollo, in alto, fuma: al primo sbuffo
// la strada si riempie di fumo e si vede solo un cerchio attorno ad Aurelio.
// Ogni tanto il telefono squilla: sta per ricomparire da quelle parti.
// Bisogna raggiungerlo prima che sparisca di nuovo. Cadono birre e sigarette accese.
import { W, H, txt, PLAYER_Y, FOG_R } from '../util.js';
import { sfx } from '../sfx.js';
import { FRIENDS, NEBBIA as N } from '../data/characters.js';

export class MiniNebbia extends Phaser.Scene {
  constructor() { super('MiniNebbia'); }

  init(data) { this.standalone = !!data?.standalone; }

  create() {
    this.phase = 'intro'; this.elapsed = 0; this.stunMs = 0; this.sigaMs = 0;
    this.fogAlpha = 0; this.radius = N.luce; this.targetX = null; this.lolloStill = false;

    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'road');
    this.items = [];
    this.player = this.add.image(W / 2, PLAYER_Y, 'aurelio').setScale(2).setDepth(5);
    this.thief = this.add.image(W + 40, PLAYER_Y, 'ladro').setScale(2).setDepth(6);
    this.stars = this.add.container(0, 0).setDepth(7).setVisible(false);
    for (let i = 0; i < 3; i++) this.stars.add(this.add.image(0, 0, 'stella').setScale(1.5));

    // Nebbia attorno ad Aurelio + "tenda" di fumo che scende da Lollo al primo sbuffo
    this.fog = this.add.image(W / 2, PLAYER_Y, 'nebbia').setDepth(15).setAlpha(0);
    this.curtain = this.add.image(W / 2, 0, 'nebbia_tenda').setOrigin(0.5, 1).setDepth(15).setVisible(false);

    // Lollo in alto che fuma (sopra la nebbia: è lui che la produce)
    this.lollo = this.add.container(W / 2, -50).setDepth(16);
    this.lollo.add(this.add.image(0, 0, 'lollo').setScale(3));
    this.cig = this.add.image(18, 14, 'sigaretta').setScale(2);
    this.lollo.add(this.cig);
    // fumo continuo dalla sigaretta di Lollo: scende verso la strada
    this.smoke = this.add.particles(0, 0, 'spark', {
      follow: this.lollo, followOffset: { x: 28, y: 16 },
      speedY: { min: 20, max: 55 }, speedX: { min: -25, max: 25 },
      scale: { start: 2, end: 9 }, alpha: { start: 0.55, end: 0 }, tint: 0xb4b6bc,
      lifespan: 1600, frequency: 90, emitting: false }).setDepth(16);

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
    g.add(this.add.image(W / 2 + 24, H / 2 - 44, 'sigaretta').setScale(2.5));
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

  // ---------- il furto (scena automatica, ancora senza nebbia) ----------
  steal() {
    this.phase = 'furto';
    this.tweens.add({ targets: this.lollo, y: 62, duration: 700, ease: 'Back.out' });
    const t = this.thief;
    t.setPosition(W + 30, PLAYER_Y - 10);
    this.tweens.add({ targets: t, x: this.player.x + 16, duration: 700, delay: 800, ease: 'Quad.in', onComplete: () => {
      sfx.hit(); this.cameras.main.shake(120, 0.008);
      const ph = this.add.image(this.player.x + 10, this.player.y - 6, 'telefono').setScale(2).setDepth(7);
      this.tweens.add({ targets: ph, x: t.x, y: t.y - 10, duration: 200, onComplete: () => ph.destroy() });
      this.floatText(this.player.x, this.player.y - 46, N.stealLine, '#ffffff');
      // il ladro scappa e sparisce
      this.tweens.add({ targets: t, x: -40, y: PLAYER_Y - 140, duration: 900, delay: 150, ease: 'Quad.in', onComplete: () => {
        t.setVisible(false);
        this.lolloSay(Phaser.Utils.Array.GetRandom(N.insults));
        this.time.delayedCall(700, () => this.firstPuff());
      } });
    } });
  }

  // Il primo sbuffo di Lollo: la nebbia scende da lui e copre la strada
  firstPuff() {
    sfx.wind();
    const burst = this.add.particles(this.lollo.x + 28, this.lollo.y + 16, 'spark', {
      speedY: { min: 60, max: 200 }, speedX: { min: -120, max: 120 }, scale: { start: 4, end: 16 },
      alpha: { start: 0.7, end: 0 }, tint: 0xb4b6bc, lifespan: 1400, quantity: 40, emitting: false }).setDepth(16);
    burst.explode(40);
    this.time.delayedCall(1600, () => burst.destroy());
    this.smoke.start();
    this.curtain.setVisible(true).setPosition(W / 2, this.lollo.y + 20).setAlpha(0.97);
    this.tweens.add({ targets: this.curtain, y: PLAYER_Y - 20, duration: 1300, ease: 'Sine.in', onComplete: () => {
      this.tweens.add({ targets: this, fogAlpha: 0.97, duration: 300 });
      this.tweens.add({ targets: this.curtain, alpha: 0, duration: 400, onComplete: () => this.curtain.setVisible(false) });
      this.startHunt();
    } });
  }

  startHunt() {
    this.phase = 'caccia'; this.elapsed = 0;
    this.spawnMs = 900; this.windMs = N.ventoEvery; this.insultMs = 3500;
    this.ph = { state: 'wait', ms: 1600 };
    this.grabs = 0; this.updateGrabs();
    const hint = txt(this, W / 2, PLAYER_Y - 80, 'QUANDO SQUILLA, IL TELEFONO\nRICOMPARE DA QUELLA PARTE.\nPRENDILO 3 VOLTE: SCIVOLA!', 7, '#ffffff').setDepth(25);
    this.tweens.add({ targets: hint, alpha: 0, delay: 2800, duration: 400, onComplete: () => hint.destroy() });
  }

  update(t, dt) {
    if (this.phase !== 'intro' && this.phase !== 'result') this.bg.tilePositionY -= 90 * dt / 1000;
    if (this.phase === 'caccia') this.updateHunt(dt);
    if (this.lollo.y > 0 && !this.lolloStill) this.lollo.x = W / 2 + Math.sin(this.time.now / 900) * 70;
    this.cig.setTint(Math.floor(this.time.now / 300) % 2 ? 0xffffff : 0xffd0a0); // brace che pulsa
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
      p.setAngle(Math.sin(this.elapsed / 70) * 10);
    } else {
      this.stars.setVisible(false); p.setAngle(0);
      const step = 230 * s;
      if (this.keys?.left.isDown) p.x -= step;
      else if (this.keys?.right.isDown) p.x += step;
      else if (this.targetX !== null) { const dx = this.targetX - p.x; p.x += Math.sign(dx) * Math.min(Math.abs(dx), step); }
      p.x = Phaser.Math.Clamp(p.x, 34, W - 34);
      p.y = PLAYER_Y + Math.abs(Math.sin(this.elapsed / 120)) * 2;
    }

    // Raggio di visibilità (si stringe con le sigarette)
    if (this.sigaMs > 0) this.sigaMs -= dt;
    const want = this.sigaMs > 0 ? N.luceSiga : N.luce;
    this.radius += (want - this.radius) * Math.min(1, s * 6);

    // Folata di vento: il fumo si dirada per un attimo
    this.windMs -= dt;
    if (this.windMs <= 0) {
      this.windMs = N.ventoEvery + Phaser.Math.Between(-1000, 1000);
      sfx.wind();
      const w = txt(this, W / 2, 110, '~ VENTO ~', 9, '#ffffff').setDepth(25);
      this.tweens.add({ targets: w, alpha: 0, delay: 900, duration: 300, onComplete: () => w.destroy() });
      this.tweens.add({ targets: this, fogAlpha: 0.15, duration: 250, yoyo: true, hold: 900 });
    }

    // Lollo insulta il ladro (censurato)
    this.insultMs -= dt;
    if (this.insultMs <= 0) { this.insultMs = Phaser.Math.Between(3500, 5000); this.lolloSay(Phaser.Utils.Array.GetRandom(N.insults)); }

    this.updatePhone(dt);
    if (this.phase !== 'caccia') return;

    // Birre e sigarette accese (lanciate da Lollo) nascoste nel fumo
    this.spawnMs -= dt;
    if (this.spawnMs <= 0) {
      this.spawnMs = Phaser.Math.Between(800, 1200);
      const kind = Math.random() < 0.5 ? 'siga_accesa' : 'birra';
      const x = kind === 'siga_accesa' ? Phaser.Math.Clamp(this.lollo.x + Phaser.Math.Between(-60, 60), 30, W - 30) : Phaser.Math.Between(40, W - 40);
      const o = this.add.image(x, kind === 'siga_accesa' ? this.lollo.y + 20 : -20, kind).setScale(2).setDepth(4);
      o.kind = kind;
      this.items.push(o);
    }
    const glow = Math.floor(this.elapsed / 200) % 2 ? 'siga_accesa_b' : 'siga_accesa';
    for (const o of this.items) {
      o.y += (o.kind === 'siga_accesa' ? 120 : 100) * s;
      if (o.kind === 'siga_accesa' && o.texture.key !== glow) o.setTexture(glow);
      if (!o.hit && Math.abs(o.x - p.x) < 20 && Math.abs(o.y - p.y) < 22) {
        o.hit = true;
        if (o.kind === 'siga_accesa') {
          this.sigaMs = N.sigaMs; sfx.hit();
          this.floatText(p.x, p.y - 44, 'SIGA! CHE FUMO...', '#c8b49a');
        } else if (this.stunMs <= 0) {
          this.stunMs = 900; sfx.hit();
          this.floatText(p.x, p.y - 44, 'BIRRETTA... HIC!', '#f4d03f');
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

  // Il telefono: squilla (si vede più o meno da che parte), poi ricompare per poco sulla strada
  updatePhone(dt) {
    const ph = this.ph, p = this.player;
    ph.ms -= dt;
    if (ph.state === 'wait' && ph.ms <= 0) {
      // sceglie dove ricomparirà: mai proprio davanti ad Aurelio
      let x = Phaser.Math.Between(30, W - 30);
      if (Math.abs(x - p.x) < 60) x = p.x < W / 2 ? Phaser.Math.Between(Math.min(W - 30, p.x + 60), W - 30) : Phaser.Math.Between(30, Math.max(30, p.x - 60));
      ph.x = x; ph.y = PLAYER_Y - Phaser.Math.Between(40, 110);
      ph.state = 'ring'; ph.ms = N.ringMs; sfx.ring();
      // lo squillo dice solo DA CHE PARTE suona: icona sul bordo dello schermo con la freccia
      const left = x < W / 2; ph.side = left ? -1 : 1;
      const ix = left ? 22 : W - 22;
      const icon = this.add.image(ix, ph.y, 'telefono').setScale(2.5).setDepth(18);
      const dr = txt(this, left ? 44 : W - 44, ph.y - 22, left ? '< DRIIN!' : 'DRIIN! >', 7, '#f4d03f').setDepth(18);
      this.tweens.add({ targets: icon, angle: { from: -15, to: 15 }, duration: 70, yoyo: true, repeat: 6 });
      this.tweens.add({ targets: [icon, dr], alpha: 0, delay: N.ringMs - 150, duration: 200, onComplete: () => { icon.destroy(); dr.destroy(); } });
    } else if (ph.state === 'ring' && ph.ms <= 0) {
      ph.state = 'show'; ph.ms = N.phoneMs;
      ph.img = this.add.image(ph.x, ph.y, 'telefono').setScale(2.5).setDepth(6);
      // vibra e scivola di lato sull'asfalto
      ph.vx = (ph.x < p.x ? -1 : 1) * Phaser.Math.Between(N.phoneSlide[0], N.phoneSlide[1]); // scivola via da Aurelio
      ph.turnMs = Phaser.Math.Between(400, 800);
    } else if (ph.state === 'show') {
      ph.img.y += 90 * dt / 1000; // per terra: scorre con la strada
      ph.img.x += ph.vx * dt / 1000;
      ph.turnMs -= dt;
      if (ph.turnMs <= 0) { ph.turnMs = Phaser.Math.Between(400, 800); if (Math.random() < 0.5) ph.vx *= -1; }
      if (ph.img.x < 24 || ph.img.x > W - 24) { ph.vx *= -1; ph.img.x = Phaser.Math.Clamp(ph.img.x, 24, W - 24); }
      ph.img.setAngle(Math.sin(this.time.now / 25) * 12); // vibrazione
      if (this.stunMs <= 0 && Math.abs(ph.img.x - p.x) < 22 && Math.abs(ph.img.y - p.y) < 26) {
        this.grabs++;
        this.updateGrabs();
        if (this.grabs >= N.grabsToWin) { this.win(); return; }
        // ti scivola di mano e vola via nella nebbia
        sfx.pick();
        this.floatText(p.x, p.y - 50, 'TI SCIVOLA DI MANO!', '#ffffff');
        const img = ph.img; ph.img = null;
        this.tweens.killTweensOf(img);
        this.tweens.add({ targets: img, x: p.x < W / 2 ? W - 40 : 40, y: PLAYER_Y - 150, angle: 720, alpha: 0, duration: 600, ease: 'Quad.out', onComplete: () => img.destroy() });
        ph.state = 'wait'; ph.ms = Phaser.Math.Between(1000, 1600);
        return;
      }
      if (ph.ms <= 0 || ph.img.y > H + 20) {
        const img = ph.img; ph.img = null;
        this.tweens.add({ targets: img, alpha: 0, duration: 200, onComplete: () => img.destroy() });
        ph.state = 'wait'; ph.ms = Phaser.Math.Between(1200, 2000);
      }
    }
  }

  // In alto: quante volte hai già preso il telefono (ne servono N.grabsToWin)
  updateGrabs() {
    if (!this.grabIcons) {
      this.grabIcons = [];
      for (let i = 0; i < N.grabsToWin; i++) this.grabIcons.push(this.add.image(W / 2 - 14 + i * 14, 12, 'telefono').setDepth(21));
    }
    this.grabIcons.forEach((g, i) => { if (i < this.grabs) g.clearTint().setAlpha(1); else g.setTint(0x333333).setAlpha(0.7); });
  }

  lolloSay(line) {
    const b = txt(this, Phaser.Math.Clamp(this.lollo.x, 90, W - 90), this.lollo.y + 40, line, 7, '#ff9ecb').setDepth(22);
    this.tweens.add({ targets: b, alpha: 0, delay: 1600, duration: 300, onComplete: () => b.destroy() });
  }

  win() {
    this.phase = 'done'; sfx.win();
    this.stars.setVisible(false);
    const img = this.ph.img;
    this.cameras.main.shake(150, 0.01);
    this.floatText(this.player.x, this.player.y - 50, 'TELEFONO RECUPERATO!', '#f4d03f');
    this.tweens.killTweensOf(img);
    this.tweens.add({ targets: img, x: this.player.x, y: this.player.y - 40, scale: 2.5, duration: 400, ease: 'Back.out' });
    this.tweens.add({ targets: this, fogAlpha: 0, duration: 800 });
    this.smoke.stop();
    this.items.forEach(o => o.destroy()); this.items = [];
    this.time.delayedCall(900, () => this.lolloSays(FRIENDS.lollo.winLine, () => this.result(true)));
  }

  lose() {
    this.phase = 'done'; sfx.over();
    this.stars.setVisible(false);
    this.items.forEach(o => o.destroy()); this.items = [];
    if (this.ph.img) this.ph.img.destroy();
    this.tweens.add({ targets: this, fogAlpha: 0.5, duration: 500 });
    this.floatText(W / 2, PLAYER_Y - 90, 'IL TELEFONO È SPARITO...', '#ff6b5b');
    this.time.delayedCall(1300, () => this.lolloSays(FRIENDS.lollo.loseLine, () => this.result(false)));
  }

  // Lollo scende al centro con la sigaretta e dice la sua
  lolloSays(line, then) {
    this.lolloStill = true;
    this.tweens.add({ targets: this.lollo, x: W / 2, y: 110, duration: 500, ease: 'Back.out' });
    const box = this.add.rectangle(W / 2, 190, W - 20, 64, 0x1a1423, 0.92).setStrokeStyle(2, 0xf4d03f).setDepth(30).setAlpha(0);
    const tx = txt(this, W / 2, 190, line, 9, '#ffffff').setDepth(31).setAlpha(0);
    this.tweens.add({ targets: [box, tx], alpha: 1, delay: 500, duration: 300 });
    this.smoke.start();
    this.time.delayedCall(3200, () => { box.destroy(); tx.destroy(); this.smoke.stop(); then(); });
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
