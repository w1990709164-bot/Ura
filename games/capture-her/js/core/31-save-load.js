// ═══════════════════════════════
// SAVE / LOAD
// ═══════════════════════════════
function saveGame(){
  try {
    const save={
      player:G.player, apiKey:G.apiKey, apiEndpoint:G.apiEndpoint, apiModel:G.apiModel, adultConfirmed:G.adultConfirmed,
      day:G.day, month:G.month, year:G.year, totalDay:G.totalDay, phase:G.phase,
      mood:G.mood, wallet:G.wallet, inventory:G.inventory, chars:G.chars,
      dailyTasks:G.dailyTasks, todayRanking:G.todayRanking,
      chatLog:G.chatLog?.slice(-100),
      history:G.history?.slice(-30), messages:G.messages?.slice(-80),
    };
    localStorage.setItem('mission_court_save', JSON.stringify(save));
  } catch(e){ console.warn('Save failed:',e); }
}

function loadGame(){
  try {
    const raw=localStorage.getItem('mission_court_save');
    if(!raw) return false;
    const save=JSON.parse(raw);
    Object.assign(G,save);
    if(!G.chars) G.chars={};
    CHARS.forEach(c=>{ if(!G.chars[c.id]) G.chars[c.id]={goodFeel:0,obsession:20,status:'base',location:'安全区',os:''}; });
    if(!G.inventory) G.inventory=[];
    if(!G.chatLog) G.chatLog=[];
    if(!G.dailyTasks) G.dailyTasks=[];
    if(!G.todayRanking) G.todayRanking=[];
    G.totalDay=G.totalDay||1;
    return true;
  } catch(e){ return false; }
}

function loadAndStart(){
  if(loadGame()){
    launchApp();
    // Restore messages
    const sv=document.getElementById('single-view');
    sv.innerHTML='';
    (G.messages||[]).slice(-60).forEach(m=>{
      if(m.type==='sys') addSysMsg(m.title,m.content,false);
      else if(m.type==='narr') addNarr(m.content,m.pov||'single',false);
      else if(m.type==='char') addCharMsg(m.name,m.rank,m.init,m.action,m.en,m.zh,false);
      else if(m.type==='player') addPlayerMsg(m.content,false);
    });
    renderChat();
    showToast(`✓ 档案已读取 · 第${G.totalDay||1}天`);
  }
}

function exportSave(){
  const raw=localStorage.getItem('mission_court_save');
  if(!raw){ showToast('没有存档'); return; }
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));
  a.download=`mission_court_${Date.now()}.json`;
  a.click(); showToast('✓ 导出成功');
}

function importSave(e){
  const file=e.target.files[0]; if(!file) return;
  const r=new FileReader();
  r.onload=ev=>{ try{ localStorage.setItem('mission_court_save',ev.target.result); showToast('✓ 导入成功，刷新中'); setTimeout(()=>location.reload(),1200); }catch(e2){ showToast('文件无效'); } };
  r.readAsText(file);
}
