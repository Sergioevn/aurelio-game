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
- **Vittoria:** battere tutti e 5 gli amici (vincere il loro mini-giochi) → **finale** con un messaggio personale di Sergio. In alto a sinistra c'è la **leggenda** con le facce degli amici: scure finché non li batti, poi si colorano. Un amico battuto non ricompare più; se perdi il suo mini-gioco, torna più avanti.
- **Grafica:** pixel art 16 bit, tutta originale. Risoluzione base 270×480 in verticale.

## 3. Booster e mostri nel livello principale
- **Drink alcolici = booster** (es. spritz, birra, sangria, tinto de verano, Nebbiolo): danno velocità, punti doppi o invincibilità per pochi secondi. Ogni drink ha il suo effetto.
- **Racchetta da padel = super-potere:** per circa 8 s Aurelio diventa fortissimo e "smasha" gli ostacoli.
- **Maggipinto = boss.** Inside joke: non esce mai e, al massimo, invita Aurelio a stare a casa sua. Dopo ~35 s, e poi ogni ~60 s, entra in cima allo schermo e per ~15 s lancia **inviti a casa** (casette). Se un invito colpisce Aurelio, lui resta bloccato **sul divano** per 2 s ("UN ALTRO EPISODIO?"). Con la **racchetta da padel** Aurelio rimanda indietro l'invito: se la colpisce, lei torna a casa (+200).
- **Ambientazione:** il livello principale è **viale Lombardia, Milano** (viale alberato, 2 corsie per senso; cartello all'inizio della partita).
- **Ostacoli:** la **pizza di Hakim** (con linee verdi ondulate di puzza, animate, per far capire che è un malus) e la **roccia** (entrambi tolgono una vita), più l'**asino** da cavalcare: non toglie vite, ma Aurelio resta in groppa per 3 s (lento, l'asino va un po' dove vuole) e poi cammina **a gambe larghe** per 6 s (occupa più spazio, hitbox più larga). **Velocità massima** del livello limitata (`LEVEL.maxSpeed` = 230). **Inside joke roccia:** Aurelio si è fratturato un piede cadendo da una roccia → quando la prende finisce **in stampelle rosse** per ~6 s (si muove a metà velocità e zoppica).

## 4. Mini-giochi (uno per amico)
| Amico | Mini-gioco | Meccanica |
|---|---|---|
| **Javier** | **Montagna** ✅ | Javier all'inizio: "ANDIAMO IN MONTAGNA". Fase 1, pista (20 s): Aurelio *risale* una pista delimitata da **reti arancioni** che si stringono e curvano; evita gli sciatori (anche in coppia) e passa nelle **porte larghe** (slalom regolare). Gli sciatori possono passare dentro le porte, ma uno alla volta e attaccati a un palo, lasciando sempre libero un varco per Aurelio (`freeGap`) (coppie di pali): ogni porta +20, **3 porte di fila = VIN BRULÉ** (4 s invincibile, travolge tutto); **inside joke:** se prende un palo si schianta (stelline, "OTRA VEZ LOS PALOS!"), 3 schianti = perso. Fase 2, **seggiovia → "El guante"**: Aurelio sale in seggiovia, una folata gli porta via un guanto ("¡MI GUANTE!"), si sporge e cade. **Caduta libera (12 s):** si trascina il dito per restare in linea sopra il guanto (che svolazza e viene spostato dalle folate); stando in linea ci si avvicina, altrimenti si allontana. Rami e piloni da evitare (se li prendi perdi terreno). **Bombardini** da prendere (ne compaiono ~8, uno ogni 1,3 s): ognuno avvicina al guanto; ne servono circa 4 per prenderlo (stare in linea aiuta poco). Altimetro sul lato. **Inside joke:** in ogni caso atterra a testa in giù nella neve; se l'ha preso spunta un braccio che sventola il guanto ("¡LO TENGO!"), altrimenti il guanto si posa accanto. All'arrivo Javier: "¡A LA CAMA A LAS 21:00, QUE MAÑANA SE ESQUÍA OTRA VEZ!". **Vinto:** +300, +1 vita, **sci-blaster** 7 s (spara sci che abbattono pizze e rocce). **Perso:** torna nel livello in stampelle rosse. |
| **Francesco** | **La serata** | Cadono birre da prendere (punti). Più ne prendi, più sale l'indicatore "sbronza": lo schermo ondeggia e i controlli diventano meno precisi. Acqua e kebab lo fanno scendere. Obiettivo: X birre senza "crollare" prima della fine della serata. |
| **Sergio** | **Calisthenics** | Gara di trazioni/dip con Sergio: un indicatore sale e scende e si tocca nel momento giusto per fare la ripetizione. A ogni ripetizione sale la barra **DOMS**. Vince chi fa più ripetizioni prima che le braccia cedano. **Inside joke:** dopo il primo allenamento con Sergio, Aurelio ha avuto DOMS così forti da non riuscire a muovere le braccia per mangiare per una settimana. **Conseguenza nel livello:** uscito dal mini-gioco, Aurelio ha l'effetto "DOMS". Per ~15 s non riesce a prendere cibo e drink (gli rimbalzano via) e si muove più lento; compare la scritta "No puedo comer 😭". Se ha vinto la gara, l'effetto dura meno. |
| **Antonio** | **Il portafoglio** | Antonio è attorno ad Aurelio e cadono "cavolate" da comprare (gadget, sigari, orologi, offerte lampo). Bisogna intercettarle prima che Antonio le prenda. Il portafoglio si svuota a ogni acquisto; si vince se a fine tempo ci sono ancora soldi. |
| **Lollo** | **La nebbia** ✅ | **Inside joke:** Lollo fuma tantissimo e dice sempre di aver smesso. Su strada, con Lollo in alto che fuma: lo schermo si riempie di fumo e si vede solo un cerchio attorno ad Aurelio. Un **ladro** ruba il telefono ad Aurelio ("¡MI MÓVIL!", provvisoria) e si nasconde nella nebbia. Ogni tanto il telefono **squilla** ("DRIIN!", si vede dov'è il ladro) e poi il ladro scende e passa di corsa nella fila di Aurelio: bisogna **placcarlo**. Il ladro non atterra mai addosso ad Aurelio e, se se lo trova davanti, gira e scappa (una volta): bisogna inseguirlo. Lollo soffia **anelli di fumo** ("SIGA!": il cerchio di luce si stringe per 3 s); pizze e rocce nascoste stordiscono; ogni ~7 s una **folata di vento** dirada il fumo. 30 s. Battute di Lollo: inizio "UN TIRO E ANDIAMO" (provvisoria), vinto "SAI CHE HO SMESSO DI FUMARE?", perso "LA SIGA SOCIALE NON CONTA". **Vinto:** +300 e **ventilatore** 8 s (soffia via di lato pizze, rocce, asini e inviti). **Perso:** **nebbia** nel livello per 8 s (si vede solo un cerchio attorno ad Aurelio). |

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
- 27/11: pista più difficile (reti, porte, vin brulé). CACHE_VERSION v4. Seggiovia scartata (equilibrio).
- 27/11: **seggiovia rifatta come "El guante"** (caduta libera per riprendere il guanto). **Personaggio alzato in tutto il gioco** (`PLAYER_Y = H - 140` in `src/util.js`): la fascia in basso resta libera per il dito ("TRASCINA QUI IL DITO"). CACHE_VERSION v5. Prossimo passo: mini-gioco Nebbia (Lollo). Da confermare: scritte "¡MI GUANTE!" e "¡LO TENGO!" (provvisorie).
- 27/11: pista più facile (sciatori fuori dalle porte, 4 schianti, slalom regolare); pizza con puzza verde; **leggenda amici** in alto a sinistra, amici battuti non tornano, **battuti tutti → schermata Finale** (`src/scenes/Finale.js`, il testo è in `MESSAGGIO_SERGIO`, per ora segnaposto). Gli amici senza mini-gioco per ora mostrano l'annuncio e contano come battuti (provvisorio). CACHE_VERSION v6. Prossimo passo: mini-gioco Nebbia (Lollo). Da chiedere a Sergio: il messaggio finale.
- 27/11: caduta libera più facile: **bombardini** (ogni bombardino preso avvicina al guanto, `bombardinoGain` in `MONTAGNA`), distanza iniziale ridotta. CACHE_VERSION v7. Prossimo passo: mini-gioco Nebbia (Lollo). Da chiedere a Sergio: il messaggio finale.
- 27/11: nuovo ostacolo **asino** (in groppa 3 s → gambe larghe 6 s, nessuna vita persa); tetto alla velocità del livello (230); pista: porte larghe con sciatori che ci passano lasciando il varco, sciatori più frequenti, 3 schianti. CACHE_VERSION v8. Prossimo passo: mini-gioco Nebbia (Lollo). Da chiedere a Sergio: il messaggio finale.
- 27/11: bombardino meno potente (ne servono ~4 su ~8; verificato con bot: 3 = perso, 4 = vinto). CACHE_VERSION v9. Prossimo passo: mini-gioco Nebbia (Lollo), proposta inviata a Sergio. Da chiedere a Sergio: il messaggio finale.
- 27/11: **mini-gioco Nebbia (Lollo) completo** e collegato al livello. Link di prova: https://sergioevn.github.io/aurelio-game/?mini=nebbia. Verificato con bot: chi sta fermo perde sempre, chi reagisce allo squillo vince in 3-18 s. CACHE_VERSION v10. Prossimo passo: mini-giochi Francesco (La serata), Antonio (Il portafoglio), Sergio (Calisthenics). Da confermare: battuta iniziale di Lollo e "¡MI MÓVIL!". Da chiedere a Sergio: il messaggio finale.
- Note tecniche: i mini-giochi sono scene separate; il livello si mette in pausa (`scene.launch` + `scene.pause`) e riceve il risultato con l'evento `resume`. La nebbia è la texture `nebbia` (lastra di fumo con buco sfumato, `FOG_R` in `util.js`) centrata su Aurelio e scalata per allargare/stringere la visibilità. Gli sprite sono pixel art scritta come testo in `src/data/sprites.js`; le icone si rigenerano con `python3 tools/make_icons.py`. Per provarlo in locale: `python3 -m http.server 8000`. A ogni rilascio va incrementato `CACHE_VERSION` in `sw.js`.

## 12. Decisioni prese
- Gioco verticale, un livello principale con 5 mini-giochi (uno per amico).
- Mini-gioco di Sergio = calisthenics, con l'effetto DOMS come conseguenza nel livello.
- Drink alcolici e racchetta da padel come booster; Maggipinto come mostro.
- Pixel art 16 bit; hosting su GitHub Pages.
- Livello principale in viale Lombardia (Milano); ostacoli = pizza di Hakim e roccia (→ stampelle rosse).
- Montagna: vinto = +1 vita + sci-blaster; perso = stampelle rosse. Fase 2 = caduta libera per riprendere il guanto (inside joke: era caduto per raccogliere un guanto).
- Nebbia (Lollo): ladro che ruba il telefono; vinto = ventilatore che respinge gli oggetti negativi; perso = nebbia nel livello.
- Fine partita = tutti gli amici battuti; leggenda facce in alto a sinistra.
- Il personaggio sta più in alto: la parte bassa dello schermo è la zona per il dito, in tutti i mini-giochi.
