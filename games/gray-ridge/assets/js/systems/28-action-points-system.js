// ══════════════════════════════
// ACTION POINTS SYSTEM (幼崽期) — 主页面内嵌版
// 12点/年，每点=1个月，4羁绊+4成长+4自由
// 流程：选择 → AI推剧情 → 剧情完成提示 → 消耗行动点
// ══════════════════════════════

const AP_PER_YEAR  = 12;
const AP_BOND_MAX  = 4;
const AP_GROW_MAX  = 4;
const AP_FREE_MAX  = 4;

// ── 渲染主面板（内嵌在主页面） ──────────────────────────────
function renderApPanel() {
  const panel   = document.getElementById('ap-inline-panel');
  const pending = document.getElementById('ap-pending-banner');
  const nextBtn = document.getElementById('ap-next-year-btn');
  if (!panel) return;

  // 仅幼崽期显示
  if (G.phase !== 'cub') {
    panel.classList.remove('visible');
    pending?.classList.remove('visible');
    nextBtn?.classList.remove('visible');
    return;
  }
  panel.classList.add('visible');

  if (!G.apUsedThisYear) G.apUsedThisYear = [];

  const used      = G.apUsedThisYear.length;
  const remaining = AP_PER_YEAR - used;
  const bondUsed  = G.apUsedThisYear.filter(a => a.type === 'bond').length;
  const growUsed  = G.apUsedThisYear.filter(a => a.type === 'grow').length;
  const freeUsed  = G.apUsedThisYear.filter(a => a.type === 'free').length;
  const bondLimit = AP_BOND_MAX + (G._freeToBond || 0);
  const growLimit = AP_GROW_MAX + (G._freeToGrow || 0);
  const freeLimit = AP_FREE_MAX - (G._freeToBond || 0) - (G._freeToGrow || 0);
  const bondLeft  = Math.max(0, bondLimit - bondUsed);
  const growLeft  = Math.max(0, growLimit - growUsed);
  const freeLeft  = Math.max(0, freeLimit - freeUsed);

  // 待完成行动点提示
  if (G.apPending) {
    if (pending) {
      pending.textContent = `⏳ 正在进行：${G.apPending.label} — 请继续对话推进剧情，出现提示后行动点将自动完成`;
      pending.classList.add('visible');
    }
    panel.classList.remove('visible'); // 剧情推进中隐藏选择面板
    nextBtn?.classList.remove('visible');
    return;
  }
  pending?.classList.remove('visible');

  // 所有点用完，显示进入下一年
  if (remaining === 0) {
    panel.innerHTML = `
      <div class="ap-header">
        <div class="ap-title">行动点</div>
        <div class="ap-year-label">第${G.gameYear}年 · 全部完成</div>
      </div>
      <div class="ap-dots">${_renderDots()}</div>
      <div style="font-family:var(--fell);font-style:italic;font-size:13px;color:var(--text3);text-align:center;padding:10px 0">这一年的故事已经写完了。</div>`;
    if (nextBtn) nextBtn.classList.add('visible');
    return;
  }
  nextBtn?.classList.remove('visible');

  // 正常渲染选择面板
  panel.innerHTML = `
    <div class="ap-header">
      <div class="ap-title">行动点</div>
      <div class="ap-year-label">第${G.gameYear}年 · 剩余 <span style="color:var(--gold);font-weight:700">${remaining}</span> 月</div>
    </div>
    <div class="ap-dots">${_renderDots()}</div>
    <div class="ap-categories">
      ${bondLeft > 0 ? _renderBondBlock(bondLeft) : ''}
      ${growLeft > 0 ? _renderGrowBlock(growLeft) : ''}
      ${freeLeft > 0 ? _renderFreeBlock(freeLeft) : ''}
      ${bondLeft === 0 && growLeft === 0 && freeLeft === 0 ? '<div style="font-family:var(--hud);font-size:10px;color:var(--text3);text-align:center;padding:8px">所有分类已用完，等待本年最后剧情完成</div>' : ''}
    </div>`;
}

