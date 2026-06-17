// ═══════════════════════════════
// SCREEN MANAGEMENT
// ═══════════════════════════════
function showScreen(id) {
  ['title-screen','settings-screen','newgame-screen'].forEach(s=>{
    const el = document.getElementById(s);
    if(el) el.style.display='none';
  });
  if(id && id!=='_none'){
    const el = document.getElementById(id);
    if(el) el.style.display='flex';
  }
}

function showNewGame() {
  if(!G.adultConfirmed) document.getElementById('age-warn').style.display='block';
  showScreen('newgame-screen');
  updateDays();
  if(!G.apiKey) showToast('提示：请先在设置中配置API密钥');
}
