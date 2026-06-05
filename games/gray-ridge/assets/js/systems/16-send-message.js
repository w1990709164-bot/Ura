// ══════════════════════════════
// SEND MESSAGE
// ══════════════════════════════
function sendMessage() {
  const box = document.getElementById('input-box');
  const text = box.value.trim();
  if (!text || G.isThinking) return;
  box.value = '';
  box.style.height = 'auto';
  addPlayerMsg(text);
  G.history.push({role:'user', content:text});
  G.turnCount++;
  callAI();
}
