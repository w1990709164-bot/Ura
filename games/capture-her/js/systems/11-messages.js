// ═══════════════════════════════
// MESSAGES
// ═══════════════════════════════
function addSysMsg(title, content, save=true){
  const d=document.createElement('div');
  d.className='msg msg-system';
  d.innerHTML=`<div class="sys-head">${title}</div>${content.replace(/\n/g,'<br>')}`;
  appendMsg(d,'single');
  if(save) G.messages.push({type:'sys',title,content});
}

function addNarr(text, pov='single', save=true){
  const d=document.createElement('div');
  d.className='msg msg-narr'; d.textContent=text;
  const el=document.getElementById('single-view');
  if(el){ el.appendChild(d); setTimeout(()=>el.scrollTop=el.scrollHeight,50); }
  if(save) G.messages.push({type:'narr',content:text,pov});
}

function addThought(charName, text, charId){
  // Find charId from name if not provided
  if(!charId && charName) {
    const c = CHARS.find(x=>x.name.toLowerCase()===charName.toLowerCase()||charName.includes(x.name));
    charId = c?.id;
  }
  // If we have a charId use the new tab system
  if(charId) {
    addCharPov(charId, text, 'thought');
    return;
  }
  // Fallback: find the current task char
  const activeTask = G.dailyTasks?.find(t=>!t.done);
  if(activeTask) addCharPov(activeTask.charId, text, 'thought');
}

function addCharMsg(name,rank,init,action,en,zh,save=true){
  const container = 'single-view';
  const d=document.createElement('div');
  d.className='msg msg-char';
  d.innerHTML=`<div class="char-av">${init||name.slice(0,2)}</div>
    <div class="char-body">
      <div class="char-name">${name}${rank?`<span class="char-rank">${rank}</span>`:''}</div>
      <div class="char-bubble">
        ${action?`<span class="action">*${action}*</span>`:''}
        ${en?`<span class="en">${en}</span>`:''}
        ${zh?`<span class="zh">${zh}</span>`:''}
      </div>
    </div>`;
  const el=document.getElementById(container);
  if(el){ el.appendChild(d); el.scrollTop=el.scrollHeight; }
  if(save) G.messages.push({type:'char',name,rank,init,action,en,zh});
}

function addPlayerMsg(text,save=true){
  const container = 'single-view';
  const d=document.createElement('div');
  d.className='msg msg-player';
  const init=(G.player.name||'?').slice(0,1).toUpperCase();
  d.innerHTML=`<div class="player-bubble">${text}</div><div class="player-av">${init}</div>`;
  const el=document.getElementById(container);
  if(el){ el.appendChild(d); el.scrollTop=el.scrollHeight; }
  if(save) G.messages.push({type:'player',content:text});
}

function addThinking(){
  const d=document.createElement('div');
  d.className='msg msg-thinking';
  const id='think-'+Date.now(); d.id=id;
  d.innerHTML=`<div class="dots"><span>●</span><span>●</span><span>●</span></div>系统处理中…`;
  appendMsg(d,'single'); return id;
}
function removeThinking(id){ document.getElementById(id)?.remove(); }

function appendMsg(el, pov='single'){
  const msgs = document.getElementById('single-view');
  if(msgs){ msgs.appendChild(el); setTimeout(()=>msgs.scrollTop=msgs.scrollHeight,50); }
}
