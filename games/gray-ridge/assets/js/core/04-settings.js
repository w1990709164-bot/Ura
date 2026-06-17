// ══════════════════════════════
// SETTINGS
// ══════════════════════════════

// 把主页（里世界）全局 API 设置覆盖到当前游戏状态。主页是 API 的唯一来源。
function applyGlobalApi() {
  const key = localStorage.getItem('LW_API_KEY') || '';
  if (key) {
    G.apiKey      = key;
    G.apiEndpoint = localStorage.getItem('LW_API_URL')   || '';
    G.apiModel    = localStorage.getItem('LW_API_MODEL') || 'claude-sonnet-4-20250514';
  }
}

// 在游戏内修改 API 时，写回主页全局键，保持所有游戏一致。
function persistGlobalApi() {
  localStorage.setItem('LW_API_KEY',   G.apiKey   || '');
  localStorage.setItem('LW_API_URL',   G.apiEndpoint || '');
  localStorage.setItem('LW_API_MODEL', G.apiModel || '');
}

function saveSettings() {
  const key = document.getElementById('st-key').value.trim();
  const confirmed = document.getElementById('st-adult-confirm').checked;
  const err = document.getElementById('settings-err');
  if (!key) {
    err.textContent = '请输入 API 密钥';
    err.style.display = 'block';
    return;
  }
  if (!confirmed) {
    err.textContent = '请确认年龄验证';
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';
  G.apiKey = key;
  G.apiEndpoint = document.getElementById('st-endpoint').value.trim();
  G.apiModel = document.getElementById('st-model').value.trim();
  G.adultConfirmed = true;
  persistGlobalApi();
  saveGame();
  showToast('✓ 设置已保存');
  showScreen('title-screen');
}

function saveGameSettings() {
  G.apiKey = document.getElementById('gs-key').value.trim() || G.apiKey;
  G.apiEndpoint = document.getElementById('gs-endpoint').value.trim();
  G.apiModel = document.getElementById('gs-model').value.trim();
  persistGlobalApi();
  saveGame();
  showToast('✓ API 配置已保存');
}

function toggleKeyVis(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}
