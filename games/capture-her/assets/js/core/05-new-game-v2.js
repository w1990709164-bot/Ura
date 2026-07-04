function updateDays() {
  const month = parseInt(document.getElementById('ng-month').value) || 1;
  const days = [31,29,31,30,31,30,31,31,30,31,30,31][month - 1] || 31;
  const sel = document.getElementById('ng-day');
  const cur = parseInt(sel.value);

  sel.innerHTML = '<option value="">Day</option>' +
    Array.from({ length: days }, (_, i) =>
      `<option value="${i + 1}"${cur === i + 1 ? ' selected' : ''}>${i + 1}</option>`
    ).join('');
}

function startNewGame() {
  const name = document.getElementById('ng-name').value.trim();
  const appearance = document.getElementById('ng-appearance').value.trim();
  const month = parseInt(document.getElementById('ng-month').value);
  const day = parseInt(document.getElementById('ng-day').value);
  const err = document.getElementById('ng-err');

  if (!name) {
    err.textContent = 'Please enter name';
    err.style.display = 'block';
    return;
  }

  if (!month || !day) {
    err.textContent = 'Please select birthday';
    err.style.display = 'block';
    return;
  }

  if (!localStorage.getItem('LW_API_KEY')) {
    err.textContent = 'Please set API key on main page first';
    err.style.display = 'block';
    return;
  }

  err.style.display = 'none';
  if (typeof resetGameState === 'function') resetGameState();
  G.apiKey = localStorage.getItem('LW_API_KEY') || G.apiKey || '';
  G.apiEndpoint = localStorage.getItem('LW_API_URL') || G.apiEndpoint || '';
  G.apiModel = localStorage.getItem('LW_API_MODEL') || G.apiModel || 'claude-sonnet-4-20250514';
  G.player = { name, appearance, birthday: { month, day } };
  G.month = month;
  G.day = day;
  G.totalDay = 1;

  saveGame();
  launchApp();

  triggerGlitch(() => {
    addSysMsg('File created', `${name} - Beta - Safe Zone Admin\nSystem is initializing Day 1...`);
    generateDailyTasks(() => callAI_opening());
  });
}

function launchApp() {
  showScreen('_none');
  document.getElementById('app').style.display = 'flex';
  document.getElementById('send-btn').disabled = false;
  updateTopBar();
  renderDossier();
  renderBackpack();
  renderChat();
  initDrawer();

  if (typeof refreshApiStatus === 'function') refreshApiStatus();
}

function syncModelSelect(selId, val) {
  const sel = document.getElementById(selId);
  if (!sel) return;

  let found = false;
  for (let opt of sel.options) {
    if (opt.value === val) {
      opt.selected = true;
      found = true;
      break;
    }
  }

  if (!found && val) {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = val;
    opt.selected = true;
    sel.appendChild(opt);
  }
}
