// ══════════════════════════════
// NAVIGATION
// ══════════════════════════════
function showPanel(name) {
  // Hide all panels
  document.getElementById('scene-area').style.display = name==='scene' ? 'flex' : 'none';
  document.getElementById('map-panel').style.display = name==='map' ? 'flex' : 'none';

  // Reset all nav items, then activate the correct one
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  // scene and map are bottom-nav tabs; status/archive/settings open as overlays over scene
  if (name==='scene' || name==='map') {
    const navEl = document.getElementById('nav-'+name);
    if (navEl) navEl.classList.add('active');
  } else {
    // Overlays sit on top of the scene, so keep scene nav highlighted
    document.getElementById('nav-scene')?.classList.add('active');
  }

  if (name==='status')   { openOverlay('status-panel'); renderStatus(); }
  if (name==='archive')  { openOverlay('archive-panel'); renderArchive(); }
  if (name==='settings') {
    openOverlay('settings-panel');
    document.getElementById('st-key').value = G.apiKey;
    document.getElementById('st-endpoint').value = G.apiEndpoint;
    document.getElementById('st-model').value = G.apiModel;
  }
  if (name==='map') { renderMap(); }
}

function openOverlay(id) { document.getElementById(id).classList.add('show'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('show'); }
