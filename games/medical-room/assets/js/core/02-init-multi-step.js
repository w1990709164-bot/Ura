// ══════════════════════════════
// INIT MULTI-STEP
// ══════════════════════════════
const TEST_QUESTIONS = [
  {
    q:'执行任务时你更倾向于？',
    opts:['独自潜入，绝对安静','带队冲锋，身先士卒','远距离支援，掌控全局','灵活应变，见机行事'],
    tags:['solo','leader','support','adapt']
  },
  {
    q:'面对受伤的战友，你的第一反应？',
    opts:['迅速评估伤情，制定撤离方案','挡在他前面，继续战斗','蹲下来陪着他，直到支援到来','想办法让他自己撑住'],
    tags:['analyze','protect','empathy','tough']
  },
  {
    q:'深夜无法入睡时，你在想什么？',
    opts:['明天的任务细节','那些没能带回来的人','什么都不想，就是睡不着','某个很久以前的地方'],
    tags:['mission','loss','numb','memory']
  },
  {
    q:'哨兵精神崩溃时，你会？',
    opts:['保持距离，等他自己稳定','靠近他，不说话只是在场','用专业术语引导他集中注意','直接抓住他的手'],
    tags:['distance','presence','logic','touch']
  },
  {
    q:'你觉得自己最像哪种存在？',
    opts:['守夜的人，永远在边界上','河流，一直往前走','深处的光，不一定能被看见','地基，不显眼但承载一切'],
    tags:['sentinel','flow','depth','foundation']
  },
];

// Spirit pool: [name, emoji, description, tags]
const SPIRIT_POOL = [
  {name:'雪鸮',emoji:'🦉',desc:'沉默的守夜者，在最暗处看得最清楚',tags:['sentinel','distance','numb']},
  {name:'白鼬',emoji:'🐾',desc:'灵动敏锐，在缝隙间穿行，比看起来危险得多',tags:['adapt','solo','analyze']},
  {name:'白鹿',emoji:'🦌',desc:'温柔而敏感，能感知他人无法察觉的细微震动',tags:['empathy','presence','depth']},
  {name:'灰鹤',emoji:'🦢',desc:'优雅而坚韧，跨越漫长距离也不会迷失方向',tags:['flow','support','memory']},
  {name:'黑猫',emoji:'🐈‍⬛',desc:'无声，任性，只在它想出现的时候出现',tags:['solo','sentinel','distance']},
  {name:'翠鸟',emoji:'🐦',desc:'精准迅捷，总能找到混乱中的那条清流',tags:['analyze','logic','mission']},
  {name:'北极狐',emoji:'🦊',desc:'在极寒中依然温暖，用沉默保护最脆弱的东西',tags:['foundation','touch','loss']},
  {name:'玳瑁水母',emoji:'🪼',desc:'透明而危险，漂浮在深处，美得让人忘记靠近的代价',tags:['depth','solo','numb']},
  {name:'月熊',emoji:'🐻',desc:'厚重而温柔，胸口有月牙，守护着某种古老的东西',tags:['foundation','protect','loss']},
  {name:'雪豹',emoji:'🐆',desc:'稀有而孤独，出现本身就是一种奇迹',tags:['solo','sentinel','memory']},
  {name:'渡鸦',emoji:'🪶',desc:'记忆的守护者，知道很多无法说出口的事',tags:['memory','depth','loss']},
  {name:'戴胜',emoji:'🐦',desc:'忠诚与归途，头冠展开时是某种古老的仪式感',tags:['foundation','flow','mission']},
];

let testAnswers = [];
let currentQ = 0;
let selectedSpirit = null;

function goToStep2() {
  const name = document.getElementById('init-name').value.trim();
  const key  = document.getElementById('init-key').value.trim();
  if (!name || !key) {
    document.getElementById('init-err').style.display = 'block';
    return;
  }
  document.getElementById('init-step1').style.display = 'none';
  document.getElementById('init-step2').style.display = 'block';
  testAnswers = [];
  currentQ = 0;
  renderQuestion();
}

