// ══════════════════════════════
// OPTIONS
// ══════════════════════════════
function showOptions(opts) {
  const area = document.getElementById('options-area');
  area.style.display = 'flex';
  // remove old buttons and custom input
  const old = area.querySelectorAll('.option-btn, .custom-input-wrap');
  old.forEach(b=>b.remove());
  opts.forEach(o=>{
    const btn = document.createElement('button');
    btn.className = 'option-btn' + (o.hidden?' hidden-opt':'');
    btn.innerHTML = `<span class="opt-label">${o.label}</span>${o.text}`;
    btn.onclick = ()=>selectOption(o.text);
    area.appendChild(btn);
  });

  // Add custom input toggle
  const customWrap = document.createElement('div');
  customWrap.className = 'custom-input-wrap';
  customWrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-top:2px';
  customWrap.innerHTML = `
    <button onclick="toggleCustomInput(this)" style="
      background:none;border:1px dashed var(--border2);border-radius:6px;
      color:var(--text3);font-family:var(--mono);font-size:10px;
      padding:7px;cursor:pointer;letter-spacing:1px;text-align:left;
      display:flex;align-items:center;gap:6px;transition:all 0.2s
    ">
      <span>✏</span> 自定义回复
    </button>
    <div id="custom-input-area" style="display:none;flex-direction:column;gap:6px">
      <textarea id="custom-text" style="
        background:var(--bg3);border:1px solid var(--border2);border-radius:6px;
        color:var(--white);font-family:var(--serif);font-size:13.5px;
        padding:10px 12px;resize:none;min-height:60px;outline:none;line-height:1.6;
        width:100%;box-sizing:border-box;
      " placeholder="输入你想说的话…"></textarea>
      <button onclick="sendCustomOption()" style="
        padding:9px;background:var(--cyan-glow);border:1px solid var(--cyan-dim);
        border-radius:6px;color:var(--cyan);font-family:var(--hud);font-size:13px;
        font-weight:600;cursor:pointer;letter-spacing:1px
      ">发送</button>
    </div>
  `;
  area.appendChild(customWrap);
  document.getElementById('input-area').style.display = 'none';
}

function toggleCustomInput(btn) {
  const area = document.getElementById('custom-input-area');
  if (!area) return;
  const isOpen = area.style.display === 'flex';
  area.style.display = isOpen ? 'none' : 'flex';
  btn.style.borderColor = isOpen ? 'var(--border2)' : 'var(--cyan)';
  btn.style.color = isOpen ? 'var(--text3)' : 'var(--cyan)';
  if (!isOpen) {
    setTimeout(()=>document.getElementById('custom-text')?.focus(), 100);
  }
}

function sendCustomOption() {
  const ta = document.getElementById('custom-text');
  if (!ta) return;
  const text = ta.value.trim();
  if (!text) return;
  ta.value = '';
  selectOption(text);
}
function hideOptions() {
  const opts = document.getElementById('options-area');
  const input = document.getElementById('input-area');
  if (opts) opts.style.display = 'none';
  if (input) input.style.display = 'flex';
}
function selectOption(text) {
  hideOptions();
  addPlayerMsg(text);

  // Day 1: check if player chose to end the day (go to sleep)
  if (G.day === 1 && (text.includes('结束今天') || text.includes('明天正式上班') || text.includes('入睡') || text.includes('准备休息') || text.includes('回到宿舍'))) {
    G.history.push({role:'user', content: text});
    // Brief closing narration then end day
    addNarr(`*你躺下来，听着塔区深处隐约的机械声。*\n\n*明天，才是真正开始。*`);
    setTimeout(()=>endDay(), 1800);
    return;
  }

  G.history.push({role:'user',content:text});
  G.turnCount++;
  // Auto-set clinicSession from schedule only when actually in the clinic
  if (!G.clinicSession && G.schedule.length > 0 && G.currentLocation === 'clinic') {
    const nextPatient = G.schedule.find(s => !G.completedToday.includes(s.id));
    if (nextPatient) {
      G.clinicSession = nextPatient.id;
      G.sessionTurns = 0;
    }
  }
  callAI();
}
