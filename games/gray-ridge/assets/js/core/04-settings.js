// ══════════════════════════════
// SETTINGS
// ══════════════════════════════
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
  saveGame();
  showToast('✓ 设置已保存');
  showScreen('title-screen');
}

function saveGameSettings() {
  G.apiKey = document.getElementById('gs-key').value.trim() || G.apiKey;
  G.apiEndpoint = document.getElementById('gs-endpoint').value.trim();
  G.apiModel = document.getElementById('gs-model').value.trim();
  saveGame();
  showToast('✓ API 配置已保存');
}

function toggleKeyVis(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}
