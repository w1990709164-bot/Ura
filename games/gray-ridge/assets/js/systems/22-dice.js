// ══════════════════════════════
// DICE
// ══════════════════════════════
let diceCallback = null;
let diceAttrKey = 'tq';
let diceRolled = false;

function openDice(attrKey, difficulty, cb) {
  diceAttrKey = attrKey;
  diceCallback = cb;
  diceRolled = false;
  const attrName = STATS_DEF.find(s=>s.key===attrKey)?.name||attrKey;
  document.getElementById('dice-attr').textContent = `${attrName}检定 · 难度 ${difficulty}`;
  document.getElementById('dice-result').textContent = '';
  document.getElementById('dice-outcome').textContent = '点击骰子投掷';
  document.getElementById('dice-outcome').className = 'dice-outcome';
  document.getElementById('dice-confirm').style.display = 'none';
  document.getElementById('dice-overlay').style.display = 'flex';
  document.getElementById('dice-icon').onclick = () => rollDice(difficulty);
}

function rollDice(difficulty=10) {
  if (diceRolled) return;
  diceRolled = true;
  const base = Math.floor(Math.random()*20)+1;
  const bonus = (G.stats[diceAttrKey]||0) * 2; // 属性权重x2，让属性成长更有意义
  const diceBonus = G.activeDiceBonus || 0;
  G.activeDiceBonus = 0; // consume
  const total = base + bonus + diceBonus;
  const icon = document.getElementById('dice-icon');
  icon.style.animation = 'none';
  setTimeout(()=>{ icon.style.animation = 'dice-spin 0.6s ease-out'; }, 10);

  setTimeout(()=>{
    const bonusDisplay = diceBonus > 0 ? ` + ${diceBonus}(道具)` : '';
    document.getElementById('dice-result').textContent = `${base} + ${bonus}(属性x2)${bonusDisplay} = ${total}`;
    let outcome, cls;
    if (total >= difficulty + 5) { outcome='完美通关'; cls='perfect'; }
    else if (total >= difficulty) { outcome='勉强通关'; cls='success'; }
    else { outcome='检定失败'; cls='fail'; }
    const outEl = document.getElementById('dice-outcome');
    outEl.textContent = outcome;
    outEl.className = 'dice-outcome '+cls;
    document.getElementById('dice-confirm').style.display = 'block';
    document.getElementById('dice-icon').onclick = null;
    // Store result for confirm button — do NOT auto-trigger callback here
    window._diceResult = { outcome, total };
  }, 800);
}

function closeDice() {
  document.getElementById('dice-overlay').style.display = 'none';
}

function confirmDice() {
  closeDice();
  if (diceCallback && window._diceResult) {
    const { outcome, total } = window._diceResult;
    window._diceResult = null;
    diceCallback(outcome, total);
    diceCallback = null;
  }
}
