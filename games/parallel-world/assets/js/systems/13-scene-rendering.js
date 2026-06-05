// ════════════════════════════════
// SCENE RENDERING
// ════════════════════════════════
// 地点专属行动配置
const LOC_ACTIONS = {
  '食堂 A': [
    {label:'点餐（¥80）', icon:'🍱', fn:()=>doEat(80,25,10,'食堂A的饭菜丰盛，你吃得很满足。')},
  ],
  '食堂 B': [
    {label:'点餐（¥20）', icon:'🥢', fn:()=>doEat(20,15,5,'食堂B的饭菜简单实惠，填饱了肚子。')},
  ],
  '训练场': [
    {label:'力量训练', icon:'💪', fn:()=>doTrain('力量训练','消耗了大量体力，但感觉肌肉在生长。',18,3,0)},
    {label:'体能训练', icon:'🏃', fn:()=>doTrain('体能训练','高强度的有氧训练，让你大汗淋漓。',15,2,0)},
  ],
  '靶场': [
    {label:'射击训练', icon:'🎯', fn:()=>doTrain('射击训练','一发发子弹射出，精准度在慢慢提升。',12,2,0)},
  ],
  '跑道': [
    {label:'晨跑', icon:'🌅', fn:()=>doTrain('晨跑','清晨的风吹过，跑完之后神清气爽。',10,1,5)},
  ],
  '医务室': [
    {label:'休息恢复（¥50）', icon:'✚', fn:()=>doRest(50,30,5)},
    {label:'免费休息', icon:'🛏', fn:()=>doRest(0,15,0)},
  ],
  '娱乐室': [
    {label:'放松娱乐', icon:'🎮', fn:()=>doRelax()},
  ],
  'E区·我的宿舍': [
    {label:'小憩', icon:'💤', fn:()=>doNap()},
    {label:'结束今天，睡觉', icon:'🌙', fn:()=>doSleep()},
  ],
  '附近小镇·集市': [
    {label:'逛集市（购物）', icon:'🛒', fn:()=>doTownShop()},
    {label:'小吃摊（¥30）', icon:'🍜', fn:()=>doEat(30,20,12,'在集市小吃摊吃了一顿热腾腾的饭，人间烟火气让心情大好。')},
  ],
  '附近小镇·老街': [
    {label:'逛书店咖啡馆', icon:'☕', fn:()=>doTownCafe()},
    {label:'散步发呆', icon:'🚶', fn:()=>doTownWalk()},
  ],
  '附近小镇·街头': [
    {label:'随便逛逛', icon:'🌆', fn:()=>doTownWalk()},
    {label:'街头小吃（¥15）', icon:'🍡', fn:()=>doEat(15,10,8,'街头小吃便宜又美味，简单的快乐。')},
  ],
};

// 每个角色的常驻地点权重表（时间段影响概率）
const CHAR_LOC_WEIGHTS = {
  Ghost:   ['A区·TF141','靶场','公共休息区','走廊','简报室'],
  Keegan:  ['靶场','B区·Ghosts','跑道','后山演练区','武器库'],
  Krueger: ['娱乐室','C区·Chimera','食堂 B','公共休息区','靶场'],
  König:   ['D区·KorTac','训练场','医务室','公共休息区','跑道'],
  Nikto:   ['D区·KorTac','走廊','靶场','后山演练区','停机坪'],
  Zimo:    ['公共休息区','食堂 A','食堂 B','情报室','娱乐室'],
  Riley:   ['B区·Ghosts','跑道','后山演练区','公共休息区','停机坪'],
};

// 每天重新分配角色位置（天数变化时调用）
function assignCharLocations(){
  // 用day作为随机种子，保证同一天位置固定
  const seed = G.day * 137 + G.timeIdx * 31;
  const rng = (n) => { return ((seed * (n+1) * 1103515245 + 12345) & 0x7fffffff) % 100; };
  Object.keys(G.chars).forEach((k,idx)=>{
    const locs = CHAR_LOC_WEIGHTS[k] || ['公共休息区'];
    const r = rng(idx) % locs.length;
    G.chars[k].loc = locs[r];
  });
}

function getCharsAtLoc(loc){
  return Object.keys(G.chars).filter(k => G.chars[k].loc === loc);
}

