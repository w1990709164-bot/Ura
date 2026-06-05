// ═══════════════════════════════
// SETTINGS
// ═══════════════════════════════
async function fetchModels(selectId, endpointId, keyId) {
  selectId = selectId||'st-model'; endpointId = endpointId||'st-endpoint'; keyId = keyId||'st-key';
  const endpoint = document.getElementById(endpointId).value.trim();
  const key = document.getElementById(keyId).value.trim() || G.apiKey;
  if(!endpoint) { showToast('请先填写自定义端点'); return; }
  showToast('正在拉取模型列表…');
  try {
    const res = await fetch(endpoint.replace(/\/$/, '')+'/models', {
      headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'}
    });
    const data = await res.json();
    const models = data.data || data.models || [];
    if(models.length) {
      const sel = document.getElementById(selectId);
      sel.innerHTML = models.map(m=>`<option value="${m.id||m}">${m.id||m}</option>`).join('');
      showToast(`✓ 加载了 ${models.length} 个模型`);
    } else { showToast('未获取到模型列表'); }
  } catch(e) { showToast('拉取失败：'+e.message); }
}

function fetchModelsGs() { fetchModels('gs-model','gs-endpoint','gs-key'); }

function saveSettings() {
  const key = document.getElementById('st-key').value.trim();
  const confirmed = document.getElementById('st-adult').checked;
  const err = document.getElementById('st-err');
  if(!key){ err.textContent='请输入API密钥'; err.style.display='block'; return; }
  if(!confirmed){ err.textContent='请确认年龄验证'; err.style.display='block'; return; }
  err.style.display='none';
  G.apiKey = key;
  G.apiEndpoint = document.getElementById('st-endpoint').value.trim();
  G.apiModel = document.getElementById('st-model').value;
  G.adultConfirmed = true;
  saveGame();
  showToast('✓ 设置已保存');
  showScreen('title-screen');
}

function saveGsSettings() {
  G.apiKey = document.getElementById('gs-key').value.trim() || G.apiKey;
  G.apiEndpoint = document.getElementById('gs-endpoint').value.trim();
  G.apiModel = document.getElementById('gs-model').value || G.apiModel;
  saveGame(); showToast('✓ API配置已保存');
}

function toggleKey(inputId, btn) {
  const inp = document.getElementById(inputId);
  inp.type = inp.type==='password' ? 'text' : 'password';
  btn.textContent = inp.type==='password' ? '👁' : '🙈';
}
