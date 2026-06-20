// ── 主游戏逻辑 ────────────────────────────────────────────

// ── 初始化 ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  initCreationScreen();
  initSortingScreen();
  initGameScreen();

  const cfg = getApiConfig();
  if (!cfg.key || !cfg.model) {
    showScreen('no-api');
    return;
  }

  if (G.phase === 'game') {
    showScreen('game');
    try { updateTopBar(); } catch(e) { console.warn('updateTopBar:', e); }
    const hasRealStory = G.currentStory
      && !/故事即将开始|故事即將開始/.test(G.currentStory);
    if (hasRealStory) {
      renderStory(G.currentStory);
      renderOptions(G.currentOptions || []);
    } else {
      // 首次进入游戏，或旧存档只保存了占位文字。
      G.currentStory = '';
      G.currentOptions = [];
      enterGame();
    }
  } else if (G.phase === 'sorting') {
    showScreen('sorting');
    renderSortingQuestion();
  } else {
    showScreen('creation');
  }
});

// ── Creation Screen ────────────────────────────────────────
function initCreationScreen() {
  const nextBtn = document.getElementById('btn-creation-next');
  nextBtn?.addEventListener('click', () => {
    const name        = document.getElementById('char-name')?.value.trim();
    const age         = document.getElementById('char-age')?.value.trim();
    const appearance  = document.getElementById('char-appearance')?.value.trim();
    const personality = document.getElementById('char-personality')?.value.trim();
    const wandWood    = document.getElementById('wand-wood')?.value.trim();
    const wandCore    = document.getElementById('wand-core')?.value.trim();
    const wandLength  = document.getElementById('wand-length')?.value.trim();

    if (!name) { alert('请填写角色姓名'); return; }

    G.player.name        = name;
    G.player.age         = age || '17';
    G.player.appearance  = appearance || '东方面孔，气质出尘';
    G.player.personality = personality || '沉静，观察力强';
    G.player.wand        = {
      wood:   wandWood   || '青竹',
      core:   wandCore   || '白虎须',
      length: wandLength || '10英寸'
    };
    G.phase = 'sorting';
    G.sortingAnswerIndex = 0;
    G.sortingScores = { gryffindor:0, slytherin:0, ravenclaw:0, hufflepuff:0 };
    persistAll();
    showScreen('sorting');
    renderSortingQuestion();
  });
}

// ── Sorting Screen ─────────────────────────────────────────
function initSortingScreen() {
  document.getElementById('btn-enter-game')?.addEventListener('click', enterGame);
}

function renderSortingQuestion() {
  const idx = G.sortingAnswerIndex;
  const qContainer = document.getElementById('sorting-questions');
  const resultEl   = document.getElementById('sorting-result');
  const subtitle   = document.getElementById('sorting-subtitle');

  if (idx >= SORTING_QUESTIONS.length) {
    // 计算结果
    const scores = G.sortingScores;
    const topHouse = Object.entries(scores).sort((a,b) => b[1]-a[1])[0][0];
    const h = HOUSES[topHouse];
    G.player.house = topHouse;
    G.phase = 'game';
    persistAll();

    if (qContainer) qContainer.style.display = 'none';
    if (resultEl) {
      resultEl.style.display = 'block';
      document.getElementById('result-house-icon').textContent = h.symbol;
      document.getElementById('result-house-icon').style.color = h.accent;
      document.getElementById('result-house-name').textContent = h.name;
      document.getElementById('result-house-name').style.color = h.accent;
      document.getElementById('result-house-desc').textContent = getHouseDesc(topHouse);
    }
    if (subtitle) subtitle.textContent = '分院帽已做出决定。';
    unlockAchievement('sorted');
    return;
  }

  const q = SORTING_QUESTIONS[idx];
  if (subtitle) subtitle.textContent = `第 ${idx+1} / ${SORTING_QUESTIONS.length} 题`;
  if (resultEl) resultEl.style.display = 'none';
  if (qContainer) {
    qContainer.style.display = 'block';
    qContainer.innerHTML = `
      <div class="sorting-question">
        <div class="q-text">${q.text}</div>
        <div class="q-options">
          ${q.options.map((opt,i) =>
            `<button class="q-opt-btn" data-house="${opt.house}" data-idx="${i}">${opt.text}</button>`
          ).join('')}
        </div>
      </div>`;
    qContainer.querySelectorAll('.q-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const house = btn.dataset.house;
        G.sortingScores[house] = (G.sortingScores[house]||0) + 1;
        G.sortingAnswerIndex++;
        persistAll();
        renderSortingQuestion();
      });
    });
  }
}

function getHouseDesc(house) {
  const descs = {
    gryffindor: '分院帽感受到了你内心的勇气与正义——你属于格兰芬多。',
    slytherin:  '分院帽感受到了你内心的野心与智谋——你属于斯莱特林。',
    ravenclaw:  '分院帽感受到了你对知识的渴望与独特的思维——你属于拉文克劳。',
    hufflepuff: '分院帽感受到了你的忠诚与宽厚的心——你属于赫奇帕奇。'
  };
  return descs[house] || '';
}

