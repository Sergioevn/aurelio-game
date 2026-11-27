// Mini-gioco di Javier: MONTAGNA
// Fase 1 "La pista": Aurelio risale la pista evitando pali arancioni e sciatori.
// Fase 2 "La seggiovia": tenere in equilibrio il seggiolino toccando a sinistra/destra.
import { W, H, txt } from '../util.js';
import { sfx } from '../sfx.js';
import { FRIENDS, MONTAGNA as M } from '../data/characters.js';

export class MiniMontagna extends Phaser.Scene {
  constructor() { super('MiniMontagna'); }

  init(data) { this.standalone = !!data?.standalone; }

  create() {
    this.phase = 'intro'; this.elapsed = 0; this.crashes = 0; this.stunMs = 0;
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'snow');
    this.items = this.physics.add.group();
    this.decor = this.add.group();

    this.player = this.physics.add.sprite(W / 2, H - 70, 'aurelio').setScale(2).setDepth(5);
    this.player.body.setSize(10, 14).setOffset(4, 12);
    this.skis = this.add.image(W / 2, H - 40, 'sci_coppia').setScale(2).setDepth(4);
    this.stars = this.add.container(0, 0).setDepth(7).setVisible(false);
    for (let i = 0; i < 3; i++) this.stars.add(this.add.image(0, 0, 'stella').setScale(1.5));

    this.targetX = null;
    this.input.on('pointerdown', p => this.onDown(p));
    this.input.on('pointermove', p => { if (p.isDown && this.phase === 'pista') this.targetX = p.x; });
    this.input.on('pointerup', () => { this.targetX = null; });
    this.keys = this.input.keyboard?.createCursorKeys();
    this.physics.add.overlap(this.player, this.items, (pl, it) => this.onHit(it));

    // HUD
    this.add.rectangle(W / 2, 12, W, 24, 0x1a1423, 0.75).setDepth(20);
    this.title = txt(this, 8, 12, 'LA PISTA', 8, '#f4d03f', 0).setOrigin(0, 0.5).setDepth(21);
    this.info = txt(this, W - 8, 12, '', 7, '#ffffff', 0).setOrigin(1, 0.5).setDepth(21);
    this.timeBar = this.add.rectangle(0, 25, W, 3, 0xf08a24).setOrigin(0, 0.5).setDepth(21);

