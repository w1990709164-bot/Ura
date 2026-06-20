// ── UI 渲染 ───────────────────────────────────────────────

// ─ 屏幕切换 ─
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${id}`);
  if (el) el.classList.add('active');
  // 游戏主界面已有顶栏返回链接，隐藏全局悬浮按钮
  const floatBack = document.querySelector('.liworld-back');
  if (floatBack) floatBack.style.display = id === 'game' ? 'none' : '';
}

// ─ 顶栏更新 ─
function updateTopBar() {
  const dateEl = document.getElementById('display-date');
  const timeEl = document.getElementById('display-time');
  if (dateEl) dateEl.textContent = formatDate();
  if (timeEl) timeEl.textContent = formatTime();

  const badge = document.getElementById('house-badge');
  if (badge && G.player.house) {
    const h = HOUSES[G.player.house];
    badge.textContent = h.symbol;
    badge.style.color = h.accent;
    badge.title = h.name;
  }
}

// ─ 故事文本渲染 ─
function renderStory(text) {
  const el = document.getElementById('story-text');
  if (!el) return;

  // 将纯文本转为HTML
  // 格式：角色名: "native" 「translation」→ 对话块
  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim());
  el.innerHTML = paragraphs.map(p => {
    const trimmed = p.trim();
    // 检测对话行（包含"和「）
    if ((trimmed.includes('"') || trimmed.includes('“') || trimmed.includes('"')) && trimmed.includes('「')) {
      // 拆出母语原文和中文翻译
      const formatted = trimmed
        .replace(/"([^"]+)"/g, '<span class="native-text">"$1"</span>')
        .replace(/“([^”]+)”/g, '<span class="native-text">“$1”</span>')
        .replace(/「([^」]+)」/g, '<span class="cn-trans">「$1」</span>');
      return `<p class="story-dialogue">${formatted}</p>`;
    }
    // 环境/氛围描写（以*开头或结尾，或纯景物描写）
    return `<p class="story-para">${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  // 滚动到底部
  const scrollArea = document.getElementById('story-scroll-area');
  if (scrollArea) setTimeout(() => scrollArea.scrollTop = scrollArea.scrollHeight, 50);
}

// ─ 选项渲染 ─
function renderOptions(options) {
  const list = document.getElementById('options-list');
  if (!list) return;
  list.innerHTML = options.map((opt, i) =>
    `<button class="option-btn" data-index="${i}">${opt}</button>`
  ).join('');
  list.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.textContent;
      handlePlayerChoice(text);
    });
  });
}

// ─ 加载状态 ─
function setLoading(on) {
  const loading = document.getElementById('story-loading');
  const regen   = document.getElementById('btn-regenerate');
  const optArea = document.getElementById('options-area');
  if (loading) loading.style.display = on ? 'flex' : 'none';
  if (regen)   regen.style.display   = 'none';
  if (optArea) {
    // 只禁用选项按钮，保留自定义输入发送功能
    optArea.querySelectorAll('.option-btn').forEach(b => b.disabled = on);
  }
}

function showRegenButton() {
  const regen = document.getElementById('btn-regenerate');
  if (regen) regen.style.display = 'block';
}

