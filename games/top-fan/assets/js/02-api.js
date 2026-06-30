/* ============================================================
 * AI 接入层 —— 复用里世界全局 API（LW_*）
 *  · 有 API：博文/弹幕/导师点评/私信由模型润色，更鲜活
 *  · 无 API：全部回退到 01-data.js 的模板，游戏照样能玩
 * ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const API = (TF.api = {});

  API.getConfig = function () {
    const get = k => (localStorage.getItem(k) || '').trim();
    return { url: get('LW_API_URL'), key: get('LW_API_KEY'), model: get('LW_API_MODEL') };
  };
  API.isReady = function () { const c = API.getConfig(); return !!(c.key && c.model); };

  API.callAI = async function (messages, systemPrompt, maxTokens, temperature) {
    const c = API.getConfig();
    if (!c.key || !c.model) throw new Error('未配置 API');
    maxTokens = maxTokens || 600;
    const temp = temperature == null ? 0.95 : temperature;
    const isAnthropic = /anthropic|claude/i.test(c.url) || (!c.url && /claude/i.test(c.model));

    if (isAnthropic) {
      const res = await fetch((c.url || 'https://api.anthropic.com') + '/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 'x-api-key': c.key,
          'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model: c.model, max_tokens: maxTokens, temperature: temp, system: systemPrompt || '', messages }),
      });
      if (!res.ok) throw new Error('API ' + res.status + ' ' + (await res.text()).slice(0, 200));
      const data = await res.json();
      return data.content?.[0]?.text || '';
    }
    const base = (c.url || 'https://api.openai.com/v1').replace(/\/$/, '');
    const res = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + c.key },
      body: JSON.stringify({ model: c.model, messages: [{ role: 'system', content: systemPrompt || '' }, ...messages], max_tokens: maxTokens, temperature: temp }),
    });
    if (!res.ok) throw new Error('API ' + res.status + ' ' + (await res.text()).slice(0, 200));
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  };

  API.parseArr = function (text) {
    if (!text) return [];
    let t = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try { const v = JSON.parse(t); if (Array.isArray(v)) return v; } catch (e) {}
    const m = t.match(/\[[\s\S]*\]/);
    if (m) { try { const v = JSON.parse(m[0]); if (Array.isArray(v)) return v; } catch (e) {} }
    return [];
  };

  /* 生成一条公演表演叙事（玩家视角直播） */
  API.genStageNarrative = async function (ctx) {
    const sys = '你是选秀养成游戏《头号粉丝》的舞台解说。玩家是练习生「' + ctx.name +
      '」，正在公演直播。根据档次写一段 80~140 字的第二人称表演叙事，画面感强、有情绪。' +
      '档次：' + ctx.tierCN + '。表演主项：' + ctx.mainCN + '。只输出叙事正文，不要任何前后缀。';
    try {
      const r = await API.callAI([{ role: 'user', content: `本场主题：${ctx.theme}。请写这场「${ctx.tierCN}」的表演。` }], sys, 320, 1.0);
      return (r || '').trim();
    } catch (e) { return ''; }
  };

  /* 生成一批直播弹幕（混入指定男主的定位口吻） */
  API.genDanmu = async function (ctx) {
    const sys = '你是选秀直播间弹幕生成器。玩家在台上表演，观众刷弹幕。' +
      '生成约 8 条：口语化、≤16 字、风格多样（彩虹屁/玩梗/起哄/心疼/阴阳）。' +
      '严格只输出 JSON 数组，每项 {"id":"昵称","text":"弹幕"}，不要多余文字。';
    try {
      const r = await API.callAI([{ role: 'user', content: `表演档次：${ctx.tierCN}。氛围：${ctx.theme}` }], sys, 360, 1.05);
      return API.parseArr(r).filter(d => d && d.text).slice(0, 10)
        .map(d => ({ id: String(d.id || '观众'), text: String(d.text).slice(0, 30) }));
    } catch (e) { return []; }
  };

  /* 男主私信对话（破屏后逐个解锁的短信私聊） */
  API.chatWithLead = async function (lead, history, playerName) {
    const sys = `你在扮演一位代号 ${lead.name} 的男性角色，与练习生「${playerName}」私信聊天。` +
      `你的公开身份是她超话里的粉丝「${lead.handle}」，工种是${lead.job}（${lead.jobDesc}），` +
      `依恋类型是${lead.attach}。真实身份是一名军人，但你不会轻易承认。` +
      `口吻要贴合你的工种与依恋类型：表面克制/嘴硬/沉默/热情各依其性，内里是藏不住的在意。` +
      `每次只回 1~3 句，口语化，有真人感，不要旁白、不要括号动作。`;
    try {
      const r = await API.callAI(history, sys, 240, 1.0);
      return (r || '').trim();
    } catch (e) { return ''; }
  };

  API.test = async function () {
    const r = await API.callAI([{ role: 'user', content: '只回复两个字：在线' }], '你是测试助手。', 30, 0);
    return (r || '').trim();
  };

})();
