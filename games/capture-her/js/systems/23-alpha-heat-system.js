// ═══════════════════════════════
// ALPHA HEAT SYSTEM
// ═══════════════════════════════
function rollAlphaHeat() {
  // Each week, some alphas might enter heat
  CHARS.forEach(c => {
    const cs = G.chars[c.id];
    if(cs.inHeat) {
      cs.heatDaysLeft = (cs.heatDaysLeft||1) - 1;
      if(cs.heatDaysLeft <= 0) {
        cs.inHeat = false;
        cs.status = 'base';
        delete cs.heatDaysLeft;
      }
      return;
    }
    // ~8% chance per day
    if(Math.random() < 0.08) {
      cs.inHeat = true;
      cs.heatDaysLeft = 2 + Math.floor(Math.random()*3);
      cs.status = 'heat';
      // Add to char pov as internal note
      if(!charPovData[c.id]) charPovData[c.id] = [];
      charPovData[c.id].push({type:'thought', content:'【系统提示：发情期开始，持续约'+cs.heatDaysLeft+'天。抑制剂已服用，但效果有限。】'});
    }
  });
  saveGame();
}
