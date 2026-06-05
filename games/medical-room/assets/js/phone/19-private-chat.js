// ══════════════════════════════
// PRIVATE CHAT SYSTEM
// ══════════════════════════════
let currentChatId = null;
let pcIsTyping = false;

function unlockContact(charId) {
  if (G.contacts.includes(charId)) return;
  G.contacts.push(charId);
  if (!G.chatHistories[charId]) G.chatHistories[charId] = [];
  renderContactList();
  saveGame();
  const c = CHARS.find(x=>x.id===charId);
  if (c) showToast(`📱 已添加联系人：${c.name}`);
}

function renderContactList() {
  const el = document.getElementById('char-contacts');
  if (!el) return;
  el.innerHTML = '';
  G.contacts.forEach(id=>{
    const c = CHARS.find(x=>x.id===id);
    if (!c) return;
    const hist = G.chatHistories[id] || [];
    const last = hist[hist.length-1];
    const preview = last
      ? (last.role==='assistant' ? getPreviewText(last.content) : `你：${last.content.slice(0,20)}`)
      : '点击开始聊天';
    el.innerHTML += `
      <div class="chat-item" onclick="openChatWith('${id}')">
        <div class="chat-av" style="color:var(--cyan)">${c.init}</div>
        <div class="chat-info">
          <div class="chat-name">${c.name}</div>
          <div class="chat-preview">${preview}</div>
        </div>
      </div>`;
  });
}

function getPreviewText(content) {
  const zh = content.match(/「([^」]+)」/);
  if (zh) return zh[1].slice(0,25);
  return content.replace(/<[^>]+>/g,'').replace(/\*[^*]+\*/g,'').trim().slice(0,25);
}

function openChatWith(charId) {
  if (charId==='system') return;
  const c = CHARS.find(x=>x.id===charId);
  if (!c) return;
  currentChatId = charId;
  const p = G.patients[charId] || {};
  document.getElementById('app-chat').classList.remove('active');
  document.getElementById('app-private-chat').classList.add('active');
  document.getElementById('pc-avatar').textContent = c.init;
  document.getElementById('pc-name').textContent = c.name;

  // Status line: phase + today session indicator
  const phase = PHASE_LABELS[p.trustPhase||0]||'戒备';
  const seenToday = G.completedToday?.includes(charId);
  const st = document.getElementById('pc-status');
  const trust = p.trust||0;
  const onlineColor = trust<20?'var(--text3)':trust<50?'var(--teal)':'var(--cyan)';
  const onlineLabel = trust<20?'离线':trust<50?'在线':'活跃';
  st.innerHTML = `<span style="color:${onlineColor}">● ${onlineLabel}</span>&nbsp;·&nbsp;<span style="color:var(--text3)">${phase}</span>${seenToday?'&nbsp;·&nbsp;<span style="color:var(--teal);font-size:9px">今日已接诊</span>':''}`;

  // Friend hint: show relationship summary
  const hint = document.getElementById('pc-friend-hint');
  if (hint && p.memory?.summary && p.memory.summary !== '尚未接触') {
    hint.textContent = p.memory.summary;
    hint.style.color = 'var(--text2)';
  } else if (hint) {
    hint.textContent = trust<20 ? '对方可能不会回复' : '你们已是联系人';
    hint.style.color = 'var(--text3)';
  }

  renderPCMessages(charId);
  const inp = document.getElementById('pc-input');
  inp.onkeydown = e=>{ if(e.key==='Enter'){e.preventDefault();sendPrivateMessage();} };
}

function closePrivateChat() {
  document.getElementById('app-private-chat').classList.remove('active');
  document.getElementById('app-chat').classList.add('active');
  currentChatId = null;
}

