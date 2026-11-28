import { W, H, txt, PLAYER_Y, FOG_R, save } from '../util.js';
import { sfx } from '../sfx.js';
import { FRIENDS, BOOSTERS, OBSTACLES, CRUTCHES, DONKEY, LEVEL, SPAWN_WEIGHTS, BOSS, MONTAGNA, NEBBIA, PORTAFOGLIO, KARAOKE } from '../data/characters.js';

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export class Level extends Phaser.Scene {
  constructor() { super('Level'); }

  create() {
    this.elapsed = 0; this.distance = 0; this.bonus = 0; this.lives = 3;
    this.effects = {}; this.hurtMs = 0; this.spawnMs = 600;
    this.friendsFound = []; this.beaten = []; this.nextFriendAt = 9000;
    this.boss = null; this.nextBossAt = BOSS.firstAt;
    this.frozen = false; this.ended = false;
    this.camparino = false; // diventa true solo dopo aver battuto Antonio in QUESTA partita: spritz -> camparini

    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'road');
    this.items = this.physics.add.group();

    this.player = this.physics.add.sprite(W / 2, PLAYER_Y, 'aurelio').setScale(2).setDepth(5);
    this.player.body.setSize(12, 20).setOffset(3, 4);
    this.racket = this.add.image(0, 0, 'racchetta').setScale(1.6).setDepth(6).setVisible(false);
    this.mic = this.add.image(0, 0, 'microfono').setScale(1.4).setDepth(6).setVisible(false);
    this.waveMs = 0; this.shoutMs = 0; this.shoutIdx = 0;
    this.crutches = this.add.image(0, 0, 'stampelle').setScale(2).setDepth(4).setVisible(false);
    this.donkey = this.add.image(0, 0, 'asino').setScale(3).setDepth(6).setVisible(false);
    this.fanImg = this.add.image(0, 0, 'ventilatore').setScale(2).setDepth(7).setVisible(false);
    this.fogImg = this.add.image(W / 2, PLAYER_Y, 'nebbia').setDepth(15).setAlpha(0); this.fogAlpha = 0;

    // Controlli: trascina il dito (o tieni premuto) per spostarti; frecce su PC
    this.targetX = null;
    this.input.on('pointerdown', p => { this.targetX = p.x; });
    this.input.on('pointermove', p => { if (p.isDown) this.targetX = p.x; });
    this.input.on('pointerup', () => { this.targetX = null; });
    this.keys = this.input.keyboard?.createCursorKeys();

    this.physics.add.overlap(this.player, this.items, (pl, it) => this.onTouch(it));

    // Sci-blaster: gli sci sparati abbattono pizze e rocce
    this.shots = this.physics.add.group(); this.shootMs = 0;
    this.physics.add.overlap(this.shots, this.items, (sh, it) => {
      if (!sh.active || !it.active || !OBSTACLES[it.kind]) return;
      sh.destroy(); this.smash(it, 'BAM!');
    });

    // Ritorno da un mini-gioco
    const onResume = (sys, data) => this.onMiniDone(data);
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => this.events.off('resume', onResume));

    // HUD
    this.add.rectangle(W / 2, 12, W, 24, 0x1a1423, 0.6).setDepth(20);
    this.scoreText = txt(this, 8, 12, '0', 8, '#f4d03f', 0).setOrigin(0, 0.5).setDepth(21);
    this.hearts = [];
    for (let i = 0; i < 5; i++) this.hearts.push(this.add.image(W - 12 - i * 13, 12, 'cuore').setScale(1.3).setDepth(21));
    this.effectText = txt(this, W / 2, 62, '', 7, '#bfe3f0').setDepth(21).setWordWrapWidth(W - 20).setOrigin(0.5, 0);

    // Leggenda amici: facce scure finché non li batti, poi si colorano
    const fk = Object.keys(FRIENDS);
    this.add.rectangle(6, 30, fk.length * 19 + 6, 22, 0x1a1423, 0.55).setOrigin(0, 0).setDepth(20);
    this.legend = {};
    fk.forEach((k, i) => {
      this.legend[k] = this.add.image(18 + i * 19, 41, k).setDepth(21).setTint(0x2a2a2a).setAlpha(0.8);
    });
    this.refreshHearts();

    // Cartello stradale: siamo in viale Lombardia
    const sign = this.add.container(W / 2, H / 2 - 50).setDepth(30);
    sign.add(this.add.rectangle(0, 0, 196, 42, 0xf4f1ea).setStrokeStyle(3, 0x1a1423));
    sign.add(this.add.text(0, -6, 'VIALE LOMBARDIA', { fontFamily: 'PressStart', fontSize: '9px', color: '#1a1423' }).setOrigin(0.5).setResolution(4));
    sign.add(this.add.text(0, 10, 'MILANO', { fontFamily: 'PressStart', fontSize: '6px', color: '#5a4030' }).setOrigin(0.5).setResolution(4));
    const hint = txt(this, W / 2, H - 50, 'TRASCINA QUI\nIL DITO', 9).setDepth(30);
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
    this.updateShots(dt);
    this.updateFanFog(dt);
    this.updateKaraoke(dt);
    this.updateAuras();

    // Comparsa oggetti
    this.spawnMs -= dt;
    if (this.spawnMs <= 0) {
      this.spawnRandom(fall);
      const base = Math.max(450, 950 - this.elapsed / 1000 * 9);
      this.spawnMs = this.boss ? base * 1.8 : base;
    }
    if (this.elapsed >= this.nextFriendAt && !this.items.getChildren().some(i => i.kind === 'friend')) {
      this.spawnFriend(fall);
      this.nextFriendAt = this.elapsed + 14000;
    }
    if (!this.boss && this.elapsed >= this.nextBossAt) this.startBoss();
    if (this.boss) this.updateBoss(t, dt, fall);

    // Pulizia oggetti usciti dallo schermo (+ puzza della pizza animata)
    const stink = Math.floor(this.elapsed / 260) % 2 ? 'pizza_b' : 'pizza';
    for (const it of [...this.items.getChildren()]) {
      if (it.kind === 'pizza' && it.texture.key !== stink) it.setTexture(stink);
      if (it.y > H + 40 || it.y < -90) it.destroy();
    }
  }

  fallSpeed() { return Math.min(LEVEL.startSpeed + this.elapsed / 1000 * LEVEL.accel, LEVEL.maxSpeed); }
  score() { return Math.floor(this.distance) + this.bonus; }

  movePlayer(dt) {
    const p = this.player;
    let speed = 280 * (this.effects.speed ? 1.7 : 1);
    if (this.effects.crutches) speed *= CRUTCHES.speed;
    if (this.effects.riding) speed *= DONKEY.rideSpeed;
    else if (this.effects.wide) speed *= DONKEY.wideSpeed;
    if (this.effects.stuck) speed = 0;
    const step = speed * dt / 1000;
    if (this.keys?.left.isDown) p.x -= step;
    else if (this.keys?.right.isDown) p.x += step;
    else if (this.targetX !== null) {
      const dx = this.targetX - p.x;
      p.x += Math.sign(dx) * Math.min(Math.abs(dx), step);
    }
    if (this.effects.riding) p.x += Math.sin(this.elapsed / 300) * 60 * dt / 1000; // l'asino va un po' dove vuole lui
    p.x = Phaser.Math.Clamp(p.x, 34, W - 34);

    // Gambe larghe dopo l'asino: occupa più spazio
    const wide = !!this.effects.wide;
    if (wide !== this.isWide) {
      this.isWide = wide;
      p.setTexture(wide ? 'aurelio_larghe' : 'aurelio');
      if (wide) p.body.setSize(18, 20).setOffset(3, 4); else p.body.setSize(12, 20).setOffset(3, 4);
    }
    if (wide) p.setAngle(Math.sin(this.elapsed / 120) * 6); else p.setAngle(0);

    // Stampelle rosse: Aurelio zoppica
    const lame = !!this.effects.crutches;
    this.crutches.setVisible(lame);
    if (lame) {
      const hop = Math.abs(Math.sin(this.elapsed / 140)) * 3;
      p.y = PLAYER_Y - hop;
      this.crutches.setPosition(p.x, PLAYER_Y + 7 - hop * 0.3).setAngle(Math.sin(this.elapsed / 140) * 4);
    } else p.y = PLAYER_Y;

    // In groppa all'asino
    const riding = !!this.effects.riding;
    this.donkey.setVisible(riding);
    if (riding) {
      const bob = Math.abs(Math.sin(this.elapsed / 110)) * 3;
      p.y = PLAYER_Y - 22 - bob;
      this.donkey.setPosition(p.x - 4, PLAYER_Y + 12 - bob * 0.3).setFlipX(Math.sin(this.elapsed / 300) < 0);
    }
    p.setFlipX(this.targetX !== null && this.targetX < p.x - 2);

    this.racket.setVisible(!!this.effects.padel);
    if (this.effects.padel) this.racket.setPosition(p.x + 20, p.y - 10).setAngle(Math.sin(this.elapsed / 80) * 25);
    this.mic.setVisible(!!this.effects.karaoke);
    if (this.effects.karaoke) this.mic.setPosition(p.x - 16, p.y - 6).setAngle(-20 + Math.sin(this.elapsed / 90) * 10);

    // Lampeggio quando colpito / invincibile
    if (this.hurtMs > 0) { this.hurtMs -= dt; p.setAlpha(Math.floor(this.hurtMs / 80) % 2 ? 0.3 : 1); }
    else p.setAlpha(1);
    if (this.effects.invincible) p.setTint(Math.floor(this.elapsed / 90) % 2 ? 0xffe066 : 0xffffff);
    else if (this.effects.stuck) p.setTint(0x8899ff);
    else p.clearTint();
  }

  tickEffects(dt) {
    const labels = { riding: 'ASINO', wide: 'GAMBE LARGHE', speed: 'TURBO', double: 'x2', invincible: 'INVINCIBILE', padel: 'PADEL', karaoke: 'KARAOKE', stuck: 'SUL DIVANO', crutches: 'STAMPELLE', ski: 'SCI-BLASTER', fan: 'VENTILATORE', fog: 'NEBBIA' };
    const active = [];
    for (const k of Object.keys(this.effects)) {
      this.effects[k] -= dt;
      if (this.effects[k] <= 0) {
        delete this.effects[k];
        if (k === 'riding') { // scende dall'asino... a gambe larghe
          this.effects.wide = DONKEY.wideMs;
          this.floatText(this.player.x, this.player.y - 40, 'AHI, LE GAMBE...', '#ff9ecb');
        }
      }
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
    const tex = kind === 'spritz' && this.camparino ? 'camparino' : kind;
    const it = this.items.create(Phaser.Math.Between(40, W - 40), -20, tex).setScale(kind === 'asino' ? 2.5 : 2);
    it.kind = kind; it.seed = Math.random() * 1000;
    it.setVelocityY(fall * Phaser.Math.FloatBetween(0.9, 1.1));
    if (kind === 'pizza') it.body.setSize(12, 12).setOffset(1, 9); // la puzza non conta come ostacolo
    if (kind === 'asino') it.body.setSize(18, 10).setOffset(2, 4);
    if (BOOSTERS[kind]?.aura) this.addAura(it, tex, BOOSTERS[kind].aura);
  }

  // Racchetta e microfono: alone colorato e oggetto che gira sull'asse verticale.
  // L'oggetto "vero" (quello che si prende) resta invisibile; si vedono la copia che gira e l'alone.
  addAura(it, tex, color) {
    it.setVisible(false);
    it.auraImg = this.add.image(it.x, it.y, 'aura').setTint(color).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    it.vis = this.add.image(it.x, it.y, tex).setScale(2).setDepth(2);
    it.once('destroy', () => { it.auraImg.destroy(); it.vis.destroy(); });
  }

  updateAuras() {
    for (const it of this.items.getChildren()) {
      if (!it.vis) continue;
      const c = Math.cos(this.elapsed / 220 + it.seed);
      it.vis.setPosition(it.x, it.y).setScale(2 * Math.max(0.12, Math.abs(c)), 2).setFlipX(c < 0);
      const pulse = Math.sin(this.elapsed / 180 + it.seed);
      it.auraImg.setPosition(it.x, it.y).setScale(1.7 + pulse * 0.15).setAlpha(0.65 + pulse * 0.15);
    }
  }

  // Karaoke: Aurelio canta, le onde d'urto rompono pizze, rocce, asini e inviti nel raggio vicino
  updateKaraoke(dt) {
    if (!this.effects.karaoke || this.frozen) return;
    const p = this.player;
    this.shoutMs -= dt;
    if (this.shoutMs <= 0) {
      this.shoutMs = KARAOKE.shoutEvery;
      const line = KARAOKE.lines[this.shoutIdx++ % KARAOKE.lines.length];
      this.floatText(p.x, p.y - 50, line, '#ff9ecb');
      sfx.sing();
    }
    this.waveMs -= dt;
    if (this.waveMs > 0) return;
    this.waveMs = KARAOKE.waveEvery;
    sfx.wave();
    for (const [delay, col] of [[0, 0xff9ecb], [120, 0xffffff]]) {
      const ring = this.add.circle(p.x, p.y - 4, 8).setStrokeStyle(2, col, 0.9).setDepth(6);
      this.tweens.add({ targets: ring, scale: KARAOKE.radius / 8, alpha: 0, delay, duration: 380, onComplete: () => ring.destroy() });
    }
    for (const it of [...this.items.getChildren()]) {
      if (!it.active || it.reflected || !(OBSTACLES[it.kind] || it.kind === 'invito')) continue;
      if (Phaser.Math.Distance.Between(p.x, p.y, it.x, it.y) <= KARAOKE.radius) this.smash(it, 'CRASH!');
    }
  }

  spawnFriend(fall) {
    const left = Object.keys(FRIENDS).filter(k => !this.beaten.includes(k));
    if (!left.length) return;
    const key = pick(left);
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
      if (this.effects.karaoke) { this.smash(it, 'CRASH!'); return; }
      if (this.effects.invincible) { this.smash(it, 'OLE!'); return; }
      if (this.hurtMs > 0) return;
      if (OBSTACLES[k].donkey) { // l'asino non toglie vite: ti carica in groppa
        if (this.effects.riding) return;
        delete this.effects.wide;
        this.effects.riding = DONKEY.rideMs; this.hurtMs = 600; sfx.hit();
        this.floatText(it.x, it.y, OBSTACLES[k].label, '#ff9ecb');
        it.destroy();
        return;
      }
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
      if (b.effect === 'padel' || b.effect === 'invincible' || b.effect === 'karaoke') delete this.effects.stuck;
      if (b.effect === 'karaoke') { this.shoutMs = 0; this.waveMs = 0; }
      this.addBonus(15); sfx.boost();
      this.floatText(it.x, it.y, k === 'spritz' && this.camparino ? b.camparino : b.label, '#f4d03f');
      it.destroy();
      return;
    }

    if (k === 'friend') {
      const f = it.friend; it.destroy();
      if (!this.friendsFound.includes(f)) this.friendsFound.push(f);
      this.addBonus(100); sfx.friend();
      if (FRIENDS[f].scene) this.startMini(f);
      else this.showFriendBanner(f); // mini-gioco non ancora pronto: per ora vale come battuto
      return;
    }

    if (k === 'invito') {
      if (this.effects.padel) { // rimando al mittente!
        it.reflected = true; it.setVelocity((this.boss ? (this.boss.x - it.x) : 0) * 2, -380);
        sfx.smash(); this.floatText(it.x, it.y, 'RISPEDITO!', '#f4d03f');
        return;
      }
      if (this.effects.invincible || this.effects.karaoke) { this.smash(it, 'NO GRAZIE!'); return; }
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
    g.add(txt(this, W / 2, H / 2 + 72, 'IN ARRIVO: PER ORA\nLO BATTI GRATIS', 7, '#f08a24'));
    g.setAlpha(0); g.y = 30;
    this.tweens.add({ targets: g, alpha: 1, y: 0, duration: 220, ease: 'Back.out' });
    this.time.delayedCall(2200, () => {
      g.destroy(); this.frozen = false; this.physics.resume();
      this.markBeaten(key);
    });
  }

  // ---------- mini-giochi ----------
  startMini(key) {
    this.frozen = true; this.targetX = null; this.physics.pause();
    this.time.delayedCall(250, () => {
      this.scene.launch(FRIENDS[key].scene);
      this.scene.pause();
    });
  }

  onMiniDone(res) {
    this.targetX = null;
    // pulisce gli ostacoli vicini ad Aurelio per non farlo colpire appena torna
    for (const it of [...this.items.getChildren()]) if (it.y > H / 2 && it.kind !== 'friend') it.destroy();
    this.hurtMs = 1200;
    this.physics.resume(); this.frozen = false;
    if (!res) return;
    const p = this.player;
    if (res.mini === 'javier') {
      if (res.win) {
        const R = MONTAGNA.reward;
        this.addBonus(R.points + (res.bonus || 0));
        this.lives = Math.min(this.lives + R.life, this.hearts.length); this.refreshHearts();
        this.effects.ski = R.skiMs;
        this.floatText(p.x, p.y - 50, 'SCI-BLASTER!', '#bfe3f0');
      } else {
        this.effects.crutches = CRUTCHES.ms;
        this.floatText(p.x, p.y - 50, CRUTCHES.label, '#ff9ecb');
      }
    } else if (res.mini === 'lollo') {
      if (res.win) {
        this.addBonus(NEBBIA.reward.points);
        this.effects.fan = NEBBIA.reward.fanMs;
        this.floatText(p.x, p.y - 50, 'VENTILATORE!', '#bfe3f0');
      } else {
        this.effects.fog = NEBBIA.fogMs;
        this.floatText(p.x, p.y - 50, 'CHE NEBBIA...', '#c8b49a');
      }
    } else if (res.mini === 'antonio') {
      if (res.win) {
        this.addBonus(PORTAFOGLIO.reward.points);
        this.camparino = true;
        for (const it of this.items.getChildren()) if (it.kind === 'spritz') it.setTexture('camparino');
        this.floatText(p.x, p.y - 50, 'CAMPARINO?', '#ff6b5b');
      } else {
        this.bonus -= Math.min(PORTAFOGLIO.losePoints, this.score());
        this.floatText(p.x, p.y - 50, 'SGRADEVOLE: -' + PORTAFOGLIO.losePoints, '#ff6b5b');
      }
    }
    if (res.win) { sfx.boost(); this.markBeaten(res.mini); }
  }

  // Ventilatore (premio di Lollo): soffia via di lato pizze, rocce, asini e inviti vicini
  // Nebbia (malus di Lollo): si vede solo un cerchio attorno ad Aurelio
  updateFanFog(dt) {
    const p = this.player, s = dt / 1000;
    const fan = !!this.effects.fan;
    this.fanImg.setVisible(fan);
    if (fan) {
      this.fanImg.setPosition(p.x, p.y - 44).setAngle(Math.sin(this.elapsed / 40) * 6);
      for (const it of this.items.getChildren()) {
        if (!(OBSTACLES[it.kind] || it.kind === 'invito') || it.reflected) continue;
        const dx = it.x - p.x, dy = it.y - p.y;
        if (dy > -240 && dy < 30 && Math.abs(dx) < 90) {
          it.x += (dx === 0 ? 1 : Math.sign(dx)) * 360 * s;
          if (it.x < -20 || it.x > W + 20) it.destroy();
        }
      }
      if (Math.random() < s * 14) {
        const l = this.add.rectangle(p.x + Phaser.Math.Between(-30, 30), p.y - 60, 2, 12, 0xffffff, 0.7).setDepth(6);
        this.tweens.add({ targets: l, y: l.y - 90, alpha: 0, duration: 400, onComplete: () => l.destroy() });
      }
    }
    const fogOn = !!this.effects.fog;
    const target = fogOn ? (this.effects.fog < 600 ? this.effects.fog / 600 * 0.96 : 0.96) : 0;
    this.fogAlpha += (target - this.fogAlpha) * Math.min(1, s * 5);
    this.fogImg.setAlpha(this.fogAlpha).setPosition(p.x, p.y).setScale(72 / FOG_R);
  }

  // Amico battuto: la sua faccia si colora e non torna più. Battuti tutti = finale.
  markBeaten(key) {
    if (!key || this.beaten.includes(key)) return;
    this.beaten.push(key);
    const img = this.legend[key];
    img.clearTint().setAlpha(1);
    this.tweens.add({ targets: img, scale: 2, duration: 200, yoyo: true });
    this.items.getChildren().filter(i => i.friend === key).forEach(i => i.destroy());
    if (this.beaten.length === Object.keys(FRIENDS).length) this.victory();
  }

  victory() {
    this.ended = true; this.physics.pause(); sfx.win();
    this.floatText(W / 2, H / 2, 'TUTTI BATTUTI!', '#f4d03f');
    this.time.delayedCall(1500, () => this.scene.start('Finale', { score: this.score() }));
  }

  updateShots(dt) {
    if (this.effects.ski) {
      this.shootMs -= dt;
      if (this.shootMs <= 0) {
        this.shootMs = 260;
        const sh = this.shots.create(this.player.x, this.player.y - 30, 'sci1').setScale(2).setDepth(4);
        sh.setVelocityY(-460); sh.setAngularVelocity(720); sfx.shoot();
      }
    }
    for (const sh of [...this.shots.getChildren()]) if (sh.y < -30) sh.destroy();
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
    this.time.delayedCall(900, () => this.scene.start('GameOver', { score: this.score(), friends: this.beaten }));
  }
}
