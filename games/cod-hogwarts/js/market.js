// ── 黑市系统 ──────────────────────────────────────────────

const MARKET_CATALOG = [
  // ── 材料区 ────────────────────────────────────────────
  {
    id: 'mk_lingrass',    category: '炼药材料',
    name: '灵草（束）',    price: 6,
    desc: '东方炼丹基础，一束两株。',
    give: [{ id:'lingrass', name:'灵草', type:'ingredient', quantity:2 }]
  },
  {
    id: 'mk_moonwater',   category: '炼药材料',
    name: '满月水（瓶）',  price: 10,
    desc: '西方炼药常用，满月之夜收集。',
    give: [{ id:'moonwater', name:'满月水', type:'ingredient', quantity:1 }]
  },
  {
    id: 'mk_ghostpowder', category: '炼药材料',
    name: '幽灵粉末',      price: 18,
    desc: '成分不明，隐形药水必需材料。',
    stock: 2,
    give: [{ id:'ghostpowder', name:'幽灵粉末', type:'ingredient', quantity:1 }]
  },
  {
    id: 'mk_snowlotus',   category: '炼药材料',
    name: '天山雪莲',      price: 22,
    desc: '东方秘材，化冲首选，货源极少。',
    stock: 1,
    give: [{ id:'snowlotus', name:'天山雪莲', type:'ingredient', quantity:1 }]
  },
  {
    id: 'mk_dragblood',   category: '炼药材料',
    name: '龙血（小瓶）',  price: 28,
    desc: '融合丹必需，极难获取。',
    stock: 1,
    give: [{ id:'dragblood', name:'龙血', type:'ingredient', quantity:1 }]
  },
  {
    id: 'mk_herbpack',    category: '炼药材料',
    name: '综合草药包',    price: 14,
    desc: '乌头草×2＋牛黄石×1＋辰砂×1，新手入门组合。',
    give: [
      { id:'aconite',  name:'乌头草', type:'ingredient', quantity:2 },
      { id:'bezoar',   name:'牛黄石', type:'ingredient', quantity:1 },
      { id:'cinnabar', name:'辰砂',   type:'ingredient', quantity:1 }
    ]
  },
  // ── 成品药剂 ──────────────────────────────────────────
  {
    id: 'mk_healing',     category: '成品药剂',
    name: '治愈药水（成品）', price: 15,
    desc: '省去炼制工夫，品质普通。',
    give: [{ id:'healing_potion', name:'治愈药水', type:'potion', quality:'normal', desc:'战斗中HP+8；非战斗时体魄+10。', usable:true, effect:{ hp:8, stat:'tiPo', val:10 } }]
  },
  {
    id: 'mk_invisible',   category: '成品药剂',
    name: '隐形药水（成品）', price: 35,
    desc: '价格不菲，但省事。',
    stock: 1,
    give: [{ id:'invisible_potion', name:'隐形药水', type:'potion', quality:'normal', desc:'使用后进入隐形状态，可触发深夜特殊剧情。', usable:true, effect:{ flag:'invisible', duration:1 } }]
  },
  // ── 情报 & 特殊道具 ───────────────────────────────────
  {
    id: 'mk_map',         category: '情报',
    name: '地下走廊手绘地图', price: 12,
    desc: '潦草但管用，标注了所有暗道和守卫换班时间。',
    give: [{ id:'market_map', name:'地下走廊地图', type:'special', desc:'记录着走廊各暗道的位置。', usable:false }]
  },
  {
    id: 'mk_eastscroll',  category: '特殊道具',
    name: '古旧仙法残卷',  price: 38,
    desc: '记载着残缺的东方仙法，可能帮助突破数值阶段上限。',
    stock: 1,
    give: [{ id:'east_scroll', name:'古旧仙法残卷', type:'special', desc:'残缺的东方仙法记录，研习后可能突破数值阶段。', usable:true, effect:{ flag:'scroll_read' } }]
  },
  {
    id: 'mk_mirrorbroken', category: '特殊道具',
    name: '破损魔法照妖镜', price: 20,
    desc: '只剩一次使用机会，但能揭示某人真实想法。',
    stock: 1,
    give: [{ id:'magic_mirror', name:'照妖镜（破损）', type:'special', desc:'单次使用，揭示当前互动角色的心理状态。', usable:true, effect:{ flag:'mirror_used' } }]
  },
  {
    id: 'mk_info_ghost',  category: '情报',
    name: '关于Ghost的情报', price: 25,
    desc: '一份被人遗弃的旧档案，字迹潦草但内容让人心惊。',
    minAffection: { char:'ghost', val:30 },
    give: [{ id:'info_ghost', name:'Ghost旧档案', type:'special', desc:'关于Ghost真实经历的片段记录。', usable:false }]
  },
];

