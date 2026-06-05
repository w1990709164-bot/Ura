// ══════════════════════════════
// INIT
// ══════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  // Check for existing save
  const hasSave = loadGame();
  if (hasSave && G.player.name && G.apiKey) {
    document.getElementById('load-btn').style.display = 'block';
    if (G.adultConfirmed) document.getElementById('age-warn').style.display = 'none';
  }

  initDrawer();

  const box = document.getElementById('input-box');
  box.addEventListener('input', function(){
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 90)+'px';
  });
  box.addEventListener('keydown', function(e){
    if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
  });
  box.addEventListener('focus', ()=>expandDrawer());

  // Pre-fill settings if saved
  if (G.apiKey) document.getElementById('st-key').value = G.apiKey;
  if (G.apiModel) document.getElementById('st-model').value = G.apiModel;
  if (G.apiEndpoint) document.getElementById('st-endpoint').value = G.apiEndpoint;
  if (G.adultConfirmed) document.getElementById('st-adult-confirm').checked = true;
});
