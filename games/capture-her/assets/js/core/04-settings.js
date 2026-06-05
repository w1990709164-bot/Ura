// ═══════════════════════════════
// SETTINGS
// ═══════════════════════════════

// API 由主页（里世界）全局管理，从 localStorage 读取
// LW_API_URL / LW_API_KEY / LW_API_MODEL

function saveSettings() {
  const confirmed = document.getElementById('st-adult').checked;
  const err = document.getElementById('st-err');
  if(!confirmed){ err.textContent='请确认年龄验证'; err.style.display='block'; return; }
  err.style.display='none';
  G.adultConfirmed = true;
  saveGame();
  showToast('✓ 设置已保存');
  showScreen('title-screen');
}

function toggleKey(inputId, btn) {
  const inp = document.getElementById(inputId);
  if(!inp) return;
  inp.type = inp.type==='password' ? 'text' : 'password';
  btn.textContent = inp.type==='password' ? '👁' : '🙈';
}
