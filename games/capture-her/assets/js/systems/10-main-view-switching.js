// ═══════════════════════════════
// MAIN VIEW SWITCHING
// ═══════════════════════════════
function showMainView(view) {
  document.getElementById('scene-view').style.display = view==='scene'?'flex':'none';
  document.getElementById('second-tab-view').style.display = view==='second'?'flex':'none';
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const navEl = view==='second' ? document.getElementById('nav-second') : document.getElementById('nav-scene');
  if(navEl) navEl.classList.add('active');
}

function showSecondTab() {
  const icon = document.getElementById('nav-second-icon');
  const label = document.getElementById('nav-second-label');
  if(G.phase === 'evening') {
    icon.textContent = '💬'; label.textContent = '群聊';
    document.getElementById('char-pov-view').style.display = 'none';
    document.getElementById('chat-view').style.display = 'flex';
  } else {
    icon.textContent = '💭'; label.textContent = '视角';
    document.getElementById('char-pov-view').style.display = 'flex';
    document.getElementById('chat-view').style.display = 'none';
    renderCharPovTabs();
  }
  showMainView('second');
}

function updateSecondTabNav() {
  const icon = document.getElementById('nav-second-icon');
  const label = document.getElementById('nav-second-label');
  if(G.phase === 'evening') {
    if(icon) icon.textContent = '💬';
    if(label) label.textContent = '群聊';
  } else {
    if(icon) icon.textContent = '💭';
    if(label) label.textContent = '视角';
  }
}

// Char POV tab system
let currentCharPovId = null;
let charPovData = {};

function renderCharPovTabs() {
  const tabsEl = document.getElementById('char-pov-tabs');
  if(!tabsEl) return;
  const allTaskChars = G.dailyTasks || [];
  if(!allTaskChars.length) {
    tabsEl.innerHTML = '<div style="font-family:var(--mono);font-size:9px;color:var(--text3);letter-spacing:1px">今日无任务角色</div>';
    return;
  }
  tabsEl.innerHTML = allTaskChars.map(t=>{
    const c = CHARS.find(x=>x.id===t.charId);
    const isActive = currentCharPovId === t.charId;
    const isDone = t.done;
    return `<div onclick="switchCharPov('${t.charId}')" style="font-family:var(--mono);font-size:9px;letter-spacing:1px;padding:3px 8px;border-radius:2px;border:1px solid ${isActive?'var(--red)':'var(--border)'};color:${isActive?'var(--red)':isDone?'var(--text2)':'var(--red)'};background:${isActive?'var(--red-glow2)':'var(--bg3)'};cursor:pointer;white-space:nowrap;flex-shrink:0">${c?.name||t.charId}${isDone?'✓':''}</div>`;
  }).join('');
}

function switchCharPov(charId) {
  currentCharPovId = charId;
  renderCharPovTabs();
  renderCharPovContent(charId);
}

function renderCharPovContent(charId) {
  const el = document.getElementById('char-pov-content');
  if(!el) return;
  const data = charPovData[charId] || [];
  const c = CHARS.find(x=>x.id===charId);
  const task = G.dailyTasks?.find(t=>t.charId===charId);
  el.innerHTML = '';

  const taskDesc = (task?.taskDesc && task.taskDesc.length > 0)
    ? task.taskDesc
    : (data.find(m=>m.type==='task')?.content?.replace('今日任务：','') || '任务生成中，请稍候…');

  const header = document.createElement('div');
  header.style.cssText = 'background:var(--panel);border:1px solid var(--border2);border-radius:3px;padding:12px 14px;margin-bottom:12px';
  header.innerHTML = `
    <div style="font-family:var(--mono);font-size:8px;color:var(--red);letter-spacing:2px;margin-bottom:4px">⚠ SYSTEM · 今日任务</div>
    <div style="font-family:var(--serif);font-size:14px;color:var(--white);line-height:1.7">${taskDesc}</div>
    <div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-top:6px;letter-spacing:1px">${task?.done?'✓ 已完成':'⏳ 进行中'}</div>`;
  el.appendChild(header);

  if(!data.length || (data.length===1 && data[0].type==='task')){
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;padding:30px 20px';
    empty.innerHTML = `<div style="font-family:var(--cormo);font-style:italic;font-size:13px;color:var(--text3)">等待任务触发…<br>进入「白天」阶段后这里将显示角色的内心动态</div>`;
    el.appendChild(empty);
    return;
  }

  data.forEach(msg => {
    if(msg.type === 'task') return;
    const d = document.createElement('div');
    d.style.marginBottom = '10px';
    if(msg.type === 'thought') {
      d.className = 'thought-bubble';
      d.innerHTML = `<span class="th-name">${c?.name} · 内心</span>${msg.content}`;
    } else if(msg.type === 'action') {
      d.style.cssText = 'font-family:var(--cormo);font-style:italic;font-size:13px;color:var(--text2);padding:8px 12px;border-left:1px solid var(--border2);line-height:1.8';
      d.textContent = msg.content;
    } else {
      d.className = 'msg msg-narr';
      d.textContent = msg.content;
    }
    el.appendChild(d);
  });
  el.scrollTop = el.scrollHeight;
}

function addCharPov(charId, content, type='thought') {
  if(!charPovData[charId]) charPovData[charId] = [];
  charPovData[charId].push({type, content});
  if(currentCharPovId === charId) renderCharPovContent(charId);
  const icon = document.getElementById('nav-second-icon');
  if(icon && G.phase !== 'evening') icon.textContent = '💭✨';
}

function enableDualView(on) {
  G.isDualView = on;
  document.getElementById('single-view').style.display = 'flex';
  showMainView('scene');
}
