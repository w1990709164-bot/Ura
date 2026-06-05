// ═══════════════════════════════
// DAILY TASK GENERATION
// ═══════════════════════════════
function generateDailyTasks(cb) {
  const count = 2 + Math.floor(Math.random()*3);
  const shuffled = [...CHARS].sort(()=>Math.random()-0.5);
  G.dailyTasks = shuffled.slice(0, count).map(c=>({
    charId: c.id, taskDesc:'', done:false, startTime:null, completionTime:null
  }));
  G.todayRanking = [];
  generateTaskDescs(cb);
}

async function generateTaskDescs(cb) {
  if(!G.apiKey) { if(cb) cb(); return; }
  const taskChars = G.dailyTasks.map(t=>{
    const c = CHARS.find(x=>x.id===t.charId);
    const cs = G.chars[t.charId];
    return `${c.name}(${c.chatId})，执念值${cs.obsession}，用户好感${cs.goodFeel}`;
  }).join('；');

  const prompt = `你是《任务：攻略她》的系统引擎。
今天有任务的角色：${taskChars}
用户：${G.player.name}，Beta女性，安全区行政

请为每个角色生成一个今天的攻略系统任务。任务要符合角色性格，难度适中，越有趣越好。
严格返回JSON数组，不要其他内容：
[{"charId":"角色id","task":"任务描述，要具体有趣，不超过30字"}]`;

  try {
    const raw = await fetchAI(prompt, [{role:'user',content:'生成今日任务'}]);
    const match = raw.match(/\[[\s\S]*\]/);
    if(match){
      const arr = JSON.parse(match[0]);
      arr.forEach(item=>{
        const t = G.dailyTasks.find(x=>x.charId===item.charId);
        if(t) t.taskDesc = item.task;
      });
    }
  } catch(e){ console.warn('Task gen failed:', e); }

  showMorningNotifs();
  refreshCharPovTaskHeaders();
  saveGame();
  if(cb) cb();
}

function showMorningNotifs() {
  G.dailyTasks.forEach((t,i)=>{
    if(!charPovData[t.charId]) charPovData[t.charId] = [];
    if(i===0) currentCharPovId = t.charId;
  });
  refreshCharPovTaskHeaders();
  setTimeout(()=>{
    addSysMsg('今日任务已派发', `共 ${G.dailyTasks.length} 名角色收到系统任务　前往「视角」标签查看`);
    if(G.totalDay > 1) rollAlphaHeat();
  }, 300);
}

function refreshCharPovTaskHeaders() {
  G.dailyTasks.forEach(t=>{
    if(!charPovData[t.charId]) charPovData[t.charId] = [];
    charPovData[t.charId] = charPovData[t.charId].filter(m=>m.type!=='task');
    charPovData[t.charId].unshift({
      type:'task',
      content: t.taskDesc || '任务生成中…'
    });
  });
  if(currentCharPovId && document.getElementById('char-pov-view')?.style.display !== 'none'){
    renderCharPovContent(currentCharPovId);
    renderCharPovTabs();
  }
}