function renderQuestion() {
  const q = TEST_QUESTIONS[currentQ];
  document.getElementById('test-progress').textContent = `${currentQ+1} / ${TEST_QUESTIONS.length}`;
  document.getElementById('test-questions').innerHTML = `
    <div style="font-family:var(--serif);font-size:14px;color:var(--white);line-height:1.8;margin-bottom:14px;padding:12px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px">
      ${q.q}
    </div>
    ${q.opts.map((opt,i)=>`
      <button onclick="answerQuestion(${i})" style="
        width:100%;text-align:left;background:var(--bg3);border:1px solid var(--border);
        border-radius:6px;padding:10px 14px;font-family:var(--serif);font-size:13px;
        color:var(--text);cursor:pointer;margin-bottom:8px;line-height:1.6;
        display:flex;gap:10px;align-items:flex-start;transition:all 0.2s
      " onmousedown="this.style.borderColor='var(--cyan)';this.style.background='var(--cyan-glow)'">
        <span style="font-family:var(--mono);font-size:10px;color:var(--cyan);flex-shrink:0;margin-top:2px">${String.fromCharCode(65+i)}</span>
        ${opt}
      </button>
    `).join('')}
  `;
}

function answerQuestion(idx) {
  testAnswers.push(TEST_QUESTIONS[currentQ].tags[idx]);
  currentQ++;
  if (currentQ >= TEST_QUESTIONS.length) {
    showSpiritResult();
  } else {
    renderQuestion();
  }
}

function showSpiritResult() {
  // Score tags
  const tagScore = {};
  testAnswers.forEach(t=>{ tagScore[t]=(tagScore[t]||0)+1; });
  // Find best matching spirit
  const scored = SPIRIT_POOL.map(s=>{
    const score = s.tags.reduce((sum,t)=>sum+(tagScore[t]||0),0) + Math.random()*0.5;
    return {...s, score};
  });
  scored.sort((a,b)=>b.score-a.score);
  // Pick from top 3 randomly for surprise
  selectedSpirit = scored[Math.floor(Math.random()*Math.min(3,scored.length))];

  document.getElementById('init-step2').style.display = 'none';
  document.getElementById('init-step3').style.display = 'block';

  document.getElementById('spirit-result').innerHTML = `
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:48px;margin-bottom:8px">${selectedSpirit.emoji}</div>
      <div style="font-family:var(--orb);font-size:18px;font-weight:700;color:var(--cyan);letter-spacing:2px;margin-bottom:6px">${selectedSpirit.name}</div>
      <div style="font-family:var(--serif);font-size:13px;color:var(--text2);line-height:1.7;font-style:italic">${selectedSpirit.desc}</div>
    </div>
    <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-align:center;letter-spacing:1px">— 精神体已觉醒 —</div>
  `;
}

function refreshSpirit() {
  const idx = Math.floor(Math.random()*SPIRIT_POOL.length);
  selectedSpirit = SPIRIT_POOL[idx];
  document.getElementById('spirit-result').innerHTML = `
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:48px;margin-bottom:8px">${selectedSpirit.emoji}</div>
      <div style="font-family:var(--orb);font-size:18px;font-weight:700;color:var(--cyan);letter-spacing:2px;margin-bottom:6px">${selectedSpirit.name}</div>
      <div style="font-family:var(--serif);font-size:13px;color:var(--text2);line-height:1.7;font-style:italic">${selectedSpirit.desc}</div>
    </div>
    <div style="font-family:var(--mono);font-size:10px;color:var(--text3);text-align:center;letter-spacing:1px">— 精神体已觉醒 —</div>
  `;
}

