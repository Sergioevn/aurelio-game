// Versione dell'app mostrata nel menu. A ogni rilascio aggiornala INSIEME a CACHE_VERSION in sw.js.
export const VERSION = 'v2.3';

import { PALETTE, SPRITES } from './data/sprites.js';

export const W = 270;
export const H = 480;
export const FONT = 'PressStart';
// Altezza del personaggio: alzato per lasciare in basso una fascia libera dove appoggiare il dito
export const PLAYER_Y = H - 140;
// Raggio del buco nella texture 'nebbia'
export const FOG_R = 62;

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

  // Neve della pista
  const snow = scene.textures.createCanvas('snow', W, 96);
  const n = snow.getContext();
  n.fillStyle = '#f2f6fc'; n.fillRect(0, 0, W, 96);
  for (let i = 0; i < 160; i++) {
    n.fillStyle = Math.random() < 0.5 ? '#dfe8f4' : '#ffffff';
    n.fillRect(Math.floor(Math.random() * W), Math.floor(Math.random() * 96), 2, 1);
  }
  n.fillStyle = '#d3deec'; // tracce di sci
  for (let y = 0; y < 96; y++) {
    const x1 = 60 + Math.round(Math.sin(y / 15.3) * 14), x2 = 190 + Math.round(Math.sin(y / 15.3 + 2) * 18);
    n.fillRect(x1, y, 1, 1); n.fillRect(x1 + 4, y, 1, 1); n.fillRect(x2, y, 1, 1); n.fillRect(x2 + 4, y, 1, 1);
  }
  snow.refresh();

  // Nebbia: una grande lastra di fumo con un buco sfumato al centro (raggio FOG_R).
  // Si mette centrata su Aurelio; scalandola si allarga o stringe il buco.
  const FW = W * 3, FH = H * 3;
  const fog = scene.textures.createCanvas('nebbia', FW, FH);
  const fc = fog.getContext();
  fc.fillStyle = '#8a8c94'; fc.fillRect(0, 0, FW, FH);
  for (let i = 0; i < 2500; i++) { // un po' di grana nel fumo
    fc.fillStyle = Math.random() < 0.5 ? '#80828a' : '#94969e';
    fc.fillRect(Math.floor(Math.random() * FW), Math.floor(Math.random() * FH), 3, 3);
  }
  fc.globalCompositeOperation = 'destination-out';
  const grad = fc.createRadialGradient(FW / 2, FH / 2, 0, FW / 2, FH / 2, FOG_R * 1.3);
  grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(0.65, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  fc.fillStyle = grad; fc.fillRect(0, 0, FW, FH);
  fc.globalCompositeOperation = 'source-over';
  fog.refresh();

  // Tenda di fumo: scende da Lollo all'inizio del mini-gioco (bordo inferiore sfumato)
  const TH = H + 100;
  const tenda = scene.textures.createCanvas('nebbia_tenda', W, TH);
  const tc = tenda.getContext();
  const tg = tc.createLinearGradient(0, TH - 100, 0, TH);
  tg.addColorStop(0, 'rgba(138,140,148,1)'); tg.addColorStop(1, 'rgba(138,140,148,0)');
  tc.fillStyle = '#8a8c94'; tc.fillRect(0, 0, W, TH - 100);
  tc.fillStyle = tg; tc.fillRect(0, TH - 100, W, 100);
  tenda.refresh();

  // Mare (sfondo della barca di Antonio)
  const sea = scene.textures.createCanvas('mare', W, 96);
  const sc = sea.getContext();
  sc.fillStyle = '#2b6ea8'; sc.fillRect(0, 0, W, 96);
  for (let i = 0; i < 70; i++) {
    sc.fillStyle = Math.random() < 0.6 ? '#3a82c0' : '#5c9fd6';
    sc.fillRect(Math.floor(Math.random() * W), Math.floor(Math.random() * 96), Phaser.Math.Between(4, 10), 1);
  }
  sea.refresh();

  // Onda: cresta di schiuma bianca su un'onda blu scuro (40x14)
  const wave = scene.textures.createCanvas('onda', 40, 14);
  const wc = wave.getContext();
  wc.fillStyle = '#1a1423'; wc.beginPath(); wc.ellipse(20, 9, 20, 5, 0, 0, Math.PI * 2); wc.fill();
  wc.fillStyle = '#1d4f80'; wc.beginPath(); wc.ellipse(20, 9, 19, 4, 0, 0, Math.PI * 2); wc.fill();
  wc.fillStyle = '#ffffff';
  for (let x = 2; x < 38; x += 6) { wc.beginPath(); wc.arc(x + 2, 6, 3, 0, Math.PI * 2); wc.fill(); }
  wc.fillStyle = '#bfe3f0'; wc.fillRect(3, 9, 34, 1);
  wave.refresh();

  // Barca vista dall'alto, prua verso l'alto (26x52)
  const boat = scene.textures.createCanvas('barca', 26, 52);
  const bc = boat.getContext();
  const hull = (r, col) => {
    bc.fillStyle = col; bc.beginPath();
    bc.moveTo(13, 1 + (13 - r) * 1.2); bc.quadraticCurveTo(13 + r, 12, 13 + r, 30);
    bc.lineTo(13 + r - 1, 51 - (13 - r)); bc.lineTo(13 - r + 1, 51 - (13 - r)); bc.lineTo(13 - r, 30);
    bc.quadraticCurveTo(13 - r, 12, 13, 1 + (13 - r) * 1.2); bc.fill();
  };
  hull(13, '#1a1423'); hull(12, '#f4f1ea'); hull(10, '#9a6a3a');
  bc.fillStyle = '#5e3a1c';
  for (let y = 14; y < 49; y += 5) bc.fillRect(4, y, 18, 1); // assi del ponte
  bc.fillStyle = '#c0392b'; bc.fillRect(3, 26, 20, 2);       // riga rossa sullo scafo
  boat.refresh();

  // Sterrato (sfondo del quad di Lollo): terra con sassolini ed erba ai bordi
  const dirt = scene.textures.createCanvas('sterrato', W, 96);
  const dc = dirt.getContext();
  dc.fillStyle = '#b08a5a'; dc.fillRect(0, 0, W, 96);
  for (let i = 0; i < 180; i++) {
    dc.fillStyle = Math.random() < 0.5 ? '#a07a4c' : '#c09a68';
    dc.fillRect(Math.floor(Math.random() * W), Math.floor(Math.random() * 96), 2, 2);
  }
  dc.fillStyle = '#6a8a3a'; dc.fillRect(0, 0, 10, 96); dc.fillRect(W - 10, 0, 10, 96);
  dc.fillStyle = '#7fa046';
  for (let y = 0; y < 96; y += 8) { dc.fillRect(8, y, 4, 3); dc.fillRect(W - 12, y + 4, 4, 3); }
  dirt.refresh();

  // Quad visto dall'alto, muso verso l'alto (30x46)
  const qd = scene.textures.createCanvas('quad', 30, 46);
  const qc = qd.getContext();
  const wheel = (x, y) => { qc.fillStyle = '#1a1423'; qc.fillRect(x, y, 7, 11); qc.fillStyle = '#3a3a44'; qc.fillRect(x + 1, y + 1, 5, 9);
    qc.fillStyle = '#1a1423'; for (let i = 2; i < 10; i += 3) qc.fillRect(x + 1, y + i, 5, 1); };
  wheel(0, 3); wheel(23, 3); wheel(0, 32); wheel(23, 32);
  qc.fillStyle = '#1a1423'; qc.fillRect(5, 1, 20, 44);
  qc.fillStyle = '#c0392b'; qc.fillRect(6, 2, 18, 42);
  qc.fillStyle = '#e05a48'; qc.fillRect(7, 3, 16, 8);          // parafango davanti
  qc.fillStyle = '#2a2a2a'; qc.fillRect(4, 12, 22, 2);         // manubrio
  qc.fillStyle = '#f4d03f'; qc.fillRect(9, 3, 3, 2); qc.fillRect(18, 3, 3, 2); // fari
  qc.fillStyle = '#3a3a44'; qc.fillRect(9, 15, 12, 26);        // sella lunga (per due)
  qc.fillStyle = '#4a4a55'; qc.fillRect(10, 16, 10, 24);
  qd.refresh();

  // Buca nello sterrato (18x10)
  const bu = scene.textures.createCanvas('buca', 18, 10);
  const bx = bu.getContext();
  bx.fillStyle = '#1a1423'; bx.beginPath(); bx.ellipse(9, 5, 9, 5, 0, 0, Math.PI * 2); bx.fill();
  bx.fillStyle = '#5a3e22'; bx.beginPath(); bx.ellipse(9, 5, 8, 4, 0, 0, Math.PI * 2); bx.fill();
  bx.fillStyle = '#3a2814'; bx.beginPath(); bx.ellipse(9, 6, 6, 2.5, 0, 0, Math.PI * 2); bx.fill();
  bu.refresh();

  // Aura (alone morbido bianco, colorato con il tint): per racchetta e microfono
  const AS = 32;
  const au = scene.textures.createCanvas('aura', AS, AS);
  const ac = au.getContext();
  const gr = ac.createRadialGradient(AS / 2, AS / 2, 2, AS / 2, AS / 2, AS / 2);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)');
  gr.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  ac.fillStyle = gr; ac.fillRect(0, 0, AS, AS); au.refresh();

  // Particella
  const p =scene.textures.createCanvas('spark', 2, 2);
  p.getContext().fillStyle = '#ffffff'; p.getContext().fillRect(0, 0, 2, 2); p.refresh();
}

// Salvataggio sicuro
export const save = {
  get(k, def) { try { const v = localStorage.getItem('aurelio_' + k); return v === null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem('aurelio_' + k, JSON.stringify(v)); } catch {} }
};
