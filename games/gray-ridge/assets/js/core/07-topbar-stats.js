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

function getDaysInGameMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function advanceGameDateByMonths(months = 1) {
  const originalDay = Math.max(1, Number(G.absoluteDay) || 1);
  for (let i = 0; i < months; i++) {
    G.absoluteMonth = (Number(G.absoluteMonth) || 1) + 1;
    if (G.absoluteMonth > 12) {
      G.absoluteMonth = 1;
      G.absoluteYear = (Number(G.absoluteYear) || 2060) + 1;
    }
  }
  G.absoluteDay = Math.min(originalDay, getDaysInGameMonth(G.absoluteYear, G.absoluteMonth));
}

function advanceGameDateByDays(days = 1) {
  let remaining = Math.max(0, Math.floor(Number(days) || 0));
  while (remaining > 0) {
    const daysInMonth = getDaysInGameMonth(G.absoluteYear, G.absoluteMonth);
    const available = daysInMonth - G.absoluteDay;
    if (remaining <= available) {
      G.absoluteDay += remaining;
      remaining = 0;
    } else {
      remaining -= available + 1;
      G.absoluteDay = 1;
      G.absoluteMonth++;
      if (G.absoluteMonth > 12) {
        G.absoluteMonth = 1;
        G.absoluteYear++;
      }
    }
  }
}
