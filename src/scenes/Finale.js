import { W, H, txt, save } from '../util.js';
import { sfx } from '../sfx.js';
import { FRIENDS } from '../data/characters.js';

// Schermata finale: Aurelio ha battuto tutti gli amici
export const MESSAGGIO_SERGIO = '[QUI IL MESSAGGIO\nDI SERGIO]';

export class Finale extends Phaser.Scene {
  constructor() { super('Finale'); }

  create(data) {
    const score = data?.score || 0;
    const isRecord = score > save.get('best', 0);
    save.set('best', Math.max(score, save.get('best', 0)));

    this.add.tileSprite(W / 2, H / 2, W, H, 'road').setAlpha(0.35);
    txt(this, W / 2, 56, 'HAI VINTO!', 20, '#f4d03f');
    txt(this, W / 2, 88, "AURELIO E' SOPRAVVISSUTO\nALL'ITALIA", 8, '#ffffff');

    const a = this.add.image(W / 2, 150, 'aurelio').setScale(3);
    this.tweens.add({ targets: a, y: 140, duration: 350, yoyo: true, repeat: -1, ease: 'Sine.out' });
    const keys = Object.keys(FRIENDS);
    keys.forEach((k, i) => {
      const f = this.add.image(W / 2 + (i - (keys.length - 1) / 2) * 42, 218, k).setScale(2);
      this.tweens.add({ targets: f, y: 210, duration: 300, delay: i * 90, yoyo: true, repeat: -1 });
    });

    this.add.rectangle(W / 2, 300, W - 30, 90, 0x1a1423, 0.9).setStrokeStyle(2, 0xf4d03f);
    txt(this, W / 2, 300, MESSAGGIO_SERGIO, 8, '#ffffff');

    txt(this, W / 2, 370, 'PUNTI: ' + score, 11, '#f4d03f');
    if (isRecord) txt(this, W / 2, 392, 'NUOVO RECORD!', 8, '#f08a24');
    const again = txt(this, W / 2, 432, 'TOCCA PER TORNARE AL MENU', 7, '#ffffff');
    this.tweens.add({ targets: again, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    // un po' di festa
    const e = this.add.particles(0, -10, 'spark', { x: { min: 0, max: W }, speedY: { min: 40, max: 120 }, lifespan: 4000, frequency: 60,
      tint: [0xf4d03f, 0xc0392b, 0x3a8a3a, 0xbfe3f0], scale: 2 });
    e.setDepth(-1);
    this.time.delayedCall(1200, () => this.input.once('pointerdown', () => this.scene.start('Menu')));
  }
}
