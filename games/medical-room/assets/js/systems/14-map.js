// ══════════════════════════════
// MAP
// ══════════════════════════════
const LOCATIONS = [
  {id:'clinic',  name:'精神疏导科诊疗室', icon:'🏥', desc:'你的主战场', available:true},
  {id:'canteen', name:'食堂',             icon:'🍱', desc:'偶遇角色，积累信任', available:true},
  {id:'range',   name:'射击靶场',         icon:'🎯', desc:'观察哨兵状态', available:true},
  {id:'gym',     name:'训练场',           icon:'⚔️', desc:'可能触发任务伤亡', available:true},
  {id:'corridor',name:'走廊 / A区',       icon:'🚶', desc:'短暂偶遇', available:true},
  {id:'archive', name:'资料档案库',       icon:'📚', desc:'解锁角色背景', available:true},
  {id:'roof',    name:'楼顶',             icon:'🌙', desc:'夜晚特殊事件触发点', available:()=>G.timeOfDay==='night'},
  {id:'quarters',name:'向导宿舍',         icon:'🛏', desc:'休息，恢复精神屏障', available:true},
];

function renderMap() {
  document.getElementById('map-day-label').textContent = `第${G.day}天 · 选择前往的地点`;
  const container = document.getElementById('map-locations');
  container.innerHTML = '';

  // Current location indicator
  const currentDiv = document.createElement('div');
  currentDiv.innerHTML = `
    <div style="font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:1px;margin-bottom:12px">
      当前位置：<span style="color:var(--cyan)">${getLocationName(G.currentLocation||'clinic')}</span>
    </div>`;
  container.appendChild(currentDiv);

  LOCATIONS.forEach(loc=>{
    const avail = typeof loc.available === 'function' ? loc.available() : loc.available;
    const isCurrent = G.currentLocation === loc.id;
    const div = document.createElement('div');
    div.style.cssText = `
      display:flex;align-items:center;gap:12px;padding:14px;
      background:${isCurrent?'var(--cyan-glow)':'var(--bg3)'};
      border:1px solid ${isCurrent?'var(--cyan)':'var(--border)'};
      border-radius:8px;margin-bottom:8px;cursor:${avail?'pointer':'default'};
      opacity:${avail?'1':'0.4'};transition:all 0.2s;
    `;
    div.innerHTML = `
      <div style="font-size:24px;width:36px;text-align:center">${loc.icon}</div>
      <div style="flex:1">
        <div style="font-family:var(--hud);font-size:14px;font-weight:600;color:${isCurrent?'var(--cyan)':'var(--white)'}">${loc.name}</div>
        <div style="font-family:var(--mono);font-size:11px;color:var(--text3);margin-top:2px">${loc.desc}</div>
      </div>
      ${isCurrent?'<div style="font-family:var(--mono);font-size:10px;color:var(--cyan)">● 当前</div>':''}
    `;
    if (avail && !isCurrent) {
      div.onclick = ()=>travelTo(loc.id, loc.name);
    }
    container.appendChild(div);
  });
}

function getLocationName(id) {
  return LOCATIONS.find(l=>l.id===id)?.name || '未知';
}
function applyMapEncounterTrust(locId, locName) {
  if (locId === 'clinic' || locId === 'quarters' || !G.patients) return;
  const ids = (typeof CHARS !== 'undefined' ? CHARS.map(c=>c.id) : Object.keys(G.patients))
    .filter(id => G.patients[id]);
  if (!ids.length) return;
  const seen = ids.filter(id => (G.patients[id].visitCount||0)>0 || (G.patients[id].trustAccum||0)>0 || (G.contacts||[]).includes(id));
  const pool = seen.length ? seen : ids;
  const charId = pool[(Number(G.day||1) + locId.length) % pool.length];
  const p = G.patients[charId];
  const c = typeof CHARS !== 'undefined' ? CHARS.find(x=>x.id===charId) : null;
  const delta = locId === 'archive' ? 1 : 2;
  if (p.trustPhase === undefined) p.trustPhase = 0;
  if (p.trustAccum === undefined) p.trustAccum = 0;
  p.trustAccum = Math.max(0, p.trustAccum + delta);
  const threshold = (typeof PHASE_THRESHOLDS !== 'undefined' ? PHASE_THRESHOLDS[p.trustPhase||0] : null) || 100;
  p.trust = Math.max(0, Math.min(100, Math.round((p.trustAccum / threshold) * 100)));
  p.location = locName;
  if (!p.memory) p.memory = { summary:'尚未接触', keyEvents:[], doctorNote:'', lastUpdated:null };
  if (!Array.isArray(p.memory.keyEvents)) p.memory.keyEvents = [];
  p.memory.keyEvents.push({ day:G.day, text:`在${locName}发生过一次诊疗外偶遇，信任+${delta}。` });
  p.memory.keyEvents = p.memory.keyEvents.slice(-12);
  p.memory.lastUpdated = new Date().toISOString();
  if (typeof checkPhaseUp === 'function') checkPhaseUp(charId);
  if (typeof addWorldLog === 'function') addWorldLog('map', charId, `在${locName}偶遇${c?.name||charId}，诊疗外信任+${delta}。`);
  if (typeof showTrustChange === 'function') showTrustChange(charId, delta);
  else if (typeof showToast === 'function') showToast(`${c?.name||charId} 信任 +${delta}`);
}

function travelTo(locId, locName) {
  const prev = G.currentLocation || 'clinic';
  if (prev === locId) return;
  G.currentLocation = locId;
  G.currentScene = locId;
  if (locId === 'quarters') {
    G.playerStats.shield = Math.min(100, (G.playerStats.shield ?? 100) + 15);
    showToast('🛏 精神屏障恢复 +15');
  }
  applyMapEncounterTrust(locId, locName);
  showPanel('scene');
  const locEl = document.getElementById('tb-location');
  if (locEl) locEl.textContent = locName;
  G.history.push({
    role: 'user',
    content: `[场景切换] 向导从${getLocationName(prev)}前往了${locName}。请生成抵达${locName}的场景叙事，描写环境氛围，如有角色在场可以自然出现，并给出行动选项。`
  });
  if (typeof callAI === 'function') callAI();
  saveGame();
}