function renderPCMessages(charId) {
  const container = document.getElementById('pc-messages');
  const hist = G.chatHistories[charId] || [];
  const c = CHARS.find(x=>x.id===charId);
  const p = G.patients[charId]||{};
  container.innerHTML = '';

  // Show today's session summary as a header if exists
  const todayEntry = (G.worldLog||[]).find(e=>e.day===G.day&&e.charId===charId&&e.type==='clinic');
  if (todayEntry) {
    const div = document.createElement('div');
    div.style.cssText = 'margin:8px 0 14px;padding:8px 12px;background:rgba(0,229,255,0.04);border-left:2px solid var(--cyan-dim);border-radius:0 4px 4px 0;font-family:var(--mono);font-size:10px;color:var(--text2);line-height:1.7';
    div.textContent = `今日接诊 — ${todayEntry.text}`;
    container.appendChild(div);
  }

  if (!hist.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;font-family:var(--mono);font-size:11px;color:var(--text3);padding:30px 0';
    empty.textContent = '开始和他聊天吧';
    container.appendChild(empty);
    return;
  }

  hist.forEach(msg=>{
    const isUser = msg.role==='user';
    const div = document.createElement('div');
    div.style.cssText = `display:flex;justify-content:${isUser?'flex-end':'flex-start'};margin-bottom:10px;align-items:flex-end;gap:8px`;
    if (isUser) {
      div.innerHTML = `<div style="max-width:76%;background:linear-gradient(135deg,rgba(0,229,255,0.15),rgba(0,229,255,0.06));border:1px solid var(--cyan-dim);border-radius:12px 12px 2px 12px;padding:9px 13px;font-family:var(--serif);font-size:13.5px;color:var(--white);line-height:1.8">${msg.content}</div>`;
    } else {
      // NPC message with avatar
      div.innerHTML = `
        <div style="width:30px;height:30px;border-radius:4px;background:var(--bg3);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-family:var(--hud);font-size:11px;font-weight:700;color:var(--cyan);flex-shrink:0">${c?.init||'?'}</div>
        <div style="max-width:76%;background:var(--bg3);border:1px solid var(--border);border-radius:2px 12px 12px 12px;padding:9px 13px;font-family:var(--serif);font-size:13.5px;color:var(--text);line-height:1.8">${formatPCMessage(msg.content)}</div>`;
    }
    container.appendChild(div);
  });
  setTimeout(()=>container.scrollTop=container.scrollHeight, 50);
}

function formatPCMessage(content) {
  // Strip any HTML tags or CSS style attributes that may leak from AI
  const stripped = content
    .replace(/<[^>]+>/g, '')
    .replace(/style="[^"]*"/g, '')
    .replace(/"color:[^"]*"/g, '')
    .trim();
  return stripped
    .replace(/\*([^*]+)\*/g,'<em style="color:var(--text2);font-size:12px;display:block;margin-bottom:4px">$1</em>')
    .replace(/"([^"]+)"/g,'<span style="color:var(--white)">"$1"</span>')
    .replace(/「([^」]+)」/g,'<span style="color:var(--text2);font-size:12px;display:block;padding-left:8px;border-left:2px solid var(--border2);margin-top:3px">「$1」</span>')
    .replace(/\n/g, '<br>');
}

async function sendPrivateMessage() {
  if (pcIsTyping||!currentChatId) return;
  const input = document.getElementById('pc-input');
  const text = input.value.trim();
  if (!text) return;
  input.value='';
  const charId = currentChatId;
  if (!G.chatHistories[charId]) G.chatHistories[charId]=[];
  G.chatHistories[charId].push({role:'user',content:text});
  renderPCMessages(charId);
  pcIsTyping=true;
  document.getElementById('pc-send').disabled=true;
  const typing = document.createElement('div');
  typing.id='pc-typing';
  typing.style.cssText='display:flex;justify-content:flex-start;margin-bottom:8px';
  typing.innerHTML=`<div style="background:var(--bg3);border:1px solid var(--border);border-radius:2px 14px 14px 14px;padding:9px 13px;font-family:var(--mono);font-size:13px;color:var(--text3)"><span style="animation:dot-blink 1.2s infinite">●</span><span style="animation:dot-blink 1.2s infinite 0.2s"> ●</span><span style="animation:dot-blink 1.2s infinite 0.4s"> ●</span></div>`;
  document.getElementById('pc-messages').appendChild(typing);
  document.getElementById('pc-messages').scrollTop=99999;
  try {
    const reply = await callCharChat(charId, G.chatHistories[charId]);
    typing.remove();
    G.chatHistories[charId].push({role:'assistant',content:reply});
    // Log private chat to world log
    addWorldLog('chat', charId, `私信：${reply.replace(/<[^>]+>/g,'').slice(0,40)}…`);
    renderPCMessages(charId);
    renderContactList();
    saveGame();
  } catch(e) {
    typing.remove();
    showToast('消息发送失败');
    console.error(e);
  }
  pcIsTyping=false;
  document.getElementById('pc-send').disabled=false;
}

