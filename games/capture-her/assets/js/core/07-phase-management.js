// ═══════════════════════════════
// PHASE MANAGEMENT
// ═══════════════════════════════
function switchPhase(phase) {
  G.phase = phase;
  updateTopBar();
  updateSecondTabNav();
  if(phase==='evening') generateEveningChat();
  showMainView('scene');
}

function advancePhase() {
  if(G.phase==='morning') {
    G.phase='midday'; updateTopBar();
    showMainView('scene');
    triggerNextTaskEvent();
  } else if(G.phase==='midday') {
    const pending = G.dailyTasks.filter(t=>!t.done);
    if(pending.length > 0) {
      triggerNextTaskEvent();
    } else {
      G.phase='evening'; updateTopBar();
      updateSecondTabNav();
      showMainView('scene');
      generateEveningChat();
      addSysMsg('白天结束', '今日所有任务事件已触发，进入傍晚。');
    }
  } else {
    if (typeof advanceDay === 'function') advanceDay();
    else showLeaderboard();
  }
}
