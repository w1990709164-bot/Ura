// ══════════════════════════════
// PHONE MEDICAL RECORD
// assets/js/systems/phone-medical-record.js
// 电子病历弹窗 + 看诊结束手动确认
// ══════════════════════════════

// ── 电子病历弹窗 ──
function showMedicalRecord(charId) {
  const c = CHARS.find(x => x.id === charId);
  const p = G.patients[charId];
  const cd = (typeof CHAR_DATA !== 'undefined' ? CHAR_DATA[charId] : null) || {};
  if (!c || !p) return;

  const existing = document.getElementById('medical-record-modal');
  if (existing) existing.remove();
  const existingBg = document.getElementById('medical-record-bg');
  if (existingBg) existingBg.remove();

  const bg = document.createElement('div');
  bg.id = 'medical-record-bg';
  bg.style.cssText = 'position:fixed;inset:0;background:rgba(5,8,16,0.92);z-index:9499;backdrop-filter:blur(6px)';
  document.body.appendChild(bg);

  const phase = (typeof PHASE_LABELS !== 'undefined' ? PHASE_LABELS[p.trustPhase||0] : null) || '戒备';
  const heatLabel = !p.heat || p.heat === 0 ? '未触发' :
    p.heat < 30 ? `初期（${p.heat}）` :
    p.heat < 60 ? `发展中（${p.heat}）` :
    p.heat < 85 ? `深度（${p.heat}）` : `极深（${p.heat}）`;

  // 就诊诊断：首次显示前任向导记录，之后显示历史摘要
  const diagBlock = buildDiagnosisBlock(charId, p, c);

  // 状态标签颜色
  const mentalColor = (p.mental||50) > 70 ? 'var(--pink)' : (p.mental||50) > 40 ? 'var(--yellow,#ffd600)' : 'var(--teal)';
  const stressColor = (p.stress||30) > 70 ? 'var(--pink)' : (p.stress||30) > 40 ? 'var(--yellow,#ffd600)' : 'var(--teal)';

  const modal = document.createElement('div');
  modal.id = 'medical-record-modal';
  modal.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    z-index:9500;background:#050810;
    border:1px solid #1a3040;border-radius:4px;
    width:min(380px,94vw);max-height:88vh;
    display:flex;flex-direction:column;
    box-shadow:0 0 40px rgba(0,229,255,0.12);
    animation:msg-in 0.25s ease-out;
    font-family:'Share Tech Mono',monospace;
  `;

  modal.innerHTML = `
    <!-- 病历头部 -->
    <div style="background:#0a1520;border-bottom:1px solid #1a3040;padding:14px 16px;flex-shrink:0">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div>
          <div style="font-size:9px;color:#2a4050;letter-spacing:3px;margin-bottom:4px">塔医疗部 · 精神疏导科 · 第三诊疗组</div>
          <div style="font-size:9px;color:#2a4050;letter-spacing:2px">MEDICAL RECORD · T-MED/PSYCH/UNIT3</div>
        </div>
        <button onclick="closeMedicalRecord()" style="background:none;border:1px solid #1a3040;border-radius:3px;color:#2a4050;width:28px;height:28px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">✕</button>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:44px;height:44px;border-radius:3px;background:#0a1828;border:1px solid #1a3040;display:flex;align-items:center;justify-content:center;font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:#00e5ff;flex-shrink:0">${c.init}</div>
        <div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;color:#e8f4ff;letter-spacing:1px">${c.name}</div>
          <div style="font-size:10px;color:#5a7a90;margin-top:2px">${c.unit} · 哨兵</div>
        </div>
        <div style="margin-left:auto;text-align:right">
          <div style="font-size:9px;color:#2a4050">病历号</div>
          <div style="font-size:11px;color:#00e5ff">T3-${charId.toUpperCase().padStart(4,'0')}</div>
        </div>
      </div>
    </div>

    <!-- 病历正文 -->
    <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch">

      <!-- 基础信息 -->
      <div style="padding:12px 16px;border-bottom:1px solid #0f1e2a">
        <div style="font-size:9px;color:#00e5ff;letter-spacing:3px;margin-bottom:10px">── 基础信息 ──────────────────</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${infoRow('姓名', c.name)}
          ${infoRow('性别', getCharGender(charId))}
          ${infoRow('年龄', getCharAge(charId))}
          ${infoRow('国籍', getCharNation(charId))}
          ${infoRow('单位', c.unit)}
          ${infoRow('职级', getCharRank(charId))}
          ${infoRow('精神体', cd.spirit || '未知')}
          ${infoRow('图景', cd.landscape || '未知')}
        </div>
      </div>

      <!-- 精神状态 -->
      <div style="padding:12px 16px;border-bottom:1px solid #0f1e2a">
        <div style="font-size:9px;color:#00e5ff;letter-spacing:3px;margin-bottom:10px">── 当前精神状态 ──────────────</div>
        ${medBar('感官负荷', p.mental||50, mentalColor)}
        ${medBar('应激水平', p.stress||30, stressColor)}
        ${medBar('信任进度', getPhaseProgress(charId).pct, 'var(--teal,#00ffcc)')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          ${infoRow('关系阶段', phase)}
          ${infoRow('就诊次数', `第${p.visitCount||0}次`)}
          ${infoRow('精神图景状态', p.landscapeStatus||cd.landscapeStatus||'未知')}
          ${infoRow('精神体状态', p.spiritStatus||cd.spiritStatus||'未知')}
        </div>
      </div>

      <!-- 结合状态 -->
      <div style="padding:12px 16px;border-bottom:1px solid #0f1e2a">
        <div style="font-size:9px;color:#00e5ff;letter-spacing:3px;margin-bottom:10px">── 结合状态 ──────────────────</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${infoRow('结合热度', heatLabel)}
          ${infoRow('精神体接触', p.spiritContact?'✓ 已接触':'✗ 未接触')}
          ${infoRow('图景进入记录', p.lastVisit?`最近：${p.lastVisit}`:'未进入')}
          ${infoRow('图景异常', p.landscapeAnomaly||'无')}
        </div>
      </div>

      <!-- 身体状态 -->
      <div style="padding:12px 16px;border-bottom:1px solid #0f1e2a">
        <div style="font-size:9px;color:#00e5ff;letter-spacing:3px;margin-bottom:8px">── 身体状态 ──────────────────</div>
        <div style="font-size:12px;color:#8aa0b0;line-height:1.8">${p.injury||'无异常'}</div>
      </div>

      <!-- 就诊记录 -->
      <div style="padding:12px 16px;border-bottom:1px solid #0f1e2a">
        <div style="font-size:9px;color:#00e5ff;letter-spacing:3px;margin-bottom:10px">── 就诊记录 ──────────────────</div>
        ${diagBlock}
      </div>

      <!-- 向导备注 -->
      <div style="padding:12px 16px">
        <div style="font-size:9px;color:#00e5ff;letter-spacing:3px;margin-bottom:8px">── 向导备注 ──────────────────</div>
        <div style="font-size:12px;color:#8aa0b0;line-height:1.8;font-family:'Noto Serif SC',serif">${p.memory?.doctorNote||'（无）'}</div>
      </div>

    </div>

    <!-- 底部按钮 -->
    <div style="padding:12px 16px;border-top:1px solid #1a3040;background:#0a1520;flex-shrink:0">
      <button onclick="closeMedicalRecord()" style="width:100%;padding:10px;background:rgba(0,229,255,0.06);border:1px solid #1a3040;border-radius:3px;color:#5a7a90;font-family:'Share Tech Mono',monospace;font-size:11px;cursor:pointer;letter-spacing:2px">
        收起病历
      </button>
    </div>
  `;

  document.body.appendChild(modal);
  bg.onclick = closeMedicalRecord;
}

function closeMedicalRecord() {
  const modal = document.getElementById('medical-record-modal');
  const bg    = document.getElementById('medical-record-bg');
  if (modal) modal.remove();
  if (bg)    bg.remove();
}

// 就诊记录块
function buildDiagnosisBlock(charId, p, c) {
  const logs = (G.worldLog||[]).filter(e => e.charId === charId && e.type === 'clinic').slice(-5).reverse();

  if (p.visitCount === 0 && logs.length === 0) {
    // 首次就诊：显示前任向导的记录
    const prevRecord = getPrevGuideRecord(charId, c);
    return `
      <div style="background:#0a1828;border:1px solid #1a3040;border-radius:3px;padding:10px;margin-bottom:6px">
        <div style="font-size:9px;color:#2a4050;letter-spacing:2px;margin-bottom:6px">前任向导诊断记录</div>
        <div style="font-size:12px;color:#8aa0b0;line-height:1.8;font-family:'Noto Serif SC',serif">${prevRecord}</div>
      </div>`;
  }

  let html = '';
  if (logs.length === 0) {
    html = `<div style="font-size:12px;color:#2a4050">暂无记录</div>`;
  } else {
    html = logs.map(e => `
      <div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #0f1e2a">
        <div style="font-size:10px;color:#00e5ff;flex-shrink:0;white-space:nowrap">第${e.day}天</div>
        <div style="font-size:11px;color:#8aa0b0;line-height:1.7">${e.text}</div>
      </div>`).join('');
  }

  if (p.lastVisit) {
    html = `<div style="font-size:10px;color:#2a4050;margin-bottom:8px">上次就诊：${p.lastVisit}</div>` + html;
  }
  return html;
}

// 前任向导记录（静态预设，首次就诊时显示）
const PREV_GUIDE_RECORDS = {
  ghost:   '感官负荷长期维持高位，拒绝配合评估，多次终止问诊。建议新接诊向导保持专业距离，避免直接询问个人经历。',
  keegan:  '听觉过敏，对突发噪音反应强烈。话少，配合度低，但不排斥到场。建议以沉默陪伴为主。',
  soap:    '轻度耳鸣，感官状态整体良好。患者话多配合好，但存在回避倾向，注意话题引导。',
  gaz:     '情绪压抑型，表面稳定实则消耗过高。建议重点关注其自身需求而非职业表现。',
  price:   '感官疲劳长期累积，本人不承认。建议以工作切入，循序渐进。',
  hesh:    '幸存者内疚症状，情绪波动集中在提及父亲或弟弟时。建议避免直接追问。',
  logan:   '几乎不开口，但感官负荷在言语输出时有明显下降。建议给予足够沉默空间。',
  kick:    '年龄偏小，感官过载主要来自高频电子设备长期暴露。配合度高，注意不要被其活跃状态掩盖真实问题。',
  konig:   '重度社交焦虑，感官严重过载。需要充分的空间适应期，禁止突然靠近。',
  horangi: '情绪整体健康，主要问题为习惯性内化情绪。注意观察其"轻描淡写"背后的实际状态。',
  nikto:   '解离性人格障碍，人格切换无规律。记录时需注明当次接诊为哪一人格状态。',
  krueger: '高戒备，前期几乎无输出。建议长期稳定出现，等待其主动开口。',
  zimo:    '情绪稳定，心理边界清晰。但存在自我边界侵蚀风险，注意其共感能力的消耗。',
  graves:  '本人不认为自己有问题。建议以专业评估为由维持接触，等待其防御降低。',
};

function getPrevGuideRecord(charId, c) {
  return PREV_GUIDE_RECORDS[charId] || `${c.name}为新患者，尚无前任向导诊断记录。建议初次接诊以观察为主。`;
}

// 辅助：信息行
function infoRow(label, value) {
  return `
    <div style="background:#0a1520;border:1px solid #0f1e2a;border-radius:2px;padding:6px 8px">
      <div style="font-size:9px;color:#2a4050;letter-spacing:1px;margin-bottom:2px">${label}</div>
      <div style="font-size:12px;color:#c8dde8">${value||'—'}</div>
    </div>`;
}

// 辅助：进度条
function medBar(label, val, color) {
  return `
    <div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px">
        <div style="font-size:10px;color:#5a7a90">${label}</div>
        <div style="font-size:10px;color:#5a7a90">${val}</div>
      </div>
      <div style="height:4px;background:#0a1520;border-radius:2px;overflow:hidden;border:1px solid #0f1e2a">
        <div style="height:100%;width:${Math.min(100,val||0)}%;background:${color};border-radius:2px;transition:width 0.6s ease"></div>
      </div>
    </div>`;
}

// 辅助：角色基础信息（从CHAR_DATA/CHARS里取，部分硬编码）
const CHAR_BASIC = {
  ghost:   {gender:'男',age:'约35岁',nation:'英国',rank:'中尉'},
  keegan:  {gender:'男',age:'约30岁',nation:'美国',rank:'中士'},
  soap:    {gender:'男',age:'约25岁',nation:'英国（苏格兰）',rank:'中士'},
  gaz:     {gender:'男',age:'约28岁',nation:'英国',rank:'中士'},
  price:   {gender:'男',age:'约50岁',nation:'英国',rank:'上尉'},
  hesh:    {gender:'男',age:'约26岁',nation:'美国',rank:'中尉'},
  logan:   {gender:'男',age:'约24岁',nation:'美国',rank:'中士'},
  kick:    {gender:'男',age:'28岁',nation:'美国',rank:'下士'},
  konig:   {gender:'男',age:'约30岁',nation:'奥地利',rank:'特种兵'},
  horangi: {gender:'男',age:'约32岁',nation:'韩国',rank:'特种兵'},
  nikto:   {gender:'男',age:'不明',nation:'俄罗斯',rank:'特种兵'},
  krueger: {gender:'男',age:'约35岁',nation:'奥地利',rank:'前KSK中士'},
  zimo:    {gender:'男',age:'约30岁',nation:'中国（天津）',rank:'特种兵'},
  graves:  {gender:'男',age:'约40岁',nation:'美国（德克萨斯）',rank:'CEO'},
};
function getCharGender(id)  { return CHAR_BASIC[id]?.gender  || '—'; }
function getCharAge(id)     { return CHAR_BASIC[id]?.age     || '—'; }
function getCharNation(id)  { return CHAR_BASIC[id]?.nation  || '—'; }
function getCharRank(id)    { return CHAR_BASIC[id]?.rank    || '—'; }

// ══════════════════════════════
// 看诊结束 — 手动确认流程
// ══════════════════════════════

// 接诊完成后由 08-ai-call.js 调用，弹出本次就诊摘要
function showSessionSummary(charId, summaryText) {
  const c = CHARS.find(x => x.id === charId);
  const p = G.patients[charId];
  if (!c || !p) return;

  const existing = document.getElementById('session-summary-modal');
  if (existing) existing.remove();
  const existingBg = document.getElementById('session-summary-bg');
  if (existingBg) existingBg.remove();

  const bg = document.createElement('div');
  bg.id = 'session-summary-bg';
  bg.style.cssText = 'position:fixed;inset:0;background:rgba(5,8,16,0.88);z-index:9499;backdrop-filter:blur(6px)';
  document.body.appendChild(bg);

  const phase = (typeof PHASE_LABELS !== 'undefined' ? PHASE_LABELS[p.trustPhase||0] : null) || '戒备';
  const prog = getPhaseProgress(charId);

  const modal = document.createElement('div');
  modal.id = 'session-summary-modal';
  modal.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    z-index:9500;background:#050810;
    border:1px solid #1a3040;border-radius:4px;
    width:min(360px,92vw);
    box-shadow:0 0 40px rgba(0,229,255,0.15);
    animation:msg-in 0.25s ease-out;
    font-family:'Share Tech Mono',monospace;
    overflow:hidden;
  `;

  modal.innerHTML = `
    <!-- 头部 -->
    <div style="background:#0a1520;border-bottom:1px solid #1a3040;padding:12px 16px">
      <div style="font-size:9px;color:#2a4050;letter-spacing:3px;margin-bottom:6px">本次就诊摘要</div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;border-radius:3px;background:#0a1828;border:1px solid #1a3040;display:flex;align-items:center;justify-content:center;font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;color:#00e5ff;flex-shrink:0">${c.init}</div>
        <div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:#e8f4ff">${c.name}</div>
          <div style="font-size:10px;color:#5a7a90">${c.unit} · 第${p.visitCount||1}次就诊</div>
        </div>
        <div style="margin-left:auto;font-size:10px;color:#00e5ff">${phase}</div>
      </div>
    </div>

    <!-- 摘要内容 -->
    <div style="padding:14px 16px;border-bottom:1px solid #0f1e2a">
      <div style="font-size:9px;color:#2a4050;letter-spacing:2px;margin-bottom:8px">诊断摘要</div>
      <div style="font-family:'Noto Serif SC',serif;font-size:13px;color:#c8dde8;line-height:1.9;background:#0a1520;border:1px solid #0f1e2a;border-radius:3px;padding:10px 12px">${summaryText||'本次就诊已完成。'}</div>
    </div>

    <!-- 数值变化 -->
    <div style="padding:12px 16px;border-bottom:1px solid #0f1e2a">
      <div style="font-size:9px;color:#2a4050;letter-spacing:2px;margin-bottom:8px">状态记录</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        ${infoRow('感官负荷', p.mental||50)}
        ${infoRow('应激水平', p.stress||30)}
        ${infoRow('阶段进度', `${prog.current}/${prog.max}（${prog.pct}%）`)}
        ${infoRow('就诊时间', `第${G.day}天`)}
      </div>
    </div>

    <!-- 底部按钮 -->
    <div style="padding:12px 16px;background:#0a1520;display:flex;gap:8px">
      <button onclick="cancelSessionEnd()" style="flex:1;padding:10px;background:none;border:1px solid #1a3040;border-radius:3px;color:#2a4050;font-family:'Share Tech Mono',monospace;font-size:11px;cursor:pointer;letter-spacing:1px">
        继续问诊
      </button>
      <button onclick="confirmSessionEnd('${charId}')" style="flex:2;padding:10px;background:rgba(0,255,204,0.08);border:1px solid rgba(0,255,204,0.3);border-radius:3px;color:#00ffcc;font-family:'Share Tech Mono',monospace;font-size:12px;cursor:pointer;letter-spacing:2px;font-weight:700">
        ✓ 确认结束看诊
      </button>
    </div>
  `;

  document.body.appendChild(modal);
  // 不让背景点击关闭，必须玩家主动选择
}

function cancelSessionEnd() {
  const modal = document.getElementById('session-summary-modal');
  const bg    = document.getElementById('session-summary-bg');
  if (modal) modal.remove();
  if (bg)    bg.remove();
}

function confirmSessionEnd(charId) {
  const modal = document.getElementById('session-summary-modal');
  const bg    = document.getElementById('session-summary-bg');
  if (modal) modal.remove();
  if (bg)    bg.remove();

  const c = CHARS.find(x => x.id === charId);
  const p = G.patients[charId];
  if (!c || !p) return;

  // 锁定今日已完成
  if (!G.completedToday.includes(charId)) {
    G.completedToday.push(charId);
  }

  // 清空当前接诊
  G.clinicSession = null;
  G.sessionTurns  = 0;

  // 刷新预约系统（变灰）
  renderPhoneSchedule();
  renderStatus();

  // 工资
  const isFirst = p.visitCount <= 1;
  addSalary(isFirst ? 300 : 200, `完成${c.name}${isFirst?'首次':'复诊'}接诊`);

  // 日志
  if (typeof addJournalEntry === 'function') {
    const phase = (typeof PHASE_LABELS !== 'undefined' ? PHASE_LABELS[p.trustPhase||0] : null) || '戒备';
    addJournalEntry(`完成了与${c.name}的看诊。关系阶段：${phase}，感官负荷${p.mental||50}，应激${p.stress||30}。`);
  }

  showToast(`✓ ${c.name} 看诊已结束`);
  saveGame();

  // 切换到下一个预约患者
  const next = G.schedule.find(s => !G.completedToday.includes(s.id));
  if (next) {
    const nc = CHARS.find(x => x.id === next.id);
    if (nc) addSysMsg('下一位患者', `${nc.name} 已预约 ${next.time} · ${next.reason}`);
  }
}

// ── 好感度增减弹窗（私聊用）──
function showTrustChange(charId, delta) {
  if (!delta || delta === 0) return;
  const c = CHARS.find(x => x.id === charId);
  if (!c) return;

  const existing = document.getElementById('trust-toast');
  if (existing) existing.remove();

  const isPositive = delta > 0;
  const toast = document.createElement('div');
  toast.id = 'trust-toast';
  toast.style.cssText = `
    position:fixed;top:70px;left:50%;transform:translateX(-50%);
    z-index:8000;
    background:${isPositive ? 'rgba(0,255,204,0.12)' : 'rgba(255,45,107,0.12)'};
    border:1px solid ${isPositive ? 'rgba(0,255,204,0.4)' : 'rgba(255,45,107,0.4)'};
    border-radius:20px;padding:6px 16px;
    font-family:'Share Tech Mono',monospace;font-size:12px;
    color:${isPositive ? '#00ffcc' : '#ff2d6b'};
    display:flex;align-items:center;gap:8px;
    animation:msg-in 0.2s ease-out;
    pointer-events:none;
  `;
  toast.innerHTML = `
    <span style="font-size:14px">${isPositive ? '💚' : '💔'}</span>
    <span>${c.name}</span>
    <span style="font-weight:700">${isPositive ? '+' : ''}${delta} 好感度</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 2200);
}
