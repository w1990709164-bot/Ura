// ══════════════════════════════
// START NEW GAME
// ══════════════════════════════
function startNewGame() {
  const name = document.getElementById('ng-name').value.trim();
  const race = document.getElementById('ng-race').value.trim();
  const appearance = document.getElementById('ng-appearance').value.trim();
  const month = parseInt(document.getElementById('ng-month').value);
  const day = parseInt(document.getElementById('ng-day').value);
  const err = document.getElementById('ng-err');

  if (!name) { err.textContent = '请输入姓名'; err.style.display='block'; return; }
  if (!race) { err.textContent = '请输入种族'; err.style.display='block'; return; }
  if (!month || !day) { err.textContent = '请选择生日'; err.style.display='block'; return; }
  if (pointsLeft > 0) {
    err.textContent = `还剩 ${pointsLeft} 点未分配，请分配完毕再开始`;
    err.style.display='block'; return;
  }
  err.style.display='none';

  if (!G.apiKey) {
    err.textContent = '请先在设置中填写 API 密钥';
    err.style.display = 'block';
    return;
  }

  G.player = {name, race, appearance, birthday:{month, day}};
  G.stats = {...allocStats};
  G.absoluteMonth = month;
  G.absoluteDay = day;
  G.absoluteYear = 2060;
  G.gameYear = 1;
  G.gameWeek = 1;
  G.gameDay = 1;
  G.phase = 'cub';
  G.apUsedThisYear = [];
  G.apPending = null;
  G._freeToBond = 0;
  G._freeToGrow = 0;

  saveGame();
  launchApp();
  triggerGlitch(()=>{
    addSysMsg('灰盟驻地 · 入档记录', `【幼崽档案已建立】\n姓名：${name}\n种族：${race}\n生辰：2060年${month}月${day}日\n初始属性已录入`);
    callAI_opening();
  });
}

function launchApp() {
  showScreen('_none');
  document.getElementById('app').style.display = 'flex';
  document.getElementById('send-btn').disabled = false;
  updateTopBar();
  updateStatsBar();
  renderBonds();
  renderMap();
  renderStatus();
  renderBackpack();
  initDrawer();
  renderApPanel(); // 幼崽期行动点面板初始渲染

  // Fill in-game settings fields
  document.getElementById('gs-key').value = G.apiKey;
  document.getElementById('gs-endpoint').value = G.apiEndpoint;
  document.getElementById('gs-model').value = G.apiModel;
}
