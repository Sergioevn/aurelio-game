import { W, H, txt, save, VERSION } from '../util.js';
import { sfx } from '../sfx.js';
import { FRIENDS } from '../data/characters.js';

export class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.bg = this.add.tileSprite(W / 2, H / 2, W, H, 'road').setAlpha(0.5);

    txt(this, W / 2, 56, 'AURELIO', 22, '#f4d03f');
    txt(this, W / 2, 86, 'SOPRAVVIVE', 12, '#ffffff');
    txt(this, W / 2, 106, "ALL'ITALIA", 12, '#ffffff');
    txt(this, W / 2, 128, 'de Sevilla a Milano', 7, '#f08a24');

    const a = this.add.image(W / 2, 200, 'aurelio').setScale(3);
    this.tweens.add({ targets: a, y: 192, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // Facce degli amici in fila
    const keys = Object.keys(FRIENDS);
    keys.forEach((k, i) => {
      const f = this.add.image(W / 2 + (i - (keys.length - 1) / 2) * 40, 272, k).setScale(2);
      this.tweens.add({ targets: f, y: 266, duration: 400, delay: i * 120, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });

    const play = txt(this, W / 2, 330, 'TOCCA PER GIOCARE', 10, '#ffffff');
    this.tweens.add({ targets: play, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });

    txt(this, W / 2, 360, 'RECORD: ' + save.get('best', 0), 8, '#bfe3f0');
    txt(this, W - 22, H - 10, VERSION, 7, '#c8b49a'); // versione: serve per capire se il telefono ha l'ultima (da togliere al rilascio)

    // Audio on/off
    const audio = txt(this, W / 2, 392, 'AUDIO: ' + (sfx.muted ? 'NO' : 'SI'), 8, '#c8b49a')
      .setInteractive({ useHandCursor: true });
    audio.on('pointerdown', (p, x, y, e) => {
      e.stopPropagation();
      sfx.unlock();
      audio.setText('AUDIO: ' + (sfx.toggle() ? 'NO' : 'SI'));
    });

    this.installUI();

    this.input.once('pointerdown', () => this.go());
    this.input.keyboard?.once('keydown-SPACE', () => this.go());
  }

  go() {
    sfx.unlock(); sfx.pick();
    // Link di prova: ...?mini=montagna apre direttamente il mini-gioco
    const mini = new URLSearchParams(location.search).get('mini');
    if (mini === 'montagna') { this.scene.start('MiniMontagna', { standalone: true }); return; }
    if (mini === 'nebbia') { this.scene.start('MiniNebbia', { standalone: true }); return; }
    if (mini === 'quad') { this.scene.start('MiniNebbia', { standalone: true, quad: true }); return; }
    if (mini === 'portafoglio') { this.scene.start('MiniPortafoglio', { standalone: true }); return; }
    if (mini === 'barca') { this.scene.start('MiniPortafoglio', { standalone: true, barca: true }); return; }
    if (mini === 'cheers') { this.scene.start('MiniCheers', { standalone: true }); return; }
    this.scene.start('Level');
  }

  installUI() {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches || navigator.standalone;
    if (standalone) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (window.__installPrompt) {
      const b = txt(this, W / 2, 432, '[ INSTALLA IL GIOCO ]', 8, '#f4d03f').setInteractive();
      b.on('pointerdown', async (p, x, y, e) => {
        e.stopPropagation();
        const pr = window.__installPrompt; window.__installPrompt = null;
        pr.prompt(); await pr.userChoice; b.destroy();
      });
    } else if (ios) {
      txt(this, W / 2, 440, 'PER INSTALLARLO:\nCONDIVIDI -> AGGIUNGI\nALLA SCHERMATA HOME', 7, '#f4d03f');
    }
  }

  update(t, dt) { this.bg.tilePositionY -= dt * 0.03; }
}
