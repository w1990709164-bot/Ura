// ═══════════════════════════════
// GAME STATE
// ═══════════════════════════════
const G = {
  player: {name:'', appearance:'', birthday:{month:1,day:1}},
  apiKey:'', apiEndpoint:'', apiModel:'claude-sonnet-4-20250514',
  adultConfirmed: false,

  // Time
  day: 1, month: 1, year: 2025,
  phase: 'morning', // morning | midday | evening

  // Player state
  mood:'😐', wallet:0,
  inventory: [],

  // Chars state
  chars: {},  // charId -> {goodFeel:0, obsession:0, status:'base', location:'安全区', os:'', taskToday:null, taskDone:false}

  // Daily tasks (who has a task today)
  dailyTasks: [],  // [{charId, taskDesc, done, startTime}]
  todayRanking: [], // [{charId, completionTime}]

  // Chat history
  chatLog: [],   // [{chatId, text, time, isSystem}]

  // Conversation
  history: [],
  messages: [],
  charPovMessages: [],
  userPovMessages: [],
  isThinking: false,
  isDualView: false,

  // Pending goodfeel
  pendingGoodFeel: null, // charId

  // Market
  marketOpen: false,
};

// Init chars
CHARS.forEach(c => {
  G.chars[c.id] = {
    goodFeel: 0, obsession: 20,
    status: 'base', location: '安全区',
    os: '', taskToday: null, taskDone: false,
  };
});
