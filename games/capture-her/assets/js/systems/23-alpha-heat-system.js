// ═══════════════════════════════
// ALPHA HEAT SYSTEM
// ═══════════════════════════════
function rollAlphaHeat() {
  CHARS.forEach(c => {
    const cs = G.chars[c.id];
    if(cs.inHeat) {
      cs.heatDaysLeft = (cs.heatDaysLeft||1) - 1;
      if(cs.heatDaysLeft <= 0) { cs.inHeat = false; cs.status = 'base'; delete cs.heatDaysLeft; }
      return;
    }
    // 双门槛：好感 ≥ 40 且 执念 ≥ 50 才有资格触发
    // 概率随好感+执念线性增长，最高约12%
    const gf = cs.goodFeel || 0;
    const ob = cs.obsession || 0;
    if(gf < 40 || ob < 50) return; // 幼崽期直接跳过
    const chance = 0.02 + ((gf - 40) / 100) * 0.05 + ((ob - 50) / 100) * 0.05;
    if(Math.random() < chance) {
      cs.inHeat = true; cs.heatDaysLeft = 2 + Math.floor(Math.random()*3); cs.status = 'heat';
      if(!charPovData[c.id]) charPovData[c.id] = [];
      charPovData[c.id].push({type:'thought', content:'【系统提示：发情期开始，持续约'+cs.heatDaysLeft+'天。抑制剂已服用，但效果有限。】'});
    }
  });
  saveGame();
}
