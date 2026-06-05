// ═══════════════════════════════
// TOP BAR
// ═══════════════════════════════
function updateTopBar() {
  const months=['一','二','三','四','五','六','七','八','九','十','十一','十二'];
  document.getElementById('tb-date').textContent = `${G.year}年${months[G.month-1]}月${G.day}日`;
  document.getElementById('tb-day-num').textContent = `第${G.totalDay||1}天 · ${PHASE_LABELS[G.phase]||''}`;
  document.getElementById('tb-mood').textContent = G.mood;
  document.getElementById('tb-wallet').textContent = (G.wallet||0).toLocaleString();
  // Phase bar
  PHASES.forEach(p=>{
    const el=document.getElementById('ph-'+p);
    if(el) el.classList.toggle('active', p===G.phase);
  });
  // Action bar next btn
  const nextBtn = document.getElementById('ab-next');
  if(nextBtn){
    if(G.phase==='morning') nextBtn.textContent='进入白天';
    else if(G.phase==='midday') {
      const pending = G.dailyTasks?.filter(t=>!t.done) || [];
      nextBtn.textContent = pending.length > 0
        ? `触发下一事件 (${pending.length})`
        : '进入傍晚';
    }
    else nextBtn.textContent='结束今天';
  }
}