// ─ 角色面板渲染 ─
function renderCharactersPanel() {
  const container = document.getElementById('house-accordion');
  if (!container) return;

  const houseOrder = ['gryffindor','slytherin','ravenclaw','hufflepuff'];
  container.innerHTML = houseOrder.map(houseId => {
    const h = HOUSES[houseId];
    const chars = CHARACTERS.filter(c => c.house === houseId);
    const charCards = chars.map(c => {
      const cs = G.characters[c.id];
      const stage = AFFECTION_STAGES[cs.stage]?.name || '陌生人';
      const bar = Math.round((cs.affection / 100) * 100);

      return `<div class="char-card" data-char="${c.id}">
        <div class="char-card-name" style="color:${c.color};">${c.name}</div>
        <div class="char-card-lang">${c.langLabel}</div>
        <div class="char-affection-row">
          <span class="aff-stage">${stage}</span>
          <div class="aff-bar"><div class="aff-fill" style="width:${bar}%;background:${h.accent};"></div></div>
          <span class="aff-val">${cs.affection}</span>
        </div>
        <div class="char-meta-row">
          <span class="meta-label">位置</span>
          <span class="meta-val">${cs.location || '未知'}</span>
        </div>
        <div class="char-psychology">${cs.psychology || '...'}</div>
      </div>`;
    }).join('');

    return `<div class="house-section">
      <div class="house-header" data-house="${houseId}">
        <span class="house-symbol">${h.symbol}</span>
        <span class="house-name" style="color:${h.accent};">${h.name}</span>
        <span class="house-chevron">▶</span>
      </div>
      <div class="house-body" id="house-body-${houseId}">${charCards}</div>
    </div>`;
  }).join('');

  // 折叠/展开
  container.querySelectorAll('.house-header').forEach(header => {
    header.addEventListener('click', () => {
      const houseId = header.dataset.house;
      const body = document.getElementById(`house-body-${houseId}`);
      const chevron = header.querySelector('.house-chevron');
      const isOpen = body.classList.contains('open');
      body.classList.toggle('open', !isOpen);
      if (chevron) chevron.textContent = isOpen ? '▶' : '▼';
    });
  });

  // 玩家学院默认展开
  if (G.player.house) {
    const myBody = document.getElementById(`house-body-${G.player.house}`);
    if (myBody) {
      myBody.classList.add('open');
      const myHeader = myBody.previousElementSibling;
      const chevron = myHeader?.querySelector('.house-chevron');
      if (chevron) chevron.textContent = '▼';
    }
  }
}

// ─ 背包面板渲染 ─
function renderInventoryPanel() {
  const goldEl = document.getElementById('gold-amount');
  if (goldEl) goldEl.textContent = G.player.gold;

  const list = document.getElementById('inventory-list');
  if (!list) return;

  // 分类显示：特殊/药剂 vs 材料
  const potions = G.player.inventory.filter(i => i.type === 'potion' || i.type === 'special');
  const materials = G.player.inventory.filter(i => i.type === 'ingredient');
  const others = G.player.inventory.filter(i => !i.type || i.type === 'item');

  const allDisplay = [...others, ...potions];

  if (!allDisplay.length && !materials.length) {
    list.innerHTML = '<div class="empty-hint">背包空空如也</div>';
  } else {
    let html = '';
    if (allDisplay.length) {
      html += allDisplay.map(item => {
        const qualTag = item.quality === 'perfect' ? '<span class="qual-tag qt-perfect">极品</span>'
                      : item.quality === 'poor'    ? '<span class="qual-tag qt-poor">劣品</span>' : '';
        return `<div class="inventory-item" data-item-id="${item.id}">
          <div class="item-name">${item.name}${qualTag}</div>
          <div class="item-qty">×${item.quantity || 1}</div>
        </div>`;
      }).join('');
    }
    if (materials.length) {
      html += `<div class="inv-section-label">炼药材料 (${materials.length}种)</div>`;
      html += materials.map(item =>
        `<div class="inventory-item inv-material" data-item-id="${item.id}">
          <div class="item-name">${item.name}</div>
          <div class="item-qty">×${item.quantity || 1}</div>
        </div>`
      ).join('');
    }
    list.innerHTML = html;
  }

  list.querySelectorAll('.inventory-item').forEach(el => {
    el.addEventListener('click', () => openItemModal(el.dataset.itemId));
  });

  // 黑市按钮可见性
  const marketBtn = document.getElementById('btn-open-market');
  if (marketBtn) marketBtn.style.display = G.flags?.marketUnlocked ? 'block' : 'none';
}

