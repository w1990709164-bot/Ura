// ── 游戏状态 ──────────────────────────────────────────────
const SAVE_KEY = 'cod_hogwarts_v1';
const STAT_STAGE_CAPS = { 1:40, 2:60, 3:80, 4:100 };

const TIME_LABELS = {
  dawn:'黎明', morning:'清晨', forenoon:'上午',
  noon:'午间', afternoon:'下午', dusk:'傍晚',
  evening:'夜晚', midnight:'深夜'
};

const TIME_ORDER = ['dawn','morning','forenoon','noon','afternoon','dusk','evening','midnight'];

const MONTH_NAMES = ['','一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
const DAY_SUFFIX = ['','一','二','三','四','五','六','七','八','九','十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '二十一','二十二','二十三','二十四','二十五','二十六','二十七','二十八','二十九','三十','三十一'];

function buildInitialCharacterState() {
  const result = {};
  CHARACTERS.forEach(c => {
    result[c.id] = {
      affection: 0,
      stage: 0,
      location: c.initialLocation,
      psychology: c.initialPsychology,
      heartGuardBroken: !c.heartGuard,
      metPlayer: false
    };
  });
  return result;
}

function createFreshState() {
  return {
    phase: 'creation',     // creation | sorting | game
    player: {
      name: '',
      age: '',
      appearance: '',
      personality: '',
      wand: { wood:'', core:'', length:'' },
      house: '',
      stats: {
        lingLi:         { cur:40,  stage:1 },
        magicKnowledge: { cur:15,  stage:1 },
        xinJing:        { cur:60,  stage:1 },
        tiPo:           { cur:50,  stage:1 },
        renYuan:        { cur:20,  stage:1 }
      },
      conflictValue: 10,
      gold: 50,
      housePoints: 0,
      inventory: []
    },
    gameDate: {
      month: 9, day: 1, year: 1,
      timeOfDay: 'morning'
    },
    week: 1,
    semester: 1,
    semesterPoints: { gryffindor:0, slytherin:0, ravenclaw:0, hufflepuff:0 },
    characters: buildInitialCharacterState(),
    storyHistory: [],
    currentStory: '',
    currentOptions: [],
    unlockedAchievements: [],
    saves: [null, null, null],
    sortingScores: { gryffindor:0, slytherin:0, ravenclaw:0, hufflepuff:0 },
    sortingAnswerIndex: 0,
    blackMarketVisits: 0,
    flags: {}  // general purpose story flags
  };
}

let G = createFreshState();

// ── 日期时间工具 ─────────────────────────────────────────
function formatDate() {
  return `${MONTH_NAMES[G.gameDate.month]}${DAY_SUFFIX[G.gameDate.day]}日`;
}

function formatTime() {
  return TIME_LABELS[G.gameDate.timeOfDay] || G.gameDate.timeOfDay;
}

function advanceTime(opts = {}) {
  if (opts.timeOfDay) {
    G.gameDate.timeOfDay = opts.timeOfDay;
  }
  const daysToAdd = opts.days || 0;
  if (daysToAdd > 0) {
    G.gameDate.day += daysToAdd;
    const daysInMonth = [0,31,28,31,30,31,30,31,31,30,31,30,31];
    while (G.gameDate.day > daysInMonth[G.gameDate.month]) {
      G.gameDate.day -= daysInMonth[G.gameDate.month];
      G.gameDate.month++;
      if (G.gameDate.month > 12) { G.gameDate.month = 1; G.gameDate.year++; }
    }
    G.gameDate.week = Math.floor((G.gameDate.day - 1) / 7) + 1;
  }
}

// ── 数值工具 ──────────────────────────────────────────────
function getStatMax(statKey) {
  const stage = G.player.stats[statKey]?.stage || 1;
  return STAT_STAGE_CAPS[stage] || 40;
}

function changeStat(statKey, delta) {
  const stat = G.player.stats[statKey];
  if (!stat) return;
  const max = getStatMax(statKey);
  stat.cur = Math.max(0, Math.min(max, stat.cur + delta));
}

function changeConflict(delta) {
  G.player.conflictValue = Math.max(0, Math.min(100, G.player.conflictValue + delta));
}

function getConflictLevel() {
  const v = G.player.conflictValue;
  if (v >= 85) return 'critical';
  if (v >= 65) return 'high';
  if (v >= 40) return 'medium';
  return 'normal';
}

// ── 好感度工具 ────────────────────────────────────────────
function changeAffection(charId, delta) {
  const cs = G.characters[charId];
  if (!cs) return;
  cs.affection = Math.max(0, Math.min(100, cs.affection + delta));
  const newStage = AFFECTION_STAGES.findLastIndex(s => cs.affection >= s.range[0]);
  if (newStage > cs.stage) {
    cs.stage = newStage;
    return 'stage_up';
  }
  return null;
}

function getAffectionLabel(charId) {
  const cs = G.characters[charId];
  if (!cs) return '';
  return AFFECTION_STAGES[cs.stage]?.name || '陌生人';
}

// ── 背包工具 ──────────────────────────────────────────────
function addItem(item) {
  const existing = G.player.inventory.find(i => i.id === item.id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
  } else {
    G.player.inventory.push({ ...item, quantity: item.quantity || 1 });
  }
}

function removeItem(itemId, qty = 1) {
  const idx = G.player.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) return false;
  G.player.inventory[idx].quantity -= qty;
  if (G.player.inventory[idx].quantity <= 0) G.player.inventory.splice(idx, 1);
  return true;
}

// ── 成就工具 ──────────────────────────────────────────────
function unlockAchievement(id) {
  if (G.unlockedAchievements.includes(id)) return false;
  G.unlockedAchievements.push(id);
  return true;
}

function isAchievementUnlocked(id) {
  return G.unlockedAchievements.includes(id);
}

// ── 存档工具 ──────────────────────────────────────────────
function saveToSlot(slot) {
  G.saves[slot] = {
    data: JSON.parse(JSON.stringify(G)),
    timestamp: Date.now(),
    dateLabel: formatDate(),
    timeLabel: formatTime()
  };
  persistAll();
}

function loadFromSlot(slot) {
  const save = G.saves[slot];
  if (!save) return false;
  const savedSaves = G.saves;
  Object.assign(G, JSON.parse(JSON.stringify(save.data)));
  G.saves = savedSaves;
  return true;
}

function persistAll() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
  } catch(e) {
    console.warn('Save failed:', e);
  }
}

