// ══════════════════════════════
// SAVE / LOAD
// ══════════════════════════════
function saveGame() {
  try {
    const save = {
      _savedAt: Date.now(),
      player: G.player,
      apiKey: G.apiKey,
      apiEndpoint: G.apiEndpoint,
      apiModel: G.apiModel,
      day: G.day,
      currentLocation: G.currentLocation,
      currentScene: G.currentScene,
      wallet: G.wallet,
      transactions: G.transactions.slice(-50),
      patients: G.patients,
      playerStats: G.playerStats,
      unlockedBags: G.unlockedBags,
      journalEntries: G.journalEntries,
      history: G.history.slice(-20),
      turnCount: G.turnCount,
      contacts: G.contacts,
      chatHistories: G.chatHistories,
      chatTrustToday: G.chatTrustToday || {},
      timeSlots: G.timeSlots,
      slotsUsed: G.slotsUsed,
      messages: G.messages.slice(-80),
      schedule: G.schedule,
      recentScheduleIds: G.recentScheduleIds || [],
      allTimeSeenIds: G.allTimeSeenIds || [],
      inventory: G.inventory,
      gifts: G.gifts,
      completedToday: G.completedToday||[],
      icuMode: G.icuMode||false,
      icuDaysLeft: G.icuDaysLeft||0,
      worldLog: (G.worldLog||[]).slice(-200),
      landscapeHistory: G.landscapeHistory || {},
      currentLandscape: G.currentLandscape || null,
    };
    localStorage.setItem('tower_clinic_save', JSON.stringify(save));
  } catch(e){ console.warn('Save failed:', e); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem('tower_clinic_save');
    if (!raw) return false;
    const save = JSON.parse(raw);
    // Merge save into G — new fields get defaults if missing
    Object.assign(G, save);
    // Ensure new fields exist for old saves
    if (!G.transactions) G.transactions = [];
    if (!G.schedule) G.schedule = [];
    if (!G.recentScheduleIds) G.recentScheduleIds = [];
    if (!G.allTimeSeenIds) G.allTimeSeenIds = [];
    if (!G.inventory) G.inventory = [];
    if (!G.gifts) G.gifts = [];
    if (!G.chatTrustToday) G.chatTrustToday = {};
    if (!G.completedToday) G.completedToday = [];
    if (G.icuMode === undefined) G.icuMode = false;
    if (!G.icuDaysLeft) G.icuDaysLeft = 0;
    if (!G.worldLog) G.worldLog = [];
    if (!G.landscapeHistory) G.landscapeHistory = {};
    if (G.currentLandscape === undefined) G.currentLandscape = null;
    if (!G.currentScene) G.currentScene = G.currentLocation || 'clinic';
    if (!G.sessionTurns) G.sessionTurns = 0;
    if (!G.clinicSession) G.clinicSession = null;
    if (!G.playerStats.level) G.playerStats.level = '见习';
    if (!G.playerStats.lastLeveledAt) G.playerStats.lastLeveledAt = null;
    // Ensure all patients have new fields
    CHARS.forEach(c => {
      if (!G.patients[c.id]) G.patients[c.id] = {
        mental:50, stress:30, trust:0, heat:0, tags:[], injury:'',
        visitCount:0, lastVisit:'—', location:'待命', trustPhase:0,
        trustAccum:0, memory:{summary:'尚未接触', keyEvents:[], doctorNote:'', lastUpdated:null}
      };
    });
    Object.keys(G.patients).forEach(id => {
      const p = G.patients[id];
      if (!p.injury) p.injury = '';
      if (!p.visitCount) p.visitCount = 0;
      if (!p.lastVisit) p.lastVisit = '—';
      if (!p.landscapeAnomaly) p.landscapeAnomaly = '';
      if (p.spiritContact === undefined) p.spiritContact = false;
      if (!p.memory) p.memory = {
        summary: '尚未接触',
        keyEvents: [],
        doctorNote: '',
        lastUpdated: null,
      };
      const defLocs2 = {keegan:'待命',ghost:'巡逻中',soap:'休息中',gaz:'待命',price:'任务中',hesh:'休息中',logan:'休息中',merrick:'简报中',konig:'走廊等候',horangi:'休息中',nikto:'未知',krueger:'任务待命',zimo:'任务中',graves:'商务会议'};
      if (!p.location) p.location = defLocs2[id] || '待命';
      if (!p.landscapeStatus) p.landscapeStatus = '';
      if (!p.spiritStatus) p.spiritStatus = '';
      if (!p.spiritLoc) p.spiritLoc = '';
      if (p.trustPhase === undefined) p.trustPhase = 0;
      if (p.trustAccum === undefined) p.trustAccum = 0;
      if (p.trustPhase > 9) p.trustPhase = 9;
    });
    saveGame();
    return true;
  } catch(e){ return false; }
}

function exportSave() {
  const raw = localStorage.getItem('tower_clinic_save');
  if (!raw) { showToast('没有存档可导出'); return; }
  const blob = new Blob([raw], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tower_clinic_save_${Date.now()}.json`;
  a.click();
  showToast('✓ 存档已导出');
}

function importSave(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    try {
      const save = JSON.parse(ev.target.result);
      localStorage.setItem('tower_clinic_save', JSON.stringify(save));
      showToast('✓ 存档导入成功，即将刷新');
      setTimeout(()=>location.reload(), 1500);
    } catch(err){ showToast('⚠ 存档文件无效'); }
  };
  reader.readAsText(file);
}

function confirmReset() {
  if (confirm('确定要重置游戏吗？所有进度将丢失。')) {
    localStorage.removeItem('tower_clinic_save');
    location.reload();
  }
}
