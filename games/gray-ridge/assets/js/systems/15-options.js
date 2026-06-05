// ══════════════════════════════
// OPTIONS
// ══════════════════════════════
function showOptions(opts) {
  const area = document.getElementById('options-area');
  area.style.display = 'flex';
  area.querySelectorAll('.option-btn').forEach(b=>b.remove());

  // Add a divider label
  const label = document.createElement('div');
  label.style.cssText = 'font-family:var(--hud);font-size:9px;color:var(--text3);letter-spacing:2px;padding:2px 0 4px;';
  label.textContent = '— 选择或自由输入 —';
  area.appendChild(label);

  opts.forEach(o => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="opt-label">${o.label}</span>${o.text}`;
    btn.onclick = ()=>selectOption(o.text);
    area.appendChild(btn);
  });

  // Keep input area visible for free input
  document.getElementById('input-area').style.display = 'flex';
  document.getElementById('input-box').placeholder = '不满意选项？直接输入…';
  document.getElementById('drawer-mode').textContent = '选项';
  document.getElementById('drawer-mode').classList.add('has-options');
  expandDrawer();
}

function hideOptions() {
  const area = document.getElementById('options-area');
  area.style.display = 'none';
  area.innerHTML = '';
  document.getElementById('input-area').style.display = 'flex';
  document.getElementById('input-box').placeholder = '说点什么…';
  document.getElementById('drawer-mode').textContent = 'INPUT';
  document.getElementById('drawer-mode').classList.remove('has-options');
}

function selectOption(text) {
  hideOptions();
  addPlayerMsg(text);
  G.history.push({role:'user', content:text});
  G.turnCount++;
  callAI();
}
