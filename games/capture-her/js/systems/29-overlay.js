// ═══════════════════════════════
// OVERLAY
// ═══════════════════════════════
function openOverlay(id){
  document.getElementById(id).classList.add('show');
  if(id==='dossier-overlay') renderDossier();
  if(id==='bag-overlay') renderBackpack();
  if(id==='gs-overlay'){ document.getElementById('gs-key').value=G.apiKey; document.getElementById('gs-endpoint').value=G.apiEndpoint; syncModelSelect('gs-model',G.apiModel); }
}
function closeOverlay(id){ document.getElementById(id).classList.remove('show'); }
