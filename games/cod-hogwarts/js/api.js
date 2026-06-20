// ── API 工具 ──────────────────────────────────────────────
function getApiConfig() {
  return {
    url:   localStorage.getItem('LW_API_URL') || '',
    key:   localStorage.getItem('LW_API_KEY') || '',
    model: localStorage.getItem('LW_API_MODEL') || ''
  };
}


async function callAPI(messages, opts = {}) {
  const cfg = getApiConfig();
  if (!cfg.key) throw new Error('未设置 API Key，请返回首页设置。');
  if (!cfg.model) throw new Error('未选择模型，请返回首页设置。');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  const payload = {
    model: cfg.model,
    messages,
    max_tokens: opts.max_tokens || 2000,
    temperature: opts.temperature ?? 0.9
  };

  try {
    if (cfg.url) {
      const base = cfg.url.replace(/\/+$/, '');
      const endpoint = base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${cfg.key}` },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API错误 ${res.status}: ${err.slice(0,200)}`);
      }
      const json = await res.json();
      const text = json.choices?.[0]?.message?.content;
      if (!text) throw new Error(`API返回空内容，请检查模型名称是否正确（status:${res.status}）`);
      return text;
    }

    // Anthropic fallback
    const sys = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    const rest = messages.filter(m => m.role !== 'system');
    if (!rest.length) rest.push({ role:'user', content:'继续' });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'x-api-key': cfg.key,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body: JSON.stringify({
        model: cfg.model,
        system: sys || undefined,
        messages: rest,
        max_tokens: opts.max_tokens || 2000,
        temperature: opts.temperature ?? 0.9
      }),
      signal: controller.signal
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API错误 ${res.status}: ${err.slice(0,200)}`);
    }
    const json = await res.json();
    const text = json.content?.[0]?.text;
    if (!text) throw new Error(`API返回空内容，请检查模型名称是否正确（status:${res.status}）`);
    return text;
  } catch(e) {
    if (e.name === 'AbortError') throw new Error('请求超时（60秒），请检查网络或API配置。');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ── 角色信息摘要（供AI使用）─────────────────────────────
function buildCharacterContext() {
  return CHARACTERS.map(c => {
    const cs = G.characters[c.id];
    const stage = AFFECTION_STAGES[cs.stage]?.name || '陌生人';
    return `【${c.name}】学院:${HOUSES[c.house].name} | 语言:${c.langLabel} | 好感阶段:${stage}(${cs.affection}) | 当前位置:${cs.location} | 心防:${cs.heartGuardBroken?'已破':'未破'}`;
  }).join('\n');
}

// ── 构建系统提示词 ────────────────────────────────────────
function buildSystemPrompt() {
  const p = G.player;
  const stats = p.stats;
  const house = p.house ? HOUSES[p.house] : null;

  return `你是一个互动乙女向游戏的AI叙事引擎。用中文写作，风格如同高质量轻小说，沉浸感强，细节丰富。

【世界设定】
霍格沃茨魔法学校的平行世界。玩家是来自东方的交换生，修炼仙术（东方修仙体系），使用灵力而非魔力。玩家随身携带魔杖（伪装融入用途），实际上不依赖魔杖施法。玩家能御风飞行，无需扫帚。灵力与霍格沃茨的魔力场会产生冲突（灵魔冲突值），过高会出现走火入魔症状，极高时灵力暴走。

【玩家角色】
姓名：${p.name || '玩家'}
年龄：${p.age || '未知'}
外貌：${p.appearance || '未描述'}
性格：${p.personality || '未描述'}
魔杖：${p.wand.wood}木/${p.wand.core}/${p.wand.length}（伪装用，实际不依赖）
学院：${house ? house.name : '待分院'}

【当前数值】
灵力: ${stats.lingLi.cur}/${getStatMax('lingLi')} | 魔法学识: ${stats.magicKnowledge.cur}/${getStatMax('magicKnowledge')} | 心境: ${stats.xinJing.cur}/${getStatMax('xinJing')} | 体魄: ${stats.tiPo.cur}/${getStatMax('tiPo')} | 人缘: ${stats.renYuan.cur}/${getStatMax('renYuan')} | 灵魔冲突值: ${p.conflictValue}/100

【当前时间】
${formatDate()} ${formatTime()} | 第${G.week}周 第${G.semester}学期

【角色状态】
${buildCharacterContext()}

【角色性格档案】
${CHARACTERS.map(c => `${c.name}：${c.personality}`).join('\n\n')}

【叙事规则】
1. 以小说风格连续叙述：环境描写、氛围渲染、人物动作、心理、对话一体呈现，不分开标注。
2. 角色对话格式：先用其母语写出原文（用""括住），紧跟「中文翻译」。中文角色（Zimo）直接用中文对话，不需翻译。
3. 选项要多样化：不要全是积极选项，要体现不同性格策略，有时包含有风险但有趣的选项。
4. 严禁霸总/囚禁/控制性情节。角色可以有嫉妒情绪，但表达方式是退缩或沉默，而非控制玩家。
5. 好感度阶段影响角色对玩家的亲近程度和对话内容深度。
6. 灵魔冲突值≥65时，描述中加入玩家的不适症状。≥85时触发戏剧性失控事件。

