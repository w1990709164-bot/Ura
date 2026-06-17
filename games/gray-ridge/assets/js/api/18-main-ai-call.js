// ══════════════════════════════
// MAIN AI CALL
// ══════════════════════════════
async function callAI() {
  if (G.isThinking) return;
  G.isThinking = true;
  document.getElementById('send-btn').disabled = true;
  const thinkId = addThinking();

  try {
    const rawText = await fetchAI(buildSystemPrompt(), G.history);
    removeThinking(thinkId);
    processAIResponse(rawText);
  } catch(e) {
    removeThinking(thinkId);
    addSysMsg('系统错误', String(e));
    console.error(e);
  }
  G.isThinking = false;
  document.getElementById('send-btn').disabled = false;
  saveGame();
}

async function fetchAI(systemPrompt, history) {
  // API 始终以主页全局设置为准（LW_API_*），存档中的旧值不会覆盖它
  const apiKey      = localStorage.getItem('LW_API_KEY')   || G.apiKey || '';
  const apiEndpoint = localStorage.getItem('LW_API_URL')   || G.apiEndpoint || '';
  const apiModel    = localStorage.getItem('LW_API_MODEL') || G.apiModel || '';
  if (!apiKey) throw new Error('未设置 API Key，请返回主页设置 API');

  const endpoint = apiEndpoint
    ? apiEndpoint.replace(/\/$/, '') + '/chat/completions'
    : 'https://api.anthropic.com/v1/messages';
  const isOpenAI = !!apiEndpoint;
  const model = apiModel || (isOpenAI ? 'gpt-4o' : 'claude-sonnet-4-20250514');

  let response, data;
  if (isOpenAI) {
    response = await fetch(endpoint, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
      body: JSON.stringify({model, max_tokens:1500, messages:[{role:'system',content:systemPrompt},...history]})
    });
    data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } else {
    response = await fetch(endpoint, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key': apiKey,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body: JSON.stringify({model, max_tokens:1500, system:systemPrompt, messages:history})
    });
    data = await response.json();
    return data.content?.[0]?.text || '';
  }
}
