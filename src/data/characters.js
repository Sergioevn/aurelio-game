// Dati di gioco: per aggiungere/modificare personaggi e oggetti basta toccare questo file.

// Amici: prenderli fa partire il loro mini-gioco (per ora un annuncio "in arrivo").
export const FRIENDS = {
  javier:    { name: 'JAVIER',    game: 'MONTAGNA',     line: 'ANDIAMO IN MONTAGNA', scene: 'MiniMontagna',
               endLine: '¡A LA CAMA A LAS 21:00,\nQUE MAÑANA SE ESQUÍA\nOTRA VEZ!' },
  francesco: { name: 'FRANCESCO', game: 'LA SERATA',    line: 'Un\'altra birra?' },
  sergio:    { name: 'SERGIO',    game: 'CALISTHENICS', line: 'Solo 3 serie, giuro' },
  antonio:   { name: 'ANTONIO',   game: 'IL PORTAFOGLIO', line: 'Guarda che affare!' },
  lollo:     { name: 'LOLLO',     game: 'LA NEBBIA',    line: 'SÀ', scene: 'MiniNebbia',
               winLine: 'SAI CHE HO SMESSO\nDI FUMARE?', loseLine: 'LA SIGA SOCIALE\nNON CONTA' }
};

// Booster: kind -> effetto applicato in Level.applyEffect
export const BOOSTERS = {
  spritz:    { label: 'SPRITZ! TURBO',        effect: 'speed',      ms: 6000 },
  birra:     { label: 'BIRRA! PUNTI x2',      effect: 'double',     ms: 8000 },
  vino:      { label: 'NEBBIOLO! INVINCIBILE', effect: 'invincible', ms: 5000 },
  racchetta: { label: 'PADEL MODE!',          effect: 'padel',      ms: 8000 }
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
  pizza: 26, roccia: 26, asino: 11,
  spritz: 7, birra: 7, vino: 4, racchetta: 3
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
  pistaHalfStart: 95,    // mezza larghezza della pista all'inizio (px)
  pistaHalfEnd: 72,      // ...e alla fine: le reti si stringono
  gateGapStart: 104,     // spazio tra i due pali di una porta (larghe: ci passano anche gli sciatori)
  gateGapEnd: 92,
  freeGap: 44,           // spazio che uno sciatore in porta lascia sempre libero per Aurelio
  gatePoints: 20,        // punti per ogni porta (si sommano al premio se vince)
  gatesForBoost: 3,      // porte di fila per il vin brulé
  boostMs: 4000,         // durata vin brulé (invincibile)
  stunPalo: 1500,        // ms stordito dopo un palo
  stunSciatore: 900,
  cadutaMs: 12000,       // durata caduta libera (fase 2)
  catchRate: 6,         // quanto ci si avvicina al guanto stando in linea (px/s)
  driftAway: 6,         // quanto si allontana se non sei in linea (px/s)
  bombardinoGain: 42,    // ogni bombardino preso avvicina al guanto (px)
  bombardinoEvery: 1300, // ogni quanto compare un bombardino (ms)
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
  insults: ['LADRO DI #@!%&!', 'TORNA QUI, $%&#@!', 'TI TROVO, BRUTTO ****!', 'MALEDETTO @#$%!', '%&#@ DI UN LADRO!'],
  reward: { points: 300, fanMs: 8000 },   // se vince: ventilatore che soffia via pizze, rocce, asini e inviti
  fogMs: 8000                              // se perde: nebbia nel livello
};
