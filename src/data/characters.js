// Dati di gioco: per aggiungere/modificare personaggi e oggetti basta toccare questo file.

// Amici: prenderli fa partire il loro mini-gioco (per ora un annuncio "in arrivo").
export const FRIENDS = {
  javier:    { name: 'JAVIER',    game: 'MONTAGNA',     line: 'ANDIAMO IN MONTAGNA', scene: 'MiniMontagna',
               endLine: '¡A LA CAMA A LAS 21:00,\nQUE MAÑANA SE ESQUÍA\nOTRA VEZ!' },
  francesco: { name: 'FRANCESCO', game: "L'ULTIMA PRIMA CHE ARRIVINO", line: 'Un\'altra birra?', scene: 'MiniCheers' },
  sergio:    { name: 'SERGIO',    game: 'SOLO SETTE',   line: 'Solo 3 serie, giuro', scene: 'MiniSoloDieci' },
  antonio:   { name: 'ANTONIO',   game: 'IL PORTAFOGLIO', line: 'GUARDA CHE AFFARE!', scene: 'MiniPortafoglio',
               winLine: 'CAMPARINO?', loseLine: 'SGRADEVOLE' },
  lollo:     { name: 'LOLLO',     game: 'LA NEBBIA',    line: 'SÀ', scene: 'MiniNebbia',
               winLine: 'SAI CHE HO SMESSO\nDI FUMARE?', loseLine: 'LA SIGA SOCIALE\nNON CONTA' }
};

// Booster: kind -> effetto applicato in Level.applyEffect
export const BOOSTERS = {
  spritz:    { label: 'SPRITZ! TURBO',        effect: 'speed',      ms: 6000,
               camparino: 'CAMPARINO! TURBO' },  // battuto Antonio, gli spritz diventano camparini per sempre
  birra:     { label: 'BIRRA! PUNTI x2',      effect: 'double',     ms: 8000 },
  racchetta: { label: 'PADEL MODE!',          effect: 'padel',      ms: 8000, aura: 0xffe066 },
  microfono: { label: 'KARAOKE!',             effect: 'karaoke',    ms: 6000, aura: 0xff9ecb }
};

// Microfono: modalità karaoke, le onde sonore rompono gli oggetti negativi vicini ad Aurelio
export const KARAOKE = {
  radius: 75,          // raggio delle onde d'urto (px)
  waveEvery: 500,      // ogni quanto parte un'onda (ms)
  shoutEvery: 1600,    // ogni quanto Aurelio urla una frase (ms)
  lines: ['VAMOS, MI GENTE!', 'DI SERE NEREEE']
};

// Ostacoli: toccarli costa una vita
// crutches: true = Aurelio finisce in stampelle rosse (più lento per un po')
export const OBSTACLES = {
  pizza:  { label: 'LA PIZZA DI HAKIM!' },
  roccia: { label: 'LA ROCCIA!', crutches: true },
  asino:  { label: 'IN GROPPA!', donkey: true }   // non toglie vite: 3 s sull'asino, poi 6 s a gambe larghe
};

// Asino da cavalcare
export const DONKEY = { rideMs: 3000, wideMs: 6000, rideSpeed: 0.55, wideSpeed: 0.85 };

// Livello principale: velocità
export const LEVEL = { startSpeed: 110, accel: 3.5, maxSpeed: 230 };

// Stampelle rosse dopo la roccia
export const CRUTCHES = { ms: 6000, speed: 0.5, label: 'IN STAMPELLE...' };

// Probabilità di comparsa (pesi relativi) nel livello principale
export const SPAWN_WEIGHTS = {
  pizza: 26, roccia: 26, asino: 2,
  spritz: 7, birra: 7, racchetta: 1.5, microfono: 1.5 // super-poteri dimezzati (28/11)
};

// Maggipinto: il boss che non esce mai di casa
export const BOSS = {
  firstAt: 35000,     // ms dall'inizio
  every: 60000,       // ogni quanto torna
  duration: 15000,    // quanto resta
  throwEvery: 900,    // ogni quanto lancia un invito
  enterLines: ['VIENI DA ME?', 'STASERA RESTIAMO A CASA', 'FUORI FA FREDDO...'],
  hitLines: ['SUL DIVANO...', 'UN ALTRO EPISODIO?', 'ORDINIAMO?'],
  leaveLines: ['VABBE\', IO RESTO A CASA']
};

