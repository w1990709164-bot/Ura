// ════════════════════════════════
// AFFECTION
// ════════════════════════════════
function updateAffection(charKey, delta){
  if(!delta||delta===0) return;
  const c=G.chars[charKey];
  c.aff = Math.max(0, c.aff + delta);
  // check stage up
  if(c.aff >= STAGE_MAX[c.stage] && c.stage < STAGES.length-1){
    c.stage++;
    c.aff = 0;
    showMsg(`♥ 与 ${charKey} 的关系升级：${STAGES[c.stage]}`);
  } else if(c.aff < 0 && c.stage > 0){
    // stage down
    c.stage--;
    c.aff = Math.floor(STAGE_MAX[c.stage]*0.7);
    showMsg(`💔 与 ${charKey} 的关系下降：${STAGES[c.stage]}`);
  }
  if(delta>0) showMsg(`♥ ${charKey} 好感 +${delta}`);
  if(delta<0) showMsg(`${charKey} 好感 ${delta}`);
  buildDossier();
}
