/* ============================================================
 * 游戏主逻辑 —— 屏幕管理 / 捏人 / 训练 Hub / 回合推进 / 出道
 * ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const U = TF.util;

  /* ---------- 屏幕管理 ---------- */
  TF.screens = {
    go(name) {
      TF.state.screen = name;
      U.$$('.screen').forEach(s => s.classList.remove('active'));
      const el = U.$('#screen-' + name);
      if (el) el.classList.add('active');
      if (name === 'hub') TF.hub.render();
    },
  };

  /* ---------- UI 工具 ---------- */
  TF.ui = {
    toast(msg) {
      let t = U.$('#toast');
      if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show');
      clearTimeout(TF.ui._tt); TF.ui._tt = setTimeout(() => t.classList.remove('show'), 2600);
    },
    modal(title, html, onOk) {
      const root = U.$('#modal-root');
      root.innerHTML = `<div class="modal-mask"><div class="modal-box">
        <div class="modal-h">${title}</div><div class="modal-c">${html}</div>
        <div class="modal-f"><button class="btn btn-primary" id="modal-ok">好</button></div></div></div>`;
      U.$('#modal-ok').onclick = () => { root.innerHTML = ''; if (onOk) onOk(); };
    },
  };

  /* ---------- 捏人（身份 + 属性分配）---------- */
  const create = { stats: { vocal: 0, dance: 0, rap: 0, visual: 0, stamina: 0, charm: 0 }, identity: 'idol' };

  TF.game = {
    startCreate() {
      create.stats = { vocal: 0, dance: 0, rap: 0, visual: 0, stamina: 0, charm: 0 };
      create.identity = 'idol';
      TF.screens.go('create');
      renderIdentity();
      renderAlloc();
    },

    confirmCreate() {
      const name = U.$('#cr-name').value.trim();
      if (!name) { TF.ui.toast('给自己起个艺名吧'); return; }
      if (allocLeft() !== 0) { TF.ui.toast('还有属性点没分配完'); return; }
      const s = TF.newState();
      s.identity = create.identity;
      s.player.name = name;
      s.player.age = parseInt(U.$('#cr-age').value, 10) || 18;
      s.player.fanclub = U.$('#cr-fanclub').value.trim() || (name + '后援会');
      s.player.supertopic = U.$('#cr-super').value.trim() || name;
      s.player.stats = Object.assign({}, create.stats);
      TF.state = s;
      TF.events.initRival();
      // 第 1 周准备
      TF.train.weeklyReset();
      TF.weibo.refreshFeed(); TF.weibo.refreshHot();
      TF.save();
      TF.screens.go('hub');
      TF.ui.modal('🎬 出道倒计时', `
        <p>欢迎来到《创造之夜》训练营，练习生 <b>${U.esc(name)}</b>。</p>
        <p>从海选到成团出道，一共 <b>6 场公演</b>。靠舞台、靠人设、靠粉丝打投，杀进出道位。</p>
        <p class="modal-sub">每周先训练，再上台。记得刷刷微博——你的超话里，正悄悄聚起一群不简单的人。</p>`);
    },

    toStage() {
      if (TF.state.player.sick) { TF.ui.toast('你还病着，硬上台会很惨…要不先休养？'); }
      TF.stage.run();
    },

    afterResult() {
      const s = TF.state;
      if (s.round >= TF.FINAL_ROUND) { TF.game.debut(); return; }
      s.round++;
      TF.train.weeklyReset();
      // 本周开场：可能撞上黑料 / 撕番 / 黑幕
      if (TF.events.weekStart()) return;     // 触发了事件，事件结算后再回 hub
      TF.screens.go('hub');
      TF.ui.toast(`第 ${s.round} 周训练期开始（行动点 ${s.ap}）`);
    },

    afterEvent() {
      TF.screens.go('hub');
      TF.ui.toast(`第 ${TF.state.round} 周训练期开始（行动点 ${TF.state.ap}）`);
    },

    debut() {
      const s = TF.state, p = s.player;
      s.debuted = true; s.phase = 'post';
      const success = p.rankClass === 'A' || p.rankClass === 'B' || p.rankNo <= 11;
      const topLead = TF.activeLeads().map(l => ({ l, love: s.leads[l.id].love }))
        .sort((a, b) => b.love - a.love)[0];
      TF.save();
      TF.screens.go('result');
      U.$('#result-body').innerHTML = `
        <div class="rk-tier tier-${success ? 'perfect' : 'great'}">${success ? '🎉 出道成功' : '差一点点'}</div>
        <div class="debut-box">
          ${success
            ? `<p>成团之夜，灯光打在你脸上。主持人念出你的名字——<b>${U.esc(p.name)}，出道位！</b></p>`
            : `<p>你止步于出道位边缘（第 ${p.rankNo} 名）。镜头扫过你强忍的笑，弹幕里全是不舍。</p>`}
          <p class="modal-sub">最终班级 ${p.rankClass} · ${U.fmt(p.votes)} 票 · 微博粉丝 ${U.fmt(p.followers)}</p>
          ${topLead ? `<p class="debut-lead">而那个超话等级永远第一的人——<b style="color:${topLead.l.color}">${s.leads[topLead.l.id].met ? topLead.l.name : topLead.l.handle}</b>，把整季的票都默默投给了你。</p>` : ''}
          <p class="debut-next">🎖️ 出道后的日常正在路上：综艺、演唱会、军旅慰问……<br>那时，潜伏在你票数里的人，会一个个走到你面前。<span class="muted">（第二阶段开发中）</span></p>
        </div>`;
      U.$('#result-next').textContent = '回到训练营（自由练习）→';
    },
  };

  /* ---------- 渲染：身份选择 ---------- */
  function renderIdentity() {
    U.$('#identity-grid').innerHTML = TF.IDENTITIES.map(it => `
      <div class="id-card ${it.id === create.identity ? 'on' : ''} ${it.playable ? '' : 'soon'}" data-id="${it.id}">
        <div class="id-name">${it.name}${it.playable ? '' : '<span class="soon-tag">敬请期待</span>'}</div>
        <div class="id-desc">${it.desc}</div>
      </div>`).join('');
    U.$$('#identity-grid .id-card').forEach(c => c.onclick = () => {
      const it = TF.IDENTITIES.find(x => x.id === c.dataset.id);
      if (!it.playable) { TF.ui.toast(it.name + '线还在路上，先玩爱豆吧~'); return; }
      create.identity = it.id; renderIdentity();
    });
  }

  /* ---------- 渲染：属性分配 ---------- */
  function allocLeft() { return TF.STAT_POINTS - U.sum(TF.STAT_KEYS.map(k => create.stats[k])); }
  function renderAlloc() {
    U.$('#alloc-left').textContent = allocLeft();
    U.$('#alloc-grid').innerHTML = TF.STAT_KEYS.map(k => `
      <div class="al-row">
        <span class="al-name">${TF.STAT_LABELS[k]}</span>
        <button class="al-btn" data-k="${k}" data-d="-1">−</button>
        <span class="al-val" id="al-${k}">${create.stats[k]}</span>
        <button class="al-btn" data-k="${k}" data-d="1">＋</button>
        <div class="al-bar"><div class="al-fill" style="width:${create.stats[k] / 15 * 100}%"></div></div>
      </div>`).join('');
    U.$$('#alloc-grid .al-btn').forEach(b => b.onclick = () => {
      const k = b.dataset.k, d = parseInt(b.dataset.d, 10);
      const nv = create.stats[k] + d;
      if (nv < 0 || nv > 15) return;
      if (d > 0 && allocLeft() <= 0) { TF.ui.toast('点数分完了'); return; }
      create.stats[k] = nv; renderAlloc();
    });
    U.$('#cr-start').disabled = false;
  }

  /* ---------- 训练 Hub ---------- */
  TF.hub = {
    render() {
      const s = TF.state, p = s.player;
      const round = TF.ROUNDS[s.round - 1] || TF.ROUNDS[0];
      // 顶栏
      U.$('#hub-round').textContent = `第${s.round}/${TF.FINAL_ROUND}场 · ${round.name}`;
      U.$('#hub-class').innerHTML = `<b class="cls-${p.rankClass}">${p.rankClass}</b>班`;
      U.$('#hub-rank').textContent = p.rankNo <= 60 ? `#${p.rankNo}` : '未上榜';
      U.$('#hub-fans').textContent = '👥 ' + U.fmt(p.followers);
      U.$('#hub-repute').textContent = '💗 ' + p.repute;
      U.$('#hub-ap').textContent = '⚡' + s.ap;
      // 压力条
      const sp = U.$('#hub-stress-fill'); sp.style.width = p.stress + '%';
      sp.className = 'stress-fill' + (p.stress >= 80 ? ' high' : p.stress >= 50 ? ' mid' : '');
      U.$('#hub-stress-val').textContent = p.stress + (p.sick ? ' 🤒' : '');
      // 属性
      U.$('#hub-stats').innerHTML = TF.STAT_KEYS.map(k =>
        `<div class="hs-chip"><span>${TF.STAT_LABELS[k]}</span><b>${p.stats[k]}</b></div>`).join('');
      // 训练动作
      U.$('#hub-actions').innerHTML = TF.train.ACTIONS.map(a => `
        <button class="tr-btn ${a.id === 'rest' ? 'rest' : a.id === 'biz' ? 'biz' : ''}" data-act="${a.id}" ${TF.train.canAct() ? '' : 'disabled'}>
          <span class="tr-i">${a.icon}</span><span class="tr-n">${a.name}</span><span class="tr-d">${a.desc}</span>
        </button>`).join('');
      U.$$('#hub-actions .tr-btn').forEach(b => b.onclick = () => {
        const r = TF.train.doAction(b.dataset.act);
        if (!r.ok) { TF.ui.toast(r.msg || '不行'); return; }
        if (r.msg) TF.ui.toast(r.msg);
        if (r.sickMsg) TF.ui.modal('🤒 病倒了', `<p>${r.sickMsg}</p>`);
        TF.hub.render();
      });
      // 日志
      U.$('#hub-log').innerHTML = s.logs.slice(0, 6).map(l =>
        `<div class="log-item log-${l.type}">${U.esc(l.text)}</div>`).join('') || '<div class="log-item muted">（暂无动态）</div>';
      // 公演按钮
      U.$('#hub-stage-btn').textContent = `🎬 上台公演 · 第${s.round}场（${round.name}）`;
    },
  };

})();