// Mini-gioco Montagna (Javier)
export const MONTAGNA = {
  pistaMs: 20000,        // durata fase 1 (pista)
  maxCrash: 3,           // schianti prima di perdere
  gateGapStart: 110,     // spazio tra i due pali di una porta (larghe: ci passano anche gli sciatori)
  gateGapEnd: 98,
  gateMinDist: 210,      // distanza minima (px) tra una porta e la successiva
  freeGap: 44,           // spazio che uno sciatore in porta lascia sempre libero per Aurelio
  gatePoints: 20,        // punti per ogni porta (si sommano al premio se vince)
  gatesForBoost: 3,      // porte di fila per il vin brulé
  boostMs: 2500,         // durata vin brulé (invincibile)
  stunPalo: 1500,        // ms stordito dopo un palo
  stunSciatore: 900,
  cadutaMs: 12000,       // durata caduta libera (fase 2)
  catchRate: 6,         // quanto ci si avvicina al guanto stando in linea (px/s)
  driftAway: 6,         // quanto si allontana se non sei in linea (px/s)
  bombardinoGain: 42,    // ogni bombardino preso avvicina al guanto (px)
  bombardinoEvery: 1300, // ogni quanto compare un bombardino (ms)
  carlosEvery: 1250,     // ogni quanto compare Carlos, l'aquila (ms)
  carlosPush: 38,        // se colpisci Carlos ti allontani dal guanto (px)
  carlosLines: ['¡ESE HIJO DE P#@!%\nME HA ROTO\nLA RODILLA!', 'HA! HA!', 'PIÙ TARDI\nFACCIAMO UN DRINK'],
  javiLines: ['MA COME FA A NON\nPIACERTI AURELIO?!', '¡ÁNDALE!', 'SEI LENTO!!'],
  crashLine: 'OTRA VEZ LOS PALOS!',
  guanteLine: '¡MI GUANTE!',
  tengoLine: '¡LO TENGO!',
  reward: { points: 300, life: 1, skiMs: 7000 }  // se vince: punti, vita in più, sci-blaster
};

// Mini-gioco Nebbia (Lollo): un ladro ruba il telefono ad Aurelio nel fumo
export const NEBBIA = {
  durataMs: 38000,       // tempo per ritrovare il telefono
  luce: 54,              // raggio di visibilità attorno ad Aurelio (px)
  luceSiga: 36,          // raggio quando ti prende un anello di fumo
  sigaMs: 3000,
  ventoEvery: 7000,      // ogni quanto una folata dirada il fumo
  stealLine: '¡MI MÓVIL!',
  phoneMs: 1600,         // quanto resta visibile il telefono quando ricompare
  grabsToWin: 4,         // il telefono scivola di mano: va preso 4 volte (fase 1 più lunga)
  primoSquilloMs: 2600,  // attesa prima del primo squillo
  phoneSlide: [70, 120], // il telefono che vibra scivola di lato (px/s)
  ringMs: 700,           // lo squillo avvisa poco prima che il telefono compaia
  // Lollo insulta il ladro (censurato, stile fumetto)
  insults: ['LADRO DI #@!%&!', 'TORNA QUI, $%&#@!', 'TI TROVO, BRUTTO ****!', 'MALEDETTO @#$%!', '%&#@ DI UN LADRO!'],
  // tre battute di fila, sempre in quest'ordine (una volta per partita, dopo il primo insulto)
  colore: ['DI CHE COLORE ERA?', 'NON IL TELEFONO,\nOVVIAMENTE', 'MA CHE COINCIDENZA'],
  // note di comparsa in tribunale nascoste nel fumo: se le prendi salti un turno del telefono
  citazioneOgni: 4,      // una cosa che cade su tante è una citazione
  citazioneLine: 'COMPARSA IN TRIBUNALE!\nSALTI UN TURNO',
  reward: { points: 300, fanMs: 8000 },   // se vince: ventilatore che soffia via pizze, rocce, asini e inviti
  fogMs: 8000                              // se perde: nebbia nel livello
};

