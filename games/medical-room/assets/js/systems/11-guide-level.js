// ══════════════════════════════
// GUIDE LEVEL SYSTEM
// assets/js/core/11-guide-level.js
// ══════════════════════════════

const LEVEL_REQUIREMENTS = {
  '见习': {nextLevel:'初级',  sessions:5,  phase:2, phaseCount:1},
  '初级': {nextLevel:'中级',  sessions:15, phase:4, phaseCount:2},
  '中级': {nextLevel:'高级',  sessions:30, phase:7, phaseCount:1},
  '高级': {nextLevel:'资深',  sessions:50, phase:8, phaseCount:2},
  '资深': {nextLevel:'首席',  sessions:80, phase:9, phaseCount:1},
  '首席': {nextLevel:null,    sessions:999,phase:10,phaseCount:1},
};

const WEEKLY_SALARY = {
  '见习': 800,
  '初级': 1200,
  '中级': 1800,
  '高级': 2500,
  '资深': 3500,
  '首席': 5000,
};

const LEVEL_UP_BONUS = 500;

// ── 周薪发放（每第7天开始时触发）──
function payWeeklySalary() {
  if (G.day <= 1) return;
  if (G.day % 7 !== 1) return; // 第1、8、15、22...天发薪
  const level = G.playerStats.level || '见习';
  const amount = WEEKLY_SALARY[level] || 800;
  addSalary(amount, `第${Math.floor(G.day/7)+1}周薪资（${level}向导医生）`);
  addSysMsg('💰 薪资结算', `本周薪资已到账：<span style="color:var(--teal)">+${amount} 积分</span><br><span style="font-size:11px;color:var(--text3)">职级：${level}向导医生</span>`);
}

// ── 晋升检测 ──
function checkLevelUp() {
  const level = G.playerStats.level || '见习';
  const req = LEVEL_REQUIREMENTS[level];
  if (!req || !req.nextLevel) return;
  if (G.playerStats.lastLeveledAt === level) return;

  const totalSessions = Object.values(G.patients).reduce((s,p)=>s+(p.visitCount||0),0);
  const highPhaseCount = Object.values(G.patients)
    .filter(p=>(p.trustPhase||0) >= req.phase).length;

  if (totalSessions >= req.sessions && highPhaseCount >= req.phaseCount) {
    G.playerStats.lastLeveledAt = level;
    G.playerStats.level = req.nextLevel;
    saveGame();
    showLevelUpNotice(level, req.nextLevel);
  }
}

function showLevelUpNotice(oldLevel, newLevel) {
  const existing = document.getElementById('levelup-modal');
  if (existing) existing.remove();
  const bg = document.createElement('div');
  bg.style.cssText = 'position:fixed;inset:0;background:rgba(5,8,16,0.9);z-index:9499;backdrop-filter:blur(8px)';
  document.body.appendChild(bg);
  const modal = document.createElement('div');
  modal.id = 'levelup-modal';
  modal.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    z-index:9500;background:#0a1020;
    border:1px solid #00e5ff;border-radius:8px;
    width:min(320px,90vw);padding:28px 24px;text-align:center;
    box-shadow:0 0 60px rgba(0,229,255,0.25);
    animation:msg-in 0.3s ease-out;
  `;
  modal.innerHTML = `
    <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:#2a4050;letter-spacing:3px;margin-bottom:12px">职级晋升通知</div>
    <div style="font-size:36px;margin-bottom:12px">⭐</div>
    <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:#5a7a90;margin-bottom:8px">${oldLevel} →</div>
    <div style="font-family:'Orbitron',monospace;font-size:22px;font-weight:700;color:#00e5ff;margin-bottom:8px;text-shadow:0 0 20px #00e5ff">${newLevel}</div>
    <div style="font-family:'Noto Serif SC',serif;font-size:13px;color:#c8dde8;line-height:1.8;margin:12px 0">
      恭喜晋升为${newLevel}向导医生<br>
      <span style="color:#5a7a90;font-size:12px">接诊权限已扩展</span>
    </div>
    <div style="font-family:'Share Tech Mono',monospace;font-size:13px;color:#00ffcc;margin-bottom:16px;padding:8px;background:rgba(0,255,204,0.06);border:1px solid rgba(0,255,204,0.2);border-radius:4px">
      + ${LEVEL_UP_BONUS.toLocaleString()} 积分 · 晋升奖励
    </div>
    <button id="levelup-confirm-btn" style="width:100%;padding:10px;background:rgba(0,229,255,0.1);border:1px solid #00e5ff;border-radius:4px;color:#00e5ff;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:2px">
      确认领取
    </button>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#levelup-confirm-btn').onclick = () => {
    bg.remove(); modal.remove();
    addSalary(LEVEL_UP_BONUS, `晋升为${newLevel}向导医生`);
  };
  bg.onclick = () => { bg.remove(); modal.remove(); };
  showToast(`⭐ 职级晋升：${newLevel}`);
}

