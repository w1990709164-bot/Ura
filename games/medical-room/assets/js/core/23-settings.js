// ══════════════════════════════
// SETTINGS
// ══════════════════════════════
function saveApiSettings() {
  G.apiKey      = document.getElementById('st-key').value.trim();
  G.apiEndpoint = document.getElementById('st-endpoint').value.trim();
  G.apiModel    = document.getElementById('st-model').value.trim();
  saveGame();
  showToast('✓ API 配置已保存');
}
