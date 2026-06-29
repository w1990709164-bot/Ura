/* ============================================================
 * AI 接入层 —— 使用 Ura 全局 API（LW_*）
 *  · 全局键： LW_API_URL / LW_API_KEY / LW_API_MODEL
 * ============================================================ */
(function () {
  'use strict';
  const DS = window.DS;
  const API = (DS.api = {});

  // 读取配置：主页（里世界）是唯一 API 来源，避免游戏内配置与全局配置分叉。
  API.getConfig = function () {
    const get = k => (localStorage.getItem(k) || '').trim();
    return {
      url: get('LW_API_URL'),
      key: get('LW_API_KEY'),
      model: get('LW_API_MODEL'),
      source: get('LW_API_KEY') ? 'global' : 'none',
    };
  };
  API.isReady = function () { const c = API.getConfig(); return !!(c.key && c.model); };

  /* 统一调用：兼容 OpenAI 格式 与 Anthropic 格式 */
  API.callAI = async function (messages, systemPrompt, maxTokens, temperature) {
    const c = API.getConfig();
    if (!c.key || !c.model) throw new Error('未配置 API');
    maxTokens = maxTokens || 600;
    const temp = temperature == null ? 0.9 : temperature;

    const isAnthropic = /anthropic|claude/i.test(c.url) ||
      (!c.url && /claude/i.test(c.model));

    if (isAnthropic) {
      const res = await fetch((c.url || 'https://api.anthropic.com') + '/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': c.key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: c.model, max_tokens: maxTokens, temperature: temp,
          system: systemPrompt || '', messages,
        }),
      });
      if (!res.ok) throw new Error('API ' + res.status + ' ' + (await res.text()).slice(0, 200));
      const data = await res.json();
      return data.content?.[0]?.text || '';
    }

    // OpenAI 兼容
    const base = (c.url || 'https://api.openai.com/v1').replace(/\/$/, '');
    const res = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + c.key },
      body: JSON.stringify({
        model: c.model,
        messages: [{ role: 'system', content: systemPrompt || '' }, ...messages],
        max_tokens: maxTokens, temperature: temp,
      }),
    });
    if (!res.ok) throw new Error('API ' + res.status + ' ' + (await res.text()).slice(0, 200));
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  };

  /* 从模型回复里抠出 JSON 数组 */
  API.parseJSONArray = function (text) {
    if (!text) return [];
    let t = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try { const v = JSON.parse(t); if (Array.isArray(v)) return v; } catch (e) {}
    const m = t.match(/\[[\s\S]*\]/);
    if (m) { try { const v = JSON.parse(m[0]); if (Array.isArray(v)) return v; } catch (e) {} }
    return [];
  };

  /* 从模型回复里抠出 JSON 对象 */
  API.parseJSONObject = function (text) {
    if (!text) return null;
    let t = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try { return JSON.parse(t); } catch (e) {}
    const m = t.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (e) {} }
    return null;
  };

  /* 通用 JSON 对话（第二阶段剧情 GM 用） */
  API.chatJSON = async function (messages, systemPrompt, maxTokens, temperature) {
    const reply = await API.callAI(messages, systemPrompt, maxTokens || 900, temperature);
    return API.parseJSONObject(reply);
  };

  /* AI 生成"直播间弹幕"（只做氛围吐槽，不剧透真假情报） */
  API.genDanmaku = async function (summary) {
    const sys = '你是末日生存游戏《弹幕求生》的"直播间弹幕"生成器。玩家是穿越到末日前的女主，' +
      '一群观众在围观她的末日求生直播。根据给你的当前处境，生成一批观众弹幕：' +
      '口语化、简短（每条≤20字）、风格多样——吐槽、起哄玩梗、关心提醒、乐子人、阴阳怪气都要有。' +
      '不要输出真假末日情报、不要剧透剧情，只做氛围评论。' +
      '严格只输出 JSON 数组，每项 {"id":"观众昵称","text":"弹幕内容"}，约 8 条，不要任何多余文字。';
    const reply = await API.callAI([{ role: 'user', content: summary }], sys, 500);
    return API.parseJSONArray(reply)
      .filter(d => d && d.text)
      .slice(0, 10)
      .map(d => ({ id: String(d.id || '观众'), text: String(d.text).slice(0, 40), kind: 'flavor', ai: true }));
  };

  /* 连接测试：咱俩跑一遍用 */
  API.test = async function () {
    const reply = await API.callAI(
      [{ role: 'user', content: '只回复两个字：在线' }],
      '你是一个测试助手。', 30
    );
    return reply.trim();
  };

})();
