// ═══════════════════════════════
// ADVANCE DAY
// ═══════════════════════════════
function advanceDay() {
  G.totalDay = (G.totalDay||1) + 1;
  G.day++;
  const daysInMonth = [31,29,31,30,31,30,31,31,30,31,30,31];
  if(G.day > daysInMonth[(G.month||1)-1]) { G.day=1; G.month++; if(G.month>12){G.month=1;G.year++;} }
  G.phase = 'morning';
  G.chatLog = [];
  charPovData = {};
  currentCharPovId = null;
  G.todayRanking = [];
  G.currentTask = null;
  rollAlphaHeat();
  CHARS.forEach(c=>{
    const cs = G.chars[c.id];
    if(!cs.inHeat && cs.status==='heat') cs.status='base';
    if(cs.status==='task') cs.status='base';
  });
  updateTopBar(); updateSecondTabNav();
  showMainView('scene');
  document.getElementById('single-view').innerHTML='';
  renderChat(); renderDossier();
  saveGame();
  addSysMsg('新的一天', `第${G.totalDay}天 · ${G.year}年${G.month}月${G.day}日`);
  generateDailyTasks(()=>{
    G.history.push({role:'user',content:`[新的一天开始，第${G.totalDay}天早晨。描述${G.player.name}开始新一天工作的场景，安全区的早晨氛围，配角自然出现。简短，给出2-3个选择。]`});
    callAI();
  });
}
