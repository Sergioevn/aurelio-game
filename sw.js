// Service worker: salva il gioco sul telefono così funziona anche offline.
// IMPORTANTE: incrementa CACHE_VERSION a ogni rilascio, così i telefoni scaricano la versione nuova.
const CACHE_VERSION = 'v13';
const CACHE = 'aurelio-' + CACHE_VERSION;
const FILES = [
  './', './index.html', './manifest.webmanifest',
  './lib/phaser.min.js', './assets/fonts/pressstart.woff2',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png', './assets/icons/apple-touch-icon.png',
  './src/main.js', './src/util.js', './src/sfx.js',
  './src/data/sprites.js', './src/data/characters.js',
  './src/scenes/Boot.js', './src/scenes/Menu.js', './src/scenes/Level.js', './src/scenes/GameOver.js', './src/scenes/MiniMontagna.js', './src/scenes/Finale.js', './src/scenes/MiniNebbia.js', './src/scenes/MiniPortafoglio.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
