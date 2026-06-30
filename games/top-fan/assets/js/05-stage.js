/* ============================================================
 * 公演舞台 —— Roll 点 / 直播弹幕 / 导师评级 / 排行榜 / 男主隐藏加成
 * ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const U = TF.util;
  const S = (TF.stage = {});

  const TIER_CN = { perfect: '完美', great: '优秀', flub: '出糗' };

  /* 男主隐藏加成：暗恋越深，他在票数/数据上替你出的力越多 */
  TF.leadBoost = function () {
    let boost = 0;
    TF.activeLeads().forEach(l => {
      const ld = TF.state.leads[l.id];
      let w = 1;
      if (l.job.includes('数据') || l.job.includes('氪金')) w = 2.2;   // 打投/销量直接变现成票
      else if (l.job.includes('控评') || l.job.includes('反黑')) w = 1.3;
      boost += ld.love * w * 90;
    });
    return Math.round(boost);
  };

  /* 计算本场结果（先算，再让弹幕/叙事呼应档次）*/
  S.compute = function () {
    const s = TF.state, p = s.player;
    const round = TF.ROUNDS[s.round - 1] || TF.ROUNDS[0];
    const st = p.stats;
    const prep = s.prep || null;
    // 备战抢到的歌决定本场主项
    const mainKey = (prep && prep.statKey) || round.mainStat;
    // 表演分：主项权重高 + 魅力托底 - 压力拖累 + 随机
    let score = st[mainKey] * 2.2 + st.charm * 1.1 + st.visual * 0.6 + st.vocal * 0.3 + st.dance * 0.3
      - (p.stress / 100) * 14 + U.randInt(-6, 8);
    if (p.sick) score -= 18;
    score = Math.max(0, Math.round(score));

    // Roll 点（受分数加权，但保留翻车/封神的随机）
    const r = U.roll(20) + Math.round(score / 6);
    let tier = 'great';
    if (r >= 22 || (score > 40 && r >= 18)) tier = 'perfect';
    else if (r <= 9 || p.sick) tier = 'flub';

    // 班级
    let rankClass = 'C';
    const band = score + (tier === 'perfect' ? 14 : tier === 'flub' ? -12 : 0);
    if (band >= 46) rankClass = 'A'; else if (band >= 34) rankClass = 'B';
    else if (band >= 22) rankClass = 'C'; else if (band >= 12) rankClass = 'D'; else rankClass = 'F';

    // 担当：抢到 Center 则锁 Center，否则最高属性项
    let position;
    if (prep && prep.posId === 'center') position = TF.POSITIONS.charm;
    else {
      const cand = ['vocal', 'dance', 'rap', 'visual', 'charm'];
      let best = cand[0];
      cand.forEach(k => { if (st[k] > st[best]) best = k; });
      position = TF.POSITIONS[best] || 'All-rounder';
    }

    // 票数
    const tierVote = tier === 'perfect' ? 1.7 : tier === 'flub' ? 0.55 : 1.0;
    // 路人缘影响路人盘：口碑好则基础票更高（0.6~1.3 倍）
    const repFactor = 0.6 + (p.repute / 100) * 0.7;
    const prepMul = prep && prep.voteMul ? prep.voteMul : 1;   // 抢歌/定位/组队加成
    const baseVote = Math.round((score * 1400 + 8000) * tierVote * repFactor);
    const fanVote = Math.round(p.followers * 1.2);
    const leadVote = TF.leadBoost();
    const addVotes = Math.round((baseVote + fanVote + leadVote + U.randInt(0, 5000)) * prepMul);

    return { tier, score, rankClass, position, baseVote, fanVote, leadVote, addVotes, round, songName: prep && prep.songName };
  };

  /* 生成排行榜（你 + 前后名次的对手）*/
  S.makeBoard = function (totalVotes) {
    const s = TF.state;
    // 名次：票越多越靠前；用一条简单曲线模拟整体盘子
    const field = 60 - s.round * 6;            // 随赛程淘汰，盘子变小
    let rankNo = U.clamp(Math.round(field - totalVotes / 26000), 1, Math.max(1, field));
    s.player.rankNo = rankNo;
    const gap = () => U.randInt(800, 9000);
    const aheadName = U.pick(TF.RIVAL_NAMES), behindName = U.pick(TF.RIVAL_NAMES);
    return {
      rankNo,
      ahead: rankNo > 1 ? { name: aheadName, gap: gap() } : null,
      behind: { name: behindName, gap: gap() },
      total: totalVotes,
    };
  };

  /* 让男主暗恋值成长 & 新一波出场 */
  S.advanceLeads = function () {
    const s = TF.state;
    // 本轮 wave 的男主出场
    TF.LEADS.filter(l => l.wave === s.round).forEach(l => {
      if (!s.leads[l.id]) s.leads[l.id] = { love: 4, entered: false, met: false, offline: false };
      if (!s.leads[l.id].entered) {
        s.leads[l.id].entered = true;
        s.leads[l.id]._justEntered = true;
      }
    });
    // 已出场的全部涨暗恋值（表演越好涨得越多）
    const gain = s.lastStage ? (s.lastStage.tier === 'perfect' ? 9 : s.lastStage.tier === 'flub' ? 3 : 6) : 5;
    TF.activeLeads().forEach(l => {
      const ld = s.leads[l.id];
      if (ld._justEntered) return;            // 刚出场的这轮不额外涨
      ld.love = U.clamp(ld.love + gain + U.randInt(0, 3), 0, TF.LOVE_MAX);
    });
  };

  /* ====== 直播演出流程 ====== */
  S.run = async function () {
    const s = TF.state;
    const result = S.compute();
    s._pendingResult = result;
    const round = result.round;
    const mainCN = TF.STAT_LABELS[(s.prep && s.prep.statKey) || round.mainStat];

    TF.screens.go('stage');
    const scroll = U.$('#stage-narrative');
    scroll.innerHTML = '';
    const songTxt = result.songName ? ` · ${result.songName}` : '';
    U.$('#stage-title').textContent = `第${s.round}次公演 · ${round.name}`;
    U.$('#stage-sub').textContent = `🔴 直播中${songTxt} · 主项【${mainCN}】`;
    U.$('#stage-next').style.display = 'none';

    TF.danmaku.init(); TF.danmaku.show(); TF.danmaku.clear();

    // 叙事：先放占位，再尝试 AI 润色
    const tierCN = TIER_CN[result.tier];
    addPara(scroll, `灯光亮起。轮到你了。`);
    let narrative = '';
    if (TF.api.isReady()) {
      narrative = await TF.api.genStageNarrative({ name: s.player.name || '你', tierCN, mainCN, theme: round.theme });
    }
    if (!narrative) narrative = fallbackNarrative(result.tier, mainCN);
    // 逐段显示
    const paras = narrative.split(/\n+/).filter(Boolean);
    for (let i = 0; i < paras.length; i++) {
      await wait(700);
      addPara(scroll, paras[i]);
    }

    // 弹幕：男主定位口吻 + 路人，混着飞
    let dm = [];
    TF.activeLeads().forEach(l => {
      if (U.chance(0.85)) dm.push({ id: l.handle, text: U.pick(l.danmu), leadColor: l.color });
    });
    const npc = (TF.NPC_DANMU.slice().sort(() => Math.random() - 0.5)).slice(0, 6)
      .map(t => ({ id: U.pick(TF.NPC_NAMES), text: t }));
    if (result.tier === 'perfect') npc.push({ id: '激动的粉丝', text: '封神了！！！这就是C位' });
    if (result.tier === 'flub') npc.push({ id: '心疼粉', text: '没事的宝贝，下次一定' });
    dm = dm.concat(npc).sort(() => Math.random() - 0.5);
    if (TF.api.isReady()) {
      try { const ai = await TF.api.genDanmu({ tierCN, theme: round.theme }); dm = dm.concat(ai.map(d => ({ id: d.id, text: d.text }))); } catch (e) {}
    }
    TF.danmaku.burst(dm, 600);

    await wait(2200);
    addPara(scroll, `<span class="stage-tier tier-${result.tier}">表演评价：${tierCN}</span>`, true);
    U.$('#stage-next').style.display = 'block';
  };

  /* 结算并进入成绩屏 */
  S.finish = function () {
    const s = TF.state;
    const result = s._pendingResult;
    const p = s.player;
    TF.danmaku.hide();

    // 应用属性 / 状态变化
    p.rankClass = result.rankClass;
    p.position = result.position;
    p.votes += result.addVotes;
    p.followers += Math.round(result.addVotes / 12 * (result.tier === 'perfect' ? 1.6 : result.tier === 'flub' ? 0.6 : 1));
    if (result.tier === 'perfect') p.stress = U.clamp(p.stress - 10, 0, 100);
    else if (result.tier === 'flub') p.stress = U.clamp(p.stress + 18, 0, 100);
    else p.stress = U.clamp(p.stress + 6, 0, 100);
    // 备战（抢 Center / 和劲敌同队）带来的额外压力
    if (s.prep && s.prep.stressAdd) p.stress = U.clamp(p.stress + s.prep.stressAdd, 0, 100);
    s.prep = null;

    const board = S.makeBoard(p.votes);
    s.lastStage = { tier: result.tier, rankClass: result.rankClass, position: result.position,
      addVotes: result.addVotes, leadVote: result.leadVote, board };

    // 男主成长 / 新出场
    S.advanceLeads();
    TF.weibo.refreshFeed(); TF.weibo.refreshHot();

    TF.log(`第${s.round}次公演：${TIER_CN[result.tier]}，${result.rankClass}班，第${board.rankNo}名`, result.tier === 'flub' ? 'bad' : 'good');
    renderResult(result, board);
    TF.save();
  };

  /* ---------- 成绩屏渲染 ---------- */
  function renderResult(result, board) {
    const s = TF.state, p = s.player;
    TF.screens.go('result');
    const mentor = U.pick(TF.MENTOR_LINES[result.tier]);
    const newLeads = TF.LEADS.filter(l => l.wave === s.round && s.leads[l.id] && s.leads[l.id]._justEntered);
    newLeads.forEach(l => { delete s.leads[l.id]._justEntered; });

    const boardHtml = `
      <div class="rk-board">
        ${board.ahead ? `<div class="rk-row rk-other"><span>#${board.rankNo - 1}</span><b>${U.esc(board.ahead.name)}</b><i>领先你 ${U.fmt(board.ahead.gap)} 票</i></div>` : ''}
        <div class="rk-row rk-me"><span>#${board.rankNo}</span><b>${U.esc(p.name || '你')}</b><i>${U.fmt(board.total)} 票</i></div>
        <div class="rk-row rk-other"><span>#${board.rankNo + 1}</span><b>${U.esc(board.behind.name)}</b><i>落后你 ${U.fmt(board.behind.gap)} 票</i></div>
      </div>`;

    const leadHint = result.leadVote > 0
      ? `<div class="rk-leadboost">📈 本场有 <b>${U.fmt(result.leadVote)}</b> 票来路不明——某些「神仙数据粉」又在替你拼命，可你还不知道他们是谁。</div>` : '';

    const newHtml = newLeads.length ? `
      <div class="rk-new">
        <div class="rk-new-h">✨ 你的超话里，出现了新的身影</div>
        ${newLeads.map(l => `<div class="rk-new-row"><span class="rk-new-ava" style="background:${l.color}">${U.esc(l.handle.slice(0,1))}</span>
          <div><b style="color:${l.color}">${U.esc(l.handle)}</b><i>${l.job} · ${l.attach}</i></div></div>`).join('')}
      </div>` : '';

    U.$('#result-body').innerHTML = `
      <div class="rk-tier tier-${result.tier}">${TIER_CN[result.tier]}</div>
      <div class="rk-grades">
        <div class="rk-grade"><span>评级</span><b class="cls-${result.rankClass}">${result.rankClass} 班</b></div>
        <div class="rk-grade"><span>担当</span><b>${result.position}</b></div>
        <div class="rk-grade"><span>名次</span><b>第 ${board.rankNo} 名</b></div>
      </div>
      <div class="rk-mentor">🎤 导师点评：「${U.esc(mentor)}」</div>
      ${boardHtml}
      ${leadHint}
      ${newHtml}
    `;

    const isFinal = s.round >= TF.FINAL_ROUND;
    const btn = U.$('#result-next');
    btn.textContent = isFinal ? '🎉 成团出道夜，见分晓 →' : '回到训练期 →';
  }

  /* ---------- 工具 ---------- */
  function addPara(el, html, raw) {
    const d = document.createElement('div');
    d.className = 'stage-para';
    d.innerHTML = raw ? html : U.esc(html);
    el.appendChild(d);
    el.scrollTop = el.scrollHeight;
  }
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function fallbackNarrative(tier, mainCN) {
    if (tier === 'perfect') return `音乐起，你像换了个人。\n每一个${mainCN}的节点都精准砸在鼓点上，眼神扫过镜头的瞬间，弹幕炸了。\n最后一个定格，全场安静了半秒，然后是山呼海啸。`;
    if (tier === 'flub') return `前奏响起，你的心跳比鼓点还快。\n一个转身慢了半拍，${mainCN}的部分气息没跟上，你看见导师皱了下眉。\n你硬撑着笑到最后，可你知道，今天没发挥好。`;
    return `灯光打在你身上。\n你稳稳地走完了整套${mainCN}，完成度很高，几个记忆点都立住了。\n台下有人喊你的名字，你笑了。`;
  }

})();