// ── 点状进度渲染 ──────────────────────────────────────────
function _renderDots() {
  return Array.from({ length: AP_PER_YEAR }, (_, i) => {
    const e = G.apUsedThisYear?.[i];
    if (!e) return '<div class="ap-dot"></div>';
    return `<div class="ap-dot ${e.type}" title="${_dotTitle(e)}"></div>`;
  }).join('');
}
function _dotTitle(e) {
  if (e.type === 'bond') return '羁绊·' + (e.charName || '');
  if (e.type === 'grow') return '成长·' + (e.statName || '');
  return '自由';
}

// ── 羁绊点区块 ───────────────────────────────────────────
function _renderBondBlock(left) {
  const rows = CHARS.map(c => {
    const b = G.bonds[c.id] || {};
    const attrs = (c.attrs || []).map(k => STATS_DEF.find(s => s.key === k)?.name || k).join('/');
    return `<div class="ap-char-btn" onclick="startApBond('${c.id}')">
      <span class="ap-char-name">${c.name}<span class="ap-char-species">${c.species}</span></span>
      <span class="ap-char-attrs">${attrs} · 好感${b.value || 0}%</span>
    </div>`;
  }).join('');
  return `
    <div class="ap-cat-block">
      <div class="ap-cat-header bond-hd" onclick="toggleApCat('bond-body')">
        <span class="ap-cat-label bond-lbl">🐾 人物羁绊</span>
        <span class="ap-cat-count">剩余 <span>${left}</span> 次</span>
      </div>
      <div class="ap-cat-body" id="bond-body">
        <div class="ap-char-list">${rows}</div>
      </div>
    </div>`;
}

// ── 成长点区块 ───────────────────────────────────────────
function _renderGrowBlock(left) {
  const btns = STATS_DEF.map(s =>
    `<div class="ap-stat-btn" onclick="startApGrow('${s.key}')">
      ${s.name}<span class="ap-stat-val">${G.stats[s.key] || 0}</span>
    </div>`
  ).join('');
  return `
    <div class="ap-cat-block">
      <div class="ap-cat-header grow-hd" onclick="toggleApCat('grow-body')">
        <span class="ap-cat-label grow-lbl">📈 数值提升</span>
        <span class="ap-cat-count">剩余 <span>${left}</span> 次</span>
      </div>
      <div class="ap-cat-body" id="grow-body">
        <div class="ap-stat-grid">${btns}</div>
      </div>
    </div>`;
}

// ── 自由点区块 ───────────────────────────────────────────
function _renderFreeBlock(left) {
  return `
    <div class="ap-cat-block">
      <div class="ap-cat-header free-hd" onclick="toggleApCat('free-body')">
        <span class="ap-cat-label free-lbl">⭐ 自由行动</span>
        <span class="ap-cat-count">剩余 <span>${left}</span> 次</span>
      </div>
      <div class="ap-cat-body" id="free-body">
        <div style="font-family:var(--hud);font-size:10px;color:var(--text2);margin-bottom:8px;letter-spacing:0.5px">可转为羁绊或成长，也可自由探索驻地</div>
        <div class="ap-free-row">
          <div class="ap-free-btn to-bond" onclick="convertFreeAp('bond')">→ 追加羁绊点</div>
          <div class="ap-free-btn to-grow" onclick="convertFreeAp('grow')">→ 追加成长点</div>
        </div>
        <div class="ap-char-btn" style="margin-top:8px" onclick="startApFree()">
          <span class="ap-char-name">自由探索驻地</span>
          <span class="ap-char-attrs">随机互动 · 发现隐藏剧情</span>
        </div>
      </div>
    </div>`;
}

// ── 展开/折叠分类 ─────────────────────────────────────────
function toggleApCat(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('open');
}

// ══════════════════════════════
// 行动点触发流程
// ══════════════════════════════

