// ══════════════════════════════
// PANEL NAVIGATION
// ══════════════════════════════
function showPanel(name) {
  document.getElementById('scene-area').style.display = name==='scene'?'flex':'none';
  document.getElementById('map-panel').style.display = name==='map'?'flex':'none';
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const el = document.getElementById('nav-'+name);
  if (el) el.classList.add('active');
  if (name==='map') renderMap();
}

function openOverlay(id) {
  document.getElementById(id).classList.add('show');
  if (id==='bond-overlay') renderBonds();
  if (id==='status-overlay') renderStatus();
  if (id==='backpack-overlay') renderBackpack();
}

function closeOverlay(id) {
  document.getElementById(id).classList.remove('show');
}
