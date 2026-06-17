// ═══════════════════════════════
// OPTIONS
// ═══════════════════════════════

// 当前选项绑定的角色id（用于好感加成）
let _optCharId = null;

function showOptions(opts, charId){
  _optCharId = charId || null;

  const area = document.getElementById('options-area');
  area.style.display = 'flex';
  area.innerHTML = '';

  const div = document.createElement('div');
  div.className = 'opt-divider';
  div.textContent = '— 选择或自由输入 —';
  area.appendChild(div);

  opts.forEach(o => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';

    // 有好感加成就在右侧显示 badge
    const badgeHtml = (o.goodFeelBonus > 0)
      ? `<span style="margin-left:auto;flex-shrink:0;font-family:var(--mono);font-size:9px;color:var(--red);background:var(--red-glow2);border:1px solid var(--red-dim);border-radius:2px;padding:1px 6px;letter-spacing:1px">+${o.goodFeelBonus}</span>`
      : '';

    btn.innerHTML = `<span class="opt-label">${o.label}</span><span style="flex:1">${o.text}</span>${badgeHtml}`;
    btn.onclick = () => selectOption(o.text, o.goodFeelBonus);
    area.appendChild(btn);
  });

  document.getElementById('input-area').style.display = 'flex';
  document.getElementById('input-box').placeholder = '不满意选项？直接输入…';
  document.getElementById('drawer-mode').textContent = '选项';
  document.getElementById('drawer-mode').classList.add('has-opts');
  expandDrawer();
}

function hideOptions(){
  const area = document.getElementById('options-area');
  area.style.display = 'none';
  area.innerHTML = '';
  document.getElementById('input-area').style.display = 'flex';
  document.getElementById('input-box').placeholder = '说点什么…';
  document.getElementById('drawer-mode').textContent = 'INPUT';
  document.getElementById('drawer-mode').classList.remove('has-opts');
  _optCharId = null;
}

function selectOption(text, goodFeelBonus){
  // 好感加成：立即写入状态
  if(goodFeelBonus > 0 && _optCharId && G.chars[_optCharId]){
    G.chars[_optCharId].goodFeel = (G.chars[_optCharId].goodFeel || 0) + goodFeelBonus;
    showToast(`好感 +${goodFeelBonus}`);
    renderDossier();
  }

  hideOptions();
  addPlayerMsg(text);
  G.history.push({role:'user', content:text});
  callAI();
}

function sendMsg(){
  const box = document.getElementById('input-box');
  const text = box.value.trim();
  if(!text || G.isThinking) return;
  box.value = ''; box.style.height = 'auto';
  hideOptions();
  addPlayerMsg(text);
  G.history.push({role:'user', content:text});
  callAI();
}
