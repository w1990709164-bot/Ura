// ══════════════════════════════
// BONDS
// ══════════════════════════════
function renderBonds(filter) {
  const list = document.getElementById('bond-list');
  let chars = CHARS;
  if (filter && filter !== 'all') chars = CHARS.filter(c=>c.faction===filter);

  list.innerHTML = chars.map(c => {
    const b = G.bonds[c.id] || {};
    const stage = BOND_STAGES[b.stage||0];
    const pct = b.value || 0;
    const status = b.status || 'normal';
    const statusLabel = {normal:'正常',heat:'发情期',injured:'受伤',critical:'重伤',coma:'昏迷'}[status]||'正常';
    const statusClass = {normal:'normal',heat:'heat',injured:'injured',critical:'critical',coma:'critical'}[status]||'normal';
    const dynamic = b.dynamic || '休息中';
    const loc = status==='normal'&&b.location ? (LOCATIONS.find(l=>l.id===b.location)?.name||'营地') : (b.status==='injured'||b.status==='critical'?'医疗营':'营地');
    const onMission = dynamic === '任务中';

    // Whisper visibility by stage
    const stageIdx = b.stage||0;
    let whisperText = '';
    let whisperLocked = true;
    if (stageIdx >= 2) {
      whisperLocked = false;
      whisperText = b.whisper || '……';
      if (stageIdx < 3) whisperText = (whisperText||'').slice(0,20)+'…';
    }

    return `
    <div class="bond-card" onclick="openBondDetail('${c.id}')">
      <div class="bond-card-header">
        <div class="bond-av">${c.init}</div>
        <div class="bond-info">
          <div class="bond-name">${c.name}</div>
          <div class="bond-meta">${c.species} · ${FACTION_NAMES[c.faction]||c.faction}</div>
          <div class="bond-stage">${stage}</div>
        </div>
        <div class="bond-status-badge ${statusClass}">${statusLabel}</div>
      </div>
      <div class="bond-progress">
        <div class="bond-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="bond-details">
        <div class="bond-detail-item">
          <span class="bond-detail-label">动态：</span>
          <span class="bond-detail-val">${dynamic}</span>
        </div>
        <div class="bond-detail-item">
          <span class="bond-detail-label">地点：</span>
          <span class="bond-detail-val">${onMission?'保密':loc}</span>
        </div>
      </div>
      <div class="bond-whisper ${whisperLocked?'locked':''}">
        ${whisperLocked ? '「……」（同伴阶段解锁）' : `「${whisperText}」`}
      </div>
    </div>`;
  }).join('');
}

function filterBond(faction, btn) {
  document.querySelectorAll('.bond-filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderBonds(faction);
}

function openBondDetail(charId) {
  // TODO: expand into full character page
  const c = CHARS.find(x=>x.id===charId);
  showToast(`${c?.name} · ${BOND_STAGES[G.bonds[charId]?.stage||0]}`);
}
