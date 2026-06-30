/* ============================================================
 * 头号粉丝 · TOP FAN  —  全局状态 / 工具 / 存档
 * 命名空间：window.TF
 * ------------------------------------------------------------
 * 设定：你是参加选秀的练习生，从海选一路打到成团出道。
 *       超话里那些各司其职的神仙粉，其实是一支被组织起来的
 *       特遣队（COD 大兵），他们隔屏先沦陷，你却浑然不觉。
 *       —— 第一阶段：爱豆选秀养成（本作）
 *       —— 歌星 / 影星 线留接口，敬请期待。
 * ============================================================ */
(function () {
  'use strict';

  const TF = (window.TF = window.TF || {});

  /* ---------- 常量 ---------- */
  TF.VERSION = '0.1.0';
  TF.SAVE_KEY = 'TF_SAVE_V1';
  TF.START_AP = 6;            // 训练期每周行动点（受体力影响）
  TF.STAT_POINTS = 20;        // 开局自由分配点数
  TF.STRESS_MAX = 100;        // 压力上限，爆表生病
  TF.LOVE_MAX = 100;          // 男主超话等级（暗恋值）满值
  TF.FINAL_ROUND = 6;         // 第 6 次公演 = 成团出道夜

  // 6 项属性
  TF.STAT_KEYS = ['vocal', 'dance', 'rap', 'visual', 'stamina', 'charm'];
  TF.STAT_LABELS = {
    vocal: '唱', dance: '跳', rap: 'Rap',
    visual: '颜值', stamina: '体力', charm: '舞台魅力',
  };

  // 选秀身份（三选一）—— 仅「爱豆」可玩，其余留接口
  TF.IDENTITIES = [
    { id: 'idol', name: '爱豆', desc: '打歌舞台 / 选秀出道，靠人设与打投杀进出道位', playable: true },
    { id: 'singer', name: '歌星', desc: '你的歌成了他们任务的 BGM，先入耳后动心', playable: false },
    { id: 'actor', name: '影星', desc: '战争片军事顾问，战区帐篷里放你的电影', playable: false },
  ];

  // 评级班 & 担当
  TF.RANK_CLASSES = ['F', 'D', 'C', 'B', 'A'];
  TF.POSITIONS = {
    vocal: 'Vocal 担当', dance: '舞蹈担当', rap: 'Rap 担当',
    visual: '门面担当', charm: 'Center 中心位',
  };

  /* ---------- 工具 ---------- */
  const U = (TF.util = {
    randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    roll(sides) { return U.randInt(1, sides || 20); },
    chance(p) { return Math.random() < p; },
    clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
    sum(arr) { return arr.reduce((a, b) => a + b, 0); },
    _bus: {},
    on(evt, fn) { (U._bus[evt] = U._bus[evt] || []).push(fn); },
    emit(evt, payload) { (U._bus[evt] || []).forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } }); },
    $(sel) { return document.querySelector(sel); },
    $$(sel) { return Array.from(document.querySelectorAll(sel)); },
    esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
    // 万 / 简易计数格式化
    fmt(n) {
      n = Math.round(n);
      if (n >= 1e8) return (n / 1e8).toFixed(1) + '亿';
      if (n >= 1e4) return (n / 1e4).toFixed(1) + '万';
      return String(n);
    },
    now() { return Date.now(); },
  });

  /* ---------- 初始状态工厂 ---------- */
  TF.newState = function () {
    return {
      version: TF.VERSION,
      screen: 'title',          // title | create | hub | stage | result
      identity: 'idol',
      round: 1,                 // 第几次公演（1..FINAL_ROUND）
      phase: 'pre',             // pre=选秀  post=出道日常（留接口）
      debuted: false,
      player: {
        name: '', age: 18,
        fanclub: '',            // 粉丝团名
        supertopic: '',         // 超话名
        stats: { vocal: 0, dance: 0, rap: 0, visual: 0, stamina: 0, charm: 0 },
        stress: 0,
        sick: false,
        repute: 50,             // 路人缘 / 口碑（0~100），危机会伤它，影响路人票
        rankClass: 'F',         // 当前班级
        position: '',           // 当前担当
        rankNo: 99,             // 排行榜名次
        votes: 0,               // 当前票数
        followers: 0,           // 微博粉丝数
        weiboOpen: false,       // 是否开通微博
      },
      // 固定劲敌（开局生成）：贯穿全程的对家
      rival: { name: '', grudge: 0, beat: 0 },
      pendingEvent: null,       // 当前待处理的危机/撕番事件
      ap: TF.START_AP,          // 本周剩余行动点
      // 男主运行时数据： id -> { love, met(数字破屏), offline(线下相遇), revealed }
      leads: {},
      // 微博
      weibo: {
        feed: [],               // 广场信息流 [{id,handle,leadId,text,kind,likes,t}]
        hot: [],                // 热搜 [{tag, heat, type}]
        myPosts: [],            // 我发的营业博
        groupChat: [],          // 粉丝群消息 [{leadId,handle,text}]
        dms: {},                // 私信 leadId -> [{from,text}]
      },
      logs: [],                 // 系统日志
      lastStage: null,          // 最近一次公演结算结果（result 屏用）
      flags: {},
    };
  };

  /* 运行时游戏状态 */
  TF.state = TF.newState();

  /* ---------- 存档 ---------- */
  TF.save = function () {
    try { localStorage.setItem(TF.SAVE_KEY, JSON.stringify(TF.state)); return true; }
    catch (e) { console.error('存档失败', e); return false; }
  };
  TF.load = function () {
    try {
      const raw = localStorage.getItem(TF.SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !data.version) return false;
      TF.state = data;
      return true;
    } catch (e) { console.error('读档失败', e); return false; }
  };
  TF.hasSave = function () { return !!localStorage.getItem(TF.SAVE_KEY); };
  TF.clearSave = function () { localStorage.removeItem(TF.SAVE_KEY); };

  /* ---------- 日志 ---------- */
  TF.log = function (text, type) {
    TF.state.logs.unshift({ round: TF.state.round, text, type: type || 'info', t: Date.now() });
    if (TF.state.logs.length > 120) TF.state.logs.length = 120;
    U.emit('log', { text, type });
  };

})();
