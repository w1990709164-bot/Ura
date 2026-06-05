// ══════════════════════════════
// GAME STATE
// ══════════════════════════════
let G = {
  player: { name:'', age:'', gender:'', appear:'', personality:'', spirit:null, landscape:'', landscapeDesc:'' },
  apiKey: '',
  apiEndpoint: '',
  apiModel: '',
  day: 1,
  currentLocation: 'clinic',
  currentScene: 'clinic', // tracks what AI knows about
  timeOfDay: 'day',
  weather: '多云 · 8°C',
  weatherIcon: '⛅',
  wallet: 2400,
  transactions: [],
  history: [],
  turnCount: 0,
  isThinking: false,
  patients: {},
  playerStats: { shield:100, fatigue:0, contam:0, level:'见习' },
  unlockedBags: {},
  journalEntries: [],
  contacts: [],
  chatHistories: {},
  timeSlots: { morning: null, afternoon: null, evening: null },
  slotsUsed: 0,
  messages: [],
  schedule: [], // daily appointment list
  recentScheduleIds: [], // track recent schedule to avoid repetition
  allTimeSeenIds: [],    // all chars ever scheduled — ensures full coverage
  inventory: [], // player items
  gifts: [],    // received gifts
  clinicSession: null, // current patient being treated
  sessionTurns: 0,    // turns in current session
  completedToday: [],  // patient ids seen today
  icuMode: false,      // player in ICU recovery
  icuDaysLeft: 0,      // ICU days remaining
  worldLog: [],        // daily world memory — all events across all chars
};

const CHARS = [
  {id:'keegan',name:'Keegan P. Russ',unit:'Ghosts · SGT',init:'KR',bags:10},
  {id:'ghost',name:'Simon "Ghost" Riley',unit:'TF141 · LT',init:'GH',bags:10},
  {id:'soap',name:'John "Soap" MacTavish',unit:'TF141 · SGT',init:'SO',bags:8},
  {id:'gaz',name:'Kyle "Gaz" Garrick',unit:'TF141 · SGT',init:'GZ',bags:6},
  {id:'price',name:'John Price',unit:'TF141 · CPT',init:'PR',bags:8},
  {id:'hesh',name:'David "Hesh" Walker',unit:'Ghosts · LT',init:'HW',bags:8},
  {id:'logan',name:'Logan Walker',unit:'Ghosts · SGT',init:'LW',bags:8},
  {id:'merrick',name:'Thomas A. Merrick',unit:'Ghosts · CPT',init:'TM',bags:8},
  {id:'konig',name:'König',unit:'KorTac',init:'KG',bags:10},
  {id:'horangi',name:'Horangi',unit:'KorTac',init:'HR',bags:6},
  {id:'nikto',name:'Nikto',unit:'KorTac',init:'NK',bags:10},
  {id:'krueger',name:'Sebastian Krueger',unit:'Chimera',init:'SK',bags:10},
  {id:'zimo',name:'Zhiqiang "Zimo" Wang',unit:'SpecGru',init:'ZM',bags:6},
  {id:'graves',name:'Phillip Graves',unit:'Shadow Co.',init:'PG',bags:8},
];

function toggleKeyVis() {
  const inp = document.getElementById('init-key');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}
function toggleAdvanced() {
  const sec = document.getElementById('adv-section');
  const tog = document.getElementById('adv-toggle');
  sec.classList.toggle('show');
  tog.classList.toggle('open');
}
