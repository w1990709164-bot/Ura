// ═══════════════════════════════
// AI CALLS
// ═══════════════════════════════
async function callAI_opening(){
  G.isThinking=true;
  document.getElementById('send-btn').disabled=true;
  const thinkId=addThinking();
  G.history.push({role:'user',content:'[游戏开场：描述'+G.player.name+'到安全区行政楼报到的第一天早晨。今天有任务的角色：'+G.dailyTasks.map(t=>CHARS.find(c=>c.id===t.charId)?.name).join('、')+'。用单视角叙事，描述安全区的环境，偶遇一两个角色，体现日常氛围，安全区配角（陈薇、小李、拉米雷斯等）自然出现。给出2-3个选择。]'});
  try {
    const raw=await fetchAI(buildSystemPrompt(), G.history);
    removeThinking(thinkId);
    processAIResponse(raw, null);
  } catch(e){ removeThinking(thinkId); addSysMsg('连接错误',String(e)); }
  G.isThinking=false;
  document.getElementById('send-btn').disabled=false;
}

async function callAI(){
  if(G.isThinking) return;
  G.isThinking=true;
  document.getElementById('send-btn').disabled=true;
  const thinkId=addThinking();
  const activeTask = G.currentTask || null;
  try {
    const raw=await fetchAI(buildSystemPrompt(), G.history);
    removeThinking(thinkId);
    processAIResponse(raw, activeTask);
  } catch(e){ removeThinking(thinkId); addSysMsg('错误',String(e)); }
  G.isThinking=false;
  document.getElementById('send-btn').disabled=false;
  saveGame();
}

async function fetchAI(systemPrompt, history){
  // 从主页全局 localStorage 读取 API 配置
  const apiUrl   = localStorage.getItem('LW_API_URL')||'';
  const apiKey   = localStorage.getItem('LW_API_KEY')||'';
  const apiModel = localStorage.getItem('LW_API_MODEL')||'claude-sonnet-4-20250514';

  if(!apiKey) throw new Error('未设置 API Key，请返回主页设置 API');

  const isOpenAI = !!apiUrl;
  const endpoint = isOpenAI
    ? apiUrl.replace(/\/$/,'')+'/chat/completions'
    : 'https://api.anthropic.com/v1/messages';

  let response, data;
  if(isOpenAI){
    response=await fetch(endpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
      body:JSON.stringify({model:apiModel,max_tokens:2500,messages:[{role:'system',content:systemPrompt},...history]})
    });
    data=await response.json();
    return data.choices?.[0]?.message?.content||'';
  } else {
    response=await fetch(endpoint,{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:apiModel,max_tokens:2500,system:systemPrompt,messages:history})
    });
    data=await response.json();
    return data.content?.[0]?.text||'';
  }
}
