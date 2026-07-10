/* ============================================================
 * 弹幕求生·末日三十天  —  全局状态 / 工具 / 存档
 * 命名空间：window.DS
 * ============================================================ */
(function () {
  'use strict';

  const DS = (window.DS = window.DS || {});

  /* ---------- 常量 ---------- */
  DS.VERSION = '0.1.0';
  DS.SAVE_KEY = 'DS_SAVE_V1';
  DS.AP_MAX = 3;          // 每天行动点
  DS.LAST_DAY = 30;       // 末日爆发日
  DS.SPACE_MAX = 50;      // 公寓初始储物空间（水占地大，逼你取舍）

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
      // 弹幕观众信誉： id -> 分数
      reputation: {},
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

  /* 给状态挂运行时方法（不会被存档序列化，读档后需重挂） */
  DS.attachRuntime = function (s) {
    s._rep = function (id, n) {
      if (!id) return;
      s.reputation[id] = (s.reputation[id] || 0) + n;
    };
    return s;
  };

  DS.recalcSpace = function (s) {
    s = s || DS.state;
    if (!s || !s.space || !window.DS?.data?.items) return;
    let used = 0;
    DS.data.items.forEach(it => {
      if (it.line && s.resources) used += Math.max(0, s.resources[it.line] || 0) * (it.space || 0);
      else if (s.flags) used += Math.max(0, s.flags['has_' + it.id] || 0) * (it.space || 0);
    });
    s.space.used = Math.max(0, used);
  };

  /* 当前游戏状态（运行时） */
  DS.state = DS.attachRuntime(DS.newState());

  /* ---------- 存档 ---------- */
  DS.makeSaveSnapshot = function () {
    const s = JSON.parse(JSON.stringify(DS.state));
    if (Array.isArray(s.log)) s.log = s.log.slice(0, 120);
    if (s.story) {
      if (Array.isArray(s.story.history)) s.story.history = s.story.history.slice(-24);
      if (typeof s.story.narrative === 'string' && s.story.narrative.length > 30000) {
        s.story.narrative = s.story.narrative.slice(-30000);
      }
      if (Array.isArray(s.story.danmaku)) s.story.danmaku = s.story.danmaku.slice(-80);
      if (Array.isArray(s.story.choices)) s.story.choices = s.story.choices.slice(0, 6);
    }
    s._savedAt = Date.now();
    return s;
  };
  DS.save = function () {
    try {
      localStorage.setItem(DS.SAVE_KEY, JSON.stringify(DS.makeSaveSnapshot()));
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
      DS.recalcSpace(DS.state);
      return true;
    } catch (e) { console.error('读档失败', e); return false; }
  };
  DS.hasSave = function () { return !!localStorage.getItem(DS.SAVE_KEY); };
  DS.clearSave = function () { localStorage.removeItem(DS.SAVE_KEY); };

  /* ---------- 多档位手动存读 ---------- */
  DS.SLOT_PREFIX = 'DS_SLOT_';
  DS.saveSlot = function (n) {
    try {
      const s = DS.makeSaveSnapshot();
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
      DS.recalcSpace(DS.state);
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
