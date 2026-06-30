/* ============================================================
 * 训练期 —— 行动点分配 / 营业 / 压力与生病
 * ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const U = TF.util;
  const T = (TF.train = {});

  // 训练动作：cost=行动点，stat=提升属性，stress=压力变化
  T.ACTIONS = [
    { id: 'vocal', icon: '🎤', name: '练唱', stat: 'vocal', gain: 3, stress: 8, desc: '提升 唱' },
    { id: 'dance', icon: '💃', name: '练跳', stat: 'dance', gain: 3, stress: 9, desc: '提升 跳' },
    { id: 'rap', icon: '🎧', name: '练 Rap', stat: 'rap', gain: 3, stress: 8, desc: '提升 Rap' },
    { id: 'charm', icon: '✨', name: '练台风', stat: 'charm', gain: 2, stress: 6, desc: '提升 舞台魅力' },
    { id: 'visual', icon: '💅', name: '形象管理', stat: 'visual', gain: 2, stress: 4, desc: '提升 颜值' },
    { id: 'biz', icon: '📱', name: '营业发博', stat: null, gain: 0, stress: 3, desc: '涨粉 + 拉近距离' },
    { id: 'rest', icon: '🛋️', name: '休息', stat: null, gain: 0, stress: -22, desc: '降低压力，回血' },
  ];

  T.canAct = function () { return TF.state.ap > 0 && !TF.state.player.sick; };

  T.weeklyReset = function () {
    const s = TF.state;
    // 体力影响每周行动点
    const bonus = Math.floor(s.player.stats.stamina / 8);
    s.ap = TF.START_AP + bonus;
    // 生病一周后康复
    if (s.player.sick) { s.player.sick = false; s.player.stress = U.clamp(s.player.stress - 30, 0, 100); }
  };

  T.doAction = function (id) {
    const s = TF.state, p = s.player;
    if (!T.canAct()) return { ok: false, msg: p.sick ? '你病了，先休养。' : '本周行动点用完了，去公演吧。' };
    const a = T.ACTIONS.find(x => x.id === id);
    if (!a) return { ok: false };
    s.ap--;
    let msg = '';

    if (a.stat) {
      p.stats[a.stat] = U.clamp(p.stats[a.stat] + a.gain, 0, 99);
      msg = `${a.name}：${TF.STAT_LABELS[a.stat]} +${a.gain}`;
    } else if (a.id === 'biz') {
      if (!p.weiboOpen) { p.weiboOpen = true; }
      const post = U.pick([
        '今天也在努力练习，请大家多多支持鸭！',
        '谢谢你们的每一票，我会站上更大的舞台。',
        '练习室的深夜，但想到你们就有力气了。',
        '新舞台准备中，敬请期待哦～',
      ]);
      const gainFans = U.randInt(800, 2600) + Math.floor(p.charm || 0);
      p.followers += gainFans;
      p.stats.charm = U.clamp(p.stats.charm + 1, 0, 99);
      s.weibo.myPosts.unshift({ text: post, likes: U.randInt(500, 4000), t: Date.now() });
      if (s.weibo.myPosts.length > 6) s.weibo.myPosts.length = 6;
      // 营业也让在场男主更上头一点
      TF.activeLeads().forEach(l => { const ld = s.leads[l.id]; ld.love = U.clamp(ld.love + 1, 0, TF.LOVE_MAX); });
      TF.weibo.refreshFeed();
      msg = `营业成功，涨粉 +${U.fmt(gainFans)}`;
    } else if (a.id === 'rest') {
      msg = '好好休息了一下，压力 −22';
    }

    // 压力结算
    p.stress = U.clamp(p.stress + a.stress, 0, 100);
    let sickMsg = '';
    if (p.stress >= 100 && !p.sick) {
      p.sick = true;
      s.ap = 0;
      sickMsg = '⚠️ 压力爆表，你病倒了！这周无法再训练，下场公演状态大跌。';
      TF.log('压力爆表，病倒了。', 'bad');
      // 照顾型男主登场关怀
      T.careEvent();
    }
    TF.save();
    return { ok: true, msg, sickMsg };
  };

  /* 生病 → 照顾型男主关怀事件（妈粉/榜样/氪金/反黑） */
  T.careEvent = function () {
    const s = TF.state;
    const carers = ['keegan', 'konig', 'graves', 'gaz', 'nikto']
      .filter(id => s.leads[id] && s.leads[id].entered);
    const lines = {
      keegan: '冷杉路透站发博：「今日所有行程已取消，别让她操心安危。」',
      konig: '云杉手作铺匿名寄来一只软乎乎的娃娃，纸条只写：早日康复。',
      graves: '暗影资本一句「最好的私人医生已安排，账别让她看见」，刷屏了。',
      gaz: '永远在线🍊置顶：「别催了，让她好好休息。」',
      nikto: '造谣你「耍大牌请假」的号，一夜之间，没了。',
    };
    carers.forEach(id => {
      TF.log(lines[id], 'love');
      s.leads[id].love = U.clamp(s.leads[id].love + 4, 0, TF.LOVE_MAX);
    });
  };

})();
