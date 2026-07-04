// GAME STATE
function createInitialCharState() {
  const chars = {};
  CHARS.forEach(c => {
    chars[c.id] = {
      goodFeel: 0,
      obsession: 20,
      status: 'base',
      location: 'safe_area',
      os: '',
      taskToday: null,
      taskDone: false,
    };
  });
  return chars;
}

function createInitialGameState() {
  return {
    player: {name:'', appearance:'', birthday:{month:1,day:1}},
    apiKey:'', apiEndpoint:'', apiModel:'claude-sonnet-4-20250514',
    adultConfirmed: false,
    day: 1, month: 1, year: 2025, totalDay: 1,
    phase: 'morning',
    mood:'😓', wallet:0,
    inventory: [],
    chars: createInitialCharState(),
    dailyTasks: [],
    todayRanking: [],
    chatLog: [],
    history: [],
    messages: [],
    charPovMessages: [],
    userPovMessages: [],
    isThinking: false,
    isDualView: false,
    currentTask: null,
    pendingGoodFeel: null,
    marketOpen: false,
  };
}

const G = createInitialGameState();

function resetGameState() {
  const fresh = createInitialGameState();
  Object.keys(G).forEach(k => delete G[k]);
  Object.assign(G, fresh);
  if (typeof charPovData !== 'undefined') charPovData = {};
  if (typeof currentCharPovId !== 'undefined') currentCharPovId = null;
}
