// Mini-gioco di Javier: MONTAGNA
// Fase 1 "La pista": Aurelio risale la pista evitando pali arancioni e sciatori.
// Fase 2 "La seggiovia": il vento porta via il guanto, Aurelio cade e deve riprenderlo in caduta libera.
import { W, H, txt, PLAYER_Y } from '../util.js';
import { sfx } from '../sfx.js';
import { FRIENDS, MONTAGNA as M } from '../data/characters.js';

export class MiniMontagna extends Phaser.Scene {
  constructor() { super('MiniMontagna'); }

  init(data) { this.standalone = !!data?.standalone; }

  create() {
    this.phase = 'intro'; this.elapsed = 0; this.crashes = 0; this.stunMs = 0;
    this.dist = 0; this.gates = 0; this.streak = 0; this.invMs = 0; this.gateList = [];
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'snow');
    this.nets = this.add.graphics().setDepth(1);
    this.items = this.physics.add.group();
    this.decor = this.add.group();

    this.player = this.physics.add.sprite(W / 2, PLAYER_Y, 'aurelio').setScale(2).setDepth(5);
    this.player.body.setSize(10, 14).setOffset(4, 12);
    this.skis = this.add.image(W / 2, PLAYER_Y + 24, 'sci_coppia').setScale(2).setDepth(4);
    this.stars = this.add.container(0, 0).setDepth(7).setVisible(false);
    for (let i = 0; i < 3; i++) this.stars.add(this.add.image(0, 0, 'stella').setScale(1.5));

    this.targetX = null;
    this.input.on('pointerdown', p => this.onDown(p));
    this.input.on('pointermove', p => { if (p.isDown && (this.phase === 'pista' || this.phase === 'caduta')) this.targetX = p.x; });
    this.input.on('pointerup', () => { this.targetX = null; });
    this.keys = this.input.keyboard?.createCursorKeys();
    this.physics.add.overlap(this.player, this.items, (pl, it) => this.onHit(it));

