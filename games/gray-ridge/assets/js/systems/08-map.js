// ══════════════════════════════
// MAP
// ══════════════════════════════
function renderMap() {
  const grid = document.getElementById('map-grid');
  // Count chars at each location
  const counts = {};
  Object.entries(G.bonds).forEach(([id, b]) => {
    const loc = b.location || 'camps';
    counts[loc] = (counts[loc]||0) + 1;
  });
  grid.innerHTML = LOCATIONS.map(l => {
    const count = counts[l.id] || 0;
    const isMarket = l.id === 'market';
    const marketOpen = G.weeklyMarketOpen;
    if (isMarket && !marketOpen) return `
      <div class="map-location" style="opacity:0.4">
        <div class="map-loc-icon">${l.icon}</div>
        <div class="map-loc-name">${l.name}</div>
        <div class="map-loc-desc">本周未开放</div>
      </div>`;
    return `
      <div class="map-location" onclick="travelTo('${l.id}')">
        <div class="map-loc-icon">${l.icon}</div>
        <div class="map-loc-name">${l.name}</div>
        <div class="map-loc-desc">${l.desc}</div>
        ${count ? `<div class="map-loc-count">${count}人</div>` : ''}
      </div>`;
  }).join('');
}

function travelTo(locId) {
  if (locId === 'market' && !G.weeklyMarketOpen) { showToast('黑市本周未开放'); return; }
  if (locId === 'market' && G.weeklyMarketOpen) { G.currentLocation = locId; updateTopBar(); showPanel('scene'); openMarket(); return; }
  G.currentLocation = locId;
  updateTopBar();
  showPanel('scene');
  const loc = LOCATIONS.find(l=>l.id===locId);
  addNarr(`*你来到了${loc?.name}。*`);
  G.history.push({role:'user', content:'[场景切换：你来到了' + (loc?.name||locId) + '，描述这个地点的环境和此处的角色]'});
  callAI();
}
