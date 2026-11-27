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

  // Viale Lombardia, Milano (sfondo che scorre): viale alberato, 2 corsie per senso
  const RH = 96;
  const road = scene.textures.createCanvas('road', W, RH);
  const c = road.getContext();
  c.fillStyle = '#4a4a55'; c.fillRect(0, 0, W, RH);
  for (let i = 0; i < 140; i++) { // granulosità asfalto
    c.fillStyle = Math.random() < 0.5 ? '#43434d' : '#52525e';
    c.fillRect(Math.floor(Math.random() * W), Math.floor(Math.random() * RH), 2, 1);
  }
  const SW = 26; // marciapiedi
  c.fillStyle = '#b0aaa0'; c.fillRect(0, 0, SW, RH); c.fillRect(W - SW, 0, SW, RH);
  c.fillStyle = '#968f84';
  for (let y = 0; y < RH; y += 12) { c.fillRect(0, y, SW, 1); c.fillRect(W - SW, y, SW, 1); }
  c.fillStyle = '#d8d4cc'; c.fillRect(SW, 0, 2, RH); c.fillRect(W - SW - 2, 0, 2, RH); // cordoli
  // Linee: doppia continua al centro, tratteggiate tra le corsie
  c.fillStyle = '#e8e8e8';
  c.fillRect(W / 2 - 3, 0, 2, RH); c.fillRect(W / 2 + 1, 0, 2, RH);
  const lane = (W / 2 - SW) / 2;
  for (let y = 6; y < RH; y += 32) { c.fillRect(SW + lane - 1, y, 2, 16); c.fillRect(W - SW - lane - 1, y, 2, 16); }
  // Alberi del viale (chioma tonda che sporge sulla strada)
  const tree = (cx, cy) => {
    c.fillStyle = '#1a1423'; c.beginPath(); c.arc(cx, cy, 15, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2f5e2c'; c.beginPath(); c.arc(cx, cy, 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3f7d3a'; c.beginPath(); c.arc(cx - 3, cy - 3, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5a9a4a'; c.fillRect(cx - 7, cy - 8, 3, 3); c.fillRect(cx + 2, cy - 5, 2, 2);
  };
  tree(8, 24); tree(W - 8, 72);
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