// ── 市场状态（每次访问不重置库存，只在游戏存档里记录） ──
function getMarketStock(itemId) {
  if (!G.flags.marketStock) G.flags.marketStock = {};
  const cat = MARKET_CATALOG.find(i => i.id === itemId);
  if (!cat || !cat.stock) return 99; // 无限库存
  const bought = G.flags.marketStock[itemId] || 0;
  return Math.max(0, cat.stock - bought);
}

function getAvailableItems() {
  return MARKET_CATALOG.filter(item => {
    if (item.minAffection) {
      const cs = G.characters[item.minAffection.char];
      if (!cs || cs.affection < item.minAffection.val) return false;
    }
    if (getMarketStock(item.id) <= 0) return false;
    return true;
  });
}

function buyItem(marketItemId) {
  const item = MARKET_CATALOG.find(i => i.id === marketItemId);
  if (!item) return { ok:false, msg:'商品不存在' };
  if (getMarketStock(marketItemId) <= 0) return { ok:false, msg:'此商品已售罄' };
  if (G.player.gold < item.price) return { ok:false, msg:`金加隆不足（需要${item.price}G）` };

  G.player.gold -= item.price;
  item.give.forEach(g => addItem({ ...g, quantity: g.quantity || 1 }));

  if (!G.flags.marketStock) G.flags.marketStock = {};
  G.flags.marketStock[marketItemId] = (G.flags.marketStock[marketItemId] || 0) + 1;

  G.blackMarketVisits = (G.blackMarketVisits || 0) + 1;
  unlockAchievement('market_found');
  if (G.blackMarketVisits >= 5) unlockAchievement('black_market');

  persistAll();
  return { ok:true, msg:`购买成功！剩余 ${G.player.gold} 金加隆。` };
}

// ── 黑市 UI ───────────────────────────────────────────────
function openMarketModal() {
  unlockAchievement('market_found');
  G.flags.marketUnlocked = true;
  persistAll();
  document.getElementById('modal-market').style.display = 'flex';
  renderMarketModal();
}

function closeMarketModal() {
  document.getElementById('modal-market').style.display = 'none';
}

function renderMarketModal() {
  const body = document.getElementById('market-modal-body');
  if (!body) return;

  const items = getAvailableItems();
  const categories = [...new Set(items.map(i => i.category))];

  body.innerHTML = `
    <div class="market-gold-bar">
      <span>持有金加隆</span>
      <span class="market-gold-num">${G.player.gold} G</span>
    </div>
    ${categories.map(cat => `
      <div class="market-cat-title">${cat}</div>
      ${items.filter(i => i.category === cat).map(item => {
        const stock = getMarketStock(item.id);
        const canAfford = G.player.gold >= item.price;
        const stockLabel = item.stock ? `（剩余${stock}件）` : '';
        return `<div class="market-item">
          <div class="market-item-info">
            <div class="market-item-name">${item.name}${stockLabel}</div>
            <div class="market-item-desc">${item.desc}</div>
          </div>
          <div class="market-item-right">
            <div class="market-item-price">${item.price}G</div>
            <button class="btn-buy${canAfford?'':' insufficient'}" data-id="${item.id}" ${canAfford?'':'disabled'}>购买</button>
          </div>
        </div>`;
      }).join('')}
    `).join('')}
  `;

  body.querySelectorAll('.btn-buy:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const result = buyItem(btn.dataset.id);
      const msgEl = document.getElementById('market-msg');
      if (msgEl) {
        msgEl.textContent = result.msg;
        msgEl.className = `market-msg ${result.ok ? 'market-msg-ok' : 'market-msg-err'}`;
        msgEl.style.display = 'block';
        setTimeout(() => msgEl.style.display = 'none', 2500);
      }
      if (result.ok) { renderMarketModal(); renderInventoryPanel(); }
    });
  });
}
