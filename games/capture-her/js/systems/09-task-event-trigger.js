// ═══════════════════════════════
// TASK EVENT TRIGGER
// ═══════════════════════════════
async function triggerNextTaskEvent() {
  const pending = G.dailyTasks.filter(t=>!t.done);
  if(!pending.length){
    addSysMsg('今日事件', '今天所有任务已完成或无待触发事件。');
    return;
  }
  const task = pending[Math.floor(Math.random()*pending.length)];
  const c = CHARS.find(x=>x.id===task.charId);
  const cs = G.chars[task.charId];

  // Show task notification popup
  document.getElementById('tnc-char').textContent = c.name;
  document.getElementById('tnc-task').textContent = task.taskDesc;
  const notif = document.getElementById('task-notif');
  notif.style.display='flex';
  setTimeout(()=>{ notif.style.display='none'; }, 3000);

  // Call AI for task scene (user POV only in main, char POV goes to second tab)
  enableDualView(false);
  const sysPrompt = buildSystemPrompt();
  const charStats = `执念${G.chars[task.charId]?.obsession||0} 好感${G.chars[task.charId]?.goodFeel||0}`;
  const userMsg = `[任务触发：${c.name}(${c.chatId}) 今天的系统任务是「${task.taskDesc}」。${charStats}

请严格按以下格式输出，不得省略分隔符：

【角色视角】
（只写${c.name}的内心独白，100-150字，第一人称。禁止写其他角色的视角。
注意：选项不要放这里，想法只在这个块里写，不要出现在下面的用户视角里。

写作规范——严格遵守：
禁止词汇：极其、邪魅一笑、眸色一暗、喉结滚动、气极反笑、霸道揽入怀中、晦暗不明、危险地眯起眼、心跳炸开、揉进骨血、刻进DNA、烙印在灵魂上、某种难以言喻的、如遭雷击、瞳孔骤缩
禁止套路：心脏攥紧/漏跳、呼吸一窒、浑身僵硬、大脑空白、微微颤抖——这些每段至多一次
Show don't tell：用具体行为和细节表现情绪，禁止直接贴情绪标签

情感规则：
- 执念值${G.chars[task.charId]?.obsession||0}决定情感深度：低于40只是任务的烦躁和算计，40-70开始有些在意但压制，70+才有明显情感波动
- 执念值低于40时禁止出现占有欲、吃醋等强烈情感）

【用户视角】
（${G.player.name}看到的日常场景，她完全不知道系统的事，自然叙事，其他角色可以出现但只写她看到的表面。
注意：不要把角色内心想法写在这里。对话要用双引号+"「中文」"格式。
最后给出2-3个${G.player.name}的回应选项，但选项必须放在最后的[OPTIONS:]块里，不要写在叙事文本中。）

[OPTIONS: A.第一个选项 | B.第二个选项 | C.第三个选项]`;

  G.history.push({role:'user', content:userMsg});
  G.isThinking = true;
  document.getElementById('send-btn').disabled=true;
  const thinkId = addThinking();

  // Set currentTask BEFORE AI response so processAIResponse can use it
  G.currentTask = task;
  task.roundCount = 0; // reset round counter when task scene starts

  try {
    const raw = await fetchAI(sysPrompt, G.history);
    removeThinking(thinkId);
    processAIResponse(raw, task);
  } catch(e){
    removeThinking(thinkId);
    addSysMsg('连接错误', String(e));
  }
  G.isThinking=false;
  document.getElementById('send-btn').disabled=false;
}
