// ══════════════════════════════
// MESSAGES
// ══════════════════════════════
function addNarr(text, save=true) {
  const d = document.createElement('div');
  d.className = 'msg msg-narration';
  d.textContent = text;
  appendMsg(d);
  if (save) G.messages.push({type:'narr', content:text});
}

function addSysMsg(title, content, save=true) {
  const d = document.createElement('div');
  d.className = 'msg msg-system';
  d.innerHTML = `<div class="sys-head">${title}</div>${content.replace(/\n/g,'<br>')}`;
  appendMsg(d);
  if (save) G.messages.push({type:'sys', title, content});
}

function addNpcMsg(name, rank, init, action, en, zh, save=true) {
  const d = document.createElement('div');
  d.className = 'msg msg-npc';
  d.innerHTML = `
    <div class="npc-av">${init||name.slice(0,2)}</div>
    <div class="npc-body">
      <div class="npc-name">${name}${rank?`<span class="npc-rank">${rank}</span>`:''}</div>
      <div class="npc-bubble">
        ${action?`<span class="action">*${action}*</span>`:''}
        ${en?`<span class="en">${en}</span>`:''}
        ${zh?`<span class="zh">${zh}</span>`:''}
      </div>
    </div>`;
  appendMsg(d);
  if (save) G.messages.push({type:'npc', name, rank, init, action, en, zh});
}

function addPlayerMsg(text, save=true) {
  const d = document.createElement('div');
  d.className = 'msg msg-player';
  const initials = (G.player.name||'?').slice(0,1).toUpperCase();
  d.innerHTML = `
    <div class="player-bubble">${text}</div>
    <div class="player-av">${initials}</div>`;
  appendMsg(d);
  if (save) G.messages.push({type:'player', content:text});
}

function addThinking() {
  const d = document.createElement('div');
  d.className = 'msg msg-thinking';
  const id = 'think-'+Date.now();
  d.id = id;
  d.innerHTML = `<div class="dots"><span>●</span><span>●</span><span>●</span></div>灰脊的风在低语……`;
  appendMsg(d);
  return id;
}
function removeThinking(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
function appendMsg(el) {
  const msgs = document.getElementById('messages');
  msgs.appendChild(el);
  setTimeout(()=>msgs.scrollTop=msgs.scrollHeight, 50);
}

function restoreMessages() {
  const msgs = document.getElementById('messages');
  msgs.innerHTML = '';
  (G.messages||[]).slice(-120).forEach(m => {
    switch(m.type) {
      case 'narr': addNarr(m.content, false); break;
      case 'sys': addSysMsg(m.title, m.content, false); break;
      case 'npc': addNpcMsg(m.name, m.rank, m.init, m.action, m.en, m.zh, false); break;
      case 'player': addPlayerMsg(m.content, false); break;
    }
  });
  setTimeout(()=>{ document.getElementById('messages').scrollTop = 99999; }, 100);
}
