// ═══════════════════════════════
// HORAE PROCESSING
// ═══════════════════════════════
function processHorae(h, currentTask){
  if(!h) return;
  if(h.char_id&&G.chars[h.char_id]){
    const cs=G.chars[h.char_id];
    if(h.obsession_delta) cs.obsession=Math.max(0,Math.min(100,(cs.obsession||0)+Number(h.obsession_delta)));
    if(h.char_os) cs.os=h.char_os;
    if(h.char_status) cs.status=h.char_status;
    if(h.char_location) cs.location=h.char_location;
    renderDossier();
  }
  if(h.mood){ G.mood=h.mood; updateTopBar(); }
  if(h.gold_delta){ G.wallet=Math.max(0,(G.wallet||0)+Number(h.gold_delta)); updateTopBar(); }
  if(h.item_gained){ G.inventory.push(h.item_gained); renderBackpack(); showToast('获得：'+h.item_gained.name); }
  if(currentTask) currentTask.roundCount = (currentTask.roundCount||0) + 1;
  if(h.task_complete && currentTask && !currentTask.done){
    currentTask.done=true;
    currentTask.completionTime=Date.now();
    if(!G.todayRanking.some(r=>r.charId===currentTask.charId)){
      G.todayRanking.push({charId:currentTask.charId,completionTime:currentTask.completionTime});
    }
    const c=CHARS.find(x=>x.id===currentTask.charId);
    const cs=G.chars[currentTask.charId];
    if(cs) cs.goodFeel=(cs.goodFeel||0)+2;
    showToast(`✓ ${c?.name} 任务完成 · 好感 +2`);
    const goldReward = 30 + Math.floor(Math.random()*50);
    G.wallet += goldReward;
    updateTopBar();
    renderDossier();
    setTimeout(()=>openGoodFeel(currentTask.charId,c?.name), 1000);
    refreshCharPovTaskHeaders();
    G.currentTask = null;
    h.task_complete = false;
  }
  if(h.task_complete && currentTask && !currentTask.done){
    if((currentTask.roundCount||0) < 2) {
      console.log('[task] task_complete blocked — only '+currentTask.roundCount+' round(s)');
    } else {
      currentTask.done=true;
      currentTask.completionTime=Date.now();
      G.todayRanking.push({charId:currentTask.charId,completionTime:currentTask.completionTime});
      const c=CHARS.find(x=>x.id===currentTask.charId);
      showToast(`✓ ${c?.name} 任务完成`);
      const goldReward = 30 + Math.floor(Math.random()*50);
      G.wallet += goldReward;
      updateTopBar();
      setTimeout(()=>openGoodFeel(currentTask.charId,c?.name), 3000);
      refreshCharPovTaskHeaders();
      G.currentTask = null;
    }
  }
  if(h.social_death&&h.char_id){
    const forced = h.social_death_action || '被系统强制执行了一个社死操作';
    setTimeout(()=>triggerSocialDeath(h.char_id, forced), 300);
  }
  if(h.show_dual_view) enableDualView(!!h.show_dual_view);
  if(h.end_dual_view) enableDualView(false);
  if(h.chat_message) addChatMessage(h.chat_message.chatId,h.chat_message.text);
}
