// ══════════════════════════════
// WORLD LOG — 每日世界记忆
// ══════════════════════════════
// type: 'clinic'|'encounter'|'chat'|'event'|'system'
function addWorldLog(type, charId, text) {
  if (!G.worldLog) G.worldLog = [];
  const c = charId ? CHARS.find(x=>x.id===charId) : null;
  G.worldLog.push({
    day: G.day,
    slot: ['早','午','晚'][Math.min(G.slotsUsed,2)]||'晚',
    loc: G.currentLocation || 'clinic',
    type,
    charName: c ? c.name : null,
    charId: charId || null,
    text,
  });
  // Keep max 200 entries
  if (G.worldLog.length > 200) G.worldLog.shift();
  saveGame();
}

// Get today's world log as a compact prompt string for AI
function getTodayWorldLogPrompt() {
  if (!G.worldLog || !G.worldLog.length) return '';
  const today = G.worldLog.filter(e => e.day === G.day);
  if (!today.length) return '';
  const lines = today.map(e => {
    const who = e.charName ? `[${e.charName}]` : '[系统]';
    const loc = e.loc !== 'clinic' ? `@${getLocationName(e.loc)}` : '@诊疗室';
    return `${e.slot}${loc} ${who} ${e.text}`;
  });
  return '【今日已发生的事】\n' + lines.join('\n');
}

// Get recent days world log (last N days) for AI context
function getRecentWorldLogPrompt(days) {
  if (!G.worldLog || !G.worldLog.length) return '';
  const cutoff = G.day - (days||2);
  const recent = G.worldLog.filter(e => e.day >= cutoff && e.day < G.day);
  if (!recent.length) return '';
  // Group by day
  const byDay = {};
  recent.forEach(e => { if (!byDay[e.day]) byDay[e.day] = []; byDay[e.day].push(e); });
  const parts = Object.entries(byDay).reverse().map(([d, evts]) => {
    const summary = evts.map(e => {
      const who = e.charName ? `[${e.charName}]` : '';
      return `${e.slot} ${who} ${e.text}`;
    }).join('；');
    return `第${d}天：${summary}`;
  });
  return '【近期记录（参考背景）】\n' + parts.join('\n');
}
