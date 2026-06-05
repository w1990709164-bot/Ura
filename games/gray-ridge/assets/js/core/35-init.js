// ══════════════════════════════
// INIT
// ══════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  // ── 从里世界主页读取全局 API 设置 ──
  // 主页将 API 存在 LW_API_URL / LW_API_KEY / LW_API_MODEL
  const globalKey      = localStorage.getItem('LW_API_KEY')   || '';
  const globalEndpoint = localStorage.getItem('LW_API_URL')   || '';
  const globalModel    = localStorage.getItem('LW_API_MODEL') || '';

  if (globalKey) {
    G.apiKey      = globalKey;
    G.apiEndpoint = globalEndpoint;
    G.apiModel    = globalModel || 'claude-sonnet-4-20250514';
    saveGame(); // 同步进存档，避免每次重新读
  }

  // Check for existing save
  const hasSave = loadGame();
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