function renderScene(){
  const loc = G.currentLoc;
  document.getElementById('loc-name').textContent = loc;
  document.getElementById('loc-desc').textContent = LOC_DESCS[loc]||'';
  document.getElementById('loc-time').textContent = TIMES[G.timeIdx];

  // 每次进新地点/推进时间时重新分配位置
  assignCharLocations();

  const scene = document.getElementById('scene-area');
  const header = scene.querySelector('.loc-header');
  scene.innerHTML='';
  if(header) scene.appendChild(header);

  const timeBox = document.createElement('div');
  timeBox.className='narrative';
  timeBox.id='opening-narrative';
  let timeNote = '';
  if(G.timeIdx === 3) timeNote = '<br><span style="color:rgba(232,220,200,0.4);font-size:0.8rem;">晚上了。你可以继续活动，或者去宿舍睡觉。</span>';
  const weekendNote = isWeekend() ? '<br><span style="color:var(--gold-light);font-family:\'Special Elite\',cursive;font-size:0.72rem;">📅 '+getDayOfWeek()+' · 周末 · 附近小镇已开放</span>' : '';
  timeBox.innerHTML=`<p>${getDate()} · <strong style="color:var(--gold-light)">${TIMES[G.timeIdx]}</strong>${weekendNote}<br>${LOC_DESCS[loc]||''}${timeNote}</p>`;
  scene.appendChild(timeBox);

  if(G.actionUsed){
    const usedBox = document.createElement('div');
    usedBox.className='narrative';
    usedBox.innerHTML=`<p style="color:rgba(232,220,200,0.4);">这个时间段的行动已结束。等待时间推进中…</p>`;
    scene.appendChild(usedBox);
    return;
  }

  const enc = document.createElement('div');
  enc.id='encounter-list';
  enc.className='encounter-list';

  // 地点专属行动
  const locActs = LOC_ACTIONS[loc] || [];
  locActs.forEach(act=>{
    const btn = document.createElement('div');
    btn.className='encounter-chip';
    btn.textContent=`${act.icon} ${act.label}`;
    btn.onclick=()=>{ if(!G.actionUsed) act.fn(); };
    enc.appendChild(btn);
  });

  // 当前在这个地点的角色（固定分配，不随机）
  const charsHere = getCharsAtLoc(loc);
  if(charsHere.length > 0){
    charsHere.forEach(k=>{
      const c=G.chars[k];
      const btn=document.createElement('div');
      btn.className='encounter-chip';
      btn.textContent=`${c.name} ${c.mood} ${c.status}`;
      btn.onclick=()=>{ if(!G.actionUsed) openDialogue(k); };
      enc.appendChild(btn);
    });
  } else if(locActs.length === 0){
    // 空地点
    const empty = document.createElement('div');
    empty.style.cssText='font-family:IM Fell English,serif;font-style:italic;font-size:0.78rem;color:rgba(232,220,200,0.3);padding:0.5rem;';
    empty.textContent='这里没有人。';
    enc.appendChild(empty);
  }

  scene.appendChild(enc);

  // Show active quest notice if exists
  if(G.activeQuest && G.activeQuest.state !== 'done'){
    const qBox = document.createElement('div');
    qBox.className='narrative';
    qBox.style.cssText='border-left:2px solid #4a8aba;cursor:pointer;';
    const q = G.activeQuest;
    const stateLabel = q.state==='available'?'可接取':'进行中';
    qBox.innerHTML=`<p><span style="color:#4a8aba;font-family:'Special Elite',cursive;font-size:0.65rem;letter-spacing:0.1em;">📋 任务·${stateLabel}：${q.title}</span><br><span style="font-size:0.75rem;color:rgba(232,220,200,0.5);">目标地点：${q.loc}　奖励：¥${q.reward}</span>${q.state==='available'?'<br><span style="color:var(--gold);font-size:0.68rem;">→ 打开任务面板接取</span>':''}</p>`;
    qBox.onclick = ()=>{ openDrawer(); const qtab=document.querySelector('.dtab:nth-child(6)'); if(qtab) switchTab('quest',qtab); };
    scene.appendChild(qBox);
  }

  scene.scrollTop = scene.scrollHeight;
}

