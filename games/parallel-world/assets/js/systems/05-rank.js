// ════════════════════════════════
// RANK SYSTEM
// ════════════════════════════════
const RANKS = [
  {id:'E-1', name:'二等兵',  threshold:0},
  {id:'E-2', name:'一等兵',  threshold:20},
  {id:'E-3', name:'上等兵',  threshold:45},
  {id:'E-4', name:'下士',    threshold:75},
  {id:'E-5', name:'中士',    threshold:110},
  {id:'E-6', name:'上士',    threshold:150},
  {id:'E-7', name:'一级准尉',threshold:200},
  {id:'E-8', name:'少尉',    threshold:260},
  {id:'E-9', name:'中尉',    threshold:330},
];

function getCurrentRank(){
  let rank = RANKS[0];
  for(let i=RANKS.length-1;i>=0;i--){
    if((G.ability||0) >= RANKS[i].threshold){ rank=RANKS[i]; break; }
  }
  return rank;
}

function getNextRank(){
  const cur = getCurrentRank();
  const idx = RANKS.findIndex(r=>r.id===cur.id);
  return idx < RANKS.length-1 ? RANKS[idx+1] : null;
}

function checkRankUp(){
  if(!G.lastRankId) G.lastRankId = getCurrentRank().id;
  const newRank = getCurrentRank();
  if(newRank.id === G.lastRankId) return;

  const oldIdx = RANKS.findIndex(r=>r.id===G.lastRankId);
  const newIdx = RANKS.findIndex(r=>r.id===newRank.id);
  const prevId = G.lastRankId;
  G.lastRankId = newRank.id;
  if(!G.memoryLog) G.memoryLog=[];

  if(newIdx > oldIdx){
    // 真正的晋升才发奖金
    const bonus = 2000 * (newIdx + 1);
    G.money += bonus;
    G.memoryLog.push(`第${G.day}天：职级晋升为 ${newRank.id} ${newRank.name}`);
    showMsg(`🎖 职级晋升！${prevId} → ${newRank.id} ${newRank.name} · 奖金 ¥${bonus.toLocaleString()}`);
  } else {
    // 能力下降导致降级：不发奖金，不误报为晋升
    G.memoryLog.push(`第${G.day}天：职级下降为 ${newRank.id} ${newRank.name}`);
    showMsg(`⚠ 职级下降：${prevId} → ${newRank.id} ${newRank.name}`);
  }
}
