// ═══════════════════════════════
// PHASE MANAGEMENT
// ═══════════════════════════════
function switchPhase(phase) {
  G.phase = phase;
  updateTopBar();
  updateSecondTabNav();
  if(phase==='evening') {
    generateEveningChat();
  }
  showMainView('scene');
}

function advancePhase() {
  if(G.phase==='morning') {
    G.phase='midday'; updateTopBar();
    showMainView('scene');
    triggerNextTaskEvent();
  } else if(G.phase==='midday') {
    // Check if there are still pending tasks
    const pending = G.dailyTasks.filter(t=>!t.done);
    if(pending.length > 0) {
      // Still have tasks - trigger next one
      triggerNextTaskEvent();
    } else {
      // All tasks done or no more tasks - go to evening
      G.phase='evening'; updateTopBar();
      updateSecondTabNav();
      showMainView('scene');
      generateEveningChat();
      addSysMsg('白天结束', '今日所有任务事件已触发，进入傍晚。');
    }
  } else {
    showLeaderboard();
  }
}
