// ── 炼药系统 ──────────────────────────────────────────────

const INGREDIENTS = {
  // 东方材料
  lingrass:     { id:'lingrass',    name:'灵草',       type:'ingredient', origin:'east',    desc:'仙山灵气凝聚，炼丹基础材料。' },
  zhusha:       { id:'zhusha',      name:'朱砂',       type:'ingredient', origin:'east',    desc:'稳定灵力的矿石精华。' },
  tigerwhisker: { id:'tigerwhisker',name:'虎须',       type:'ingredient', origin:'east',    desc:'白虎精华，强化体魄之效。' },
  snowlotus:    { id:'snowlotus',   name:'天山雪莲',   type:'ingredient', origin:'east',    desc:'清心安神，化解冲突圣品。' },
  dragonfly:    { id:'dragonfly',   name:'金蝉衣',     type:'ingredient', origin:'east',    desc:'蝉蜕升华，增强灵觉。' },
  cinnabar:     { id:'cinnabar',    name:'辰砂',       type:'ingredient', origin:'east',    desc:'常用于稳定炼丹。' },
  hotpot_base:  { id:'hotpot_base', name:'火锅底料',   type:'ingredient', origin:'east',    desc:'从行囊深处找出的家乡香料包。' },
  // 西方材料
  aconite:      { id:'aconite',     name:'乌头草',     type:'ingredient', origin:'west',    desc:'西方常见草药，有毒，需处理。' },
  bezoar:       { id:'bezoar',      name:'牛黄石',     type:'ingredient', origin:'west',    desc:'解毒圣品，西方炼药必备。' },
  moonwater:    { id:'moonwater',   name:'满月水',     type:'ingredient', origin:'west',    desc:'满月之夜收集的露水，魔力传导好。' },
  dragblood:    { id:'dragblood',   name:'龙血',       type:'ingredient', origin:'west',    desc:'极稀有，效果极强。' },
  mandragora:   { id:'mandragora',  name:'曼德拉草根', type:'ingredient', origin:'west',    desc:'西方炼药重要材料。' },
  unicornhair:  { id:'unicornhair', name:'独角兽毛',   type:'ingredient', origin:'west',    desc:'强大的魔力载体。' },
  // 特殊材料
  ghostpowder:  { id:'ghostpowder', name:'幽灵粉末',   type:'ingredient', origin:'special', desc:'成分不明的神秘粉末，隐形药水必需。' },
};

const RECIPES = [
  // ── 东方丹药 ─────────────────────────────────────────
  {
    id: 'huiqi_dan', name: '回气丹', origin: 'east', icon: '丹', diff: 10,
    ing: { lingrass:2, zhusha:1 },
    desc: '恢复灵力，轻度压制灵魔冲突。',
    norm: { id:'huiqi_dan', name:'回气丹', type:'potion', desc:'灵力+15，冲突值-5。', usable:true, effect:{ stat:'lingLi', val:15, conflict:-5 } },
    perf: { effect:{ stat:'lingLi', val:25, conflict:-10 } }
  },
  {
    id: 'jusing_wan', name: '聚神丸', origin: 'east', icon: '神', diff: 12,
    ing: { snowlotus:1, cinnabar:1 },
    desc: '凝神静心，增强心境。',
    norm: { id:'jusing_wan', name:'聚神丸', type:'potion', desc:'心境+12。', usable:true, effect:{ stat:'xinJing', val:12 } },
    perf: { effect:{ stat:'xinJing', val:20 } }
  },
  {
    id: 'huashu_tang', name: '化冲汤', origin: 'east', icon: '化', diff: 15,
    ing: { snowlotus:1, lingrass:2, moonwater:1 },
    desc: '东方秘方，专门化解灵魔冲突。',
    norm: { id:'huashu_tang', name:'化冲汤', type:'potion', desc:'冲突值-20。', usable:true, effect:{ conflict:-20 } },
    perf: { effect:{ conflict:-35 } }
  },
  // ── 西方魔药 ─────────────────────────────────────────
  {
    id: 'healing_potion', name: '治愈药水', origin: 'west', icon: '愈', diff: 8,
    ing: { aconite:1, bezoar:1 },
    desc: '基础恢复药剂，战斗外可用。',
    norm: { id:'healing_potion', name:'治愈药水', type:'potion', desc:'战斗中HP+8；非战斗时体魄+10。', usable:true, effect:{ hp:8, stat:'tiPo', val:10 } },
    perf: { effect:{ hp:15, stat:'tiPo', val:18 } }
  },
  {
    id: 'shield_potion', name: '护盾药水', origin: 'west', icon: '盾', diff: 13,
    ing: { moonwater:2, mandragora:1 },
    desc: '战斗中增强防御，持续2回合。',
    norm: { id:'shield_potion', name:'护盾药水', type:'potion', desc:'战斗防御+3，持续2回合。', usable:true, effect:{ combatBuff:'def', val:3, rounds:2 } },
    perf: { effect:{ combatBuff:'def', val:5, rounds:3 } }
  },
  {
    id: 'invisible_potion', name: '隐形药水', origin: 'west', icon: '隐', diff: 16,
    ing: { moonwater:1, unicornhair:1, ghostpowder:1 },
    desc: '短暂隐形，深夜潜行不可缺。',
    norm: { id:'invisible_potion', name:'隐形药水', type:'potion', desc:'使用后进入隐形状态，可触发深夜特殊剧情。', usable:true, effect:{ flag:'invisible', duration:1 } },
    perf: { effect:{ flag:'invisible', duration:2 } }
  },
  // ── 东西融合配方 ──────────────────────────────────────
  {
    id: 'fusion_pill', name: '两仪融合丹', origin: 'fusion', icon: '融', diff: 18,
    ing: { snowlotus:1, dragblood:1, moonwater:1, zhusha:1 },
    desc: '高风险高收益。成功时大幅降低冲突并提升全属性；天然1触发灵力混乱。',
    norm: { id:'fusion_pill', name:'两仪融合丹', type:'potion', desc:'冲突值-30，全属性+8。', usable:true, effect:{ conflict:-30, allStats:8 } },
    perf: { effect:{ conflict:-50, allStats:15 } },
    failEffect: { conflict:20, stat:'lingLi', val:-10 }
  },
  {
    id: 'hotpot', name: '仙家火锅', origin: 'fusion', icon: '锅', diff: 6,
    ing: { hotpot_base:1, lingrass:1 },
    desc: '用魔药课的大锅煮出的特制火锅，和角色分享可增进好感。',
    norm: { id:'hotpot', name:'仙家火锅（一份）', type:'special', desc:'和特定角色分享时触发火锅夜特殊剧情。', usable:true, effect:{ flag:'hotpot_ready' } },
    perf: {}
  },
];

