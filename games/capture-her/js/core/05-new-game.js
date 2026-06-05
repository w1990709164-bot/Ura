// ═══════════════════════════════
// NEW GAME
// ═══════════════════════════════
function updateDays() {
  const month = parseInt(document.getElementById('ng-month').value)||1;
  const days = [31,29,31,30,31,30,31,31,30,31,30,31][month-1]||31;
  const sel = document.getElementById('ng-day');
  const cur = parseInt(sel.value);
  sel.innerHTML = '<option value="">日期</option>' +
    Array.from({length:days},(_,i)=>`<option value="${i+1}"${cur===i+1?' selected':''}>${i+1}日</option>`).join('');
}

function startNewGame() {
  const name = document.getElementById('ng-name').value.trim();
  const appearance = document.getElementById('ng-appearance').value.trim();
  const month = parseInt(document.getElementById('ng-month').value);
  const day = parseInt(document.getElementById('ng-day').value);
  const err = document.getElementById('ng-err');
  if(!name){ err.textContent='请输入姓名'; err.style.display='block'; return; }
  if(!month||!day){ err.textContent='请选择生日'; err.style.display='block'; return; }
  if(!G.apiKey){ err.textContent='请先在设置中填写API密钥'; err.style.display='block'; return; }
  err.style.display='none';
  G.player = {name, appearance, birthday:{month,day}};
  G.month = month; G.day = day;
  G.totalDay = 1;
  saveGame();
  launchApp();
  triggerGlitch(()=>{
    addSysMsg('档案建立', `${name} · Beta · 安全区行政\n系统正在初始化第一天…`);
    generateDailyTasks(()=> callAI_opening());
  });
}

function launchApp() {
  showScreen('_none');
  document.getElementById('app').style.display='flex';
  document.getElementById('send-btn').disabled=false;
  updateTopBar();
  renderDossier();
  renderBackpack();
  renderChat();
  initDrawer();
  // Fill gs settings
  document.getElementById('gs-key').value = G.apiKey;
  document.getElementById('gs-endpoint').value = G.apiEndpoint;
  // Sync model selects
  syncModelSelect('gs-model', G.apiModel);
}

function syncModelSelect(selId, val) {
  const sel = document.getElementById(selId);
  if(!sel) return;
  let found = false;
  for(let opt of sel.options) { if(opt.value===val){ opt.selected=true; found=true; break; } }
  if(!found) { const opt = document.createElement('option'); opt.value=val; opt.textContent=val; opt.selected=true; sel.appendChild(opt); }
}