function loadAll() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    Object.assign(G, parsed);
    return true;
  } catch(e) {
    return false;
  }
}

// ── AI状态更新应用 ────────────────────────────────────────
function applyStateUpdate(update) {
  if (!update) return;

  if (update.dateChange) advanceTime(update.dateChange);

  if (update.statChanges) {
    Object.entries(update.statChanges).forEach(([k, v]) => changeStat(k, v));
  }
  if (update.conflictChange) changeConflict(update.conflictChange);

  if (update.affectionChanges) {
    Object.entries(update.affectionChanges).forEach(([k, v]) => changeAffection(k, v));
  }

  if (update.characterUpdates) {
    Object.entries(update.characterUpdates).forEach(([id, data]) => {
      if (G.characters[id]) {
        if (data.location)   G.characters[id].location   = data.location;
        if (data.psychology) G.characters[id].psychology = data.psychology;
        if (data.metPlayer !== undefined) G.characters[id].metPlayer = data.metPlayer;
      }
    });
  }

  if (update.inventoryAdd) {
    update.inventoryAdd.forEach(item => addItem(item));
  }

  if (update.goldChange) {
    G.player.gold = Math.max(0, G.player.gold + update.goldChange);
  }

  if (update.housePointsChange) {
    G.player.housePoints = Math.max(0, G.player.housePoints + update.housePointsChange);
    const h = G.player.house;
    if (h) G.semesterPoints[h] = Math.max(0, (G.semesterPoints[h]||0) + update.housePointsChange);
  }

  if (update.flagsSet) {
    Object.assign(G.flags, update.flagsSet);
  }

  if (update.achievementsUnlock) {
    update.achievementsUnlock.forEach(id => unlockAchievement(id));
  }

  if (update.blackMarketVisit) {
    G.blackMarketVisits++;
    if (G.blackMarketVisits >= 5) unlockAchievement('black_market');
  }

  persistAll();
}
