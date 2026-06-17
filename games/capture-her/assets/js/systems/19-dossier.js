// ═══════════════════════════════
// DOSSIER
// ═══════════════════════════════
function renderDossier(filter){
  const list=document.getElementById('dossier-list');
  let chars=[...CHARS];
  if(filter&&filter!=='all') chars=chars.filter(c=>c.faction===filter);
  list.innerHTML=chars.map(c=>{
    const cs=G.chars[c.id]||{};
    const status=cs.status||'base';
    const statusLabel={field:'外勤',base:'驻扎',task:'任务中'}[status]||'驻扎';
    const statusClass={field:'field',base:'base',task:'task'}[status]||'base';
    const hasTask=G.dailyTasks?.some(t=>t.charId===c.id&&!t.done);
    return `<div class="dossier-card"><div class="dc-header"><div class="dc-av">${c.init}</div><div class="dc-info"><div class="dc-name">${c.name}</div><div class="dc-meta">${c.abo} · ${FACTIONS[c.faction]||c.faction} · ${c.nation}</div></div><div class="dc-status-badge ${statusClass}">${cs.inHeat?'🔥发情':hasTask?'🎯任务':statusLabel}</div></div><div class="dc-grid"><div class="dc-grid-item"><span class="dc-grid-label">好感：</span><span class="dc-grid-val">${cs.goodFeel||0}</span></div><div class="dc-grid-item"><span class="dc-grid-label">执念：</span><span class="dc-grid-val">${cs.obsession||0}</span></div><div class="dc-grid-item"><span class="dc-grid-label">位置：</span><span class="dc-grid-val">${cs.location||'安全区'}</span></div><div class="dc-grid-item"><span class="dc-grid-label">信息素：</span><span class="dc-grid-val" style="color:var(--text3);font-size:8px">${c.phero}</span></div></div>${cs.os?`<div class="dc-os">「${cs.os}」</div>`:''}</div>`;
  }).join('');
}
function filterDossier(faction,btn){
  document.querySelectorAll('.df-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); renderDossier(faction);
}
