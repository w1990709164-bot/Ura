/* ============================================================
 * 手机 App 壳 —— 微博 / 通告 / 粉丝群 / 短信私聊
 *  · 微博：广场 / 超话 / 热搜（见 04-weibo.js）
 *  · 破屏①：超话里暗恋值够高时「认出」男主 → 解锁私信
 *  · 通告：出道后日常（本阶段留接口）
 * ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const U = TF.util;
  const P = (TF.phone = {});

  P.app = 'weibo';
  P.tab = 'feed';        // 微博子页：feed | super | hot
  P.dmLead = null;       // 当前私信对象

  P.MET_THRESHOLD = 45;  // 暗恋值达到即可「破屏」认出

  P.open = function (app) {
    P.app = app || 'weibo';
    U.$('#phone').classList.add('show');
    P.render();
  };
  P.close = function () { U.$('#phone').classList.remove('show'); P.dmLead = null; };

  P.switchApp = function (app) { P.app = app; P.dmLead = null; P.render(); };
  P.switchTab = function (tab) { P.tab = tab; P.render(); };

  P.render = function () {
    const dock = `
      <div class="ph-dock">
        ${dockBtn('weibo', '🌐', '微博')}
        ${dockBtn('group', '👥', '粉丝群')}
        ${dockBtn('sms', '💬', '私信', P.unreadDM())}
        ${dockBtn('tonggao', '📅', '通告')}
      </div>`;
    let body = '';
    if (P.app === 'weibo') body = weiboApp();
    else if (P.app === 'group') body = groupApp();
    else if (P.app === 'sms') body = P.dmLead ? dmThread(P.dmLead) : smsList();
    else if (P.app === 'tonggao') body = tonggaoApp();

    U.$('#phone-screen').innerHTML = `
      <div class="ph-status"><span>${nowClock()}</span><span>📶 🔋 ${P.app === 'weibo' ? '微博' : P.app === 'group' ? P.fanclubName() : P.app === 'sms' ? '私信' : '通告'}</span></div>
      <div class="ph-body">${body}</div>
      ${dock}`;
    bind();
  };

  /* ---------- 微博 ---------- */
  function weiboApp() {
    const tabs = `
      <div class="ph-tabs">
        ${tabBtn('feed', '广场')}${tabBtn('super', '超话')}${tabBtn('hot', '热搜')}
      </div>`;
    let inner = '';
    if (P.tab === 'feed') inner = TF.weibo.renderFeed();
    else if (P.tab === 'super') inner = `<div class="ph-st-head">${U.esc(TF.state.player.supertopic || '我')}超话</div>` + TF.weibo.renderSuper();
    else inner = `<div class="ph-st-head">微博热搜</div>` + TF.weibo.renderHot();
    return tabs + `<div class="ph-scroll">${inner}</div>`;
  }

  /* ---------- 粉丝群 ---------- */
  function groupApp() {
    const s = TF.state;
    const leads = TF.activeLeads();
    if (!leads.length) return `<div class="ph-scroll"><div class="wb-empty">粉丝群还很安静，等你被更多人看见。</div></div>`;
    const msgs = [];
    leads.forEach(l => { (l.group || []).forEach(g => msgs.push({ l, text: g })); });
    msgs.sort(() => Math.random() - 0.5);
    const rows = msgs.slice(0, 14).map(m => {
      const known = s.leads[m.l.id].met;
      const who = known ? m.l.name : m.l.handle;
      return `<div class="gc-row"><span class="gc-ava" style="background:${m.l.color}">${U.esc(who.slice(0,1))}</span>
        <div class="gc-bubble"><b style="color:${m.l.color}">${U.esc(who)}</b><span>${U.esc(m.text)}</span></div></div>`;
    }).join('');
    return `<div class="ph-st-head">${U.esc(P.fanclubName())} · ${leads.length}位活跃</div>
      <div class="ph-scroll gc-scroll">${rows}<div class="gc-hint">…他们好像彼此都认识，配合得像一支训练有素的队伍。</div></div>`;
  }

  /* ---------- 私信列表 ---------- */
  function smsList() {
    const s = TF.state;
    const met = TF.activeLeads().filter(l => s.leads[l.id].met);
    if (!met.length) return `<div class="ph-scroll"><div class="wb-empty">还没有人能私信你。<br>去「超话」里多看看那些为你拼命的 ID——也许你会认出谁。</div></div>`;
    const rows = met.map(l => {
      const dm = s.weibo.dms[l.id] || [];
      const last = dm.length ? dm[dm.length - 1].text : '（私信已开启）';
      return `<div class="sms-row" data-dm="${l.id}">
        <span class="sms-ava" style="background:${l.color}">${U.esc(l.name.slice(0,1))}</span>
        <div class="sms-meta"><b>${U.esc(l.name)} <span class="wb-real">${U.esc(l.handle)}</span></b><span>${U.esc(last).slice(0,18)}</span></div></div>`;
    }).join('');
    return `<div class="ph-st-head">私信</div><div class="ph-scroll">${rows}</div>`;
  }

  function dmThread(leadId) {
    const s = TF.state, l = TF.LEAD_BY_ID[leadId];
    const dm = s.weibo.dms[leadId] || [];
    const bubbles = dm.map(m => `<div class="dm-line ${m.from === 'me' ? 'dm-me' : 'dm-ta'}">
      <div class="dm-bubble">${U.esc(m.text)}</div></div>`).join('') ||
      `<div class="dm-sys">你认出了「${U.esc(l.handle)}」就是 ${U.esc(l.name)}。给他发条消息吧。</div>`;
    return `<div class="dm-head"><span class="dm-back" data-back="1">←</span>
        <b style="color:${l.color}">${U.esc(l.name)}</b><i>${l.job} · ${l.attach}</i></div>
      <div class="ph-scroll dm-scroll" id="dm-scroll">${bubbles}</div>
      <div class="dm-input-row">
        <input id="dm-input" class="dm-input" placeholder="发消息…" autocomplete="off">
        <button class="dm-send" id="dm-send">发送</button></div>`;
  }

  /* ---------- 通告（出道后日常·接口）---------- */
  function tonggaoApp() {
    const debuted = TF.state.debuted;
    if (!debuted) {
      return `<div class="ph-scroll"><div class="tg-locked">
        <div class="tg-lock-i">📅</div>
        <div class="tg-lock-t">通告 · 出道后解锁</div>
        <div class="tg-lock-d">成团出道后，这里会弹来各种邀约——<br>综艺、演唱会、见面会、影视……<br>那时，潜伏在你票数里的人，将一个个走到你面前。</div>
      </div></div>`;
    }
    const d = TF.state.daily;
    return `<div class="ph-scroll"><div class="wb-empty">📅 出道第 ${d ? d.week : 1} 周<br>本周通告在主界面接取（综艺 / 演出 / 影视 / 商务…）。<br>关掉手机，去挑通告吧。</div></div>`;
  }

  /* ---------- 交互绑定 ---------- */
  function bind() {
    U.$$('#phone .ph-dock-btn').forEach(b => b.onclick = () => P.switchApp(b.dataset.app));
    U.$$('#phone .ph-tab').forEach(b => b.onclick = () => P.switchTab(b.dataset.tab));
    // 超话 / 广场点男主 → 破屏或私信
    U.$$('#phone [data-lead]').forEach(el => el.onclick = () => onLeadClick(el.dataset.lead));
    // 私信列表
    U.$$('#phone .sms-row').forEach(el => el.onclick = () => { P.dmLead = el.dataset.dm; P.render(); });
    const back = U.$('#phone [data-back]'); if (back) back.onclick = () => { P.dmLead = null; P.render(); };
    const send = U.$('#dm-send'); if (send) send.onclick = sendDM;
    const inp = U.$('#dm-input'); if (inp) inp.onkeydown = e => { if (e.key === 'Enter') sendDM(); };
    const sc = U.$('#dm-scroll'); if (sc) sc.scrollTop = sc.scrollHeight;
  }

  function onLeadClick(id) {
    const s = TF.state, ld = s.leads[id], l = TF.LEAD_BY_ID[id];
    if (!ld) return;
    if (ld.met) { P.app = 'sms'; P.dmLead = id; P.render(); return; }
    if (ld.love >= P.MET_THRESHOLD) {
      breakScreen(l);
    } else {
      TF.ui.toast(`「${l.handle}」超话 Lv.${TF.superLevel(ld.love)} —— 你总觉得这个 ID 有点眼熟，但还认不出来。`);
    }
  }

  /* 破屏① —— 认出男主，解锁私信 */
  function breakScreen(l) {
    const s = TF.state;
    s.leads[l.id].met = true;
    s.weibo.dms[l.id] = s.weibo.dms[l.id] || [];
    TF.log(`💥 破屏：你认出了「${l.handle}」，原来是 ${l.name}。`, 'love');
    TF.ui.modal(`💥 破屏`, `
      <p>你盯着那个熟悉的 ID 看了很久。</p>
      <p>那些神图、那些数据、那些深夜还亮着的关注——<br><b style="color:${l.color}">「${U.esc(l.handle)}」，原来是 ${U.esc(l.name)}。</b></p>
      <p class="modal-sub">他是 ${TF.FACTIONS[l.faction] || ''} 的人，本该在战场上，却把心思全花在了你的超话里。</p>
      <p class="modal-sub">私信已解锁——你可以和他说话了。</p>`, () => { P.app = 'sms'; P.dmLead = l.id; P.render(); });
    TF.save();
  }

  async function sendDM() {
    const inp = U.$('#dm-input'); if (!inp) return;
    const text = inp.value.trim(); if (!text) return;
    const s = TF.state, id = P.dmLead, l = TF.LEAD_BY_ID[id];
    s.weibo.dms[id] = s.weibo.dms[id] || [];
    s.weibo.dms[id].push({ from: 'me', text });
    s.leads[id].love = U.clamp(s.leads[id].love + 1, 0, TF.LOVE_MAX);
    inp.value = '';
    P.render();
    // 回复
    s.weibo.dms[id].push({ from: 'ta', text: '…', typing: true });
    P.render();
    let reply = '';
    if (TF.api.isReady()) {
      const hist = s.weibo.dms[id].filter(m => !m.typing).map(m => ({ role: m.from === 'me' ? 'user' : 'assistant', content: m.text }));
      try { reply = await TF.api.chatWithLead(l, hist, s.player.name || '你'); } catch (e) {}
    }
    if (!reply) reply = U.pick(fallbackReply(l));
    s.weibo.dms[id] = s.weibo.dms[id].filter(m => !m.typing);
    s.weibo.dms[id].push({ from: 'ta', text: reply });
    TF.save();
    P.render();
  }

  function fallbackReply(l) {
    const map = {
      ghost: ['…图我已经修好了，发你超话了。', '别看我，看镜头。', '（沉默了一会儿）……今天也拍到了。'],
      krueger: ['哼，今天总算没跳得像抽搐。', '别误会，我只是路过点评。', '谁要是敢黑你——轮不到他们。'],
      soap: ['在！谁惹你了？我去对线！', '你一句话，我能跟整个超话吵起来。', '别怕，有我在。'],
      konig: ['……那个，娃娃，你喜欢吗。', '我不太会说话……对不起。', '你让我觉得，我也能更好。'],
      graves: ['钱不是问题，你想要什么。', '销量我兜着，你只管发光。', '别累着，账单我来。'],
    };
    return map[l.id] || ['…嗯。', '我在。', '看到你的消息了。'];
  }

  /* ---------- 小工具 ---------- */
  P.fanclubName = function () { return TF.state.player.fanclub || '后援会'; };
  P.unreadDM = function () { return 0; };
  function dockBtn(app, icon, label, dot) {
    return `<div class="ph-dock-btn ${P.app === app ? 'on' : ''}" data-app="${app}">
      <span class="ph-dock-i">${icon}</span><span>${label}</span></div>`;
  }
  function tabBtn(tab, label) { return `<div class="ph-tab ${P.tab === tab ? 'on' : ''}" data-tab="${tab}">${label}</div>`; }
  function nowClock() { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }

})();
