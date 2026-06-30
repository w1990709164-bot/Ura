/* ============================================================
 * 赛制环节 —— 备战（抢歌 / 组队 / 抢定位）+ 训练直播 + 路演打歌
 *  · 备战：公演前的战略步骤，名次越高越能先挑好歌好位
 *  · 训练直播：弹幕系统轻量复用，不计分，专涨暗恋值/圈粉
 *  · 路演：线下宣传刷路人缘，铺垫破屏②线下相遇
 * ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const U = TF.util;

  /* ---------- 选曲池 ---------- */
  TF.SONGS = [
    { id: 'fire', name: '《野火》', stat: 'dance', hot: 90, mul: 1.35, diff: '高' },
    { id: 'siren', name: '《海妖》', stat: 'vocal', hot: 80, mul: 1.28, diff: '高' },
    { id: 'boom', name: '《BOOM》', stat: 'rap', hot: 70, mul: 1.22, diff: '中' },
    { id: 'star', name: '《星轨》', stat: 'charm', hot: 55, mul: 1.15, diff: '中' },
    { id: 'candy', name: '《糖果雨》', stat: 'charm', hot: 40, mul: 1.08, diff: '低' },
    { id: 'echo', name: '《回声》', stat: 'vocal', hot: 30, mul: 1.0, diff: '低' },
  ];

  TF.POS_PICK = [
    { id: 'center', name: '抢 Center', mul: 1.3, stress: 14, note: '最高曝光，但有撕番风险' },
    { id: 'main', name: '主唱 / 主舞位', mul: 1.15, stress: 8, note: '稳健高光' },
    { id: 'normal', name: '普通位', mul: 1.0, stress: 2, note: '低压求稳' },
  ];

  /* ====================== 备战 ====================== */
  const PREP = (TF.prep = {});
  let draft = null;   // 当前备战草稿 {song,pos,team}

  PREP.open = function () {
    const s = TF.state;
    draft = { song: null, pos: null, team: s.round === 3 ? null : 'solo' };
    TF.screens.go('prep');
    render();
  };

  function maxHot() {
    const r = TF.state.player.rankNo;
    if (r <= 10) return 100; if (r <= 25) return 78; if (r <= 40) return 58; return 45;
  }

  function songOptions() {
    // 每场固定抽 4 首（按 round 取不同切片，保证多样）
    const start = ((TF.state.round - 1) * 2) % TF.SONGS.length;
    const pool = [];
    for (let i = 0; i < 4; i++) pool.push(TF.SONGS[(start + i) % TF.SONGS.length]);
    return pool;
  }

  function render() {
    const s = TF.state;
    const round = TF.ROUNDS[s.round - 1] || TF.ROUNDS[0];
    U.$('#prep-title').textContent = `第${s.round}场备战 · ${round.name}`;
    const cap = maxHot();

    // 抢歌
    const songs = songOptions().map(sg => {
      const locked = sg.hot > cap;
      const on = draft.song && draft.song.id === sg.id;
      return `<div class="prep-opt song ${on ? 'on' : ''} ${locked ? 'locked' : ''}" ${locked ? '' : `data-song="${sg.id}"`}>
        <div class="po-main"><b>${sg.name}</b><span class="po-sub">主项 ${TF.STAT_LABELS[sg.stat]} · 难度${sg.diff} · 票加成 ×${sg.mul}</span></div>
        ${locked ? '<span class="po-lock">🔒 被高位选走</span>' : `<span class="po-hot">🔥${sg.hot}</span>`}
      </div>`;
    }).join('');

    // 组队（仅 round 3）
    let teamHtml = '';
    if (s.round === 3) {
      const teams = [
        { id: 'ally', name: '拉盟友同队', mul: 1.12, note: '实力互补，氛围好' },
        { id: 'rival', name: `和劲敌 ${s.rival.name || '对家'} 同队`, mul: 1.18, note: '强强联手，但火药味重（+压力/结梁子）' },
        { id: 'newbie', name: '带新人同队', mul: 1.0, note: '被夸有担当，圈路人缘' },
      ];
      teamHtml = `<div class="prep-h">② 组队</div>` + teams.map(t =>
        `<div class="prep-opt ${draft.team === t.id ? 'on' : ''}" data-team="${t.id}">
          <div class="po-main"><b>${U.esc(t.name)}</b><span class="po-sub">${t.note}</span></div>
          <span class="po-hot">×${t.mul}</span></div>`).join('');
    }

    // 抢定位
    const posHtml = TF.POS_PICK.map(p =>
      `<div class="prep-opt ${draft.pos === p.id ? 'on' : ''}" data-pos="${p.id}">
        <div class="po-main"><b>${p.name}</b><span class="po-sub">${p.note}</span></div>
        <span class="po-hot">票 ×${p.mul}</span></div>`).join('');

    U.$('#prep-body').innerHTML = `
      <div class="prep-tip">名次越高，越能先挑热门歌和好位置。当前 <b>#${s.player.rankNo}</b> 名 → 可选热度 ≤ ${cap}。</div>
      <div class="prep-h">① 抢歌选曲</div>${songs}
      ${teamHtml}
      <div class="prep-h">${s.round === 3 ? '③' : '②'} 抢定位</div>${posHtml}`;

    bind();
    const ready = draft.song && draft.pos && (s.round !== 3 || draft.team);
    U.$('#prep-go').disabled = !ready;
  }

  function bind() {
    U.$$('#prep-body [data-song]').forEach(el => el.onclick = () => { draft.song = TF.SONGS.find(x => x.id === el.dataset.song); render(); });
    U.$$('#prep-body [data-team]').forEach(el => el.onclick = () => { draft.team = el.dataset.team; render(); });
    U.$$('#prep-body [data-pos]').forEach(el => el.onclick = () => { draft.pos = el.dataset.pos; render(); });
  }

  PREP.go = function () {
    const s = TF.state;
    if (!draft.song || !draft.pos) return;
    const pos = TF.POS_PICK.find(p => p.id === draft.pos);
    let teamMul = 1, stressAdd = pos.stress, statKey = draft.song.stat;
    if (draft.team === 'ally') teamMul = 1.12;
    else if (draft.team === 'rival') { teamMul = 1.18; stressAdd += 10; s.rival.grudge += 1; }
    else if (draft.team === 'newbie') { teamMul = 1.0; s.player.repute = U.clamp(s.player.repute + 6, 0, 100); }
    s.prep = {
      songName: draft.song.name, statKey,
      voteMul: draft.song.mul * pos.mul * teamMul,
      stressAdd, posId: draft.pos,
    };
    TF.stage.run();
  };

  /* ====================== 训练直播 / 路演 ====================== */
  const LIVE = (TF.live = {});

  LIVE.run = async function (kind) {
    const s = TF.state;
    if (s.ap <= 0 || s.player.sick) { TF.ui.toast(s.player.sick ? '病着呢，歇会儿。' : '行动点用完了。'); return; }
    s.ap--;
    if (kind === 'roadshow') return LIVE.roadshow();
    return LIVE.liveStream();
  };

  // 训练直播：弹幕刷屏 + 翻牌回应一条
  LIVE.liveStream = async function () {
    const s = TF.state;
    TF.danmaku.init(); TF.danmaku.show(); TF.danmaku.clear();
    const leads = TF.activeLeads();
    let dm = [];
    leads.forEach(l => { if (U.chance(0.9)) dm.push({ id: l.handle, text: U.pick(l.danmu), leadColor: l.color }); });
    dm = dm.concat(TF.NPC_DANMU.slice().sort(() => Math.random() - 0.5).slice(0, 5).map(t => ({ id: U.pick(TF.NPC_NAMES), text: t })));
    dm.sort(() => Math.random() - 0.5);
    TF.danmaku.burst(dm, 500);

    // 翻牌：挑 3 条男主弹幕让玩家回应
    const picks = leads.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    await new Promise(r => setTimeout(r, 1400));
    const html = picks.length
      ? picks.map((l, i) => `<button class="live-pick" data-i="${i}" style="border-color:${l.color}">
          <b style="color:${l.color}">${s.leads[l.id].met ? l.name : l.handle}</b><span>${U.esc(U.pick(l.danmu))}</span></button>`).join('')
      : '<p class="modal-sub">还没什么人来看你的直播……先去公演让更多人看到你吧。</p>';
    TF.ui.modal('📺 训练室直播中', `<p class="modal-sub">弹幕飘过你眼前。翻牌回应一条，拉近和那个 ID 的距离：</p><div class="live-picks">${html}</div>`, () => {
      TF.danmaku.hide(); finishLive(null);
    });
    // 覆盖默认 ok：拦截翻牌点击
    setTimeout(() => {
      U.$$('#modal-root .live-pick').forEach(b => b.onclick = () => {
        const l = picks[parseInt(b.dataset.i, 10)];
        U.$('#modal-root').innerHTML = '';
        TF.danmaku.hide();
        finishLive(l);
      });
    }, 0);
  };

  function finishLive(lead) {
    const s = TF.state, p = s.player;
    const fans = U.randInt(600, 1800);
    p.followers += fans;
    p.stress = U.clamp(p.stress + 3, 0, 100);
    TF.activeLeads().forEach(l => { s.leads[l.id].love = U.clamp(s.leads[l.id].love + 1, 0, TF.LOVE_MAX); });
    if (lead) {
      const ld = s.leads[lead.id];
      ld.love = U.clamp(ld.love + 4, 0, TF.LOVE_MAX);
      TF.log(`你在直播里回应了「${ld.met ? lead.name : lead.handle}」的弹幕，对方的超话热度涨了一截。`, 'love');
      TF.ui.toast(`回应了 ${ld.met ? lead.name : lead.handle}，涨粉 +${U.fmt(fans)}`);
    } else {
      TF.ui.toast(`直播结束，涨粉 +${U.fmt(fans)}`);
    }
    TF.weibo.refreshFeed(); TF.save();
    TF.hub.render();
  }

  // 路演 / 打歌现场：刷路人缘 + 概率线下偶遇（破屏②铺垫）
  LIVE.roadshow = function () {
    const s = TF.state, p = s.player;
    const rep = U.randInt(5, 11), fans = U.randInt(1000, 3000);
    p.repute = U.clamp(p.repute + rep, 0, 100);
    p.followers += fans;
    p.stress = U.clamp(p.stress + 7, 0, 100);
    // 线下偶遇：暗恋值最高的在场男主，缘分擦肩（铺垫破屏②线下相遇）
    let extra = '';
    const cand = TF.activeLeads().map(l => ({ l, ld: s.leads[l.id] })).sort((a, b) => b.ld.love - a.ld.love)[0];
    if (cand && cand.ld.love >= 25 && U.chance(0.6)) {
      const l = cand.l;
      cand.ld.love = U.clamp(cand.ld.love + 3, 0, TF.LOVE_MAX);
      const scene = roadshowEncounter(l);
      extra = `线下偶遇：${scene}`;
      TF.log(`路演现场，${cand.ld.met ? l.name : l.handle} 的身影一闪而过——${scene}`, 'love');
    }
    TF.weibo.refreshFeed(); TF.save();
    TF.ui.modal('🚐 路演 / 打歌现场', `
      <p>你跑了一天线下打歌、街头宣传，嗓子哑了，但路人缘实打实涨了。</p>
      <div class="ev-delta"><span class="dchip d-up">路人缘 +${rep}</span><span class="dchip d-up">粉丝 +${U.fmt(fans)}</span><span class="dchip d-down">压力 +7</span></div>
      ${extra ? `<p class="modal-sub" style="margin-top:10px">${extra}</p>` : ''}`, () => TF.hub.render());
  };

  function roadshowEncounter(l) {
    const m = {
      ghost: '人群最后排，一台长焦镜头正对着你，你回头时他已没入人海。',
      keegan: '你差点被挤倒，一只手稳稳扶了你一下，等你站定，那人已经退到了安全距离外盯着四周。',
      konig: '散场后你的应援桌上多了一只手工娃娃，体温还没散，做的人却不见了。',
      soap: '有个嗓门特别大的应援喊得最卖力，你循声望去，他立刻别过了脸。',
      graves: '一辆低调的好车在场边停了很久，车窗降下一条缝，又升了上去。',
      nikto: '想堵你的代拍莫名其妙都散了，你没看见是谁清的场。',
    };
    return m[l.id] || '有个熟悉的身影在你看过去的瞬间转身离开，只留下一点说不清的在意。';
  }

})();