const RECIPE_MAP = Object.fromEntries(RECIPES.map(r => [r.id, r]));

// ─ 炼药工具 ─
function getIngQty(id) {
  const it = G.player.inventory.find(i => i.id === id && i.type === 'ingredient');
  return it ? (it.quantity || 1) : 0;
}

function canBrew(recipe) {
  return Object.entries(recipe.ing).every(([id, n]) => getIngQty(id) >= n);
}

function brewPotion(recipeId) {
  const recipe = RECIPE_MAP[recipeId];
  if (!recipe || !canBrew(recipe)) return null;

  // 消耗材料
  Object.entries(recipe.ing).forEach(([id, n]) => removeItem(id, n));

  const roll = rollD20();
  const bonus = Math.floor(G.player.stats.magicKnowledge.cur / 15)
              + Math.floor(G.player.stats.xinJing.cur / 20);
  const total = roll + bonus;

  // 天然1 — 爆炉
  if (roll === 1 && recipe.failEffect) {
    changeConflict(recipe.failEffect.conflict || 0);
    if (recipe.failEffect.stat) changeStat(recipe.failEffect.stat, recipe.failEffect.val || 0);
    unlockAchievement('fusion_fail');
    persistAll();
    return { success:false, quality:'fail', roll, total, msg:'天然1！炼炉爆炸，材料全毁！' };
  }

  let quality, item;
  if (total >= recipe.diff + 6) {
    quality = 'perfect';
    item = { ...recipe.norm, quality:'perfect', effect:{ ...recipe.norm.effect, ...(recipe.perf?.effect||{}) } };
    unlockAchievement('perfect_brew');
  } else if (total >= recipe.diff) {
    quality = 'normal';
    item = { ...recipe.norm, quality:'normal' };
  } else {
    quality = 'poor';
    item = { ...recipe.norm, name: recipe.norm.name + '（劣品）', quality:'poor' };
  }

  addItem(item);
  unlockAchievement('first_brew');
  if (recipe.origin === 'fusion') unlockAchievement('fusion_recipe');
  if (recipe.id === 'hotpot') unlockAchievement('hotpot_night');
  persistAll();

  return {
    success: true, quality, roll, total,
    msg: `${quality==='perfect'?'极品出炉！✦':quality==='poor'?'勉强炼成（劣品）':'炼制成功！'} (${roll}+${bonus}=${total})`
  };
}

function usePotion(itemId) {
  const item = G.player.inventory.find(i => i.id === itemId && i.usable);
  if (!item) return null;
  const eff = item.effect || {};
  const mult = item.quality === 'perfect' ? 1.5 : item.quality === 'poor' ? 0.6 : 1;

  if (eff.stat)      changeStat(eff.stat, Math.round((eff.val || 0) * mult));
  if (eff.allStats)  ['lingLi','magicKnowledge','xinJing','tiPo','renYuan'].forEach(s => changeStat(s, Math.round(eff.allStats * mult)));
  if (eff.conflict)  changeConflict(Math.round(eff.conflict * mult));
  if (eff.flag)      { G.flags[eff.flag] = eff.duration || 1; }
  if (eff.flag === 'invisible') unlockAchievement('night_wander');

  removeItem(itemId, 1);
  persistAll();
  return eff;
}

