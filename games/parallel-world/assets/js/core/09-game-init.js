// ════════════════════════════════
// GAME INIT
// ════════════════════════════════
function initGame(){
  G.actionUsed = G.actionUsed || false;
  G.dialogueRound = 0;
  G.memoryLog = G.memoryLog || [];
  G.completedQuests = G.completedQuests || [];
  G.lastRankId = G.lastRankId || getCurrentRank().id;
  if(!G.saves) G.saves=[null,null,null];
  assignCharLocations();
  updateTopbar();
  buildDossier();
  buildSaveSlots();
  document.getElementById('p-name').textContent=G.playerName||'—';
  document.getElementById('p-role').textContent=G.role||'—';
  updateStats();
  if(G.activeBounty){
    document.getElementById('bounty-active-wrap').style.display='block';
    document.getElementById('bounty-active-title').textContent=G.activeBounty.data?.title||'';
    document.getElementById('bounty-active-reward').textContent=`¥${(G.activeBounty.data?.reward||0).toLocaleString()}`;
    updateBountyTimer();
  }
  renderScene();
}

function getDate(){
  const d=new Date(2030,8,1);d.setDate(d.getDate()+G.day-1);
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

function updateTopbar(){
  document.getElementById('tb-datetime').textContent=`${getDate()} ${getDayOfWeek()} · ${TIMES[G.timeIdx]}`;
  document.getElementById('tb-loc').textContent=G.currentLoc;
  document.getElementById('loc-time').textContent=TIMES[G.timeIdx];
  if(G.currentChar&&G.chars[G.currentChar]){
    const c=G.chars[G.currentChar];
    document.getElementById('tb-charname').textContent=c.name;
    document.getElementById('tb-charemo').textContent=c.mood;
  }
}

function updateStats(){
  document.getElementById('p-money').textContent=`¥ ${G.money.toLocaleString()}`;
  document.getElementById('v-stamina').textContent=`${G.stamina}/100`;
  document.getElementById('b-stamina').style.width=G.stamina+'%';
  document.getElementById('v-ability').textContent=G.ability;
  document.getElementById('b-ability').style.width=Math.min(G.ability,100)+'%';
  document.getElementById('v-mood').textContent=`${G.mood}/100`;
  document.getElementById('b-mood').style.width=G.mood+'%';
  // Update rank display
  const cur = getCurrentRank();
  const next = getNextRank();
  const rankEl = document.getElementById('p-rank');
  const rankBarEl = document.getElementById('b-rank');
  if(rankEl){
    if(next){
      rankEl.textContent=`${cur.id} ${cur.name} → ${next.id}`;
    } else {
      rankEl.textContent=`${cur.id} ${cur.name} ★ 最高级`;
    }
  }
  if(rankBarEl && next){
    const pct = Math.min(100, Math.round(((G.ability - cur.threshold)/(next.threshold - cur.threshold))*100));
    rankBarEl.style.width = pct+'%';
  } else if(rankBarEl){
    rankBarEl.style.width='100%';
  }
  checkRankUp();
}
