/* ============================================================
 * 弹幕求生·末日三十天  —  全局状态 / 工具 / 存档
 * 命名空间：window.DS
 * ============================================================ */
(function () {
  'use strict';

  const DS = (window.DS = window.DS || {});

  /* ---------- 常量 ---------- */
  DS.VERSION = '0.2.0';
  DS.SAVE_KEY = 'DS_SAVE_V1';
  DS.AP_MAX = 3;          // 每天行动点
  DS.LAST_DAY = 30;       // 末日爆发日
  DS.SPACE_MAX = 50;      // 公寓初始储物空间（水占地大，逼你取舍）
  // 末日逃生随身携带上限：除“空间仓库”异能外，囤再多也只能带走随身能背走的量
  // （既符合“一个人逃命带不走几百份水粮”的真实，也杜绝囤货+SL反复刷无限物资）
  DS.CARRY_CAP = { water: 6, food: 6, meds: 3, defense: 3 };
  DS.SIGNAL_REP = 4;      // 某弹幕ID信誉绝对值≥此值 → 其真假对玩家自动暴露（“识人”养成）

  /* 洞察（识弹正确率）换算为末日逃生时的额外携带上限 */
  DS.insightCarryBonus = function (insight) {
    insight = insight || 0;
    if (insight >= 12) return 3;
    if (insight >= 6) return 2;
    if (insight >= 2) return 1;
    return 0;
  };

  /* ---------- 工具 ---------- */
  const U = (DS.util = {
    // 闭区间随机整数
    randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    // 数组随机
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    // d20 等骰子
    roll(sides) { return U.randInt(1, sides || 20); },
    // 概率判定
    chance(p) { return Math.random() < p; },
    clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
    // 简易事件总线
    _bus: {},
    on(evt, fn) { (U._bus[evt] = U._bus[evt] || []).push(fn); },
    emit(evt, payload) { (U._bus[evt] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } }); },
    // 安全取 DOM
    $(sel) { return document.querySelector(sel); },
    $$(sel) { return Array.from(document.querySelectorAll(sel)); },
    esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
  });

  /* ---------- 初始状态工厂 ---------- */
  DS.newState = function () {
    return {
      version: DS.VERSION,
      screen: 'title',          // title | create | game | gameover
      day: 1,
      ap: DS.AP_MAX,
      phase: 1,                 // 1=末日前囤货  2=末日后(后续)
      player: {
        name: '穿越者',
        ability: { id: null, level: 1, xp: 0, xpNext: 100 },
        money: 800,
      },
      // 四条物资线（单位：份）
      resources: { water: 2, food: 2, meds: 0, defense: 0 },
      crystals: 0,              // 晶核（第二阶段用）
      space: { used: 0, max: DS.SPACE_MAX },
      // 弹幕观众信誉： id -> 分数（应验+ / 打脸-，累积成“信源/带节奏”标签）
      reputation: {},
      insight: 0,               // 洞察：识别真假弹幕的累计正确度，末日开局换携带加成
      // 物价：随末日临近上涨
      market: { mul: 1, onlineOpen: true },
      news: [],                 // 今日报纸（每日生成）
      hasRadio: false,          // 末日后捡到收音机才恢复情报
      metLeads: {},             // 提前偶遇过的男主 id -> true
      // ===== 第二阶段（末日后）=====
      story: {
        day: 1,                 // 末日后第几天
        turn: 0,
        hp: 100, hpMax: 100,
        history: [],            // 与 AI GM 的对话历史
        narrative: '',          // 当前剧情文本（累积，可滚动）
        choices: [],            // 当前选项
        busy: false,
        atBase: false,          // 是否身处某个庇护所
        baseName: '',
        base: { security: 0, supplies: 0, trust: 0, tideDay: 7, zombieHeat: 0 },
        exposed: false,         // 异能是否已暴露
      },
      codex: {},                // 男主档案 id -> {met:true, affection:0, stage:'logged'}
      // 弹幕回看历史（今日）
      dmHistory: [],
      // 玩家对弹幕的判断： id -> 'trust'|'doubt'
      judged: {},
      // 标记与历史
      flags: {},
      pendingDelivery: [],      // 网购在途 [{item, qty, arriveDay}]
      log: [],
      dead: false,
      deathReason: '',
    };
  };

  /* ---------- 末日逃生：计算随身可携带物资（不修改原对象） ----------
   * 返回 { kept, left, capped, unlimited }
   *  · “空间仓库”异能：随身储物，全部带走（unlimited=true）
   *  · 其他异能：每条物资线封顶到 DS.CARRY_CAP，多出的留在公寓
   */
  DS.computeCarry = function (resources, abilityId, capBonus) {
    capBonus = capBonus || 0;
    const lines = ['water', 'food', 'meds', 'defense'];
    const unlimited = abilityId === 'storage';
    const kept = {}, left = {};
    lines.forEach(k => {
      const had = Math.max(0, (resources && resources[k]) || 0);
      const base = DS.CARRY_CAP[k] != null ? DS.CARRY_CAP[k] : had;
      const cap = unlimited ? Infinity : base + capBonus;
      kept[k] = Math.min(had, cap);
      left[k] = had - kept[k];
    });
    return { kept, left, capped: lines.some(k => left[k] > 0), unlimited, capBonus };
  };

  /* 给状态挂运行时方法（不会被存档序列化，读档后需重挂） */
  DS.attachRuntime = function (s) {
    s._rep = function (id, n) {
      if (!id) return;
      s.reputation[id] = (s.reputation[id] || 0) + n;
    };
    return s;
  };

  /* 当前游戏状态（运行时） */
  DS.state = DS.attachRuntime(DS.newState());

  /* ---------- 存档 ---------- */
  DS.save = function () {
    try {
      localStorage.setItem(DS.SAVE_KEY, JSON.stringify(DS.state));
      return true;
    } catch (e) { console.error('存档失败', e); return false; }
  };
  DS.load = function () {
    try {
      const raw = localStorage.getItem(DS.SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !data.version) return false;
      DS.state = DS.attachRuntime(data);
      return true;
    } catch (e) { console.error('读档失败', e); return false; }
  };
  DS.hasSave = function () { return !!localStorage.getItem(DS.SAVE_KEY); };
  DS.clearSave = function () { localStorage.removeItem(DS.SAVE_KEY); };

  /* ---------- 多档位手动存读 ---------- */
  DS.SLOT_PREFIX = 'DS_SLOT_';
  DS.saveSlot = function (n) {
    try {
      const s = DS.state;
      localStorage.setItem(DS.SLOT_PREFIX + n, JSON.stringify(s));
      localStorage.setItem(DS.SLOT_PREFIX + n + '_meta', JSON.stringify({
        t: Date.now(), phase: s.phase,
        day: s.phase >= 2 ? (s.story ? s.story.day : 1) : s.day,
        ab: s.player.ability.id,
      }));
      return true;
    } catch (e) { console.error('存档失败', e); return false; }
  };
  DS.loadSlot = function (n) {
    try {
      const raw = localStorage.getItem(DS.SLOT_PREFIX + n);
      if (!raw) return false;
      DS.state = DS.attachRuntime(JSON.parse(raw));
      DS.save();           // 同步到“继续”自动档
      return true;
    } catch (e) { console.error('读档失败', e); return false; }
  };
  DS.slotInfo = function (n) {
    try { const m = localStorage.getItem(DS.SLOT_PREFIX + n + '_meta'); return m ? JSON.parse(m) : null; }
    catch (e) { return null; }
  };

  /* ---------- 日志 ---------- */
  DS.log = function (text, type) {
    DS.state.log.unshift({ day: DS.state.day, text, type: type || 'info', t: Date.now() });
    if (DS.state.log.length > 200) DS.state.log.length = 200;
    U.emit('log', { text, type });
  };

})();
