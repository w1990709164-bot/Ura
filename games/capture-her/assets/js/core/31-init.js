// ═══════════════════════════════
// INIT
// ═══════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  const hasSave = loadGame();
  const hasApi  = !!localStorage.getItem('LW_API_KEY');

  if(hasSave && G.player.name && hasApi){
    document.getElementById('load-btn').style.display='block';
    if(G.adultConfirmed) document.getElementById('age-warn').style.display='none';
  }

  // 成人确认状态回填（API字段已由主页管理，不再回填）
  if(G.adultConfirmed){
    const cb = document.getElementById('st-adult');
    if(cb) cb.checked = true;
  }

  // 刷新设置页/游戏内设置的API状态文字
  if(typeof refreshApiStatus === 'function') refreshApiStatus();

  initDrawer();
  const box = document.getElementById('input-box');
  box.addEventListener('input', function(){ this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,90)+'px'; });
  box.addEventListener('keydown', function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMsg(); } });
  box.addEventListener('focus', ()=>expandDrawer());
});