    // HUD
    this.add.rectangle(W / 2, 12, W, 24, 0x1a1423, 0.75).setDepth(20);
    this.title = txt(this, 8, 12, 'LA PISTA', 8, '#f4d03f', 0).setOrigin(0, 0.5).setDepth(21);
    this.info = txt(this, W - 8, 12, '', 7, '#ffffff', 0).setOrigin(1, 0.5).setDepth(21);
    this.timeBar = this.add.rectangle(0, 25, W, 3, 0xf08a24).setOrigin(0, 0.5).setDepth(21);
    this.gateText = txt(this, 8, 38, '', 7, '#3a8a3a', 0).setOrigin(0, 0.5).setDepth(21).setStroke('#ffffff', 3);
    this.gateDots = [];
    for (let i = 0; i < M.gatesForBoost; i++) this.gateDots.push(this.add.rectangle(90 + i * 11, 38, 7, 7, 0xffffff).setStrokeStyle(2, 0x1a1423).setDepth(21));

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
    g.add(txt(this, W / 2, H / 2 + 52, 'PASSA TRA I PALI\nEVITA GLI SCIATORI', 7, '#bfe3f0'));
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
    if (this.phase === 'caduta') { this.targetX = p.x; return; }
    if (this.phase === 'result' && this.canLeave) this.leave();
  }

  update(t, dt) {
    if (this.phase === 'pista') this.updatePista(dt);
    else if (this.phase === 'lift') this.updateLift(dt);
    else if (this.phase === 'caduta') this.updateFall(dt);
  }

  // ---------- FASE 1: la pista ----------
  // La pista è delimitata da reti arancioni che si stringono e curvano.
  corridor(d) {
    const prog = Phaser.Math.Clamp(this.elapsed / M.pistaMs, 0, 1);
    const half = M.pistaHalfStart - (M.pistaHalfStart - M.pistaHalfEnd) * prog;
    let c = W / 2 + Math.sin(d / 240) * (25 + 25 * prog) + Math.sin(d / 97) * 8;
    c = Phaser.Math.Clamp(c, half + 8, W - half - 8);
    return { l: c - half, r: c + half };
  }

  drawNets() {
    const g = this.nets; g.clear();
    for (let y = -6; y < H; y += 6) {
      const d = this.dist + (H - y);
      const { l, r } = this.corridor(d);
      g.fillStyle(0xd6dfeb, 1); g.fillRect(0, y, l, 6); g.fillRect(r, y, W - r, 6); // fuori pista
      if (Math.floor(d / 6) % 2) { g.fillStyle(0xf08a24, 1); g.fillRect(l - 2, y, 3, 6); g.fillRect(r - 1, y, 3, 6); }
      else { g.fillStyle(0x1a1423, 1); g.fillRect(l - 1, y, 1, 6); g.fillRect(r, y, 1, 6); }
    }
  }

  updatePista(dt) {
    this.elapsed += dt;
    const speed = 150 + this.elapsed / 1000 * 4;
    const stunned = this.stunMs > 0;
    const scroll = (stunned ? speed * 0.25 : speed) * dt / 1000;
    this.dist += scroll;
    this.bg.tilePositionY -= scroll;
    this.drawNets();
    for (const d of this.decor.getChildren()) { d.y += scroll; if (d.y > H + 30) d.destroy(); }
    for (const it of [...this.items.getChildren()]) {
      it.y += scroll * (it.kind === 'sciatore' ? it.fast : 1);
      if (it.kind === 'sciatore' && !it.hitDone) it.x = it.baseX + Math.sin((this.elapsed + it.seed) / 330) * it.amp;
      if (it.y > H + 40) it.destroy();
    }

    // Movimento di Aurelio (non può uscire dalle reti)
    const p = this.player;
    const lane = this.corridor(this.dist + (H - p.y));
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
      const step = 240 * dt / 1000;
      if (this.keys?.left.isDown) p.x -= step;
      else if (this.keys?.right.isDown) p.x += step;
      else if (this.targetX !== null) { const dx = this.targetX - p.x; p.x += Math.sign(dx) * Math.min(Math.abs(dx), step); }
      p.y = PLAYER_Y + Math.abs(Math.sin(this.elapsed / 120)) * 2; // passo da risalita
    }
    p.x = Phaser.Math.Clamp(p.x, lane.l + 12, lane.r - 12);
    this.skis.setPosition(p.x, PLAYER_Y + 24).setAngle(p.angle);

    // Vin brulé: invincibile
    if (this.invMs > 0) {
      this.invMs -= dt;
      p.setTint(Math.floor(this.elapsed / 90) % 2 ? 0xffe066 : 0xffffff);
      if (this.invMs <= 0) p.clearTint();
    }

    this.checkGates();

    // Comparsa ostacoli e decorazioni
    this.spawnMs -= dt;
    if (this.spawnMs <= 0 && this.elapsed < M.pistaMs - 1500) {
      if (Math.random() < 0.55) this.spawnGate();
      else { this.spawnSkier(0); if (Math.random() < 0.2 + this.elapsed / M.pistaMs * 0.3) this.spawnSkier(-70); }
      this.spawnMs = Math.max(600, 1050 - this.elapsed / 1000 * 22);
    }
    if (Math.random() < dt / 450) {
      const { l, r } = this.corridor(this.dist + H + 30);
      const side = Math.random() < 0.5;
      if (side && l > 22) this.decor.add(this.add.image(Phaser.Math.Between(8, l - 12), -30, 'abete').setScale(2).setDepth(2));
      if (!side && W - r > 22) this.decor.add(this.add.image(Phaser.Math.Between(r + 12, W - 8), -30, 'abete').setScale(2).setDepth(2));
    }

    this.info.setText('SCHIANTI ' + this.crashes + '/' + M.maxCrash);
    this.gateText.setText('PORTE ' + this.gates);
    const lit = this.invMs > 0 ? M.gatesForBoost : this.streak % M.gatesForBoost;
    this.gateDots.forEach((d, i) => d.setFillStyle(i < lit ? 0xf4d03f : 0xffffff));
    this.timeBar.width = W * Math.max(0, 1 - this.elapsed / M.pistaMs);
    if (this.elapsed >= M.pistaMs) { this.player.clearTint(); this.invMs = 0; this.startSeggiovia(); }
  }

  spawnGate() {
    const { l, r } = this.corridor(this.dist + H + 30);
    const gap = Math.max(M.gateGapEnd, M.gateGapStart - this.elapsed / M.pistaMs * (M.gateGapStart - M.gateGapEnd));
    const cx = Phaser.Math.Between(Math.ceil(l + gap / 2 + 8), Math.floor(Math.max(l + gap / 2 + 8, r - gap / 2 - 8)));
    const gate = { poles: [], done: false };
    for (const x of [cx - gap / 2, cx + gap / 2]) {
      const it = this.items.create(x, -30, 'palo').setScale(2).setDepth(3);
      it.kind = 'palo'; it.body.setSize(3, 8).setOffset(1, 7); it.gate = gate;
      gate.poles.push(it);
    }
    this.gateList.push(gate);
  }

  spawnSkier(dy) {
    const { l, r } = this.corridor(this.dist + H + 30 - dy);
    const it = this.items.create(0, -30 + dy, 'sciatore').setScale(2).setDepth(3);
    it.kind = 'sciatore'; it.seed = Math.random() * 3000;
    it.amp = Math.min(35, (r - l) / 2 - 16);
    it.baseX = Phaser.Math.Between(Math.ceil(l + 16 + it.amp), Math.floor(Math.max(l + 16 + it.amp, r - 16 - it.amp)));
    it.fast = Phaser.Math.FloatBetween(1.7, 2.1);
    it.x = it.baseX; it.body.setSize(8, 10).setOffset(3, 4);
  }

  // Passare in mezzo a due pali = porta. Ogni N porte di fila: vin brulé (invincibile).
  checkGates() {
    const p = this.player;
    for (const g of this.gateList) {
      if (g.done) continue;
      const [a, b] = g.poles;
      if (!a.active || !b.active) { g.done = true; continue; }
      if (a.y < p.y - 4) continue;
      g.done = true;
      if (a.body.enable && b.body.enable && p.x > a.x && p.x < b.x) {
        this.gates++; this.streak++; sfx.pick();
        this.floatText(p.x, p.y - 40, 'PORTA! +' + M.gatePoints, '#3a8a3a');
        if (this.streak % M.gatesForBoost === 0) {
          this.invMs = M.boostMs; sfx.boost();
          this.time.delayedCall(250, () => this.floatText(p.x, p.y - 60, 'VIN BRULÉ!\nINVINCIBILE', '#f4d03f'));
        }
      } else if (this.invMs <= 0) this.streak = 0;
    }
    this.gateList = this.gateList.filter(g => !g.done);
  }

  onHit(it) {
    if (this.phase !== 'pista' || this.stunMs > 0 || !it.active || !it.body.enable) return;
    if (this.invMs > 0) { // con il vin brulé si travolge tutto
      it.body.enable = false; sfx.smash();
      this.floatText(it.x, it.y - 20, 'OLÉ!', '#ffffff');
      this.tweens.add({ targets: it, angle: it.x < this.player.x ? -540 : 540, x: it.x + (it.x < this.player.x ? -80 : 80), alpha: 0, duration: 500, onComplete: () => it.destroy() });
      return;
    }
    this.crashes++; this.streak = 0;
    this.cameras.main.shake(180, 0.012); sfx.hit();
    if (it.kind === 'palo') {
      this.stunMs = M.stunPalo;
      this.floatText(this.player.x, this.player.y - 46, M.crashLine, '#ff6b5b');
      this.tweens.add({ targets: it, angle: it.x < this.player.x ? -70 : 70, duration: 200 }); // il palo si piega
      it.body.enable = false;
    } else {
      this.stunMs = M.stunSciatore; it.hitDone = true;
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

  // ---------- FASE 2: la seggiovia e il guanto ----------
  // Aurelio sale in seggiovia, il vento gli porta via un guanto, si sporge e cade.
  // In caduta libera deve restare in linea col guanto per raggiungerlo prima della neve.
  startSeggiovia() {
    this.phase = 'trans';
    this.stars.setVisible(false);
    this.items.clear(true, true);
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff).setDepth(30).setAlpha(0);
    this.tweens.add({ targets: flash, alpha: 1, duration: 300, yoyo: true, hold: 200, onYoyo: () => this.setupSeggiovia() });
  }

  setupSeggiovia() {
    this.decor.clear(true, true); this.nets.clear(); this.gateText.setVisible(false); this.gateDots.forEach(d => d.setVisible(false));
    this.player.setVisible(false); this.skis.setVisible(false);
    this.player.body.enable = false;
    this.title.setText('LA SEGGIOVIA'); this.info.setText('');
    this.lift = this.add.container(0, 0).setDepth(6);

    // Cavo in diagonale con il seggiolino
    const ax = W / 2, ay = 170;
    this.lift.add(this.add.line(0, 0, -20, ay + (W / 2 + 20) * 0.6, W + 20, ay - (W / 2 + 20) * 0.6, 0x1a1423).setOrigin(0).setLineWidth(2));
    this.chair = this.add.container(ax, ay).setDepth(8);
    const seat = this.add.image(0, 0, 'seggiolino').setScale(2).setOrigin(0.5, 0);
    const aur = this.add.image(0, 22, 'aurelio').setScale(2).setOrigin(0.5, 0).setCrop(0, 0, 18, 19);
    const legs = this.add.rectangle(0, 58, 24, 10, 0x3d5a8a).setStrokeStyle(2, 0x1a1423);
    const bar = this.add.image(0, 50, 'barra_seggiola').setScale(2).setOrigin(0.5, 0);
    this.chair.add([seat, aur, legs, bar]);
    this.aurChair = aur; this.legsChair = legs;
    for (let i = 0; i < 6; i++) this.lift.add(this.add.image(Phaser.Math.Between(20, W - 20), Phaser.Math.Between(260, H - 20), 'abete').setScale(2));
    this.phase = 'lift'; this.liftMs = 0; this.gloveGone = false;
  }

  updateLift(dt) {
    this.liftMs += dt;
    this.bg.tilePositionX += 60 * dt / 1000; this.bg.tilePositionY -= 30 * dt / 1000;
    this.lift.getAll().forEach(o => { if (o.type === 'Image') { o.x -= 60 * dt / 1000; o.y += 30 * dt / 1000; } });
    this.chair.setAngle(Math.sin(this.liftMs / 400) * 4);
    if (this.liftMs > 1300 && !this.gloveGone) {
      // la folata porta via il guanto
      this.gloveGone = true; sfx.wind();
      const g = this.add.image(this.chair.x + 6, this.chair.y + 44, 'guanto').setScale(2).setDepth(9);
      this.flyGlove = g;
      this.tweens.add({ targets: g, x: this.chair.x + 70, y: H + 40, angle: 540, duration: 1400, ease: 'Quad.in' });
      this.floatText(W / 2, this.chair.y - 20, M.guanteLine, '#ffffff');
      // Aurelio si sporge...
      this.tweens.add({ targets: this.chair, angle: 28, duration: 500, delay: 400, ease: 'Back.out' });
    }
    if (this.liftMs > 2500) this.startFall();
  }

  startFall() {
    this.phase = 'trans2'; sfx.fall();
    // Aurelio scivola giù dal seggiolino
    this.aurChair.setVisible(false); this.legsChair.setVisible(false);
    const p = this.add.image(this.chair.x + 10, this.chair.y + 50, 'aurelio').setScale(2).setDepth(9);
    this.tweens.add({ targets: p, y: H + 60, angle: 200, duration: 700, ease: 'Quad.in', onComplete: () => {
      p.destroy(); this.flyGlove?.destroy();
      this.lift.destroy(); this.chair.destroy();
      this.setupFall();
    } });
  }

  setupFall() {
    this.title.setText('EL GUANTE');
    this.fallY = 110;
    this.faller = this.add.image(W / 2, this.fallY, 'aurelio').setScale(2).setDepth(8).setAngle(180);
    this.stars.setDepth(9);
    this.glove = this.add.image(W / 2, this.fallY + 210, 'guanto').setScale(2.4).setDepth(7);
    this.gap = 210; this.gloveBase = Math.random() < 0.5 ? 70 : W - 80; this.gloveKick = 0;
    this.obst = [];
    this.elapsed = 0; this.spawnMs = 900; this.gustMs = 2200; this.stunMs = 0; this.targetX = null;
    // altimetro
    this.altBar = this.add.rectangle(W - 10, 60, 6, H - 200, 0xffffff).setOrigin(0.5, 0).setStrokeStyle(2, 0x1a1423).setDepth(21);
    this.altMark = this.add.rectangle(W - 10, 60, 12, 6, 0xf4d03f).setStrokeStyle(2, 0x1a1423).setDepth(22);
    const hint = txt(this, W / 2, H / 2 + 30, 'RESTA SOPRA IL GUANTO\nPER RAGGIUNGERLO!', 8, '#ffffff').setDepth(25);
    this.tweens.add({ targets: hint, alpha: 0, delay: 1800, duration: 400, onComplete: () => hint.destroy() });
    this.phase = 'caduta';
  }

  updateFall(dt) {
    const s = dt / 1000;
    this.elapsed += dt;
    const fall = 320;
    this.bg.tilePositionY += fall * s; // il mondo sale = Aurelio cade

    // Movimento di Aurelio
    const p = this.faller;
    if (this.stunMs > 0) {
      this.stunMs -= dt;
      this.stars.setVisible(true).setPosition(p.x, p.y + 30);
      this.stars.getAll().forEach((st, i) => { const a = this.elapsed / 150 + i * 2.1; st.setPosition(Math.cos(a) * 14, Math.sin(a) * 4); });
      p.setAngle(180 + Math.sin(this.elapsed / 50) * 20);
    } else {
      this.stars.setVisible(false);
      const step = 220 * s;
      if (this.keys?.left.isDown) p.x -= step;
      else if (this.keys?.right.isDown) p.x += step;
      else if (this.targetX !== null) { const dx = this.targetX - p.x; p.x += Math.sign(dx) * Math.min(Math.abs(dx), step); }
      p.x = Phaser.Math.Clamp(p.x, 22, W - 26);
      p.setAngle(180 + Math.sin(this.elapsed / 180) * 6);
    }

    // Il guanto svolazza; ogni tanto una folata lo sposta di lato
    this.gustMs -= dt;
    if (this.gustMs <= 0) {
      this.gustMs = Phaser.Math.Between(1800, 2800);
      const dir = this.gloveBase < W / 2 ? 1 : -1; // la folata lo porta dall'altra parte
      this.tweens.add({ targets: this, gloveBase: Phaser.Math.Clamp(this.gloveBase + dir * Phaser.Math.Between(90, 150), 60, W - 70), duration: 600, ease: 'Sine.inOut' });
      sfx.wind();
    }
    const gx = Phaser.Math.Clamp(this.gloveBase + Math.sin(this.elapsed / 380) * 34, 24, W - 30);
    const dxG = Math.abs(gx - p.x);
    const align = this.stunMs > 0 ? 0 : 1 - Phaser.Math.Clamp((dxG - 8) / 32, 0, 1);
    this.gap += (M.driftAway - (M.catchRate + M.driftAway) * align) * s;
    this.gap = Phaser.Math.Clamp(this.gap, 0, 300);
    this.glove.setPosition(gx, this.fallY + 20 + this.gap).setAngle(Math.sin(this.elapsed / 200) * 25);
    // linea tratteggiata "di mira" quando sei in linea
    this.glove.setTint(align > 0.6 ? 0xffffff : 0xdddddd);

    // Ostacoli: rami e piloni salgono dal basso
    this.spawnMs -= dt;
    if (this.spawnMs <= 0 && this.elapsed < M.cadutaMs - 1500) {
      this.spawnMs = Phaser.Math.Between(700, 1000);
      if (Math.random() < 0.7) {
        const left = Math.random() < 0.5;
        const o = this.add.image(left ? 0 : W, H + 20, 'ramo').setScale(2).setOrigin(0, 0.5).setDepth(6);
        if (!left) o.setFlipX(true).setOrigin(1, 0.5);
        o.kind = 'ramo'; this.obst.push(o);
      } else {
        const o = this.add.rectangle(Phaser.Math.Between(40, W - 40), H + 80, 10, 150, 0x8a8a96).setStrokeStyle(2, 0x1a1423).setDepth(6);
        o.kind = 'pilone'; this.obst.push(o);
      }
    }
    const pb = new Phaser.Geom.Rectangle(p.x - 12, p.y - 20, 24, 40);
    for (const o of this.obst) {
      o.y -= fall * s;
      if (!o.hit && this.stunMs <= 0 && Phaser.Geom.Intersects.RectangleToRectangle(pb, o.getBounds())) {
        o.hit = true; this.stunMs = 700; this.gap = Math.min(300, this.gap + 70);
        sfx.hit(); this.cameras.main.shake(150, 0.01);
        this.floatText(p.x, p.y + 50, o.kind === 'ramo' ? '¡AY! UN RAMO' : '¡AY! IL PILONE', '#ff6b5b');
      }
    }
    this.obst = this.obst.filter(o => { if (o.y < -120) { o.destroy(); return false; } return true; });

    // Altimetro e tempo
    const prog = Math.min(1, this.elapsed / M.cadutaMs);
    this.altMark.y = this.altBar.y + this.altBar.height * prog;
    this.info.setText(Math.max(0, Math.round((1 - prog) * 120)) + ' M');
    this.timeBar.width = W * (1 - prog);

    // Preso!
    if (this.gap < 26 && dxG < 22 && this.stunMs <= 0) { this.land(true); return; }
    if (this.elapsed >= M.cadutaMs) this.land(false);
  }

  // Atterraggio: in ogni caso a testa in giù nella neve (inside joke)
  land(caught) {
    this.phase = 'done';
    this.stars.setVisible(false);
    this.obst.forEach(o => o.destroy()); this.obst = [];
    const p = this.faller;
    if (caught) { this.glove.setVisible(false); sfx.boost(); this.floatText(p.x, p.y + 40, 'PRESO!', '#f4d03f'); }
    const gy = 300; // livello della neve
    const ground = this.add.rectangle(W / 2, H + 10, W, H, 0xf2f6fc).setOrigin(0.5, 0).setDepth(9);
    this.tweens.add({ targets: ground, y: gy, duration: 600, ease: 'Quad.out' });
    this.tweens.add({ targets: p, y: gy - 6, x: Phaser.Math.Clamp(p.x, 60, W - 60), angle: 180, duration: 600, ease: 'Quad.in', onComplete: () => {
      this.cameras.main.shake(260, 0.018); sfx.hit();
      p.setDepth(8);
      this.add.ellipse(p.x, gy + 2, 76, 30, 0xffffff).setStrokeStyle(2, 0xc8d4e4).setDepth(10);
      const e = this.add.particles(p.x, gy, 'spark', { speed: { min: 40, max: 130 }, angle: { min: 200, max: 340 }, lifespan: 500, quantity: 18, emitting: false }).setDepth(11);
      e.explode(18);
      if (caught) {
        // un braccio spunta dalla neve e sventola il guanto
        const arm = this.add.container(p.x + 26, gy - 4).setDepth(11);
        arm.add(this.add.rectangle(0, 0, 6, 22, 0xeab38b).setOrigin(0.5, 1).setStrokeStyle(2, 0x1a1423));
        arm.add(this.add.image(0, -26, 'guanto').setScale(2));
        arm.setScale(1, 0);
        this.tweens.add({ targets: arm, scaleY: 1, duration: 300, delay: 300 });
        this.tweens.add({ targets: arm, angle: { from: -20, to: 20 }, duration: 260, yoyo: true, repeat: -1, delay: 600 });
        this.time.delayedCall(500, () => this.floatText(W / 2, gy + 50, M.tengoLine, '#f4d03f'));
        this.time.delayedCall(2000, () => this.arrive());
      } else {
        // il guanto si posa con calma lì accanto
        this.glove.setDepth(11);
        this.tweens.add({ targets: this.glove, x: p.x + 50, y: gy + 6, angle: 0, duration: 1400, ease: 'Sine.out' });
        this.time.delayedCall(2200, () => this.result(false, 'SENZA GUANTO...'));
      }
    } });
  }

  arrive() {
    this.phase = 'done'; sfx.win();
    const j = this.add.image(W / 2, -40, 'javier').setScale(4).setDepth(30);
    this.tweens.add({ targets: j, y: 80, duration: 700, ease: 'Back.out' });
    const box = this.add.rectangle(W / 2, 172, W - 20, 76, 0x1a1423, 0.9).setStrokeStyle(2, 0xf4d03f).setDepth(30).setAlpha(0);
    const line = txt(this, W / 2, 172, FRIENDS.javier.endLine, 8, '#ffffff').setDepth(31).setAlpha(0);
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
      g.add(txt(this, W / 2, H / 2 - 30, '+' + (R.points + this.gates * M.gatePoints) + ' PUNTI\n+' + R.life + ' VITA', 9, '#ffffff'));
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
    const res = { mini: 'javier', win: this.win, bonus: this.gates * M.gatePoints };
    if (this.standalone) { this.scene.start('Menu'); return; }
    this.scene.stop();
    this.scene.resume('Level', res);
  }

  floatText(x, y, s, color) {
    const t = txt(this, Phaser.Math.Clamp(x, 80, W - 80), y, s, 8, color).setDepth(25);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, delay: 500, duration: 900, onComplete: () => t.destroy() });
  }
}
