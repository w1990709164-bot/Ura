// ══════════════════════════════
// LANDSCAPE JOURNEY SYSTEM
// assets/js/systems/landscape-journey.js
// 精神图景探索系统
// ══════════════════════════════

// ── 抵抗值计算 ──
function calcResistance(charId) {
  const p = G.patients[charId];
  if (!p) return 100;
  const phase = p.trustPhase || 0;
  return Math.max(10, 100 - phase * 10);
}

function calcShieldCost(charId, forced) {
  const resistance = calcResistance(charId);
  if (forced) return Math.round(20 + resistance * 0.2);
  return Math.round(10 + resistance * 0.1);
}

// ── 进入图景确认弹窗 ──
function showLandscapeEntryPrompt(charId) {
  const c = CHARS.find(x => x.id === charId);
  const p = G.patients[charId];
  const cd = (typeof CHAR_DATA !== 'undefined' ? CHAR_DATA[charId] : null) || {};
  if (!c || !p) return;

  const existing = document.getElementById('landscape-entry-modal');
  if (existing) existing.remove();
  const existingBg = document.getElementById('landscape-entry-bg');
  if (existingBg) existingBg.remove();

  const resistance = calcResistance(charId);
  const costNeg = calcShieldCost(charId, false);
  const costForce = calcShieldCost(charId, true);
  const phase = (typeof PHASE_LABELS !== 'undefined' ? PHASE_LABELS[p.trustPhase||0] : null) || '戒备';
  const shieldNow = G.playerStats?.shield ?? 100;

  const resistColor = resistance > 70 ? 'var(--pink,#ff2d6b)' :
                      resistance > 40 ? 'var(--yellow,#ffd600)' : 'var(--teal,#00ffcc)';

  const bg = document.createElement('div');
  bg.id = 'landscape-entry-bg';
  bg.style.cssText = 'position:fixed;inset:0;background:rgba(5,8,16,0.92);z-index:9499;backdrop-filter:blur(8px)';
  document.body.appendChild(bg);

  const modal = document.createElement('div');
  modal.id = 'landscape-entry-modal';
  modal.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    z-index:9500;background:#050810;
    border:1px solid #1a2840;border-radius:4px;
    width:min(370px,93vw);
    box-shadow:0 0 60px rgba(0,180,255,0.1);
    animation:msg-in 0.25s ease-out;
    font-family:'Share Tech Mono',monospace;
    overflow:hidden;
  `;

  modal.innerHTML = `
    <div style="background:linear-gradient(180deg,#0a1828,#050810);border-bottom:1px solid #1a2840;padding:16px">
      <div style="font-size:9px;color:#2a4050;letter-spacing:3px;margin-bottom:10px">精神图景进入确认</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div style="width:40px;height:40px;border-radius:3px;background:#0a1828;border:1px solid #1a3040;display:flex;align-items:center;justify-content:center;font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:#00e5ff;flex-shrink:0">${c.init}</div>
        <div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:#e8f4ff">${c.name}</div>
          <div style="font-size:10px;color:#5a7a90;margin-top:2px">${cd.landscape||'未知图景'} · ${cd.landscapeDesc||''}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px">
        <div style="background:#0a1520;border:1px solid #0f1e2a;border-radius:3px;padding:8px;text-align:center">
          <div style="font-size:9px;color:#2a4050;margin-bottom:4px">精神力</div>
          <div style="font-size:14px;color:#c8dde8;font-weight:700">${p.mental||50}</div>
        </div>
        <div style="background:#0a1520;border:1px solid #0f1e2a;border-radius:3px;padding:8px;text-align:center">
          <div style="font-size:9px;color:#2a4050;margin-bottom:4px">关系阶段</div>
          <div style="font-size:11px;color:#00e5ff;font-weight:700">${phase}</div>
        </div>
        <div style="background:#0a1520;border:1px solid #0f1e2a;border-radius:3px;padding:8px;text-align:center">
          <div style="font-size:9px;color:#2a4050;margin-bottom:4px">抵抗值</div>
          <div style="font-size:14px;font-weight:700;color:${resistColor}">${resistance}</div>
        </div>
      </div>

      <div style="background:#0a1520;border:1px solid #0f1e2a;border-radius:3px;padding:10px;margin-bottom:4px">
        <div style="font-size:10px;color:#5a7a90;line-height:1.8">
          <div>当前精神屏障：<span style="color:${shieldNow<30?'var(--pink)':'#c8dde8'}">${shieldNow}</span></div>
          <div>精神体状态：<span style="color:#c8dde8">${p.spiritStatus||cd.spiritStatus||'未知'}</span></div>
          <div style="margin-top:6px;color:#2a4050;font-size:9px">进入图景后玩家与对方的精神体直接接触，可能遭遇抵抗、迷失或感染。</div>
        </div>
      </div>
    </div>

    <div style="padding:14px 16px;border-bottom:1px solid #0f1e2a">
      <div style="font-size:9px;color:#2a4050;letter-spacing:2px;margin-bottom:10px">进入方式</div>
      <div style="display:flex;gap:8px">
        <div onclick="enterLandscape('${charId}',false)" style="flex:1;background:#0a1520;border:1px solid #1a3040;border-radius:4px;padding:12px;cursor:pointer;transition:all 0.2s" onmousedown="this.style.borderColor='var(--teal)'">
          <div style="font-size:11px;font-weight:700;color:#00ffcc;margin-bottom:6px">协商进入</div>
          <div style="font-size:10px;color:#5a7a90;line-height:1.7">经对方意识引导，进入阻力较小。</div>
          <div style="margin-top:8px;font-size:10px">
            <span style="color:#2a4050">屏障消耗：</span>
            <span style="color:#00ffcc">-${costNeg}</span>
          </div>
        </div>
        <div onclick="enterLandscape('${charId}',true)" style="flex:1;background:#0a1520;border:1px solid #1a3040;border-radius:4px;padding:12px;cursor:pointer;transition:all 0.2s" onmousedown="this.style.borderColor='var(--pink)'">
          <div style="font-size:11px;font-weight:700;color:#ff2d6b;margin-bottom:6px">强硬进入</div>
          <div style="font-size:10px;color:#5a7a90;line-height:1.7">无需对方同意，强行突入，抵抗更强。</div>
          <div style="margin-top:8px;font-size:10px">
            <span style="color:#2a4050">屏障消耗：</span>
            <span style="color:#ff2d6b">-${costForce}</span>
            <span style="color:#2a4050;margin-left:6px">污染：</span>
            <span style="color:#ff2d6b">+5</span>
          </div>
        </div>
      </div>
    </div>

    <div style="padding:12px 16px">
      <button onclick="closeLandscapeEntry()" style="width:100%;padding:9px;background:none;border:1px solid #1a2840;border-radius:3px;color:#2a4050;font-family:'Share Tech Mono',monospace;font-size:11px;cursor:pointer;letter-spacing:1px">
        取消
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeLandscapeEntry() {
  document.getElementById('landscape-entry-modal')?.remove();
  document.getElementById('landscape-entry-bg')?.remove();
}

// ── 进入图景 ──
function enterLandscape(charId, forced) {
  closeLandscapeEntry();

  const c  = CHARS.find(x => x.id === charId);
  const p  = G.patients[charId];
  const cd = (typeof CHAR_DATA !== 'undefined' ? CHAR_DATA[charId] : null) || {};
  if (!c || !p) return;

  // 扣除屏障/污染
  const cost = calcShieldCost(charId, forced);
  G.playerStats.shield = Math.max(0, (G.playerStats.shield ?? 100) - cost);
  if (forced) G.playerStats.contam = Math.min(100, (G.playerStats.contam ?? 0) + 5);

  // 标记已进入
  p.landscapeEntered = true;
  p.lastVisit = `第${G.day}天`;
  if (forced && p.trustAccum > 0) {
    // 强硬进入扣好感
    p.trustAccum = Math.max(0, p.trustAccum - 8);
    const threshold = (typeof PHASE_THRESHOLDS !== 'undefined' ? PHASE_THRESHOLDS[p.trustPhase||0] : null) || 100;
    p.trust = Math.round((p.trustAccum / threshold) * 100);
    if (typeof showTrustChange === 'function') showTrustChange(charId, -8);
  }

  // 记录worldLog
  if (typeof addWorldLog === 'function') {
    addWorldLog('landscape', charId, `${forced?'强硬':'协商'}进入${c.name}的精神图景「${cd.landscape||'未知'}」。屏障-${cost}。`);
  }

  saveGame();

  // 构建图景界面
  showLandscapeScreen(charId, forced);
}

// ── 图景主界面 ──
function showLandscapeScreen(charId, forced) {
  const c  = CHARS.find(x => x.id === charId);
  const cd = (typeof CHAR_DATA !== 'undefined' ? CHAR_DATA[charId] : null) || {};
  const p  = G.patients[charId];

  const existing = document.getElementById('landscape-screen');
  if (existing) existing.remove();

  const screen = document.createElement('div');
  screen.id = 'landscape-screen';
  screen.style.cssText = `
    position:fixed;inset:0;z-index:9600;
    background:#020508;
    display:flex;flex-direction:column;
    font-family:'Noto Serif SC',serif;
    animation:fade-in-slow 0.8s ease-out;
    overflow:hidden;
  `;

  // 顶部状态栏
  const shieldNow = G.playerStats?.shield ?? 100;
  const contam    = G.playerStats?.contam  ?? 0;

  screen.innerHTML = `
    <!-- 顶部栏 -->
    <div id="ls-topbar" style="flex-shrink:0;background:rgba(2,5,8,0.95);border-bottom:1px solid #0f1e2a;padding:10px 16px;display:flex;align-items:center;gap:10px">
      <div style="flex:1">
        <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:#2a4050;letter-spacing:2px;margin-bottom:2px">精神图景 · ${c.name}</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;color:#8aa0b8">${cd.landscape||'未知图景'}</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center">
        <div style="text-align:center">
          <div style="font-family:'Share Tech Mono',monospace;font-size:8px;color:#2a4050">屏障</div>
          <div id="ls-shield" style="font-family:'Share Tech Mono',monospace;font-size:12px;color:${shieldNow<30?'#ff2d6b':'#00e5ff'}">${shieldNow}</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Share Tech Mono',monospace;font-size:8px;color:#2a4050">污染</div>
          <div id="ls-contam" style="font-family:'Share Tech Mono',monospace;font-size:12px;color:${contam>50?'#ff2d6b':'#5a7a90'}">${contam}</div>
        </div>
        <button onclick="exitLandscape('${charId}')" style="background:rgba(255,45,107,0.08);border:1px solid rgba(255,45,107,0.3);border-radius:3px;color:#ff2d6b;font-family:'Share Tech Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;letter-spacing:1px">
          退出
        </button>
      </div>
    </div>

    <!-- 叙事区域 -->
    <div id="ls-narrative" style="flex:1;overflow-y:auto;padding:20px 18px;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:14px">
      <!-- 内容由AI生成填充 -->
    </div>

    <!-- 底部选项区 -->
    <div id="ls-options" style="flex-shrink:0;padding:12px 16px;border-top:1px solid #0f1e2a;background:rgba(2,5,8,0.95)">
      <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:#2a4050;letter-spacing:2px;margin-bottom:8px">— 选择路线 —</div>
      <div id="ls-options-list" style="display:flex;flex-direction:column;gap:6px">
        <!-- 选项由AI生成 -->
        <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:#2a4050;text-align:center;padding:10px">正在进入图景…</div>
      </div>
    </div>
  `;

  document.body.appendChild(screen);

  // 初始化图景历史
  if (!G.landscapeHistory) G.landscapeHistory = {};
  G.landscapeHistory[charId] = [];
  G.currentLandscape = { charId, forced, depth:0, spiritFound:false };

  // 调用AI生成开场
  callLandscapeAI(charId, `[进入图景] 向导${forced?'强硬':'协商'}进入${c.name}的精神图景「${cd.landscape||'未知'}」（${cd.landscapeDesc||''}）。请生成进入瞬间的感知叙事，描写图景的氛围和初始环境，然后给出3条探索路线。格式：叙事内容...\n[ROUTES: A.路线描述（风险等级）| B.路线描述（风险等级）| C.路线描述（风险等级）]`);
}

// ── 图景AI调用 ──
async function callLandscapeAI(charId, userMsg) {
  const c  = CHARS.find(x => x.id === charId);
  const p  = G.patients[charId];
  const cd = (typeof CHAR_DATA !== 'undefined' ? CHAR_DATA[charId] : null) || {};
  if (!c || !p) return;

  // 显示思考状态
  const narrative = document.getElementById('ls-narrative');
  const thinking  = document.createElement('div');
  thinking.id = 'ls-thinking';
  thinking.style.cssText = 'font-family:"Share Tech Mono",monospace;font-size:11px;color:#2a4050;text-align:center;padding:20px;letter-spacing:2px';
  thinking.textContent = '…';
  narrative?.appendChild(thinking);
  narrative?.scrollTo(0, narrative.scrollHeight);

  const phase = (typeof PHASE_LABELS !== 'undefined' ? PHASE_LABELS[p.trustPhase||0] : null) || '戒备';
  const lc    = G.currentLandscape || {};

  const systemPrompt = `你是精神图景探索叙事引擎，负责描述向导进入哨兵精神世界的体验。

【当前图景】
患者：${c.name}（${c.unit}）
精神体：${cd.spirit||'未知'}（${cd.spiritDesc||''}）
图景名称：${cd.landscape||'未知'}
图景描述：${cd.landscapeDesc||''}
图景状态：${p.landscapeStatus||cd.landscapeStatus||'稳定'}

【向导状态】
关系阶段：${phase}（第${(p.trustPhase||0)+1}阶段）
进入方式：${lc.forced?'强硬进入（对方有抵抗）':'协商进入（较为顺畅）'}
当前深度：第${lc.depth||0}层
精神屏障：${G.playerStats?.shield??100}
污染度：${G.playerStats?.contam??0}
精神体是否找到：${lc.spiritFound?'是':'否'}

【叙事规则】
1. 用第二人称（"你"）描写向导的感知体验
2. 图景环境必须和${cd.landscape||'未知'}一致，细节要有沉浸感
3. 每段叙事150-250字，不要过长
4. 精神体（${cd.spirit||'精神体'}）的出现要循序渐进——先是痕迹/气息，再是轮廓，最后才是正面接触
5. 向导的精神体也可以出现，帮助感知环境
6. 图景越深层，越接近患者的核心创伤，叙事要越沉重
7. 强硬进入时，环境会有排斥感：雾气加重、路线消失、感到被推开

【选项格式】
每次叙事结束后，必须提供路线选项：
[ROUTES: A.选项（安全/危险/未知）| B.选项（安全/危险/未知）| C.选项（安全/危险/未知）]

找到精神体后，选项变为治疗选项：
[TREAT: A.治疗方式 | B.治疗方式 | C.治疗方式]

治疗结束后输出：
[LANDSCAPE_END: success/partial/fail] 
并在结尾写明结果（精神力变化、与向导的关系变化等）

【景深数值格式（每轮必须输出）】
<lscape>{"depth_delta":数字,"shield_cost":数字,"contam_delta":数字,"trust_delta":数字,"mental_delta":数字,"spirit_found":true或false,"end":true或false,"end_result":"success/partial/fail/null"}</lscape>`;

  if (!G.landscapeHistory) G.landscapeHistory = {};
  if (!G.landscapeHistory[charId]) G.landscapeHistory[charId] = [];
  G.landscapeHistory[charId].push({ role:'user', content: userMsg });

  const endpoint = G.apiEndpoint ? G.apiEndpoint.replace(/\/$/,'')+'/chat/completions' : 'https://api.anthropic.com/v1/messages';
  const isOAI = !!G.apiEndpoint;
  const model  = G.apiModel || (isOAI ? 'gpt-4o' : 'claude-sonnet-4-20250514');

  try {
    let rawText = '';
    if (isOAI) {
      const r = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${G.apiKey}`},body:JSON.stringify({model,max_tokens:800,messages:[{role:'system',content:systemPrompt},...G.landscapeHistory[charId]]})});
      const d = await r.json();
      rawText = d.choices?.[0]?.message?.content || '';
    } else {
      const r = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':G.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model,max_tokens:800,system:systemPrompt,messages:G.landscapeHistory[charId]})});
      const d = await r.json();
      rawText = d.content?.[0]?.text || '';
    }

    G.landscapeHistory[charId].push({ role:'assistant', content: rawText });
    document.getElementById('ls-thinking')?.remove();
    processLandscapeResponse(charId, rawText);

  } catch(e) {
    document.getElementById('ls-thinking')?.remove();
    appendLandscapeNarr('…（感知失联，请重试）');
    console.error('[landscape AI error]', e);
  }
}

// ── 处理图景AI回复 ──
function processLandscapeResponse(charId, rawText) {
  const p  = G.patients[charId];
  const lc = G.currentLandscape || {};

  // 解析 lscape 数值块
  const lscapeMatch = rawText.match(/<lscape>([\s\S]*?)<\/lscape>/);
  if (lscapeMatch) {
    try {
      const ls = JSON.parse(lscapeMatch[1].trim());
      if (ls.depth_delta)   lc.depth = (lc.depth||0) + ls.depth_delta;
      if (ls.shield_cost)   G.playerStats.shield  = Math.max(0, (G.playerStats.shield??100)  - ls.shield_cost);
      if (ls.contam_delta)  G.playerStats.contam  = Math.min(100,(G.playerStats.contam??0)   + ls.contam_delta);
      if (ls.trust_delta && p) {
        p.trustAccum = Math.max(0, (p.trustAccum||0) + ls.trust_delta);
        const thr = (typeof PHASE_THRESHOLDS!=='undefined'?PHASE_THRESHOLDS[p.trustPhase||0]:null)||100;
        p.trust = Math.round((p.trustAccum/thr)*100);
        if (typeof checkPhaseUp === 'function') checkPhaseUp(charId);
        if (typeof showTrustChange === 'function' && ls.trust_delta !== 0) showTrustChange(charId, ls.trust_delta);
      }
      if (ls.mental_delta && p) {
        p.mental = Math.max(0, Math.min(100, (p.mental||50) + ls.mental_delta));
      }
      if (ls.spirit_found) lc.spiritFound = true;

      // 更新顶栏数值
      const shieldEl = document.getElementById('ls-shield');
      const contamEl = document.getElementById('ls-contam');
      if (shieldEl) { shieldEl.textContent = G.playerStats.shield; shieldEl.style.color = G.playerStats.shield<30?'#ff2d6b':'#00e5ff'; }
      if (contamEl) { contamEl.textContent = G.playerStats.contam; contamEl.style.color = G.playerStats.contam>50?'#ff2d6b':'#5a7a90'; }

      // 图景结束
      if (ls.end === true) {
        const result = ls.end_result || 'partial';
        setTimeout(() => finishLandscape(charId, result), 1200);
        saveGame();
        return;
      }
    } catch(e) { console.warn('[lscape parse error]', e); }
  }

  // 提取叙事正文
  const narrative = rawText
    .replace(/<lscape>[\s\S]*?<\/lscape>/g, '')
    .replace(/\[ROUTES:[\s\S]*?\]/g, '')
    .replace(/\[TREAT:[\s\S]*?\]/g, '')
    .replace(/\[LANDSCAPE_END:[^\]]*\]/g, '')
    .trim();

  if (narrative) appendLandscapeNarr(narrative);

  // 解析选项
  const routeMatch = rawText.match(/\[ROUTES:\s*([\s\S]*?)\]/);
  const treatMatch = rawText.match(/\[TREAT:\s*([\s\S]*?)\]/);
  const endMatch   = rawText.match(/\[LANDSCAPE_END:\s*(\w+)\]/);

  if (endMatch) {
    setTimeout(() => finishLandscape(charId, endMatch[1]), 1200);
    return;
  }

  if (treatMatch) {
    renderLandscapeOptions(charId, treatMatch[1], true);
  } else if (routeMatch) {
    renderLandscapeOptions(charId, routeMatch[1], false);
  }

  saveGame();
}

// ── 渲染图景选项 ──
function renderLandscapeOptions(charId, optStr, isTreat) {
  const list = document.getElementById('ls-options-list');
  const header = list?.previousElementSibling;
  if (!list) return;

  if (header) header.textContent = isTreat ? '— 治疗方式 —' : '— 选择路线 —';

  const parts = optStr.split('|').map(s => s.trim()).filter(Boolean);
  const opts  = parts.map((raw, i) => {
    const text = raw.replace(/^[A-C][\.。]\s*/, '').trim();
    const riskMatch = text.match(/（(安全|危险|未知)）/);
    const risk = riskMatch ? riskMatch[1] : null;
    const label = text.replace(/（(安全|危险|未知)）/, '').trim();
    return { label, risk, idx: i };
  });

  const riskColor = { '安全':'#00ffcc', '危险':'#ff2d6b', '未知':'#ffd600' };

  list.innerHTML = opts.map(o => `
    <div onclick="chooseLandscapeOption('${charId}','${escStr(o.label)}',${isTreat})"
      style="display:flex;align-items:center;gap:10px;padding:10px 12px;
        background:#0a1520;border:1px solid #1a2840;border-radius:4px;
        cursor:pointer;transition:all 0.2s"
      onmousedown="this.style.borderColor='var(--cyan)';this.style.background='rgba(0,229,255,0.05)'"
      onmouseup="this.style.borderColor='#1a2840';this.style.background='#0a1520'">
      <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:#00e5ff;flex-shrink:0;width:14px">${String.fromCharCode(65+o.idx)}</div>
      <div style="flex:1;font-size:13px;color:#c8dde8;line-height:1.6">${o.label}</div>
      ${o.risk ? `<div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:${riskColor[o.risk]||'#5a7a90'};flex-shrink:0;padding:2px 6px;border:1px solid;border-color:${riskColor[o.risk]||'#5a7a90'};border-radius:2px">${o.risk}</div>` : ''}
    </div>`).join('');
}

function escStr(s) {
  return s.replace(/'/g, "\\'");
}

// ── 玩家选择路线/治疗 ──
function chooseLandscapeOption(charId, choice, isTreat) {
  // 清空选项
  const list = document.getElementById('ls-options-list');
  if (list) list.innerHTML = `<div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:#2a4050;text-align:center;padding:10px">…</div>`;

  // 显示玩家选择
  appendLandscapePlayer(choice);

  // 调用AI
  const prefix = isTreat ? '[治疗选择]' : '[路线选择]';
  callLandscapeAI(charId, `${prefix} ${choice}`);
}

// ── 叙事显示 ──
function appendLandscapeNarr(text) {
  const narrative = document.getElementById('ls-narrative');
  if (!narrative) return;
  const div = document.createElement('div');
  div.style.cssText = `
    font-family:'Noto Serif SC',serif;font-size:14px;color:#8aa0b8;
    line-height:2;padding:12px 0;
    border-bottom:1px solid #0a1520;
    animation:fade-in-slow 0.6s ease-out;
  `;
  // 斜体动作
  div.innerHTML = text
    .replace(/\*([^*]+)\*/g, '<em style="color:#5a7a90;font-style:italic">$1</em>')
    .replace(/\n/g, '<br>');
  narrative.appendChild(div);
  setTimeout(() => narrative.scrollTo({ top:narrative.scrollHeight, behavior:'smooth' }), 50);
}

function appendLandscapePlayer(text) {
  const narrative = document.getElementById('ls-narrative');
  if (!narrative) return;
  const div = document.createElement('div');
  div.style.cssText = `
    font-family:'Noto Serif SC',serif;font-size:13px;color:#00e5ff;
    line-height:1.8;padding:8px 12px;
    background:rgba(0,229,255,0.04);border-left:2px solid rgba(0,229,255,0.3);
    border-radius:0 4px 4px 0;margin:4px 0;
    animation:fade-in-slow 0.3s ease-out;
  `;
  div.textContent = `→ ${text}`;
  narrative.appendChild(div);
  setTimeout(() => narrative.scrollTo({ top:narrative.scrollHeight, behavior:'smooth' }), 50);
}

// ── 结束图景 ──
function finishLandscape(charId, result) {
  const c  = CHARS.find(x => x.id === charId);
  const p  = G.patients[charId];
  const cd = (typeof CHAR_DATA !== 'undefined' ? CHAR_DATA[charId] : null) || {};

  const resultMap = {
    success: { label:'治疗成功', color:'#00ffcc', desc:'精神体已稳定，图景趋于平静。' },
    partial: { label:'部分成功', color:'#ffd600', desc:'初步接触，需要后续跟进。' },
    fail:    { label:'治疗失败', color:'#ff2d6b', desc:'未能与精神体建立连接，无功而返。' },
  };
  const r = resultMap[result] || resultMap.partial;

  // ── 治疗结算：精神图景修复成功必须真正降低「感官负荷」(p.mental) ──
  // 此前 finishLandscape 只显示“修复成功”，却没有改动 p.mental，
  // 导致感官负荷一直停在 100，同一哨兵每天反复进入紧急过载状态。
  if (p) {
    const loadDrop = result === 'success' ? 45 : result === 'partial' ? 20 : 0;
    if (loadDrop) {
      p.mental = Math.max(0, Math.min(100, (typeof p.mental === 'number' ? p.mental : 50) - loadDrop));
    }
    // 标记本次已做过深度干预，避免离开图景后立刻被紧急逻辑重新点名
    p.lastLandscapeDay = G.day;
  }

  // 记录
  if (typeof addWorldLog === 'function') {
    addWorldLog('landscape', charId, `图景探索结束：${r.label}。${r.desc}`);
  }
  if (typeof addJournalEntry === 'function') {
    addJournalEntry(`进入了${c?.name||charId}的精神图景「${cd.landscape||''}」，结果：${r.label}。`);
  }

  // 显示结束卡片
  const narrative = document.getElementById('ls-narrative');
  if (narrative) {
    const end = document.createElement('div');
    end.style.cssText = `
      margin-top:20px;padding:16px;
      background:#0a1520;border:1px solid ${r.color};border-radius:4px;
      text-align:center;animation:fade-in-slow 0.8s ease-out;
    `;
    end.innerHTML = `
      <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:#2a4050;letter-spacing:3px;margin-bottom:10px">图景探索结束</div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;color:${r.color};margin-bottom:8px">${r.label}</div>
      <div style="font-size:13px;color:#8aa0b8;line-height:1.8;margin-bottom:14px">${r.desc}</div>
      <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:14px">
        <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:#5a7a90;padding:3px 10px;background:#050810;border:1px solid #1a2840;border-radius:10px">屏障 ${G.playerStats?.shield??100}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:#5a7a90;padding:3px 10px;background:#050810;border:1px solid #1a2840;border-radius:10px">污染 ${G.playerStats?.contam??0}</div>
        <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:#5a7a90;padding:3px 10px;background:#050810;border:1px solid #1a2840;border-radius:10px">${c?.name||charId} 感官负荷 ${p?.mental??50}</div>
      </div>
      <button onclick="exitLandscape('${charId}')" style="padding:10px 24px;background:rgba(0,229,255,0.08);border:1px solid rgba(0,229,255,0.3);border-radius:3px;color:#00e5ff;font-family:'Share Tech Mono',monospace;font-size:12px;cursor:pointer;letter-spacing:2px">
        退出图景
      </button>
    `;
    narrative.appendChild(end);
    narrative.scrollTo({ top:narrative.scrollHeight, behavior:'smooth' });
  }

  // 清空选项
  const list = document.getElementById('ls-options-list');
  if (list) list.innerHTML = '';

  saveGame();
}

// ── 退出图景 ──
function exitLandscape(charId) {
  document.getElementById('landscape-screen')?.remove();
  G.currentLandscape = null;

  // 回到主界面
  if (G.clinicSession) {
    const c = CHARS.find(x => x.id === G.clinicSession);
    if (c && typeof addNarr === 'function') {
      addNarr(`*你从${c.name}的精神图景中退出，意识缓缓归位，诊疗室的白噪音声重新浮现。*`);
    }
    // 继续主线AI
    if (typeof callAI === 'function') {
      G.history.push({ role:'user', content:`[图景退出] 向导从精神图景中退出，请继续当前场景的叙事。` });
      callAI();
    }
  }

  saveGame();
}

// ── 外部触发入口（供 08-ai-call.js 和剧情调用）──
function triggerLandscapeEntry(charId) {
  if (!charId) charId = G.clinicSession;
  if (!charId) { showToast('当前没有接诊中的患者'); return; }
  showLandscapeEntryPrompt(charId);
}

// CSS动画（如果还没有的话）
if (!document.getElementById('landscape-anim-style')) {
  const style = document.createElement('style');
  style.id = 'landscape-anim-style';
  style.textContent = `
    @keyframes fade-in-slow {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
