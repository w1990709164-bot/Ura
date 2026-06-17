// ══════════════════════════════
// BACKPACK
// ══════════════════════════════
const BP_TYPE_NAMES = {use:'自用',gift:'礼物',dice:'骰子加成',weapon:'武器',suppress:'抑制剂'};
function renderBackpack(filter) {
  const list = document.getElementById('bp-list');
  let items = G.inventory || [];
  if (filter && filter !== 'all') items = items.filter(i=>i.type===filter);
  if (!items.length) {
    list.innerHTML = '<div class="bp-empty">背包空空如也……</div>';
    return;
  }
  list.innerHTML = items.map((item,idx)=>`
    <div class="bp-item">
      <div class="bp-item-icon">${item.icon||'📦'}</div>
      <div class="bp-item-info">
        <div class="bp-item-name">${item.name}</div>
        <div class="bp-item-desc">${item.desc||''}</div>
      </div>
      <div class="bp-item-use" onclick="useItem(${idx})">${item.type==='gift'?'送出':'使用'}</div>
    </div>`).join('');
}

function bpTab(type, btn) {
  document.querySelectorAll('.bp-tab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderBackpack(type);
}

function useItem(idx) {
  const item = G.inventory[idx];
  if (!item) return;
  if (item.type === 'gift') { openGiftPicker(idx); return; }
  if (item.type === 'suppress') {
    G.inHeat = false; G.heatDaysLeft = 0;
    G.inventory.splice(idx, 1); saveGame(); renderBackpack(); renderStatus(); updateTopBar();
    showToast('✓ 抑制剂已使用，发情期结束');
    addNarr('*你服下了抑制剂，那股躁动渐渐平息。*'); return;
  }
  if (item.type === 'use') {
    if (item.statKey && G.stats[item.statKey] !== undefined) {
      G.stats[item.statKey] += (item.statBonus||1);
      showToast('✓ ' + item.name + ' · ' + (STATS_DEF.find(s=>s.key===item.statKey)?.name||'') + ' +' + (item.statBonus||1));
    } else { showToast('使用了：' + item.name); }
    G.inventory.splice(idx, 1); saveGame(); renderBackpack(); updateStatsBar(); renderStatus(); return;
  }
  if (item.type === 'dice') {
    G.activeDiceBonus = (G.activeDiceBonus||0) + (item.bonus||2);
    showToast('✓ ' + item.name + ' · 下次检定 +' + (item.bonus||2));
    G.inventory.splice(idx, 1); saveGame(); renderBackpack(); return;
  }
  if (item.type === 'weapon') {
    if (!G.equipped) G.equipped = [];
    const existing = G.equipped.find(w=>w.statKey===item.statKey);
    if (existing) { showToast('同类武器已装备，请先卸下'); return; }
    G.equipped.push(item);
    G.stats[item.statKey] = (G.stats[item.statKey]||0) + (item.statBonus||1);
    G.inventory.splice(idx, 1); saveGame(); renderBackpack(); updateStatsBar(); renderStatus();
    showToast('⚔ 装备：' + item.name); return;
  }
  showToast('使用了：' + item.name);
  G.inventory.splice(idx, 1); saveGame(); renderBackpack();
}

function openGiftPicker(itemIdx) {
  const existing = document.getElementById('gift-picker-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'gift-picker-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(5,4,2,0.95);padding:24px';
  modal.innerHTML = '<div style="font-family:var(--cinzel);font-size:14px;font-weight:700;color:var(--gold);letter-spacing:3px;margin-bottom:16px">送给谁？</div><div style="width:100%;max-width:360px;max-height:60vh;overflow-y:auto;display:flex;flex-direction:column;gap:8px" id="gift-picker-list"></div><button onclick="document.getElementById(\'gift-picker-modal\').remove()" style="margin-top:16px;background:none;border:1px solid var(--border2);border-radius:2px;color:var(--text2);font-family:var(--hud);font-size:11px;letter-spacing:2px;padding:10px 24px;cursor:pointer">取消</button>';
  document.body.appendChild(modal);
  const list = document.getElementById('gift-picker-list');
  list.innerHTML = CHARS.map(c=>`<div onclick="sendGift(${itemIdx},'${c.id}')" style="background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:12px 14px;cursor:pointer;display:flex;align-items:center;gap:10px"><div style="width:32px;height:32px;background:var(--bg3);border:1px solid var(--border2);border-radius:2px;display:flex;align-items:center;justify-content:center;font-family:var(--cinzel);font-size:11px;font-weight:700;color:var(--gold);flex-shrink:0">${c.init}</div><div><div style="font-family:var(--cinzel);font-size:12px;color:var(--white);letter-spacing:1px">${c.name}</div><div style="font-family:var(--hud);font-size:10px;color:var(--text2)">${c.species} · ${BOND_STAGES[G.bonds[c.id]?.stage||0]}</div></div></div>`).join('');
}

function sendGift(itemIdx, charId) {
  const item = G.inventory[itemIdx];
  const c = CHARS.find(x=>x.id===charId);
  const b = G.bonds[charId];
  if (!item || !c || !b) return;
  document.getElementById('gift-picker-modal')?.remove();
  const boost = item.bondBonus || 8;
  b.value = Math.min(100, (b.value||0) + boost);
  if (b.value >= 100 && b.stage < 6) { b.stage++; b.value = 0; showToast('🐾 ' + c.name + ' 关系升级：' + BOND_STAGES[b.stage]); }
  G.inventory.splice(itemIdx, 1); saveGame(); renderBackpack(); renderBonds();
  addNarr('*你将礼物送给了' + c.name + '。*');
  showToast('✓ 礼物已送出 · 羁绊 +' + boost);
  G.history.push({role:'user', content:'[送出礼物给' + c.name + ']'});
  callAI();
}