// ─ 道具弹窗 ─
let _openItemId = null;
function openItemModal(itemId) {
  const item = G.player.inventory.find(i => i.id === itemId);
  if (!item) return;
  _openItemId = itemId;

  document.getElementById('modal-item-name').textContent = item.name;
  document.getElementById('modal-item-desc').textContent = item.desc || '无描述';
  document.getElementById('modal-item-source').textContent = item.source || (item.type === 'ingredient' ? '探索/黑市获取' : '炼制/购买');
  document.getElementById('modal-item').style.display = 'flex';

  const useBtn = document.getElementById('btn-use-item');
  if (useBtn) {
    useBtn.style.display = item.usable ? 'block' : 'none';
    useBtn.dataset.itemId = itemId;
  }
}

function closeItemModal() {
  document.getElementById('modal-item').style.display = 'none';
}

// ─ 记录面板渲染 ─
function renderRecordsPanel() {
  renderAchievements();
  renderSaveSlots();
  renderApiDisplay();
}

function renderAchievements() {
  const countEl = document.getElementById('achievement-count');
  if (countEl) countEl.textContent = G.unlockedAchievements.length;

  const grid = document.getElementById('achievements-grid');
  if (!grid) return;

  const catOrder = ['story','relation','combat','craft','stat','house'];
  const catNames = { story:'剧情', relation:'关系', combat:'战斗', craft:'探索', stat:'数值', house:'学院' };

  grid.innerHTML = catOrder.map(cat => {
    const items = ACHIEVEMENTS.filter(a => a.cat === cat);
    const cells = items.map(a => {
      const unlocked = G.unlockedAchievements.includes(a.id);
      if (a.hidden && !unlocked) return ''; // 隐藏成就未解锁不显示
      return `<div class="ach-cell ${unlocked ? 'unlocked' : 'locked'}" title="${unlocked ? a.desc : '???'}">
        <div class="ach-icon">${unlocked ? a.icon : '？'}</div>
        <div class="ach-name">${unlocked ? a.name : '未知'}</div>
      </div>`;
    }).join('');
    if (!cells.trim()) return '';
    return `<div class="ach-category">
      <div class="ach-cat-title">${catNames[cat]}</div>
      <div class="ach-grid">${cells}</div>
    </div>`;
  }).join('');
}

function renderSaveSlots() {
  document.querySelectorAll('.save-slot').forEach(slot => {
    const idx = parseInt(slot.dataset.slot);
    const save = G.saves[idx];
    const info = slot.querySelector('.save-info');
    if (info) {
      info.textContent = save
        ? `存档位 ${idx+1} · ${save.dateLabel} ${save.timeLabel}`
        : `存档位 ${idx+1} · 空`;
    }
  });
}

function renderApiDisplay() {
  const cfg = getApiConfig();
  const epEl = document.getElementById('api-display-endpoint');
  const mdEl = document.getElementById('api-display-model');
  if (epEl) epEl.textContent = cfg.url || 'Anthropic官方';
  if (mdEl) mdEl.textContent = cfg.model || '未设置';
}

// ─ 成就弹出通知 ─
function showAchievementToast(id) {
  const ach = ACH_MAP[id];
  if (!ach) return;
  const modal = document.getElementById('modal-achievement');
  const nameEl = document.getElementById('achievement-popup-name');
  if (!modal || !nameEl) return;
  nameEl.textContent = `${ach.icon} ${ach.name}`;
  modal.style.display = 'flex';
  setTimeout(() => modal.style.display = 'none', 2800);
}

// ─ Tab切换 ─
function switchTab(panelId) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(`panel-${panelId}`);
  if (panel) panel.classList.add('active');
  const btn = document.querySelector(`.nav-btn[data-panel="${panelId}"]`);
  if (btn) btn.classList.add('active');

  // 切换到对应面板时刷新数据
  if (panelId === 'characters') renderCharactersPanel();
  if (panelId === 'inventory')  renderInventoryPanel();
  if (panelId === 'records')    renderRecordsPanel();
}

// ─ 选项区折叠/展开 ─
let optionsExpanded = true;
function toggleOptions() {
  optionsExpanded = !optionsExpanded;
  const list = document.getElementById('options-list');
  const handle = document.getElementById('options-toggle');
  if (list) list.style.display = optionsExpanded ? 'flex' : 'none';
  if (handle) handle.textContent = optionsExpanded ? '▼' : '▲';
}
