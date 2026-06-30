/* ============================================================
 * 事件引擎 —— 公关危机 / 黑料 / 公演撕番 / 节目组黑幕 / 劲敌恩怨
 *  · 轻量危机：选项制（带数值后果）
 *  · 重大危机(major)：选项 + AI 自由应对
 *  · 男主按暗恋值「介入缓冲」，护得越狠暗恋值越涨，可能当场破屏
 *  · 难度基调：有真风险——应对不当真掉粉/掉名次/压力暴涨
 * ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const U = TF.util;
  const E = (TF.events = {});

  /* 男主工种 → 公关保护权重 */
  const PROT_W = { nikto: 1.6, graves: 1.5, price: 1.4, soap: 1.3, kick: 1.0, gaz: 0.8, ghost: 0.5, merrick: 0.7 };

  E.initRival = function () {
    const s = TF.state;
    s.rival = { name: U.pick(TF.RIVAL_NAMES), grudge: 1, beat: 0 };
  };

  /* 当前男主保护力 + 头号护主 */
  E.protection = function () {
    const s = TF.state;
    let score = 0, top = null, topV = 0;
    TF.activeLeads().forEach(l => {
      const w = PROT_W[l.id] || 0.4;
      const v = s.leads[l.id].love * w;
      score += v;
      if (v > topV) { topV = v; top = l; }
    });
    return { score, top, factor: U.clamp(score / 220, 0, 0.72) };
  };

  /* ---------- 事件卡库 ---------- */
  E.CARDS = [
    {
      id: 'oldphoto', cat: 'scandal', title: '黑历史旧照被扒',
      narrative: '有人翻出你出道前的土味旧照和一段中二发言，#{name}黑历史# 冲上热搜，评论区开始阴阳。',
      choices: [
        { label: '大方自嘲，玩成梗', effects: { repute: 6, stress: 6, followers: 0.04 }, outcome: '你转发旧照配文"那时也很努力鸭"，路人缘不降反升。' },
        { label: '发声明严肃澄清', effects: { repute: -4, stress: 10, votes: -8000 }, outcome: '小题大做的声明反而被嘲"玻璃心"，话题又热了一轮。' },
        { label: '冷处理，不回应', effects: { repute: -8, stress: 4 }, outcome: '不回应被解读为默认，路人缘小掉。' },
      ],
    },
    {
      id: 'lazy', cat: 'scandal', title: '划水实锤质疑', weight: 1.2,
      narrative: '一段练习室路透里你看起来在偷懒，#{name}划水# 被对家粉做成长图疯传，业务能力被质疑。',
      choices: [
        { label: '放完整练习录像自证', effects: { repute: 10, stress: 12, votes: 6000 }, outcome: '完整录像里你练到深夜，质疑不攻自破，圈了一波事业粉。', risk: 'low' },
        { label: '硬刚对家"放屁"', effects: { repute: -10, stress: 14, grudge: 1 }, outcome: '对线升级成骂战，路人觉得你戾气重，梁子也结深了。', risk: 'high' },
        { label: '认错卖惨求理解', effects: { repute: -2, stress: 8, followers: 0.05 }, outcome: '"那天身体不舒服"的小作文圈了同情粉，但落了个软弱印象。' },
      ],
    },
    {
      id: 'chatleak', cat: 'scandal', major: true, title: '聊天记录截图疑似塌房',
      narrative: '一组真假难辨的聊天截图流出，暗示你私下"耍大牌、说队友坏话"，#{name}塌房# 屠榜，粉丝开始脱粉。这是一次重大公关危机。',
      choices: [
        { label: '逐条对峙证伪 + 报警', effects: { repute: 8, stress: 20, votes: -10000 }, outcome: '你拿出原始记录证明截图被伪造，硬核反杀，但元气大伤。', risk: 'mid' },
        { label: '低头道歉先止血', effects: { repute: -12, stress: 16, followers: -0.12 }, outcome: '道歉被当成默认，脱粉一片，名次受挫。', risk: 'high' },
      ],
    },
    {
      id: 'edit', cat: 'production', title: '节目组恶意剪辑',
      narrative: '本期正片把你剪成了"心机抢镜"的反派，镜头掐头去尾，#{name}人设崩# 上了热搜，你百口莫辩。',
      choices: [
        { label: '等粉丝放原片自证', effects: { repute: 4, stress: 10 }, outcome: '搬运担放出未剪原片，舆论慢慢反转——但伤害已经造成。', risk: 'low' },
        { label: '自己发长文撕节目组', effects: { repute: -6, stress: 16, votes: -12000 }, outcome: '得罪节目组，后续镜头更少了。粉丝心疼，路人看戏。', risk: 'high' },
        { label: '忍下来，用下场公演正名', effects: { repute: 2, stress: 14 }, outcome: '你把委屈咽下去，attde写进了下一支舞里。' },
      ],
    },
    {
      id: 'votefraud', cat: 'scandal', title: '票数造假质疑',
      narrative: '你名次涨得太快，#{name}数据造假# 被挂，有人质疑你买票。（其实是你那些神仙数据粉太猛了……）',
      choices: [
        { label: '让粉丝晒真实打投记录', effects: { repute: 6, stress: 8 }, outcome: '粉丝晒出整齐的打投流水，反手证明了"自来水"的恐怖，路人震惊。' },
        { label: '不回应，让数据说话', effects: { repute: -4, stress: 6 }, outcome: '沉默被解读心虚，但下场公演的票数又啪啪打脸。' },
      ],
    },
  ];

  /* ---------- 劲敌恩怨线（3 个递进节点）---------- */
  E.RIVAL_BEATS = [
    {
      title: '劲敌下战书', narrative: '同期最强竞争者 {rival} 在采访里阴阳你："有些人是靠数据，不是靠实力。" 矛头直指你。',
      choices: [
        { label: '舞台上见真章', effects: { stress: 8, repute: 4, grudge: 1 }, outcome: '你回一句"舞台见"，气场全开，路人开始期待你俩对打。' },
        { label: '场面话高情商化解', effects: { repute: 8, stress: 4 }, outcome: '"{rival}很厉害，我们互相学习"——大度人设立住了。' },
      ],
    },
    {
      title: '抢 C 位撕番', narrative: '组队公演，你和 {rival} 同组，C 位只有一个。队内气氛剑拔弩张。',
      choices: [
        { label: '争 C 位，凭实力拿', effects: { votes: 10000, stress: 16, repute: -4, grudge: 1 }, outcome: '你拿下了 C 位，舞台高光，但被部分人骂"番位脑"。', risk: 'mid' },
        { label: '让位，做团队润滑', effects: { repute: 12, stress: 6, votes: -4000 }, outcome: '你主动让 C，大局观圈粉，可惜少了个人镜头。' },
        { label: '提议公平battle定', effects: { repute: 6, stress: 10, votes: 4000 }, outcome: '一场即兴 battle 定 C 位，你赢得漂亮又服众。', risk: 'low' },
      ],
    },
    {
      title: '决赛终极对决', narrative: '出道夜前最后一战，你和 {rival} 被安排同台 solo battle，全网围观，一战定生死。',
      major: true,
      choices: [
        { label: '拿出压箱底，全力一搏', effects: { votes: 20000, stress: 22, repute: 10 }, outcome: '你把所有委屈和努力砸进这三分钟，全场起立——这一战封神。', risk: 'mid' },
        { label: '稳扎稳打不失误', effects: { votes: 8000, stress: 10, repute: 4 }, outcome: '你选择零失误的稳健路线，守住了基本盘。' },
      ],
    },
  ];

  /* ---------- 触发 ---------- */
  // 红了/压力高更容易招黑；返回是否触发了事件
  E.weekStart = function () {
    const s = TF.state;
    // 劲敌恩怨：在 2 / 3 / 5 场前各推进一节
    const beatRound = { 2: 0, 3: 1, 5: 2 };
    if (beatRound[s.round] != null && s.rival.beat <= beatRound[s.round]) {
      const beat = E.RIVAL_BEATS[beatRound[s.round]];
      if (beat) { s.rival.beat = beatRound[s.round] + 1; return E.open(rivalToEvent(beat)); }
    }
    // 黑料概率：名次越高、压力越大越容易
    const rankBoost = s.player.rankNo <= 20 ? 0.18 : 0;
    const stressBoost = s.player.stress >= 60 ? 0.15 : 0;
    const flubBoost = s.lastStage && s.lastStage.tier === 'flub' ? 0.12 : 0;
    const p = 0.25 + rankBoost + stressBoost + flubBoost;
    if (s.round >= 2 && U.chance(p)) {
      const pool = E.CARDS.filter(c => !c.major || s.round >= 3);
      return E.open(U.pick(pool));
    }
    return false;
  };

  function rivalToEvent(beat) {
    return { id: 'rival', cat: 'rival', title: beat.title, narrative: beat.narrative, major: !!beat.major, choices: beat.choices };
  }

  /* ---------- 打开事件屏 ---------- */
  E.open = function (card) {
    const s = TF.state;
    s.pendingEvent = card;
    TF.screens.go('event');
    E.render();
    return true;
  };

  E.render = function () {
    const s = TF.state, ev = s.pendingEvent;
    if (!ev) { TF.screens.go('hub'); return; }
    const sub = txt => txt.replace(/\{name\}/g, s.player.name || '你').replace(/\{rival\}/g, s.rival.name || '对家');
    const catCN = { scandal: '🔥 黑料危机', position: '⚔️ 公演撕番', production: '🎬 节目组黑幕', rival: '⚔️ 劲敌恩怨' }[ev.cat] || '突发';
    U.$('#event-cat').textContent = catCN;
    U.$('#event-cat').className = 'event-cat cat-' + ev.cat;
    U.$('#event-title').textContent = ev.title;
    U.$('#event-body').innerHTML = `<div class="event-narr">${U.esc(sub(ev.narrative))}</div>`;
    U.$('#event-choices').innerHTML = ev.choices.map((c, i) =>
      `<button class="ev-choice" data-i="${i}">${U.esc(c.label)}</button>`).join('');
    U.$$('#event-choices .ev-choice').forEach(b => b.onclick = () => E.choose(parseInt(b.dataset.i, 10)));
    // 重大危机：解锁自由应对
    const row = U.$('#event-free');
    if (ev.major) {
      row.style.display = '';
      U.$('#event-free-input').value = '';
      U.$('#event-free-send').onclick = E.freeRespond;
      U.$('#event-free-hint').textContent = TF.api.isReady() ? '或者，自己想词应对（AI 判定效果）：' : '（填了 API 才能自由应对，否则请选上面的选项）';
    } else row.style.display = 'none';
    U.$('#event-continue').style.display = 'none';
  };

  /* 选项应对 */
  E.choose = function (i) {
    const ev = TF.state.pendingEvent;
    const c = ev.choices[i];
    resolve(c.effects, c.outcome, c.risk);
  };

  /* 自由应对（AI 判定）*/
  E.freeRespond = async function () {
    const inp = U.$('#event-free-input'); const text = (inp.value || '').trim();
    if (!text) return;
    const ev = TF.state.pendingEvent;
    U.$('#event-free-send').disabled = true;
    U.$('#event-free-send').textContent = '舆论发酵中…';
    let quality = 'ok', outcome = '';
    if (TF.api.isReady()) {
      const sys = '你是选秀公关危机的舆论裁判。玩家面对一场危机，给出了自己的应对话术。' +
        '判断这套应对的公关效果，只输出 JSON：{"quality":"good|ok|bad","outcome":"一句话舆论结果(≤40字)"}。' +
        'good=高情商化解/反杀，ok=中规中矩，bad=火上浇油/翻车。';
      try {
        const r = await TF.api.callAI([{ role: 'user', content: `危机：${ev.narrative}\n我的应对：${text}` }], sys, 200, 0.8);
        const obj = JSON.parse((r.match(/\{[\s\S]*\}/) || ['{}'])[0]);
        if (obj.quality) quality = obj.quality;
        if (obj.outcome) outcome = obj.outcome;
      } catch (e) {}
    }
    const eff = quality === 'good' ? { repute: 12, stress: 8, votes: 8000, followers: 0.04 }
      : quality === 'bad' ? { repute: -14, stress: 18, votes: -12000, followers: -0.08 }
        : { repute: 2, stress: 10 };
    resolve(eff, outcome || (quality === 'good' ? '你这波应对漂亮，舆论反转。' : quality === 'bad' ? '应对翻车，火上浇油。' : '不功不过，风波渐平。'), quality === 'bad' ? 'high' : 'low');
    U.$('#event-free-send').disabled = false;
    U.$('#event-free-send').textContent = '发送应对';
  };

  /* ---------- 结算 ---------- */
  function resolve(effects, outcome, risk) {
    const s = TF.state, p = s.player;
    const prot = E.protection();
    // 男主缓冲：负面效果按保护力削减
    const mit = 1 - prot.factor;
    const fans = (effects.followers || 0);
    const fansApplied = fans < 0 ? fans * mit : fans;
    const votesApplied = (effects.votes || 0) < 0 ? Math.round((effects.votes || 0) * mit) : (effects.votes || 0);
    const reputeApplied = (effects.repute || 0) < 0 ? Math.round((effects.repute || 0) * mit) : (effects.repute || 0);

    p.followers = Math.max(0, Math.round(p.followers * (1 + fansApplied)));
    p.votes = Math.max(0, p.votes + votesApplied);
    p.repute = U.clamp(p.repute + reputeApplied, 0, 100);
    p.stress = U.clamp(p.stress + (effects.stress || 0), 0, 100);
    if (effects.grudge) s.rival.grudge += effects.grudge;

    // 男主介入叙事 + 暗恋值上涨 + 可能破屏
    let interveneHtml = '';
    const negative = (fans < 0 || (effects.votes || 0) < 0 || (effects.repute || 0) < 0);
    if (negative && prot.top && prot.score > 20) {
      const l = prot.top, ld = s.leads[l.id];
      ld.love = U.clamp(ld.love + 5, 0, TF.LOVE_MAX);
      interveneHtml = `<div class="ev-intervene" style="border-color:${l.color}">
        🛡️ <b style="color:${l.color}">${ld.met ? l.name : l.handle}</b>（${l.job}）替你挡了一刀——${E.interveneLine(l)}
        <span class="ev-love">超话热度 +</span></div>`;
      TF.log(`${ld.met ? l.name : l.handle} 在风波里护了你一把。`, 'love');
      // 高保护 + 未破屏 → 概率破屏
      if (!ld.met && ld.love >= 40 && U.chance(0.5)) {
        ld.met = true; s.weibo.dms[l.id] = s.weibo.dms[l.id] || [];
        interveneHtml += `<div class="ev-break">💥 混乱中你终于看清——「${U.esc(l.handle)}」原来是 <b style="color:${l.color}">${U.esc(l.name)}</b>。私信已解锁。</div>`;
        TF.log(`💥 破屏：危机中认出了 ${l.name}。`, 'love');
      }
    }

    // 黑料进微博热搜
    if (negative) s.weibo.hot = (s.weibo.hot || []);

    s.pendingEvent = null;
    TF.weibo.refreshFeed();
    TF.save();

    // 展示结算
    U.$('#event-choices').innerHTML = '';
    U.$('#event-free').style.display = 'none';
    U.$('#event-body').innerHTML = `
      <div class="event-narr">${U.esc(outcome)}</div>
      <div class="ev-delta">
        ${deltaChip('路人缘', reputeApplied)}
        ${deltaChip('压力', effects.stress || 0, true)}
        ${effects.votes ? deltaChip('票数', votesApplied) : ''}
        ${fans ? deltaChip('粉丝', Math.round(p.followers * fansApplied)) : ''}
      </div>
      ${interveneHtml}`;
    U.$('#event-continue').style.display = 'block';
  }

  E.interveneLine = function (l) {
    const m = {
      nikto: '造谣的号一夜查无此人。', soap: '冲进评论区把黑子怼到删评。',
      graves: '砸钱把黑热搜压了下去。', price: '一纸公关流程把舆论稳住。',
      kick: '数据反黑，把控评顶了上去。', gaz: '置顶安抚，稳住了脱粉潮。',
      ghost: '一张神图把话题带回了你的舞台。', merrick: '组织粉丝有序控评。',
    };
    return m[l.id] || '默默替你扛下了一切。';
  };

  function deltaChip(name, v, isStress) {
    if (!v) return '';
    const up = v > 0; const good = isStress ? !up : up;
    const val = Math.abs(v) >= 1000 ? TF.util.fmt(Math.abs(v)) : Math.abs(v);
    return `<span class="dchip ${good ? 'd-up' : 'd-down'}">${name} ${up ? '+' : '−'}${val}</span>`;
  }

})();
