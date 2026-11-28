import { W, H, FONT } from './util.js';
import { Boot } from './scenes/Boot.js';
import { Menu } from './scenes/Menu.js';
import { Level } from './scenes/Level.js';
import { GameOver } from './scenes/GameOver.js';
import { MiniMontagna } from './scenes/MiniMontagna.js';
import { Finale } from './scenes/Finale.js';
import { MiniNebbia } from './scenes/MiniNebbia.js';
import { MiniPortafoglio } from './scenes/MiniPortafoglio.js';
import { MiniCheers } from './scenes/MiniCheers.js';
import { MiniSoloDieci } from './scenes/MiniSoloDieci.js';

// Installazione PWA (Android/Chrome)
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); window.__installPrompt = e; });

// Service worker per funzionare offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

const start = () => window.game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  pixelArt: true,
  backgroundColor: '#1a1423',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug: false } },
  input: { activePointers: 2 },
  scene: [Boot, Menu, Level, GameOver, MiniMontagna, MiniNebbia, MiniPortafoglio, MiniCheers, MiniSoloDieci, Finale]
});

document.fonts.load(`8px "${FONT}"`).then(start, start);
