// ══════════════════════════════
// WEEKLY ADVANCE
// 幼崽期由行动点系统驱动，此函数仅成人期使用
// ══════════════════════════════
function advanceWeek() {
  if (G.phase === 'cub') return; // 幼崽期不走周推进

  G.gameWeek = (G.gameWeek||1) + 1;
  if (G.gameWeek > 52) {
    G.gameWeek = 1;
    G.absoluteYear++;
    G.gameYear++;
  }

  // Advance absolute date by ~7 days
  G.absoluteDay = (G.absoluteDay||1) + 7;
  const daysInMonth = [31,29,31,30,31,30,31,31,30,31,30,31];
  while (G.absoluteDay > daysInMonth[(G.absoluteMonth||1)-1]) {
    G.absoluteDay -= daysInMonth[(G.absoluteMonth||1)-1];
    G.absoluteMonth = ((G.absoluteMonth||1) % 12) + 1;
  }

  // Weekly resets
  G.weeklyTaskDone = false;
  G.weeklyMarketOpen = Math.random() < 0.35;

  // Random heat trigger (成人期)
  if (!G.inHeat) {
    if (Math.random() < 0.12) {
      G.inHeat = true;
      G.heatDaysLeft = 3 + Math.floor(Math.random()*4);
      addSysMsg('⚠ 状态变化', '发情期开始，持续约' + G.heatDaysLeft + '天。可使用抑制剂或等待自然结束。');
      CHARS.forEach(c => {
        if (Math.random() < 0.15) {
          G.bonds[c.id].status = 'heat';
          G.bonds[c.id].whisper = '';
        }
      });
    }
  } else {
    G.heatDaysLeft--;
    if (G.heatDaysLeft <= 0) {
      G.inHeat = false;
      CHARS.forEach(c=>{ if(G.bonds[c.id].status==='heat') G.bonds[c.id].status='normal'; });
    }
  }

  refreshWeeklyCharStates();
  saveGame(); updateTopBar(); renderMap(); renderBonds(); renderStatus();
  showToast('第' + G.gameYear + '年 第' + G.gameWeek + '周');

  setTimeout(()=>generateWeeklyTasks(), 500);
}

async function refreshWeeklyCharStates() {
  const dynamics  = ['休息中','巡逻','训练','用餐','任务中','休息中','训练'];
  const locations = ['hall','forge','medical','training','canteen','camps','camps'];
  CHARS.forEach(c => {
    const b = G.bonds[c.id];
    if (b.status === 'coma' || b.status === 'critical') { b.location = 'medical'; b.dynamic = '接受治疗'; return; }
    if (b.status === 'injured') { b.location = Math.random()<0.5?'medical':'camps'; b.dynamic = '休养中'; return; }
    const roll = Math.floor(Math.random()*dynamics.length);
    b.dynamic = dynamics[roll];
    b.location = b.dynamic === '任务中' ? 'camps' : locations[roll];
  });
}
