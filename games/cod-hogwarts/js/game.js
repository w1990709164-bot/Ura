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
    updateTopBar();
    if (G.currentStory) {
      renderStory(G.currentStory);
      renderOptions(G.currentOptions || []);
    } else {
      // 首次进入游戏（分院后跳转）或存档中故事为空
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
  setLoading(true);
  try {
    const { story, options } = await generatePrologue();
    renderStory(story);
    renderOptions(options);
    G.currentStory = story;
    G.currentOptions = options;
    persistAll();
  } catch(e) {
    renderStory(`（序章加载失败：${e.message}）\n\n你站在霍格沃茨的入口，感受着这个陌生的西方魔法世界。`);
    renderOptions(['进入大厅', '环顾四周', '感受一下这里的魔力场', '确认背包里的东西']);
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
