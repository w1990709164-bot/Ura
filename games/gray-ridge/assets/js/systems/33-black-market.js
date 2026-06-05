// ══════════════════════════════
// BLACK MARKET (黑市)
// ══════════════════════════════
const MARKET_ITEMS = [
  // Suppressants
  {id:'sup1', name:'标准抑制剂', desc:'压制发情期症状，持续一个完整周期', type:'suppress', icon:'💉', price:120},
  {id:'sup2', name:'高效抑制剂', desc:'快速起效，效果更强', type:'suppress', icon:'💊', price:200},
  // Gifts
  {id:'g1', name:'手工皮革挂件', desc:'精心制作，送人可增加羁绊 +12', type:'gift', icon:'🎁', price:80, bondBonus:12},
  {id:'g2', name:'稀有香料', desc:'来自远方，气味独特，送人可增加羁绊 +15', type:'gift', icon:'🌿', price:150, bondBonus:15},
  {id:'g3', name:'古旧地图', desc:'战前遗物，颇具收藏价值，送人可增加羁绊 +20', type:'gift', icon:'🗺', price:250, bondBonus:20},
  // Dice bonuses
  {id:'d1', name:'幸运符文', desc:'下次骰子检定 +3', type:'dice', icon:'🎲', price:100, bonus:3},
  {id:'d2', name:'战术分析卷轴', desc:'下次骰子检定 +5', type:'dice', icon:'📜', price:180, bonus:5},
  // Self-use
  {id:'u1', name:'强化药剂·体魄', desc:'永久提升体魄 +1', type:'use', icon:'⚗', price:200, statKey:'tq', statBonus:1},
  {id:'u2', name:'强化药剂·精准', desc:'永久提升精准 +1', type:'use', icon:'⚗', price:200, statKey:'jz', statBonus:1},
  {id:'u3', name:'强化药剂·智识', desc:'永久提升智识 +1', type:'use', icon:'⚗', price:200, statKey:'zs', statBonus:1},
  // Weapons
  {id:'w1', name:'强化短刃', desc:'体魄 +1', type:'weapon', icon:'🗡', price:300, statKey:'tq', statBonus:1},
  {id:'w2', name:'精密瞄准镜', desc:'精准 +2', type:'weapon', icon:'🔭', price:500, statKey:'jz', statBonus:2},
  {id:'w3', name:'战术手套', desc:'敏捷 +1', type:'weapon', icon:'🧤', price:280, statKey:'mj', statBonus:1},
  {id:'w4', name:'爆破工具组', desc:'技术 +2', type:'weapon', icon:'💣', price:480, statKey:'js', statBonus:2},
  {id:'w5', name:'医疗急救包·强化', desc:'医疗 +2', type:'weapon', icon:'🏥', price:450, statKey:'yl', statBonus:2},
];

function openMarket() {
  if (!G.weeklyMarketOpen) { showToast('黑市本周未开放'); return; }
  const existing = document.getElementById('market-modal');
  if (existing) existing.remove();

  // Random selection of items this week (8-10 items)
  const weekItems = [...MARKET_ITEMS].sort(()=>Math.random()-0.5).slice(0, 9);

  const modal = document.createElement('div');
  modal.id = 'market-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:6800;display:flex;flex-direction:column;background:rgba(5,4,2,0.98)';
  modal.innerHTML = `
    <div style="height:52px;background:var(--panel);border-bottom:1px solid var(--border2);display:flex;align-items:center;padding:0 16px;flex-shrink:0;gap:12px">
      <div style="font-family:var(--cinzel);font-size:14px;font-weight:700;color:var(--gold);letter-spacing:3px;flex:1">🕯 黑市巷</div>
      <div style="font-family:var(--hud);font-size:12px;color:var(--gold)">🪙 ${G.wallet.toLocaleString()}</div>
      <div onclick="document.getElementById('market-modal').remove()" style="width:32px;height:32px;background:var(--bg3);border:1px solid var(--border);border-radius:2px;color:var(--text2);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</div>
    </div>
    <div style="font-family:var(--hud);font-size:9px;color:var(--text3);letter-spacing:2px;padding:8px 16px;border-bottom:1px solid var(--border)">本周货品 · 下周刷新</div>
    <div style="flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px" id="market-items">
      ${weekItems.map(item=>`
        <div style="background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:12px 14px;display:flex;align-items:center;gap:12px">
          <div style="font-size:24px;flex-shrink:0">${item.icon}</div>
          <div style="flex:1;min-width:0">
            <div style="font-family:var(--hud);font-size:13px;font-weight:600;color:var(--white);margin-bottom:2px">${item.name}</div>
            <div style="font-family:var(--hud);font-size:10px;color:var(--text2)">${item.desc}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
            <div style="font-family:var(--hud);font-size:12px;font-weight:700;color:var(--gold)">🪙 ${item.price}</div>
            <div onclick="buyMarketItem('${item.id}')" style="font-family:var(--hud);font-size:10px;letter-spacing:1px;color:${G.wallet>=item.price?'var(--gold)':'var(--text3)'};border:1px solid ${G.wallet>=item.price?'var(--gold-dim)':'var(--border)'};border-radius:2px;padding:3px 10px;cursor:${G.wallet>=item.price?'pointer':'default'};background:${G.wallet>=item.price?'var(--gold-glow)':'none'}">购买</div>
          </div>
        </div>`).join('')}
    </div>
  `;
  document.body.appendChild(modal);
  // Store this week's items for purchase
  G._marketItems = weekItems;
}

function buyMarketItem(itemId) {
  const item = G._marketItems?.find(i=>i.id===itemId);
  if (!item) return;
  if (G.wallet < item.price) { showToast('积分不足'); return; }
  G.wallet -= item.price;
  const purchased = {...item};
  delete purchased.price; delete purchased.id;
  G.inventory.push(purchased);
  saveGame(); updateTopBar(); renderBackpack();
  showToast('✓ 购买：' + item.name);
  // Refresh market display
  document.getElementById('market-modal')?.remove();
  openMarket();
}
