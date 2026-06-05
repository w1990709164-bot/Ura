// ══════════════════════════════
// SEND FREE MESSAGE
// ══════════════════════════════
async function sendMessage() {
  const box = document.getElementById('input-box');
  const text = box.value.trim();
  if (!text || G.isThinking) return;
  box.value = '';
  box.style.height = 'auto';
  addPlayerMsg(text);
  G.history.push({role:'user',content:text});
  G.turnCount++;
  // Day 1: check for end-of-day intent
  if (G.day === 1 && (text.includes('结束今天') || text.includes('明天正式上班') || text.includes('入睡') || text.includes('回到宿舍'))) {
    addNarr(`*你躺下来，听着塔区深处隐约的机械声。*\n\n*明天，才是真正开始。*`);
    setTimeout(()=>endDay(), 1800);
    return;
  }
  callAI();
}
