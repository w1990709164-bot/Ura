// ══════════════════════════════
// TIME SLOT SYSTEM
// ══════════════════════════════
const SLOT_NAMES = {morning:'早', afternoon:'午', evening:'晚'};

function getCurrentSlot() {
  if (G.slotsUsed === 0) return 'morning';
  if (G.slotsUsed === 1) return 'afternoon';
  if (G.slotsUsed === 2) return 'evening';
  return null;
}

function useSlot(activity) {
  const slot = getCurrentSlot();
  if (!slot) { showToast('今日时间槽已用完'); return false; }
  G.timeSlots[slot] = activity;
  G.slotsUsed++;
  updateSlotDisplay();
  if (activity !== 'clinic') {
    Object.keys(G.patients).forEach(id=>{
      const p = G.patients[id];
      if (p.visitCount > 0) {
        p.mental = Math.min(100, p.mental + 3);
        p.trust  = Math.max(0, p.trust - 1);
      }
    });
  }
  checkEmergencies();
  maybeSpawnEmergency();
  saveGame();
  return true;
}

function updateSlotDisplay() {
  const el = document.getElementById('tb-slot');
  if (!el) return;
  const slots = [
    {key:'morning', label:'早', hour:'08-12'},
    {key:'afternoon', label:'午', hour:'12-17'},
    {key:'evening', label:'晚', hour:'17-22'},
  ];
  const used = G.slotsUsed;
  // Show: [完成·当前●·待定] style
  const parts = slots.map((s, i) => {
    if (i < used) return `<span style="color:var(--text3);text-decoration:line-through">${s.label}</span>`;
    if (i === used) {
      // Current slot — show who's being seen if in clinic
      if (G.clinicSession) {
        const cn = CHARS.find(x=>x.id===G.clinicSession);
        return `<span style="color:var(--cyan)">●${s.label}</span><span style="color:var(--cyan-dim);font-size:9px"> ${cn?.name?.split(' ')[0]||''}</span>`;
      }
      return `<span style="color:var(--cyan)">●${s.label}</span>`;
    }
    return `<span style="color:var(--text3)">${s.label}</span>`;
  });
  el.innerHTML = parts.join('<span style="color:var(--border2)">·</span>');
}

function checkEmergencies() {
  const crits = Object.entries(G.patients).filter(([id,p])=>p.mental>=85&&p.visitCount>0);
  if (crits.length > 0) {
    const [id] = crits[0];
    const c = CHARS.find(x=>x.id===id);
    if (c) {
      const el = document.getElementById('tb-task-text');
      el.textContent = `⚡ ${c.name} · 感官过载`;
      el.style.color = 'var(--pink)';
    }
  }
}

function travelTo(locId, locName) {
  if (G.slotsUsed >= 3) { showToast('今日时间槽已用完，明天再说吧'); return; }
  useSlot(locId);
  G.currentLocation = locId;
  G.currentScene = locId;
  showPanel('scene');
  const gt = getGameTime();
  const slotLbl = getSlotLabel();
  document.getElementById('sh-tag').textContent = `DAY ${G.day} · ${slotLbl} · ${gt}`;
  document.getElementById('sh-title').textContent = locName;
  document.getElementById('sh-sub').textContent = `T-MED · 塔区 · ${locName}`;

  // Clear old options (fix #4)
  hideOptions();
  // Reset session if leaving clinic
  if (locId !== 'clinic') {
    G.clinicSession = null;
    G.sessionTurns = 0;
  }

  // Push scene change to AI history so it knows location changed
  // For non-clinic: inject contacted characters' memories so AI knows relationships
  const contactedMemSnippets = G.contacts.map(cid => {
    const cp = G.patients[cid];
    const cc = CHARS.find(x=>x.id===cid);
    if (!cp || !cc) return null;
    const m = cp.memory;
    const phase = PHASE_LABELS[cp.trustPhase||0]||'戒备';
    let snippet = `${cc.name}（${phase}，第${cp.visitCount}次接触）：${m?.summary||'尚未建立关系'}`;
    if (m?.keyEvents?.length) snippet += `；最近：${m.keyEvents[0].text}`;
    return snippet;
  }).filter(Boolean);
  const memInject = contactedMemSnippets.length
    ? `\n\n【已接触角色关系备忘 — 偶遇时必须体现】\n${contactedMemSnippets.join('\n')}`
    : '';
  const todayLog = getTodayWorldLogPrompt();
  const sceneMsg = `[场景切换] 玩家前往：${locName}。请根据新地点生成合适的场景描写和互动，必须包含四个选项，格式：[OPTIONS: A.xxx | B.xxx | C.xxx | D.xxx]${memInject}${todayLog ? '\n\n'+todayLog : ''}`;
  G.history.push({role:'user', content: sceneMsg});
  addNarr(`*你前往了${locName}。*`);
  addWorldLog('system', null, `前往${locName}。`);
  saveGame();

  // Auto-trigger scene AI for non-clinic locations
  if (locId !== 'clinic') {
    callAI();
  }
}

