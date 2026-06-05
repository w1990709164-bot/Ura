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
  if(newRank.id !== G.lastRankId){
    showMsg(`🎖 职级晋升！${G.lastRankId} → ${newRank.id} ${newRank.name}`);
    G.lastRankId = newRank.id;
    if(!G.memoryLog) G.memoryLog=[];
    G.memoryLog.push(`第${G.day}天：职级晋升为 ${newRank.id} ${newRank.name}`);
    const bonus = 2000 * (RANKS.findIndex(r=>r.id===newRank.id)+1);
    G.money += bonus;
    showMsg(`💰 晋升奖金 ¥${bonus.toLocaleString()}`);
  }
}