【炼药与道具系统】
玩家可收集材料炼制丹药或魔药。在故事中玩家于禁忌森林探索、战斗胜利、特定剧情时可获得材料。用ingredientDrop返回材料掉落。材料id参考：lingrass(灵草)、zhusha(朱砂)、aconite(乌头草)、bezoar(牛黄石)、moonwater(满月水)、dragonfly(金蝉衣)、cinnabar(辰砂)、ghostpowder(幽灵粉末)等。

【战斗系统】
当剧情需要战斗时，在stateUpdate中包含combatTrigger字段，格式如下：
"combatTrigger": {"enemies":[{"name":"敌人名","hp":25,"atk":2,"def":1,"dc":12,"xp":10}],"allies":["ghost"],"context":"战斗起因简述"}
allies填写参与战斗的角色id（只有当前陪同玩家的、好感度>0的角色可参与）。
战斗触发后，选项改为["继续故事"]，等待战斗模块处理完毕。

【黑市】
当玩家到达地下走廊·黑市时，在stateUpdate中包含 "openMarket": true，系统会自动弹出购物界面。
首次发现黑市前，可在故事中提示地下有神秘走廊，由玩家选择是否探索。

【输出格式（必须严格遵守）】
在正文故事叙述结束后，换行输出以下JSON块（用<<<STATE>>>和<<<END>>>包裹）：

<<<STATE>>>
{
  "options": ["选项A文字", "选项B文字", "选项C文字", "选项D文字"],
  "stateUpdate": {
    "dateChange": {"days": 0, "timeOfDay": "morning"},
    "statChanges": {"lingLi": 0, "magicKnowledge": 0, "xinJing": 0, "tiPo": 0, "renYuan": 0},
    "conflictChange": 0,
    "affectionChanges": {},
    "characterUpdates": {},
    "inventoryAdd": [],
    "ingredientDrop": [],
    "goldChange": 0,
    "housePointsChange": 0,
    "flagsSet": {},
    "achievementsUnlock": [],
    "combatTrigger": null,
    "openMarket": false
  }
}
<<<END>>>

数值变化必须合理克制，单次变化不超过±8，特殊事件不超过±15。timeOfDay取值：dawn/morning/forenoon/noon/afternoon/dusk/evening/midnight。`;
}

// ── 故事生成 ──────────────────────────────────────────────
function parseAIResponse(raw) {
  const stateMatch = raw.match(/<<<STATE>>>([\s\S]*?)<<<END>>>/);
  const story = raw.replace(/<<<STATE>>>[\s\S]*?<<<END>>>/, '').trim();

  let options = ['继续观察周围的情况', '找一个安静的地方思考', '主动和人打招呼', '先找到自己的学院公告栏'];
  let stateUpdate = {};

  if (stateMatch) {
    try {
      const parsed = JSON.parse(stateMatch[1].trim());
      if (parsed.options) options = parsed.options;
      if (parsed.stateUpdate) stateUpdate = parsed.stateUpdate;
    } catch(e) {
      console.warn('State parse error:', e);
    }
  }

  return { story, options, stateUpdate };
}

async function generateStory(playerChoice) {
  const systemPrompt = buildSystemPrompt();

  // 构建消息历史（保留最近8轮）
  const history = G.storyHistory.slice(-16);
  const messages = [
    { role:'system', content: systemPrompt },
    ...history,
    { role:'user', content: playerChoice || '开始游戏，描述我抵达霍格沃茨的场景。' }
  ];

  const raw = await callAPI(messages, { max_tokens:2000, temperature:0.9 });
  const { story, options, stateUpdate } = parseAIResponse(raw);

  // 保存到历史
  G.storyHistory.push({ role:'user', content: playerChoice || '开始游戏' });
  G.storyHistory.push({ role:'assistant', content: story });

  G.currentStory = story;
  G.currentOptions = options;

  applyStateUpdate(stateUpdate);

  return { story, options, stateUpdate };
}

// ── 序章生成 ──────────────────────────────────────────────
async function generatePrologue() {
  const p = G.player;
  const house = HOUSES[p.house];
  const prompt = `现在开始游戏。玩家${p.name}刚刚完成分院仪式，被分入${house.name}。描述她第一次踏入霍格沃茨大厅、经历分院仪式、然后来到${house.name}公共休息室的整个过程。这是故事的第一天，九月一日清晨。让她感受到这个西方魔法世界与她熟悉的东方仙境之间的巨大差异——灵力与魔力场开始轻微冲突，有一点隐约的不适感，但还不严重。结尾处让她选择接下来怎么做。`;
  return generateStory(prompt);
}
