// ═══════════════════════════════
// INIT
// ═══════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  const hasSave=loadGame();
  if(hasSave&&G.player.name&&G.apiKey){
    document.getElementById('load-btn').style.display='block';
    if(G.adultConfirmed) document.getElementById('age-warn').style.display='none';
  }
  if(G.apiKey){ document.getElementById('st-key').value=G.apiKey; document.getElementById('st-endpoint').value=G.apiEndpoint; if(G.adultConfirmed) document.getElementById('st-adult').checked=true; }
  initDrawer();
  const box=document.getElementById('input-box');
  box.addEventListener('input',function(){ this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,90)+'px'; });
  box.addEventListener('keydown',function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMsg(); } });
  box.addEventListener('focus',()=>expandDrawer());
});
