// Regression test: ogni mini-gioco avviato DAL LIVELLO due volte di fila,
// con il primo giro finito nei vari modi (vinto/perso, fase 1/fase 2).
// Uso (dalla cartella del repo): node tools/regress.mjs .   oppure   node tools/regress.mjs . lollo
// Serve Playwright con Chrome installato (cambia executablePath se serve).
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.argv[2]);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/json', '.png': 'image/png', '.css': 'text/css', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.svg': 'image/svg+xml' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 270, height: 480 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e.stack || e)));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.route('http://game.test/**', route => {
  const u = new URL(route.request().url());
  let p = path.join(ROOT, decodeURIComponent(u.pathname));
  if (p.endsWith('/')) p += 'index.html';
  if (!fs.existsSync(p)) return route.fulfill({ status: 404, body: '' });
  route.fulfill({ status: 200, body: fs.readFileSync(p), contentType: MIME[path.extname(p)] || 'application/octet-stream' });
});
await page.goto('http://game.test/index.html');
await page.waitForFunction(() => window.game && window.game.scene.isActive('Menu'), null, { timeout: 15000 });

const ev = (fn, arg) => page.evaluate(fn, arg);
const tap = async () => { const b = await page.locator('canvas').boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height * 0.75); };

async function startLevel() {
  await page.goto('http://game.test/index.html');
  await page.waitForFunction(() => window.game && window.game.scene.isActive('Menu'), null, { timeout: 15000 });
  await ev(() => window.game.scene.getScene('Menu').scene.start('Level'));
  await page.waitForFunction(() => window.game.scene.isActive('Level'));
  await sleep(400);
}
async function launchMini(key, scene) {
  await ev(k => window.game.scene.getScene('Level').startMini(k), key);
  await page.waitForFunction(s => window.game.scene.isActive(s), scene, { timeout: 5000 });
  await sleep(700); await tap(); // supera l'intro
}
const mini = s => `window.game.scene.getScene('${s}')`;
async function waitPhase(scene, phases, ms = 15000) {
  try { await page.waitForFunction(([s, ph]) => ph.includes(window.game.scene.getScene(s).phase), [scene, phases], { timeout: ms }); return true; }
  catch { return false; }
}
async function leaveResult(scene) {
  if (!await waitPhase(scene, ['result'], 15000)) return 'NON arriva al risultato (phase=' + await ev(s => window.game.scene.getScene(s).phase, scene) + ')';
  await sleep(1000); await tap();
  try { await page.waitForFunction(s => !window.game.scene.isActive(s) && window.game.scene.isActive('Level'), scene, { timeout: 4000 }); }
  catch { return 'non torna al livello'; }
  return null;
}
// Controlla che il gioco "si muova" davvero: un contatore di tempo cresce
async function progresses(scene, field, ms = 2500) {
  const a = await ev(([s, f]) => window.game.scene.getScene(s)[f], [scene, field]);
  await sleep(ms);
  const b = await ev(([s, f]) => window.game.scene.getScene(s)[f], [scene, field]);
  return { ok: typeof a === 'number' && b > a + ms * 0.4, a, b };
}