// 地点行动：吃饭
function doEat(cost, staminaGain, moodGain, desc){
  if(G.money < cost){ showMsg('余额不足'); return; }
  G.money -= cost;
  G.stamina = Math.min(100, G.stamina + staminaGain);
  G.mood = Math.min(100, G.mood + moodGain);
  updateStats();
  addSceneNarrative(`【${cost>0?'花费¥'+cost+'，':''}${desc}】\n体力 +${staminaGain}，情绪 +${moodGain}`);
  endAction();
}

// 地点行动：训练
function doTrain(name, desc, staminaCost, abilityGain, moodGain){
  consumeStamina(staminaCost);
  G.ability += abilityGain;
  G.mood = Math.min(100, G.mood + moodGain);
  updateStats();
  addSceneNarrative(`【${name}】${desc}\n能力 +${abilityGain}，体力 -${staminaCost}`);
  endAction();
}

// 地点行动：医务室休息
function doRest(cost, staminaGain, moodGain){
  if(cost > 0 && G.money < cost){ showMsg('余额不足，使用免费床位'); cost=0; staminaGain=15; }
  if(cost > 0) G.money -= cost;
  G.stamina = Math.min(100, G.stamina + staminaGain);
  G.mood = Math.min(100, G.mood + moodGain);
  updateStats();
  addSceneNarrative(`【医务室休息】在医务室躺了一会儿，好多了。\n体力 +${staminaGain}`);
  endAction();
}

// 地点行动：娱乐放松
function doRelax(){
  consumeStamina(5);
  G.mood = Math.min(100, G.mood + 15);
  updateStats();
  addSceneNarrative('【娱乐室】打了会儿台球，看了段旧录像，情绪放松了不少。\n情绪 +15，体力 -5');
  endAction();
}

// 地点行动：小憩
function doNap(){
  consumeStamina(0);
  G.stamina = Math.min(100, G.stamina + 20);
  updateStats();
  addSceneNarrative('【小憩】在宿舍躺了一会儿，恢复了一些体力。\n体力 +20');
  endAction();
}

// 地点行动：睡觉（晚上专属，直接到第二天）
function doSleep(){
  G.stamina = Math.min(100, G.stamina + 40);
  G.mood = Math.min(100, G.mood + 10);
  updateStats();
  addSceneNarrative('【睡觉】你躺下来，很快沉入了梦乡。\n体力 +40，情绪 +10');
  G.timeIdx = 3; // 让advanceTime推到第二天
  G.actionUsed = true;
  setTimeout(()=>advanceTime(), 1500);
}

function doTownShop(){
  const cost = 100 + Math.floor(Math.random()*200);
  if(G.money < cost){ showMsg('余额不足'); return; }
  G.money -= cost;
  G.mood = Math.min(100, G.mood+12);
  updateStats();
  if(!G.memoryLog) G.memoryLog=[];
  G.memoryLog.push(`第${G.day}天：在附近小镇集市购物，花费¥${cost}`);
  addSceneNarrative(`【集市购物】在集市里淘到了一些东西，花了¥${cost}，但心情很好。\n情绪 +12，余额 -¥${cost}`);
  endAction();
}

function doTownCafe(){
  const cost = 45;
  G.money -= cost;
  G.stamina = Math.min(100, G.stamina+10);
  G.mood = Math.min(100, G.mood+18);
  updateStats();
  if(!G.memoryLog) G.memoryLog=[];
  G.memoryLog.push(`第${G.day}天：在老街咖啡馆放松，花费¥${cost}`);
  addSceneNarrative(`【书店咖啡馆】安静的角落，一杯咖啡，一本随手翻开的书。很久没有这么放松了。\n情绪 +18，体力 +10，余额 -¥${cost}`);
  endAction();
}

function doTownWalk(){
  G.mood = Math.min(100, G.mood+10);
  G.stamina = Math.max(0, G.stamina-5);
  updateStats();
  addSceneNarrative('【在镇上闲逛】不带任何任务地漫步，看普通人的日常，感觉久违的平静。\n情绪 +10');
  endAction();
}

function addSceneNarrative(text){
  const scene = document.getElementById('scene-area');
  const box = document.createElement('div');
  box.className='narrative';
  box.innerHTML=`<p>${text.replace(/\n/g,'<br>')}</p>`;
  scene.appendChild(box);
  scene.scrollTop = scene.scrollHeight;
}
