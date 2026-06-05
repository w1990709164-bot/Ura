// ══════════════════════════════
// ACTION BAR HANDLERS
// ══════════════════════════════
function handleWeekAction() {
  if (G.phase === 'cub') {
    openActionPointPanel();
  } else {
    // Adult: show weekly task or advance week
    if (!G.weeklyTaskDone) {
      generateWeeklyTasks();
    } else {
      if (confirm('结束本周，进入下一周？')) advanceWeek();
    }
  }
}

function handleMarket() {
  if (!G.weeklyMarketOpen) {
    showToast('🕯 黑市本周未开放');
    return;
  }
  openMarket();
}

function updateActionBar() {
  const weekBtn = document.getElementById('week-btn');
  const marketBtn = document.getElementById('market-btn');
  if (!weekBtn || !marketBtn) return;

  if (G.phase === 'cub') {
    const used = G.apUsedThisYear?.length || 0;
    const remaining = 8 - used;
    weekBtn.innerHTML = remaining > 0
      ? '⭐ 行动点 <span style="color:var(--gold);font-weight:700">' + remaining + '</span>'
      : '⭐ 行动点 <span style="color:var(--text3)">已用完</span>';
  } else {
    weekBtn.innerHTML = G.weeklyTaskDone
      ? '📅 下一周'
      : '⚔ 接取任务';
  }
  marketBtn.style.color = G.weeklyMarketOpen ? 'var(--gold)' : 'var(--text3)';
  marketBtn.innerHTML = G.weeklyMarketOpen ? '🕯 黑市 <span style="color:var(--green);font-size:8px">开放</span>' : '🕯 黑市';
}
