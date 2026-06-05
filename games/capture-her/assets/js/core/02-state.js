// ═══════════════════════════════
// GAME STATE
// ═══════════════════════════════
const G = {
  player: {name:'', appearance:'', birthday:{month:1,day:1}},
  apiKey:'', apiEndpoint:'', apiModel:'claude-sonnet-4-20250514',
  adultConfirmed: false,
  day: 1, month: 1, year: 2025,
  phase: 'morning',
  mood:'😐', wallet:0,
  inventory: [],
  chars: {},
  dailyTasks: [],
  todayRanking: [],
  chatLog: [],
  history: [],
  messages: [],
  charPovMessages: [],
  userPovMessages: [],
  isThinking: false,
  isDualView: false,
  pendingGoodFeel: null,
  marketOpen: false,
};

CHARS.forEach(c => {
  G.chars[c.id] = {
    goodFeel: 0, obsession: 20,
    status: 'base', location: '安全区',
    os: '', taskToday: null, taskDone: false,
  };
});
