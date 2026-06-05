// ══════════════════════════════
// DRAWER DRAG
// ══════════════════════════════
function initDrawer() {
  const drawer = document.getElementById('bottom-drawer');
  const handle = document.getElementById('drawer-handle');
  let startY = 0;
  let startTranslate = 0;
  let isDragging = false;

  // Collapse/expand on handle tap
  handle.addEventListener('click', ()=>{
    if (drawer.classList.contains('collapsed')) expandDrawer();
    else collapseDrawer();
  });

  function getTranslateY(el) {
    const style = window.getComputedStyle(el);
    const matrix = new DOMMatrix(style.transform);
    return matrix.m42;
  }

  handle.addEventListener('touchstart', e=>{
    isDragging = true;
    startY = e.touches[0].clientY;
    drawer.style.transition = 'none';
    startTranslate = getTranslateY(drawer);
  }, {passive:true});

  handle.addEventListener('touchmove', e=>{
    if (!isDragging) return;
    const dy = e.touches[0].clientY - startY;
    const newT = Math.max(0, Math.min(startTranslate + dy, drawer.clientHeight - 44));
    drawer.style.transform = `translateY(${newT}px)`;
  }, {passive:true});

  handle.addEventListener('touchend', e=>{
    if (!isDragging) return;
    isDragging = false;
    drawer.style.transition = '';
    const currentT = getTranslateY(drawer);
    const threshold = drawer.clientHeight * 0.4;
    if (currentT > threshold) collapseDrawer();
    else expandDrawer();
  });
}

function expandDrawer() {
  const d = document.getElementById('bottom-drawer');
  d.classList.remove('collapsed');
  d.classList.add('expanded');
}
function collapseDrawer() {
  const d = document.getElementById('bottom-drawer');
  d.classList.remove('expanded');
  d.classList.add('collapsed');
}