// ── 阶段晋升 ──
function checkPhaseUp(charId) {
  const c = CHARS.find(x => x.id === charId);
  const p = G.patients[charId];
  if (!c || !p) return;
  const phase = p.trustPhase || 0;
  if (phase >= c.bags) return;
  const threshold = PHASE_THRESHOLDS[phase] || 100;
  if ((p.trustAccum || 0) >= threshold) {
    p.trustPhase = phase + 1;
    p.trustAccum = 0;
    unlockBag(charId, p.trustPhase);
  }
}

function unlockBag(charId, bagNum) {
  const c = CHARS.find(x => x.id === charId);
  if (!c) return;
  if ((G.unlockedBags[charId] || 0) < bagNum) {
    G.unlockedBags[charId] = bagNum;
    saveGame();
    showBagUnlock(charId, bagNum, c);
  }
}

function showBagUnlock(charId, bagNum, c) {
  const existing = document.getElementById('bag-unlock-modal');
  if (existing) existing.remove();
  const bg = document.createElement('div');
  bg.id = 'bag-unlock-bg';
  bg.style.cssText = 'position:fixed;inset:0;background:rgba(5,8,16,0.7);z-index:9499;backdrop-filter:blur(4px)';
  document.body.appendChild(bg);
  const modal = document.createElement('div');
  modal.id = 'bag-unlock-modal';
  modal.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    z-index:9500;background:var(--bg-panel,#0a1020);
    border:1px solid var(--cyan,#00e5ff);border-radius:8px;
    padding:28px 24px;max-width:300px;width:88%;
    box-shadow:0 0 40px rgba(0,229,255,0.2);
    animation:msg-in 0.3s ease-out;text-align:center;
  `;
  modal.innerHTML = `
    <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text3,#2a4050);letter-spacing:3px;margin-bottom:12px">档案解封通知</div>
    <div style="font-size:32px;margin-bottom:10px">📂</div>
    <div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--cyan,#00e5ff);margin-bottom:6px">${c.name}</div>
    <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--text2,#5a7a90);margin-bottom:4px">档案袋 #${String(bagNum).padStart(2,'0')} 已解封</div>
    <div style="font-family:'Noto Serif SC',serif;font-size:13px;color:var(--text,#c8dde8);margin:12px 0;line-height:1.7">
      信任度达到新阶段<br>
      <span style="color:var(--cyan,#00e5ff)">${PHASE_LABELS[bagNum]||'新阶段'}</span> 已解锁
    </div>
    <button id="bag-view-btn" style="width:100%;padding:10px;background:var(--cyan-glow,rgba(0,229,255,0.12));border:1px solid var(--cyan,#00e5ff);border-radius:4px;color:var(--cyan,#00e5ff);font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;cursor:pointer;letter-spacing:2px;margin-bottom:8px">
      查看档案袋
    </button>
    <button id="bag-later-btn" style="width:100%;padding:8px;background:none;border:1px solid var(--border,#1a2840);border-radius:4px;color:var(--text3,#2a4050);font-family:'Share Tech Mono',monospace;font-size:11px;cursor:pointer">
      稍后查看
    </button>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#bag-view-btn').onclick = () => { bg.remove(); modal.remove(); openArchiveForChar(charId); };
  modal.querySelector('#bag-later-btn').onclick = () => { bg.remove(); modal.remove(); };
  bg.onclick = () => { bg.remove(); modal.remove(); };
}

function openArchiveForChar(charId) {
  openOverlay('archive-panel');
  renderArchive();
  setTimeout(() => openCharArchive(charId), 100);
}

// ── 精神体行为 ──
const SPIRIT_BEHAVIORS = {
  clinic_low:  (name) => `${name}蜷缩在房间角落，警惕地注视着，随时准备逃跑`,
  clinic_mid:  (name) => `${name}在房间边缘徘徊，偶尔侧头打量向导，但保持距离`,
  clinic_high: (name) => `${name}慢慢靠近，在向导附近坐下，偶尔蹭一下又假装不在意`,
  patrol:      (name) => `${name}在哨兵周围来回溜达，时而嗅探空气，时而突然停下竖耳听声`,
  combat:      (name) => `${name}紧贴哨兵侧翼，毛发炸起，低吼，随时准备扑击`,
  rest:        (name) => `${name}蜷在哨兵身边假寐，耳朵偶尔抖动，警觉但放松`,
  sleep:       (name) => `${name}被收回去了，只有隐约的存在感，像远处的一团温热`,
  overload:    (name) => `${name}躁动不安，在虚空中乱撞，呼吸急促，发出低沉的哀鸣`,
  mission:     (name) => `${name}随哨兵出发，踪迹不见，但那股气息还在`,
  trust_visit: (name) => `${name}主动跑到向导这边，在周围转了一圈，又跑回去了`,
};

function getSpiritBehaviorPrompt(charId) {
  const p = G.patients[charId];
  const c = CHARS.find(x => x.id === charId);
  if (!p || !c) return '';
  const cd = (typeof CHAR_DATA !== 'undefined' ? CHAR_DATA[charId] : null) || {};
  const spiritName = cd.spirit || '精神体';
  const loc = p.location || cd.location || '休息中';
  const trust = p.trust || 0;

  if (loc.includes('战斗') || loc.includes('任务')) return SPIRIT_BEHAVIORS.combat(spiritName);
  if (loc.includes('睡眠') || loc.includes('睡觉')) return SPIRIT_BEHAVIORS.sleep(spiritName);
  if (loc.includes('休息')) return SPIRIT_BEHAVIORS.rest(spiritName);
  if (loc.includes('巡逻') || loc.includes('待命')) return SPIRIT_BEHAVIORS.patrol(spiritName);
  if (G.currentLocation === 'clinic' && G.clinicSession === charId) {
    if (trust < 30) return SPIRIT_BEHAVIORS.clinic_low(spiritName);
    if (trust < 65) return SPIRIT_BEHAVIORS.clinic_mid(spiritName);
    return SPIRIT_BEHAVIORS.clinic_high(spiritName);
  }
  if (trust > 60 && Math.random() < 0.3) return SPIRIT_BEHAVIORS.trust_visit(spiritName);
  return SPIRIT_BEHAVIORS.patrol(spiritName);
}

// ── 紧急事件 ──
const EMERGENCY_TEMPLATES = [
  {
    id: 'mission_overload',
    title: '任务中感官过载',
    triggerCondition: (id, p) => p.mental >= 80 && (p.location||'').includes('任务'),
    generateMsg: (c) => `⚡ 紧急通报：${c.name} 在任务执行中出现感官过载，队伍请求向导远程介入稳定。`,
  },
  {
    id: 'night_crisis',
    title: '夜间精神危机',
    triggerCondition: (id, p) => p.mental >= 75 && p.visitCount > 0 && Math.random() < 0.1,
    generateMsg: (c) => `🌙 深夜紧急：${c.name} 出现神游症状，已被送往医疗部。`,
  },
  {
    id: 'spirit_rampage',
    title: '精神体失控',
    triggerCondition: (id, p) => p.stress >= 85 && p.visitCount > 1,
    generateMsg: (c) => `⚠ 警报：${c.name} 精神体进入躁动状态，周围人员已疏散，需要向导立即介入。`,
  },
];

function checkAndTriggerEmergency() {
  if (countUrgentToday() >= 1) return; // 每天最多1个紧急
  for (const [id, p] of Object.entries(G.patients)) {
    const c = CHARS.find(x => x.id === id);
    if (!c) continue;
    for (const tmpl of EMERGENCY_TEMPLATES) {
      if (tmpl.triggerCondition(id, p)) {
        triggerEmergency(id, c, tmpl);
        return;
      }
    }
  }
}

function triggerEmergency(charId, c, tmpl) {
  if (G.schedule.find(s => s.id === charId && s.type === 'urgent')) return;
  if (countUrgentToday() >= 1) return;

  // 随机插入三个固定时间槽之间
  const slots = ['09:00','10:30','15:00'];
  const insertIdx = Math.floor(Math.random() * (slots.length + 1));
  const urgentEntry = { id: charId, type: 'urgent', time: '⚡紧急', reason: tmpl.title + ' ⚡' };
  G.schedule.splice(insertIdx, 0, urgentEntry);

  renderPhoneSchedule();
  const el = document.getElementById('tb-task-text');
  if (el) { el.textContent = `⚡ ${c.name} · ${tmpl.title}`; el.style.color = 'var(--pink,#ff2d6b)'; }
  addSysMsg('⚡ 紧急通报', tmpl.generateMsg(c));
  G.history.push({ role:'user', content:`[紧急事件] ${tmpl.generateMsg(c)} 请生成紧急疏导场景，向导需要立即介入。` });
  G.clinicSession = charId;
  G.sessionTurns = 0;
  saveGame();
  showToast(`⚡ 紧急事件：${c.name}`);
}

function countUrgentToday() {
  return (G.schedule || []).filter(s => s.type === 'urgent').length;
}

// ── 阶段进度辅助 ──
function getCurrentPhase(charId) {
  return G.patients[charId]?.trustPhase || 0;
}

function getPhaseProgress(charId) {
  const p = G.patients[charId];
  if (!p) return { current:0, max:100, pct:0 };
  const phase = p.trustPhase || 0;
  const max = (typeof PHASE_THRESHOLDS !== 'undefined' ? PHASE_THRESHOLDS[phase] : null) || 100;
  const current = p.trustAccum || 0;
  const pct = Math.min(100, Math.round(current / max * 100));
  return { current, max, pct };
}