// ── 炼药 UI ───────────────────────────────────────────────
function openAlchemyModal() {
  document.getElementById('modal-alchemy').style.display = 'flex';
  renderAlchemyPanel();
}

function closeAlchemyModal() {
  document.getElementById('modal-alchemy').style.display = 'none';
}

function renderAlchemyPanel() {
  const cont = document.getElementById('alchemy-container');
  if (!cont) return;
  const activeTab = cont.dataset.tab || 'materials';

  cont.innerHTML = `
    <div class="alch-tabs">
      <button class="alch-tab ${activeTab==='materials'?'on':''}" data-tab="materials">材料</button>
      <button class="alch-tab ${activeTab==='recipes'?'on':''}" data-tab="recipes">配方</button>
      <button class="alch-tab ${activeTab==='brew'?'on':''}" data-tab="brew">炼制</button>
    </div>
    <div id="alch-body"></div>
  `;
  cont.querySelectorAll('.alch-tab').forEach(b => {
    b.addEventListener('click', () => { cont.dataset.tab = b.dataset.tab; renderAlchemyPanel(); });
  });

  const body = document.getElementById('alch-body');

  if (activeTab === 'materials') {
    const mats = G.player.inventory.filter(i => i.type === 'ingredient');
    if (!mats.length) {
      body.innerHTML = '<div class="empty-hint">尚无材料。探索禁忌森林或前往黑市购买。</div>';
      return;
    }
    body.innerHTML = mats.map(i => {
      const ing = INGREDIENTS[i.id] || {};
      const originTag = ing.origin === 'west' ? '西' : ing.origin === 'special' ? '秘' : '东';
      const originCls = ing.origin === 'west' ? 'origin-west' : ing.origin === 'special' ? 'origin-special' : 'origin-east';
      return `<div class="alch-mat">
        <span class="alch-origin ${originCls}">${originTag}</span>
        <div class="alch-mat-info">
          <span class="alch-mat-name">${i.name}</span>
          <span class="alch-mat-desc">${ing.desc || ''}</span>
        </div>
        <span class="alch-mat-qty">×${i.quantity || 1}</span>
      </div>`;
    }).join('');
  }

  if (activeTab === 'recipes') {
    body.innerHTML = RECIPES.map(r => {
      const ok = canBrew(r);
      const ingList = Object.entries(r.ing).map(([id, n]) => {
        const have = getIngQty(id);
        const nm = INGREDIENTS[id]?.name || id;
        return `<span class="${have >= n ? 'req-ok' : 'req-miss'}">${nm}×${n}(有${have})</span>`;
      }).join(' ');
      const tagLabel = { east:'东方丹药', west:'西方魔药', fusion:'东西融合', special:'特殊' }[r.origin] || '';
      return `<div class="alch-recipe ${ok ? 'alch-can' : ''}">
        <div class="alch-r-header">
          <span class="alch-icon">${r.icon}</span>
          <span class="alch-r-name">${r.name}</span>
          <span class="alch-r-tag">${tagLabel}</span>
          ${ok ? '<span class="alch-can-badge">可炼制</span>' : ''}
        </div>
        <div class="alch-r-desc">${r.desc}</div>
        <div class="alch-r-ing">${ingList}</div>
      </div>`;
    }).join('');
  }

  if (activeTab === 'brew') {
    const brewable = RECIPES.filter(canBrew);
    if (!brewable.length) {
      body.innerHTML = '<div class="empty-hint">没有足够的材料可以炼制。收集材料后回来。</div>';
      return;
    }
    body.innerHTML = brewable.map(r => `
      <div class="alch-brew-row">
        <div>
          <div class="alch-r-name">${r.icon} ${r.name}</div>
          <div class="alch-r-desc">${r.desc}</div>
        </div>
        <button class="btn-brew" data-recipe="${r.id}">炼制</button>
      </div>`).join('');

    body.querySelectorAll('.btn-brew').forEach(b => {
      b.addEventListener('click', () => {
        const res = brewPotion(b.dataset.recipe);
        if (res) showBrewResult(res);
        renderAlchemyPanel();
      });
    });
  }
}

function showBrewResult(res) {
  const toast = document.getElementById('brew-toast');
  if (!toast) return;
  const icon = { perfect:'✦', normal:'✓', poor:'⚠', fail:'💥' }[res.quality] || '•';
  toast.textContent = `${icon} ${res.msg}`;
  toast.className = `brew-toast qt-${res.quality}`;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 3500);
}