    this.intro();
  }

  // ---------- intro con Javier ----------
  intro() {
    const f = FRIENDS.javier;
    const g = this.add.container(0, 0).setDepth(40);
    g.add(this.add.rectangle(W / 2, H / 2, W - 30, 230, 0x1a1423, 0.95).setStrokeStyle(3, 0xf4d03f));
    g.add(this.add.image(W / 2, H / 2 - 62, 'javier').setScale(4));
    g.add(txt(this, W / 2, H / 2 - 2, f.name, 14, '#f4d03f'));
    g.add(txt(this, W / 2, H / 2 + 24, '"' + f.line + '"', 8, '#ffffff'));
    g.add(txt(this, W / 2, H / 2 + 52, 'EVITA I PALI\nE GLI SCIATORI', 7, '#bfe3f0'));
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
      this.introBox.destroy(); this.phase = 'pista'; this.elapsed = 0; this.spawnMs = 400;
      return;
    }
    if (this.phase === 'pista') { this.targetX = p.x; return; }
    if (this.phase === 'seggiovia') { this.push(p.x < W / 2 ? -1 : 1); return; }
    if (this.phase === 'result' && this.canLeave) this.leave();
  }

  update(t, dt) {
    if (this.phase === 'pista') this.updatePista(dt);
    else if (this.phase === 'seggiovia') this.updateSeggiovia(dt);
  }

  // ---------- FASE 1: la pista ----------
  updatePista(dt) {
    this.elapsed += dt;
    const speed = 140 + this.elapsed / 1000 * 3;
    const stunned = this.stunMs > 0;
    const scroll = (stunned ? speed * 0.25 : speed) * dt / 1000;
    this.bg.tilePositionY -= scroll;
    for (const d of this.decor.getChildren()) { d.y += scroll; if (d.y > H + 30) d.destroy(); }
    for (const it of [...this.items.getChildren()]) {
      it.y += scroll * (it.kind === 'sciatore' ? 1.6 : 1);
      if (it.kind === 'sciatore') it.x = it.baseX + Math.sin((this.elapsed + it.seed) / 380) * 30;
      if (it.y > H + 40) it.destroy();
    }

    // Movimento di Aurelio
    const p = this.player;
    if (stunned) {
      this.stunMs -= dt;
      this.stars.setVisible(true).setPosition(p.x, p.y - 26);
      this.stars.getAll().forEach((s, i) => {
        const a = this.elapsed / 150 + i * 2.1;
        s.setPosition(Math.cos(a) * 14, Math.sin(a) * 4);
      });
      p.setAngle(Math.sin(this.elapsed / 60) * 8);
    } else {
      this.stars.setVisible(false); p.setAngle(0);
      const step = 230 * dt / 1000;
      if (this.keys?.left.isDown) p.x -= step;
      else if (this.keys?.right.isDown) p.x += step;
      else if (this.targetX !== null) { const dx = this.targetX - p.x; p.x += Math.sign(dx) * Math.min(Math.abs(dx), step); }
      p.x = Phaser.Math.Clamp(p.x, 22, W - 22);
      p.y = H - 70 + Math.abs(Math.sin(this.elapsed / 120)) * 2; // passo da risalita
    }
    this.skis.setPosition(p.x, H - 46).setAngle(p.angle);

    // Comparsa ostacoli e decorazioni
    this.spawnMs -= dt;
    if (this.spawnMs <= 0 && this.elapsed < M.pistaMs - 1500) {
      if (Math.random() < 0.62) this.spawnGate(); else this.spawnSkier();
      this.spawnMs = Math.max(650, 1150 - this.elapsed / 1000 * 22);
    }
    if (Math.random() < dt / 700) {
      const x = Math.random() < 0.5 ? Phaser.Math.Between(6, 18) : Phaser.Math.Between(W - 18, W - 6);
      this.decor.add(this.add.image(x, -30, 'abete').setScale(2).setDepth(2));
    }

    this.info.setText('SCHIANTI ' + this.crashes + '/' + M.maxCrash);
    this.timeBar.width = W * Math.max(0, 1 - this.elapsed / M.pistaMs);
    if (this.elapsed >= M.pistaMs) this.startSeggiovia();
  }

  spawnGate() {
    const gap = Math.max(64, 92 - this.elapsed / 1000 * 1.4);
    const cx = Phaser.Math.Between(40 + gap / 2, W - 40 - gap / 2);
    for (const x of [cx - gap / 2, cx + gap / 2]) {
      const it = this.items.create(x, -30, 'palo').setScale(2).setDepth(3);
      it.kind = 'palo'; it.body.setSize(3, 8).setOffset(1, 7);
    }
    // a volte un palo isolato sul bordo per chiudere la strada
    if (Math.random() < 0.4) {
      const x = cx < W / 2 ? Phaser.Math.Between(cx + gap / 2 + 40, W - 25) : Phaser.Math.Between(25, cx - gap / 2 - 40);
      if (x > 20 && x < W - 20) { const it = this.items.create(x, -60, 'palo').setScale(2).setDepth(3); it.kind = 'palo'; it.body.setSize(3, 8).setOffset(1, 7); }
    }
  }

  spawnSkier() {
    const it = this.items.create(0, -30, 'sciatore').setScale(2).setDepth(3);
    it.kind = 'sciatore'; it.baseX = Phaser.Math.Between(50, W - 50); it.seed = Math.random() * 3000;
    it.x = it.baseX; it.body.setSize(8, 10).setOffset(3, 4);
  }

  onHit(it) {
    if (this.phase !== 'pista' || this.stunMs > 0 || !it.active) return;
    this.crashes++;
    this.cameras.main.shake(180, 0.012); sfx.hit();
    if (it.kind === 'palo') {
      this.stunMs = M.stunPalo;
      this.floatText(this.player.x, this.player.y - 46, M.crashLine, '#ff6b5b');
      this.tweens.add({ targets: it, angle: it.x < this.player.x ? -70 : 70, duration: 200 }); // il palo si piega
      it.body.enable = false;
    } else {
      this.stunMs = M.stunSciatore;
      this.floatText(this.player.x, this.player.y - 46, 'SCONTRO!', '#ff6b5b');
      it.body.enable = false;
      this.tweens.add({ targets: it, angle: 360, alpha: 0, duration: 500, onComplete: () => it.destroy() });
    }
    if (this.crashes >= M.maxCrash) {
      this.phase = 'done';
      this.info.setText('SCHIANTI ' + this.crashes + '/' + M.maxCrash);
      this.time.delayedCall(1200, () => this.result(false, 'TROPPI PALI...'));
    }
  }

  // ---------- FASE 2: la seggiovia ----------
  startSeggiovia() {
    this.phase = 'trans';
    this.stars.setVisible(false);
    this.items.clear(true, true);
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff).setDepth(30).setAlpha(0);
    this.tweens.add({ targets: flash, alpha: 1, duration: 300, yoyo: true, hold: 200, onYoyo: () => this.setupSeggiovia() });
  }

  setupSeggiovia() {
    this.decor.clear(true, true);
    this.player.setVisible(false); this.skis.setVisible(false);
    this.player.body.enable = false;
    this.title.setText('LA SEGGIOVIA');

    // Cavo in diagonale: il seggiolino resta fermo, il mondo scorre
    this.cableA = { x: -20, y: 330 }; this.cableB = { x: W + 20, y: 30 };
    this.add.line(0, 0, this.cableA.x, this.cableA.y, this.cableB.x, this.cableB.y, 0x1a1423).setOrigin(0).setLineWidth(2).setDepth(6);
    this.anchor = { x: W / 2, y: this.cableY(W / 2) };

    this.chair = this.add.container(this.anchor.x, this.anchor.y).setDepth(8);
    const seat = this.add.image(0, 0, 'seggiolino').setScale(2).setOrigin(0.5, 0);
    const aur = this.add.image(0, 22, 'aurelio').setScale(2).setOrigin(0.5, 0);
    aur.setCrop(0, 0, 18, 19); // solo dalla vita in su, le gambe stanno davanti al seggiolino
    const legs = this.add.rectangle(0, 58, 24, 10, 0x3d5a8a).setStrokeStyle(2, 0x1a1423);
    const bar = this.add.image(0, 50, 'barra_seggiola').setScale(2).setOrigin(0.5, 0);
    this.aurChair = aur;
    this.chair.add([seat, aur, legs, bar]);

    // Indicatore di equilibrio
    const by = H - 60;
    this.add.rectangle(W / 2, by, 220, 16, 0xc0392b).setStrokeStyle(3, 0x1a1423).setDepth(20);
    this.add.rectangle(W / 2, by, 150, 12, 0x3a8a3a).setDepth(20);
    this.needle = this.add.rectangle(W / 2, by, 6, 22, 0xf4d03f).setStrokeStyle(2, 0x1a1423).setDepth(21);
    this.tapL = txt(this, 40, H - 26, '< TOCCA', 7, '#1a1423').setDepth(21).setStroke('#ffffff', 3);
    this.tapR = txt(this, W - 40, H - 26, 'TOCCA >', 7, '#1a1423').setDepth(21).setStroke('#ffffff', 3);
    this.windText = txt(this, W / 2, 120, '', 9, '#2c4166').setDepth(21).setStroke('#ffffff', 3);
    const hint = txt(this, W / 2, H / 2 + 40, 'TIENI LA BARRA\nNEL VERDE!', 9, '#ffffff').setDepth(25);
    this.tweens.add({ targets: hint, alpha: 0, delay: 1600, duration: 400, onComplete: () => hint.destroy() });

    this.bal = 0; this.balV = 0; this.elapsed = 0; this.gustMs = 2500; this.pylonMs = 1500;
    this.phase = 'seggiovia';
  }

  cableY(x) { const a = this.cableA, b = this.cableB; return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x); }

  push(dir) {
    // tocchi a sinistra/destra spingono il seggiolino da quel lato
    this.balV += dir * 0.9;
    sfx.tone([dir < 0 ? 520 : 620], 0.04, 'square', 0.03);
    const t = dir < 0 ? this.tapL : this.tapR;
    t.setScale(1.3); this.tweens.add({ targets: t, scale: 1, duration: 120 });
  }

  updateSeggiovia(dt) {
    const s = dt / 1000;
    this.elapsed += dt;
    // il mondo scorre in diagonale verso il basso a sinistra
    this.bg.tilePositionX += 60 * s; this.bg.tilePositionY -= 30 * s;
    for (const d of this.decor.getChildren()) {
      d.x -= 60 * s; d.y += 30 * s;
      if (d.x < -40 || d.y > H + 40) d.destroy();
    }
    this.pylonMs -= dt;
    if (this.pylonMs <= 0) {
      this.pylonMs = 3200;
      const x = W + 30, top = this.cableY(x);
      const pyl = this.add.rectangle(x, top, 6, 400, 0x8a8a96).setOrigin(0.5, 0).setStrokeStyle(2, 0x1a1423).setDepth(5);
      pyl.isPylon = true; this.decor.add(pyl);
    }
    if (Math.random() < s * 2.2) this.decor.add(this.add.image(W + 20, Phaser.Math.Between(200, H - 90), 'abete').setScale(2).setDepth(3));

    // Fisica dell'equilibrio: tende a cadere da un lato, il vento dà spinte
    const diff = Math.min(1, this.elapsed / M.seggioviaMs);
    this.balV += this.bal * (1.6 + diff * 1.4) * s;                   // instabilità
    this.balV += Math.sin(this.elapsed / 700) * (0.35 + diff * 0.4) * s; // dondolio
    this.gustMs -= dt;
    if (this.gustMs <= 0) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      this.balV += dir * (0.9 + diff * 0.6);
      this.gustMs = Phaser.Math.Between(2200, 3400) - diff * 700;
      this.windText.setText(dir < 0 ? '<<< VENTO' : 'VENTO >>>').setAlpha(1);
      this.tweens.add({ targets: this.windText, alpha: 0, delay: 500, duration: 300 });
      sfx.wind();
    }
    this.balV *= Math.pow(0.35, s); // attrito
    this.bal += this.balV * s;

    this.chair.setAngle(this.bal * 32);
    this.needle.x = W / 2 + this.bal * 107;
    this.timeBar.width = W * Math.max(0, 1 - this.elapsed / M.seggioviaMs);
    this.info.setText(Math.ceil(Math.max(0, M.seggioviaMs - this.elapsed) / 1000) + ' S');

    if (Math.abs(this.bal) >= 1) this.fallFromChair();
    else if (Math.abs(this.bal) > 150 / 220) this.needle.fillColor = 0xff6b5b;
    else this.needle.fillColor = 0xf4d03f;

    if (this.elapsed >= M.seggioviaMs) this.arrive();
  }

  // Inside joke: Aurelio cade dalla seggiovia e finisce a testa in giù nella neve
  fallFromChair() {
    this.phase = 'done'; sfx.fall();
    const dir = Math.sign(this.bal);
    this.chair.setAngle(dir * 40);
    this.aurChair.setVisible(false);
    const p = this.add.image(this.chair.x + dir * 10, this.chair.y + 50, 'aurelio').setScale(2).setDepth(9);
    this.floatText(W / 2, this.chair.y - 20, M.fallLine, '#ff6b5b');
    this.tweens.add({ targets: p, x: p.x + dir * 50, y: H - 140, angle: dir * 540 + 180, duration: 1000, ease: 'Quad.in',
      onComplete: () => {
        p.setAngle(180).setPosition(p.x, H - 150);
        this.cameras.main.shake(250, 0.015); sfx.hit();
        // mucchio di neve: si vedono solo le gambe
        this.add.ellipse(p.x, H - 120, 74, 36, 0xffffff).setStrokeStyle(2, 0xc8d4e4).setDepth(10);
        const e = this.add.particles(p.x, H - 130, 'spark', { speed: { min: 40, max: 120 }, angle: { min: 200, max: 340 }, lifespan: 500, quantity: 16, emitting: false }).setDepth(11);
        e.explode(16);
        this.time.delayedCall(1300, () => this.result(false, M.fallLine));
      } });
  }

  arrive() {
    this.phase = 'done'; sfx.win();
    const j = this.add.image(W / 2, -40, 'javier').setScale(4).setDepth(30);
    this.tweens.add({ targets: j, y: 110, duration: 700, ease: 'Back.out' });
    const box = this.add.rectangle(W / 2, 200, W - 20, 76, 0x1a1423, 0.9).setStrokeStyle(2, 0xf4d03f).setDepth(30).setAlpha(0);
    const line = txt(this, W / 2, 200, FRIENDS.javier.endLine, 8, '#ffffff').setDepth(31).setAlpha(0);
    this.tweens.add({ targets: [box, line], alpha: 1, delay: 700, duration: 300 });
    this.time.delayedCall(3600, () => { j.destroy(); box.destroy(); line.destroy(); this.result(true); });
  }

  // ---------- risultato ----------
  result(win, why) {
    this.phase = 'result'; this.canLeave = false;
    const R = M.reward;
    const g = this.add.container(0, 0).setDepth(50);
    g.add(this.add.rectangle(W / 2, H / 2, W - 30, 220, 0x1a1423, 0.95).setStrokeStyle(3, win ? 0x3a8a3a : 0xc0392b));
    if (win) {
      g.add(txt(this, W / 2, H / 2 - 74, 'IN CIMA!', 16, '#f4d03f'));
      g.add(txt(this, W / 2, H / 2 - 30, '+' + R.points + ' PUNTI\n+' + R.life + ' VITA', 9, '#ffffff'));
      g.add(txt(this, W / 2, H / 2 + 14, 'SCI-BLASTER!', 10, '#bfe3f0'));
      g.add(txt(this, W / 2, H / 2 + 38, 'SPARA GLI SCI CONTRO\nPIZZE E ROCCE', 7, '#bfe3f0'));
    } else {
      g.add(txt(this, W / 2, H / 2 - 74, 'CADUTO!', 16, '#ff6b5b'));
      g.add(txt(this, W / 2, H / 2 - 40, why || '', 8, '#ffffff'));
      g.add(this.add.image(W / 2, H / 2 + 4, 'stampelle').setScale(2));
      g.add(txt(this, W / 2, H / 2 + 40, 'TORNI IN\nSTAMPELLE ROSSE', 8, '#ff9ecb'));
    }
    const go = txt(this, W / 2, H / 2 + 86, 'TOCCA PER CONTINUARE', 7, '#f08a24');
    g.add(go);
    this.tweens.add({ targets: go, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
    g.setAlpha(0).setY(30);
    this.tweens.add({ targets: g, alpha: 1, y: 0, duration: 250, ease: 'Back.out' });
    this.win = win;
    this.time.delayedCall(800, () => { this.canLeave = true; });
  }

  leave() {
    this.phase = 'left';
    const res = { mini: 'javier', win: this.win };
    if (this.standalone) { this.scene.start('Menu'); return; }
    this.scene.stop();
    this.scene.resume('Level', res);
  }

  floatText(x, y, s, color) {
    const t = txt(this, Phaser.Math.Clamp(x, 80, W - 80), y, s, 8, color).setDepth(25);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, delay: 500, duration: 900, onComplete: () => t.destroy() });
  }
}
