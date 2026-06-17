// ══════════════════════════════
// DICE
// ══════════════════════════════
let diceCallback = null;
let diceAttrKey = 'tq';
let diceDifficulty = 10;
let diceRolled = false;

// 把 AI 回传的属性名/键统一成 G.stats 的键；难度统一成有效整数。
function normalizeAttrKey(attr){
  if(!attr) return 'tq';
  const a = String(attr).trim();
  if(STATS_DEF.some(s=>s.key===a)) return a;            // 已是合法键
  const byName = STATS_DEF.find(s=>s.name===a);          // 中文名 → 键
  if(byName) return byName.key;
  const lower = a.toLowerCase();
  const byKeyCI = STATS_DEF.find(s=>s.key.toLowerCase()===lower);
  return byKeyCI ? byKeyCI.key : 'tq';
}
function normalizeDifficulty(d){
  // AI 可能回 "12"、"12-14"、"难度12" 等；取其中第一个数字，无法解析则默认 10
  const m = String(d).match(/\d+/);
  const n = m ? parseInt(m[0], 10) : NaN;
  return Number.isFinite(n) ? n : 10;
}

function openDice(attrKey, difficulty, cb) {
  diceAttrKey = normalizeAttrKey(attrKey);
  diceDifficulty = normalizeDifficulty(difficulty);
  diceCallback = cb;
  diceRolled = false;
  const attrName = STATS_DEF.find(s=>s.key===diceAttrKey)?.name||diceAttrKey;
  document.getElementById('dice-attr').textContent = `${attrName}检定 · 难度 ${diceDifficulty}`;
  document.getElementById('dice-result').textContent = '';
  document.getElementById('dice-outcome').textContent = '点击骰子投掷';
  document.getElementById('dice-outcome').className = 'dice-outcome';
  document.getElementById('dice-confirm').style.display = 'none';
  document.getElementById('dice-overlay').style.display = 'flex';
  document.getElementById('dice-icon').onclick = () => rollDice();
}

function rollDice(difficulty) {
  if (diceRolled) return;
  diceRolled = true;
  difficulty = (difficulty === undefined) ? diceDifficulty : normalizeDifficulty(difficulty);
  const base = Math.floor(Math.random()*20)+1;
  const bonus = (Number(G.stats[diceAttrKey])||0) * 2; // 属性权重x2，让属性成长更有意义
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
