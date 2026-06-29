/* ============================================================
 * 第二阶段（末日后）：AI 剧情引擎 + 基地档案 + 晶核 + 战斗
 * window.DS.phase2ui  (P2)
 * ============================================================ */
(function () {
  'use strict';
  const DS = window.DS;
  const U = DS.util;
  const D = DS.data;
  const Game = DS.game;
  const S = () => DS.state;
  const P2 = (DS.phase2ui = {});

  /* ---------- 文本工具 ---------- */
  function fmt(text) {
    return U.esc(text).replace(/\n/g, '<br>')
      .replace(/『([^』]*)』/g, '<span class="nar-dm">『$1』</span>'); // 高亮弹幕
  }
  function append(type, text) {
    const cls = type === 'me' ? 'nar-me' : type === 'sys' ? 'nar-sys' : 'nar-gm';
    const prefix = type === 'me' ? '<b>你：</b>' : '';
    S().story.narrative += `<div class="nar ${cls}">${prefix}${fmt(text)}</div>`;
  }
  P2.appendNarrative = append;

  /* ---------- 进入第二阶段 ---------- */
  P2.start = function () {
    const s = S();
    P2._req = (P2._req || 0) + 1;             // 作废任何在途请求
    P2.choiceHandler = null;
    s.phase = 2;
    const conv = Math.floor((s.player.money > 0 ? s.player.money : 0) / 100);
    s.crystals = (s.crystals || 0) + conv;
    s.story = Object.assign(s.story || {}, {
      day: 1, turn: 0, hp: 100, hpMax: 100, history: [], narrative: '', choices: [],
      busy: false, atBase: false, baseName: '', exposed: false, mode: 'opening', conv,
      base: { security: 0, supplies: 0, trust: 0, tideDay: 7, zombieHeat: 0 },
    });
    clearInterval(Game._dmTimer);
    Game.show('story');
    P2.renderHUD();
    P2.playOpening();
  };

  /* ---------- 开场演出（脚本） ---------- */
  P2.playOpening = function () {
    const s = S();
    s._openIdx = 0;
    const beats = D.phase2.openingBeats;
    const step = () => {
      append('gm', beats[s._openIdx]);
      const last = s._openIdx >= beats.length - 1;
      if (last) P2.floatDanmaku(['觉醒了！她的异能觉醒了！', '卧槽这就开挂了？', '快跑啊主播别愣着！', '地狱难度开局，蹲了']);
      s.story.choices = [last ? '（异能在体内苏醒）面对这一切 →' : '继续…'];
      P2.choiceHandler = () => {
        s._openIdx++;
        if (s._openIdx < beats.length) step();
        else {
          const ab = (D.abilities.find(a => a.id === s.player.ability.id) || {});
          append('sys', `末日前的现金折算为 💎${s.story.conv} 枚晶核。异能【${ab.name}】Lv${s.player.ability.level} 已觉醒。从此，晶核是你的命，也是你的钱。`);
          P2.renderHUD();
          P2.firstTurn();
        }
        P2.render();
      };
      P2.render();
    };
    step();
  };

  /* ---------- 第一回合：交给 AI ---------- */
  P2.firstTurn = function () {
    const s = S();
    s.story.mode = 'ai';
    if (!DS.api.isReady()) {
      append('sys', '⚠ 未配置 AI（点不到剧情生成）。请回标题页 🔌 配置 API 后重新进入第二阶段。');
      s.story.choices = ['知道了'];
      P2.choiceHandler = () => { Game.show('title'); DS.bootDanmaku && DS.bootDanmaku(); };
      P2.render();
      return;
    }
    const ab = (D.abilities.find(a => a.id === s.player.ability.id) || {});
    const r = s.resources;
    const init = `末日爆发。囤货结果：水${r.water} 食物${r.food} 药${r.meds} 防身${r.defense}，晶核💎${s.crystals}。` +
      `主角刚在公寓里觉醒异能【${ab.name}】。请从"她站在公寓里、窗外已成炼狱"的此刻演起，` +
      `给出环境与感官描写，并给出第一组选择（要包含"是否离开公寓"）。`;
    P2.send(init, { system: true, hideMe: true });
  };

  /* ---------- 玩家选择 / 自定义输入 → 推进 ---------- */
  P2.onPlayerInput = function (text) {
    if (!text || S().story.busy) return;
    P2.send(text, {});
  };

  // 统一发送：opts.system=系统/战斗回传  opts.hideMe=不显示"你："
  P2.send = function (text, opts) {
    opts = opts || {};
    const s = S();
    if (s.story.busy) return;
    P2.choiceHandler = null;                 // ★关键：进入AI模式，清掉开场脚本回调
    const myReq = ++P2._req;                  // 请求令牌，丢弃过期响应
    if (!opts.hideMe) append('me', text);

    const dir = D.phase2.directorNote(s.story.day, s);
    const nonce = Math.random().toString(36).slice(2, 8);
    const userContent = `${text}\n\n[导演提示(对玩家隐藏，请遵循)：${dir} 当前末日第${s.story.day}天，主角HP ${s.story.hp}/${s.story.hpMax}，晶核💎${s.crystals}，异能Lv${s.player.ability.level}。本回合务必有新意、不要与之前雷同。变化种子:${nonce}]`;
    s.story.history.push({ role: 'user', content: userContent });

    s.story.busy = true;
    P2.render();

    const sys = D.phase2.systemPrompt(s);
    const msgs = s.story.history.slice(-12);
    DS.api.chatJSON(msgs, sys, 950, 1.0).then(obj => {
      if (P2._req !== myReq) return;          // 已被新请求/新局取代，丢弃
      s.story.busy = false;
      if (!obj || !obj.narrative) { P2.fallback('（信号干扰，剧情没能接上。再试一次？）'); return; }
      s.story.history.push({ role: 'assistant', content: JSON.stringify(obj).slice(0, 1500) });
      P2.applyTurn(obj);
    }).catch(e => {
      if (P2._req !== myReq) return;
      s.story.busy = false;
      console.warn('剧情生成失败', e);
      P2.fallback('（连接出错：' + (e.message || '未知') + '。再试一次？）');
    });
  };

  P2.fallback = function (msg) {
    append('sys', msg);
    S().story.choices = ['重试', '随便走走看'];
    P2.choiceHandler = (i) => P2.onPlayerInput(i === 0 ? '继续' : '我谨慎地观察四周，寻找出路。');
    P2.render();
  };

  /* ---------- 弹幕飘屏（去重） ---------- */
  P2._dmPool = ['乐子人', '吃瓜群众', '空降兵', '老观众', '颜值协会', '气氛组', '复读机', '键盘侠', '心疼主播', '嗑到了', '阴谋论者', '摸鱼怪'];
  P2.floatDanmaku = function (arr) {
    if (!arr || !arr.length) return;
    const s = S();
    s.story._dmSeen = s.story._dmSeen || [];
    const items = [];
    arr.filter(Boolean).forEach(t => {
      const text = String(t).replace(/[『』]/g, '').trim().slice(0, 40);
      if (!text || s.story._dmSeen.includes(text)) return;       // 去重
      s.story._dmSeen.push(text);
      items.push({ id: U.pick(P2._dmPool), text, kind: 'flavor' });
    });
    if (s.story._dmSeen.length > 40) s.story._dmSeen.splice(0, s.story._dmSeen.length - 40);
    if (items.length) DS.danmaku.burst(items, 1300);
  };

  /* ---------- 应用一个 AI 回合 ---------- */
  P2.applyTurn = function (obj) {
    const s = S();
    const isOpening = s.story.turn === 0;     // 开场回合不结算任何数值
    append('gm', obj.narrative);

    // 弹幕：飘过屏幕（不再塞进正文）
    P2.floatDanmaku(obj.danmaku);

    // 晶核：战斗由骰子系统结算；AI 旁路（交易/服务/零散）限幅≤4，战斗回合不发，杜绝凭空暴增
    if (!isOpening && obj.crystals && !obj.combat) {
      const dc = U.clamp(obj.crystals | 0, -30, 4);
      const before = s.crystals;
      s.crystals = Math.max(0, s.crystals + dc);
      if (s.crystals !== before) append('sys', `晶核 ${s.crystals > before ? '+' : ''}${s.crystals - before}（💎${s.crystals}）`);
    }
    if (!isOpening && obj.hp) {
      const before = s.story.hp;
      s.story.hp = U.clamp(s.story.hp + (obj.hp | 0), 0, s.story.hpMax);
      if (s.story.hp !== before) append('sys', `HP ${s.story.hp > before ? '+' : ''}${s.story.hp - before}（❤️${s.story.hp}）`);
    }
    if (obj.unlock && D.leadInfo[obj.unlock]) P2.unlockLead(obj.unlock);
    if (obj.affection) Object.keys(obj.affection).forEach(id => P2.addAffection(id, obj.affection[id] | 0));
    if (obj.base) P2.applyBase(obj.base);
    if (obj.radio && !s.hasRadio) P2.obtainRadio('你在一片杂音里调到断续人声，收音机线开启。');
    if (obj.exposed && !s.story.exposed) {
      s.story.exposed = true;
      append('sys', '【暴露】你的异能被人看见了。之后的基地信任与觊觎都会改变。');
    }

    // 升级判定
    P2.checkLevel();

    // 死亡
    if (s.story.hp <= 0) return P2.gameOver('你倒在了血泊里，再没能站起来。');

    // 战斗
    if (obj.combat && obj.combat.enemy) {
      const res = P2.resolveCombat(obj.combat.enemy, obj.combat.level | 0 || 1);
      append('sys', res.txt);
      P2.renderHUD();
      if (s.story.hp <= 0) return P2.gameOver(`你被${obj.combat.enemy}撕碎了。`);
      // 把战斗结果回传给 GM 续写
      s.story.choices = []; P2.render();
      setTimeout(() => P2.send(`[战斗判定结果] ${res.txt} 请据此续写剧情后果，并给出新的选择。`, { system: true, hideMe: true }), 350);
      return;
    }

    s.story.choices = Array.isArray(obj.choices) && obj.choices.length ? obj.choices : ['继续'];
    s.story.turn++;
    // 每若干回合推进“末日天数”
    if (s.story.turn % 3 === 0) {
      s.story.day++;
      P2.advanceSurvivalDay();
    }
    P2.renderHUD();
    P2.render();
    DS.save();
  };

  /* ---------- 战斗：跑团骰（等级×10 + d20） ---------- */
  P2.resolveCombat = function (enemy, level) {
    const s = S();
    const lv = s.player.ability.level;
    const myRoll = U.roll(20), enRoll = U.roll(20);
    const my = lv * 10 + myRoll, en = level * 10 + enRoll;
    if (my >= en) {
      const gain = U.randInt(1, Math.max(1, level + 1));
      s.crystals += gain;
      P2.gainXP(level * 12 + 10);
      return { win: true, txt: `【战斗】你 Lv${lv}(骰${myRoll}→${my}) vs ${enemy} Lv${level}(骰${enRoll}→${en})：你赢了！缴获 💎${gain}。` };
    } else {
      const dmg = U.randInt(14, 32);
      s.story.hp = U.clamp(s.story.hp - dmg, 0, s.story.hpMax);
      P2.gainXP(level * 4);
      return { win: false, txt: `【战斗】你 Lv${lv}(骰${myRoll}→${my}) vs ${enemy} Lv${level}(骰${enRoll}→${en})：你落了下风，受创 -${dmg} HP。` };
    }
  };

  /* ---------- 基地 / 尸潮 / 收音机硬机制 ---------- */
  P2.ensureBase = function () {
    const st = S().story;
    st.base = Object.assign({ security: 0, supplies: 0, trust: 0, tideDay: 7, zombieHeat: 0 }, st.base || {});
    return st.base;
  };
  P2.applyBase = function (delta) {
    const s = S(), b = P2.ensureBase();
    if (delta.name && !s.story.baseName) s.story.baseName = String(delta.name).slice(0, 14);
    s.story.atBase = !!s.story.baseName || s.story.atBase;
    ['security', 'supplies', 'trust'].forEach(k => {
      if (delta[k]) b[k] = U.clamp((b[k] || 0) + (delta[k] | 0), -10, 30);
    });
    append('sys', `【基地】${s.story.baseName || '临时营地'} 防御${b.security} / 补给${b.supplies} / 信任${b.trust}`);
  };
  P2.obtainRadio = function (msg) {
    S().hasRadio = true;
    append('sys', '📻 ' + msg);
    P2.floatDanmaku(['收音机！主线道具来了', '有电波就有路', '别全信，广播也会骗人']);
    P2.renderHUD();
    DS.save();
  };
  P2.advanceSurvivalDay = function () {
    const s = S(), b = P2.ensureBase(), r = s.resources;
    b.zombieHeat = U.clamp((b.zombieHeat || 0) + U.randInt(1, 3) + (s.story.exposed ? 1 : 0), 0, 30);
    if (s.story.atBase) {
      b.supplies = Math.max(-10, b.supplies - 1);
      append('sys', `【消耗】基地每日消耗补给 -1（补给${b.supplies}），尸潮压力 ${b.zombieHeat}/${b.tideDay * 3}。`);
    } else {
      if (r.food > 0) r.food--; else s.story.hp = U.clamp(s.story.hp - 8, 0, s.story.hpMax);
      if (r.water > 0) r.water--; else s.story.hp = U.clamp(s.story.hp - 12, 0, s.story.hpMax);
      append('sys', `【野外生存】水粮各消耗 1；缺口会直接伤 HP。当前 HP ${s.story.hp}。`);
    }
    if (s.story.day >= b.tideDay) P2.resolveTide();
  };
  P2.resolveTide = function () {
    const s = S(), b = P2.ensureBase();
    const pressure = (b.zombieHeat || 0) + U.roll(20);
    const defense = (s.story.atBase ? (b.security * 3 + Math.max(0, b.trust) + Math.max(0, b.supplies)) : s.player.ability.level * 8) + U.roll(20);
    if (defense >= pressure) {
      const gain = U.randInt(2, 6);
      s.crystals += gain;
      b.zombieHeat = Math.max(0, b.zombieHeat - 8);
      b.tideDay = s.story.day + U.randInt(5, 7);
      append('sys', `【尸潮检定】防线守住了：防御${defense} vs 压力${pressure}。清理尸群获得 💎${gain}，下次尸潮预计第${b.tideDay}天。`);
    } else {
      const dmg = U.randInt(18, 38);
      s.story.hp = U.clamp(s.story.hp - dmg, 0, s.story.hpMax);
      b.security = Math.max(-10, b.security - 2);
      b.supplies = Math.max(-10, b.supplies - 2);
      b.zombieHeat = Math.max(0, b.zombieHeat - 4);
      b.tideDay = s.story.day + U.randInt(4, 6);
      append('sys', `【尸潮检定】防线被撕开：防御${defense} vs 压力${pressure}。你受伤 -${dmg}HP，基地防御/补给各 -2。`);
    }
  };
  P2.baseAction = function (kind) {
    const s = S(), b = P2.ensureBase();
    if (kind === 'fortify') {
      const cost = Math.min(s.resources.defense, 1);
      if (!cost && s.crystals < 2) return Game.toast('需要 1 防身物资或 2 晶核');
      if (cost) s.resources.defense--; else s.crystals -= 2;
      b.security += 2; b.trust += 1; s.story.atBase = true; s.story.baseName = s.story.baseName || '临时营地';
      append('sys', '你加固门窗与哨位。基地防御 +2，信任 +1。');
    } else if (kind === 'trade') {
      if (s.crystals < 2) return Game.toast('至少需要 2 晶核交易');
      s.crystals -= 2; b.supplies += 3; b.trust += 1; s.story.atBase = true; s.story.baseName = s.story.baseName || '临时营地';
      append('sys', '你用晶核换来压缩粮、药和电池。基地补给 +3，信任 +1。');
    } else if (kind === 'radio') {
      if (!s.hasRadio) P2.obtainRadio('你修好一台旧收音机，旋钮里传出西郊基地的断续呼号。');
      else Game.openNews();
      return;
    }
    P2.renderHUD(); P2.render(); DS.save(); Game.closeModal();
  };

  P2.gainXP = function (n) {
    const a = S().player.ability; a.xp += n; P2.checkLevel();
  };
  P2.checkLevel = function () {
    const a = S().player.ability;
    while (a.xp >= a.xpNext) {
      a.xp -= a.xpNext; a.level++; a.xpNext = Math.round(a.xpNext * 1.5);
      append('sys', `【异能升级】→ Lv${a.level}！你能感到力量在体内拔节。`);
    }
  };

  /* ---------- 男主档案 ---------- */
  P2.unlockLead = function (id) {
    const s = S();
    if (!s.codex[id]) s.codex[id] = { met: true, affection: 0 };
    else s.codex[id].met = true;
    const info = D.leadInfo[id]; const m = D.maleLeads.find(x => x.id === id) || {};
    append('sys', `【档案解锁】${m.name || id} · ${info.role}　异能【${info.ab}】`);
    P2.renderHUD();
  };
  P2.addAffection = function (id, delta) {
    const s = S();
    if (!D.leadInfo[id]) return;
    if (!s.codex[id]) s.codex[id] = { met: true, affection: 0 };
    s.codex[id].affection = U.clamp((s.codex[id].affection || 0) + delta, -20, 100);
  };

  /* ---------- 渲染 ---------- */
  P2.renderHUD = function () {
    const s = S();
    const set = (id, v) => { const el = U.$(id); if (el) el.textContent = v; };
    set('#s-day', `末日 第${s.story.day}天`);
    set('#s-hp', `❤️${s.story.hp}`);
    set('#s-crystal', `💎${s.crystals}`);
    const b = P2.ensureBase();
    set('#s-base', s.story.atBase ? `${s.story.baseName || '基地'} 防${b.security} 信${b.trust}` : '野外');
    set('#s-tide', `尸潮 D${b.tideDay} 压${b.zombieHeat}`);
    const a = s.player.ability;
    const ab = (D.abilities.find(x => x.id === a.id) || {});
    set('#s-ab', `${ab.icon || ''}${ab.name || '异能'} Lv${a.level}`);
  };

  P2.render = function () {
    const s = S();
    const scroll = U.$('#story-scroll');
    if (scroll) { scroll.innerHTML = s.story.narrative; scroll.scrollTop = scroll.scrollHeight; }
    const cw = U.$('#story-choices');
    if (cw) {
      if (s.story.busy) {
        cw.innerHTML = '<div class="story-loading">剧情生成中…<span class="dots">●●●</span></div>';
      } else {
        cw.innerHTML = (s.story.choices || []).map((c, i) => `<button class="story-choice" data-i="${i}">${U.esc(c)}</button>`).join('');
        cw.querySelectorAll('.story-choice').forEach(b => b.onclick = () => {
          const i = +b.dataset.i;
          if (P2.choiceHandler) P2.choiceHandler(i);
          else P2.onPlayerInput(s.story.choices[i]);
        });
      }
    }
    const input = U.$('#story-input'); const send = U.$('#story-send');
    if (input) input.disabled = s.story.busy;
    if (send) send.disabled = s.story.busy;
  };

  P2.gameOver = function (reason) {
    const s = S();
    append('sys', '💀 ' + reason);
    s.story.choices = ['重新开始'];
    P2.choiceHandler = () => { DS.clearSave(); Game.show('title'); DS.bootDanmaku && DS.bootDanmaku(); Game.newGame ? null : null; location.reload(); };
    P2.render();
  };

  /* ---------- 背包：查看/使用物资、晶核 ---------- */
  P2.openBag = function () {
    const s = S(), r = s.resources;
    const rows = [
      { k: 'meds', icon: '💊', name: '药品', n: r.meds, use: '疗伤 +25HP' },
      { k: 'food', icon: '🍖', name: '食物', n: r.food, use: '进食 +8HP' },
      { k: 'water', icon: '💧', name: '水', n: r.water, use: '解渴 +6HP' },
      { k: 'defense', icon: '🔪', name: '防身武器', n: r.defense, use: '战斗时自动加成', noUse: true },
    ].map(it => `<div class="bag-row"><span class="bag-item">${it.icon} ${it.name} <b>×${it.n}</b></span>
      ${it.noUse ? `<small>${it.use}</small>` : `<button class="btn bag-use" data-k="${it.k}" ${it.n > 0 ? '' : 'disabled'}>${it.use}</button>`}</div>`).join('');
    Game.modal('🎒 背包', `
      <p>💎 晶核 <b>${s.crystals}</b>　❤️ HP <b>${s.story.hp}/${s.story.hpMax}</b></p>
      <p class="hint">晶核：击杀丧尸缴获，可在剧情里向商人/基地<strong>交易、以物易物、交保护费</strong>（直接在输入框说出你的意图即可）。</p>
      <div class="bag-list">${rows}</div>`, [
        { label: s.hasRadio ? '收听电波' : '修收音机', onClick: () => P2.baseAction('radio') },
        { label: '加固防线', onClick: () => P2.baseAction('fortify') },
        { label: '晶核交易', onClick: () => P2.baseAction('trade') },
        { label: '关闭', cls: 'btn-primary' },
      ]);
    U.$$('.bag-use').forEach(b => b.onclick = () => P2.useItem(b.dataset.k));
  };
  P2.useItem = function (k) {
    const s = S(), r = s.resources; if (!r[k] || r[k] <= 0) return;
    const heal = { meds: 25, food: 8, water: 6 }[k] || 0;
    const name = { meds: '药品', food: '食物', water: '水' }[k] || '物品';
    r[k]--;
    const before = s.story.hp; s.story.hp = U.clamp(s.story.hp + heal, 0, s.story.hpMax);
    append('sys', `你使用了${name}，恢复 ${s.story.hp - before} HP（❤️${s.story.hp}）。`);
    P2.renderHUD(); P2.render(); DS.save(); P2.openBag();
  };

  /* ---------- 基地档案界面 ---------- */
  P2.openCodex = function () {
    const s = S();
    const grid = U.$('#codex-grid');
    grid.innerHTML = D.maleLeads.map(m => {
      const info = D.leadInfo[m.id] || {};
      const c = s.codex[m.id];
      if (c && c.met) {
        const aff = c.affection || 0;
        const pct = U.clamp(aff, 0, 100);
        return `<div class="codex-card unlocked">
          <div class="cc-name">${m.name}</div>
          <div class="cc-role">${info.role || ''}</div>
          <div class="cc-ab">异能【${info.ab}】Lv${info.abLv}</div>
          <div class="cc-trait">${info.trait || ''}</div>
          <div class="cc-aff">好感 <div class="aff-bar"><i style="width:${pct}%"></i></div> ${aff}</div>
        </div>`;
      }
      return `<div class="codex-card locked">
        <div class="cc-name">？？？</div>
        <div class="cc-role">未解锁</div>
        <div class="cc-lock">🔒</div>
      </div>`;
    }).join('');
    Game.show('codex');
  };

  /* ---------- 绑定（静态元素，脚本末尾即可） ---------- */
  function bind() {
    const send = U.$('#story-send'), input = U.$('#story-input');
    if (send) send.onclick = () => { const v = input.value.trim(); if (v) { input.value = ''; P2.onPlayerInput(v); } };
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') { const v = input.value.trim(); if (v) { input.value = ''; P2.onPlayerInput(v); } } });
    const cb = U.$('#btn-codex'); if (cb) cb.onclick = () => P2.openCodex();
    const bg = U.$('#btn-bag'); if (bg) bg.onclick = () => P2.openBag();
    const rd = U.$('#btn-radio'); if (rd) rd.onclick = () => S().hasRadio ? Game.openNews() : P2.obtainRadio('你从抽屉里翻出一台旧收音机。它还活着，只是信号像砂纸一样粗糙。');
    const back = U.$('#btn-codex-back'); if (back) back.onclick = () => Game.show('story');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();

})();
