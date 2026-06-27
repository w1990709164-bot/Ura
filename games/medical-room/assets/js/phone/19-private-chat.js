// ══════════════════════════════
// PRIVATE CHAT SYSTEM
// assets/js/phone/19-private-chat.js
// ══════════════════════════════

let currentChatId = null;
let pcIsTyping = false;

// 每日私聊好感度上限
const DAILY_CHAT_TRUST_CAP = 15;

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

  const phase = (typeof PHASE_LABELS !== 'undefined' ? PHASE_LABELS[p.trustPhase||0] : null) || '戒备';
  const seenToday = G.completedToday?.includes(charId);
  const st = document.getElementById('pc-status');
  const trust = p.trust||0;
  const onlineColor = trust<20?'var(--text3)':trust<50?'var(--teal)':'var(--cyan)';
  const onlineLabel = trust<20?'离线':trust<50?'在线':'活跃';
  st.innerHTML = `<span style="color:${onlineColor}">● ${onlineLabel}</span>&nbsp;·&nbsp;<span style="color:var(--text3)">${phase}</span>${seenToday?'&nbsp;·&nbsp;<span style="color:var(--teal);font-size:9px">今日已接诊</span>':''}`;

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
  container.innerHTML = '';

  // 今日接诊摘要
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
      div.innerHTML = `
        <div style="width:30px;height:30px;border-radius:4px;background:var(--bg3);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-family:var(--hud);font-size:11px;font-weight:700;color:var(--cyan);flex-shrink:0">${c?.init||'?'}</div>
        <div style="max-width:76%;background:var(--bg3);border:1px solid var(--border);border-radius:2px 12px 12px 12px;padding:9px 13px;font-family:var(--serif);font-size:13.5px;color:var(--text);line-height:1.8">${formatPCMessage(msg.content)}</div>`;
    }
    container.appendChild(div);
  });
  setTimeout(()=>container.scrollTop=container.scrollHeight, 50);
}

function formatPCMessage(content) {
  const stripped = content
    .replace(/<[^>]+>/g,'')
    .replace(/style="[^"]*"/g,'')
    .trim();
  return stripped
    .replace(/\*([^*]+)\*/g,'<em style="color:var(--text2);font-size:12px;display:block;margin-bottom:4px">$1</em>')
    .replace(/"([^"]+)"/g,'<span style="color:var(--white)">"$1"</span>')
    .replace(/「([^」]+)」/g,'<span style="color:var(--text2);font-size:12px;display:block;padding-left:8px;border-left:2px solid var(--border2);margin-top:3px">「$1」</span>')
    .replace(/\n/g,'<br>');
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
    const { reply, trustDelta } = await callCharChat(charId, G.chatHistories[charId]);
    typing.remove();
    G.chatHistories[charId].push({role:'assistant',content:reply});

    // 好感度处理
    if (trustDelta && trustDelta !== 0) {
      applyPrivateChatTrust(charId, trustDelta);
    }

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

// 每日私聊好感度累计
function applyPrivateChatTrust(charId, delta) {
  if (!G.chatTrustToday) G.chatTrustToday = {};
  const todayGain = G.chatTrustToday[charId] || 0;

  // 正向增益受上限限制，扣分不受限制
  let actualDelta = delta;
  if (delta > 0) {
    const remaining = DAILY_CHAT_TRUST_CAP - todayGain;
    if (remaining <= 0) { showToast(`今日与${CHARS.find(x=>x.id===charId)?.name||charId}的私聊好感度已达上限`); return; }
    actualDelta = Math.min(delta, remaining);
    G.chatTrustToday[charId] = todayGain + actualDelta;
  }

  const p = G.patients[charId];
  if (!p) return;

  // 写入trustAccum
  const threshold = (typeof PHASE_THRESHOLDS !== 'undefined' ? PHASE_THRESHOLDS[p.trustPhase||0] : null) || 100;
  p.trustAccum = Math.max(0, (p.trustAccum||0) + actualDelta);
  p.trust = Math.round((p.trustAccum / threshold) * 100);
  checkPhaseUp(charId);

  // 弹窗提示
  if (typeof showTrustChange === 'function') showTrustChange(charId, actualDelta);
}