// ── 进入游戏 ───────────────────────────────────────────────
async function enterGame() {
  showScreen('game');
  updateTopBar();
  unlockAchievement('arrival');

  // 先立即提供可玩的本地序章，避免慢速/失败 API 让页面停在占位文字。
  const houseId = HOUSES[G.player.house] ? G.player.house : 'gryffindor';
  G.player.house = houseId;
  const house = HOUSES[houseId];
  const fallbackStory = `九月一日的晨光穿过霍格沃茨大厅高处的彩色玻璃，在石板地面上割出一片片陌生的颜色。

分院帽刚刚喊出「${house.name}」时，长桌方向响起掌声。你从高脚凳上起身，袖口下的灵力却被城堡里无处不在的魔力轻轻推了一下——不像敌意，更像两种互不相识的潮水第一次碰面。

你握着那根用于融入这里的魔杖，清楚自己真正依赖的仍是经脉中熟悉的灵息。远处有人正在打量这位来自东方的交换生；楼梯已经开始改变方向，通往${house.name}公共休息室的路并不打算安静等候。`;
  const fallbackOptions = ['跟随学院级长前往公共休息室', '先观察大厅里正在注视自己的人', '尝试收敛灵力，适应城堡的魔力场', '向身边最近的学生询问移动楼梯'];
  renderStory(fallbackStory);
  renderOptions(fallbackOptions);
  G.currentStory = fallbackStory;
  G.currentOptions = fallbackOptions;
  persistAll();

  // AI 在本地序章已可玩的前提下继续生成正式版本。
  setLoading(true);

  try {
    const { story, options } = await generatePrologue();
    if (story?.trim()) {
      renderStory(story);
      renderOptions(options?.length ? options : fallbackOptions);
      G.currentStory = story;
      G.currentOptions = options?.length ? options : fallbackOptions;
    }
    persistAll();
  } catch(e) {
    const errMsg = e?.message || '未知错误';
    renderStory(`${fallbackStory}\n\n（AI序章暂未生成：${errMsg}。你仍可使用下方选项继续游戏。）`);
    renderOptions(fallbackOptions);
    showRegenButton();
  } finally {
    setLoading(false);
  }
}

// ── 玩家做出选择 ───────────────────────────────────────────
async function handlePlayerChoice(choiceText) {
  if (!choiceText?.trim()) return;
  setLoading(true);

  const customInput = document.getElementById('custom-input');
  if (customInput) customInput.value = '';

  try {
    const { story, options, stateUpdate } = await generateStory(choiceText);
    renderStory(story);
    renderOptions(options);
    updateTopBar();
    persistAll();

    // 战斗触发
    if (stateUpdate?.combatTrigger) {
      setTimeout(() => startCombat(stateUpdate.combatTrigger), 400);
    }
    // 黑市触发
    if (stateUpdate?.openMarket) {
      setTimeout(() => openMarketModal(), 400);
    }
  } catch(e) {
    renderStory(`（生成失败：${e.message}）`);
    showRegenButton();
  } finally {
    setLoading(false);
  }
}

// ── 游戏主界面事件绑定 ────────────────────────────────────
function initGameScreen() {
  // Tab 导航
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.panel));
  });

  // 自定义输入发送
  document.getElementById('btn-send')?.addEventListener('click', () => {
    const val = document.getElementById('custom-input')?.value.trim();
    if (val) handlePlayerChoice(val);
  });
  document.getElementById('custom-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = e.target.value.trim();
      if (val) handlePlayerChoice(val);
    }
  });

  // 重新生成
  document.getElementById('btn-regenerate')?.addEventListener('click', async () => {
    const lastUser = [...G.storyHistory].reverse().find(m => m.role === 'user');
    if (lastUser) {
      G.storyHistory = G.storyHistory.slice(0, -2); // 移除最后一轮
      setLoading(true);
      try {
        const { story, options } = await generateStory(lastUser.content);
        renderStory(story);
        renderOptions(options);
        updateTopBar();
      } catch(e) {
        showRegenButton();
      } finally {
        setLoading(false);
      }
    }
  });

  // 选项折叠按钮
  document.getElementById('options-toggle')?.addEventListener('click', toggleOptions);

  // 道具弹窗
  document.getElementById('modal-item-close')?.addEventListener('click', closeItemModal);
  document.getElementById('modal-item-backdrop')?.addEventListener('click', closeItemModal);
  document.getElementById('btn-use-item')?.addEventListener('click', (e) => {
    const itemId = e.currentTarget.dataset.itemId || _openItemId;
    const item = G.player.inventory.find(i => i.id === itemId);
    if (!item) return;
    const eff = usePotion(itemId);
    closeItemModal();
    renderInventoryPanel();
    updateTopBar();
    if (eff) {
      handlePlayerChoice(`[使用了「${item.name}」。请在故事中描述使用效果，然后继续剧情。]`);
    }
  });

  // 炼药工坊
  document.getElementById('btn-open-alchemy')?.addEventListener('click', openAlchemyModal);
  document.getElementById('modal-alchemy-close')?.addEventListener('click', closeAlchemyModal);
  document.getElementById('modal-alchemy-backdrop')?.addEventListener('click', closeAlchemyModal);

  // 黑市
  document.getElementById('btn-open-market')?.addEventListener('click', openMarketModal);
  document.getElementById('modal-market-close')?.addEventListener('click', closeMarketModal);
  document.getElementById('modal-market-backdrop')?.addEventListener('click', closeMarketModal);

  // 修改API按钮
  document.getElementById('btn-change-api')?.addEventListener('click', () => {
    window.location.href = '../../index.html';
  });

  // 存读档
  document.querySelectorAll('.btn-save-write').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = parseInt(btn.dataset.slot);
      saveToSlot(slot);
      renderSaveSlots();
      alert(`已保存到存档位 ${slot+1}`);
    });
  });
  document.querySelectorAll('.btn-save-read').forEach(btn => {
    btn.addEventListener('click', () => {
      const slot = parseInt(btn.dataset.slot);
      if (!G.saves[slot]) { alert('该存档位为空'); return; }
      if (!confirm('读取存档将覆盖当前进度，确认？')) return;
      loadFromSlot(slot);
      updateTopBar();
      renderStory(G.currentStory || '');
      renderOptions(G.currentOptions || []);
      renderSaveSlots();
    });
  });
}
