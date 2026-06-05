// ════════════════════════════════
// QUEST SYSTEM
// ════════════════════════════════
const QUEST_POOL = [
  {id:'q_medicine', title:'紧急药品补给', desc:'医务室药品告急，需要从小镇药店购入应急物资。', loc:'附近小镇·集市', reward:1500, abilityReward:3, reqDay:3, reqWeekend:true, tags:['任务','采购']},
  {id:'q_intel', title:'情报核验任务', desc:'情报室接到线报，需前往小镇某处接头核实。', loc:'附近小镇·老街', reward:2500, abilityReward:5, reqDay:5, reqWeekend:false, tags:['任务','情报']},
  {id:'q_training', title:'协助新兵训练', desc:'训练场人手不足，需要协助带领新一批士兵。', loc:'训练场', reward:1000, abilityReward:4, reqDay:2, reqWeekend:false, tags:['训练']},
  {id:'q_escort', title:'物资护送任务', desc:'一批重要物资需要从停机坪护送到武器库。', loc:'停机坪', reward:2000, abilityReward:3, reqDay:4, reqWeekend:false, tags:['任务','护送']},
  {id:'q_town_recon', title:'小镇侦察行动', desc:'周末特别行动，对附近小镇进行低调侦察，收集情报。', loc:'附近小镇·街头', reward:3000, abilityReward:6, reqDay:7, reqWeekend:true, tags:['任务','侦察']},
  {id:'q_lost_item', title:'寻找失踪物品', desc:'档案室一份重要文件失踪，需要在基地各处查找。', loc:'档案室', reward:800, abilityReward:2, reqDay:1, reqWeekend:false, tags:['调查']},
];

function maybeSpawnQuest(){
  if(!G.activeQuest && Math.random() < 0.35){
    // Filter eligible quests
    const eligible = QUEST_POOL.filter(q=>{
      if(G.completedQuests && G.completedQuests.includes(q.id)) return false;
      if(q.reqWeekend && !isWeekend()) return false;
      if(G.day < q.reqDay) return false;
      return true;
    });
    if(eligible.length > 0){
      const q = eligible[Math.floor(Math.random()*eligible.length)];
      G.activeQuest = {...q, spawnedDay:G.day, state:'available'};
      setTimeout(()=>{
        showMsg(`📋 新任务：${q.title}`);
        renderQuestNotice();
      }, 1200);
    }
  }
}

function renderQuestNotice(){
  if(!G.activeQuest) return;
  const scene = document.getElementById('scene-area');
  // remove old notice
  const old = document.getElementById('quest-notice');
  if(old) old.remove();
  const q = G.activeQuest;
  const box = document.createElement('div');
  box.id = 'quest-notice';
  box.className = 'narrative';
  box.style.cssText='border-left:2px solid #4a8aba;';
  box.innerHTML=`<p><span style="color:#4a8aba;font-family:'Special Elite',cursive;letter-spacing:0.15em;">📋 新任务 · ${q.title}</span><br><br>${q.desc}<br><br><span style="color:var(--gold);">前往：${q.loc}　奖励：¥${q.reward.toLocaleString()} + 能力+${q.abilityReward}</span></p>`;
  scene.appendChild(box);
  scene.scrollTop = scene.scrollHeight;
}

async function acceptQuest(){
  if(!G.activeQuest){ showMsg('没有可接取的任务'); return; }
  G.activeQuest.state = 'accepted';
  showMsg(`✓ 任务已接取：${G.activeQuest.title}`);
  if(!G.memoryLog) G.memoryLog=[];
  G.memoryLog.push(`第${G.day}天：接取任务「${G.activeQuest.title}」`);
  renderQuestPanel();
}