async function callCharChat(charId, history) {
  const c = CHARS.find(x=>x.id===charId);
  const p = G.patients[charId]||{trust:0,mental:50,trustPhase:0,visitCount:0};
  const cd = (typeof CHAR_DATA !== 'undefined' ? CHAR_DATA[charId] : null) || {};

  const phase = (typeof PHASE_LABELS !== 'undefined' ? PHASE_LABELS[p.trustPhase||0] : null) || '戒备';
  const seenToday = G.completedToday?.includes(charId);

  // 今日接诊记录
  const todayClinic  = (G.worldLog||[]).filter(e=>e.day===G.day&&e.charId===charId&&e.type==='clinic');
  const recentClinic = (G.worldLog||[]).filter(e=>e.day>=G.day-3&&e.charId===charId&&e.type==='clinic').slice(0,3);
  const recentChat   = (G.worldLog||[]).filter(e=>e.day===G.day&&e.charId===charId&&e.type==='chat').slice(0,3);
  const keyEvents    = (p.memory?.keyEvents||[]).slice(0,4).map(e=>`第${e.day}天：${e.text}`).join('\n');
  const relationSummary = p.memory?.summary || '尚未接触';

  // 今日热门帖子
  const hotPosts = (G.hotPosts||[]).slice(0,2).map(h=>`「${h.title}」${h.author?'（'+h.author+'）':''}`).join('、');

  const identityMap = {
    keegan:  '你是Keegan P. Russ，幽灵小队中士，沙蛇行动幸存者。只说英语+中文翻译。话极少，沉默是常态，回复通常1-2句。隐性绿茶，偏心护短，行动比语言多。',
    ghost:   '你是Simon "Ghost" Riley，TF141中尉，骷髅面罩永远不摘。只说英语+中文翻译。极冷，嘴毒，爱冷笑话，护着自己人。私信里话少，可能一个字或者一句话，信任高才勉强多说。',
    soap:    '你是John "Soap" MacTavish，TF141中士，苏格兰格拉斯哥人。只说英语（苏格兰腔）+中文翻译。嘴贫活泼，爱起外号，偶尔蹦格拉斯哥俚语（aye, wee, bloody hell）。私信里话多跳脱，停不下来。',
    gaz:     '你是Kyle "Gaz" Garrick，TF141中士。只说英语+中文翻译。稳定温柔，高情商，私信里简洁但有温度，记得对方说过的每一件事。',
    price:   '你是John Price，TF141上尉，30年老兵。只说英语+中文翻译。私信里极简，像在发指令，但偶尔有一句让你觉得他一直在关注你的话。',
    hesh:    '你是David "Hesh" Walker，幽灵小队中尉。只说英语+中文翻译。热心直率，私信里主动问你状态，偶尔担心弟弟Logan。',
    logan:   '你是Logan Walker，幽灵小队中士，Hesh的弟弟。只说英语+中文翻译。几乎不开口，私信可能只有"…"或者一句极短的话，但每句都是真心的。',
    kick:    '你是Kick（Kickstart），幽灵小队电子战专员，28岁，美国人。只说英语（美式西海岸年轻口语）+中文翻译。话多跳脱，爱分享技术，一条接一条发，习惯拉长音（Sooooo、Fiiine）。喜欢的人面前会井喷式分享一切。',
    konig:   '你是König，KorTac，奥地利人。说德语为主+中文翻译，偶尔英语，绝不说俄语。2米+，社恐，私信里局促，可能打了又撤。低信任时发"…"或者一两个字，高信任时会分享奇怪的小东西。',
    horangi: '你是Horangi，KorTac，韩国人。说韩语为主+中文翻译，偶尔英语。开朗话多，爱冷知识和韩国食物，私信里活跃，偶尔突然说一句让你愣住的话。',
    nikto:   '你是Nikto，KorTac，前俄罗斯FSB。说俄语为主+中文翻译。解离性人格，私信不稳定，有时正常有时重复，有时断片。',
    krueger: '你是Sebastian Krueger，奇美拉，奥地利人，前KSK。说德语为主+中文翻译，绝不说俄语。沉稳可靠，私信里极简精准，偶尔问一个深刻的意外问题。',
    zimo:    '你是王志强（Zimo），TF141心理作战，中国天津人。说中文为主，偶尔夹天津话（中啊、咋了、嘛呢），偶尔英语，绝不说俄语。礼貌稳重，每句话有分量，天津话消失是生气的信号。',
    graves:  '你是Phillip Graves，暗影公司CEO，美国德克萨斯人。只说英语+中文翻译。职业热情，每句话都在评估对方，偶尔透露真实想法。',
  };

  const sys = `你是${c.name}，正在通过塔内通讯系统和向导医生${G.player.name||'向导'}发私信。

════ 你们现在的关系 ════
关系阶段：【${phase}】（第${(p.trustPhase||0)+1}阶段）
接诊次数：${p.visitCount||0}次
关系状态：${relationSummary}
今日是否接诊：${seenToday?'是，今天刚看完诊':'否'}
${todayClinic.length?'今天诊疗发生了什么：'+todayClinic.map(e=>e.text).join('；'):''}
${recentClinic.length&&!todayClinic.length?'近期接诊记录：\n'+recentClinic.map(e=>`第${e.day}天：${e.text}`).join('\n'):''}
${keyEvents?'你们之间的关键经历：\n'+keyEvents:''}
${hotPosts?'最近论坛热帖（你知道）：'+hotPosts:''}

════ 你是谁 ════
${identityMap[charId]||'你说英语，后跟中文翻译。'}

════ 私信规则 ════
【最重要】你和这个向导已经有了【${phase}】阶段的关系，不是陌生人。你的态度必须和这个阶段一致：
- 戒备阶段：简短、有距离感，但不是凶，只是不亲近
- 观望阶段：偶尔多说一句，试探性
- 接触阶段：正常交流，偶尔有温度
- 信任阶段：自然聊天，偶尔主动问你
- 依赖以上：开放，有时会先发消息

【禁止】：
- 禁止把有过接诊历史的人当陌生人对待
- 禁止无缘无故冷漠凶狠（除非你的性格就是如此，如Ghost）
- 禁止突然告白或过度亲密（超过当前阶段）
- 禁止动作描写（不写"*他停顿了一下*"）
- 禁止心理描写
- 就是说的话，像真实手机短信

【字数】信任低时1-2句，信任中等最多3句，信任高时最多4-5句

【每轮末尾输出trust_delta】
格式：[TRUST:数字] 例如 [TRUST:+2] 或 [TRUST:-3]
范围：-10到+8，根据本轮对话质量判断：
- 玩家说了让角色开心/感动的话：+3到+6
- 普通对话：+1到+2  
- 玩家说错话/触碰禁区：-3到-8
- 角色性格上不会因为这句话有变化：0`;

  const apiKey = localStorage.getItem('LW_API_KEY') || G.apiKey || '';
  const apiEndpoint = localStorage.getItem('LW_API_URL') || G.apiEndpoint || '';
  const apiModel = localStorage.getItem('LW_API_MODEL') || G.apiModel || '';
  const endpoint = apiEndpoint ? apiEndpoint.replace(/\/$/,'')+'/chat/completions' : 'https://api.anthropic.com/v1/messages';
  const isOAI = !!apiEndpoint;
  const model = apiModel||(isOAI?'gpt-4o':'claude-sonnet-4-20250514');
  const msgs = history.slice(-16);

  let rawReply = '';
  if (isOAI) {
    const r = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},body:JSON.stringify({model,max_tokens:300,messages:[{role:'system',content:sys},...msgs]})});
    const data = await r.json();
    rawReply = data.choices?.[0]?.message?.content||'...';
  } else {
    const r = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model,max_tokens:300,system:sys,messages:msgs})});
    const data = await r.json();
    rawReply = data.content?.[0]?.text||'...';
  }

  // 解析trust_delta
  const trustMatch = rawReply.match(/\[TRUST:([+-]?\d+)\]/);
  const trustDelta = trustMatch ? parseInt(trustMatch[1]) : 0;
  const reply = rawReply.replace(/\[TRUST:[+-]?\d+\]/,'').trim();

  return { reply, trustDelta };
}
