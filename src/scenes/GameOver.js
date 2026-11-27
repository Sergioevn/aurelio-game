import { W, H, txt, save } from '../util.js';

export class GameOver extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data) {
    const score = data.score || 0;
    const best = Math.max(score, save.get('best', 0));
    const isRecord = score > save.get('best', 0);
    save.set('best', best);

    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1423, 0.92);
    txt(this, W / 2, 110, 'GAME OVER', 20, '#c0392b');
    txt(this, W / 2, 150, "L'ITALIA HA VINTO\nQUESTA VOLTA", 8, '#ffffff');
    this.add.image(W / 2, 220, 'aurelio').setScale(3).setAngle(90);

    txt(this, W / 2, 285, 'PUNTI: ' + score, 12, '#f4d03f');
    txt(this, W / 2, 310, isRecord ? 'NUOVO RECORD!' : 'RECORD: ' + best, 8, isRecord ? '#f08a24' : '#bfe3f0');

    const found = data.friends || [];
    txt(this, W / 2, 345, 'AMICI BATTUTI: ' + found.length + '/5', 7, '#c8b49a');

    const again = txt(this, W / 2, 400, 'TOCCA PER RIPROVARE', 9, '#ffffff');
    this.tweens.add({ targets: again, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    this.time.delayedCall(700, () => {
      this.input.once('pointerdown', () => this.scene.start('Level'));
      this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Level'));
    });
  }
}
