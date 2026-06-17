// ══════════════════════════════
// SETTINGS
// ══════════════════════════════

// 主页（里世界）是 API 的唯一来源，存在 LW_API_URL / LW_API_KEY / LW_API_MODEL。
function applyGlobalApi() {
  const key = localStorage.getItem('LW_API_KEY') || '';
  if (key) {
    G.apiKey      = key;
    G.apiEndpoint = localStorage.getItem('LW_API_URL')   || '';
    G.apiModel    = localStorage.getItem('LW_API_MODEL') || '';
  }
}

function persistGlobalApi() {
  localStorage.setItem('LW_API_KEY',   G.apiKey      || '');
  localStorage.setItem('LW_API_URL',   G.apiEndpoint || '');
  localStorage.setItem('LW_API_MODEL', G.apiModel    || '');
}

function saveApiSettings() {
  G.apiKey      = document.getElementById('st-key').value.trim();
  G.apiEndpoint = document.getElementById('st-endpoint').value.trim();
  G.apiModel    = document.getElementById('st-model').value.trim();
  persistGlobalApi();
  saveGame();
  showToast('✓ API 配置已保存');
}
