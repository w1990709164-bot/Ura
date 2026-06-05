// ═══════════════════════════════
// GOOD FEEL
// ═══════════════════════════════
let gfCurrentChar=null;
function openGoodFeel(charId,charName){
  gfCurrentChar=charId;
  document.getElementById('gf-title').textContent=`${charName} 刚才…`;
  document.getElementById('gf-sub').textContent='你愿意给他多少好感？（只有你自己知道）';
  document.getElementById('goodfeel-modal').style.display='flex';
}
function submitGoodFeel(score){
  document.getElementById('goodfeel-modal').style.display='none';
  if(gfCurrentChar&&score>0){
    G.chars[gfCurrentChar].goodFeel=(G.chars[gfCurrentChar].goodFeel||0)+score;
    showToast(`好感 +${score}`);
    renderDossier();
  }
  gfCurrentChar=null;
  saveGame();
}
