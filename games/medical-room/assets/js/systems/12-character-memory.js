// ══════════════════════════════
// CHARACTER MEMORY SYSTEM
// ══════════════════════════════
function updateCharMemory(charId, memData) {
  if (!charId || !G.patients[charId]) return;
  const p = G.patients[charId];
  if (!p.memory) p.memory = {summary:'', keyEvents:[], doctorNote:'', lastUpdated:null};
  if (!p.memory.keyEvents) p.memory.keyEvents = [];

  // ── Cross-contamination guard ──
  // Build list of OTHER characters' names; if they appear in summary/event, it's the wrong patient's data
  const currentChar = CHARS.find(x => x.id === charId);
  const otherNames = CHARS
    .filter(x => x.id !== charId)
    .flatMap(x => [x.name, x.id, ...(x.name.includes('"') ? [x.name.replace(/.*"(.*)".*/, '$1')] : [])]);

  function isContaminated(text) {
    if (!text) return false;
    return otherNames.some(name => name.length > 2 && text.includes(name));
  }

  if (memData.summary) {
    if (isContaminated(memData.summary)) {
      console.warn(`[Memory guard] Rejected contaminated summary for ${charId}:`, memData.summary);
    } else {
      p.memory.summary = memData.summary;
    }
  }

  if (memData.new_event) {
    if (isContaminated(memData.new_event)) {
      console.warn(`[Memory guard] Rejected contaminated event for ${charId}:`, memData.new_event);
    } else {
      // Add new event only if it's not a duplicate of the most recent one
      const lastEvent = p.memory.keyEvents[0];
      const isDuplicate = lastEvent && lastEvent.day === G.day && lastEvent.text === memData.new_event;
      if (!isDuplicate) {
        p.memory.keyEvents.unshift({ day: G.day, text: memData.new_event });
        if (p.memory.keyEvents.length > 12) p.memory.keyEvents.pop();
      }
    }
  }

  if (memData.doctor_note) p.memory.doctorNote = memData.doctor_note;
  p.memory.lastUpdated = `第${G.day}天`;
  saveGame();
}

function getCharMemoryPrompt(charId) {
  if (!charId || !G.patients[charId]) return '';
  const p = G.patients[charId];
  const m = p.memory;
  if (!m || (!m.summary && (!m.keyEvents || m.keyEvents.length === 0))) return '';
  const c = CHARS.find(x=>x.id===charId);

  // Pull last session log entry for "last seen temperature"
  const allClinicLogs = (G.worldLog||[]).filter(e=>e.charId===charId && e.type==='clinic').slice(-3);
  const lastLog = allClinicLogs.length ? allClinicLogs[allClinicLogs.length-1] : null;
  const prevLog = allClinicLogs.length > 1 ? allClinicLogs[allClinicLogs.length-2] : null;

  let prompt = `
【${c?.name||charId} · 关系记忆卡 — 严格执行，这是连续剧情】
当前关系状态：${m.summary || '尚未接触'}
接诊次数：${p.visitCount}次 · 上次见面：${p.lastVisit||'—'}`;

  if (lastLog) {
    prompt += `\n上次见面发生了什么：${lastLog.text}`;
  }
  if (prevLog && prevLog !== lastLog) {
    prompt += `\n上上次：${prevLog.text}`;
  }

  if (m.keyEvents && m.keyEvents.length > 0) {
    prompt += '\n\n关键节点（必须记住）：\n' + m.keyEvents.slice(0,6).map(e =>
      `  · 第${e.day}天：${e.text}`
    ).join('\n');
  }

  if (m.doctorNote) {
    prompt += '\n\n向导私人备注：' + m.doctorNote;
  }

  // Derive last-session "temperature" hint from trust trajectory
  const phase = p.trustPhase||0;
  const accum = p.trustAccum||0;
  const threshold = PHASE_THRESHOLDS[phase]||100;
  const pct = Math.round(accum/threshold*100);

  let tempHint = '';
  if (p.visitCount === 0) {
    tempHint = '从未接触，完全陌生人。';
  } else if (p.visitCount === 1) {
    tempHint = `只见过一次。那次他${phase===0?'全程抗拒，几乎没说话':'勉强完成了诊疗'}。再见面时他记得你，但不会主动表现。`;
  } else {
    // Describe trajectory based on phase + progress
    if (pct < 30) tempHint = `目前关系处于${PHASE_LABELS[phase]}阶段初期，刚刚越过上一阶段的门槛。上次见面比之前稍微开放了一点，但他自己可能还没意识到。`;
    else if (pct < 70) tempHint = `目前在${PHASE_LABELS[phase]}阶段中段。关系是真实在推进的，但推进得很慢——他不会突然热情，每一步都是他自己走过来的。`;
    else tempHint = `${PHASE_LABELS[phase]}阶段接近尾声，积累了${pct}%。上次见面结束时有某种微妙的"没说完"的感觉。这次再见，他不会冷淡，但也不会主动跨越。`;
  }

  prompt += `\n\n【本次见面的起点温度 — 必须从这里开始，不能比这更冷也不能比这更热】\n${tempHint}`;

  return prompt;
}

function renderMemoryCard(charId) {
  const p = G.patients[charId];
  const c = CHARS.find(x=>x.id===charId);
  if (!p || !c) return '<div style="color:var(--text3);font-family:var(--mono);font-size:12px;text-align:center;padding:20px">尚未接触此角色</div>';

  const m = p.memory || {summary:'尚未接触', keyEvents:[], doctorNote:''};

  return `
    <div style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:2px;margin-bottom:8px">当前关系状态</div>
      <div style="font-family:var(--serif);font-size:14px;color:var(--white);line-height:1.7">${m.summary||'尚未接触'}</div>
      ${m.lastUpdated ? `<div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:6px">更新于 ${m.lastUpdated}</div>` : ''}
    </div>

    <div style="font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:2px;margin-bottom:8px">
      ── 关键节点 ──────────────────
    </div>
    ${m.keyEvents.length === 0
      ? '<div style="font-family:var(--mono);font-size:12px;color:var(--text3);text-align:center;padding:12px 0">暂无关键节点记录</div>'
      : m.keyEvents.map(e => `
        <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid rgba(26,40,64,0.4)">
          <div style="font-family:var(--mono);font-size:10px;color:var(--cyan);flex-shrink:0;white-space:nowrap">第${e.day}天</div>
          <div style="font-family:var(--serif);font-size:13px;color:var(--text);line-height:1.6">${e.text}</div>
        </div>`).join('')
    }

    <div style="font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:2px;margin:14px 0 8px">
      ── 向导备注 ──────────────────
    </div>
    <textarea id="memory-note-${charId}" style="width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:4px;color:var(--white);font-family:var(--serif);font-size:13px;padding:10px 12px;resize:none;min-height:70px;outline:none;line-height:1.7" placeholder="在这里写下你对这个角色的观察…">${m.doctorNote||''}</textarea>
    <button onclick="saveMemoryNote('${charId}')" style="margin-top:8px;width:100%;padding:8px;background:var(--cyan-glow);border:1px solid var(--cyan-dim);border-radius:4px;color:var(--cyan);font-family:var(--hud);font-size:12px;cursor:pointer;letter-spacing:1px">保存备注</button>
  `;
}

function saveMemoryNote(charId) {
  const el = document.getElementById(`memory-note-${charId}`);
  if (!el || !G.patients[charId]) return;
  if (!G.patients[charId].memory) G.patients[charId].memory = {summary:'',keyEvents:[],doctorNote:''};
  G.patients[charId].memory.doctorNote = el.value.trim();
  saveGame();
  showToast('✓ 备注已保存');
}