// Nebbia, fase 2: IN QUAD. Aurelio guida, Lollo dietro. Stare sulla traccia lo calma:
// quando la barra è piena si accende una siga e, se la fumi tutta senza farlo agitare, hai vinto.
export const QUAD = {
  durataMs: 25000,        // tempo massimo per far fumare Lollo
  vel: 140,               // velocità dello sterrato (px/s)
  maxVx: 160,             // velocità laterale massima del quad (px/s)
  accel: 5,               // inerzia dello sterzo: più basso = più "pesante"
  traccia: [50, 32],      // larghezza della traccia: all'inizio e alla fine (px)
  curve: [0, 80],         // ampiezza delle curve: all'inizio e alla fine (px)
  calmaStart: 35,         // barra della tranquillità (0-100) all'inizio
  calmaSu: 8,             // sulla traccia sale di tanto al secondo
  calmaGiu: 12,           // fuori traccia scende di tanto al secondo
  buca: 22,               // quanto toglie una buca o un sasso
  panico: 35,             // sotto questo valore Lollo è in panico
  fumoMs: 3500,           // quanto deve durare la siga per vincere
  fumoMin: 65,            // se durante la siga la barra scende sotto, la siga cade
  ostacoloEvery: [1100, 1600],
  lineePanico: ['PIANO AURÉ!'],
  // dopo la siga (Lollo è zen): la strada si allarga e vanno superati Antonio e Francesco,
  // sullo stesso quad, lentissimi e dritti. Se li tamponi Lollo perde la siga: perso.
  sorpasso: { velLoro: 70, distanza: 210, hitX: 34, hitY: 40 },
  sorpassoLine: 'FIGA, I PUGLIESI NON\nSANNO MICA GUIDARE',   // Lollo, mentre li superate
  zenWin: 'LOLLO È ZEN.\nTORNATE A CASA\nTRANQUILLI',
  zenLose: 'LOLLO NON È ZEN.\nRECUPERA TUTTE\nLE SIGA A VALLE.',
  lineaBuca: "C'È UNA BUCA!!"
};

// Mini-gioco Portafoglio (Antonio): fase 1 shopping, fase 2 in barca
export const PORTAFOGLIO = {
  shopMs: 20000,          // durata fase 1
  soldi: 2000,            // soldi iniziali di Antonio (euro)
  affitto: 750,           // i soldi dell'affitto: se Antonio scende sotto, hai perso (margine = 1250€, ~11 cavolate in media)
  // cavolate che cadono: prezzo e velocità di caduta
  cavolate: {
    orologio: { prezzo: 150, vel: 105, label: 'OROLOGIO!' },
    sigaro:   { prezzo: 60,  vel: 115, label: 'SIGARO!' },
    occhiali: { prezzo: 90,  vel: 110, label: 'OCCHIALI!' },
    scarpe:   { prezzo: 120, vel: 108, label: 'SCARPE ELEGANTI!' },
    polo:     { prezzo: 200, vel: 170, label: 'POLO MASSIMO DUTTI!' }   // rara e veloce
  },
  pesi: { orologio: 3, sigaro: 4, occhiali: 3, scarpe: 3, polo: 1 },
  poloLine: 'LA NUOVA COLLEZIONE\nMASSIMO DUTTI!!',   // Antonio la urla quando cade la polo
  spawnEvery: [430, 640], // ogni quanto cade una cavolata (ms) - più oggetti: meno chiaro dove va Antonio
  antonioSpeed: 145,      // Antonio corre verso le cavolate (Aurelio va a 230)
  saveLines: ['SGRADEVOLE!', 'AVVOCATO', 'BRUTTO GESTO', 'LORDI', 'MI CONSENTA', 'BRUTTISSIMO GESTO'],  // quando Aurelio gliela soffia
  // Fase 2: CAMERIERE DI BORDO. Aurelio porta un Camparino ad Antonio camminando sul ponte.
  // Tieni premuto = cammina; prima di ogni onda la prua si alza: se cammina durante il rollio, il Camparino trabocca.
  barca: {
    walkSpeed: 100,         // velocità di Aurelio sul ponte (px/s)
    reach: 38,              // distanza di consegna da Antonio (px)
    spillRate: 85,          // Camparino perso al secondo camminando durante il rollio (su 100)
    lightWaves: 1,          // la prima onda è leggera (serve a imparare)
    lightPower: 0.5,        // ...e fanno perdere la metà
    warnMs: [1100, 900],    // preavviso (prua che si alza): prima onda / dopo
    rollMs: 1000,           // durata del rollio (pericolo)
    calmMs: [1300, 1900],   // tratto calmo tra due onde (3-4 passi)
    resumeCalmMs: 600,      // calma quando si riparte dopo una gag (poi arriva il preavviso dell'onda)
    doppiaCalmMs: 650,      // pausa tra le due onde ravvicinate dopo il Saint Barth
    pitch: 6,               // inclinazione massima della barca (gradi)
    impeccabile: 80,        // da qui in su: "CAMPARINO IMPECCABILE"
    goccio: 25,             // sotto: "HAI SALVATO IL GHIACCIO"
    // posizioni sul ponte (x nel mondo; poppa a sinistra = 0, prua a destra)
    lunghezza: 600, aurelioX: 480, antonioX: 290, macarenaX: 215, caimanX: 520, poppaX: 56
  },
  balloLines: ['Sto da Dio!'],
  saintBarth: 'Caiman, ma quello\nè un Saint Barth?',
  hyyyha: 'HYYY HA!',
  karaoke: 'Ragazzi,\nstasera Karaoke',
  reward: { points: 300 },       // vinto: +300 e camparini al posto degli spritz per sempre
  losePoints: 150                // perso: Aurelio paga il conto (-150 punti)
};

