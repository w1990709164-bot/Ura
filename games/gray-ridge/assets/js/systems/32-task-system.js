// ══════════════════════════════
// TASK SYSTEM
// ══════════════════════════════
const TASK_POOL = [
  {id:'t1', name:'边境巡逻', location:'灰脊外围', grade:'D', desc:'沿驻地外围执行例行巡逻，排查异常。', members:'随机两名成员', recommended:'体魄/敏捷', reward:{gold:80, statKey:'tq', statVal:1}},
  {id:'t2', name:'情报收集', location:'废墟区', grade:'C', desc:'潜入废墟区，收集附近残余势力的情报。', members:'Ghost + 随机一人', recommended:'智识/情商', reward:{gold:150, statKey:'zs', statVal:1}},
  {id:'t3', name:'物资护送', location:'补给路线', grade:'C', desc:'护送一批医疗物资安全抵达中转点。', members:'141小队', recommended:'体魄/战术', reward:{gold:200, item:{name:'急救包',desc:'使用可恢复状态',type:'use',icon:'💊',statKey:'yl',statBonus:1}}},
  {id:'t4', name:'目标狙杀', location:'山脊瞭望点', grade:'B', desc:'在指定位置对目标实施精准打击，要求极高精准度。', members:'Keegan + 你', recommended:'精准/敏捷', reward:{gold:300, statKey:'jz', statVal:2}},
  {id:'t5', name:'废墟爆破', location:'旧工业区', grade:'B', desc:'摧毁废墟中的敌方据点，需要精密的爆破方案。', members:'König + Krueger', recommended:'技术/体魄', reward:{gold:280, statKey:'js', statVal:2}},
  {id:'t6', name:'谈判斡旋', location:'中立地带', grade:'A', desc:'代表灰盟出席与邻近势力的紧急谈判，关乎协定稳定。', members:'Price + Graves + 你', recommended:'情商/智识', reward:{gold:500, statKey:'qs', statVal:2}},
  {id:'t7', name:'医疗救援', location:'前线废墟', grade:'C', desc:'前往危险区域救治受伤平民，带回医疗情报。', members:'Horangi + 你', recommended:'医疗/情商', reward:{gold:160, statKey:'yl', statVal:1}},
  {id:'t8', name:'渗透侦察', location:'敌占区', grade:'B', desc:'伪装潜入敌方控制区域，带回关键情报。', members:'Ghost + Nikto', recommended:'敏捷/智识', reward:{gold:320, statKey:'mj', statVal:2}},
  {id:'t9', name:'训练对抗', location:'训练场', grade:'D', desc:'参与跨势力训练对抗赛，检验实战能力。', members:'混编小队', recommended:'体魄/敏捷', reward:{gold:60, statKey:'tq', statVal:1}},
  {id:'t10', name:'武器回收', location:'旧战场', grade:'C', desc:'回收战场遗留武器和装备，评估作战价值。', members:'Zimo + 你', recommended:'技术/精准', reward:{gold:180, item:{name:'旧式战刀',desc:'体魄+1',type:'weapon',icon:'🗡',statKey:'tq',statBonus:1}}},
];

let currentWeekTasks = [];

function generateWeeklyTasks() {
  if (G.weeklyTaskDone) return;
  // Pick 2 tasks of different grades
  const shuffled = [...TASK_POOL].sort(()=>Math.random()-0.5);
  currentWeekTasks = [shuffled[0], shuffled.find(t=>t.grade!==shuffled[0].grade)||shuffled[1]];
  openTaskOverlay(currentWeekTasks);
}

function openTaskOverlay(tasks) {
  const wrap = document.getElementById('task-cards');
  const gradeClass = {D:'grade-d',C:'grade-c',B:'grade-b',A:'grade-a'};
  wrap.innerHTML = tasks.map(t=>`
    <div class="task-card">
      <div class="task-card-name">${t.name}</div>
      <div class="task-card-meta">
        <span class="task-card-tag ${gradeClass[t.grade]||'grade-d'}">${t.grade}级</span>
        <span class="task-card-tag" style="color:var(--sand);border-color:var(--sand-dim)">📍 ${t.location}</span>
      </div>
      <div class="task-card-desc">${t.desc}</div>
      <div class="task-card-members" style="font-family:var(--hud);font-size:10px;color:var(--sand);letter-spacing:1px;margin-bottom:4px">👥 ${t.members}</div>
      <div class="task-card-rec" style="font-family:var(--hud);font-size:10px;color:var(--text3);letter-spacing:0.5px;margin-bottom:12px">推荐属性：${t.recommended}</div>
      <div style="font-family:var(--hud);font-size:10px;color:var(--gold);margin-bottom:12px">
        报酬：${t.reward.gold ? '🪙 ' + t.reward.gold : ''}
        ${t.reward.statKey ? ' · ' + (STATS_DEF.find(s=>s.key===t.reward.statKey)?.name||'') + ' +' + t.reward.statVal : ''}
        ${t.reward.item ? ' · 道具：' + t.reward.item.name : ''}
      </div>
      <div class="task-card-actions">
        <button class="task-card-btn cancel" onclick="closeTaskOverlay()">放弃</button>
        <button class="task-card-btn confirm" onclick="acceptTask('${t.id}')">接取任务</button>
      </div>
    </div>`).join('');
  document.getElementById('task-overlay').style.display = 'flex';
}

function acceptTask(taskId) {
  closeTaskOverlay();
  const task = TASK_POOL.find(t=>t.id===taskId);
  if (!task) return;
  G.currentTask = task;
  G.weeklyTaskDone = true;
  saveGame();

  addSysMsg('任务接取：' + task.name, `等级：${task.grade}级
地点：${task.location}
成员：${task.members}`);
  const statValues = task.recommended.split('/').map(s=>{
    const def = STATS_DEF.find(x=>x.name===s.trim());
    return def ? s.trim()+'('+G.stats[def.key]+')' : s.trim();
  }).join('/');
  G.history.push({role:'user', content:'[任务开始·第一段：'+task.name+'，等级'+task.grade+'，地点'+task.location+'，成员'+task.members+'。玩家推荐属性：'+statValues+'。现在描述出发前的准备场景，体现队友的兽化特征和各自性格，给出2-3个玩家选择。注意：这是三段式任务的第一段，不要在这一轮触发骰子检定，也不要结束任务。]'});
  callAI();
}

function closeTaskOverlay() {
  document.getElementById('task-overlay').style.display = 'none';
}

function collectTaskReward(task) {
  if (!task) return;
  if (task.reward.gold) {
    G.wallet += task.reward.gold;
    showToast('🪙 +' + task.reward.gold);
  }
  if (task.reward.statKey) {
    G.stats[task.reward.statKey] = (G.stats[task.reward.statKey]||0) + (task.reward.statVal||1);
    showToast((STATS_DEF.find(s=>s.key===task.reward.statKey)?.name||'') + ' +' + task.reward.statVal);
  }
  if (task.reward.item) {
    G.inventory.push(task.reward.item);
    showToast('获得道具：' + task.reward.item.name);
  }
  updateTopBar(); updateStatsBar(); renderStatus(); saveGame();
  G.currentTask = null;
}
