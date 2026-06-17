// ══════════════════════════════
// GLITCH
// ══════════════════════════════
function triggerGlitch(cb) {
  const gl = document.getElementById('glitch-overlay');
  gl.classList.add('active');
  setTimeout(()=>{ gl.classList.remove('active'); if(cb) cb(); }, 500);
}
