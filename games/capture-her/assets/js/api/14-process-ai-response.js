// ═══════════════════════════════
// PROCESS AI RESPONSE
// ═══════════════════════════════
function processAIResponse(rawText, currentTask){
  let narrative = rawText;
  let horaeData = null;

  // ── 1. 提取 horae 数据 ──────────────────────────────────────────
  const horaeMatch = rawText.match(/<horae>([\s\S]*?)<\/horae>/);
  if(horaeMatch){
    narrative = rawText.replace(/<horae>[\s\S]*?<\/horae>/g,'').trim();
    try{ horaeData = JSON.parse(horaeMatch[1].trim()); }
    catch(e){ console.warn('[horae parse]',e); }
  }
  if(!horaeData){
    const unclosed = rawText.match(/<horae>([\s\S]*?)(?=\n\n|叙事|【|\[OPTIONS)/);
    if(unclosed){
      narrative = rawText.replace(/<horae>[\s\S]*?(?=\n\n|叙事|【|\[OPTIONS)/,'').trim();
      try{ horaeData = JSON.parse(unclosed[1].trim()); }
      catch(e){}
    }
  }
  if(!horaeData){
    const jsonBlock = rawText.match(/^\s*(\{[\s\S]*?\})/);
    if(jsonBlock){
      try{
        const parsed = JSON.parse(jsonBlock[1]);
        if(parsed.char_id !== undefined || parsed.mood !== undefined){
          horaeData = parsed;
          narrative = rawText.replace(jsonBlock[0],'').trim();
        }
      } catch(e){}
    }
  }

  // 清理残留 horae 标签
  narrative = narrative
    .replace(/<horae>[\s\S]*?<\/horae>/g,'')
    .replace(/<horae>[\s\S]*/g,'')
    .replace(/^\s*\{[\s\S]*?"task_complete"[\s\S]*?\}/m,'')
    .trim();

  // ── 2. 处理 horae 数据 ──────────────────────────────────────────
  if(horaeData){
    try{ processHorae(horaeData, currentTask); }
    catch(e){ console.warn('[horae process]',e); }
  }

  // ── 3. 清理 memory 标签 ─────────────────────────────────────────
  let cleanText = narrative.replace(/<memory>[\s\S]*?<\/memory>/g,'').trim();

  // ── 4. 先拆视角分隔符（在 OPTIONS 还没动之前做）────────────────
  const activeTask = currentTask || G.currentTask;
  const currentTaskChar = activeTask ? CHARS.find(c=>c.id===activeTask.charId) : null;

  const CHAR_MARKER = '【角色视角】';
  const USER_MARKER = '【用户视角】';
  const sep1 = cleanText.indexOf(CHAR_MARKER);
  const sep2 = cleanText.indexOf(USER_MARKER);

  let userNarrative = cleanText;

  if(sep1 !== -1 && sep2 !== -1 && sep2 > sep1){
    const charText = cleanText.slice(sep1 + CHAR_MARKER.length, sep2).trim();
    userNarrative = cleanText.slice(sep2 + USER_MARKER.length).trim();
    if(currentTaskChar && charText) addCharPov(currentTaskChar.id, charText, 'thought');
  } else if(sep1 !== -1){
    const charText = cleanText.slice(sep1 + CHAR_MARKER.length).trim();
    userNarrative = cleanText.slice(0, sep1).trim();
    if(currentTaskChar && charText) addCharPov(currentTaskChar.id, charText, 'thought');
  } else if(sep2 !== -1){
    userNarrative = cleanText.slice(sep2 + USER_MARKER.length).trim();
  } else {
    // 兜底：**【X视角】** 格式
    const altMarkerRe = /\*?\*?【[^】]*(?:视角|内心)】\*?\*?/g;
    const altMatches = [...cleanText.matchAll(altMarkerRe)];
    if(altMatches.length >= 2){
      const m1 = altMatches[0], m2 = altMatches[1];
      const charText = cleanText.slice(m1.index + m1[0].length, m2.index).trim();
      userNarrative = cleanText.slice(m2.index + m2[0].length).trim();
      if(currentTaskChar && charText) addCharPov(currentTaskChar.id, charText, 'thought');
    } else if(altMatches.length === 1){
      const m = altMatches[0];
      if(m[0].includes('角色') || m[0].includes('内心')){
        const charText = cleanText.slice(m.index + m[0].length).trim();
        userNarrative = cleanText.slice(0, m.index).trim();
        if(currentTaskChar && charText) addCharPov(currentTaskChar.id, charText, 'thought');
      } else {
        userNarrative = cleanText.slice(m.index + m[0].length).trim();
      }
    }
  }

  // ── 5. 清理 userNarrative 里残留的视角标记 ──────────────────────
  userNarrative = userNarrative
    .replace(/【角色视角】[\s\S]*/g, '')
    .replace(/【用户视角】/g, '')
    .replace(/\*\*【[^】]+(?:视角|内心)】\*\*/g, '')
    .replace(/【[^】]+(?:视角|内心)】/g, '')
    .trim();

  // ── 6. 从 userNarrative 里提取 OPTIONS（视角拆完再做）──────────
  let optMatch = null;
  const optReg = /\[OPTIONS:\s*([\s\S]*?)\]/;
  const om = userNarrative.match(optReg);
  if(om){
    optMatch = om;
    userNarrative = userNarrative.replace(optReg,'').trim();
  }
  // 兜底：裸 A. B. C. 格式
  if(!optMatch){
    const optLines = userNarrative.match(/^[A-E][.．。]\s*.{4,}/gm);
    if(optLines && optLines.length >= 2){
      userNarrative = userNarrative.replace(/\n?[A-E][.．。]\s*.{4,}/g,'').trim();
      optMatch = [null, optLines.join('|')];
    }
  }

  // ── 7. 渲染叙事 ─────────────────────────────────────────────────
  parseNarrativeDisplay(userNarrative, 'single');

  // ── 8. 渲染选项（带好感加成） ────────────────────────────────────
  if(optMatch){
    const raw = optMatch[1];
    const parts = raw.includes('|')
      ? raw.split('|').map(s=>s.trim()).filter(Boolean)
      : raw.split(/\n+/).map(s=>s.trim()).filter(Boolean);

    const opts = parts.map((p, i) => {
      // 解析格式：A. 文本 [+2] 或 A. 文本（+好感2）
      const bonusMatch = p.match(/[(\[＋+]好感?(\d+)[)\]]/);
      const bonus = bonusMatch ? parseInt(bonusMatch[1]) : 0;
      const text = p
        .replace(/^[A-E][.．。:\：]\s*/,'')
        .replace(/[(\[＋+]好感?(\d+)[)\]]/,'')
        .trim();
      return { label: String.fromCharCode(65+i), text, goodFeelBonus: bonus };
    }).filter(o => o.text.length > 2);

    if(opts.length >= 2) showOptions(opts, currentTaskChar?.id || null);
    else fetchFallbackOptions(currentTaskChar?.id || null);
  } else {
    fetchFallbackOptions(currentTaskChar?.id || null);
  }

  G.history.push({role:'assistant', content:rawText});
  saveGame();
}

// ── fallback：主回复没给选项时单独再请求一次 ──────────────────────
async function fetchFallbackOptions(charId){
  if(G.isThinking) return;
  const area = document.getElementById('options-area');
  if(area && area.innerHTML.trim()) return;
  try {
    const context = G.history.slice(-4);
    const prompt = '根据上面的剧情，给出3个符合当前场景的回应选项。\n严格只返回：[OPTIONS: A.选项一 | B.选项二 | C.选项三]\n不要任何其他内容。';
    const raw = await fetchAI(buildSystemPrompt(), [...context, {role:'user', content:prompt}]);
    const optReg = /\[OPTIONS:\s*([\s\S]*?)\]/;
    const om = raw.match(optReg);
    let optMatch = null;
    if(om){ optMatch = om; }
    else {
      const optLines = raw.match(/^[A-E][.．。]\s*.{4,}/gm);
      if(optLines && optLines.length >= 2) optMatch = [null, optLines.join('|')];
    }
    if(!optMatch){
      const lines = raw.split(/[|\n]/).map(s=>s.trim()).filter(s=>s.length>3 && !/OPTIONS/i.test(s));
      if(lines.length >= 2) optMatch = [null, lines.join('|')];
    }
    if(optMatch){
      const raw2 = optMatch[1];
      const parts = raw2.includes('|')
        ? raw2.split('|').map(s=>s.trim()).filter(Boolean)
        : raw2.split(/\n+/).map(s=>s.trim()).filter(Boolean);
      const opts = parts.map((p,i)=>({
        label: String.fromCharCode(65+i),
        text: p.replace(/^[A-E][.．。:\：]\s*/,'').trim(),
        goodFeelBonus: 0
      })).filter(o=>o.text.length>2);
      if(opts.length >= 2) showOptions(opts, charId);
    }
  } catch(e){ console.warn('[fallback options]', e); }
}

// ── 叙事文本解析渲染 ─────────────────────────────────────────────
function parseNarrativeDisplay(text, pov){
  text = text
    .replace(/【角色视角】[\s\S]*?(?=【用户视角】|$)/g, '')
    .replace(/【用户视角】/g, '')
    .replace(/\*\*【[^】]+(?:视角|内心)】\*\*/g, '')
    .replace(/\[OPTIONS[\s\S]*?\]/g, '')
    .trim();
  if(!text) return;

  // 匹配 **Name**(rank): *action* "English" 「中文」
  const re1=/\*\*([^*]+)\*\*(?:\s*\(([^)]*)\))?\s*[:\-]?\s*(?:\*([^*]*)\*)?\s*"([^"]+)"\s*[\/「]?\s*「?([^」\n]+)」?/g;
  // 匹配 **Name**: 「中文」
  const re2=/\*\*([^*]+)\*\*(?:\s*\(([^)]*)\))?\s*[：:]\s*[「"]([^」"]+)[」"]/g;

  let idx=0, result, segs=[], hasNpc=false;
  while((result=re1.exec(text))!==null){
    if(result.index>idx) segs.push({type:'narr',text:text.slice(idx,result.index)});
    segs.push({type:'npc',name:result[1],rank:result[2]||'',action:result[3]||'',en:result[4],zh:result[5]});
    idx=result.index+result[0].length; hasNpc=true;
  }
  if(!hasNpc){
    while((result=re2.exec(text))!==null){
      if(result.index>idx) segs.push({type:'narr',text:text.slice(idx,result.index)});
      segs.push({type:'npc',name:result[1],rank:result[2]||'',action:'',en:'',zh:result[3]});
      idx=result.index+result[0].length; hasNpc=true;
    }
  }
  if(idx<text.length) segs.push({type:'narr',text:text.slice(idx)});

  if(hasNpc){
    segs.forEach(seg=>{
      if(seg.type==='narr'){ const t=seg.text.trim(); if(t) addNarr(t,pov); }
      else {
        const c=CHARS.find(ch=>ch.name.toLowerCase().includes(seg.name.toLowerCase().split(' ')[0]));
        addCharMsg(seg.name,seg.rank||c?.rank||'',seg.name.slice(0,2).toUpperCase(),seg.action,seg.en,seg.zh);
      }
    });
  } else {
    text.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean).forEach(p=>addNarr(p,pov));
  }
}
