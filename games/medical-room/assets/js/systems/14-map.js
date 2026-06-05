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
