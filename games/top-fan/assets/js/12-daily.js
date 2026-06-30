/* ============================================================
 * 第二阶段 · 出道日常 —— 通告驱动 + 破屏②线下相遇
 *  · 接通告：综艺 / 演唱会 / 见面会 / 影视 / 商务…
 *  · 每个通告 = 小剧情 + 奖励 + 男主线下相遇契机
 *  · 线下通告（演出/综艺/影视/见面会）= 破屏②，大兵走到你面前
 * ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const U = TF.util;
  const D = (TF.daily = {});

  /* ---------- 通告库 ---------- */
  TF.TONGGAO = [
    { id: 'run', type: '综艺', icon: '🏃', name: '户外竞技真人秀《奔跑吧》', stat: 'stamina', energy: 2, offline: true, desc: '体力大考验，搞笑名场面圈路人', rewards: { fame: 15000, fans: 8000, repute: 8, money: 30 } },
    { id: 'slow', type: '综艺', icon: '🏡', name: '慢综艺《向往的生活》', stat: 'charm', energy: 2, offline: true, desc: '露真性情，治愈系深度圈粉', rewards: { fame: 9000, fans: 6000, repute: 14, money: 20 } },
    { id: 'cp', type: '综艺', icon: '💞', name: '恋综观察《心动信号》', stat: 'charm', energy: 1, offline: false, special: 'jealous', desc: '撮 CP，男主吃醋点引爆', rewards: { fame: 13000, fans: 9000, repute: -2, money: 25 } },
    { id: 'concert', type: '演出', icon: '🎤', name: '个人巡演首场', stat: 'vocal', energy: 3, offline: true, desc: '万人大型舞台，应援现场相遇', rewards: { fame: 26000, fans: 15000, repute: 10, money: 60 } },
    { id: 'fanmeet', type: '演出', icon: '🤝', name: '粉丝见面会', stat: 'charm', energy: 2, offline: true, desc: '近距离接触，签售返图，破屏好时机', rewards: { fame: 9000, fans: 7000, repute: 12, money: 25 } },
    { id: 'film', type: '影视', icon: '🎬', name: '战争电影邀约', stat: 'visual', energy: 3, offline: true, special: 'film', desc: '桥接影星线，军事顾问随行', rewards: { fame: 20000, fans: 7000, repute: 12, money: 80 } },
    { id: 'ad', type: '商务', icon: '💄', name: '品牌代言拍摄', stat: 'visual', energy: 1, offline: false, desc: '恰饭，商业价值 up', rewards: { fame: 5000, fans: 3000, repute: 4, money: 100 } },
    { id: 'mag', type: '商务', icon: '📸', name: '时尚杂志封面', stat: 'visual', energy: 1, offline: false, desc: '封面颜值暴击', rewards: { fame: 8000, fans: 4000, repute: 8, money: 50 } },
    { id: 'group', type: '团综', icon: '👯', name: '成团团综录制', stat: 'charm', energy: 1, offline: false, desc: '和团员日常，团粉狂喜', rewards: { fame: 6000, fans: 5000, repute: 6, money: 15 } },
    { id: 'sale', type: '商务', icon: '🛒', name: '直播带货', stat: 'charm', energy: 1, offline: false, desc: '赚钱第一，路人观望', rewards: { fame: 3000, fans: 2000, repute: -2, money: 120 } },
    { id: 'award', type: '盛典', icon: '🏆', name: '年度颁奖礼', stat: 'charm', energy: 2, offline: true, desc: '红毯 + 领奖，星光熠熠', rewards: { fame: 18000, fans: 8000, repute: 12, money: 40 } },
  ];

  D.maxEnergy = function () { return 4 + Math.floor(TF.state.player.stats.stamina / 8); };

  D.enter = function () {
    const s = TF.state;
    if (!s.daily) s.daily = { week: 1, energy: D.maxEnergy(), offers: [], done: 0 };
    if (!s.daily.offers.length) s.daily.offers = genOffers();
    TF.save();
    TF.screens.go('daily');
    D.render();
  };

  function genOffers() {
    const pool = TF.TONGGAO.slice().sort(() => Math.random() - 0.5);
    const picks = [];
    // 保证每周至少有一个线下通告（破屏②的机会）
    const live = pool.find(t => t.offline); if (live) picks.push(live);
    pool.forEach(t => { if (picks.length < 4 && !picks.includes(t)) picks.push(t); });
    return picks.map(t => ({ id: t.id, taken: false }));
  }

  /* ---------- 渲染日常主屏 ---------- */
  D.render = function () {
    const s = TF.state, p = s.player, d = s.daily;
    TF.screens.go('daily');
    U.$('#daily-week').textContent = `出道第 ${d.week} 周`;
    U.$('#daily-status').innerHTML = [
      chip('🔥 人气', U.fmt(p.votes)), chip('👥 粉丝', U.fmt(p.followers)),
      chip('💗 路人缘', p.repute), chip('💰 商务', p.money + '万'),
      chip('⚡ 体力', d.energy + '/' + D.maxEnergy()), chip('😣 压力', p.stress),
    ].join('');

    const offers = d.offers.map(o => {
      const t = TF.TONGGAO.find(x => x.id === o.id);
      const can = !o.taken && d.energy >= t.energy;
      return `<div class="tg-card ${o.taken ? 'taken' : ''}" ${can ? `data-offer="${o.id}"` : ''}>
        <div class="tg-ic">${t.icon}</div>
        <div class="tg-main">
          <div class="tg-name">${U.esc(t.name)} <span class="tg-type">${t.type}</span></div>
          <div class="tg-desc">${U.esc(t.desc)}</div>
          <div class="tg-rew">⚡${t.energy} · 主项${TF.STAT_LABELS[t.stat]} · 🔥${U.fmt(t.rewards.fame)} 👥${U.fmt(t.rewards.fans)} 💗${t.rewards.repute >= 0 ? '+' : ''}${t.rewards.repute}${t.rewards.money ? ' 💰' + t.rewards.money + '万' : ''}</div>
        </div>
        ${o.taken ? '<span class="tg-done">已完成</span>' : t.offline ? '<span class="tg-live">线下</span>' : ''}
      </div>`;
    }).join('');
    U.$('#daily-offers').innerHTML = offers || '<div class="wb-empty">本周通告都接完了，推进到下一周吧。</div>';
    U.$$('#daily-offers [data-offer]').forEach(el => el.onclick = () => D.accept(el.dataset.offer));
    U.$('#daily-advance').textContent = `🌙 推进到下一周（休整）→`;
  };

  function chip(label, val) { return `<span class="ds-chip"><span>${label}</span><b>${val}</b></span>`; }

  /* ---------- 接通告 ---------- */
  D.accept = function (id) {
    const s = TF.state, d = s.daily;
    const o = d.offers.find(x => x.id === id);
    const t = TF.TONGGAO.find(x => x.id === id);
    if (!o || o.taken) return;
    if (d.energy < t.energy) { TF.ui.toast('体力不够，先推进到下周休整。'); return; }
    d.energy -= t.energy;
    o.taken = true; d.done++;
    runOffer(t);
  };

  function runOffer(t) {
    const s = TF.state, p = s.player;
    // 表现 roll：相关属性 + 路人缘
    const st = p.stats[t.stat] || 0;
    const mult = U.clamp(0.7 + st / 30 + (p.repute / 100) * 0.3 + U.randInt(-10, 12) / 100, 0.5, 1.6);
    const r = t.rewards;
    const fame = Math.round((r.fame || 0) * mult), fans = Math.round((r.fans || 0) * mult);
    p.votes += fame; p.followers += fans;
    p.repute = U.clamp(p.repute + (r.repute || 0), 0, 100);
    p.money += (r.money || 0);
    p.stress = U.clamp(p.stress + 6, 0, 100);

    const tierTxt = mult >= 1.3 ? '名场面！' : mult >= 0.95 ? '完成度不错' : '差强人意';
    let body = `<p class="modal-sub">${U.esc(t.name)} —— ${tierTxt}</p>
      <div class="ev-delta">
        <span class="dchip d-up">人气 +${U.fmt(fame)}</span>
        <span class="dchip d-up">粉丝 +${U.fmt(fans)}</span>
        ${r.repute ? `<span class="dchip ${r.repute >= 0 ? 'd-up' : 'd-down'}">路人缘 ${r.repute >= 0 ? '+' : ''}${r.repute}</span>` : ''}
        ${r.money ? `<span class="dchip d-up">商务 +${r.money}万</span>` : ''}
      </div>`;

    // 破屏②：线下相遇
    let meet = '';
    if (t.offline) meet = offlineEncounter(t);
    else if (t.special === 'jealous') meet = jealousBeat();
    if (meet) body += meet;

    TF.weibo.refreshFeed();
    TF.save();
    TF.ui.modal(`${t.icon} ${t.type}通告`, body, () => D.render());
  }

  /* ---------- 破屏②：单人线下相遇 ---------- */
  function offlineEncounter(t) {
    const s = TF.state;
    const cand = TF.activeLeads().map(l => ({ l, ld: s.leads[l.id] }))
      .filter(x => x.ld.met && !x.ld.offline && x.ld.love >= 35)
      .sort((a, b) => b.ld.love - a.ld.love)[0];
    if (!cand) return '';
    const l = cand.l, ld = cand.ld;
    ld.offline = true; ld.love = U.clamp(ld.love + 14, 0, TF.LOVE_MAX);
    TF.log(`💞 线下相遇：你和 ${l.name} 终于面对面了。`, 'love');
    return `<div class="ev-break" style="margin-top:14px">
      💞 <b style="color:${l.color}">线下相遇</b><br>${OFFLINE_SCENE[l.id] || `散场后，${l.name}走到你面前，那个隔了一整季的人，终于站在了你能触到的距离。`}</div>`;
  }

  /* ---------- 恋综：男主吃醋 ---------- */
  function jealousBeat() {
    const s = TF.state;
    const jealous = ['soap', 'gaz', 'graves', 'nikto', 'krueger']
      .map(id => TF.LEAD_BY_ID[id]).filter(l => s.leads[l.id] && s.leads[l.id].entered);
    if (!jealous.length) return '';
    const l = U.pick(jealous);
    s.leads[l.id].love = U.clamp(s.leads[l.id].love + 3, 0, TF.LOVE_MAX);
    const lines = {
      soap: '"她和那个男嘉宾牵手了？？"——苏格兰打手在超话原地爆炸。',
      gaz: '永远在线的那个，今晚的在线时长破了纪录，置顶却一个字没改。',
      graves: '"那档恋综的赞助商，我撤了。"——暗影资本冷冷甩下一句。',
      nikto: '和你配对的男嘉宾的黑历史，一夜之间被扒了个底朝天。没有人知道是谁干的。',
      krueger: '"演得真像啊。"——无罪点评阴阳怪气，转头把那期重看了五遍。',
    };
    return `<div class="ev-intervene" style="margin-top:14px;border-color:${l.color}">
      🍋 ${lines[l.id] || `${l.handle} 的醋意，藏不住了。`}</div>`;
  }

  /* ---------- 推进一周 ---------- */
  D.advanceWeek = function () {
    const s = TF.state, d = s.daily;
    d.week++;
    d.energy = D.maxEnergy();
    d.offers = genOffers();
    s.player.stress = U.clamp(s.player.stress - 16, 0, 100);   // 休整减压
    // 男主被动升温
    TF.activeLeads().forEach(l => { s.leads[l.id].love = U.clamp(s.leads[l.id].love + 2, 0, TF.LOVE_MAX); });
    TF.weibo.refreshFeed(); TF.weibo.refreshHot();
    // 日常也可能撞危机（红人多是非）
    if (U.chance(0.4)) {
      const pool = TF.events.CARDS.filter(c => c.cat === 'scandal' || c.cat === 'surprise');
      TF.events.open(U.pick(pool));
      return;
    }
    TF.save();
    D.render();
    TF.ui.toast(`出道第 ${d.week} 周 · 体力已恢复`);
  };

  /* ---------- 破屏②线下相遇 · 各男主的"真身现形"剧本 ---------- */
  const OFFLINE_SCENE = {
    ghost: '后台，一个高大的身影摘下面罩，把你眼熟的那台长焦相机递过来：“图，以后我当面给你拍。”——传说级站哥，原来是他。',
    soap: '应援区嗓门最大那个冲到台前，又突然脸红结巴：“我、我就是来看看现场效果……”',
    gaz: '“别熬夜了。”散场时有人把热饮塞进你手里，是那个永远在线的版主，本人比头像还暖。',
    konig: '一个魁梧的影子局促地递来一只手工娃娃，缝得比上次更精致：“……欢迎你，看到本人，我更紧张了。”',
    keegan: '人群骚动时一只手稳稳护住你，等你站定，那个沉默的路透担只低声说了句“安全第一”，便退回阴影里。',
    graves: '一辆低调好车在后台等你，车窗降下：“合作愉快，明星小姐。销量我还包着。”',
    zimo: '签售桌对面坐下一个含笑的人，递来一张亲手画的 Q 版你：“喏，正主版。本人比画上好看。”',
    horangi: '“那些 CP 小作文……其实我写的时候，脑子里只有你一个。”写手红着耳朵承认了。',
    merrick: '应援方阵的指挥摘下帽子向你立正：“现场组组长，幸会。灯牌每一排，都是为你排的。”',
    hesh: '“你成长的每一帧我都剪过。”一个青年把硬盘递给你，“这次，想亲眼看你发光。”',
    logan: '那个从不说话的搬运工站在最后排，只对你比了个口型——“一直都在。”',
    price: '所有人身后那个统筹一切的“老板”终于出现，递来一份完整的应援档案：“这一季，我带着他们，把你送到了这里。”',
    nikto: '“……没有人会伤害你。”一个戴面具的人在通道尽头说完这句，转身消失，但你知道他一直都在。',
    krueger: '“嘴上嫌你，是怕别人发现我有多上头。”辱追本人别扭地承认，耳根通红。',
    kick: '“数据后台那个异常完播率……是我反复看你。”技术宅红着脸把笔记本一合，“现在，想看本人。”',
  };

})();
