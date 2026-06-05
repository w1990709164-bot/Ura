// ══════════════════════════════
// MESSAGES
// ══════════════════════════════
function addNarr(text, save=true) {
  const d = document.createElement('div');
  d.className = 'msg msg-narration';
  d.innerHTML = text.replace(/\*\*(.*?)\*\*/g,'<strong style="color:var(--white)">$1</strong>')
                    .replace(/\*(.*?)\*/g,'<em>$1</em>')
                    .replace(/\n/g,'<br>');
  appendMsg(d);
  if (save) G.messages.push({type:'narr', content:text});
}
function addSysMsg(title, content, save=true) {
  const d = document.createElement('div');
  d.className = 'msg msg-system';
  d.innerHTML = `<div class="sys-head">${title}</div>${content}`;
  appendMsg(d);
  if (save) G.messages.push({type:'sys', title, content});
}
function addNpcMsg(name, unit, init, action, en, zh, save=true) {
  const d = document.createElement('div');
  d.className = 'msg msg-npc';
  d.innerHTML = `
    <div class="npc-av">${init}</div>
    <div class="npc-body">
      <div class="npc-name">${name} <span class="npc-rank">${unit}</span></div>
      <div class="npc-bubble">
        ${action?`<span class="action">*${action}*</span>`:''}
        ${en?`<span class="en">"${en}"</span>`:''}
        ${zh?`<span class="zh">「${zh}」</span>`:''}
      </div>
    </div>`;
  appendMsg(d);
  if (save) G.messages.push({type:'npc', name, unit, init, action, en, zh});
}
function addPlayerMsg(text, save=true) {
  const d = document.createElement('div');
  d.className = 'msg msg-player';
  const initials = G.player.name.slice(0,2);
  d.innerHTML = `<div class="player-bubble">${text.replace(/\n/g,'<br>')}</div><div class="player-av">${initials}</div>`;
  appendMsg(d);
  if (save) G.messages.push({type:'player', content:text});
}
function addThinking() {
  const d = document.createElement('div');
  d.className = 'msg msg-thinking';
  const id = 'think-'+Date.now();
  d.id = id;
  d.innerHTML = `<div class="dots"><span>●</span><span>●</span><span>●</span></div>正在分析患者状态…`;
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

// ── Restore messages from save ──
function restoreMessages() {
  const msgs = document.getElementById('messages');
  msgs.innerHTML = '';
  if (!G.messages || !G.messages.length) return;
  // Limit to last 60 messages to avoid slowness
  const toShow = G.messages.slice(-60);
  toShow.forEach(m => {
    switch(m.type) {
      case 'narr':   addNarr(m.content, false); break;
      case 'sys':    addSysMsg(m.title, m.content, false); break;
      case 'npc':    addNpcMsg(m.name, m.unit, m.init, m.action, m.en, m.zh, false); break;
      case 'player': addPlayerMsg(m.content, false); break;
    }
  });
  // Scroll to bottom without animation
  setTimeout(()=>{ msgs.scrollTop = msgs.scrollHeight; }, 100);
}
