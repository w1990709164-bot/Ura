// ══════════════════════════════
// STATUS
// ══════════════════════════════
function renderStatus() {
  const body = document.getElementById('status-body');
  const maxStat = 10;
  body.innerHTML = `
    <div class="status-section">
      <div class="status-section-title">属性</div>
      ${STATS_DEF.map(s=>`
        <div class="status-stat-row">
          <div class="status-stat-name">${s.name}</div>
          <div class="status-bar">
            <div class="status-bar-fill" style="width:${Math.min(100,(G.stats[s.key]||0)/maxStat*100)}%"></div>
          </div>
          <div class="status-stat-val">${G.stats[s.key]||0}</div>
        </div>`).join('')}
    </div>
    <div class="status-section">
      <div class="status-section-title">职业</div>
      <div class="status-job-card">
        ${G.job ? `
          <div class="status-job-name">${JOBS[G.job]?.name||G.job}</div>
          <div class="status-job-rank">等级 ${G.jobGrade||'—'}</div>
        ` : `
          <div class="status-job-pending">成年仪式后确定职业</div>
        `}
      </div>
    </div>
    <div class="status-section">
      <div class="status-section-title">个人信息</div>
      <div style="font-family:var(--hud);font-size:11px;color:var(--text2);line-height:2;letter-spacing:0.5px">
        <div>姓名：<span style="color:var(--sand)">${G.player.name||'—'}</span></div>
        <div>种族：<span style="color:var(--sand)">${G.player.race||'—'}</span></div>
        <div>生辰：<span style="color:var(--sand)">2060年${G.player.birthday?.month||'?'}月${G.player.birthday?.day||'?'}日</span></div>
        <div>当前状态：<span style="color:${G.inHeat?'#CC6666':'var(--green)'}">${G.inHeat?'发情期':'正常'}</span></div>
      </div>
    </div>
  `;
}