function endDay() {
  const remaining = G.schedule.filter(s => !G.completedToday.includes(s.id));
  if (remaining.length > 0 && !confirm(`今天还有${remaining.length}个预约未完成，确定结束今天吗？`)) return;
  if (G.slotsUsed < 1 && remaining.length > 0 && !confirm('今天还没有完成任何看诊，确定结束今天？')) return;
  G.day++;
  G.slotsUsed = 0;
  G.timeSlots = {morning:null, afternoon:null, evening:null};
  G.currentLocation = 'clinic';
  G.currentScene = 'clinic';
  G.clinicSession = null;
  G.sessionTurns = 0;
  G.completedToday = [];

  // ICU recovery handling
  if (G.icuMode) {
    G.icuDaysLeft = Math.max(0, G.icuDaysLeft - 1);
    G.playerStats.shield = Math.min(100, G.playerStats.shield + 25);
    G.playerStats.fatigue = Math.max(0, G.playerStats.fatigue - 20);
    if (G.icuDaysLeft <= 0) {
      G.icuMode = false;
      G.playerStats.shield = Math.min(100, G.playerStats.shield + 30);
      G.history = G.history.slice(-6);
      updateSlotDisplay(); hideOptions(); showPanel('scene');
      document.getElementById('sh-tag').textContent = 'DAY ' + G.day;
      document.getElementById('sh-title').textContent = '塔医疗部 — 精神疏导科';
      document.getElementById('sh-sub').textContent = 'T-MED / PSYCH UNIT 3 / FLOOR A3';
      generateSchedule(); renderPhoneSchedule();
      updateTopBar(); checkLevelUp(); saveGame();
      showToast('☀ 第' + G.day + '天 · 已出院归队');
      const schedNames = G.schedule.map(function(s){ const c = CHARS.find(function(x){return x.id===s.id;}); return c ? c.name : s.id; }).join('、');
      const icuRecoveryMsg = '[ICU出院] 向导医生经过ICU康复，精神屏障已恢复，今天重新回到诊疗室岗位。精神上还有些许倦意，但可以正常工作了。今日预约：' + schedNames + '。请生成出院归来的场景描写，体现刚经历重伤恢复的状态，必须包含四个选项，格式：[OPTIONS: A.xxx | B.xxx | C.xxx | D.xxx]';
      G.history.push({role:'user', content: icuRecoveryMsg});
      callAI();
    } else {
      G.history = G.history.slice(-4);
      updateSlotDisplay(); hideOptions(); showPanel('scene');
      document.getElementById('sh-tag').textContent = 'DAY ' + G.day + ' · ICU';
      document.getElementById('sh-title').textContent = '塔医疗部 — ICU病房';
      document.getElementById('sh-sub').textContent = 'T-MED / ICU WARD · 还需休养' + G.icuDaysLeft + '天';
      generateSchedule(); renderPhoneSchedule();
      updateTopBar(); saveGame();
      showToast('🏥 第' + G.day + '天 · ICU休养中（剩余' + G.icuDaysLeft + '天）');
      const icuMsg = '[ICU住院] 向导医生精神屏障崩溃，正在ICU病房接受治疗。今天无法接诊。白色天花板，消毒水气味，偶尔有医护人员进来查房。窗外的塔依然在运转。还需要休养' + G.icuDaysLeft + '天才能出院。请描写ICU病房里的碎片化场景，可以有角色来探望，必须包含四个选项，格式：[OPTIONS: A.xxx | B.xxx | C.xxx | D.xxx]';
      G.history.push({role:'user', content: icuMsg});
      callAI();
    }
    return;
  }
  G.playerStats.fatigue = Math.max(0, G.playerStats.fatigue - 30);
  G.playerStats.shield  = Math.min(100, G.playerStats.shield + 10);
  // Reset daily weather so updateTopBar picks a fresh one
  G.weather = '';
  G.weatherIcon = '';
  // Link decay + stress recovery
  Object.keys(G.patients).forEach(id=>{
    const p = G.patients[id];
    if (p.heat > 0) p.heat = Math.max(0, p.heat - 3);
    if (p.visitCount > 0) p.mental = Math.min(100, p.mental + 2);
    if (p.stress > 0) p.stress = Math.max(0, p.stress - 5);
  });
  // Daily salary base
  addSalary(500, '向导医生日常津贴');

  // Generate world log daily summary for journal
  const todayEvents = (G.worldLog||[]).filter(e => e.day === G.day - 1);
  if (todayEvents.length > 0) {
    const summaryLines = todayEvents.map(e => {
      const who = e.charName ? `[${e.charName}]` : '';
      return `${e.slot} ${who} ${e.text}`;
    });
    addJournalEntry(`【第${G.day-1}天 世界记录】\n${summaryLines.join('\n')}`, getGameDate(G.day-1).full);
  }

  // Generate new schedule (fix #9)
  generateSchedule();
  renderPhoneSchedule();

  // Clear old AI history for fresh day (keep last 6 for context)
  G.history = G.history.slice(-6);

  updateSlotDisplay();
  const el = document.getElementById('tb-task-text');
  el.textContent = '今日：看诊'; el.style.color = '';

  // Clear options and reset scene
  hideOptions();
  showPanel('scene');
  const gt2 = getGameTime();
  document.getElementById('sh-tag').textContent = `DAY ${G.day} · ${getSlotLabel()} · ${gt2}`;
  document.getElementById('sh-title').textContent = '塔医疗部 — 精神疏导科';
  document.getElementById('sh-sub').textContent = 'T-MED / PSYCH UNIT 3 / FLOOR A3';

  // Notify AI of new day (fix #5)
  const schedNames = G.schedule.map(s=>{const c=CHARS.find(x=>x.id===s.id);return c?.name||s.id;}).join('、');
  const recentLog = getRecentWorldLogPrompt(1);
  const newDayMsg = G.day === 2
    ? `[正式上班第一天] 现在是第${G.day}天早晨，向导医生第一次正式走进精神疏导科诊疗室开始接诊工作。昨天已经参观过了基地，今天是真正意义上的第一个工作日。今日预约：${schedNames}。请生成向导医生第一天正式上班走入诊疗室的场景描写——整理白大褂、环顾诊疗室、感受这是真正开始的时刻。必须包含四个选项，格式：[OPTIONS: A.xxx | B.xxx | C.xxx | D.xxx]${recentLog ? '\n\n'+recentLog : ''}`
    : `[新的一天] 现在是第${G.day}天早晨，向导医生回到诊疗室准备开始新的一天。今日预约：${schedNames}。请生成清晨场景描写，必须包含四个选项，格式：[OPTIONS: A.xxx | B.xxx | C.xxx | D.xxx]${recentLog ? '\n\n'+recentLog : ''}`;
  G.history.push({role:'user', content: newDayMsg});

  checkLevelUp();
  // Add journal entry for new day
  const todayCompleted = G.completedToday.map(id=>CHARS.find(x=>x.id===id)?.name||id);
  if (todayCompleted.length > 0) {
    addJournalEntry(`第${G.day-1}天结束。今天接诊了：${todayCompleted.join('、')}。`, getGameDate(G.day-1).full);
  }
  saveGame();
  showToast(`☀ 第${G.day}天开始 · ${getGameDate().full}`);
  updateClock();
  callAI();
  setTimeout(checkSpiritAppearance, 20000);
  setTimeout(checkAndTriggerEmergency, 5000);
}