// ── 羁绊互动 ─────────────────────────────────────────────
function startApBond(charId) {
  const bondUsed  = (G.apUsedThisYear || []).filter(a => a.type === 'bond').length;
  const bondLimit = AP_BOND_MAX + (G._freeToBond || 0);
  if (bondUsed >= bondLimit) { showToast('羁绊点已用完'); return; }
  if ((G.apUsedThisYear || []).length >= AP_PER_YEAR) { showToast('行动点已全部使用'); return; }

  const c = CHARS.find(x => x.id === charId);
  if (!c) return;

  // 标记待完成
  G.apPending = { type: 'bond', charId, charName: c.name, label: '与 ' + c.name + ' 互动' };
  saveGame();
  renderApPanel();

  // 触发AI剧情
  const month = (G.apUsedThisYear?.length || 0) + 1;
  G.history.push({
    role: 'user',
    content: `[行动点·羁绊互动 第${G.gameYear}年第${month}月]
与 ${c.name}（${c.species}）度过这个月。请描述幼崽期一段有质感的互动场景（150-250字）。
场景要自然，体现角色性格和兽化特征。
当互动推进到羁绊加深的关键时刻，在叙事中明确出现「【羁绊达成】」标记，然后在horae中返回 bond_delta > 0。
[OPTIONS] 最后给出2-3个选项推动这段互动。`
  });
  callAI();
}

// ── 数值成长 ─────────────────────────────────────────────
function startApGrow(statKey) {
  const growUsed  = (G.apUsedThisYear || []).filter(a => a.type === 'grow').length;
  const growLimit = AP_GROW_MAX + (G._freeToGrow || 0);
  if (growUsed >= growLimit) { showToast('成长点已用完'); return; }
  if ((G.apUsedThisYear || []).length >= AP_PER_YEAR) { showToast('行动点已全部使用'); return; }

  const s = STATS_DEF.find(x => x.key === statKey);
  if (!s) return;

  G.apPending = { type: 'grow', statKey, statName: s.name, label: s.name + ' 成长训练' };
  saveGame();
  renderApPanel();

  const month = (G.apUsedThisYear?.length || 0) + 1;
  G.history.push({
    role: 'user',
    content: `[行动点·成长训练 第${G.gameYear}年第${month}月]
这个月专注于提升「${s.name}」（当前值：${G.stats[statKey] || 0}）。请描述训练/学习/经历的场景（150-250字），体现幼崽的成长过程。
可以有队友的指导或陪伴，体现兽化特征。
当场景推进到明显成长的时刻，在叙事中出现「【成长达成】」标记，然后在horae中返回 stat_gain。
[OPTIONS] 给出2-3个选项推动场景。`
  });
  callAI();
}

// ── 自由行动 ─────────────────────────────────────────────
function startApFree() {
  const freeUsed  = (G.apUsedThisYear || []).filter(a => a.type === 'free').length;
  const freeLimit = AP_FREE_MAX - (G._freeToBond || 0) - (G._freeToGrow || 0);
  if (freeUsed >= freeLimit) { showToast('自由点已用完'); return; }
  if ((G.apUsedThisYear || []).length >= AP_PER_YEAR) { showToast('行动点已全部使用'); return; }

  G.apPending = { type: 'free', label: '自由探索' };
  saveGame();
  renderApPanel();

  const month = (G.apUsedThisYear?.length || 0) + 1;
  G.history.push({
    role: 'user',
    content: `[行动点·自由行动 第${G.gameYear}年第${month}月]
这个月自由探索灰脊驻地。请描述一段随机的日常场景（150-250字），可能遇到任意角色，发现驻地的某个角落或隐藏细节。体现幼崽视角的好奇心和本能反应。
当场景推进到有意义的结尾时，在叙事中出现「【行动完成】」标记。
[OPTIONS] 给出2-3个选项。`
  });
  callAI();
}

// ── 自由点转换 ────────────────────────────────────────────
function convertFreeAp(type) {
  if (!G.apUsedThisYear) G.apUsedThisYear = [];
  G.apUsedThisYear.push({ type: 'free', convertTo: type, year: G.gameYear });
  if (type === 'bond') G._freeToBond = (G._freeToBond || 0) + 1;
  else G._freeToGrow = (G._freeToGrow || 0) + 1;
  saveGame();
  renderApPanel();
  showToast(type === 'bond' ? '自由点 → 羁绊点 ✓' : '自由点 → 成长点 ✓');
}

