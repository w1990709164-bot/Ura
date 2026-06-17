// ════════════════════════════════
// MAP
// ════════════════════════════════
function toggleMapGroup(titleEl){
  const locs=titleEl.nextElementSibling;const arrow=titleEl.querySelector('.map-group-arrow');
  locs.classList.toggle('open');arrow.classList.toggle('open');
}

function updateMapUnlocks(){
  const weekend = isWeekend();
  const questActive = G.activeQuest && G.activeQuest.state === 'accepted';
  const townIds = ['map-btn-town-market','map-btn-town-street','map-btn-town-square'];
  townIds.forEach(id=>{
    const btn = document.getElementById(id);
    if(!btn) return;
    if(weekend){
      btn.classList.remove('locked');
      const locMap = {
        'map-btn-town-market': '附近小镇·集市',
        'map-btn-town-street': '附近小镇·老街',
        'map-btn-town-square': '附近小镇·街头'
      };
      const loc = locMap[id];
      btn.textContent = loc;
      btn.onclick = ()=>goLoc(btn, loc);
    } else {
      btn.classList.add('locked');
      const labels = {
        'map-btn-town-market': '附近小镇·集市（周末开放）',
        'map-btn-town-street': '附近小镇·老街（周末开放）',
        'map-btn-town-square': '附近小镇·街头（周末开放）'
      };
      btn.textContent = labels[id];
      btn.onclick = null;
    }
  });
  const missionBtn = document.getElementById('map-btn-mission');
  if(missionBtn){
    if(questActive && G.activeQuest.loc){
      missionBtn.classList.remove('locked');
      missionBtn.textContent = `▸ ${G.activeQuest.loc}`;
      missionBtn.onclick = ()=>goLoc(missionBtn, G.activeQuest.loc);
    } else {
      missionBtn.classList.add('locked');
      missionBtn.textContent = '任务地点（接取任务后开放）';
      missionBtn.onclick = null;
    }
  }
}

function renderQuestHistory(){
  const el = document.getElementById('quest-history');
  if(!el) return;
  const logs = (G.memoryLog||[]).filter(l=>l.includes('任务'));
  if(logs.length === 0){ el.textContent='暂无完成记录'; return; }
  el.innerHTML = logs.map(l=>`<div style="margin-bottom:0.2rem;">▸ ${l}</div>`).join('');
}
function goLoc(btn,loc){
  if(G.actionUsed){ showMsg('这个时间段已经行动过了，等待时间推进'); closeDrawer(); return; }
  G.currentLoc=loc;
  document.getElementById('tb-loc').textContent=loc;
  document.querySelectorAll('.map-loc').forEach(b=>b.classList.toggle('current',b===btn));
  closeDrawer();
  renderScene();
}
