// ══════════════════════════════
// AI CALL
// ══════════════════════════════
async function callAI() {
  if (G.isThinking) return;
  G.isThinking = true;
  document.getElementById('send-btn').disabled = true;
  const thinkId = addThinking();

  const endpoint = G.apiEndpoint
    ? G.apiEndpoint.replace(/\/$/, '') + '/chat/completions'
    : 'https://api.anthropic.com/v1/messages';
  const isOpenAI = !!G.apiEndpoint;
  const model = G.apiModel || (isOpenAI ? 'gpt-4o' : 'claude-sonnet-4-20250514');

  const systemPrompt = buildSystemPrompt();

  try {
    let response, data, rawText;
    if (isOpenAI) {
      // OpenAI-compatible
      response = await fetch(endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${G.apiKey}`},
        body: JSON.stringify({
          model,
          max_tokens:1500,
          messages:[{role:'system',content:systemPrompt},...G.history],
        })
      });
      data = await response.json();
      rawText = data.choices?.[0]?.message?.content || '';
    } else {
      // Anthropic
      response = await fetch(endpoint, {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key': G.apiKey,
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true'
        },
        body: JSON.stringify({
          model,
          max_tokens:1500,
          system: systemPrompt,
          messages: G.history,
        })
      });
      data = await response.json();
      rawText = data.content?.[0]?.text || '';
    }

    removeThinking(thinkId);

    // Parse horae JSON
    const horaeMatch = rawText.match(/<horae>([\s\S]*?)<\/horae>/);
    const narrative = rawText.replace(/<horae>[\s\S]*?<\/horae>/,'').trim();

    // Snapshot clinicSession BEFORE processHorae may switch it — ensures memory writes to correct patient
    const sessionBeforeHorae = G.clinicSession;

    if (horaeMatch) {
      try {
        const h = JSON.parse(horaeMatch[1].trim());
        processHorae(h);
      } catch(e){ console.warn('[horae parse error]', e, horaeMatch[1]); }
    }

    // ── FALLBACK VISIT TRACKING ──
    // Only fires when processHorae didn't run at all (no horae tag, or parse error).
    // We only mark complete if sessionTurns >= 3 to match the main logic.
    if (G.clinicSession && G.day > 1 && G.sessionTurns < 3) {
      // Don't mark complete yet — just increment silently if needed
    }
    if (G.clinicSession && G.day > 1 && G.sessionTurns === 0) {
      const _id = G.clinicSession;
      const _p  = G.patients[_id];
      if (_p && !G.completedToday.includes(_id)) {
        G.sessionTurns = 1;
        const _c = CHARS.find(x=>x.id===_id);
        if (_p.visitCount === 0) {
          _p.visitCount = 1;
          _p.lastVisit = `第${G.day}天`;
          if (!_p.memory || _p.memory.summary === '尚未接触') {
            _p.memory = { summary:`第${G.day}天初次接触，正在建立关系`, keyEvents:[], doctorNote:'', lastUpdated:`第${G.day}天` };
          }
          unlockContact(_id);
          addSalary(300, `完成${_c?.name||_id}首次接诊`);
          triggerPostSessionMoment(_id);
        } else {
          _p.visitCount++;
          _p.lastVisit = `第${G.day}天`;
          addSalary(200, `完成${_c?.name||_id}接诊`);
          triggerPostSessionMoment(_id);
        }
        G.completedToday.push(_id);
        renderPhoneSchedule();
        renderStatus();
      }
    }

    // Strip memory tag from narrative first
    const narrativeClean = narrative.replace(/<memory>[\s\S]*?<\/memory>/g,'');

    // Parse options - try [OPTIONS: ...] format, also handle bare A./B. lines at end
    let optMatch = narrativeClean.match(/\[OPTIONS:\s*([\s\S]*?)\]/);
    let cleanNarrative = narrativeClean
      .replace(/\[OPTIONS:[\s\S]*?\]/g,'')
      .trim();

    // Fallback: detect "A." "B." "C." "D." pattern lines as options
    if (!optMatch) {
      const optLineRe = /^[A-D][\.。]\s*.+/gm;
      const optLines = cleanNarrative.match(optLineRe);
      if (optLines && optLines.length >= 2) {
        // Remove these lines from narrative
        cleanNarrative = cleanNarrative.replace(/\n?[A-D][\.。]\s*.+/g,'').trim();
        // Fake optMatch format
        optMatch = [null, optLines.join('|')];
      }
    }

    if (cleanNarrative) {
      parseAndDisplayNarrative(cleanNarrative);
    }

    if (optMatch) {
      const parts = optMatch[1].split('|').map(s=>s.trim()).filter(Boolean);
      const opts = parts.map((p,i)=>{
        const lbl = String.fromCharCode(65+i);
        const text = p.replace(/^[A-E][\.。\:：]\s*/,'').trim();
        return {label:lbl, text, hidden: i===4};
      });
      if (opts.length >= 2) showOptions(opts);
    }

    // Parse <memory> update tag — use PRE-HORAE snapshot so we write to the right patient
    const memMatch = rawText.match(/<memory>([\s\S]*?)<\/memory>/);
    // For non-clinic encounters: try to infer charId from horae patient_id
    let memTarget = sessionBeforeHorae || G.clinicSession;
    if (!memTarget && horaeMatch) {
      try {
        const hTemp = JSON.parse(horaeMatch[1].trim());
        if (hTemp.patient_id && hTemp.patient_id !== 'null' && G.patients[hTemp.patient_id]) {
          memTarget = hTemp.patient_id;
        }
      } catch(e){}
    }
    if (memMatch && memTarget) {
      try {
        const memData = JSON.parse(memMatch[1].trim());
        // Allow memory tag to override the target if it carries a valid patient_id
        let finalTarget = memTarget;
        if (memData.patient_id && memData.patient_id !== 'null' && G.patients[memData.patient_id]) {
          finalTarget = memData.patient_id;
        }
        if (finalTarget) {
          updateCharMemory(finalTarget, memData);
          // Also log encounter to worldLog if outside clinic
          if (G.currentLocation !== 'clinic' && memData.new_event) {
            addWorldLog('encounter', finalTarget, memData.new_event);
          }
        }
      } catch(e) { console.warn('memory parse fail', e); }
    }

    G.history.push({role:'assistant',content:rawText});
    saveGame();

    // Add retry button after successful response
    addRetryBtn();

  } catch(e) {
    removeThinking(thinkId);
    // Show error with retry option
    addErrorMsg();
    console.error(e);
  }

  G.isThinking = false;
  document.getElementById('send-btn').disabled = false;
}

function addRetryBtn() {
  // Remove old retry btn if exists
  const old = document.getElementById('retry-btn-wrap');
  if (old) old.remove();

  const wrap = document.createElement('div');
  wrap.id = 'retry-btn-wrap';
  wrap.style.cssText = 'display:flex;justify-content:center;padding:4px 0';
  wrap.innerHTML = `
    <button onclick="retryLastAI()" style="
      background:none;border:1px solid var(--border2);border-radius:20px;
      color:var(--text3);font-family:var(--mono);font-size:10px;
      padding:4px 14px;cursor:pointer;display:flex;align-items:center;gap:6px;
      transition:all 0.2s;letter-spacing:1px
    " onmousedown="this.style.borderColor='var(--cyan)';this.style.color='var(--cyan)'">
      🔄 重新生成
    </button>`;
  document.getElementById('messages').appendChild(wrap);
  // Don't scroll for this one
}

function addErrorMsg() {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px 0';
  wrap.innerHTML = `
    <div style="font-family:var(--mono);font-size:11px;color:var(--red);text-align:center">
      ⚠ 生成失败
    </div>
    <button onclick="retryLastAI()" style="
      background:rgba(255,48,48,0.1);border:1px solid var(--red);border-radius:20px;
      color:var(--red);font-family:var(--mono);font-size:10px;
      padding:5px 16px;cursor:pointer;letter-spacing:1px
    ">🔄 重试</button>`;
  document.getElementById('messages').appendChild(wrap);
  document.getElementById('messages').scrollTop = 99999;
}

function retryLastAI() {
  // Remove retry/error button
  const old = document.getElementById('retry-btn-wrap');
  if (old) old.remove();

  // Remove last assistant message from history to regenerate
  if (G.history.length > 0 && G.history[G.history.length-1].role === 'assistant') {
    G.history.pop();
  }

  // Remove last rendered AI messages from DOM (narration/npc bubbles added after last player msg)
  // Find the last player message element and remove everything after it
  const msgEl = document.getElementById('messages');
  const children = Array.from(msgEl.children);
  let lastPlayerIdx = -1;
  children.forEach((el, i) => {
    if (el.classList.contains('msg-player')) lastPlayerIdx = i;
  });
  if (lastPlayerIdx >= 0) {
    // Remove all elements after the last player message
    for (let i = children.length - 1; i > lastPlayerIdx; i--) {
      children[i].remove();
    }
  }

  if (G.isThinking) return;
  G.isThinking = true;
  document.getElementById('send-btn').disabled = true;
  const thinkId = addThinking();

  // Call AI again
  const endpoint = G.apiEndpoint
    ? G.apiEndpoint.replace(/\/$/, '') + '/chat/completions'
    : 'https://api.anthropic.com/v1/messages';
  const isOpenAI = !!G.apiEndpoint;
  const model = G.apiModel || (isOpenAI ? 'gpt-4o' : 'claude-sonnet-4-20250514');

  const doRetry = async () => {
    try {
      let response, data, rawText;
      if (isOpenAI) {
        response = await fetch(endpoint, {
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':`Bearer ${G.apiKey}`},
          body: JSON.stringify({model, max_tokens:1500, messages:[{role:'system',content:buildSystemPrompt()},...G.history]})
        });
        data = await response.json();
        rawText = data.choices?.[0]?.message?.content || '';
      } else {
        response = await fetch(endpoint, {
          method:'POST',
          headers:{'Content-Type':'application/json','x-api-key':G.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
          body: JSON.stringify({model, max_tokens:1500, system:buildSystemPrompt(), messages:G.history})
        });
        data = await response.json();
        rawText = data.content?.[0]?.text || '';
      }
      removeThinking(thinkId);
      const horaeMatch = rawText.match(/<horae>([\s\S]*?)<\/horae>/);
      const narrative = rawText.replace(/<horae>[\s\S]*?<\/horae>/,'').trim();
      const sessionSnap2 = G.clinicSession; // snapshot before horae can switch session
      if (horaeMatch) { try { processHorae(JSON.parse(horaeMatch[1].trim())); } catch(e){ console.warn('[retry horae parse error]', e); } }
      const narrativeClean2 = narrative.replace(/<memory>[\s\S]*?<\/memory>/g,'');
      let optMatch2 = narrativeClean2.match(/\[OPTIONS:\s*([\s\S]*?)\]/);
      let cleanNarrative2 = narrativeClean2.replace(/\[OPTIONS:[\s\S]*?\]/g,'').trim();
      if (!optMatch2) {
        const optLines2 = cleanNarrative2.match(/^[A-D][\.。]\s*.+/gm);
        if (optLines2 && optLines2.length >= 2) {
          cleanNarrative2 = cleanNarrative2.replace(/\n?[A-D][\.。]\s*.+/g,'').trim();
          optMatch2 = [null, optLines2.join('|')];
        }
      }
      if (cleanNarrative2) parseAndDisplayNarrative(cleanNarrative2);
      if (optMatch2) {
        const parts = optMatch2[1].split('|').map(s=>s.trim()).filter(Boolean);
        const opts2 = parts.map((p,i)=>({label:String.fromCharCode(65+i),text:p.replace(/^[A-E][\.。\:：]\s*/,'').trim(),hidden:i===4}));
        if (opts2.length >= 2) showOptions(opts2);
      }
      const memMatch2 = rawText.match(/<memory>([\s\S]*?)<\/memory>/);
      let memTarget2 = sessionSnap2 || G.clinicSession;
      if (!memTarget2 && horaeMatch) {
        try {
          const hTemp2 = JSON.parse(horaeMatch[1].trim());
          if (hTemp2.patient_id && hTemp2.patient_id !== 'null' && G.patients[hTemp2.patient_id]) {
            memTarget2 = hTemp2.patient_id;
          }
        } catch(e){}
      }
      if (memMatch2 && memTarget2) {
        try { updateCharMemory(memTarget2, JSON.parse(memMatch2[1].trim())); } catch(e){}
      }
      G.history.push({role:'assistant',content:rawText});
      saveGame();
      addRetryBtn();
    } catch(e) {
      removeThinking(thinkId);
      addErrorMsg();
      console.error(e);
    }
    G.isThinking = false;
    document.getElementById('send-btn').disabled = false;
  };
  doRetry();
}

function parseAndDisplayNarrative(text) {
  // Look for NPC dialogue patterns: **Name**: "English" / 「Chinese」
  const npcPattern = /\*\*(.+?)\*\*\s*(?:\((.+?)\))?\s*:?\s*(?:\*(.+?)\*)?\s*"(.+?)"\s*[\/\\]\s*「(.+?)」/g;
  let lastIndex = 0;
  let match;
  let hasNpc = false;
  const tmp = document.createElement('div');
  tmp.innerHTML = text;
  const plain = tmp.textContent;

  // Try NPC pattern first
  let result;
  const segments = [];
  let idx = 0;
  const re = /\*\*([^*]+)\*\*(?:\s*\(([^)]*)\))?\s*[:\-]?\s*(?:\*([^*]*)\*)?\s*"([^"]+)"\s*[\/「]?\s*「?([^」]+)」?/g;
  while ((result = re.exec(plain)) !== null) {
    if (result.index > idx) {
      segments.push({type:'narr', text: plain.slice(idx, result.index)});
    }
    segments.push({type:'npc', name:result[1], rank:result[2]||'', action:result[3]||'', en:result[4], zh:result[5]});
    idx = result.index + result[0].length;
    hasNpc = true;
  }
  if (idx < plain.length) segments.push({type:'narr', text: plain.slice(idx)});

  if (hasNpc) {
    segments.forEach(seg=>{
      if (seg.type==='narr' && seg.text.trim()) addNarr(seg.text.trim());
      else if (seg.type==='npc') {
        const char = CHARS.find(c=>c.name.toLowerCase().includes(seg.name.toLowerCase().split(' ')[0]));
        const init = char?.init || seg.name.slice(0,2).toUpperCase();
        const unit = seg.rank || char?.unit || '';
        addNpcMsg(seg.name, unit, init, seg.action, seg.en, seg.zh);
      }
    });
  } else {
    addNarr(text);
  }
}

function processHorae(h) {
  if (!h) return;
  
  // ── clinicSession switching ──
  // Only switch if AI explicitly passes a DIFFERENT scheduled patient_id.
  // Crucially: ALL data in THIS horae block (trust, mental, etc.) is still written to
  // the PRE-SWITCH session, because this response was generated for that patient.
  // The switch takes effect so that the NEXT round uses the new patient.
  if (h.patient_id && h.patient_id !== 'null' && G.patients[h.patient_id] && h.patient_id !== G.clinicSession) {
    const isScheduled = G.schedule.some(s => s.id === h.patient_id);
    if (isScheduled) {
      // Mark old session complete if it had turns
      if (G.clinicSession && G.sessionTurns > 0 && !G.completedToday.includes(G.clinicSession)) {
        G.completedToday.push(G.clinicSession);
        renderPhoneSchedule();
      }
      G.clinicSession = h.patient_id;
      G.sessionTurns = 0;
    }
  }

  // ── id resolution: GAME STATE wins, AI is only a fallback ──
  // Priority: 1) G.clinicSession (game-owned state)
  //           2) first unfinished scheduled patient (if clinicSession is null)
  //           3) h.patient_id IF it's in schedule (last resort)
  let id = G.clinicSession;
  if (!id && G.schedule.length > 0 && G.day > 1) {
    const next = G.schedule.find(s => !G.completedToday.includes(s.id));
    if (next) id = next.id;
  }
  if (!id && h.patient_id && h.patient_id !== 'null' && G.patients[h.patient_id]) {
    const isScheduled = G.schedule.some(s => s.id === h.patient_id);
    if (isScheduled) id = h.patient_id;
  }

  // Commit resolved id to clinicSession so all comparisons below work
  if (id && !G.clinicSession) {
    G.clinicSession = id;
    G.sessionTurns = 0;
  }
  
  if (id && G.patients[id]) {
    const p = G.patients[id];
    const c = CHARS.find(x=>x.id===id);

    // ── ACCUMULATIVE TRUST SYSTEM ──
    // trust_delta: how many points AI wants to add this turn
    // We cap it strictly, then accumulate into trustAccum
    if (!p.trustPhase) p.trustPhase = 0;
    if (!p.trustAccum) p.trustAccum = 0;

    const maxGainPerTurn = p.visitCount < 2 ? 8 :
                           p.visitCount < 5 ? 10 : 12;

    if (h.trust_delta !== undefined) {
      // AI sends trust_delta (points to add/subtract this turn)
      let delta = Math.max(-15, Math.min(maxGainPerTurn, Number(h.trust_delta)||0));
      p.trustAccum = Math.max(0, p.trustAccum + delta);
      // Also keep a legacy p.trust for display (0-100 within current phase)
      const threshold = PHASE_THRESHOLDS[p.trustPhase] || 100;
      p.trust = Math.round((p.trustAccum / threshold) * 100);
      checkPhaseUp(id);
    } else if (h.trust !== undefined) {
      // Legacy fallback: AI sends absolute trust value, convert to delta
      const oldPct = p.trust || 0;
      const newPct = Math.max(0, Math.min(100, Number(h.trust)));
      const pctDelta = newPct - oldPct;
      const threshold = PHASE_THRESHOLDS[p.trustPhase] || 100;
      let delta = Math.round(pctDelta * threshold / 100);
      delta = Math.max(-15, Math.min(maxGainPerTurn, delta));
      p.trustAccum = Math.max(0, p.trustAccum + delta);
      p.trust = Math.round((p.trustAccum / threshold) * 100);
      checkPhaseUp(id);
    }
    // Update dynamic location/spirit from horae
    if (h.location) p.location = h.location;
    if (h.mental  !== undefined) p.mental  = Math.max(0, Math.min(100, h.mental));
    if (h.stress  !== undefined) p.stress  = Math.max(0, Math.min(100, h.stress));
    if (h.heat !== undefined) {
      // Hard restriction: heat only allowed at phase 6+ AND 8+ visits
      const phase = p.trustPhase || 0;
      if (phase < 5 || (p.visitCount || 0) < 8) {
        p.heat = 0; // force zero regardless of AI output
      } else {
        p.heat = Math.max(0, Math.min(100, h.heat));
      }
    }
    if (h.tags)                  p.tags    = h.tags;
    if (h.injury)                p.injury  = h.injury;
    if (h.landscape_status)      p.landscapeStatus = h.landscape_status;
    if (h.spirit_status)         p.spiritStatus = h.spirit_status;
    if (h.spirit_loc)            p.spiritLoc = h.spirit_loc;
    if (h.spirit_contact !== undefined) p.spiritContact = h.spirit_contact;
    if (h.landscape_anomaly)     p.landscapeAnomaly = h.landscape_anomaly;

    // ── VISIT TRACKING ──
    // Only on actual work days (day > 1). Day 1 is orientation, no sessions.
    // Register visit on the THIRD valid turn; this ensures real interaction happened.
    // Turn 1 = patient arrived; Turn 2 = first exchange; Turn 3 = confirmed session.
    if (G.day > 1) {
      G.sessionTurns++;

      if (G.sessionTurns === 3 && !G.completedToday.includes(id)) {
        if (p.visitCount === 0) {
          p.visitCount = 1;
          p.lastVisit = `第${G.day}天`;
          if (!p.memory || p.memory.summary === '尚未接触' || !p.memory.summary) {
            p.memory = { summary:`第${G.day}天初次接触，正在建立关系`, keyEvents:[], doctorNote:'', lastUpdated:`第${G.day}天` };
          }
          unlockContact(id);
          addSalary(300, `完成${c?.name||id}首次接诊`);
          triggerPostSessionMoment(id);
          addWorldLog('clinic', id, `首次接诊完成。信任阶段：${PHASE_LABELS[p.trustPhase||0]||'戒备'}。精神力${p.mental}，应激${p.stress}。`);
        } else {
          p.visitCount++;
          p.lastVisit = `第${G.day}天`;
          addSalary(200, `完成${c?.name||id}接诊`);
          triggerPostSessionMoment(id);
          addWorldLog('clinic', id, `第${p.visitCount}次接诊完成。阶段：${PHASE_LABELS[p.trustPhase||0]||'戒备'}（积累${p.trustAccum||0}/${PHASE_THRESHOLDS[p.trustPhase||0]||100}）。精神力${p.mental}，应激${p.stress}。`);
        }
        G.completedToday.push(id);
        renderPhoneSchedule();
        renderStatus();
        const cName = c?.name || id;
        const phase = PHASE_LABELS[p.trustPhase||0] || '戒备';
        const journalTemplates = [
          `完成了与${cName}的看诊。目前关系阶段：${phase}。`,
          `今天接诊了${cName}（${c?.unit||''}）。感官状态${p.mental > 70 ? '较紧张' : '尚稳定'}。`,
          `${cName}今日就诊，这是第${p.visitCount}次接触。`,
        ];
        addJournalEntry(journalTemplates[Math.floor(Math.random()*journalTemplates.length)]);
      }

      // session_end: switch to next scheduled patient if any remain
      if (h.session_end === true) {
        const next = G.schedule.find(s => !G.completedToday.includes(s.id));
        if (next) {
          G.clinicSession = next.id;
          G.sessionTurns = 0;
          addSysMsg('下一位患者', `${CHARS.find(x=>x.id===next.id)?.name||next.id} 已预约 ${next.time} · ${next.reason}`);
        } else {
          G.clinicSession = null;
          G.sessionTurns = 0;
        }
      }
    }
  }
  if (h.player_shield  !== undefined) {
    G.playerStats.shield  = Math.max(0, Math.min(100, h.player_shield));
    if (G.playerStats.shield === 0 && !G.icuMode) {
      G.icuMode = true;
      G.icuDaysLeft = 2;
      addSysMsg('⚠ 紧急医疗通报', '向导精神屏障完全崩溃，已紧急转入ICU病房。<br><span style="color:var(--pink)">预计休养2天，期间无法接诊。</span>');
      showToast('⚠ 向导重伤入ICU');
    }
  }
  if (h.player_fatigue !== undefined) G.playerStats.fatigue = Math.max(0, Math.min(100, h.player_fatigue));
  if (h.player_contam  !== undefined) G.playerStats.contam  = Math.max(0, Math.min(100, h.player_contam));
  
  // Auto-refresh UI panels (fix D)
  checkLevelUp();
  // Refresh status panel if open
  if (document.getElementById('status-panel')?.classList.contains('show')) {
    renderStatus();
  }
  // Refresh contact list
  renderContactList();
}

// ── Salary system (fix #11) ──
function addSalary(amount, reason) {
  G.wallet += amount;
  G.transactions.unshift({
    type: 'income',
    amount,
    reason,
    day: G.day,
    date: `第${G.day}天`
  });
  showToast(`+${amount} 积分 · ${reason}`);
  renderWallet();
}
function spendMoney(amount, reason) {
  if (G.wallet < amount) { showToast('积分不足'); return false; }
  G.wallet -= amount;
  G.transactions.unshift({type:'expense', amount, reason, day:G.day, date:`第${G.day}天`});
  renderWallet();
  return true;
}
function renderWallet() {
  const el = document.getElementById('wallet-amount');
  if (el) el.textContent = G.wallet.toLocaleString();
  const txEl = document.getElementById('tx-list');
  if (!txEl) return;
  txEl.innerHTML = G.transactions.slice(0,20).map(t=>`
    <div class="tx-item">
      <div><div class="tx-desc">${t.reason}</div><div class="tx-date">${t.date}</div></div>
      <div class="tx-amount ${t.type==='income'?'income':'expense'}">${t.type==='income'?'+':'-'}${t.amount}</div>
    </div>`).join('');
}
