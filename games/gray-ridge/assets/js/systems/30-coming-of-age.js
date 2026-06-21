// ══════════════════════════════
// COMING OF AGE (成年仪式)
// ══════════════════════════════
function triggerComingOfAge() {
  // Calculate job based on top stats (专精制)
  const statEntries = STATS_DEF.map(s=>({key:s.key, name:s.name, val:G.stats[s.key]||0}));
  statEntries.sort((a,b)=>b.val-a.val);
  const top1 = statEntries[0];
  const top2 = statEntries[1];

  // Find best job match
  let bestJob = 'assault';
  let bestScore = -1;
  Object.entries(JOBS).forEach(([jk, j]) => {
    const score = j.attrs.reduce((s,k)=>(s+(G.stats[k]||0)), 0);
    if (score > bestScore) { bestScore = score; bestJob = jk; }
  });

  // Grade calculation (专精制)
  const topVal = top1.val + top2.val;
  const totalStats = Object.values(G.stats).reduce((s,v)=>s+v, 0);
  const spread = statEntries.reduce((mx,s,i,a)=>Math.max(mx, a[0].val-s.val), 0);

  let grade;
  if (topVal >= 16 && spread <= 4) grade = 'S';
  else if (topVal >= 12) grade = 'A';
  else if (topVal >= 8) grade = 'B';
  else grade = 'C';

  // Penalize over-spread
  if (spread <= 1 && grade !== 'S') grade = 'B'; // too spread out = max B unless very high

  G.job = bestJob;
  G.jobGrade = grade;
  G.phase = 'adult';
  G.gameYear = 8;
  G.gameWeek = 1;
  G.apUsedThisYear = [];
  saveGame();

  // Show ceremony
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:9200;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);padding:32px;text-align:center';
  modal.innerHTML = `
    <div style="font-family:var(--hud);font-size:10px;color:var(--text3);letter-spacing:4px;margin-bottom:16px">成年仪式</div>
    <div style="font-family:var(--cinzel);font-size:48px;font-weight:900;color:var(--gold);text-shadow:0 0 40px rgba(255,179,71,0.6);margin-bottom:8px;animation:title-glow 3s infinite">${grade}</div>
    <div style="font-family:var(--cinzel);font-size:22px;font-weight:700;color:var(--white);letter-spacing:2px;margin-bottom:24px">${JOBS[bestJob].name}</div>
    <div style="width:100%;max-width:360px;background:var(--panel);border:1px solid var(--border2);border-radius:4px;padding:20px;margin-bottom:24px">
      <div style="font-family:var(--hud);font-size:10px;color:var(--text3);letter-spacing:3px;margin-bottom:12px">属性评定</div>
      ${STATS_DEF.map(s=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        <div style="font-family:var(--hud);font-size:11px;color:var(--sand);width:36px">${s.name}</div>
        <div style="flex:1;height:6px;background:var(--bg3);border-radius:3px;overflow:hidden"><div style="height:100%;background:linear-gradient(90deg,var(--gold-dim),var(--gold));border-radius:3px;width:${Math.min(100,(G.stats[s.key]||0)/10*100)}%"></div></div>
        <div style="font-family:var(--hud);font-size:12px;font-weight:700;color:var(--gold);width:20px;text-align:right">${G.stats[s.key]||0}</div>
      </div>`).join('')}
    </div>
    <div style="font-family:var(--fell);font-style:italic;font-size:13px;color:var(--text2);line-height:1.8;margin-bottom:24px;max-width:320px">
      你在灰脊长大了。<br>从今天起，你是灰盟的一员。
    </div>
    <button onclick="this.parentElement.remove();startAdultPhase()" style="width:100%;max-width:320px;padding:14px;background:linear-gradient(135deg,var(--gold-dim),#3A2008);border:1px solid var(--gold);border-radius:2px;color:var(--gold);font-family:var(--cinzel);font-size:13px;font-weight:700;letter-spacing:4px;cursor:pointer">加入灰盟</button>
  `;
  document.body.appendChild(modal);
}

function startAdultPhase() {
  updateTopBar(); renderStatus();
  addSysMsg('成年仪式', `${G.player.name} 正式成为灰盟战士。
职业：${JOBS[G.job]?.name} · 等级 ${G.jobGrade}`);
  G.history.push({role:'user', content:'[成年仪式完成，生成入队剧情。玩家刚刚完成成年仪式，职业是' + (JOBS[G.job]?.name||'') + '，等级' + G.jobGrade + '。描述仪式结束后的第一幕场景，群像角色根据好感度和性格做出各自的反应]'});
  callAI();
}
