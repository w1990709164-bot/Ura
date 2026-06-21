// ══════════════════════════════
// SAVE / LOAD
// ══════════════════════════════
function saveGame() {
  try {
    const save = {
      player: G.player,
      apiKey: G.apiKey,
      apiEndpoint: G.apiEndpoint,
      apiModel: G.apiModel,
      adultConfirmed: G.adultConfirmed,
      gameYear: G.gameYear,
      gameWeek: G.gameWeek,
      gameDay: G.gameDay,
      absoluteYear: G.absoluteYear,
      absoluteMonth: G.absoluteMonth,
      absoluteDay: G.absoluteDay,
      stats: G.stats,
      bonds: G.bonds,
      mood: G.mood,
      wallet: G.wallet,
      inHeat: G.inHeat,
      inventory: G.inventory,
      phase: G.phase,
      job: G.job,
      jobGrade: G.jobGrade,
      currentLocation: G.currentLocation,
      history: G.history.slice(-30),
      messages: G.messages.slice(-80),
      turnCount: G.turnCount,
      weeklyTaskDone: G.weeklyTaskDone,
      weeklyMarketOpen: G.weeklyMarketOpen,
      apUsedThisYear: G.apUsedThisYear,
      apPending: G.apPending || null,
      _freeToBond: G._freeToBond || 0,
      _freeToGrow: G._freeToGrow || 0,
    };
    localStorage.setItem('grey_ridge_save', JSON.stringify(save));
  } catch(e){ console.warn('Save failed:', e); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem('grey_ridge_save');
    if (!raw) return false;
    const save = JSON.parse(raw);
    Object.assign(G, save);
    if (!G.bonds) G.bonds = {};
    CHARS.forEach(c => {
      if (!G.bonds[c.id]) G.bonds[c.id] = {stage:0,value:0,whisper:'',status:'normal',location:'camps',dynamic:'休息中'};
    });
    if (!G.inventory) G.inventory = [];
    if (!G.stats) G.stats = {tq:0,mj:0,jz:0,js:0,zs:0,qs:0,yl:0};
    if (!Array.isArray(G.apUsedThisYear)) G.apUsedThisYear = [];
    if (!Number.isFinite(G._freeToBond)) G._freeToBond = 0;
    if (!Number.isFinite(G._freeToGrow)) G._freeToGrow = 0;
    return true;
  } catch(e){ return false; }
}

function loadGameAndStart() {
  if (loadGame()) {
    launchApp();
    restoreMessages();
    showToast(`✓ 档案读取 · 第${G.gameYear}年 第${G.gameWeek}周`);
  }
}

function exportSave() {
  const raw = localStorage.getItem('grey_ridge_save');
  if (!raw) { showToast('没有存档可导出'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([raw],{type:'application/json'}));
  a.download = `grey_ridge_save_${Date.now()}.json`;
  a.click();
  showToast('✓ 存档已导出');
}

function importSave(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    try {
      localStorage.setItem('grey_ridge_save', ev.target.result);
      showToast('✓ 导入成功，即将刷新');
      setTimeout(()=>location.reload(), 1500);
    } catch(e2){ showToast('⚠ 存档文件无效'); }
  };
  reader.readAsText(file);
}

function confirmReset() {
  if (confirm('确定重置？所有进度将丢失。')) {
    localStorage.removeItem('grey_ridge_save');
    location.reload();
  }
}
