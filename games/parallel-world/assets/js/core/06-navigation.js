// ════════════════════════════════
// NAVIGATION
// ════════════════════════════════
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==='s-create') buildCreateScreen();
  if(id==='s-game') initGame();
}
