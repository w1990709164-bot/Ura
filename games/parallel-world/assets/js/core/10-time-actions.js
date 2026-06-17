// ════════════════════════════════
// TIME & ACTION SYSTEM
// ════════════════════════════════
// timeIdx: 0=上午 1=中午 2=下午 3=晚上
// 上午、下午行动结束后自动触发工作
// 每个时间段只能做一次行动

const WORK_TIMES = [0, 2]; // 上午=0、下午=2 行动后触发工作

function consumeStamina(amount){
  G.stamina = Math.max(0, G.stamina - amount);
  updateStats();
  checkStamina();
}

function checkStamina(){
  const bar = document.getElementById('b-stamina');
  if(G.stamina <= 10){
    if(bar) bar.style.background='linear-gradient(90deg,#8a1a1a,#c94a4a)';
    if(G.stamina <= 0) triggerFaint();
    else showMsg('⚠ 体力告急！');
  } else {
    if(bar) bar.style.background='linear-gradient(90deg,#4a7a3a,#6aaa5a)';
  }
}

function triggerFaint(){
  // 累晕：强制推进到第二天上午
  const scene = document.getElementById('scene-area');
  const box = document.createElement('div');
  box.className='narrative';
  box.innerHTML=`<p style="color:#c94a4a;">⚠ 你因过度疲劳而晕倒了。<br><br>当你再次醒来，已经是第二天上午。体力恢复了一些，但你感到头重脚轻。</p>`;
  scene.appendChild(box);
  G.stamina = 40;
  G.mood = Math.max(0, G.mood - 10);
  G.day++;
  G.timeIdx = 0;
  G.actionUsed = false;
  setTimeout(()=>{ updateTopbar(); updateStats(); renderScene(); }, 2000);
}

async function endAction(){
  // 行动结束：标记已用，检查是否触发工作，推进时间
  G.actionUsed = true;
  closeDialogue();

  if(WORK_TIMES.includes(G.timeIdx)){
    await triggerWork();
  } else {
    advanceTime();
  }
}

async function triggerWork(){
  if(!API.key){
    // 无API时随机本地事件
    const r = Math.random();
    const scene = document.getElementById('scene-area');
    const box = document.createElement('div');
    box.className='narrative';
    if(r < 0.4){
      box.innerHTML=`<p>【工作】平静地度过了${TIMES[G.timeIdx]}的工作时间。没有什么特别的事情发生。</p>`;
      consumeStamina(10);
    } else if(r < 0.7){
      box.innerHTML=`<p>【工作】枯燥而漫长的工作时间。重复的任务让你感到疲倦。</p>`;
      consumeStamina(15);
      G.mood = Math.max(0, G.mood - 5);
      updateStats();
    } else {
      box.innerHTML=`<p>【工作】工作中发生了一点小插曲，让这个${TIMES[G.timeIdx]}没那么无聊。</p>`;
      consumeStamina(12);
    }
    scene.appendChild(box);
    scene.scrollTop = scene.scrollHeight;
    setTimeout(()=>advanceTime(), 1500);
    return;
  }

  const sysPrompt = `你是一个军事基地生活事件生成器。根据玩家的职业和当前状态，生成一个简短的工作时间事件。
玩家：${G.playerName}，职业：${G.role}，时间：${TIMES[G.timeIdx]}，第${G.day}天
三种可能结果之一随机选择：
1. 平静：普通的工作，没有特别的事
2. 枯燥：重复无聊的工作，让人疲惫
3. 小事件：发生了一件有趣或意外的小事（符合军事基地背景）

必须返回JSON：
{
  "type": "平静/枯燥/小事件",
  "desc": "事件描述（50字内，第二人称叙述）",
  "stamina_cost": 数字（10-20之间），
  "mood_delta": 数字（-10到+10，平静接近0，枯燥负数，小事件正负随机），
  "ability_delta": 数字（0-3，训练相关职业可能+1-2，其他0），
  "money_delta": 数字（0或小额，特殊事件可能有奖惩）
}`;

  const scene = document.getElementById('scene-area');
  const loadBox = document.createElement('div');
  loadBox.className='narrative';
  loadBox.innerHTML=`<p style="color:rgba(232,220,200,0.4);">【工作中…】</p>`;
  scene.appendChild(loadBox);
  scene.scrollTop = scene.scrollHeight;

  try{
    const result = await callAIJson([{role:'user',content:'生成工作事件'}], sysPrompt, 300);
    loadBox.innerHTML=`<p><span style="color:var(--gold-light);">【${TIMES[G.timeIdx]}工作 · ${result.type}】</span><br><br>${result.desc}</p>`;
    consumeStamina(result.stamina_cost||12);
    G.mood = Math.max(0, Math.min(100, G.mood + (result.mood_delta||0)));
    G.ability = Math.max(0, G.ability + (result.ability_delta||0));
    if(result.money_delta) G.money = Math.max(0, G.money + result.money_delta);
    updateStats();
  }catch(e){
    loadBox.innerHTML=`<p>【工作】度过了${TIMES[G.timeIdx]}的工作时间。</p>`;
    consumeStamina(12);
  }
  scene.scrollTop = scene.scrollHeight;
  setTimeout(()=>advanceTime(), 1800);
}

function isWeekend(){
  // Day 1 = Mon, day 6 = Sat, day 7 = Sun, day 8 = Mon...
  const dow = ((G.day - 1) % 7); // 0=Mon..4=Fri,5=Sat,6=Sun
  return dow === 5 || dow === 6;
}

function getDayOfWeek(){
  const names=['周一','周二','周三','周四','周五','周六','周日'];
  return names[((G.day-1)%7)];
}

function advanceTime(){
  G.timeIdx++;
  G.actionUsed = false;

  if(G.timeIdx > 3){
    G.timeIdx = 0;
    G.day++;
    if(G.day % 7 === 6){ payWeeklySalary(); autoSave(); } // every 7 days
    updateBountyTimer();
    // Weekend notification
    if(isWeekend()){
      const dow = getDayOfWeek();
      showMsg(`📅 ${dow} · 周末到了！附近小镇已开放`);
      if(!G.memoryLog) G.memoryLog=[];
      G.memoryLog.push(`第${G.day}天(${dow})：周末，小镇开放`);
    }
    // Check for random quest trigger
    maybeSpawnQuest();
  }

  updateTopbar();
  renderScene();
}

function payWeeklySalary(){
  const salaryMap = {'前线战士':8000,'狙击手':10000,'医疗兵':8000,'情报分析':10000,'后勤补给':5000,'心理战专家':10000};
  const salary = salaryMap[G.role] || 5000;
  G.money += salary;
  updateStats();
  showMsg(`💰 周薪到账 ¥${salary.toLocaleString()}`);
}
