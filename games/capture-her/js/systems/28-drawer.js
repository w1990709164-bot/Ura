// ═══════════════════════════════
// DRAWER
// ═══════════════════════════════
function initDrawer(){
  const drawer=document.getElementById('bottom-drawer');
  const handle=document.getElementById('drawer-handle');
  let startY=0,isDragging=false;
  const onStart=e=>{ startY=(e.touches?e.touches[0].clientY:e.clientY); isDragging=true; };
  const onMove=e=>{ if(!isDragging) return; const dy=(e.touches?e.touches[0].clientY:e.clientY)-startY; if(dy>30) collapseDrawer(); else if(dy<-30) expandDrawer(); };
  const onEnd=()=>{ isDragging=false; };
  handle.addEventListener('touchstart',onStart,{passive:true});
  handle.addEventListener('touchmove',onMove,{passive:true});
  handle.addEventListener('touchend',onEnd);
  handle.addEventListener('mousedown',onStart);
  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onEnd);
}
function expandDrawer(){ document.getElementById('bottom-drawer').classList.remove('collapsed'); document.getElementById('bottom-drawer').classList.add('expanded'); }
function collapseDrawer(){ document.getElementById('bottom-drawer').classList.remove('expanded'); document.getElementById('bottom-drawer').classList.add('collapsed'); }
