// ══════════════════════════════
// OPENING CALL (first scene)
// ══════════════════════════════
async function callAI_opening() {
  G.isThinking = true;
  document.getElementById('send-btn').disabled = true;
  const thinkId = addThinking();

  const firstFinderIdx = Math.floor(Math.random() * CHARS.length);
  const finder = CHARS[firstFinderIdx];
  G.history.push({role:'user', content:'[GAME_START: generate opening scene]'});

  const prompt = buildSystemPrompt() + `\n\n【本次任务】生成游戏开场场景。
捡到幼崽的角色是：${finder.name}（${finder.species}，${FACTION_NAMES[finder.faction]}）。
场景：${finder.name}在某处发现了蜷成一团熟睡的幼崽（就是玩家角色，${G.player.race}，外貌：${G.player.appearance}），将其带回了灰脊驻地。
现在群像围在幼崽周围，幼崽（玩家）正在慢慢睁开眼睛。
叙事风格：温柔、有质感，幼崽视角（懵懂，世界是模糊的巨大身影和气味）。
给出第一组选择：
[OPTIONS: A.大哭起来 | B.看向141那边的身影 | C.看向幽灵小队那边 | D.看向KorTac那边 | E.看向其他方向]`;

  try {
    const rawText = await fetchAI(prompt, G.history);
    removeThinking(thinkId);
    processAIResponse(rawText);
  } catch(e) {
    removeThinking(thinkId);
    addSysMsg('系统错误', '无法连接AI，请检查API配置');
    console.error(e);
  }
  G.isThinking = false;
  document.getElementById('send-btn').disabled = false;
}
