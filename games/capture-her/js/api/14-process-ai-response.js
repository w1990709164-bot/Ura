// ═══════════════════════════════
// PROCESS AI RESPONSE
// ═══════════════════════════════
function processAIResponse(rawText, currentTask){
  // Extract horae - multiple fallback strategies
  let narrative = rawText;
  let horaeData = null;

  // Strategy 1: proper <horae>...</horae> tags
  const horaeMatch = rawText.match(/<horae>([\s\S]*?)<\/horae>/);
  if(horaeMatch){
    narrative = rawText.replace(/<horae>[\s\S]*?<\/horae>/g,'').trim();
    try{ horaeData = JSON.parse(horaeMatch[1].trim()); }
    catch(e){ console.warn('[horae parse]',e); }
  }

  // Strategy 2: unclosed <horae> tag
  if(!horaeData){
    const unclosed = rawText.match(/<horae>([\s\S]*?)(?=\n\n|叙事|【|\[OPTIONS)/);
    if(unclosed){
      narrative = rawText.replace(/<horae>[\s\S]*?(?=\n\n|叙事|【|\[OPTIONS)/,'').trim();
      try{ horaeData = JSON.parse(unclosed[1].trim()); }
      catch(e){}
    }
  }

  // Strategy 3: raw JSON block at start/end
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

  // Always strip any remaining horae/json artifacts from narrative
  narrative = narrative
    .replace(/<horae>[\s\S]*?<\/horae>/g,'')
    .replace(/<horae>[\s\S]*/g,'')  // unclosed
    .replace(/^\s*\{[\s\S]*?"task_complete"[\s\S]*?\}/m,'') // raw json
    .trim();

  if(horaeData){
    try{ processHorae(horaeData, currentTask); }
    catch(e){ console.warn('[horae process]',e); }
  }

  // Strip OPTIONS
  let optMatch=null;
  let cleanText=narrative.replace(/<memory>[\s\S]*?<\/memory>/g,'').trim();
  const optReg=/\[OPTIONS:\s*([\s\S]*?)\]/;
  const om=cleanText.match(optReg);
  if(om){ optMatch=om; cleanText=cleanText.replace(optReg,'').trim(); }
  if(!optMatch){
    const optLines=cleanText.match(/^[A-E][.．。]\s*.{4,}/gm);
    if(optLines&&optLines.length>=2){
      cleanText=cleanText.replace(/\n?[A-E][.．。]\s*.{4,}/g,'').trim();
      optMatch=[null,optLines.join('|')];
    }
  }

  // Parse narrative - extract char POV and user POV
  // Route char POV to second tab, user POV to scene
  let userNarrative = cleanText;
  // Use passed task param OR G.currentTask (whichever is set)
  const activeTask = currentTask || G.currentTask;
  const currentTaskChar = activeTask ? CHARS.find(c=>c.id===activeTask.charId) : null;

  // Strategy 1: Find 【角色视角】 and 【用户视角】 markers
  const CHAR_MARKER = '【角色视角】';
  const USER_MARKER = '【用户视角】';
  const sep1 = cleanText.indexOf(CHAR_MARKER);
  const sep2 = cleanText.indexOf(USER_MARKER);

  if(sep1 !== -1 && sep2 !== -1 && sep2 > sep1){
    // Both markers found — strict split
    const charText = cleanText.slice(sep1 + CHAR_MARKER.length, sep2).trim();
    userNarrative = cleanText.slice(sep2 + USER_MARKER.length).trim();
    if(currentTaskChar && charText) {
      addCharPov(currentTaskChar.id, charText, 'thought');
    }
  } else if(sep1 !== -1){
    // Only char marker — everything before is user narr, everything after is char pov
    const charText = cleanText.slice(sep1 + CHAR_MARKER.length).trim();
    userNarrative = cleanText.slice(0, sep1).trim();
    if(currentTaskChar && charText) addCharPov(currentTaskChar.id, charText, 'thought');
  } else if(sep2 !== -1){
    // Only user marker — everything before is discarded (likely char pov without tag), after is user
    userNarrative = cleanText.slice(sep2 + USER_MARKER.length).trim();
  } else {
    // No standard markers — try **【X视角】** format  
    const altMarkerRe = /\*?\*?【[^】]*(?:视角|内心)】\*?\*?/g;
    const altMatches = [...cleanText.matchAll(altMarkerRe)];
    if(altMatches.length >= 2){
      const m1 = altMatches[0], m2 = altMatches[1];
      const charText = cleanText.slice(m1.index + m1[0].length, m2.index).trim();
      userNarrative = cleanText.slice(m2.index + m2[0].length).trim();
      if(currentTaskChar && charText) addCharPov(currentTaskChar.id, charText, 'thought');
    } else if(altMatches.length === 1){
      const m = altMatches[0];
      // If marker looks like char pov, rest of text after it is char pov; before is user narr
      if(m[0].includes('角色') || m[0].includes('内心')){
        const charText = cleanText.slice(m.index + m[0].length).trim();
        userNarrative = cleanText.slice(0, m.index).trim();
        if(currentTaskChar && charText) addCharPov(currentTaskChar.id, charText, 'thought');
      } else {
        userNarrative = cleanText.slice(m.index + m[0].length).trim();
      }
    }
    // else: no markers at all — treat whole thing as user narrative (normal non-task scenes)
  }

  // Final cleanup — strip ALL remaining POV markers from user narrative
  userNarrative = userNarrative
    .replace(/【角色视角】[\s\S]*/g, '') // nuke anything after a stray char marker
    .replace(/【用户视角】/g, '')
    .replace(/\*\*【[^】]+(?:视角|内心)】\*\*/g, '')
    .replace(/【[^】]+(?:视角|内心)】/g, '')
    .trim();

  parseNarrativeDisplay(userNarrative,'single');

  if(optMatch){
    const raw=optMatch[1];
    const parts=raw.includes('|')?raw.split('|').map(s=>s.trim()).filter(Boolean):raw.split(/\n+/).map(s=>s.trim()).filter(Boolean);
    const opts=parts.map((p,i)=>({label:String.fromCharCode(65+i),text:p.replace(/^[A-E][.．。:\：]\s*/,'').trim()})).filter(o=>o.text.length>2);
    if(opts.length>=2) showOptions(opts);
    else fetchFallbackOptions(); // parsed less than 2 valid options
  } else {
    // No options found at all — auto-fetch
    fetchFallbackOptions();
  }

  G.history.push({role:'assistant',content:rawText});
  saveGame();
}

// Auto-补选项：当主调用没返回选项时，单独请求一次
async function fetchFallbackOptions(){
  // Don't spam — if already thinking or options area has content, skip
  if(G.isThinking) return;
  const area = document.getElementById('options-area');
  if(area && area.innerHTML.trim()) return; // already has options

  try {
    const context = G.history.slice(-4); // last 2 turns for context
    const prompt = '根据上面的剧情，给出3个符合当前场景的回应选项。\n严格只返回：[OPTIONS: A.选项一 | B.选项二 | C.选项三]\n不要任何其他内容。';
    const tempHistory = [...context, {role:'user', content: prompt}];
    const raw = await fetchAI(buildSystemPrompt(), tempHistory);

    // Parse the returned options
    const optReg = /\[OPTIONS:\s*([\s\S]*?)\]/;
    const om = raw.match(optReg);
    let optMatch = null;
    if(om){ optMatch = om; }
    else {
      const optLines = raw.match(/^[A-E][.．。]\s*.{4,}/gm);
      if(optLines && optLines.length >= 2) optMatch = [null, optLines.join('|')];
    }
    if(!optMatch) {
      // Last resort: split by | or newline directly
      const lines = raw.split(/[|\n]/).map(s=>s.trim()).filter(s=>s.length>3 && !/OPTIONS/i.test(s));
      if(lines.length >= 2) optMatch = [null, lines.join('|')];
    }
    if(optMatch){
      const raw2 = optMatch[1];
      const parts = raw2.includes('|') ? raw2.split('|').map(s=>s.trim()).filter(Boolean) : raw2.split(/\n+/).map(s=>s.trim()).filter(Boolean);
      const opts = parts.map((p,i)=>({label:String.fromCharCode(65+i), text:p.replace(/^[A-E][.．。:\：]\s*/,'').trim()})).filter(o=>o.text.length>2);
      if(opts.length >= 2) showOptions(opts);
    }
  } catch(e){ console.warn('[fallback options]', e); }
}

function parseNarrativeDisplay(text, pov){
  // Remove any leftover POV markers that slipped through
  text = text
    .replace(/【角色视角】[\s\S]*?(?=【用户视角】|$)/g, '') // strip char POV blocks
    .replace(/【用户视角】/g, '')
    .replace(/\*\*【[^】]+(?:视角|内心)】\*\*/g, '')
    .trim();

  // Remove any remaining [OPTIONS...] blocks that slipped through
  text = text.replace(/\[OPTIONS[\s\S]*?\]/g, '').trim();

  if(!text) return;

  // Pattern 1: **Name**(rank): *action* "English" 「Chinese」
  const re1=/\*\*([^*]+)\*\*(?:\s*\(([^)]*)\))?\s*[:\-]?\s*(?:\*([^*]*)\*)?\s*"([^"]+)"\s*[\/「]?\s*「?([^」\n]+)」?/g;
  // Pattern 2: **Name**: 「Chinese」 (Chinese-only dialogue)
  const re2=/\*\*([^*]+)\*\*(?:\s*\(([^)]*)\))?\s*[：:]\s*[「"]([^」"]+)[」"]/g;

  let idx=0, result, segs=[], hasNpc=false;

  // Try pattern 1 first
  while((result=re1.exec(text))!==null){
    if(result.index>idx) segs.push({type:'narr',text:text.slice(idx,result.index)});
    segs.push({type:'npc',name:result[1],rank:result[2]||'',action:result[3]||'',en:result[4],zh:result[5]});
    idx=result.index+result[0].length; hasNpc=true;
  }

  if(!hasNpc){
    // Try pattern 2 (Chinese-only)
    while((result=re2.exec(text))!==null){
      if(result.index>idx) segs.push({type:'narr',text:text.slice(idx,result.index)});
      segs.push({type:'npc',name:result[1],rank:result[2]||'',action:'',en:'',zh:result[3]});
      idx=result.index+result[0].length; hasNpc=true;
    }
  }

  if(idx<text.length) segs.push({type:'narr',text:text.slice(idx)});

  if(hasNpc){
    segs.forEach(seg=>{
      if(seg.type==='narr'){
        const t = seg.text.trim();
        if(t) addNarr(t, pov);
      } else if(seg.type==='npc'){
        const c=CHARS.find(ch=>ch.name.toLowerCase().includes(seg.name.toLowerCase().split(' ')[0]));
        addCharMsg(seg.name,seg.rank||c?.rank||'',seg.name.slice(0,2).toUpperCase(),seg.action,seg.en,seg.zh);
      }
    });
  } else {
    // No NPC dialogue found — render as plain narrative paragraphs
    // Split on blank lines to avoid one giant block
    const paragraphs = text.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean);
    paragraphs.forEach(p => addNarr(p, pov));
  }
}