function finishInit() {
  G.player.name        = document.getElementById('init-name').value.trim();
  G.player.age         = document.getElementById('init-age').value.trim();
  G.player.gender      = document.getElementById('init-gender').value.trim();
  G.player.appear      = document.getElementById('init-appear').value.trim();
  G.player.personality = document.getElementById('init-personality').value.trim();
  G.player.spirit      = selectedSpirit;
  G.player.landscape   = document.getElementById('init-landscape-name').value.trim() || '待探索';
  G.player.landscapeDesc = document.getElementById('init-landscape-desc').value.trim() || '';
  G.apiKey             = document.getElementById('init-key').value.trim();
  G.apiEndpoint        = document.getElementById('init-endpoint').value.trim();
  G.apiModel           = document.getElementById('init-model').value.trim();

  document.getElementById('init-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('send-btn').disabled = false;

  CHARS.forEach(c => {
    const defaultLocs = {keegan:'待命',ghost:'巡逻中',soap:'休息中',gaz:'待命',price:'任务中',hesh:'休息中',logan:'休息中',merrick:'简报中',konig:'走廊等候',horangi:'休息中',nikto:'未知',krueger:'任务待命',zimo:'任务中',graves:'商务会议'};
    G.patients[c.id] = {
      mental:50, trust:0, stress:70, heat:0,
      trustPhase: 0,    // current phase (0-9)
      trustAccum: 0,    // accumulated points in current phase
      tags:['初次接触'],
      injury:'',
      lastVisit:'—',
      visitCount:0,
      location: defaultLocs[c.id] || '待命',
      landscapeEntered: false,
      spiritContact: false,
      landscapeStatus: '',
      spiritStatus: '',
      spiritLoc: '',
      landscapeAnomaly: '',
      memory: {
        summary: '尚未接触',
        keyEvents: [],
        doctorNote: '',
        lastUpdated: null,
      },
    };
    G.unlockedBags[c.id] = 0;
  });

  // Day 1 is arrival/orientation day — no clinic schedule
  // Schedule will be generated when day 2 begins (endDay → generateSchedule)
  G.schedule = [];
  G.completedToday = [];
  saveGame();
  updateTopBar();
  playOpening();
  startClock();
  expandDrawer();
  setTimeout(checkSpiritAppearance, 60000);
}

// ── Schedule System ──
const SCHEDULE_POOL = [
  {id:'konig',   type:'pre',  time:'10:30', reason:'精神适配性评估', priority:1},
  {id:'soap',    type:'pre',  time:'13:00', reason:'感官耳鸣复查',   priority:2},
  {id:'horangi', type:'pre',  time:'15:00', reason:'例行维护疏导',   priority:3},
  {id:'keegan',  type:'pre',  time:'11:00', reason:'感官负荷评估',   priority:4},
  {id:'ghost',   type:'pre',  time:'14:00', reason:'强制精神评估',   priority:5},
  {id:'price',   type:'pre',  time:'09:30', reason:'例行检查',       priority:6},
  {id:'gaz',     type:'pre',  time:'16:00', reason:'例行维护',       priority:7},
  {id:'hesh',    type:'pre',  time:'10:00', reason:'心理评估',       priority:8},
  {id:'merrick', type:'pre',  time:'15:30', reason:'压力评估',       priority:9},
  {id:'nikto',   type:'pre',  time:'13:30', reason:'人格稳定性评估', priority:10},
  {id:'zimo',    type:'pre',  time:'11:30', reason:'例行检查',       priority:11},
  {id:'krueger', type:'pre',  time:'14:30', reason:'感官评估',       priority:12},
  {id:'graves',  type:'walk', time:'随时',  reason:'主动求诊',       priority:13},
  {id:'logan',   type:'pre',  time:'16:30', reason:'心理辅导',       priority:14},
];

function generateSchedule() {
  if (!G.recentScheduleIds) G.recentScheduleIds = [];
  if (!G.allTimeSeenIds) G.allTimeSeenIds = [];

  // Weight: recently scheduled chars get lower weight; never-seen chars get highest weight
  const weighted = SCHEDULE_POOL.map(p => {
    const neverSeen  = !G.allTimeSeenIds.includes(p.id);
    const recentlySeen = G.recentScheduleIds.slice(-6).includes(p.id);
    let weight = 1.0;
    if (neverSeen)    weight = 2.5;  // boost unseen chars
    if (recentlySeen) weight = 0.2;  // suppress recent chars
    return {...p, weight};
  });

  // Weighted random selection without replacement
  const selected = [];
  const available = [...weighted];
  while (selected.length < 3 && available.length > 0) {
    const totalWeight = available.reduce((s, p) => s + p.weight, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < available.length; i++) {
      rand -= available[i].weight;
      if (rand <= 0) {
        selected.push(available[i]);
        available.splice(i, 1);
        break;
      }
    }
  }

  G.schedule = selected.map(p => ({id:p.id, type:p.type, time:p.time, reason:p.reason}));

  // Sort by time
  const timeToMin = t => {
    if (!t || t==='随时' || t==='紧急') return 999;
    const [h,m] = t.split(':').map(Number); return h*60+(m||0);
  };
  G.schedule.sort((a,b) => timeToMin(a.time) - timeToMin(b.time));

  // Track seen history
  G.recentScheduleIds = [...G.recentScheduleIds, ...selected.map(p=>p.id)].slice(-12);
  G.allTimeSeenIds    = [...new Set([...G.allTimeSeenIds, ...selected.map(p=>p.id)])];

  // Inject urgent if any patient critical — max 1
  const urgent = Object.entries(G.patients)
    .filter(([id,p])=>p.mental>=80&&p.visitCount>0)
    .map(([id])=>id);
  let urgentAdded = 0;
  for (const id of urgent) {
    if (urgentAdded >= 1) break;
    if (!G.schedule.find(s=>s.id===id)) {
      G.schedule.unshift({id, type:'urgent', time:'紧急', reason:'感官过载警报 ⚡'});
      urgentAdded++;
    }
  }

  renderPhoneSchedule();
}

function renderPhoneSchedule() {
  const el = document.getElementById('appt-content');
  if (!el) return;
  const typeLabels = {pre:'预约', urgent:'紧急', walk:'现场'};
  const typeClass  = {pre:'type-pre', urgent:'type-urgent', walk:'type-walk'};
  if (!G.completedToday) G.completedToday = [];
  const remaining = G.schedule.filter(s=>!G.completedToday.includes(s.id));
  const gd = getGameDate();
  const gt = getGameTime();

  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <div style="font-family:var(--mono);font-size:10px;color:var(--text2);letter-spacing:1px">今日预约 · ${gd.full}</div>
    <div style="font-family:var(--mono);font-size:10px;color:var(--cyan)">${gt} ${getSlotLabel()}</div>
  </div>`;

  // Active session banner at top
  if (G.clinicSession && G.currentLocation === 'clinic') {
    const ac = CHARS.find(x=>x.id===G.clinicSession);
    if (ac) {
      html += `<div onclick="closePhone()" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(0,229,255,0.08);border:1px solid var(--cyan);border-radius:8px;margin-bottom:12px;cursor:pointer;animation:urgent-pulse 2s infinite">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 8px var(--cyan)"></div>
        <div style="flex:1">
          <div style="font-family:var(--hud);font-size:13px;font-weight:700;color:var(--cyan)">正在接诊：${ac.name}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text2)">点击返回诊疗室</div>
        </div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--cyan)">→</div>
      </div>`;
    }
  }

  G.schedule.forEach(function(s) {
    const c = CHARS.find(x=>x.id===s.id);
    if (!c) return;
    const isDone = G.completedToday.includes(s.id);
    const isActive = G.clinicSession === s.id;
    const tc = isDone ? '' : (isActive ? 'type-urgent' : typeClass[s.type] || 'type-pre');
    const tl = isDone ? '✓' : (isActive ? '进行中' : typeLabels[s.type] || '预约');
    const doneStyle = isDone ? 'opacity:0.35;filter:grayscale(1);' : '';
    const activeStyle = isActive ? 'border-color:var(--cyan);background:rgba(0,229,255,0.05);' : '';
    const p = G.patients[s.id];
    const phaseLabel = p ? (PHASE_LABELS[p.trustPhase||0]||'戒备') : '—';
    const visitLabel = p ? `第${p.visitCount||0}次` : '';

    // Tap to start session button (only if not done, not active, in clinic)
    const canStart = !isDone && !isActive && G.currentLocation === 'clinic' && G.day > 1;
    const startBtn = canStart
      ? `<div onclick="event.stopPropagation();startSessionFrom('${s.id}')" style="font-family:var(--mono);font-size:9px;color:var(--teal);background:rgba(0,255,204,0.08);border:1px solid var(--teal-dim);border-radius:3px;padding:2px 6px;cursor:pointer;white-space:nowrap">接诊</div>`
      : '';

    html += `<div class="appt-item" style="${doneStyle}${activeStyle}cursor:pointer" onclick="${isDone||isActive?'':(`closePhone();startSessionFrom('${s.id}')`)}" >
      <div style="text-align:center;min-width:44px">
        <div class="appt-time" style="${isDone?'color:var(--text3);text-decoration:line-through':isActive?'color:var(--cyan)':''}">${s.time}</div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-top:2px">${visitLabel}</div>
      </div>
      <div class="appt-info">
        <div class="appt-name" style="${isDone?'color:var(--text3)':isActive?'color:var(--cyan)':''}">${c.name}${isDone?' <span style="font-size:9px;color:var(--text3)">[已完成]</span>':''}</div>
        <div class="appt-unit">${c.unit} · ${s.reason}</div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-top:2px">${phaseLabel} · 精神力${p?.mental||50}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <div class="appt-type ${tc}" style="${isDone?'color:var(--text3);background:none;border-color:var(--border)':''}">${tl}</div>
        ${startBtn}
      </div>
    </div>`;
  });

  if (remaining.length === 0 && G.schedule.length > 0) {
    html += `<div style="margin-top:14px;padding:12px;background:rgba(0,255,204,0.06);border:1px solid var(--teal-dim);border-radius:6px;font-family:var(--mono);font-size:11px;color:var(--teal);text-align:center;letter-spacing:1px">✓ 今日看诊已全部完成<br><span style="color:var(--text2);font-size:10px;margin-top:4px;display:block">下班后可以去哪里走走？</span></div>`;
    html += `<div style="margin-top:10px;font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:1px;margin-bottom:6px">— 选择去向 —</div>`;
    const afterWorkLocs = [
      {id:'canteen',  name:'食堂',       icon:'🍱', desc:'碰碰运气，也许会偶遇'},
      {id:'range',    name:'射击靶场',   icon:'🎯', desc:'放松一下'},
      {id:'gym',      name:'训练场',     icon:'⚔️', desc:'去看看有没有人在训练'},
      {id:'corridor', name:'走廊 / A区', icon:'🚶', desc:'随便走走'},
      {id:'roof',     name:'楼顶',       icon:'🌙', desc:'透透气'},
      {id:'quarters', name:'向导宿舍',   icon:'🛏', desc:'早点休息，恢复精神屏障'},
    ];
    afterWorkLocs.forEach(loc => {
      html += `<div onclick="closePhone();travelTo('${loc.id}','${loc.name}')" style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;margin-bottom:8px;cursor:pointer;transition:all 0.2s" onmousedown="this.style.borderColor='var(--cyan)'">
        <div style="font-size:18px">${loc.icon}</div>
        <div style="flex:1">
          <div style="font-family:var(--hud);font-size:13px;font-weight:600;color:var(--white)">${loc.name}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text3)">${loc.desc}</div>
        </div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--cyan)">→</div>
      </div>`;
    });
    html += `<div onclick="closePhone();showPanel('map');" style="display:flex;align-items:center;gap:10px;padding:12px;background:rgba(255,45,107,0.06);border:1px solid var(--pink-dim);border-radius:6px;margin-bottom:8px;cursor:pointer;margin-top:4px">
      <div style="font-size:18px">🌙</div>
      <div style="flex:1">
        <div style="font-family:var(--hud);font-size:13px;font-weight:600;color:var(--pink)">结束今日，回去休息</div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--text3)">直接进入下一天</div>
      </div>
    </div>`;
    showToast('✓ 今日预约全部完成，可以下班了');
  }
  el.innerHTML = html;
  const badge = document.getElementById('appt-badge');
  if (badge) badge.textContent = remaining.length > 0 ? remaining.length : (G.schedule.length > 0 ? '✓' : '0');
}
// Direct-enter session from appointment list
function startSessionFrom(charId) {
  if (G.day <= 1) { showToast('今日为入驻日，正式接诊明日开始'); return; }
  if (G.completedToday.includes(charId)) { showToast('今天已经接诊过了'); return; }
  if (!G.schedule.find(s=>s.id===charId)) { showToast('该角色今日没有预约'); return; }
  // Set clinic as location if not already
  if (G.currentLocation !== 'clinic') {
    G.currentLocation = 'clinic';
    G.currentScene = 'clinic';
    const gt = getGameTime();
    document.getElementById('sh-tag').textContent = `DAY ${G.day} · ${getSlotLabel()} · ${gt}`;
    document.getElementById('sh-title').textContent = '塔医疗部 — 精神疏导科';
    document.getElementById('sh-sub').textContent = 'T-MED / PSYCH UNIT 3 / FLOOR A3';
  }
  // Set the session
  if (G.clinicSession !== charId) {
    G.clinicSession = charId;
    G.sessionTurns = 0;
  }
  showPanel('scene');
  updateSlotDisplay();
  renderPhoneSchedule();
  const c = CHARS.find(x=>x.id===charId);
  const s = G.schedule.find(x=>x.id===charId);
  // Narrate arrival
  const arrNarr = getArrivalNarr(c);
  addNarr(arrNarr);
  // Push to AI history
  const p = G.patients[charId];
  const phase = PHASE_LABELS[p?.trustPhase||0]||'戒备';
  const memSnip = p?.memory?.summary ? `关系现状：${p.memory.summary}` : '首次接触';
  G.history.push({role:'user', content: `[接诊开始] ${c.name}（${s?.reason||'例行'}）进入诊疗室。这是第${(p?.visitCount||0)+1}次接触，当前阶段：${phase}，${memSnip}。请生成${c.name}进入诊疗室的场景，体现该阶段应有的态度，必须包含四个选项，格式：[OPTIONS: A.xxx | B.xxx | C.xxx | D.xxx]`});
  saveGame();
  callAI();
}
const MAX_URGENT_PER_DAY = 2;
function countUrgentToday() {
  return G.schedule.filter(s => s.type === 'urgent').length;
}

// 20% chance random emergency per time slot — hard-capped at MAX_URGENT_PER_DAY
function maybeSpawnEmergency() {
  if (countUrgentToday() >= MAX_URGENT_PER_DAY) return;
  if (Math.random() > 0.20) return;
  const eligible = CHARS.filter(c=>{
    const p = G.patients[c.id];
    return p && p.visitCount > 0 && !G.schedule.find(s=>s.id===c.id) && !G.completedToday.includes(c.id);
  });
  if (!eligible.length) return;
  const c = eligible[Math.floor(Math.random()*eligible.length)];
  const reasons = ['感官突发过载','精神体失控警报','前线创伤紧急入院','神游症发作'];
  const reason = reasons[Math.floor(Math.random()*reasons.length)];
  G.schedule.push({id:c.id, type:'urgent', time:'紧急', reason: reason+' ⚡'});
  renderPhoneSchedule();
  addSysMsg('⚡ 紧急通报', `${c.name} 出现 <span style="color:var(--pink)">${reason}</span>，已加入今日看诊名单。`);
  const badge = document.getElementById('appt-badge');
  if (badge) { badge.textContent = '!'; badge.style.background='var(--pink)'; }
  showToast(`⚡ 紧急：${c.name} 需要立即疏导`);
  saveGame();
}
