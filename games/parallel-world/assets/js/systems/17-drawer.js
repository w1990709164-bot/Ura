// ════════════════════════════════
// DRAWER
// ════════════════════════════════
function toggleDrawer(){drawerOpen?closeDrawer():openDrawer();}
function openDrawer(){drawerOpen=true;document.getElementById('drawer').classList.add('open');document.getElementById('drawer-overlay').classList.add('open');}
function closeDrawer(){drawerOpen=false;document.getElementById('drawer').classList.remove('open');document.getElementById('drawer-overlay').classList.remove('open');}
function switchTab(tab,el){
  document.querySelectorAll('.dtab').forEach(t=>t.classList.remove('active'));el.classList.add('active');
  ['status','dossier','map','forum','bounty','quest','settings'].forEach(p=>{
    const pe=document.getElementById('panel-'+p);if(pe) pe.style.display=p===tab?'block':'none';
  });
  if(tab==='map') updateMapUnlocks();
  if(tab==='quest'){ renderQuestPanel(); renderQuestHistory(); }
}
