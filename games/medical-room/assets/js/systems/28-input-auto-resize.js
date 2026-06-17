// ══════════════════════════════
// INPUT AUTO-RESIZE
// ══════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  initDrawer();
  renderForum();

  const box = document.getElementById('input-box');
  box.addEventListener('input', function(){
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 90) + 'px';
  });
  box.addEventListener('keydown', function(e){
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  box.addEventListener('focus', ()=>expandDrawer());

  if (loadGame() && G.player.name) {
    // 读档后，用主页全局 API 覆盖存档里的旧值（主页是唯一来源）
    applyGlobalApi();
    if (G.apiKey) {
    document.getElementById('init-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('send-btn').disabled = false;
    updateTopBar();
    updateSlotDisplay();
    renderContactList();
    startClock();
    expandDrawer();
    restoreMessages();
    renderPhoneSchedule();
    renderWallet();
    setTimeout(()=>showToast(`✓ 存档读取 · 第${G.day}天 · ${G.player.name}`), 500);
    }
  }
});
