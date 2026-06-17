// ═══════════════════════════════
// OVERLAY
// ═══════════════════════════════
function openOverlay(id){
  document.getElementById(id).classList.add('show');
  if(id==='dossier-overlay') renderDossier();
  if(id==='bag-overlay') renderBackpack();
  if(id==='gs-overlay'){ document.getElementById('gs-key').value=localStorage.getItem('LW_API_KEY')||''; document.getElementById('gs-endpoint').value=localStorage.getItem('LW_API_URL')||''; syncModelSelect('gs-model',localStorage.getItem('LW_API_MODEL')||''); }
}
function closeOverlay(id){ document.getElementById(id).classList.remove('show'); }