// Come concludere il primo giro, per ogni mini-gioco (scorciatoie sulle funzioni interne)
const CASES = {
  lollo: { scene: 'MiniNebbia', play: ['caccia'], field: 'elapsed', ends: {
    'perso fase 1 (tempo)': async () => { await waitPhase('MiniNebbia', ['caccia']); await ev(() => window.game.scene.getScene('MiniNebbia').lose()); },
    'perso in quad': async () => { await waitPhase('MiniNebbia', ['caccia']); await ev(() => window.game.scene.getScene('MiniNebbia').win()); await waitPhase('MiniNebbia', ['quadIntro']); await sleep(700); await tap(); await waitPhase('MiniNebbia', ['quad']); await sleep(1000); await ev(() => window.game.scene.getScene('MiniNebbia').quadLose('LOLLO È SCESO!')); },
    'vinto in quad': async () => { await waitPhase('MiniNebbia', ['caccia']); await ev(() => window.game.scene.getScene('MiniNebbia').win()); await waitPhase('MiniNebbia', ['quadIntro']); await sleep(700); await tap(); await waitPhase('MiniNebbia', ['quad']); await sleep(1000); await ev(() => window.game.scene.getScene('MiniNebbia').quadWin()); },
  } },
  javier: { scene: 'MiniMontagna', play: ['pista'], field: 'elapsed', ends: {
    'perso in pista (3 schianti)': async () => { await waitPhase('MiniMontagna', ['pista']); await ev(() => { const s = window.game.scene.getScene('MiniMontagna'); s.result(false, 'TEST'); }); },
    'caduta fino in fondo': async () => { await waitPhase('MiniMontagna', ['pista']); await ev(() => { const s = window.game.scene.getScene('MiniMontagna'); s.elapsed = 1e9; }); await waitPhase('MiniMontagna', ['caduta'], 25000); await sleep(1500); await ev(() => { window.game.scene.getScene('MiniMontagna').land(false); }); },
    'caduta vinta': async () => { await waitPhase('MiniMontagna', ['pista']); await ev(() => { const s = window.game.scene.getScene('MiniMontagna'); s.elapsed = 1e9; }); await waitPhase('MiniMontagna', ['caduta'], 25000); await sleep(1500); await ev(() => { window.game.scene.getScene('MiniMontagna').land(true); }); },
  } },
  antonio: { scene: 'MiniPortafoglio', play: ['shop'], field: 'elapsed', ends: {
    'perso nello shopping': async () => { await waitPhase('MiniPortafoglio', ['shop']); await ev(() => window.game.scene.getScene('MiniPortafoglio').shopLost()); },
    'perso in barca (durante un\'onda)': async () => { await waitPhase('MiniPortafoglio', ['shop']); await ev(() => window.game.scene.getScene('MiniPortafoglio').shopDone()); await waitPhase('MiniPortafoglio', ['barca'], 15000); await sleep(1500); await ev(() => { const s = window.game.scene.getScene('MiniPortafoglio'); s.boatHit(); s.boatLost(); }); },
    'vinto in barca': async () => { await waitPhase('MiniPortafoglio', ['shop']); await ev(() => window.game.scene.getScene('MiniPortafoglio').shopDone()); await waitPhase('MiniPortafoglio', ['barca'], 15000); await sleep(1500); await ev(() => window.game.scene.getScene('MiniPortafoglio').boatWin()); },
  } },
  francesco: { scene: 'MiniCheers', play: ['play'], field: 't', ends: {
    'perso': async () => { await waitPhase('MiniCheers', ['play']); await sleep(1500); await ev(() => window.game.scene.getScene('MiniCheers').lose()); },
    'vinto': async () => { await waitPhase('MiniCheers', ['play']); await sleep(1500); await ev(() => window.game.scene.getScene('MiniCheers').win()); },
  } },
  sergio: { scene: 'MiniSoloDieci', play: ['play'], field: 'playT', ends: {
    'perso (DOMS pieni)': async () => { await waitPhase('MiniSoloDieci', ['play']); await sleep(1500); await ev(() => { const s = window.game.scene.getScene('MiniSoloDieci'); s.count = 8; s.real = 19; s.repT = 0; s.repCounted = false; }); },
    'vinto (decima convalidata)': async () => { await waitPhase('MiniSoloDieci', ['play']); await sleep(1500); await ev(() => { const s = window.game.scene.getScene('MiniSoloDieci'); s.count = 9; s.real = 11; s.lastValidRep = -1; s.repT = 100; s.queue = []; s.seg = { type: 'look', ms: 500 }; s.segT = 0; s.check = { resolved: false }; }); },
  }, leave: async () => {
    // vinto: riepilogo -> mattino dopo -> livello; perso: pulsante CONTINUA
    if (!await waitPhase('MiniSoloDieci', ['result'], 15000)) return 'NON arriva al risultato';
    await sleep(1100);
    const win = await ev(() => window.game.scene.getScene('MiniSoloDieci').win_);
    if (win) { await tap(); if (!await waitPhase('MiniSoloDieci', ['morning'], 3000)) return 'niente scena del mattino'; }
    else await tap();   // perso: nel livello niente RIPROVA, un tocco e si continua
    try { await page.waitForFunction(() => !window.game.scene.isActive('MiniSoloDieci') && window.game.scene.isActive('Level'), null, { timeout: 6000 }); }
    catch { return 'non torna al livello'; }
    const doms = await ev(() => window.game.scene.getScene('Level').effects.doms);
    if (!(doms > 0)) return 'effetto DOMS non applicato nel livello';
    return null;
  } },
};

const only = process.argv[3];
let fails = 0;
for (const [key, c] of Object.entries(CASES)) {
  if (only && only !== key) continue;
  for (const [name, end] of Object.entries(c.ends)) {
    errors.length = 0;
    await startLevel();
    let msg = [];
    // 1° giro
    await launchMini(key, c.scene);
    try { await end(); } catch (e) { msg.push('fine 1° giro fallita: ' + e.message.split('\n')[0]); }
    const r1 = c.leave ? await c.leave() : await leaveResult(c.scene); if (r1) msg.push('1° giro: ' + r1);
    // 2° e 3° giro: deve ripartire normalmente
    for (const giro of [2, 3]) {
      await launchMini(key, c.scene);
      if (!await waitPhase(c.scene, c.play, 15000)) { msg.push(`${giro}° giro: non parte (phase=${await ev(s => window.game.scene.getScene(s).phase, c.scene)})`); break; }
      const pr = await progresses(c.scene, c.field);
      if (!pr.ok) msg.push(`${giro}° giro: bloccato (${c.field} ${pr.a} -> ${pr.b})`);
      // Extra: controlli specifici
      const extra = await ev(s => {
        const m = window.game.scene.getScene(s), out = [];
        if (s === 'MiniNebbia' && (m.inQuad || (m.grabIcons && m.grabIcons.some(g => !g.scene)))) out.push('stato quad/telefonini rimasto dal giro prima');
        if (s === 'MiniPortafoglio' && m.rocking) out.push('barca "rocking" rimasto dal giro prima');
        if (s === 'MiniSoloDieci' && (m.count || m.real > 3 || m.flatK || m.catanOn || m.lState === 'final')) out.push('stato di SOLO DIECI rimasto dal giro prima');
        return out;
      }, c.scene);
      msg.push(...extra.map(x => `${giro}° giro: ${x}`));
      await ev(s => { const m = window.game.scene.getScene(s); m.leave ? (m.standalone = false, m.leave()) : null; }, c.scene);
      await sleep(500);
    }
    if (errors.length) msg.push('errori JS: ' + [...new Set(errors)].slice(0, 3).join(' | '));
    const ok = msg.length === 0; if (!ok) fails++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${key} — 1° giro: ${name}${ok ? '' : '\n     ' + msg.join('\n     ')}`);
  }
}
await browser.close();
console.log(fails ? `\n${fails} casi falliti` : '\nTutto OK');
process.exit(fails ? 1 : 0);
