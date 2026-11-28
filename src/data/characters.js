// Dati di gioco: per aggiungere/modificare personaggi e oggetti basta toccare questo file.

// Amici: prenderli fa partire il loro mini-gioco (per ora un annuncio "in arrivo").
export const FRIENDS = {
  javier:    { name: 'JAVIER',    game: 'MONTAGNA',     line: 'ANDIAMO IN MONTAGNA', scene: 'MiniMontagna',
               endLine: '¡A LA CAMA A LAS 21:00,\nQUE MAÑANA SE ESQUÍA\nOTRA VEZ!' },
  francesco: { name: 'FRANCESCO', game: 'LA SERATA',    line: 'Un\'altra birra?' },
  sergio:    { name: 'SERGIO',    game: 'CALISTHENICS', line: 'Solo 3 serie, giuro' },
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
  pizza: 26, roccia: 26, asino: 3,
  spritz: 7, birra: 7, racchetta: 3, microfono: 3
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
  durataMs: 30000,       // tempo per ritrovare il ladro
  luce: 54,              // raggio di visibilità attorno ad Aurelio (px)
  luceSiga: 36,          // raggio quando ti prende un anello di fumo
  sigaMs: 3000,
  ventoEvery: 7000,      // ogni quanto una folata dirada il fumo
  stealLine: '¡MI MÓVIL!',
  phoneMs: 1600,         // quanto resta visibile il telefono quando ricompare
  grabsToWin: 3,         // il telefono scivola di mano: va preso 3 volte
  phoneSlide: [70, 120], // il telefono che vibra scivola di lato (px/s)
  ringMs: 700,           // lo squillo avvisa poco prima che il telefono compaia
  // Lollo insulta il ladro (censurato, stile fumetto)
  insults: ['LADRO DI #@!%&!', 'TORNA QUI, $%&#@!', 'TI TROVO, BRUTTO ****!', 'MALEDETTO @#$%!', '%&#@ DI UN LADRO!',
            'CHE COINCIDENZA', 'DI CHE COLORE ERA?'],
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
  lineaBuca: "C'È UNA BUCA!!"
};

// Mini-gioco Portafoglio (Antonio): fase 1 shopping, fase 2 in barca
export const PORTAFOGLIO = {
  shopMs: 20000,          // durata fase 1
  soldi: 400,             // soldi iniziali di Antonio (euro)
  // cavolate che cadono: prezzo e velocità di caduta
  cavolate: {
    orologio: { prezzo: 150, vel: 105, label: 'OROLOGIO!' },
    sigaro:   { prezzo: 60,  vel: 115, label: 'SIGARO!' },
    occhiali: { prezzo: 90,  vel: 110, label: 'OCCHIALI!' },
    offerta:  { prezzo: 200, vel: 170, label: 'OFFERTA LAMPO!' }   // rara e veloce
  },
  pesi: { orologio: 3, sigaro: 4, occhiali: 3, offerta: 1 },
  spawnEvery: [550, 800], // ogni quanto cade una cavolata (ms)
  antonioSpeed: 145,      // Antonio corre verso le cavolate (Aurelio va a 230)
  saveLines: ['SGRADEVOLE!', 'AVVOCATO', 'LORDI', 'MI CONSENTA'],  // quando Aurelio gliela soffia
  barcaMs: 16000,         // durata fase 2
  maxOnde: 3,             // onde prese prima di affondare
  ondaEvery: 1150,        // ogni quanto arriva una fila di onde (ms)
  gapStart: 92, gapEnd: 72,      // varco tra le onde (px), si stringe
  seaStart: 120, seaEnd: 165,    // velocità del mare (px/s)
  balloLines: ['STO DA DIO!!', 'HY HAA!'],
  reward: { points: 300 },       // vinto: +300 e camparini al posto degli spritz per sempre
  losePoints: 150                // perso: Aurelio paga il conto (-150 punti)
};
