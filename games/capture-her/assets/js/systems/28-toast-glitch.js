// ═══════════════════════════════
// TOAST & GLITCH
// ═══════════════════════════════
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}
function triggerGlitch(cb){
  const gl=document.getElementById('glitch-overlay');
  gl.classList.add('active');
  setTimeout(()=>{ gl.classList.remove('active'); if(cb) cb(); },400);
}
