# Progetto: "Aurelio sopravvive all'Italia" — gioco-regalo PWA

> Questo file vale sia come istruzioni del Progetto Claude "Gioco" sia come CLAUDE.md per Claude Code su PC.
> Le parti tra [quadre] sono ancora da decidere.

## 1. Obiettivo
Un gioco per browser, installabile come **Progressive Web App**, da regalare ad Aurelio tramite un **QR code**.
- Il QR apre l'URL del gioco → Aurelio lo installa sulla schermata Home (iPhone o Android).
- Dopo il primo caricamento funziona **offline**, a schermo intero.
- **Scadenza: weekend del 5-6 dicembre 2026.** Viene prima un gioco piccolo, divertente e senza bug che uno grande.

## 2. Concept
- **Protagonista:** Aurelio, di Siviglia (Andalusia), trasferito in Italia. Missione: *sopravvivere all'Italia*.
- **Tono:** ironico e affettuoso, con battute tra amici.
- **Struttura:** **un unico livello principale** a scorrimento verticale. Aurelio sta in basso e si muove a destra e sinistra; dall'alto cadono oggetti e le facce degli amici. Prendere la faccia di un amico fa partire **il suo mini-gioco** (sempre verticale, dura circa 20-40 s). Quando il mini-gioco finisce, si torna al livello con un bonus se è andato bene o un malus se è andato male.
- **Vittoria:** raggiungere il punteggio obiettivo / completare i 5 mini-giochi → **finale** con un messaggio personale di Sergio.
- **Grafica:** pixel art 16 bit, tutta originale. Risoluzione base 270×480 in verticale.

