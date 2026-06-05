// ══════════════════════════════
// NEW GAME — STAT ALLOCATION
// ══════════════════════════════
let allocStats = {tq:0,mj:0,jz:0,js:0,zs:0,qs:0,yl:0};
let pointsLeft = 10;

function buildStatAlloc() {
  allocStats = {tq:0,mj:0,jz:0,js:0,zs:0,qs:0,yl:0};
  pointsLeft = 10;
  const grid = document.getElementById('stat-alloc');
  grid.innerHTML = STATS_DEF.map(s => `
    <div class="stat-row">
      <div class="stat-name">${s.name}</div>
      <div class="stat-bar-wrap">
        <div class="stat-bar-fill" id="alloc-bar-${s.key}" style="width:0%"></div>
      </div>
      <div class="stat-controls">
        <button class="stat-btn" onclick="allocStat('${s.key}',-1)">−</button>
        <div class="stat-val" id="alloc-val-${s.key}">0</div>
        <button class="stat-btn" onclick="allocStat('${s.key}',1)">＋</button>
      </div>
    </div>
  `).join('');
  updateAllocDisplay();
}

function allocStat(key, delta) {
  const newVal = allocStats[key] + delta;
  if (newVal < 0) return;
  if (delta > 0 && pointsLeft <= 0) { showToast('点数已用完'); return; }
  allocStats[key] = newVal;
  pointsLeft -= delta;
  updateAllocDisplay();
}

function updateAllocDisplay() {
  STATS_DEF.forEach(s => {
    const v = allocStats[s.key];
    document.getElementById('alloc-val-'+s.key).textContent = v;
    document.getElementById('alloc-bar-'+s.key).style.width = (v*10)+'%';
  });
  document.getElementById('points-left').textContent = pointsLeft;
}

// Month/Day selectors
function buildMonthDays() {
  const monthSel = document.getElementById('ng-month');
  monthSel.onchange = updateDays;
  updateDays();
}
function updateDays() {
  const month = parseInt(document.getElementById('ng-month').value) || 1;
  const days = [31,29,31,30,31,30,31,31,30,31,30,31][month-1] || 31;
  const daySel = document.getElementById('ng-day');
  const cur = parseInt(daySel.value);
  daySel.innerHTML = '<option value="">日期</option>' +
    Array.from({length:days},(_,i)=>`<option value="${i+1}"${cur===i+1?' selected':''}>${i+1}日</option>`).join('');
}
