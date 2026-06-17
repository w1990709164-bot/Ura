// ═══════════════════════════════
// MARKET SYSTEM
// ═══════════════════════════════
const MARKET_CATALOG = [
  {id:'g1', name:'手工皮革挂件', desc:'精心制作的小物件，送人用', type:'gift', icon:'🎁', price:80, bondBonus:10},
  {id:'g2', name:'稀有香料包', desc:'来自远方，气味独特，送人用', type:'gift', icon:'🌿', price:130, bondBonus:15},
  {id:'g3', name:'旧战场地图', desc:'战前遗物，颇具收藏价值，送人用', type:'gift', icon:'🗺', price:220, bondBonus:22},
  {id:'g4', name:'私酿威士忌', desc:'安全区地下流通，送给喜欢喝酒的人', type:'gift', icon:'🥃', price:180, bondBonus:18},
  {id:'g5', name:'战术手册', desc:'专业级别的参考资料，送给在意专业的人', type:'gift', icon:'📖', price:150, bondBonus:16},
  {id:'d1', name:'幸运符文石', desc:'下次检定+3，一次性', type:'dice', icon:'🎲', price:100, bonus:3},
  {id:'d2', name:'战术分析报告', desc:'下次检定+5，一次性', type:'dice', icon:'📋', price:170, bonus:5},
  {id:'w1', name:'强化护具', desc:'防护等级提升，永久+1防御', type:'item', icon:'🛡', price:280, statBoost:'def', statVal:1},
  {id:'w2', name:'精密通讯器', desc:'信息获取能力+1', type:'item', icon:'📡', price:320, statBoost:'intel', statVal:1},
  {id:'w3', name:'高能补给包', desc:'体力恢复+状态改善', type:'item', icon:'💊', price:150},
  {id:'w4', name:'加密文件袋', desc:'行政效率+1，某些对话有额外选项', type:'item', icon:'💼', price:200},
];
let weeklyMarketItems = [];

function openMarket() {
  if(!weeklyMarketItems.length || G._marketDay !== G.totalDay) {
    weeklyMarketItems = [...MARKET_CATALOG].sort(()=>Math.random()-0.5).slice(0, 7);
    G._marketDay = G.totalDay;
  }
  document.getElementById('market-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'market-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:6800;display:flex;flex-direction:column;background:rgba(5,5,8,0.98)';
  modal.innerHTML = `<div style="height:52px;background:var(--panel);border-bottom:1px solid var(--border2);display:flex;align-items:center;padding:0 16px;flex-shrink:0;gap:12px"><div style="font-family:var(--display);font-size:16px;font-weight:700;color:var(--white);flex:1">🛍 补给站</div><div style="font-family:var(--mono);font-size:12px;color:var(--gold)">💳 ${G.wallet}</div><div onclick="document.getElementById('market-modal').remove()" style="width:32px;height:32px;background:var(--bg3);border:1px solid var(--border);border-radius:2px;color:var(--text2);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</div></div><div style="font-family:var(--mono);font-size:9px;color:var(--text3);letter-spacing:2px;padding:8px 16px;border-bottom:1px solid var(--border)">本周货品 · 每天刷新</div><div style="flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:8px">${weeklyMarketItems.map(item=>`<div style="background:var(--panel);border:1px solid var(--border);border-radius:3px;padding:12px 14px;display:flex;align-items:center;gap:12px"><div style="font-size:22px;flex-shrink:0">${item.icon}</div><div style="flex:1;min-width:0"><div style="font-family:var(--mono);font-size:12px;font-weight:600;color:var(--white);margin-bottom:2px">${item.name}</div><div style="font-family:var(--mono);font-size:9px;color:var(--text2)">${item.desc}</div>${item.bondBonus?`<div style="font-family:var(--mono);font-size:9px;color:var(--red);margin-top:2px">送人好感 +${item.bondBonus}</div>`:''}</div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0"><div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--gold)">💳 ${item.price}</div><div onclick="buyItem('${item.id}')" style="font-family:var(--mono);font-size:9px;letter-spacing:1px;color:${G.wallet>=item.price?'var(--red)':'var(--text3)'};border:1px solid ${G.wallet>=item.price?'var(--red-dim)':'var(--border)'};border-radius:2px;padding:3px 10px;cursor:${G.wallet>=item.price?'pointer':'default'};background:${G.wallet>=item.price?'var(--red-glow2)':'none'}">购买</div></div></div>`).join('')}</div>`;
  document.body.appendChild(modal);
}

function buyItem(itemId) {
  const item = weeklyMarketItems.find(i=>i.id===itemId);
  if(!item) return;
  if(G.wallet < item.price) { showToast('💳 积分不足'); return; }
  G.wallet -= item.price;
  G.inventory.push({name:item.name,desc:item.desc,type:item.type,icon:item.icon,bondBonus:item.bondBonus,bonus:item.bonus,statBoost:item.statBoost,statVal:item.statVal});
  saveGame(); updateTopBar(); showToast(`✓ 购买：${item.name}`);
  document.getElementById('market-modal')?.remove(); openMarket();
}
