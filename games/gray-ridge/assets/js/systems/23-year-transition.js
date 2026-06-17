// ══════════════════════════════
// YEAR TRANSITION
// ══════════════════════════════
function triggerYearTransition(newYear, giftData) {
  document.getElementById('yt-year').textContent = newYear;
  const giftsEl = document.getElementById('yt-gifts');
  if (giftData && giftData.length) {
    giftsEl.innerHTML = giftData.map(g=>`
      <div class="yt-gift">
        <div class="yt-gift-av">${g.init||'?'}</div>
        <div>
          <div class="yt-gift-name">${g.name}</div>
          <div class="yt-gift-text">${g.message}</div>
        </div>
      </div>`).join('');
  } else {
    giftsEl.innerHTML = '<div style="text-align:center;font-family:var(--fell);font-style:italic;font-size:13px;color:var(--text3);padding:16px">尚未与任何人建立足够深的羁绊……</div>';
  }
  document.getElementById('year-transition').style.display = 'flex';
}

function closeYearTransition() {
  document.getElementById('year-transition').style.display = 'none';
}