// Mini-gioco Cheers (Francesco): "L'ultima prima che arrivino".
// Fuori dal Cheers Pub: Aurelio deve finire la pinta brindando con Francesco
// prima che arrivino Giorgio e Caiman (sono loro il conto alla rovescia).
export const CHEERS = {
  arriveMs: 40000,        // dopo quanto Giorgio e Caiman arrivano al tavolo
  penaltyPresto: 1200,    // premi troppo presto ("AURI, FAMMI FINIRE."): arrivano prima di tanto (ms)
  penaltyAscolto: 1500,   // tieni premuto dopo il sorso ("MI STAI ASCOLTANDO?")
  cooldownPresto: 700,    // tra due penalità "troppo presto" (contro chi tocca a raffica)
  graziaMs: 300,          // tolleranza per lasciare quando Francesco abbassa il bicchiere
  abbassaMs: 400,         // Francesco abbassa il bicchiere dopo aver bevuto
  // PENALITÀ "BICCHIERE GIÙ": per tanto tempo Aurelio non può bere né brindare.
  // Scatta se sbagli il cin (troppo presto, in ritardo o non premi proprio)
  // e se lasci prima che Francesco abbia finito di bere.
  bloccoMs: 2000,
  // finestre del "cin" rispetto al contatto dei bicchieri (ms prima / dopo)
  finestra:  { perfetto: 90,  primaBuono: 220, dopoBuono: 180 },
  tutorial:  { perfetto: 140, primaBuono: 380, dopoBuono: 300 },  // primo brindisi, più generoso
  // quanta birra (su 100) si beve tenendo premuto per tutto il sorso; il brindisi doppio vale metà
  sorso: { perfetto: 24, buono: 16 },
  // la sequenza dei brindisi (fissa, niente casualità)
  //   talk = Francesco parla; fake = alza il bicchiere in verticale (FINTA);
  //   toast = brindisi vero: reach = il bicchiere va in orizzontale verso Aurelio, drink = sorso
  beats: [
    { talk: 3200, say: "HO CONOSCIUTO UNA TIPA\nL'ALTRO GIORNO..." },
    { toast: true, reach: 900, drink: 2200, tutorial: true },
    { talk: 2000, say: 'DOVREMMO FARE\nUN PAINTBALL' },
    { fake: 1400 },
    { talk: 1200 },
    { toast: true, reach: 650, drink: 1800 },
    { talk: 2200, say: 'ERA IL CUVVY!' },
    { fake: 1200 },
    { toast: true, reach: 600, drink: 900, half: true, say: 'A JAVI!' },
    { talk: 700, say: '...E A LOLLO,\nSENNÒ SI OFFENDE!' },
    { toast: true, reach: 500, drink: 1000, half: true },
    { talk: 2000, say: 'DAI ANDIAMO AL MOSSO,\nSTASERA' },
    { toast: true, reach: 500, drink: 1600 },
    { talk: 1800, say: 'JAUVI!' },
    { fake: 1300 },
    { talk: 800 },
    { toast: true, reach: 450, drink: 1600 },
    { talk: 1600, say: "HO CONOSCIUTO UNA TIPA\nL'ALTRO GIORNO..." },
    { toast: true, reach: 450, drink: 1500 }
  ],
  // dopo l'ultimo brindisi Francesco continua a chiacchierare (niente più brindisi)
  filler: [
    { talk: 1400, say: 'JAUVI!' },
    { fake: 1200 },
    { talk: 1600, say: 'DOVREMMO FARE\nUN PAINTBALL' },
    { fake: 1200 }
  ],
  mancatoLine: 'AURI?! IL CIN!',            // cin sbagliato (in ritardo o mai premuto) - provvisoria
  metaLine: 'AURI, NON SI\nLASCIA A METÀ!', // lasci prima che Francesco finisca di bere - provvisoria
  prestoLine: 'AURI, FAMMI FINIRE.',
  ascoltoLine: 'AURI, MA MI\nSTAI ASCOLTANDO?',
  winLines: ['MA AURELIO?', 'ERA QUI\nUN ATTIMO FA.'],
  loseLines: ['AH PERFETTO,\nSTAI ANCORA BEVENDO!', 'QUATTRO MEDIE!'],
  reward: { points: 300, fugaMs: 6000 },  // vinto: +300 e turbo di fuga nel livello
  sbronzaMs: 8000                          // perso: sbronza nel livello (schermo che ondeggia, comandi imprecisi)
};