## 3. Booster e mostri nel livello principale
- **Drink alcolici = booster** (es. spritz, birra, sangria, tinto de verano, Nebbiolo): danno velocità, punti doppi o invincibilità per pochi secondi. Ogni drink ha il suo effetto.
- **Racchetta da padel = super-potere:** per circa 8 s Aurelio diventa fortissimo e "smasha" gli ostacoli.
- **Maggipinto = boss.** Inside joke: non esce mai e, al massimo, invita Aurelio a stare a casa sua. Dopo ~35 s, e poi ogni ~60 s, entra in cima allo schermo e per ~15 s lancia **inviti a casa** (casette). Se un invito colpisce Aurelio, lui resta bloccato **sul divano** per 2 s ("UN ALTRO EPISODIO?"). Con la **racchetta da padel** Aurelio rimanda indietro l'invito: se la colpisce, lei torna a casa (+200).
- **Ambientazione:** il livello principale è **viale Lombardia, Milano** (viale alberato, 2 corsie per senso; cartello all'inizio della partita).
- **Ostacoli:** la **pizza di Hakim** e la **roccia**. Entrambi tolgono una vita. **Inside joke roccia:** Aurelio si è fratturato un piede cadendo da una roccia → quando la prende finisce **in stampelle rosse** per ~6 s (si muove a metà velocità e zoppica).

## 4. Mini-giochi (uno per amico)
| Amico | Mini-gioco | Meccanica |
|---|---|---|
| **Javier** | **Montagna** ✅ | Javier all'inizio: "ANDIAMO IN MONTAGNA". Fase 1, pista (20 s): Aurelio *risale* una pista delimitata da **reti arancioni** che si stringono e curvano; evita gli sciatori (anche in coppia) e passa nelle **porte** (coppie di pali): ogni porta +20, **3 porte di fila = VIN BRULÉ** (4 s invincibile, travolge tutto); **inside joke:** se prende un palo si schianta (stelline, "OTRA VEZ LOS PALOS!"), 3 schianti = perso. Fase 2, seggiovia (15 s): tocchi a sinistra/destra per tenere l'indicatore nel verde, con folate di vento; **inside joke:** se esce, Aurelio cade dalla seggiovia ("¡ME CAIGO!", provvisoria) e finisce a testa in giù nella neve. All'arrivo Javier: "¡A LA CAMA A LAS 21:00, QUE MAÑANA SE ESQUÍA OTRA VEZ!". **Vinto:** +300, +1 vita, **sci-blaster** 7 s (spara sci che abbattono pizze e rocce). **Perso:** torna nel livello in stampelle rosse. |
| **Francesco** | **La serata** | Cadono birre da prendere (punti). Più ne prendi, più sale l'indicatore "sbronza": lo schermo ondeggia e i controlli diventano meno precisi. Acqua e kebab lo fanno scendere. Obiettivo: X birre senza "crollare" prima della fine della serata. |
| **Sergio** | **Calisthenics** | Gara di trazioni/dip con Sergio: un indicatore sale e scende e si tocca nel momento giusto per fare la ripetizione. A ogni ripetizione sale la barra **DOMS**. Vince chi fa più ripetizioni prima che le braccia cedano. **Inside joke:** dopo il primo allenamento con Sergio, Aurelio ha avuto DOMS così forti da non riuscire a muovere le braccia per mangiare per una settimana. **Conseguenza nel livello:** uscito dal mini-gioco, Aurelio ha l'effetto "DOMS". Per ~15 s non riesce a prendere cibo e drink (gli rimbalzano via) e si muove più lento; compare la scritta "No puedo comer 😭". Se ha vinto la gara, l'effetto dura meno. |
| **Antonio** | **Il portafoglio** | Antonio è attorno ad Aurelio e cadono "cavolate" da comprare (gadget, sigari, orologi, offerte lampo). Bisogna intercettarle prima che Antonio le prenda. Il portafoglio si svuota a ogni acquisto; si vince se a fine tempo ci sono ancora soldi. |
| **Lollo** | **La nebbia** | Lollo fuma e lo schermo si riempie di fumo: si vede solo un cerchio attorno ad Aurelio. Bisogna trovare 3 oggetti persi (chiavi, telefono, portafoglio) prima che scada il tempo, evitando gli ostacoli nascosti. Ogni tanto una folata di vento schiarisce lo schermo per un attimo. |

## 5. Riferimenti per gli sprite (dalle foto, solo descrizione)
- **Aurelio:** capelli castano scuro ricci e voluminosi, occhiali con montatura sottile scura, barba corta, sorriso largo, maglietta bianca. Oggetto tipico: calice di vino rosso.
- **Francesco:** capelli castano scuro corti e mossi, **baffoni folti**, sorriso enorme, maglietta bianca, felpa legata in vita, braccialetti da festival.
- **Javier:** capelli castani lunghi fino alle orecchie con riga in mezzo, barba castana, maglione beige con zip.
- **Lollo:** capelli castano chiaro mossi tirati su, baffetti leggeri, giacca blu e camicia bianca.
- **Antonio:** capelli scuri corti e ricci, barba corta curata, cardigan beige su maglietta bianca, orologio, sigaro.
- **Sergio:** capelli scuri corti, barba, canotta nera, braccia muscolose, auricolari.
- **Maggipinto:** capelli lunghi, ricci e voluminosi, castano scuro con riflessi ramati, sorriso largo, rossetto rosso. Nella versione "mostro" i ricci diventano enormi e si muovono come una nuvola o dei tentacoli, sempre in chiave comica.
- Le **foto originali non vanno nel repo** (che è pubblico): ci finiscono solo gli sprite in pixel art.

## 6. Stack tecnico
- **Motore:** Phaser 3 (JavaScript), salvato in locale in `/lib`. Nessun passaggio di build: HTML + JS statici con moduli ES.
- **Phaser Scale FIT**, `pixelArt: true`, orientamento verticale.
- **Controlli:** trascinamento con un dito / tocco a sinistra-destra. Su PC, frecce della tastiera.
- **Audio:** si sblocca al primo tocco (iOS). C'è il tasto per togliere l'audio.
- **Salvataggio:** record e mini-giochi completati in `localStorage`, con try/catch.

## 7. PWA, hosting e QR
- `manifest.webmanifest` (fullscreen/standalone, portrait, icone 192/512 + maskable), `apple-touch-icon` 180.
- `sw.js`: service worker cache-first con `CACHE_VERSION` da incrementare a ogni rilascio.
- **Installazione:** su Android c'è il bottone "Installa" (`beforeinstallprompt`). Su iPhone c'è la schermata guida "Condividi → Aggiungi alla schermata Home".
- **Hosting:** GitHub Pages, branch `main`, cartella root. URL: `https://[utente].github.io/[repo]/`. Attenzione: tutti i percorsi devono essere **relativi**.
- **QR:** fatto sull'URL definitivo, in PNG/SVG ad alta risoluzione.

## 8. Struttura cartelle
```
/index.html  /manifest.webmanifest  /sw.js
/lib/phaser.min.js
/src/main.js
/src/scenes/   Boot, Menu, Level, MiniMontagna, MiniSerata, MiniGara, MiniPortafoglio, MiniNebbia, Result, GameOver, Finale, InstallGuide
/src/data/characters.js   amici, booster, mostri (dati, non logica)
/src/data/config.js       velocità, frequenze, durate (bilanciamento)
/assets/sprites  /assets/audio  /assets/icons
/qr/
```

## 9. Come lavorare con Sergio
- Rispondi sempre in **italiano**.
- Sergio non è uno sviluppatore: spiegagli in pratica cosa fare (comandi già pronti da copiare, dove cliccare).
- Lavora a **piccoli passi**: dopo ogni passo il gioco resta giocabile, viene fatto il push ed è provabile dal telefono.
- Proponi idee, ma personaggi e battute li decide Sergio.
- A fine sessione: aggiorna **Stato** qui sotto, fai commit e push.

## 10. Piano fino alla scadenza
1. **Ven 27 – Sab 28:** repo + GitHub Pages + MVP del livello principale + PWA di prova.
2. **Dom 29 – Lun 30:** mini-giochi Javier (Montagna) e Lollo (Nebbia).
3. **Mar 1 – Mer 2:** mini-giochi Francesco, Antonio, Sergio; booster e racchetta; Maggipinto.
4. **Gio 3:** sprite definitivi, audio, finale.
5. **Ven 4:** test su iPhone/Android, bilanciamento, QR definitivo.
6. **Sab 5 – Dom 6:** regalo 🎁

## 11. Stato
- 27/11: concept e mini-giochi definiti.
- 27/11: **MVP online** su https://sergioevn.github.io/aurelio-game/ con menu, livello principale (ostacoli cono/multa/piccione, booster spritz/birra/Nebbiolo/racchetta, 3 vite, punteggio), facce degli amici (per ora mostrano un annuncio "mini-gioco prossimamente"), boss Maggipinto, game over con record, PWA offline e icone. Prossimo passo: mini-gioco Montagna (Javier).
- 27/11: ambientazione **viale Lombardia**; ostacoli cambiati in **pizza di Hakim** e **roccia** (la roccia mette Aurelio in stampelle rosse). CACHE_VERSION v2. Prossimo passo: mini-gioco Montagna (Javier).
- 27/11: **mini-gioco Montagna (Javier) completo** e collegato al livello (prendere Javier lo avvia). Link di prova diretto: https://sergioevn.github.io/aurelio-game/?mini=montagna. CACHE_VERSION v3. Prossimo passo: mini-gioco Nebbia (Lollo). Da confermare con Sergio: scritta "¡ME CAIGO!" della seggiovia.
- 27/11: pista più difficile (reti, porte, vin brulé). CACHE_VERSION v4. **Seggiovia da rifare**: a Sergio non piace la meccanica dell'equilibrio, sono state proposte alternative — in attesa della scelta.
- Note tecniche: i mini-giochi sono scene separate; il livello si mette in pausa (`scene.launch` + `scene.pause`) e riceve il risultato con l'evento `resume`. Gli sprite sono pixel art scritta come testo in `src/data/sprites.js`; le icone si rigenerano con `python3 tools/make_icons.py`. Per provarlo in locale: `python3 -m http.server 8000`. A ogni rilascio va incrementato `CACHE_VERSION` in `sw.js`.

## 12. Decisioni prese
- Gioco verticale, un livello principale con 5 mini-giochi (uno per amico).
- Mini-gioco di Sergio = calisthenics, con l'effetto DOMS come conseguenza nel livello.
- Drink alcolici e racchetta da padel come booster; Maggipinto come mostro.
- Pixel art 16 bit; hosting su GitHub Pages.
- Livello principale in viale Lombardia (Milano); ostacoli = pizza di Hakim e roccia (→ stampelle rosse).
- Montagna: vinto = +1 vita + sci-blaster; perso = stampelle rosse.
