// ══════════════════════════════
// PROCESS AI RESPONSE
// ══════════════════════════════
function processAIResponse(rawText) {
  // Extract horae JSON
  const horaeMatch = rawText.match(/<horae>([\s\S]*?)<\/horae>/);
  const narrative = rawText.replace(/<horae>[\s\S]*?<\/horae>/g,'').trim();

  let parsedHorae = null;
  if (horaeMatch) {
    try {
      parsedHorae = JSON.parse(horaeMatch[1].trim());
    }
    catch(e){ console.warn('[horae parse error]', e); }
  }

  const cleanNarrative = narrative.replace(/<memory>[\s\S]*?<\/memory>/g,'').trim();

  // ── 行动点完成检测（幼崽期）——必须在 processHorae 之前 ──
  // 行动点发放固定增长后会清除 horae 中的 bond_delta/stat_gain，避免随后被加两遍。
  if (G.phase === 'cub' && G.apPending) {
    checkApCompletion(cleanNarrative, parsedHorae);
  }

  // 应用 horae 通用效果（若本回合完成了行动点，则 bond/stat 增量已被清除）
  if (parsedHorae) {
    try { processHorae(parsedHorae); }
    catch(e){ console.warn('[horae apply error]', e); }
  }

  // Step 1: strip OPTIONS block first, before any display
  let optMatch = null;
  let cleanText = cleanNarrative;

  // Match [OPTIONS: ...] possibly multiline
  const optReg = /\[OPTIONS:\s*([\s\S]*?)\]/;
  const om = cleanNarrative.match(optReg);
  if (om) {
    optMatch = om;
    cleanText = cleanNarrative.replace(optReg, '').trim();
  }

  // Fallback A: pipe-separated on same line without [OPTIONS:] wrapper
  if (!optMatch) {
    const pipeMatch = cleanText.match(/([A-E][.．。、]\s*[^|\n]{4,}\s*\|\s*){1,}[A-E][.．。、]\s*[^|\n]{4,}/);
    if (pipeMatch) {
      const block = pipeMatch[0];
      cleanText = cleanText.replace(block, '').trim();
      optMatch = [null, block];
    }
  }

  // Fallback B: A. B. C. on separate lines at end of text
  if (!optMatch) {
    const optLines = cleanText.match(/^[A-E][.．。]\s*.{4,}/gm);
    if (optLines && optLines.length >= 2) {
      cleanText = cleanText.replace(/\n?[A-E][.．。]\s*.{4,}/g,'').trim();
      optMatch = [null, optLines.join('|')];
    }
  }

  // Display narrative AFTER stripping options
  if (cleanText) parseAndDisplayNarrative(cleanText);

  // Parse and show options
  if (optMatch) {
    let raw = optMatch[1];
    let parts;
    if (raw.includes('|')) {
      parts = raw.split('|').map(s=>s.trim()).filter(Boolean);
    } else {
      parts = raw.split(/\n+/).map(s=>s.trim()).filter(Boolean);
    }
    const opts = parts.map((p,i)=>({
      label: String.fromCharCode(65+i),
      text: p.replace(/^[A-E][.．。\:\：]\s*/,'').trim()
    })).filter(o=>o.text.length > 2);
    if (opts.length >= 2) showOptions(opts);
  }

  G.history.push({role:'assistant', content:rawText});
  saveGame();

  // Handle dice check request from horae
  if (window._pendingDiceCheck) {
    const dc = window._pendingDiceCheck;
    window._pendingDiceCheck = null;
    setTimeout(()=>{
      openDice(dc.attr, dc.difficulty, (outcome, total)=>{
        closeDice();
        const resultText = '[骰子检定结果：' + outcome + '（掷出' + total + '，难度' + dc.difficulty + '）]';
        G.history.push({role:'user', content: resultText});
        callAI();
      });
    }, 400);
  }
}

function parseAndDisplayNarrative(text) {
  const re = /\*\*([^*]+)\*\*(?:\s*\(([^)]*)\))?\s*[:\-]?\s*(?:\*([^*]*)\*)?\s*"([^"]+)"\s*[\/「]?\s*「?([^」\n]+)」?/g;
  const segments = [];
  let idx = 0, result, hasNpc = false;

  while ((result = re.exec(text)) !== null) {
    if (result.index > idx) segments.push({type:'narr', text:text.slice(idx,result.index)});
    segments.push({type:'npc', name:result[1], rank:result[2]||'', action:result[3]||'', en:result[4], zh:result[5]});
    idx = result.index + result[0].length;
    hasNpc = true;
  }
  if (idx < text.length) segments.push({type:'narr', text:text.slice(idx)});

  if (hasNpc) {
    segments.forEach(seg => {
      if (seg.type==='narr' && seg.text.trim()) addNarr(seg.text.trim());
      else if (seg.type==='npc') {
        const c = CHARS.find(ch=>ch.name.toLowerCase().includes(seg.name.toLowerCase().split(' ')[0]));
        addNpcMsg(seg.name, seg.rank||c?.rank||'', seg.name.slice(0,2).toUpperCase(), seg.action, seg.en, seg.zh);
      }
    });
  } else {
    addNarr(text);
  }
}
