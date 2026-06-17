// ══════════════════════════════
// INIT
// ══════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  // ── 先读取已有存档，再覆盖 API 设置 ──
  // 注意：必须先 loadGame()，否则在默认空状态下 saveGame() 会清空已有存档。
  const hasSave = loadGame();

  // ── 从里世界主页读取全局 API 设置（主页是唯一来源）──
  // 主页将 API 存在 LW_API_URL / LW_API_KEY / LW_API_MODEL
  applyGlobalApi();

  if (hasSave && G.player.name && G.apiKey) {
    document.getElementById('load-btn').style.display = 'block';
    if (G.adultConfirmed) document.getElementById('age-warn').style.display = 'none';
  }

  initDrawer();

  const box = document.getElementById('input-box');
  box.addEventListener('input', function(){
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 90)+'px';
  });
  box.addEventListener('keydown', function(e){
    if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
  });
  box.addEventListener('focus', ()=>expandDrawer());

  // 游戏内设置栏同步显示（只读参考，实际改API去主页）
  if (G.apiKey)      document.getElementById('st-key').value      = G.apiKey;
  if (G.apiModel)    document.getElementById('st-model').value    = G.apiModel;
  if (G.apiEndpoint) document.getElementById('st-endpoint').value = G.apiEndpoint;
  if (G.adultConfirmed) document.getElementById('st-adult-confirm').checked = true;

  // 幼崽期行动点面板初始渲染
  renderApPanel();
});
