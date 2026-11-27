# Aurelio sopravvive all'Italia 🇪🇸➡️🇮🇹

Gioco-regalo per Aurelio: PWA installabile su iPhone e Android.

- **Gioca:** https://sergioevn.github.io/aurelio-game/
- **Istruzioni di progetto:** vedi `CLAUDE.md`

## Come si gioca
Trascina il dito per muovere Aurelio. Evita coni, multe e piccioni, prendi i drink (spritz = turbo, birra = punti x2, Nebbiolo = invincibile) e la racchetta da padel (smash!). Prendi le facce degli amici. Attenzione a Maggipinto: ti invita a casa e ti blocca sul divano.

## Provarlo sul PC
```bash
python3 -m http.server 8000
```
poi apri http://localhost:8000

## Rilasciare una nuova versione
1. Incrementa `CACHE_VERSION` in `sw.js`
2. Commit e push su `main`: GitHub Pages pubblica in 1-2 minuti
