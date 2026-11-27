import { PALETTE, SPRITES } from './data/sprites.js';

export const W = 270;
export const H = 480;
export const FONT = 'PressStart';

export function txt(scene, x, y, str, size = 8, color = '#ffffff', origin = 0.5) {
  return scene.add.text(x, y, str, {
    fontFamily: FONT, fontSize: size + 'px', color, align: 'center',
    stroke: '#1a1423', strokeThickness: 3, lineSpacing: 4
  }).setOrigin(origin).setResolution(4);
}

// Disegna gli sprite pixel-art come texture, aggiungendo un contorno scuro
export function makeTextures(scene) {
  for (const [key, rows] of Object.entries(SPRITES)) {
    const w = Math.max(...rows.map(r => r.length)) + 2;
    const h = rows.length + 2;
    const px = (x, y) => {
      const r = rows[y - 1];
      if (!r) return '.';
      return r[x - 1] || '.';
    };
    const tex = scene.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = px(x, y);
        if (c !== '.' && PALETTE[c]) {
          ctx.fillStyle = PALETTE[c];
          ctx.fillRect(x, y, 1, 1);
        } else {
          const near = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => {
            const n = px(x + dx, y + dy);
            return n !== '.' && PALETTE[n];
          });
          if (near) { ctx.fillStyle = '#1a1423'; ctx.fillRect(x, y, 1, 1); }
        }
      }
    }
    tex.refresh();
  }

  // Strada (sfondo che scorre)
  const road = scene.textures.createCanvas('road', W, 64);
  const c = road.getContext();
  c.fillStyle = '#4a4a55'; c.fillRect(0, 0, W, 64);
  for (let i = 0; i < 90; i++) { // granulosità asfalto
    c.fillStyle = Math.random() < 0.5 ? '#43434d' : '#52525e';
    c.fillRect(Math.floor(Math.random() * W), Math.floor(Math.random() * 64), 2, 1);
  }
  c.fillStyle = '#b8a888'; c.fillRect(0, 0, 22, 64); c.fillRect(W - 22, 0, 22, 64); // marciapiedi
  c.fillStyle = '#9c8e72';
  for (let y = 0; y < 64; y += 16) { c.fillRect(0, y, 22, 1); c.fillRect(W - 22, y, 22, 1); }
  c.fillStyle = '#e8e8e8'; c.fillRect(22, 0, 2, 64); c.fillRect(W - 24, 0, 2, 64);
  c.fillStyle = '#f4d03f'; c.fillRect(W / 2 - 1, 8, 3, 28); // linea di mezzeria
  road.refresh();

  // Particella
  const p = scene.textures.createCanvas('spark', 2, 2);
  p.getContext().fillStyle = '#ffffff'; p.getContext().fillRect(0, 0, 2, 2); p.refresh();
}

// Salvataggio sicuro
export const save = {
  get(k, def) { try { const v = localStorage.getItem('aurelio_' + k); return v === null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem('aurelio_' + k, JSON.stringify(v)); } catch {} }
};
