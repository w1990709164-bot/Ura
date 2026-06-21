// ══════════════════════════════
// HORAE PROCESSING
// ══════════════════════════════
function processHorae(h) {
  if (!h) return;

  // Bond update
  if (h.char_id && G.bonds[h.char_id]) {
    const b = G.bonds[h.char_id];
    if (h.bond_delta !== undefined) {
      b.value = Math.max(0, Math.min(100, (b.value||0) + Number(h.bond_delta)));
      // Stage up check
      if (b.value >= 100 && b.stage < 6) {
        b.stage = (b.stage||0) + 1;
        b.value = 0;
        const c = CHARS.find(x=>x.id===h.char_id);
        showToast(`🐾 ${c?.name} 关系升级：${BOND_STAGES[b.stage]}`);
      }
    }
    if (h.whisper !== undefined) b.whisper = h.whisper;
    if (h.char_status) b.status = h.char_status;
    if (h.char_dynamic) b.dynamic = h.char_dynamic;
    if (h.char_location) b.location = h.char_location;
    renderBonds();
  }

  // Stat updates
  if (h.stat_gain) {
    Object.entries(h.stat_gain).forEach(([k,v]) => {
      if (G.stats[k] !== undefined) G.stats[k] = Math.max(0, G.stats[k] + Number(v));
    });
    updateStatsBar();
    renderStatus();
  }

  // Wallet
  if (h.gold_delta) {
    G.wallet = Math.max(0, G.wallet + Number(h.gold_delta));
    updateTopBar();
  }

  // Mood
  if (h.mood) { G.mood = h.mood; updateTopBar(); }

  // Heat
  if (h.player_heat !== undefined) G.inHeat = !!h.player_heat;
  if (h.item_gained) {
    G.inventory.push(h.item_gained);
    renderBackpack();
    showToast(`获得道具：${h.item_gained.name}`);
  }

  // Location
  if (h.location) {
    G.currentLocation = h.location;
    updateTopBar();
  }
  // Dice check request
  if (h.dice_check && h.dice_check.attr) {
    window._pendingDiceCheck = h.dice_check;
  }
  // Task complete signal
  if (h.task_complete && G.currentTask) {
    collectTaskReward(G.currentTask);
    addSysMsg('任务完成', G.currentTask.name + ' · 报酬已发放');
  }
  // Weekly advance signal — 仅成人期生效；幼崽期由行动点按月推进，忽略此字段
  if (h.week_end && G.phase === 'adult') {
    addSysMsg('本周结束', '剧情已告一段落。点击"进入下一周"继续。');
    const bar = document.getElementById('week-advance-bar');
    if (bar) { bar.style.display = 'block'; }
    else {
      // 动态创建进入下一周按钮
      const btn = document.createElement('button');
      btn.id = 'week-advance-bar';
      btn.className = 'week-advance-bar';
      btn.textContent = '▶ 进入下一周';
      btn.onclick = () => { btn.remove(); advanceWeek(); };
      document.getElementById('message-container')?.appendChild(btn);
    }
  }
  // 成人期可由剧情明确推进少量自然时间；幼崽期由行动点按月推进，避免重复计时。
  if (G.phase === 'adult' && h.time_advance_days) {
    const days = Math.min(31, Math.max(0, Number(h.time_advance_days) || 0));
    if (days) {
      advanceGameDateByDays(days);
      G.gameDay = (Number(G.gameDay) || 1) + days;
      updateTopBar();
    }
  }
  updateActionBar();
}
