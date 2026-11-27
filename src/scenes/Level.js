import { W, H, txt } from '../util.js';
import { sfx } from '../sfx.js';
import { FRIENDS, BOOSTERS, OBSTACLES, CRUTCHES, SPAWN_WEIGHTS, BOSS } from '../data/characters.js';

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export class Level extends Phaser.Scene {
  constructor() { super('Level'); }

  create() {
    this.elapsed = 0; this.distance = 0; this.bonus = 0; this.lives = 3;
    this.effects = {}; this.hurtMs = 0; this.spawnMs = 600;
    this.friendsFound = []; this.nextFriendAt = 9000;
    this.boss = null; this.nextBossAt = BOSS.firstAt;
    this.frozen = false; this.ended = false;

    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'road');
    this.items = this.physics.add.group();

    this.player = this.physics.add.sprite(W / 2, H - 62, 'aurelio').setScale(2).setDepth(5);
    this.player.body.setSize(12, 20).setOffset(3, 4);
    this.racket = this.add.image(0, 0, 'racchetta').setScale(1.6).setDepth(6).setVisible(false);
    this.crutches = this.add.image(0, 0, 'stampelle').setScale(2).setDepth(4).setVisible(false);

    // Controlli: trascina il dito (o tieni premuto) per spostarti; frecce su PC
    this.targetX = null;
    this.input.on('pointerdown', p => { this.targetX = p.x; });
    this.input.on('pointermove', p => { if (p.isDown) this.targetX = p.x; });
    this.input.on('pointerup', () => { this.targetX = null; });
    this.keys = this.input.keyboard?.createCursorKeys();

    this.physics.add.overlap(this.player, this.items, (pl, it) => this.onTouch(it));

    // HUD
    this.add.rectangle(W / 2, 12, W, 24, 0x1a1423, 0.6).setDepth(20);
    this.scoreText = txt(this, 8, 12, '0', 8, '#f4d03f', 0).setOrigin(0, 0.5).setDepth(21);
    this.hearts = [];
    for (let i = 0; i < 5; i++) this.hearts.push(this.add.image(W - 12 - i * 13, 12, 'cuore').setScale(1.3).setDepth(21));
    this.effectText = txt(this, W / 2, 36, '', 7, '#bfe3f0').setDepth(21);
    this.refreshHearts();

    // Cartello stradale: siamo in viale Lombardia
    const sign = this.add.container(W / 2, H / 2 - 50).setDepth(30);
    sign.add(this.add.rectangle(0, 0, 196, 42, 0xf4f1ea).setStrokeStyle(3, 0x1a1423));
    sign.add(this.add.text(0, -6, 'VIALE LOMBARDIA', { fontFamily: 'PressStart', fontSize: '9px', color: '#1a1423' }).setOrigin(0.5).setResolution(4));
    sign.add(this.add.text(0, 10, 'MILANO', { fontFamily: 'PressStart', fontSize: '6px', color: '#5a4030' }).setOrigin(0.5).setResolution(4));
    const hint = txt(this, W / 2, H / 2 + 10, 'TRASCINA IL DITO\nPER MUOVERTI', 9).setDepth(30);
    this.tweens.add({ targets: [hint, sign], alpha: 0, delay: 2200, duration: 600, onComplete: () => { hint.destroy(); sign.destroy(); } });
  }

  // ---------- ciclo di gioco ----------
  update(t, dt) {
    if (this.frozen || this.ended) return;
    this.elapsed += dt;

    const fall = this.fallSpeed();
    this.bg.tilePositionY -= fall * dt / 1000;
    const mult = this.effects.double ? 2 : 1;
    this.distance += fall * dt / 1000 / 12 * mult;
    this.scoreText.setText(String(this.score()));

    this.movePlayer(dt);
    this.tickEffects(dt);

    // Comparsa oggetti
    this.spawnMs -= dt;
    if (this.spawnMs <= 0) {
      this.spawnRandom(fall);
      const base = Math.max(380, 950 - this.elapsed / 1000 * 9);
      this.spawnMs = this.boss ? base * 1.8 : base;
    }
    if (this.elapsed >= this.nextFriendAt && !this.items.getChildren().some(i => i.kind === 'friend')) {
      this.spawnFriend(fall);
      this.nextFriendAt = this.elapsed + 14000;
    }
    if (!this.boss && this.elapsed >= this.nextBossAt) this.startBoss();
    if (this.boss) this.updateBoss(t, dt, fall);

    // Pulizia oggetti usciti dallo schermo
    for (const it of [...this.items.getChildren()]) {
      if (it.y > H + 40 || it.y < -90) it.destroy();
    }
  }

  fallSpeed() { return Math.min(110 + this.elapsed / 1000 * 3.5, 300); }
  score() { return Math.floor(this.distance) + this.bonus; }

  movePlayer(dt) {
    const p = this.player;
    let speed = 280 * (this.effects.speed ? 1.7 : 1);
    if (this.effects.crutches) speed *= CRUTCHES.speed;
    if (this.effects.stuck) speed = 0;
    const step = speed * dt / 1000;
    if (this.keys?.left.isDown) p.x -= step;
    else if (this.keys?.right.isDown) p.x += step;
    else if (this.targetX !== null) {
      const dx = this.targetX - p.x;
      p.x += Math.sign(dx) * Math.min(Math.abs(dx), step);
    }
    p.x = Phaser.Math.Clamp(p.x, 34, W - 34);

    // Stampelle rosse: Aurelio zoppica
    const lame = !!this.effects.crutches;
    this.crutches.setVisible(lame);
    if (lame) {
      const hop = Math.abs(Math.sin(this.elapsed / 140)) * 3;
      p.y = H - 62 - hop;
      this.crutches.setPosition(p.x, H - 55 - hop * 0.3).setAngle(Math.sin(this.elapsed / 140) * 4);
    } else p.y = H - 62;
    p.setFlipX(this.targetX !== null && this.targetX < p.x - 2);

    this.racket.setVisible(!!this.effects.padel);
    if (this.effects.padel) this.racket.setPosition(p.x + 20, p.y - 10).setAngle(Math.sin(this.elapsed / 80) * 25);

    // Lampeggio quando colpito / invincibile
    if (this.hurtMs > 0) { this.hurtMs -= dt; p.setAlpha(Math.floor(this.hurtMs / 80) % 2 ? 0.3 : 1); }
    else p.setAlpha(1);
    if (this.effects.invincible) p.setTint(Math.floor(this.elapsed / 90) % 2 ? 0xffe066 : 0xffffff);
    else if (this.effects.stuck) p.setTint(0x8899ff);
    else p.clearTint();
  }

  tickEffects(dt) {
    const labels = { speed: 'TURBO', double: 'x2', invincible: 'INVINCIBILE', padel: 'PADEL', stuck: 'SUL DIVANO', crutches: 'STAMPELLE' };
    const active = [];
    for (const k of Object.keys(this.effects)) {
      this.effects[k] -= dt;
      if (this.effects[k] <= 0) delete this.effects[k];
      else active.push(labels[k] + ' ' + Math.ceil(this.effects[k] / 1000));
    }
    this.effectText.setText(active.join('  '));
  }

  // ---------- comparsa ----------
  spawnRandom(fall) {
    const entries = Object.entries(SPAWN_WEIGHTS);
    let r = Math.random() * entries.reduce((s, [, w]) => s + w, 0);
    let kind = entries[0][0];
    for (const [k, w] of entries) { if ((r -= w) < 0) { kind = k; break; } }
    const it = this.items.create(Phaser.Math.Between(40, W - 40), -20, kind).setScale(2);
    it.kind = kind; it.seed = Math.random() * 1000;
    it.setVelocityY(fall * Phaser.Math.FloatBetween(0.9, 1.1));
    if (kind === 'pizza') it.setAngularVelocity(Phaser.Math.Between(-90, 90)); // la pizza vola girando
  }

  spawnFriend(fall) {
    const keys = Object.keys(FRIENDS);
    const missing = keys.filter(k => !this.friendsFound.includes(k));
    const key = pick(missing.length ? missing : keys);
    const it = this.items.create(Phaser.Math.Between(50, W - 50), -24, key).setScale(2.2).setDepth(3);
    it.kind = 'friend'; it.friend = key;
    it.setVelocityY(fall * 0.75);
    this.tweens.add({ targets: it, scale: 2.6, duration: 300, yoyo: true, repeat: -1 });
  }

  // ---------- contatti ----------
  onTouch(it) {
    if (this.frozen || this.ended || !it.active || it.reflected) return;
    const k = it.kind;

    if (OBSTACLES[k]) {
      if (this.effects.padel) { this.smash(it, 'SMASH!'); return; }
      if (this.effects.invincible) { this.smash(it, 'OLE!'); return; }
      if (this.hurtMs > 0) return;
      this.lives--; this.hurtMs = 1200; this.refreshHearts();
      this.cameras.main.shake(150, 0.01); sfx.hit();
      this.floatText(it.x, it.y, OBSTACLES[k].label, '#ff6b5b');
      if (OBSTACLES[k].crutches) {
        this.effects.crutches = CRUTCHES.ms;
        this.time.delayedCall(450, () => this.floatText(this.player.x, this.player.y - 44, CRUTCHES.label, '#ff9ecb'));
      }
      it.destroy();
      if (this.lives <= 0) this.gameOver();
      return;
    }

    if (BOOSTERS[k]) {
      const b = BOOSTERS[k];
      this.effects[b.effect] = b.ms;
      if (b.effect === 'padel' || b.effect === 'invincible') delete this.effects.stuck;
      this.addBonus(15); sfx.boost();
      this.floatText(it.x, it.y, b.label, '#f4d03f');
      it.destroy();
      return;
    }

    if (k === 'friend') {
      const f = it.friend; it.destroy();
      if (!this.friendsFound.includes(f)) this.friendsFound.push(f);
      this.addBonus(100); sfx.friend();
      this.showFriendBanner(f);
      return;
    }

    if (k === 'invito') {
      if (this.effects.padel) { // rimando al mittente!
        it.reflected = true; it.setVelocity((this.boss ? (this.boss.x - it.x) : 0) * 2, -380);
        sfx.smash(); this.floatText(it.x, it.y, 'RISPEDITO!', '#f4d03f');
        return;
      }
      if (this.effects.invincible) { this.smash(it, 'NO GRAZIE!'); return; }
      this.effects.stuck = 2000; sfx.hit();
      this.floatText(this.player.x, this.player.y - 40, pick(BOSS.hitLines), '#ff9ecb');
      it.destroy();
    }
  }

  smash(it, label) {
    this.addBonus(25); sfx.smash();
    this.floatText(it.x, it.y, label, '#ffffff');
    const e = this.add.particles(it.x, it.y, 'spark', { speed: { min: 60, max: 160 }, lifespan: 350, quantity: 12, emitting: false });
    e.explode(12); this.time.delayedCall(400, () => e.destroy());
    it.destroy();
  }

  addBonus(n) { this.bonus += this.effects.double ? n * 2 : n; }

  refreshHearts() { this.hearts.forEach((h, i) => h.setVisible(i < this.lives)); }

  floatText(x, y, s, color) {
    const t = txt(this, Phaser.Math.Clamp(x, 70, W - 70), y, s, 7, color).setDepth(25);
    this.tweens.add({ targets: t, y: y - 36, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  // ---------- amici: annuncio mini-gioco ----------
  showFriendBanner(key) {
    const f = FRIENDS[key];
    this.frozen = true; this.physics.pause(); this.targetX = null;
    const g = this.add.container(0, 0).setDepth(40);
    g.add(this.add.rectangle(W / 2, H / 2, W - 30, 220, 0x1a1423, 0.95).setStrokeStyle(3, 0xf4d03f));
    g.add(this.add.image(W / 2, H / 2 - 60, key).setScale(4));
    g.add(txt(this, W / 2, H / 2, f.name + '!', 14, '#f4d03f'));
    g.add(txt(this, W / 2, H / 2 + 24, '"' + f.line + '"', 7, '#ffffff'));
    g.add(txt(this, W / 2, H / 2 + 50, 'MINI-GIOCO: ' + f.game, 7, '#bfe3f0'));
    g.add(txt(this, W / 2, H / 2 + 68, 'PROSSIMAMENTE  +100', 7, '#f08a24'));
    g.setAlpha(0); g.y = 30;
    this.tweens.add({ targets: g, alpha: 1, y: 0, duration: 220, ease: 'Back.out' });
    this.time.delayedCall(2200, () => {
      g.destroy(); this.frozen = false; this.physics.resume();
    });
  }

  // ---------- boss: Maggipinto ----------
  startBoss() {
    const b = this.add.image(W / 2, -40, 'maggipinto').setScale(3).setDepth(4);
    this.boss = b; b.left = BOSS.duration; b.throwMs = 1400; b.leaving = false;
    sfx.boss();
    this.tweens.add({ targets: b, y: 78, duration: 1100, ease: 'Bounce.out' });
    this.bossSay(pick(BOSS.enterLines));
  }

  bossSay(s) {
    if (!this.boss) return;
    const t = txt(this, W / 2, 140, s, 8, '#ff9ecb').setDepth(25);
    this.tweens.add({ targets: t, alpha: 0, delay: 1400, duration: 400, onComplete: () => t.destroy() });
  }

  updateBoss(t, dt, fall) {
    const b = this.boss;
    if (b.leaving) return;
    b.x = W / 2 + Math.sin(this.elapsed / 650) * 80;
    b.left -= dt; b.throwMs -= dt;
    if (b.throwMs <= 0 && b.y > 60) {
      b.throwMs = BOSS.throwEvery;
      const it = this.items.create(b.x, b.y + 30, 'invito').setScale(2);
      it.kind = 'invito';
      it.setVelocity((this.player.x - b.x) * 0.35, 150 + fall * 0.35);
    }
    // Inviti rimandati indietro con la racchetta
    for (const it of this.items.getChildren()) {
      if (it.reflected && Phaser.Math.Distance.Between(it.x, it.y, b.x, b.y) < 30) {
        it.destroy();
        this.addBonus(200);
        this.floatText(b.x, b.y + 40, '+200 TORNA A CASA!', '#f4d03f');
        this.endBoss();
        return;
      }
    }
    if (b.left <= 0) { this.bossSay(pick(BOSS.leaveLines)); this.endBoss(); }
  }

  endBoss() {
    const b = this.boss; b.leaving = true;
    this.tweens.add({ targets: b, y: -60, duration: 700, ease: 'Back.in', onComplete: () => { b.destroy(); this.boss = null; } });
    this.nextBossAt = this.elapsed + BOSS.every;
  }

  // ---------- fine ----------
  gameOver() {
    this.ended = true; this.physics.pause(); sfx.over();
    this.player.setTint(0xff6666);
    this.time.delayedCall(900, () => this.scene.start('GameOver', { score: this.score(), friends: this.friendsFound }));
  }
}