// Mini-gioco di Sergio: SOLO DIECI. Area calisthenics: Sergio fa handstand push-up dando le spalle
// ad Aurelio e ogni tanto si gira a controllare. Aurelio (tieni premuto = flessioni) deve farsi
// contare 10 flessioni facendone il meno possibile: ogni flessione VERA riempie i DOMS.
export const SOLODIECI = {
  target: 7,              // flessioni convalidate da Sergio per vincere
  domsMax: 17,            // flessioni reali che riempiono la barra "DOMS DI DOMANI" (= sconfitta)
  repMs: 800,             // durata di una flessione di Aurelio (discesa + risalita)
  bottomAt: 0.45,         // a che punto della flessione Aurelio tocca giù (lì la flessione conta come fatta)
  graceMs: 120,           // tolleranza: Sergio "vede" ancora per tanto dopo essersi girato
  // Ritmo di Sergio, per fase (i controlli contano dall'inizio della partita, anche dopo un azzeramento)
  //   rep = handstand push-up normale; slow = l'ultimo, rallentato (inizio del segnale);
  //   sway = oscillazione in verticale; turn = la testa ruota; look = guarda Aurelio; back = torna a guardare il muro
  fasi: [
    { daControllo: 0, reps: [1, 1], repMs: 750, slow: 950,  sway: 300, turn: 250, look: 500, back: 200, hold: 0, double: 0, pausa: [0, 0] },
    { daControllo: 2, reps: [0, 1], repMs: 720, slow: 900,  sway: 280, turn: 240, look: 480, back: 200, hold: 0.3, double: 0.25, pausa: [0, 200] },
    { daControllo: 5, reps: [0, 1], repMs: 700, slow: 850,  sway: 260, turn: 220, look: 450, back: 180, hold: 0.25, double: 0, pausa: [0, 450] }
  ],
  holdMs: [500, 900],     // breve tenuta in verticale (fase 2 e 3)
  // una volta per partita Sergio si gira di scatto: segnale molto più corto (controllo scelto a caso tra questi)
  scatto: { controlli: [3, 5], slow: 600, sway: 150, turn: 140 },
  // Frasi
  numeri: ['UNO!', 'DUE!', 'TRE!', 'QUATTRO!', 'CINQUE!', 'SEI!', 'SETTE!'],
  extra: ['DAI!', 'PULITA!', 'QUESTA VALE!'],
  resetLines: ['EH NO, QUESTA\nNON VALE. DA CAPO.', 'TI HO VISTO FERMO.', 'NON BARARE.', 'ERANO SETTE\nDI FILA.'],
  ludoDai: 'Dai Aurelito!',
  ludoDaiMax: 3,          // al massimo tante volte per partita
  catan: ['IO NON PARLO…', 'MA TU MI AIUTI\nAL CATAN.'],
  catanDopo: 2,           // il patto sul Catan può scattare dopo questo numero di controlli
  startLine: 'Vedi che Fra\nne ha fatte 10!',   // all'inizio: "guarda che stai facendo peggio di lui"
  winLines: ['Visto? Con la musica\nrussa è tutto\npiù facile.'],
  loseDue: 'Ne mancavano\nsolo due.',
  losePoche: 'Dai, ne mancavano\npoche.',
  voti: [[8, 'DOMS CONTENUTI'], [11, 'DOMS DEVASTANTI'], [99, 'DOMANI NON SI ALZA']],
  reward: { points: 300, domsMs: 6000 },  // vinto: +300 e DOMS corti nel livello
  domsMs: 15000                           // perso: DOMS lunghi nel livello (cibo e drink rimbalzano, più lento)
};
