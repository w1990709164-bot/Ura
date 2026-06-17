// ══════════════════════════════
// GAME STATE
// ══════════════════════════════
const G = {
  player: {name:'', race:'', appearance:'', birthday:{month:1,day:1}},
  apiKey: '',
  apiEndpoint: '',
  apiModel: '',
  adultConfirmed: false,

  // Time
  gameYear: 1,      // 1-7 幼崽, 8+ 成人
  gameWeek: 1,      // 1-52
  gameDay: 1,       // absolute day counter
  absoluteYear: 2060,
  absoluteMonth: 1,
  absoluteDay: 1,

  // Stats
  stats: {tq:0, mj:0, jz:0, js:0, zs:0, qs:0, yl:0},

  // Action points (幼崽期)
  ap: {total:8, bond:3, grow:3, free:2, used:0},
  apUsedThisYear: [],

  // Bonds
  bonds: {},  // charId -> {stage:0-6, value:0-100, whisper:'', status:'normal', location:'', dynamic:'', weeklyState:{}}

  // Player state
  mood: '😐',
  wallet: 0,
  inHeat: false,
  heatDaysLeft: 0,

  // Inventory
  inventory: [],

  // Phase
  phase: 'cub',  // 'cub' | 'adult'
  job: null,
  jobGrade: null,

  // Current location
  currentLocation: 'hall',

  // Conversation
  history: [],
  messages: [],
  isThinking: false,
  turnCount: 0,

  // Weekly state
  weeklyTaskDone: false,
  weeklyMarketOpen: false,
  weeklyCharStates: {},

  // World log
  worldLog: [],
};

// Init bonds
CHARS.forEach(c => {
  G.bonds[c.id] = {
    stage: 0,
    value: 0,
    whisper: '',
    status: 'normal',
    location: 'camps',
    dynamic: '休息中',
    weeklyState: {},
  };
});
