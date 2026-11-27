// Dati di gioco: per aggiungere/modificare personaggi e oggetti basta toccare questo file.

// Amici: prenderli fa partire il loro mini-gioco (per ora un annuncio "in arrivo").
export const FRIENDS = {
  javier:    { name: 'JAVIER',    game: 'MONTAGNA',     line: 'ANDIAMO IN MONTAGNA', scene: 'MiniMontagna',
               endLine: '¡A LA CAMA A LAS 21:00,\nQUE MAÑANA SE ESQUÍA\nOTRA VEZ!' },
  francesco: { name: 'FRANCESCO', game: 'LA SERATA',    line: 'Un\'altra birra?' },
  sergio:    { name: 'SERGIO',    game: 'CALISTHENICS', line: 'Solo 3 serie, giuro' },
  antonio:   { name: 'ANTONIO',   game: 'IL PORTAFOGLIO', line: 'Guarda che affare!' },
  lollo:     { name: 'LOLLO',     game: 'LA NEBBIA',    line: 'Un tiro e andiamo' }
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
  roccia: { label: 'LA ROCCIA!', crutches: true }
};

// Stampelle rosse dopo la roccia
export const CRUTCHES = { ms: 6000, speed: 0.5, label: 'IN STAMPELLE...' };

// Probabilità di comparsa (pesi relativi) nel livello principale
export const SPAWN_WEIGHTS = {
  pizza: 30, roccia: 30,
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
  stunPalo: 1500,        // ms stordito dopo un palo
  stunSciatore: 900,
  seggioviaMs: 15000,    // durata fase 2 (seggiovia)
  crashLine: 'OTRA VEZ LOS PALOS!',
  fallLine: '¡ME CAIGO!',
  reward: { points: 300, life: 1, skiMs: 7000 }  // se vince: punti, vita in più, sci-blaster
};
