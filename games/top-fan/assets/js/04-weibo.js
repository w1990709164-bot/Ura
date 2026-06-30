/* ============================================================
 * 微博 App —— 本作灵魂
 *  广场：男主各自「定位」的博文 + 路人粉 + 你的营业博，刷得起来
 *  超话：男主超话等级榜 = 暗恋值可视化，看着他一级级沦陷
 *  热搜：你的词条 / CP / 黑热搜（触发压力）
 * ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const U = TF.util;
  const W = (TF.weibo = {});

  /* 已「出场」的男主（wave <= 当前轮）——但你还不知道他们是谁 */
  TF.activeLeads = function () {
    const s = TF.state;
    return TF.LEADS.filter(l => s.leads[l.id] && s.leads[l.id].entered);
  };

  /* 超话等级：由暗恋值换算（Lv1~Lv10） */
  TF.superLevel = function (love) { return U.clamp(Math.floor(love / 10) + 1, 1, 10); };

  /* ---------- 刷新广场信息流（每次公演后调用）---------- */
  W.refreshFeed = function () {
    const s = TF.state;
    const feed = [];
    // 男主博文：按定位投放（出场越久/暗恋越深，越活跃）
    TF.activeLeads().forEach(l => {
      const ld = s.leads[l.id];
      const post = U.pick(l.posts);
      const likeBase = 200 + ld.love * 60 + U.randInt(0, 400);
      feed.push({
        leadId: l.id, handle: l.handle, color: l.color, text: post,
        likes: Math.round(likeBase * (l.job.includes('数据') || l.job.includes('氪金') ? 1.4 : 1)),
        lv: TF.superLevel(ld.love), t: U.randInt(1, 40),
      });
    });
    // 路人粉氛围博
    const npcCount = U.randInt(4, 6);
    for (let i = 0; i < npcCount; i++) {
      feed.push({
        leadId: null, handle: U.pick(TF.NPC_NAMES), color: '#b9a7c9',
        text: U.pick([
          '今天的' + (s.player.name || '她') + '也好可爱，原地结婚！',
          '入坑一周，已经无法自拔了😭',
          '求这个舞台的高清资源谢谢！',
          '打投打投，姐妹们冲鸭！',
          '她笑起来真的会发光诶',
          '路人来报道，被颜值劝留了',
        ]),
        likes: U.randInt(20, 300), t: U.randInt(1, 48),
      });
    }
    feed.sort((a, b) => (a.t - b.t) || (b.likes - a.likes));
    s.weibo.feed = feed;
  };

  /* ---------- 刷新热搜 ---------- */
  W.refreshHot = function () {
    const s = TF.state, p = s.player;
    const hot = [];
    const nm = p.name || '练习生';
    if (s.lastStage) {
      if (s.lastStage.tier === 'perfect') hot.push({ tag: nm + ' 神仙舞台', heat: U.randInt(80, 160), type: 'good' });
      if (s.lastStage.tier === 'flub') hot.push({ tag: nm + ' 公演失误', heat: U.randInt(40, 90), type: 'bad' });
    }
    hot.push({ tag: nm + ' 直拍', heat: U.randInt(30, 120), type: 'good' });
    if (TF.LEAD_BY_ID.horangi && s.leads.horangi && s.leads.horangi.entered)
      hot.push({ tag: nm + ' CP 超甜', heat: U.randInt(25, 70), type: 'cp' });
    // 黑热搜（带来压力）
    if (U.chance(0.35) && p.stress < 90) {
      hot.push({ tag: nm + ' 划水实锤?', heat: U.randInt(20, 60), type: 'bad' });
    }
    hot.sort((a, b) => b.heat - a.heat);
    s.weibo.hot = hot;
  };

  /* ---------- 渲染：广场 ---------- */
  W.renderFeed = function () {
    const s = TF.state;
    const mine = (s.weibo.myPosts || []).slice(0, 2).map(m => `
      <div class="wb-card wb-mine">
        <div class="wb-head"><div class="wb-ava" style="background:#ff6fae">我</div>
          <div class="wb-meta"><b>${U.esc(s.player.name || '我')}</b><span>刚刚 · 营业</span></div></div>
        <div class="wb-text">${U.esc(m.text)}</div>
        <div class="wb-foot">❤️ ${U.fmt(m.likes || 0)} · 🔁 ${U.fmt((m.likes || 0) / 4)}</div>
      </div>`).join('');

    const cards = (s.weibo.feed || []).map(it => {
      const ld = it.leadId ? s.leads[it.leadId] : null;
      const known = ld && ld.met;
      const lead = it.leadId ? TF.LEAD_BY_ID[it.leadId] : null;
      const tag = lead ? `<span class="wb-tag" style="border-color:${lead.color};color:${lead.color}">${lead.job}</span>` : '';
      const name = known ? `${U.esc(lead.name)} <span class="wb-real">（${it.handle}）</span>` : U.esc(it.handle);
      const lv = lead ? `<span class="wb-lv">超话 Lv.${it.lv}</span>` : '';
      return `<div class="wb-card${lead ? ' wb-lead' : ''}" ${lead ? `data-lead="${lead.id}"` : ''}>
        <div class="wb-head">
          <div class="wb-ava" style="background:${it.color}">${U.esc((known ? lead.name : it.handle).slice(0, 1))}</div>
          <div class="wb-meta"><b>${name}</b><span>${it.t}分钟前 ${lv}</span></div>
          ${tag}
        </div>
        <div class="wb-text">${U.esc(it.text)}</div>
        <div class="wb-foot">❤️ ${U.fmt(it.likes)} · 🔁 ${U.fmt(it.likes / 5)} · 💬 ${U.fmt(it.likes / 8)}</div>
      </div>`;
    }).join('');
    return mine + (cards || '<div class="wb-empty">还没有动态，先去公演让大家看到你吧。</div>');
  };

  /* ---------- 渲染：超话等级榜（暗恋值可视化）---------- */
  W.renderSuper = function () {
    const s = TF.state;
    const list = TF.activeLeads().map(l => ({ l, ld: s.leads[l.id] }))
      .sort((a, b) => b.ld.love - a.ld.love);
    if (!list.length) return '<div class="wb-empty">你的超话还很冷清……随着你被更多人看见，神仙粉会陆续出现。</div>';
    const rows = list.map((x, i) => {
      const lv = TF.superLevel(x.ld.love);
      const pct = Math.round(x.ld.love / TF.LOVE_MAX * 100);
      const known = x.ld.met;
      const rankBadge = i === 0 ? '👑' : `#${i + 1}`;
      return `<div class="st-row" data-lead="${x.l.id}">
        <div class="st-rank">${rankBadge}</div>
        <div class="st-ava" style="background:${x.l.color}">${U.esc((known ? x.l.name : x.l.handle).slice(0, 1))}</div>
        <div class="st-main">
          <div class="st-name">${known ? U.esc(x.l.name) + ' <span class="wb-real">' + U.esc(x.l.handle) + '</span>' : U.esc(x.l.handle)}
            <span class="st-job">${x.l.job}</span></div>
          <div class="st-bar"><div class="st-fill" style="width:${pct}%;background:${x.l.color}"></div></div>
        </div>
        <div class="st-lv">Lv.<b>${lv}</b></div>
      </div>`;
    }).join('');
    return `<div class="st-hint">铁粉榜 · 等级越高，他在你身上花的心思越多——只是你还不知道那是什么。</div>${rows}`;
  };

  /* ---------- 渲染：热搜 ---------- */
  W.renderHot = function () {
    const s = TF.state;
    if (!s.weibo.hot || !s.weibo.hot.length) return '<div class="wb-empty">暂无热搜。</div>';
    return s.weibo.hot.map((h, i) => `
      <div class="hot-row hot-${h.type}">
        <span class="hot-no">${i + 1}</span>
        <span class="hot-tag">${U.esc(h.tag)}</span>
        <span class="hot-heat">🔥${U.fmt(h.heat * 1000)}</span>
        ${h.type === 'bad' ? '<span class="hot-flag">荐</span>' : ''}
      </div>`).join('');
  };

})();
