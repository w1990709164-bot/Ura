// ════════════════════════════════
// API HELPERS
// ════════════════════════════════
async function callAI(messages, systemPrompt, maxTokens=600){
  const baseUrl = API.url || 'https://api.openai.com/v1';
  const res = await fetch(`${baseUrl}/chat/completions`,{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':`Bearer ${API.key}`},
    body: JSON.stringify({
      model: API.model,
      messages:[{role:'system',content:systemPrompt},...messages],
      max_tokens: maxTokens,
      temperature: 0.88
    })
  });
  if(!res.ok){
    const e = await res.json().catch(()=>({}));
    throw new Error(e.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAIJson(messages, systemPrompt, maxTokens=800){
  const raw = await callAI(messages, systemPrompt, maxTokens);
  // 清理markdown代码块标记
  let clean = raw.replace(/```json\s*|```\s*/g,'').trim();
  // 尝试直接解析
  try{ return JSON.parse(clean); }catch(_){}
  // 提取最外层的[]或{}
  const arrMatch = clean.match(/\[[\s\S]*\]/);
  const objMatch = clean.match(/\{[\s\S]*\}/);
  // 优先尝试数组，再尝试对象，两个都试一遍
  const candidates = [];
  if(arrMatch) candidates.push(arrMatch[0]);
  if(objMatch) candidates.push(objMatch[0]);
  for(const c of candidates){
    try{ return JSON.parse(c); }catch(_){}
    // 如果还是失败，尝试截断到最后一个完整的}或]
    try{
      const lastClose = Math.max(c.lastIndexOf('}'), c.lastIndexOf(']'));
      if(lastClose > 0) return JSON.parse(c.slice(0, lastClose+1));
    }catch(_){}
  }
  throw new Error('JSON解析失败，请重试');
}

// 下拉选择同步到手动输入框
function syncModelInput(scope){
  if(scope==='api'){
    const v=document.getElementById('api-model-select').value;
    if(v) document.getElementById('api-model').value=v;
  } else {
    const v=document.getElementById('settings-model-select').value;
    if(v) document.getElementById('settings-model').value=v;
  }
}

async function fetchModels(){
  const url = document.getElementById('api-url').value.trim() || 'https://api.openai.com/v1';
  const key = document.getElementById('api-key').value.trim();
  if(!key){ showMsg('请先填写API Key'); return; }
  showMsg('拉取中…');
  try{
    const res = await fetch(`${url}/models`,{headers:{'Authorization':`Bearer ${key}`}});
    const data = await res.json();
    const models = data.data?.map(m=>m.id).sort() || [];
    if(models.length===0){ showMsg('未获取到模型，请手动输入'); return; }
    const sel = document.getElementById('api-model-select');
    sel.innerHTML = `<option value="">— 手动输入 —</option>`+models.map(m=>`<option value="${m}">${m}</option>`).join('');
    showMsg(`获取到 ${models.length} 个模型，请从下拉选择`);
  }catch(e){ showMsg('拉取失败，请手动输入模型名'); }
}

async function fetchModelsInSettings(){
  const url = document.getElementById('settings-url').value.trim() || API.url || 'https://api.openai.com/v1';
  const key = document.getElementById('settings-key').value.trim() || API.key;
  if(!key){ showMsg('请先填写API Key'); return; }
  showMsg('拉取中…');
  try{
    const res = await fetch(`${url}/models`,{headers:{'Authorization':`Bearer ${key}`}});
    const data = await res.json();
    const models = data.data?.map(m=>m.id).sort() || [];
    if(models.length===0){ showMsg('未获取到模型，请手动输入'); return; }
    const sel = document.getElementById('settings-model-select');
    sel.innerHTML = `<option value="">— 手动输入 —</option>`+models.map(m=>`<option value="${m}">${m}</option>`).join('');
    showMsg(`获取到 ${models.length} 个模型`);
  }catch(e){ showMsg('拉取失败，请手动输入模型名'); }
}

async function saveApi(){
  const key = document.getElementById('api-key').value.trim();
  if(!key){ showMsg('请填写 API Key'); return; }
  const modelInput = document.getElementById('api-model').value.trim();
  const modelSelect = document.getElementById('api-model-select').value;
  const model = modelInput || modelSelect || 'gpt-4o';
  if(!model){ showMsg('请选择或输入模型名'); return; }
  API.key = key;
  API.url = document.getElementById('api-url').value.trim();
  API.model = model;
  await Store.set('cod_api', JSON.stringify(API));
  show('s-create');
}

async function saveSettingsApi(){
  const k = document.getElementById('settings-key').value.trim();
  if(k) API.key = k;
  const u = document.getElementById('settings-url').value.trim();
  if(u) API.url = u;
  const modelInput = document.getElementById('settings-model').value.trim();
  if(modelInput) API.model = modelInput;
  await Store.set('cod_api', JSON.stringify(API));
  showMsg('API设置已保存');
}