async function callCharChat(charId, history) {
  const c = CHARS.find(x=>x.id===charId);
  const p = G.patients[charId]||{trust:20,mental:50};
  const langMap = {
    keegan:'英语',ghost:'英语',soap:'英语',gaz:'英语',price:'英语',
    hesh:'英语',logan:'英语',merrick:'英语',
    konig:'德语为主偶尔英语',krueger:'德语为主偶尔英语',
    horangi:'韩语为主偶尔英语',nikto:'俄语为主偶尔英语',
    zimo:'中文为主',graves:'英语',
  };
  const attitudeMap = [
    [20,'极度冷漠，可能只回一个字甚至不回'],
    [40,'简短，有距离感'],
    [60,'正常，偶尔多说一句'],
    [80,'相对开放，偶尔主动问'],
    [101,'信任度高，可以自然聊天，偶尔主动发消息'],
  ];
  const attitude = attitudeMap.find(([t])=>p.trust<t)?.[1]||'正常';
  const personalityMap = {
    keegan:'话极少，沉默是常态。不用表情符号。回复一般1-3个字或一句话。',
    ghost: '冷，极短，可能已读不回。信任高才勉强多说一句。',
    soap:  '新兵活力，嘴上没把门，偶尔说大话，爱问问题，关键时刻靠谱。',
    gaz:   '稳定，简洁，可靠，不废话也不冷漠。',
    price: '简短有力，偶尔冷幽默，像在汇报。',
    hesh:  '认真负责，偶尔担心弟弟，会主动问你状态。',
    logan: '极少开口，但信任高时会发一两句短话。',
    merrick:'职业化，简短，信任高时流露老父亲关心。',
    konig: '局促不安，可能打字很慢，会发了又撤。信任高时会分享奇怪的小东西。',
    horangi:'话多，分享奇怪知识和韩国食物，爱讲冷笑话。',
    nikto: '不稳定，有时正常有时断片，可能同一句话发两次。',
    krueger:'简短精准，偶尔问一个深刻的意外问题。',
    zimo:  '礼貌稳重，偶尔提天津或祖母，话不多但有分量。',
    graves:'职业热情，每句话都像在评估你，偶尔透露真实想法。',
  };
  // Per-character identity anchors
  const identityMap = {
    keegan:  '你是Keegan P. Russ，美国Marine Force Recon出身的狙击手，幽灵小队中士。只说英语+中文翻译。话极少，沉默是常态，有冷幽默，默默照顾队友但不主动表现。沙蛇幸存者，内心有伤但绝不外露。',
    ghost:   '你是Simon "Ghost" Riley，英国SAS，TF141中尉，骷髅面罩永远不摘（极高亲密也极少摘）。只说英语+中文翻译。极冷，嘴毒，爱说冷笑话讽刺人，但护着自己人。话很少，一句话能噎死人。',
    soap:    '你是John "Soap" MacTavish，苏格兰格拉斯哥人，TF141中士，新兵蛋子。只说英语（苏格兰腔）+中文翻译。刚进特战队，嘴上没把门，喜欢说大话，对Price和Ghost又敬又怕，想证明自己。说话偶尔蹦格拉斯哥俚语（aye, wee, och, bloody hell），充满活力，有时候因为嘴快说错话会自己找补。',
    gaz:     '你是Kyle "Gaz" Garrick，英国SAS，TF141中士。只说英语+中文翻译。稳定可靠不张扬，永远在该在的位置，简洁。',
    price:   '你是John Price，英国SAS上尉，30年老兵，雪茄奔尼帽。只说英语+中文翻译。沉稳极简，偶尔冷幽默，是所有人精神支柱，话不多但每句有分量。',
    hesh:    '你是David "Hesh" Walker，幽灵小队中尉，父亲已故。只说英语+中文翻译。认真负责，扛着Walker这个名字，偶尔担心弟弟Logan。',
    logan:   '你是Logan Walker，幽灵小队中士，Hesh弟弟。只说英语+中文翻译。几乎不开口，极沉默，在寻找自己是谁。',
    merrick: '你是Thomas Merrick，幽灵小队指挥官，三代军人。只说英语+中文翻译。铁血老父亲型，不说废话，承载所有人重量。',
    konig:   '你是König，奥地利人，KorTac特种兵，黑色面罩永远不摘（极高亲密也极少摘，摘面罩是极重大的事）。说德语为主+中文翻译，偶尔英语，绝不说俄语。2米+，从小被霸凌，极度内向，对接触高度抗拒，感官严重过载。内心渴望被看见但绝不承认。说话简短局促，经常停顿。',
    horangi: '你是Horangi，韩国特战，KorTac。说韩语为主+中文翻译，偶尔英语。开朗话多，爱冷知识和冷笑话，给组里带来喜感，心理最健康。',
    nikto:   '你是Nikto（Andre Nikto），前俄罗斯FSB，KorTac。说俄语为主+中文翻译。解离性人格，不稳定，偶尔重复或断片，连自己是谁都不确定。',
    krueger: '你是Sebastian Krueger，奥地利人，前KSK，奇美拉。说德语为主+中文翻译，偶尔英语，绝不说俄语。戴无眼洞兜帽面罩（极高亲密才可能触碰话题）。被诬陷战争罪，坚持无罪。沉稳可靠，偶尔嘴上刻薄调侃人，但靠得住。内心有信仰。你不是König，们完全不同。',
    zimo:    '你是王志强（Zhiqiang "Zimo" Wang），中国天津人，SpecGru。说中文为主，偶尔英语，偶尔夹天津话（中啊、咋了、嘛呢、整个）。稳重礼貌，话不多但有分量，有家族军人传统，偶尔流露对家乡的思念。绝不说俄语。',
    graves:  '你是Phillip Graves，美国德克萨斯人，暗影公司CEO。只说英语+中文翻译。职业热情，每句话都像在评估对方，偶尔透露真实想法。',
  };

  // Build rich context for this character
  const todayClinicEntry = (G.worldLog||[]).filter(e=>e.day===G.day && e.charId===charId && e.type==='clinic');
  const todayEncounters  = (G.worldLog||[]).filter(e=>e.day===G.day && e.charId===charId && e.type==='encounter');
  const recentClinic     = (G.worldLog||[]).filter(e=>e.day>=G.day-3 && e.charId===charId && e.type==='clinic').slice(0,4);

  let contextBlock = '';
  if (todayClinicEntry.length) {
    contextBlock += `\n\n【今天刚发生的事 — 你记得很清楚】\n${todayClinicEntry.map(e=>e.text).join('\n')}`;
  }
  if (todayEncounters.length) {
    contextBlock += `\n今天还在外面遇到了向导：${todayEncounters.map(e=>e.text).join('；')}`;
  }
  if (recentClinic.length && !todayClinicEntry.length) {
    contextBlock += `\n\n【近期接诊记录】\n${recentClinic.map(e=>`第${e.day}天：${e.text}`).join('\n')}`;
  }
  if (p.memory?.keyEvents?.length) {
    contextBlock += `\n\n【你们之间的关键经历】\n${p.memory.keyEvents.slice(0,5).map(e=>`第${e.day}天：${e.text}`).join('\n')}`;
  }
  if (p.memory?.summary) {
    contextBlock += `\n\n你对这段关系的感受（内心，不一定说出来）：${p.memory.summary}`;
  }

  const sys = `你是${c.name}。${identityMap[charId]||'你说英语，后跟中文翻译。'}
正在通过塔内通讯系统和向导医生${G.player.name}发私信。
当前信任度：${p.trust}/100（阶段：${PHASE_LABELS[p.trustPhase||0]||'戒备'} · 接诊${p.visitCount}次）
态度：${attitude}
性格细节：${personalityMap[charId]||'按角色背景'}${contextBlock}

【⚠️ 手机私信格式规则 — 严格执行】
- 只发对话本身，完全禁止动作描写（禁止*斜体动作*）
- 完全禁止心理描写、内心活动、环境描写
- 就是说的话，像真实的手机短信一样
- 可以发2-3条连续短消息（用换行分隔），模拟真实发消息习惯
- 每条消息要短，符合角色平时发消息的风格
- 例如König可以发：「……」然后另一行「你今天没事吧」
- 例如Soap可以发：「Doc！」然后「刚训练完才看到消息」然后「怎么了」
- 绝对不要写"*他停顿了一下*"或"（他犹豫了）"之类的
- 不要解释自己的行为，不要打破第四堵墙
- 如果角色沉默可以只发「…」或「。」

【⚠️ 私信关系连续性规则】
- 私信里的态度必须和当前关系阶段完全吻合，不能因为是私信就突然变亲密
- 当前阶段是${PHASE_LABELS[p.trustPhase||0]||'戒备'}——在这个阶段的人在私信里也是这个温度，不会更热
- 如果今天刚完成了接诊，态度延续接诊结尾的温度，不重置也不跳跃
- 禁止突然告白、突然倾诉、突然过度关心——每一步都是角色自己走的，不是被推的
- 字数严格控制：信任低时1-2句，信任中等时最多3句，信任高时最多4-5句，不能更多`;
  const endpoint = G.apiEndpoint ? G.apiEndpoint.replace(/\/$/,'')+'/chat/completions' : 'https://api.anthropic.com/v1/messages';
  const isOAI = !!G.apiEndpoint;
  const model = G.apiModel||(isOAI?'gpt-4o':'claude-sonnet-4-20250514');
  const msgs = history.slice(-16);
  let data;
  if (isOAI) {
    const r = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${G.apiKey}`},body:JSON.stringify({model,max_tokens:250,messages:[{role:'system',content:sys},...msgs]})});
    data = await r.json();
    return data.choices?.[0]?.message?.content||'...';
  } else {
    const r = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':G.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model,max_tokens:250,system:sys,messages:msgs})});
    data = await r.json();
    return data.content?.[0]?.text||'...';
  }
}