// ══════════════════════════════
// 行动点完成回调（由 process-ai-response 调用）
// 检测AI叙事中的达成标记，消耗行动点
// ══════════════════════════════
function checkApCompletion(narrativeText, horae) {
  if (!G.apPending) return;

  const p = G.apPending;
  const hasAchieve =
    narrativeText.includes('【羁绊达成】') ||
    narrativeText.includes('【成长达成】') ||
    narrativeText.includes('【行动完成】') ||
    (horae?.bond_delta > 0 && p.type === 'bond') ||
    (horae?.stat_gain   && p.type === 'grow');

  if (!hasAchieve) return; // 剧情还未结束，继续对话

  if (!G.apUsedThisYear) G.apUsedThisYear = [];

  if (p.type === 'bond') {
    const c = CHARS.find(x => x.id === p.charId);
    const b = G.bonds[p.charId];
    if (c && b) {
      const gain = 10 + Math.floor(Math.random() * 8);
      b.value = Math.min(100, (b.value || 0) + gain);
      if (b.value >= 100 && (b.stage || 0) < 6) {
        b.stage = (b.stage || 0) + 1;
        b.value = 0;
        showToast('🐾 ' + c.name + ' 关系升级：' + (BOND_STAGES[b.stage] || ''));
      } else {
        showToast('🐾 ' + c.name + ' 羁绊 +' + gain);
      }
      // 小幅属性成长
      (c.attrs || []).forEach(k => { G.stats[k] = (G.stats[k] || 0) + 1; });
    }
    G.apUsedThisYear.push({ type: 'bond', charId: p.charId, charName: p.charName, year: G.gameYear });

  } else if (p.type === 'grow') {
    G.stats[p.statKey] = (G.stats[p.statKey] || 0) + 2;
    showToast('📈 ' + p.statName + ' +2');
    G.apUsedThisYear.push({ type: 'grow', statKey: p.statKey, statName: p.statName, year: G.gameYear });

  } else if (p.type === 'free') {
    G.apUsedThisYear.push({ type: 'free', year: G.gameYear });
  }

  G.apPending = null;
  saveGame();
  updateStatsBar();
  renderBonds();
  renderStatus();
  renderApPanel();

  // 月份推进提示
  const used = G.apUsedThisYear.length;
  const month = Math.min(used, 12);
  showToast(`第${G.gameYear}年 第${month}月 完成`);
}

// ══════════════════════════════
// 进入下一年（12点全用完后）
// ══════════════════════════════
function advanceYear() {
  if ((G.apUsedThisYear || []).length < AP_PER_YEAR) {
    showToast('还有行动点未使用'); return;
  }

  // 年度重置
  G.gameYear = (G.gameYear || 1) + 1;
  G.apUsedThisYear = [];
  G._freeToBond = 0;
  G._freeToGrow = 0;
  G.apPending = null;
  G.absoluteYear = (G.absoluteYear || 2060) + 1;

  // 7年后成年
  if (G.gameYear > 7) {
    G.phase = 'adult';
    G.gameYear = 1;
    G.gameWeek = 1;
    showToast('🎉 成年了！进入成人期');
    addSysMsg('时光流转', '七年过去了。你长大了。');
    G.history.push({
      role: 'user',
      content: '[里程碑：幼崽期结束，玩家正式成年。请用一段深情的过渡叙事，描述七年的成长和即将开启的新阶段。]'
    });
    callAI();
  } else {
    showToast(`第${G.gameYear}年开始`);
    addSysMsg('时光流转', `第${G.gameYear}年到来了。`);
    G.history.push({
      role: 'user',
      content: `[年度开场：幼崽期第${G.gameYear}年开始。请用简短的季节/时光叙事开启新的一年，带出驻地的氛围变化。]`
    });
    callAI();
  }

  saveGame();
  updateTopBar();
  renderBonds();
  renderStatus();
  renderApPanel();
  document.getElementById('ap-next-year-btn')?.classList.remove('visible');
}
