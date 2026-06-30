/* ============================================================
 * 游戏主逻辑：状态机 / 每日循环 / 行动 / 采购 / 事件 / 弹幕流 / 渲染
 * ============================================================ */
(function () {
  'use strict';
  const DS = window.DS;
  const U = DS.util;
  const D = DS.data;
  const S = () => DS.state;

  const Game = (DS.game = {});

  /* ============ 屏幕切换 ============ */
  Game.show = function (screen) {
    S().screen = screen;
    U.$$('.screen').forEach(el => el.classList.toggle('active', el.id === 'screen-' + screen));
    if (screen !== 'game') { clearInterval(Game._dmTimer); DS.danmaku.clear(); }
    if (screen === 'game') Game.renderGame();
    if (screen === 'create') Game.renderCreate();
  };

  /* ============ 模态框 ============ */
  Game.modal = function (title, bodyHtml, buttons) {
    const wrap = U.$('#modal-root');
    const btns = (buttons || [{ label: '知道了' }])
      .map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}">${U.esc(b.label)}</button>`).join('');
    wrap.innerHTML = `
      <div class="modal-mask"></div>
      <div class="modal-box">
        <div class="modal-title">${title}</div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-actions">${btns}</div>
      </div>`;
    wrap.classList.add('show');
    wrap.querySelectorAll('.modal-actions .btn').forEach(b => {
      b.onclick = () => {
        const def = (buttons || [])[+b.dataset.i];
        if (def && def.onClick) def.onClick();
        else Game.closeModal();
      };
    });
  };
  Game.closeModal = function () { U.$('#modal-root').classList.remove('show'); };

  /* ============ 存档 / 读档 ============ */
  Game.openSaveLoad = function () {
    const abName = id => (D.abilities.find(a => a.id === id) || {}).name || '';
    const slots = [1, 2, 3].map(n => {
      const m = DS.slotInfo(n);
      const desc = m
        ? `${m.phase >= 2 ? '末日' : '囤货'} 第${m.day}天 · ${abName(m.ab)} · ${new Date(m.t).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
        : '— 空档位 —';
      return `<div class="slot-row">
        <div class="slot-info"><b>档位 ${n}</b><br><small>${desc}</small></div>
        <div class="slot-btns">
          <button class="btn slot-save" data-n="${n}">存入</button>
          <button class="btn slot-load" data-n="${n}" ${m ? '' : 'disabled'}>读取</button>
        </div></div>`;
    }).join('');
    Game.modal('💾 存档 / 读档', `<div class="slots">${slots}</div><p class="hint">游戏也会自动保存（标题页"继续"）。这里是手动多档位。</p>`,
      [{ label: '关闭', cls: 'btn-primary' }]);
    U.$$('.slot-save').forEach(b => b.onclick = () => { DS.saveSlot(b.dataset.n); Game.toast('已存入档位 ' + b.dataset.n); Game.openSaveLoad(); });
    U.$$('.slot-load').forEach(b => b.onclick = () => {
      if (DS.loadSlot(b.dataset.n)) { Game.closeModal(); Game.resume(); Game.toast('已读取档位 ' + b.dataset.n); }
      else Game.toast('读取失败');
    });
  };

  /* 读档后回到正确界面 */
  Game.resume = function () {
    const s = DS.state;
    if (s.story) s.story.busy = false;     // 防止存档时正卡在 AI 生成中，读档后永久卡“生成中…”
    if (s.player.ability.id === 'eye') DS.danmaku.setReveal(true);
    if (s.phase >= 2) {
      DS.phase2ui.choiceHandler = null;
      Game.show('story'); DS.phase2ui.renderHUD(); DS.phase2ui.render();
    } else if (s.screen === 'create') {
      Game.show('create');
    } else {
      Game.show('game'); Game.startDanmakuStream();
    }
  };

  /* ============ 新游戏 / 创建 ============ */
  Game.newGame = function () {
    DS.state = DS.attachRuntime(DS.newState());
    Game.show('create');
  };

  Game.renderCreate = function () {
    const grid = U.$('#ability-grid');
    grid.innerHTML = D.abilities.map(a => `
      <div class="ability-card" data-id="${a.id}">
        <div class="ab-icon">${a.icon}</div>
        <div class="ab-name">${a.name} <span class="ab-lv">Lv1</span></div>
        <div class="ab-desc">${a.desc}</div>
      </div>`).join('');
    let chosen = null;
    grid.querySelectorAll('.ability-card').forEach(c => {
      c.onclick = () => {
        grid.querySelectorAll('.ability-card').forEach(x => x.classList.remove('sel'));
        c.classList.add('sel'); chosen = c.dataset.id;
        U.$('#btn-start').disabled = false;
      };
    });
    U.$('#btn-start').disabled = true;
    U.$('#btn-start').onclick = () => {
      if (!chosen) return;
      Game.applyAbilityInit(chosen);
      Game.show('game');
      // 先播开场醒来剧情，再进入 Day1 并自动翻开报纸
      Game.playIntro(() => {
        DS.log('Day 1。先读报纸，再决定怎么活下去。', 'story');
        Game.startDay(true);
        Game.openNews(true);
        DS.save();
      });
    };
  };

  /* ============ 开场剧情 ============ */
  Game.playIntro = function (onDone) {
    let i = 0;
    let ov = U.$('#story-overlay');
    if (!ov) { ov = document.createElement('div'); ov.id = 'story-overlay'; document.body.appendChild(ov); }
    const render = () => {
      const beat = D.intro[i];
      ov.innerHTML = `<div class="story-inner">
        <div class="story-text">${U.esc(beat.text).replace(/\n/g, '<br>')}</div>
        <button class="btn btn-primary story-next">${i < D.intro.length - 1 ? '继续 →' : '醒来，面对这一切 →'}</button>
        <div class="story-progress">${i + 1} / ${D.intro.length}</div>
      </div>`;
      ov.classList.add('show');
      if (beat.dm) DS.danmaku.burst(beat.dm, 950);
      ov.querySelector('.story-next').onclick = next;
    };
    const next = () => {
      i++;
      if (i >= D.intro.length) { ov.classList.remove('show'); ov.innerHTML = ''; DS.danmaku.clear(); if (onDone) onDone(); return; }
      render();
    };
    render();
  };

  /* ============ 每日报纸 ============ */
  Game.openNews = function () {
    const s = S();
    s.flags.newsRead = true;

    // 末日后：报纸停刊，变灰；捡到收音机才恢复每日情报
    if (s.phase >= 2 && !s.hasRadio) {
      Game.modal(`<span class="paper-name">末日晨报</span> · 停刊`,
        `<div class="newspaper dead">
          <div class="news-h">—— 本报已停止印刷 ——</div>
          <div class="news-b">最后一张报纸停在末日爆发那天。没有电，没有信号，城市与外界彻底失联。<br><br>油墨已经发黄。你盯着上面早已过时的头条，忽然很想念那个还会按时出报的世界。<br><br>（也许……该找一台还能用的收音机。）</div>
        </div>`,
        [{ label: '放下报纸', cls: 'btn-primary' }]);
      Game.renderGame(); return;
    }
    const tagCls = { '头条': 't-top', '财经': 't-fin', '民生': 't-life', '紧急': 't-urgent', '简讯': 't-brief', '广告': 't-ad', '社会': 't-soc', '电波': 't-urgent', '噪声': 't-brief', '天气': '', '体育': 't-soc', '科技': 't-fin' };
    const radio = s.phase >= 2 && s.hasRadio;
    const radioDay = radio && s.story ? s.story.day : s.day;
    const items = radio ? D.radioByDay(radioDay, s) : (s.news && s.news.length ? s.news : D.makeNews(s.day));
    const html = items.map(n => `<div class="news-item">
      <span class="news-tag ${tagCls[n.tag] || ''}">${n.tag}</span>
      <div class="news-h">${U.esc(n.h)}</div>${n.b ? `<div class="news-b">${U.esc(n.b)}</div>` : ''}
    </div>`).join('');
    const title = radio ? `<span class="paper-name">📻 幸存者电波</span> · 末日第${radioDay}天`
      : `<span class="paper-name">末日晨报</span> · Day ${s.day}`;
    const foot = radio ? '<p class="hint">收音机里的杂音中，偶尔能听到求生的线索。</p>'
      : '<p class="hint">弹幕正围绕这些新闻吵真假——点顶栏 📺 可回看慢读、逐条标信/疑。</p>';
    Game.modal(title, `<div class="newspaper ${radio ? 'radio' : ''}">${html}</div>${foot}`,
      [{ label: radio ? '关掉收音机' : '看完了', cls: 'btn-primary' }]);
    Game.renderGame();
  };

  Game.applyAbilityInit = function (id) {
    const s = S();
    s.player.ability = { id, level: 1, xp: 0, xpNext: 100 };
    if (id === 'storage') s.space.max += 60;
    if (id === 'eye') DS.danmaku.setReveal(true);
  };

  /* ============ 弹幕流（全天持续，可回看） ============ */
  Game.startDanmakuStream = function () {
    clearInterval(Game._dmTimer);
    DS.danmaku.clear();
    const s = S();
    // 先放几条让屏幕立刻有内容
    let i = 0;
    const kickoff = () => { if (i < 3) { Game._emitNext(true); i++; setTimeout(kickoff, 1400); } };
    kickoff();
    Game._dmTimer = setInterval(() => Game._emitNext(false), 3800);
  };
  Game._emitNext = function (priority) {
    const s = S();
    if (s.screen !== 'game') return;
    let item;
    const imp = s._dmImportant || [];
    if (imp.length && (priority || U.chance(0.5))) item = imp.shift();
    else item = U.pick(D.ambientDanmaku);
    // 识人养成：信誉绝对值够高的ID，其真假自动暴露（克隆避免污染共享弹幕池）
    const reliable = item.id && item.kind && item.kind !== 'flavor'
      && Math.abs(s.reputation[item.id] || 0) >= DS.SIGNAL_REP;
    DS.danmaku.shoot(reliable ? Object.assign({}, item, { revealKind: true }) : item);
    Game._recordDm(item);
  };
  Game._recordDm = function (item) {
    const s = S();
    if (!item || !item.text) return;
    const key = (item.id || '') + '|' + item.text;
    if (s.dmHistory.some(d => d._k === key)) return;
    s.dmHistory.push({ _k: key, id: item.id, text: item.text, kind: item.kind });
    if (s.dmHistory.length > 60) s.dmHistory.shift();
    if (s.screen === 'game') { const b = U.$('#dm-count'); if (b) b.textContent = s.dmHistory.length; }
  };

  /* ============ 弹幕回看面板 ============ */
  Game.openDanmakuPanel = function () {
    const s = S();
    const hasEye = s.player.ability.id === 'eye';
    const rows = s.dmHistory.slice().reverse().map((d, idx) => {
      const rep = d.id ? (s.reputation[d.id] || 0) : 0;
      // 信誉够高/够低的ID会带“信源/带节奏”标签，且其真假对玩家暴露（眼系则全暴露）
      const signal = d.id && rep >= DS.SIGNAL_REP ? 'src' : (d.id && rep <= -DS.SIGNAL_REP ? 'noise' : '');
      const reveal = hasEye || (d.kind && d.kind !== 'flavor' && Math.abs(rep) >= DS.SIGNAL_REP);
      const srcTag = signal === 'src' ? '<span class="rep src">✓信源</span>'
        : signal === 'noise' ? '<span class="rep noise">⚠带节奏</span>' : '';
      const repTag = d.id ? `<span class="rep ${rep > 0 ? 'pos' : rep < 0 ? 'neg' : ''}">信誉${rep > 0 ? '+' : ''}${rep}</span>` : '';
      let mark = '';
      if (reveal && d.kind === 'true') mark = '<span class="dm-badge dm-badge-t">真</span>';
      if (reveal && d.kind === 'false') mark = '<span class="dm-badge dm-badge-f">假</span>';
      const j = s.judged[d._k];
      const judgeUI = d.kind && d.kind !== 'flavor'
        ? `<div class="dm-row-judge">
          <button class="jb ${j === 'trust' ? 'on' : ''}" data-k="${idx}" data-v="trust">信</button>
          <button class="jb ${j === 'doubt' ? 'on' : ''}" data-k="${idx}" data-v="doubt">疑</button>
        </div>`
        : '<div class="dm-row-judge"><span class="jb-na">闲聊</span></div>';
      return `<div class="dm-row">
        <div class="dm-row-main">${mark}<span class="dm-row-id">${U.esc(d.id || '匿名')}</span>${srcTag}${repTag}
          <div class="dm-row-text">${U.esc(d.text)}</div></div>
        ${judgeUI}</div>`;
    }).join('') || '<p class="hint">今天还没有弹幕。</p>';
    Game.modal('📺 弹幕回看', `
      <p class="hint">慢慢读，对有真假的弹幕点「信」/「疑」，<b>睡觉时结算</b>：判对攒洞察，判错倒扣。${hasEye ? '你的【鉴弹之眼】已标出全部真假。' : '看穿过的「信源」会自动亮出真假。'}　🔮 洞察 <b>${s.insight || 0}</b></p>
      <div class="dm-feed">${rows}</div>`, [
      { label: '关闭', cls: 'btn-primary' },
    ]);
    U.$$('.dm-feed .jb').forEach(b => {
      b.onclick = () => {
        const revIdx = +b.dataset.k;
        const d = s.dmHistory.slice().reverse()[revIdx];
        if (!d) return;
        s.judged[d._k] = b.dataset.v;
        Game.openDanmakuPanel();
      };
    });
  };

  /* ============ 识弹结算（睡觉时） ============
   * · 每条有真假的弹幕：应验(真)→该ID信誉+1，打脸(假)→-1，累积“信源/带节奏”
   * · 玩家若标了信/疑：判对洞察+1，判错-1（眼系太轻松，正确不加分只防倒扣）
   */
  Game.settleJudgments = function () {
    const s = S();
    const hasEye = s.player.ability.id === 'eye';
    let correct = 0, wrong = 0, delta = 0;
    s.dmHistory.forEach(d => {
      if (!d.id || !d.kind || d.kind === 'flavor') return;
      s._rep(d.id, d.kind === 'true' ? +1 : -1);   // ID 应验/打脸，累积信誉
      const j = s.judged[d._k];
      if (!j) return;
      const right = (j === 'trust' && d.kind === 'true') || (j === 'doubt' && d.kind === 'false');
      if (right) { correct++; if (!hasEye) delta++; }
      else { wrong++; delta--; }
    });
    if (correct || wrong) {
      s.insight = (s.insight || 0) + delta;
      DS.log(`📺 识弹结算：判对 ${correct}、判错 ${wrong}，洞察 ${delta >= 0 ? '+' : ''}${delta}（累计 ${s.insight}）。`, delta >= 0 ? 'good' : 'bad');
    }
  };

  /* ============ 每日开始 ============ */
  Game.startDay = function (first) {
    const s = S();
    s.ap = DS.AP_MAX;
    s.dmHistory = [];
    s.judged = {};
    s.flags.newsRead = false;
    s.flags.workedToday = false;
    s.market.onlineOpen = s.day < 26;
    s.news = D.makeNews(s.day);          // 每天重新生成报纸

    // 每日突发危机（从第二天起）
    if (!first) Game.dailyHazards();

    // 异能被动
    const ab = s.player.ability.id;
    if (ab === 'create' && !first) {
      if (U.chance(0.5)) { s.resources.water++; DS.log('【造物之手】凝出一份清水。', 'good'); }
      else { s.resources.food++; DS.log('【造物之手】生成一份口粮。', 'good'); }
    }

    // 今日事件
    const todays = D.events.filter(e => {
      if (s.flags['evt_' + e.id]) return false;
      if (s.day < e.window[0] || s.day > e.window[1]) return false;
      if (s.day === e.window[1]) return true;
      return U.chance(1 / (e.window[1] - s.day + 1));
    });
    s._todayEvents = todays.map(e => e.id);

    // 灾厄预感：预警危险事件
    if (ab === 'omen') {
      todays.forEach(e => {
        if (/safehouse|rob|neighbor/.test(e.id)) DS.log('【灾厄预感】一阵寒意——今天有个抉择，弄错会要命。', 'bad');
      });
    }

    // 准备今日重要弹幕（事件 + 当日情报），优先飘出 & 进回看
    const imp = [];
    todays.forEach(e => (e.danmaku || []).forEach(d => imp.push(d)));
    D.intelByDay(s.day).forEach(d => imp.push(d));
    D.reactiveDanmaku(s).forEach(d => imp.push(d));   // 针对当前处境的反应式弹幕
    imp.sort(() => Math.random() - 0.5);
    imp.forEach(d => { Game._recordDm(d); if (d.id && s.reputation[d.id] == null) s.reputation[d.id] = 0; });
    s._dmImportant = imp.slice();

    todays.forEach(e => DS.log(`【事件】${e.title}`, 'event'));
    if (first) DS.log('Day 1。趁世界还正常，囤东西、读弹幕、别被带节奏。', 'info');

    Game.startDanmakuStream();
    Game.fetchAIDanmaku();      // AI 氛围弹幕（异步，失败则本地池兜底）
    Game.renderGame();
  };

  /* AI 弹幕：根据当前处境生成观众吐槽，异步注入弹幕流 */
  Game.fetchAIDanmaku = function () {
    if (!DS.api || !DS.api.isReady()) return;
    const s = S();
    const r = s.resources;
    const headline = (s.news && s.news[0]) ? s.news[0].h : '';
    const ab = (D.abilities.find(a => a.id === s.player.ability.id) || {}).name || '';
    const summary = [
      `第${s.day}天/共30天（末日前囤货期）。`,
      headline ? `今日头条：「${headline}」。` : '',
      `女主异能：${ab}。现金¥${s.player.money}。`,
      `物资：水${r.water} 食物${r.food} 药${r.meds} 防身${r.defense}（储物${s.space.used}/${s.space.max}）。`,
      s.log.length ? `最近发生：${s.log.slice(0, 3).map(l => l.text).join('；')}` : '',
    ].filter(Boolean).join('');
    const dayAtCall = s.day;
    DS.api.genDanmaku(summary).then(list => {
      const cur = S();
      if (cur.day !== dayAtCall || cur.screen !== 'game') return;  // 已过期则丢弃
      cur._dmImportant = cur._dmImportant || [];
      list.forEach(d => { cur._dmImportant.push(d); Game._recordDm(d); });
      if (list.length) DS.log('（观众涌入，弹幕变多了）', 'info');
    }).catch(e => console.warn('AI弹幕失败，本地池兜底：', e.message));
  };

  /* ============ 行动 ============ */
  Game.spendAP = function (n) {
    if (S().ap < n) { Game.toast('行动点不够了，该睡觉推进到明天'); return false; }
    S().ap -= n; return true;
  };

  Game.actWork = function () {
    const s = S();
    if (s.flags.workedToday) { Game.toast('今天已经打过工了，明天再来'); return; }
    if (!Game.spendAP(1)) return;
    s.flags.workedToday = true;
    const gain = U.randInt(110, 180);
    s.player.money += gain;
    DS.log(`你出门打了一天零工，赚到 ¥${gain}。（每天只能打一次工）`, 'good');
    Game.streetEncounter();
    Game.afterAction();
  };

  /* ============ 出门：随机机遇/风险 ============ */
  Game.actGoOut = function () {
    if (!Game.spendAP(1)) return;
    const s = S();
    if (!s.metLeads) s.metLeads = {};
    // 加权随机一个出门事件
    const roll = Math.random();
    let acc = 0;
    const table = [
      ['bank', 0.20], ['sale', 0.16], ['gossip', 0.16], ['robbed', 0.12],
      ['lead', 0.12], ['trivial', 0.24],
    ];
    let kind = 'trivial';
    for (const [k, w] of table) { acc += w; if (roll < acc) { kind = k; break; } }

    if (kind === 'bank') { Game.fundModal(); return; }
    if (kind === 'sale') {
      DS.log('出门：撞上综合超市清仓促销，全场打折！', 'good');
      Game.openShop('offline', { discount: 0.65, fromGoOut: true }); return;
    }
    if (kind === 'gossip') {
      const g = U.pick(D.gossip);
      DS.log('出门打听到一条八卦：' + g, 'story');
      Game.modal('🗣️ 街头八卦', `<p>你在街角听人闲聊，捕捉到一条消息：</p><p class="hint">"${g}"</p>`, [{ label: '记下了', cls: 'btn-primary' }]);
      Game.renderGame(); DS.save(); return;
    }
    if (kind === 'robbed') {
      const lose = Math.min(s.player.money, U.randInt(40, 120));
      s.player.money -= lose;
      DS.log(`出门：人群拥挤，钱包被摸走 ¥${lose}。`, 'bad');
      Game.afterAction(); return;
    }
    if (kind === 'lead') {
      const unmet = D.maleLeads.filter(m => !s.metLeads[m.id]);
      if (unmet.length) {
        const m = U.pick(unmet);
        s.metLeads[m.id] = true;
        DS.log(`出门：你似乎与某个不寻常的人擦肩而过……`, 'story');
        Game.modal('👤 擦肩而过', `<p>${m.cameo}</p><p class="hint">（末日还未降临。但这张脸，你会再见到的。）</p>`, [{ label: '继续赶路', cls: 'btn-primary' }]);
        Game.renderGame(); DS.save(); return;
      }
      // 都见过了则退化为闲逛
    }
    // trivial / 兜底
    DS.log('出门：' + U.pick([
      '你在街上漫无目的地走了一圈，什么也没发生。',
      '你排了半天队买奶茶，店却关门了，白跑一趟。',
      '你被街边推销缠了好一会儿，浪费了点时间。',
      '你站在天桥上发了会儿呆，想念回不去的世界。',
    ]), 'info');
    Game.afterAction();
  };

  /* 基金（出门到银行时触发，不再额外消耗行动点） */
  Game.fundModal = function () {
    const s = S();
    if (s.player.money < 100) { Game.modal('🏦 银行', '<p>你路过银行，但本金太少（至少¥100），没法买基金。</p>', [{ label: '离开', cls: 'btn-primary', onClick: () => { Game.closeModal(); Game.afterAction(); } }]); return; }
    Game.modal('🏦 银行·基金', `
      <p>出门顺道进了银行。投多少搏一把？弹幕里的"内幕"不一定靠谱。</p>
      <p>现金：<b>¥${s.player.money}</b></p>
      <input id="fund-amt" type="number" class="input" value="${Math.min(300, s.player.money)}">`,
      [
        { label: '不买了', onClick: () => { Game.closeModal(); Game.afterAction(); } },
        { label: '梭哈！', cls: 'btn-primary', onClick: () => {
          const amt = U.clamp(parseInt(U.$('#fund-amt').value) || 0, 0, s.player.money);
          Game.closeModal();
          if (amt <= 0) { Game.afterAction(); return; }
          const r = Math.random(); let mult, msg;
          if (r < 0.18) { mult = 0; msg = '暴雷！血本无归。'; }
          else if (r < 0.55) { mult = 0.6; msg = '绿了，亏了。'; }
          else if (r < 0.85) { mult = 1.3; msg = '小赚一波。'; }
          else { mult = 2.1; msg = '涨停！大赚！'; }
          const back = Math.round(amt * mult);
          s.player.money += (back - amt);
          DS.log(`基金：投¥${amt} → 回收¥${back}。${msg}`, mult >= 1 ? 'good' : 'bad');
          Game.afterAction();
        } },
      ]);
  };

  /* 物价：线下随末日临近上涨；网购便宜但有延迟 */
  Game.offlinePrice = function (it) {
    const s = S();
    const inflation = 1 + (s.day - 1) * 0.05;
    const panic = s.flags.panic ? 1.3 : 1;
    return Math.round(it.price * inflation * panic);
  };
  Game.onlinePrice = function (it) { return Math.round(it.price * 0.82); };
  Game.deliveryDays = function () { const d = S().day; return d < 15 ? 1 : 2; };

  Game.openShop = function (mode, opts) { // 'offline' | 'online'
    opts = opts || {};
    const s = S();
    if (mode === 'online' && !s.market.onlineOpen) { Game.toast('封锁了，网购平台已停摆'); return; }
    const spentHere = !opts.fromGoOut;          // 经"出门"促销进来则不再额外扣行动点
    if (spentHere && !Game.spendAP(1)) return;
    const online = mode === 'online';
    const discount = opts.discount || 1;        // 促销折扣
    let scarcity = U.clamp((s.day - 1) / (DS.LAST_DAY - 1), 0, 1);
    if (opts.discount) scarcity = 0.1;          // 促销货相对充足
    else if (!online && s.flags.shortageToday) scarcity = 0.95; // 断货潮：几乎扫空
    const rows = D.items.map(it => {
      const price = Math.round((online ? Game.onlinePrice(it) : Game.offlinePrice(it)) * discount);
      const out = !online && it.line && U.chance(scarcity * 0.7);
      const trend = !online && s.day > 1 ? '<span class="up">↑</span>' : '';
      return `<div class="shop-row ${out ? 'out' : ''}">
        <span class="si">${it.icon}</span>
        <span class="sn">${it.name}<br><small>${it.desc}</small></span>
        <span class="sp">¥${price}${trend}<br><small>占${it.space}</small></span>
        ${out ? '<span class="soldout">售罄</span>' :
          `<span class="sbtn"><input type="number" min="0" value="0" class="qty" data-id="${it.id}" data-price="${price}"></span>`}
      </div>`;
    }).join('');
    const tip = opts.discount
      ? '<p class="shop-tip">🎉 清仓促销：全场约 35% off，货也比平时足，机会难得！</p>'
      : online
      ? `<p class="shop-tip">🛒 网购：比线下便宜约 18%，但 ${Game.deliveryDays()} 天后才送达、有约 10% 丢件/损毁风险（钱不退），且 Day26 起封锁停摆。</p>`
      : '<p class="shop-tip">🏪 线下：即时到手，但物价随末日上涨、热门货会售罄，出门还有风险。</p>';
    Game.modal(opts.discount ? '🎉 超市促销' : online ? '网购' : '线下采购', `
      ${tip}
      <p>现金 <b>¥${s.player.money}</b> ｜ 空间 <b>${s.space.used}/${s.space.max}</b></p>
      <div class="shop-list">${rows}</div>
      <div class="shop-total" id="shop-total">合计：¥0 · 占用 0</div>`,
      [
        { label: '取消', onClick: () => { if (spentHere) s.ap++; Game.closeModal(); Game.renderGame(); } },
        { label: '结算', cls: 'btn-primary', onClick: () => Game.checkout(mode) },
      ]);
    const recompute = () => {
      let cost = 0, space = 0;
      U.$$('.qty').forEach(q => { const it = D.itemById(q.dataset.id); const n = parseInt(q.value) || 0; cost += (+q.dataset.price) * n; space += it.space * n; });
      const over = (online ? false : s.space.used + space > s.space.max) || cost > s.player.money;
      U.$('#shop-total').innerHTML = `合计：¥${cost} · 占用 ${space} ${over ? '<span class="warn">（超预算/超空间）</span>' : ''}`;
    };
    U.$$('.qty').forEach(q => q.oninput = recompute);
  };

  Game.checkout = function (mode) {
    const s = S(); const online = mode === 'online';
    let cost = 0, space = 0, bought = [];
    U.$$('.qty').forEach(q => {
      const it = D.itemById(q.dataset.id); const n = parseInt(q.value) || 0;
      if (n > 0) { cost += (+q.dataset.price) * n; space += it.space * n; bought.push({ it, n }); }
    });
    if (cost === 0) { Game.toast('没选东西'); return; }
    if (cost > s.player.money) { Game.toast('钱不够'); return; }
    if (!online && s.space.used + space > s.space.max) { Game.toast('空间不够（网购可分批到货）'); return; }
    s.player.money -= cost;
    if (online) {
      const arrive = s.day + Game.deliveryDays();
      bought.forEach(b => s.pendingDelivery.push({ item: b.it.id, qty: b.n, arriveDay: arrive }));
      DS.log(`网购下单 ¥${cost}，${Game.deliveryDays()}天后送达。`, 'info');
    } else {
      bought.forEach(b => Game.addItem(b.it, b.n));
      DS.log(`线下采购 ¥${cost}，到手。`, 'good');
      Game.streetEncounter();
    }
    Game.closeModal();
    Game.afterAction();
  };

  Game.addItem = function (it, n) {
    const s = S();
    s.space.used += it.space * n;
    if (it.line) s.resources[it.line] += n;
    else s.flags['has_' + it.id] = (s.flags['has_' + it.id] || 0) + n;
  };

  /* ============ 街头遭遇（出门时） ============ */
  Game.streetEncounter = function () {
    if (!U.chance(0.55)) return;
    const e = U.pick(D.encounters);
    e.run(S());
  };

  /* ============ 每日突发危机（强制，不可回避） ============ */
  Game.dailyHazards = function () {
    const s = S(), r = s.resources;
    s.flags.shortageToday = false;

    // ① 入室抢劫：现金多 / 囤货显眼 且 防身不足 → 被盯上（前 3 天治安尚可，给玩家立足时间）
    if (s.day >= 4 && (s.player.money > 900 || s.space.used > 26) && U.chance(0.28)) {
      if (r.defense >= 2) {
        DS.log('深夜有人撬门——你抄起武器，对方见你有防备，悻悻离开。（防身救了你）', 'good');
      } else if (r.defense >= 1) {
        r.defense -= 1;
        DS.log('有人破门而入！一番搏斗你吓退了他，但武器损坏，防身 -1。', 'bad');
      } else {
        const lose = Math.min(s.player.money, U.randInt(100, 260));
        s.player.money -= lose;
        DS.log(`遭入室抢劫！你手无寸铁，被抢走 ¥${lose}。该囤点防身武器了。`, 'bad');
      }
    }

    // ② 生病：有药压下去并恢复，没药则病情累积——连续 3 天无药硬扛会病死
    if (U.chance(0.20)) {
      if (r.meds >= 1) {
        r.meds -= 1;
        s.flags.sickStreak = Math.max(0, (s.flags.sickStreak || 0) - 1);
        DS.log('你淋雨发烧了一场，好在备了药，用掉 1 份药品压了下去。', 'bad');
      } else {
        const cost = Math.min(s.player.money, 220);
        s.player.money -= cost;
        s.flags.sickStreak = (s.flags.sickStreak || 0) + 1;
        DS.log(`你病倒了，家里没药，只能花 ¥${cost} 去黑诊所撑着。病情还在累积（无药硬扛第 ${s.flags.sickStreak} 天）。`, 'bad');
        if (s.flags.sickStreak >= 2) DS.log('⚠ 你高烧不退、浑身发软——再不弄到药，可能撑不过去。', 'bad');
      }
    } else {
      // 没生病的一天：身体慢慢恢复
      s.flags.sickStreak = Math.max(0, (s.flags.sickStreak || 0) - 1);
    }

    // ③ 抢购断货潮：临近末日，某些天全城售罄
    if (s.day >= 12 && U.chance(0.28)) {
      s.flags.shortageToday = true;
      DS.log('⚠ 今天全城爆发抢购，货架被扫空，线下基本买不到东西。', 'bad');
    }
  };

  /* ============ 处理今日事件 ============ */
  Game.openTodayEvent = function (eid) {
    const e = D.events.find(x => x.id === eid); if (!e) return;
    const choices = (e.choices || []).map(c => ({
      label: c.label, onClick: () => Game.resolveEvent(e, c),
    }));
    Game.modal('📰 ' + e.title, `<p>${e.desc}</p><p class="hint">屏幕上的弹幕在争论……点右上 📺 可回看慢读。</p>`, choices);
  };
  Game.resolveEvent = function (e, choice) {
    const s = S();
    s.flags['evt_' + e.id] = choice.label;
    s._todayEvents = (s._todayEvents || []).filter(id => id !== e.id);
    if (choice.effect) choice.effect(s);
    Game.closeModal();
    Game.renderGame();
    DS.save();
  };

  /* ============ 推进到下一天 ============ */
  Game.afterAction = function () { Game.renderGame(); DS.save(); };

  Game.nextDay = function () {
    const s = S();
    Game.settleJudgments();   // 先结算今日识弹（startDay 会清空 dmHistory/judged）
    // 日常开销：房租水电杂费，随末日临近上涨、恐慌时上浮（曲线放缓，打工足以覆盖）
    const expense = 25 + (s.day - 1) * 3 + (s.flags.panic ? 50 : 0);
    if (s.player.money >= expense) {
      s.player.money -= expense;
      s.flags.brokeDays = 0;
      DS.log(`日常开销（房租·水电·杂费）-¥${expense}。`, 'info');
    } else {
      // 付不起：先欠着，连续两天交不出才被扫地出门（与渴/饿死一致的 2 天缓冲）
      s.player.money = 0;
      s.flags.brokeDays = (s.flags.brokeDays || 0) + 1;
      DS.log(`交不起 ¥${expense} 房租水电，被房东堵在门口。（欠费第 ${s.flags.brokeDays} 天——连续两天就被赶出去）`, 'bad');
    }

    let crisis = [];
    if (s.resources.water >= 1) s.resources.water--; else crisis.push('water');
    if (s.resources.food >= 1) s.resources.food--; else crisis.push('food');
    s.flags.thirstDays = crisis.includes('water') ? (s.flags.thirstDays || 0) + 1 : 0;
    s.flags.hungerDays = crisis.includes('food') ? (s.flags.hungerDays || 0) + 1 : 0;
    if (crisis.length) DS.log('今天缺：' + crisis.map(c => c === 'water' ? '水' : '粮').join('、') + '。', 'bad');

    if (s.flags.thirstDays >= 2) return Game.gameOver('你连续两天没有干净的水，倒在公寓地板上。（渴死）');
    if (s.flags.hungerDays >= 2) return Game.gameOver('饥饿击垮了你，末日还没来，你先没撑住。（饿死）');
    if ((s.flags.sickStreak || 0) >= 3) return Game.gameOver('高烧连日不退，家里没有一粒药，你在反复昏睡中再没能睁开眼。（病死）');
    if ((s.flags.brokeDays || 0) >= 2) return Game.gameOver('连续两天交不起房租，你被赶出公寓，囤的物资全留在了里面，流落街头。（穷死）');
    if (s.flags.jailTrap && s.day >= 28) return Game.gameOver('你还关在看守所里，末日降临，铁门成了催命符。（团灭）');

    // 网购到货（有翻车/被偷风险，钱不退）
    const arrived = s.pendingDelivery.filter(p => p.arriveDay <= s.day + 1);
    const okList = [];
    arrived.forEach(p => {
      const it = D.itemById(p.item); const r = Math.random();
      if (r < 0.05) DS.log(`📦 网购的【${it.name}×${p.qty}】运输途中翻车损毁，货没了，钱也打了水漂。`, 'bad');
      else if (r < 0.10) DS.log(`📦 网购的【${it.name}×${p.qty}】被偷件，签收成空包。`, 'bad');
      else { Game.addItem(it, p.qty); okList.push(it.name + '×' + p.qty); }
    });
    if (okList.length) DS.log('快递到了：' + okList.join('，'), 'good');
    s.pendingDelivery = s.pendingDelivery.filter(p => p.arriveDay > s.day + 1);

    // 物价/抢购：临近末日随机进入恐慌
    if (s.day >= 16 && U.chance(0.35)) { s.flags.panic = true; }

    s.day++;
    if (s.day > DS.LAST_DAY) return Game.endPhase1();
    Game.startDay(false);
    DS.save();
  };

  Game.endPhase1 = function () {
    const s = S(); const r = s.resources;
    const ok = k => r[k] >= D.goals[k];
    // 逃生只能带走随身物资（空间仓库异能除外）——结算页提前告知，避免进二阶段才发现“缩水”
    const bonus = DS.insightCarryBonus(s.insight);
    const carry = DS.computeCarry(r, s.player.ability.id, bonus);
    const insightNote = (!carry.unlimited && bonus > 0)
      ? `<p class="hint">🔮 洞察 ${s.insight}：你读懂了弹幕的真假，提前打包了更聪明的逃生包，随身上限 +${bonus}。</p>` : '';
    const carryNote = carry.unlimited
      ? '<p class="hint">📦【空间仓库】随身储物，囤下的物资可以整批带走。</p>'
      : carry.capped
        ? `<p class="hint">⚠ 逃命要紧，你只能背走随身能带的：💧${carry.kept.water} 🍖${carry.kept.food} 💊${carry.kept.meds} 🔪${carry.kept.defense}。带不走的（💧${carry.left.water} 🍖${carry.left.food} 💊${carry.left.meds} 🔪${carry.left.defense}）只能留在公寓。</p>`
        : '<p class="hint">你的物资不多，随身全部带走。</p>';
    const summary = `
      <p>Day 30 凌晨，城市的天空被撕开。<b>末日，来了。</b></p>
      <p>囤货结算（决定你末日开局的状态）：</p>
      <ul class="result-list">
        <li>💧 水 ${r.water}/${D.goals.water} ${ok('water') ? '✅' : '⚠️'}　🍖 食物 ${r.food}/${D.goals.food} ${ok('food') ? '✅' : '⚠️'}</li>
        <li>💊 药品 ${r.meds}/${D.goals.meds} ${ok('meds') ? '✅' : '⚠️'}　🔪 防身 ${r.defense}/${D.goals.defense} ${ok('defense') ? '✅' : '⚠️'}</li>
        <li>💰 现金 ¥${s.player.money}（将折算为晶核）</li>
      </ul>
      ${insightNote}${carryNote}
      <p class="hint">接下来进入第二阶段——AI 驱动的末日求生剧情。</p>`;
    clearInterval(Game._dmTimer);
    Game.modal('🧟 末日爆发', summary, [
      { label: '睁开眼，活下去 →', cls: 'btn-primary', onClick: () => { Game.closeModal(); DS.phase2ui.start(); } },
    ]);
  };

  Game.gameOver = function (reason) {
    const s = S(); s.dead = true; s.deathReason = reason;
    clearInterval(Game._dmTimer);
    Game.modal('💀 你死了', `<p>${reason}</p><p class="hint">活到 Day ${s.day}／末日是 Day ${DS.LAST_DAY}。</p>`, [
      { label: '重新开始', cls: 'btn-primary', onClick: () => { DS.clearSave(); Game.closeModal(); Game.newGame(); } },
    ]);
  };

  /* ============ Toast ============ */
  Game.toast = function (msg) {
    let t = U.$('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(Game._tt); Game._tt = setTimeout(() => t.classList.remove('show'), 1800);
  };

  /* ============ 渲染 ============ */
  Game.renderGame = function () {
    const s = S();
    const ab = D.abilities.find(a => a.id === s.player.ability.id) || {};
    U.$('#hud-day').textContent = `Day ${s.day}/${DS.LAST_DAY}`;
    U.$('#hud-ap').innerHTML = '⚡' + '●'.repeat(s.ap) + '<span class="ap-empty">' + '○'.repeat(DS.AP_MAX - s.ap) + '</span>';
    U.$('#hud-money').textContent = '¥' + s.player.money;
    U.$('#hud-ability').textContent = `${ab.icon || ''}${ab.name || ''} Lv${s.player.ability.level}`;
    const dc = U.$('#dm-count'); if (dc) dc.textContent = s.dmHistory.length;
    const nd = U.$('#news-dot'); if (nd) nd.style.display = s.flags.newsRead ? 'none' : '';

    const r = s.resources, g = D.goals;
    const setRes = (id, val, line) => {
      const el = U.$(id); el.textContent = line ? `${val}/${g[line]}` : val;
      const chip = el.parentElement;
      if (line) { chip.classList.toggle('met', val >= g[line]); chip.classList.toggle('low', val <= 1 && (line === 'water' || line === 'food')); }
    };
    setRes('#res-water', r.water, 'water');
    setRes('#res-food', r.food, 'food');
    setRes('#res-meds', r.meds, 'meds');
    setRes('#res-def', r.defense, 'defense');
    U.$('#res-space').textContent = `${s.space.used}/${s.space.max}`;

    const evWrap = U.$('#today-events');
    const evs = (s._todayEvents || []);
    if (evs.length) {
      evWrap.innerHTML = evs.map(id => { const e = D.events.find(x => x.id === id); return `<button class="event-chip" data-id="${id}">📰 ${e.title} ▸ 处理</button>`; }).join('');
      evWrap.querySelectorAll('.event-chip').forEach(b => b.onclick = () => Game.openTodayEvent(b.dataset.id));
      evWrap.style.display = '';
    } else { evWrap.innerHTML = ''; evWrap.style.display = 'none'; }

    U.$$('.action-btn').forEach(b => b.classList.toggle('disabled', s.ap <= 0 && b.dataset.act !== 'next'));

    U.$('#log-list').innerHTML = s.log.slice(0, 30)
      .map(l => `<div class="log-item log-${l.type}"><span class="log-day">D${l.day}</span> ${U.esc(l.text)}</div>`).join('');
  };

  /* ============ 绑定 ============ */
  Game.bindActions = function () {
    U.$$('.action-btn').forEach(b => {
      b.onclick = () => {
        const act = b.dataset.act;
        if (act === 'work') Game.actWork();
        else if (act === 'goout') Game.actGoOut();
        else if (act === 'offline') Game.openShop('offline');
        else if (act === 'online') Game.openShop('online');
        else if (act === 'next') Game.nextDay();
      };
    });
    const dm = U.$('#btn-danmaku'); if (dm) dm.onclick = () => Game.openDanmakuPanel();
    const nw = U.$('#btn-news'); if (nw) nw.onclick = () => Game.openNews();
    ['#btn-save-game', '#btn-save-story', '#btn-save-title'].forEach(sel => {
      const el = U.$(sel); if (el) el.onclick = () => Game.openSaveLoad();
    });
  };

})();
