// ══════════════════════════════
// TOP BAR & STATS
// ══════════════════════════════
function updateTopBar() {
  const months = ['一','二','三','四','五','六','七','八','九','十','十一','十二'];
  document.getElementById('tb-date-main').textContent =
    `${G.absoluteYear}年${months[G.absoluteMonth-1]}月${G.absoluteDay}日`;
  document.getElementById('tb-date-sub').textContent =
    `第${G.gameYear}年 第${G.gameWeek}周`;
  document.getElementById('tb-location').textContent =
    '灰脊 · ' + (LOCATIONS.find(l=>l.id===G.currentLocation)?.name||'');
  document.getElementById('tb-mood').textContent = G.mood;
  document.getElementById('tb-wallet').textContent = G.wallet.toLocaleString();
  document.getElementById('sh-tag').textContent = G.phase==='cub'?'幼崽期':'成人期';
  document.getElementById('sh-title').textContent = '灰脊 · ' + (LOCATIONS.find(l=>l.id===G.currentLocation)?.name||'');
  document.getElementById('sh-sub').textContent = `第${G.gameYear}年 · 第${G.gameWeek}周`;
  updateActionBar();
}

function updateStatsBar() {
  STATS_DEF.forEach(s => {
    const el = document.getElementById('sc-'+s.key);
    if (el) el.textContent = G.stats[s.key] || 0;
  });
}
