// ═══════════════════════════════
// EVENING CHAT
// ═══════════════════════════════
async function generateEveningChat(){
  const doneChars = G.dailyTasks.filter(t=>t.done).map(t=>CHARS.find(c=>c.id===t.charId)?.chatId).filter(Boolean);
  const todayContext = doneChars.length > 0
    ? `今天完成了系统任务的ID：${doneChars.join('、')}（他们今天都和目标有过接触，心情各异）`
    : '今天没有人完成任务';

  const prompt=`你是《任务：攻略她》的系统引擎，负责生成傍晚群聊内容。

背景：${todayContext}

【群聊规则 — 严格执行】
- 这是一个匿名群，所有人只知道自己有系统任务，不知道其他人的任务内容
- 没有人会在群里直接说"我今天的任务是XXX"
- 聊天话题来自今天发生的事（天气、安全区日常、吐槽系统、随机感慨）
- 完成任务的人可能状态好一点，没完成的可能在发牢骚，但都不说原因
- 风格：像一个游戏攻略群，有人灌水有人沉默，像真实群聊

【各ID发言风格】
- 老板(Price)：基本沉默，偶尔一句话结束话题
- 000(Ghost)：几乎不发，最多一个"？"
- 麦克泰维什不在(Soap)：话多活跃，苏格兰腔调，爱调侃
- 还在线(Gaz)：偶尔冒泡，说话有点毒
- K(Keegan)：短句，冷
- 条例第七条(Merrick)：一本正经，但偶尔人味
- 沃克二号(Hesh)：话多，抱怨，但其实没事
- 沃克(Logan)：发"done"或者一两个字
- █████(König)：全天沉默，突然冒出一句莫名其妙的话
- 虎虎虎虎虎(Horangi)：最活跃，分享冷知识，关心大家
- 没有人(Nikto)：前言不搭后语，有时候发一半消失
- 无罪(Krueger)：毒舌，冷笑话
- 天津卫(Zimo)：偶尔天津话，稳重但有人情味
- CEO(Graves)：像发工作通知，但底下有话

生成8-12条群聊消息，严格返回JSON数组，不要其他内容：
[{"chatId":"聊天ID","text":"消息内容","isSystem":false}]
可以加一条isSystem:true的系统公告`;

  try {
    const raw=await fetchAI(prompt,[{role:'user',content:'生成今晚群聊'}]);
    const match=raw.match(/\[[\s\S]*\]/);
    if(match){
      const msgs=JSON.parse(match[0]);
      msgs.forEach((m,i)=>setTimeout(()=>addChatMessage(m.chatId,m.text,m.isSystem),i*600));
    }
  } catch(e){ console.warn('Chat gen failed:',e); }
}

function addChatMessage(chatId,text,isSystem=false,save=true){
  if(!chatId && !isSystem) return;
  if(!text) return;
  chatId = chatId || ''; text = String(text);
  const now=new Date();
  const time=`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  if(save) G.chatLog.push({chatId,text,time,isSystem});
  const container=document.getElementById('chat-messages');
  if(!container) return;
  const d=document.createElement('div'); d.className='chat-msg';
  if(isSystem){
    d.innerHTML=`<div class="chat-system-msg">🔧 ${text}</div>`;
  } else {
    const initials=(chatId||'?').slice(0,2).toUpperCase();
    d.innerHTML=`<div class="chat-msg-row"><div class="chat-av">${initials}</div><div class="chat-content"><div class="chat-id">${chatId}</div><div class="chat-bubble">${text}</div><div class="chat-time">${time}</div></div></div>`;
  }
  container.appendChild(d);
  setTimeout(()=>container.scrollTop=container.scrollHeight,50);
  if(save) saveGame();
}

function renderChat(){
  const container=document.getElementById('chat-messages');
  container.innerHTML='';
  if(!G.chatLog?.length){
    const d=document.createElement('div'); d.className='chat-divider'; d.textContent='群聊将在傍晚激活';
    container.appendChild(d); return;
  }
  G.chatLog.forEach(m=>addChatMessage(m.chatId,m.text,m.isSystem,false));
}