async function completeQuest(){
  if(!G.activeQuest || G.activeQuest.state !== 'accepted'){ showMsg('没有进行中的任务'); return; }
  const q = G.activeQuest;
  // Check if player is at correct location
  if(G.currentLoc !== q.loc && !q.loc.includes('基地')){
    showMsg(`请前往：${q.loc}`);
    return;
  }
  if(!API.key){
    // offline mode
    G.money += q.reward;
    G.ability += q.abilityReward;
    G.mood = Math.min(100,G.mood+10);
    updateStats();
    if(!G.completedQuests) G.completedQuests=[];
    G.completedQuests.push(q.id);
    if(!G.memoryLog) G.memoryLog=[];
    G.memoryLog.push(`第${G.day}天：完成任务「${q.title}」获得¥${q.reward}`);
    G.activeQuest = null;
    showMsg(`✓ 任务完成！+¥${q.reward.toLocaleString()} 能力+${q.abilityReward}`);
    renderQuestPanel();
    renderScene();
    return;
  }
  const sysPrompt=`你是一个军事基地任务结算生成器。根据任务情况生成一段简短的完成叙事（50字内，第二人称）。
返回JSON：{"narrative":"任务完成叙事","mood_delta":数字(5-15)}`;
  try{
    const res = await callAIJson([{role:'user',content:`任务：${q.title}\n内容：${q.desc}`}],sysPrompt,200);
    addSceneNarrative(`【任务完成 · ${q.title}】\n${res.narrative||'任务顺利完成。'}\n\n+¥${q.reward.toLocaleString()}　能力 +${q.abilityReward}`);
    G.money += q.reward;
    G.ability += q.abilityReward;
    G.mood = Math.min(100,G.mood+(res.mood_delta||8));
    updateStats();
    if(!G.completedQuests) G.completedQuests=[];
    G.completedQuests.push(q.id);
    if(!G.memoryLog) G.memoryLog=[];
    G.memoryLog.push(`第${G.day}天：完成任务「${q.title}」`);
    G.activeQuest = null;
    renderQuestPanel();
  }catch(e){
    // fallback
    G.money += q.reward;
    G.ability += q.abilityReward;
    updateStats();
    if(!G.completedQuests) G.completedQuests=[];
    G.completedQuests.push(q.id);
    G.activeQuest = null;
    showMsg(`✓ 任务完成！`);
    renderQuestPanel();
  }
}

function renderQuestPanel(){
  const q = G.activeQuest;
  const panelEl = document.getElementById('quest-panel-content');
  if(!panelEl) return;
  if(!q){
    panelEl.innerHTML=`<div style="font-family:'IM Fell English',serif;font-style:italic;font-size:0.7rem;color:rgba(232,220,200,0.3);text-align:center;padding:1rem;">暂无任务</div>`;
    return;
  }
  const stateLabel = {available:'可接取',accepted:'进行中',done:'已完成'}[q.state]||q.state;
  panelEl.innerHTML=`
    <div style="border:1px solid rgba(74,138,186,0.3);padding:0.7rem 0.85rem;background:rgba(74,138,186,0.05);">
      <div style="font-family:'Special Elite',cursive;font-size:0.5rem;letter-spacing:0.15em;color:#4a8aba;margin-bottom:0.3rem;">📋 ${stateLabel}</div>
      <div style="font-family:'Courier Prime',monospace;font-size:0.75rem;color:var(--parchment);margin-bottom:0.4rem;line-height:1.4;">${q.title}</div>
      <div style="font-family:'IM Fell English',serif;font-style:italic;font-size:0.68rem;color:rgba(232,220,200,0.5);margin-bottom:0.5rem;line-height:1.4;">${q.desc}</div>
      <div style="font-family:'Special Elite',cursive;font-size:0.52rem;color:var(--gold);margin-bottom:0.5rem;">前往：${q.loc}</div>
      <div style="font-family:'Special Elite',cursive;font-size:0.52rem;color:rgba(232,220,200,0.4);margin-bottom:0.6rem;">奖励：¥${q.reward.toLocaleString()} + 能力+${q.abilityReward}</div>
      <div style="display:flex;gap:0.4rem;">
        ${q.state==='available'?`<button onclick="acceptQuest()" class="forum-act-btn" style="flex:1;">接取任务</button>`:''}
        ${q.state==='accepted'?`<button onclick="completeQuest()" class="forum-act-btn" style="flex:1;border-color:rgba(106,170,90,0.4);color:#6aaa5a;">完成任务</button>`:''}
      </div>
    </div>`;
}
