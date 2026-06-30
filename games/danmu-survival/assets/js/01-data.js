/* ============================================================
 * 数据层：异能 / 物品 / 弹幕池 / 事件 / 遭遇 / 生存目标
 * ============================================================ */
(function () {
  'use strict';
  const DS = window.DS;
  const D = (DS.data = {});

  /* ---------- 六个开局异能 ---------- */
  D.abilities = [
    { id: 'storage',  icon: '📦', name: '空间仓库', desc: '随身储物，公寓储物上限 +60。纯囤货流，新手友好。' },
    { id: 'eye',      icon: '👁️', name: '鉴弹之眼', desc: '看穿弹幕真假与可信度，弹幕带真/假角标。' },
    { id: 'omen',     icon: '⚡', name: '灾厄预感', desc: '危险临近时身体预警（停水/抢购/破门前一刻）。' },
    { id: 'create',   icon: '🌱', name: '造物之手', desc: '每天少量生成水或食物，缓解食物约束。' },
    { id: 'body',     icon: '💪', name: '体能强化', desc: '囤货期收益低，末日后战力显著更强（硬核向）。' },
    { id: 'heal',     icon: '💚', name: '治愈',     desc: '回复伤病；末日后保命，也能给队友加分。' },
  ];

  /* ---------- 物品 ---------- */
  D.items = [
    { id: 'water',  icon: '💧', name: '瓶装水(箱)',   line: 'water',   space: 3, price: 30,  desc: '末日最致命的短缺，停水后买不到。' },
    { id: 'food',   icon: '🍖', name: '耐储食品',     line: 'food',    space: 2, price: 25,  desc: '罐头/压缩粮/方便面。' },
    { id: 'meds',   icon: '💊', name: '药品急救包',   line: 'meds',    space: 1, price: 80,  desc: '抗感染/外伤，末日临近暴涨。' },
    { id: 'weapon', icon: '🔪', name: '防身武器',     line: 'defense', space: 2, price: 120, desc: '门窗加固/冷兵器，决定末日夜生死。' },
    { id: 'salt',   icon: '🧂', name: '大袋食盐',     line: null,      space: 2, price: 15,  desc: '弹幕热议"囤盐"。真有用吗？' },
    { id: 'lux',    icon: '💄', name: '冲动消费',     line: null,      space: 1, price: 200, desc: '末日前最后的消费主义，占钱不占命。' },
  ];
  D.itemById = id => D.items.find(i => i.id === id);

  /* ---------- 生存目标（末日开局舒适线，空间紧张时难以全达标） ---------- */
  D.goals = { water: 12, food: 12, meds: 3, defense: 2 };

  /* ---------- 常驻氛围弹幕（按角色，反复出现） ----------
   * 这些观众有"人格"，应验/打脸会累积信誉。
   */
  D.ambientDanmaku = [
    { id: '吃瓜群众', text: '哈哈哈房东要哭了', kind: 'flavor' },
    { id: '乐子人',   text: '建议直接躺平等死，省心', kind: 'flavor' },
    { id: '摸鱼怪',   text: '主播今天又是颓废的一天', kind: 'flavor' },
    { id: '夜猫子',   text: '这公寓隔音是真的差', kind: 'flavor' },
    { id: '路人甲',   text: '楼下超市今天人好多啊', kind: 'flavor' },
    { id: '空降兵',   text: '刚来，主播是谁？为什么在末日里？', kind: 'flavor' },
    { id: '理中客',   text: '理性看待，别跟着节奏走', kind: 'false' },
    { id: '老股民',   text: '钱要花在刀刃上啊姐妹', kind: 'flavor' },
    { id: '养生达人', text: '记得多喝热水，免疫力重要', kind: 'flavor' },
    { id: '杠精',     text: '囤这么多，末日不来你不尴尬？', kind: 'false' },
    { id: '神秘ID',   text: '……向西。那里有活下去的人。', kind: 'flavor' },
    { id: '老观众',   text: '上一个穿越的活到第七天', kind: 'flavor' },
    { id: '社恐患者', text: '我要是穿越早吓哭了，主播好淡定', kind: 'flavor' },
    { id: '键盘侠',   text: '换我来玩肯定比她强', kind: 'flavor' },
    { id: '颜值协会', text: '先别管末日了，主播长得挺好看啊', kind: 'flavor' },
    { id: '强迫症',   text: '储物空间能不能码整齐点，看着难受', kind: 'flavor' },
    { id: '吃货',     text: '囤点好吃的啊，天天压缩饼干谁顶得住', kind: 'flavor' },
    { id: '阴谋论者', text: '我跟你们说，这事没那么简单', kind: 'flavor' },
    { id: '懒人协会', text: '出门好麻烦，能不能在家躺赢', kind: 'false' },
    { id: '历史老师', text: '末日囤货第一条铁律：水比金子贵', kind: 'true' },
    { id: '前主播',   text: '别学我，我就是太浪才死的', kind: 'flavor' },
    { id: '神秘ID',   text: '骷髅面具……记住这个。', kind: 'flavor' },
    { id: '气氛组',   text: '紧张刺激，比看电影带劲', kind: 'flavor' },
    { id: '复读机',   text: '囤水 囤水 囤水', kind: 'true' },
  ];

  /* ---------- 反应式弹幕：观众针对当前处境开嘴 ----------
   * 让每天的弹幕都不一样、显得"活"。
   */
  D.reactiveDanmaku = function (s) {
    const U = DS.util, r = s.resources, out = [];
    const add = (id, text, kind) => out.push({ id, text, kind: kind || 'flavor' });
    if (r.water <= 2) add('末日预言家233', '她的水撑不过三天了，快囤水啊！', 'true');
    if (r.food <= 2) add('养生达人', '粮也见底了，别光顾着别的', 'true');
    if (r.meds <= 0 && s.day >= 8) add('护士小姐', '一点药都不备？感染了就等死吧', 'true');
    if (r.defense <= 0 && s.day >= 16) add('退伍老兵', '手无寸铁，末日夜拿什么守门', 'true');
    if (s.player.money > 1500) add('柠檬精', '哇这么有钱，凡尔赛是吧', 'flavor');
    if (s.player.money < 120) add('乐子人', '主播快破产了哈哈哈', 'flavor');
    if (s.flags.has_lux) add('杠精', '都末日了还买这破玩意儿', 'false');
    if (s.flags.has_salt) add('理中客', '囤那么多盐，准备腌咸菜过末日？', 'false');
    if (s.flags.safehouseTrap) add('吃瓜群众', '安全屋砸那么多钱，血亏哦', 'flavor');
    if (s.flags.jailTrap) add('乐子人', '哈哈哈进局子了吧，活该', 'flavor');
    if (s.flags.exposed) add('神秘ID', '你暴露了。他们会找上门的。', 'true');
    if (s.flags.missedMeds) add('护士小姐', '当初不囤药，现在买不起了吧', 'flavor');
    if (s.day >= 25) add('空降兵', '只剩几天了，主播慌不慌', 'flavor');
    if ((s.reputation['末日预言家233'] || 0) >= 4) add('末日预言家233', '我说的话，应验了吧？', 'flavor');
    if (U.chance(0.35)) add('神秘ID', U.pick(['西边的基地，有个戴骷髅面具的男人', '活下来，你会遇到那群兵', '往西，别问为什么，去就是了']), 'flavor');
    // 随机挑选最多 3 条，避免刷屏
    out.sort(() => Math.random() - 0.5);
    return out.slice(0, 3);
  };

  /* ---------- 每日情报弹幕（随天数推进，营造倒计时压迫） ----------
   * 由游戏按 day 取用，混入真假。
   */
  D.intelByDay = function (day) {
    const U = DS.util;
    let trues, falses, n = 1;
    if (day <= 6) {
      trues = [
        { id: '末日预言家233', text: '现在物价最低，能囤就囤，别等涨价', kind: 'true' },
        { id: '历史老师', text: '先囤水和耐储食品，这两样最保命', kind: 'true' },
        { id: '老股民', text: '趁现金多，把基础物资先铺满', kind: 'true' },
      ];
      falses = [
        { id: '理中客', text: '不就点流感新闻，至于囤货？', kind: 'false' },
        { id: '懒人协会', text: '末日哪那么容易来，别瞎花钱', kind: 'false' },
        { id: '杠精', text: '囤这么早，过期了算谁的', kind: 'false' },
      ];
    } else if (day <= 14) {
      trues = [
        { id: '末日预言家233', text: '水！优先囤水！停水比断粮更快要命', kind: 'true' },
        { id: '退伍老兵', text: '该添点防身的家伙了，别等到夜里', kind: 'true' },
        { id: '复读机', text: '囤水 囤水 还是囤水', kind: 'true' },
      ];
      falses = [
        { id: '杠精', text: '囤水的是傻子，拧开龙头不就有', kind: 'false' },
        { id: '理中客', text: '限购是临时的，过两天就恢复', kind: 'false' },
        { id: '装修狂魔', text: '把钱花在改造公寓上才划算', kind: 'false' },
      ];
    } else if (day <= 22) {
      trues = [
        { id: '末日预言家233', text: '药快断货了，再不囤就真没了', kind: 'true' },
        { id: '护士小姐', text: '抗感染的药一定要备，会用上的', kind: 'true' },
        { id: '神秘ID', text: '别死守公寓，记着往西', kind: 'true' },
      ];
      falses = [
        { id: '圣母在线', text: '把药让给更需要的人吧', kind: 'false' },
        { id: '乐子人', text: '都这时候了，享受当下不香吗', kind: 'false' },
        { id: '阴谋论者', text: '药都是智商税，多喝热水就行', kind: 'false' },
      ];
    } else {
      trues = [
        { id: '末日预言家233', text: '最后几天，钱全换成水和粮！', kind: 'true' },
        { id: '神秘ID', text: '别守着公寓，要走，去西边的基地', kind: 'true' },
        { id: '退伍老兵', text: '检查门窗和武器，今晚可能就出事', kind: 'true' },
      ];
      falses = [
        { id: '杠精', text: '现在出门的都是送死', kind: 'false' },
        { id: '懒人协会', text: '囤够了就躺着，别折腾', kind: 'false' },
      ];
      n = 2;
    }
    const pick = (arr, k) => arr.slice().sort(() => Math.random() - 0.5).slice(0, k);
    return [...pick(trues, n), ...pick(falses, 1)];
  };

  /* ---------- 关键事件（含陷阱） ----------
   * window:[起,止] 窗口内随机触发；choices 自定义抉择
   */
  D.events = [
    {
      id: 'rumor', window: [2, 4], title: '邻市怪病',
      desc: '新闻角落：邻市出现"不明狂躁症病例"，官方称为普通流感。要不要趁早囤口罩药品？',
      danmaku: [
        { id: '末日预言家233', text: '别当流感！现在囤N95和退烧药最便宜', kind: 'true' },
        { id: '理中客', text: '每年都有流感，别恐慌囤货', kind: 'false' },
      ],
      choices: [
        { label: '信预言家：去囤口罩药品(花¥120)', effect: s => { if (s.player.money >= 120) { s.player.money -= 120; s.resources.meds += 2; DS.log('你囤了口罩和退烧药。事后证明，这是明智的。', 'good'); s._rep('末日预言家233', +2); s._rep('理中客', -1); } else DS.log('钱不够，没囤成。', 'bad'); } },
        { label: '信理中客：不当回事', effect: s => { DS.log('你没当回事。几天后药价开始飞涨……', 'bad'); s._rep('理中客', -2); s._rep('末日预言家233', +1); s.flags.missedMeds = true; } },
      ],
    },
    {
      id: 'water1', window: [8, 11], title: '全市短时停水',
      desc: '自来水公司通知今日管网检修、短时停水。弹幕在吵要不要囤水。',
      danmaku: [
        { id: '末日预言家233', text: '今晚把浴缸水桶全接满！别等', kind: 'true' },
        { id: '懒人协会', text: '停几小时而已，至于吗', kind: 'false' },
      ],
      choices: [
        { label: '接满所有容器囤水(+3水)', effect: s => { s.resources.water += 3; DS.log('你接满了浴缸和水桶。停水那天，邻居们慌了，你没慌。', 'good'); s._rep('末日预言家233', +2); } },
        { label: '懒得弄', effect: s => { DS.log('停水来得比预想久，你渴了一下午。', 'bad'); } },
      ],
    },
    {
      id: 'safehouse', window: [10, 15], title: '弹幕怂恿：买房改安全屋',
      desc: '一群弹幕鼓动你"砸钱把公寓改成永久安全屋才稳"。这要花掉你一大笔积蓄。',
      danmaku: [
        { id: '装修狂魔', text: '一步到位！防爆门+囤满，永久安全屋！', kind: 'false' },
        { id: '神秘ID', text: '……死守一处，是死路。资源都在西边。', kind: 'true' },
      ],
      choices: [
        { label: '梭哈改造安全屋(花光¥, +5防身)', effect: s => { const spent = s.player.money; s.resources.defense += 5; s.player.money = 0; DS.log(`你砸光 ¥${spent} 改造公寓。可末日后人和物资都在大基地，死守这里=坐困孤城……这钱花得冤。`, 'bad'); s.flags.safehouseTrap = true; } },
        { label: '冷静，不上头', effect: s => { DS.log('你忍住了。守着一处不如保住机动和现金。', 'good'); s._rep('神秘ID', +2); } },
      ],
    },
    {
      id: 'limit', window: [12, 16], title: '超市限购',
      desc: '超市开始限购米面油。这是个信号，也可能只是恐慌。',
      danmaku: [
        { id: '理中客', text: '政府辟谣了，囤粮纯属智商税', kind: 'false' },
        { id: '末日预言家233', text: '限购就是信号，能囤多少囤多少', kind: 'true' },
      ],
      choices: [
        { label: '限购前扫货(花¥150, +4食物)', effect: s => { if (s.player.money >= 150) { s.player.money -= 150; s.resources.food += 4; DS.log('你赶在限购前扫了货。', 'good'); s._rep('末日预言家233', +2); } else DS.log('钱不够。', 'bad'); } },
        { label: '相信会辟谣，不囤', effect: s => { DS.log('几天后粮价翻倍，你后悔了。', 'bad'); s._rep('理中客', -2); } },
      ],
    },
    {
      id: 'rob', window: [14, 19], title: '弹幕带节奏：去抢超市',
      desc: '弹幕起哄："末日了法律没用了，快去抢超市囤货！"——可现在真的法外之地了吗？',
      danmaku: [
        { id: '乐子人', text: '冲啊！末世了还守什么规矩！', kind: 'false' },
        { id: '末日预言家233', text: '别！现在法律还在，抢劫会进局子', kind: 'true' },
      ],
      choices: [
        { label: '信乐子人：去"拿"物资', effect: s => { DS.log('你被当场抓获——末日还没来，法律还在。你被关进看守所，直到末日在牢里降临……（团灭风险极高）', 'bad'); s.flags.jailTrap = true; s.player.money = Math.max(0, s.player.money - 200); } },
        { label: '克制，老实囤货', effect: s => { DS.log('你忍住了。冲动是魔鬼。', 'good'); s._rep('末日预言家233', +1); } },
      ],
    },
    {
      id: 'neighbor', window: [18, 23], title: '深夜，邻居敲门',
      desc: '隔壁邻居咳嗽着敲门，说想借点药。他的咳嗽……听着不太对劲。',
      danmaku: [
        { id: '圣母在线', text: '开门救救他吧，都是邻居！', kind: 'false' },
        { id: '末日预言家233', text: '别开！那咳嗽是感染前兆', kind: 'true' },
      ],
      choices: [
        { label: '开门给他药', effect: s => { s.resources.meds = Math.max(0, s.resources.meds - 1); DS.log('你开了门。第二天，那扇门后传来抓挠声……你暴露了，也可能被感染。', 'bad'); s.flags.exposed = true; s._rep('圣母在线', -1); } },
        { label: '隔门拒绝，保持沉默', effect: s => { DS.log('你狠下心没开门。是冷酷，也是活下去的代价。', 'good'); s._rep('末日预言家233', +2); } },
      ],
    },
    {
      id: 'lastrun', window: [24, 27], title: '最后的采购窗口',
      desc: '治安崩坏，街上有抢劫传闻。这可能是最后一次能安全出门。',
      danmaku: [
        { id: '末日预言家233', text: '最后机会！把钱全换成水和粮', kind: 'true' },
        { id: '杠精', text: '现在出门的都是傻子', kind: 'false' },
      ],
      choices: [
        { label: '赌命出门大采购(花¥, 大量物资)', effect: s => { const spend = Math.min(s.player.money, 300); s.player.money -= spend; const each = Math.floor(spend / 100); s.resources.water += each; s.resources.food += each; DS.log(`你冒险出门，抢回 ${each} 水 ${each} 粮。惊险，但值。`, 'good'); } },
        { label: '太危险，龟缩在家', effect: s => { DS.log('你选择安全。但物资就这些了，够吗？', 'info'); } },
      ],
    },
  ];

  /* ---------- 开场：醒来过渡剧情 ----------
   * dm: 该幕飘出的弹幕（可选）
   */
  D.intro = [
    { text: '……好痛的头。\n\n你艰难地睁开眼。天花板是陌生的——不是你出租屋那块发霉的吊顶。' },
    { text: '你撑着坐起来。这是一间不算大的公寓，干净，却处处透着"不是你的"气息。\n身体……动起来也有点陌生的轻。' },
    { text: '窗外是一座你叫不出名字的城市。\n床头的手机里，全是陌生人的自拍和聊天记录，主人公的名字……是你的，又好像不是。\n\n一个荒谬的念头钻进脑子：你，"穿"过来了。' },
    { text: '就在你发懵的时候——\n\n眼前，毫无征兆地，飘过了一行字。',
      dm: [ { id: '空降兵', text: '卧槽她醒了！', kind:'flavor' }, { id: '老观众', text: '又一个穿越的，这次是个妹子', kind:'flavor' }, { id: '乐子人', text: '搬好板凳，开看', kind:'flavor' } ] },
    { text: '弹幕。\n像直播间那样的弹幕，密密麻麻，只有你看得见。\n它们在议论你——仿佛你是一场被无数人围观的真人秀的主角。' },
    { text: '你还没回过神，一条暗红色的弹幕慢慢飘过，让你脊背发凉：',
      dm: [ { id:'末日预言家233', text:'倒计时30天。趁还来得及，囤货吧。', kind:'true' } ] },
    { text: '末日？倒计时？\n\n你还没搞懂状况。但有一件事很清楚了——\n这些弹幕，可能是你唯一的金手指。\n也可能，是把你推下深渊的噪音。\n\n（先看看今天的报纸吧。）' },
  ];

  /* ---------- 14 男主（提前偶遇用的简档 + 末日后正式登场） ---------- */
  D.maleLeads = [
    { id: 'ghost',   name: 'Ghost',   cameo: '一个戴骷髅面罩的高大男人与你擦肩而过，目光冷得像刀刃，没有停留。' },
    { id: 'price',   name: 'Price',   cameo: '叼着雪茄的中年男人替你扶住被风吹开的门，礼帽下点头致意：“小心点，姑娘。”' },
    { id: 'soap',    name: 'Soap',    cameo: '一个莫西干头的家伙在酒吧门口冲你咧嘴一笑，苏格兰口音很重：“今天天气不错吧？”' },
    { id: 'gaz',     name: 'Gaz',     cameo: '一个笑容温和的年轻人帮你捡起掉落的购物袋，顺口提醒：“最近别一个人走夜路。”' },
    { id: 'keegan',  name: 'Keegan',  cameo: '街角一个沉默的男人一直在观察来往的人，你们目光相接，他不动声色地移开了。' },
    { id: 'logan',   name: 'Logan',   cameo: '一个安静的年轻人默默替你按住了电梯门，全程没说一句话。' },
    { id: 'hesh',    name: 'Hesh',    cameo: '一个警觉的男人拦下要闯红灯的你：“急什么，命比时间值钱。”' },
    { id: 'kick',    name: 'Kick',    cameo: '一个语速飞快的技术宅在电子城拉着你聊改装设备，你一句没听懂。' },
    { id: 'zimo',    name: 'Zimo',    cameo: '一个笑得很周到的男人用天津腔跟你搭话，热情得让你有点摸不透。' },
    { id: 'horangi', name: 'Horangi', cameo: '一个吊儿郎当的男人在街边赌摊旁，懒洋洋地瞥了你一眼：“面相不错，命硬。”' },
    { id: 'krueger', name: 'Krueger', cameo: '一个神色冷硬的男人用德语嘟囔了句什么，语气不善，却帮你挡开了挤过来的人群。' },
    { id: 'konig',   name: 'König',   cameo: '一个两米高的壮汉慌忙给你让路，把脸埋进兜帽里，小声说了句带口音的“……抱歉”。' },
    { id: 'nikto',   name: 'Nikto',   cameo: '一个戴面具的男人站在阴影里，用奇怪的复数自称：“我们……见过你。”说完便消失在人群中。' },
    { id: 'graves',  name: 'Graves',  cameo: '一个南方口音的男人热情地递来名片，笑容标准得像装出来的：“需要帮忙，随时找我。”' },
  ];

  /* ---------- 男主档案（基地档案 UI + AI 参考） ---------- */
  D.leadInfo = {
    ghost:   { role: 'TF141·中尉', ab: '潜匿', abLv: 6, trait: '冷峻寡言，骷髅面罩，独狼，对圈内人极护短', entryStage: 'distant', tags: ['潜入', '高压救援', '危险观察'] },
    price:   { role: 'TF141·上尉/队长', ab: '指挥', abLv: 6, trait: '沉稳的领袖，老烟枪，扛起所有人的责任', entryStage: 'base', tags: ['指挥', '基地秩序', '救援调度'] },
    soap:    { role: 'TF141·军士', ab: '爆破', abLv: 5, trait: '高能外向的苏格兰人，莫西干头，藏着真心', entryStage: 'base', tags: ['爆破', '士气', '并肩作战'] },
    gaz:     { role: 'TF141·中士', ab: '鹰眼', abLv: 5, trait: '开朗，观察力强，可靠的伙伴', entryStage: 'early', tags: ['侦察', '电台', '温和支援'] },
    keegan:  { role: 'Ghosts·侦察', ab: '预判', abLv: 5, trait: '沉默的侦察兵，凡事预先算计', entryStage: 'distant', tags: ['远程观察', '夜间侦察', '冷处理'] },
    logan:   { role: 'Ghosts', ab: '坚守', abLv: 4, trait: '安静坚韧，沉默的倾听者，比外表硬', entryStage: 'base', tags: ['守夜', '沉默陪伴', '防线'] },
    hesh:    { role: 'Ghosts', ab: '护战', abLv: 4, trait: '保护欲强的兄长，比弟弟话多', entryStage: 'base', tags: ['护送', '防守', '家人感'] },
    kick:    { role: '技术专家', ab: '机械', abLv: 4, trait: '语速极快的技术宅，渴望真正的朋友', entryStage: 'radio', tags: ['收音机', '修设备', '基地后勤'] },
    zimo:    { role: 'PSYOPS·特战', ab: '精神', abLv: 5, trait: '白切黑，记忆力惊人，心理战高手，天津腔', entryStage: 'trade', tags: ['心理战', '交易', '情报'] },
    horangi: { role: 'KorTac', ab: '赌运', abLv: 5, trait: '江湖气的老赌徒，看透世事', entryStage: 'trade', tags: ['黑市', '下注', '危险交易'] },
    krueger: { role: 'Chimera·前KSK', ab: '猎杀', abLv: 5, trait: '高警觉毒舌的德国人，不向不值得的人解释', entryStage: 'tide', tags: ['猎杀', '尸潮', '试探'] },
    konig:   { role: 'KorTac', ab: '重装', abLv: 6, trait: '两米社恐巨人，战斗时精准冷酷', entryStage: 'tide', tags: ['重装', '压制', '反差'] },
    nikto:   { role: 'KorTac·前FSB', ab: '不灭', abLv: 6, trait: '冰冷，创伤解离，自称"我们"', entryStage: 'danger', tags: ['污染区', '创伤', '极危救援'] },
    graves:  { role: '影子部队·指挥官', ab: '号令', abLv: 6, trait: '南方口音的魅力操纵者，亦敌亦友，每句恭维都有算计', entryStage: 'trade', tags: ['影子部队', '谈判', '利益交换'] },
  };

  D.relationshipStages = [
    { id: 'rumor', name: '传闻', minAffection: -20, desc: '只适合传闻、广播、远景或擦肩，不应直接亲密互动。' },
    { id: 'logged', name: '档案解锁', minAffection: 0, desc: '正式知道姓名/代号，可短暂对话，但关系仍疏离。' },
    { id: 'cooperated', name: '合作过', minAffection: 20, desc: '完成过一次任务或互相帮过忙，可以有战术默契。' },
    { id: 'recognized', name: '被认可', minAffection: 45, desc: '对方承认主角实力与判断，愿意透露更多真实态度。' },
    { id: 'trusted', name: '可信任', minAffection: 70, desc: '可以交付背后、保护资源或卷入个人困境。' },
    { id: 'route', name: '个人线', minAffection: 90, desc: '进入强个人羁绊，但仍要被末日压力考验。' },
  ];
  D.relationshipStageById = id => D.relationshipStages.find(x => x.id === id) || D.relationshipStages[0];

  D.leadEntryStageNames = {
    early: '早期接触',
    distant: '远景观察',
    radio: '电台/技术线',
    base: '基地接触',
    trade: '交易/势力线',
    tide: '尸潮高压线',
    danger: '污染区高危线',
  };

  /* ---------- 第二阶段：AI 导演 ---------- */
  D.phase2 = {
    // 开场：世界崩坏的演出（脚本，逐幕"继续"）
    openingBeats: [
      '凌晨四点。\n你是被尖叫吵醒的。\n\n窗外，那座你囤了三十天物资、既熟悉又陌生的城市，正在燃烧。远处有爆炸的火光，警笛声此起彼伏，又一个个诡异地掐断。',
      '楼道里传来奔跑、撞门、和某种……不像人的嘶吼。\n你扒着窗帘缝往下看——街上的人在逃，而追着他们的，是一些动作扭曲、眼睛泛白的"东西"。\n\n它们扑倒一个人，撕咬。被咬的人抽搐着爬起来，也变成了它们中的一员。',
      '手机彻底没了信号。电视雪花一片。最后一条推送停在三个小时前：「……不明病毒……请居民居家……」\n\n报纸不会再来了。世界，在你眼前，安静而彻底地，结束了。',
      '就在这时，一阵剧痛从你的脊椎窜上后脑——\n\n你眼前的弹幕疯狂刷屏：「觉醒了！」「她的异能觉醒了！」\n\n一股从未有过的力量，在你体内苏醒。',
    ],

    availableLeadIds(s, mode) {
      const day = (s.story && s.story.day) || 1;
      const b = (s.story && s.story.base) || {};
      const atBase = !!(s.story && s.story.atBase);
      const radio = !!s.hasRadio;
      const tideSoon = (b.tideDay || 7) - day <= 2 || (b.zombieHeat || 0) >= 10;
      const stageOk = {
        early: day >= 1,
        distant: day >= 1,
        radio: radio || day >= 4,
        base: atBase || day >= 6,
        trade: atBase || radio || day >= 8,
        tide: tideSoon || day >= 10,
        danger: day >= 12 || (s.story && s.story.exposed),
      };
      return D.maleLeads
        .filter(m => {
          const info = D.leadInfo[m.id] || {};
          if (s.codex && s.codex[m.id] && s.codex[m.id].met) return true;
          if (mode === 'rumor') return day >= 1;
          return !!stageOk[info.entryStage || 'base'];
        })
        .map(m => m.id);
    },

    relationshipSummary(s) {
      const entries = Object.keys(s.codex || {}).filter(id => D.leadInfo[id]).map(id => {
        const c = s.codex[id] || {};
        let stage = D.relationshipStageById(c.stage || 'logged');
        (D.relationshipStages || []).forEach(item => {
          if ((c.affection || 0) >= item.minAffection) stage = item;
        });
        return `${id}:${stage.name}/好感${c.affection || 0}`;
      });
      return entries.length ? entries.join('、') : '暂无正式解锁男主';
    },

    leadStageNote(s) {
      const ids = D.phase2.availableLeadIds(s);
      const visible = ids.map(id => {
        const info = D.leadInfo[id] || {};
        return `${id}(${D.leadEntryStageNames[info.entryStage] || '可接触'}:${(info.tags || []).join('/')})`;
      }).join('、') || '暂无';
      const rumorOnly = D.maleLeads
        .filter(m => !ids.includes(m.id))
        .map(m => m.id)
        .join('、') || '无';
      return `当前可正式登场/解锁：${visible}。暂未到登场阶段：${rumorOnly}，只能以传闻、广播、远景、任务痕迹出现，不能直接亲密互动。关系状态：${D.phase2.relationshipSummary(s)}。`;
    },

    // GM 系统提示词：定义世界、机制、口吻
    systemPrompt(s) {
      const ab = (D.abilities.find(a => a.id === s.player.ability.id) || {});
      const lv = s.player.ability.level;
      const met = Object.keys(s.metLeads || {}).map(id => (D.leadInfo[id] ? `${id}(${D.leadInfo[id].role})` : id)).join('、') || '无';
      const base = (s.story && s.story.base) || {};
      const leadGuide = D.phase2.leadStageNote(s);
      return [
        '你是末日生存乙女游戏《弹幕求生·末日三十天》第二阶段的游戏主持人(GM)，负责生成沉浸式剧情。背景：丧尸感染爆发，文明崩塌。题材借用使命召唤(COD)角色作为后续登场的强力NPC/男主。',
        `主角：穿越来的女主（玩家）。异能【${ab.name}】Lv${lv}（${ab.desc}）。她脑中能看到只有自己可见的"弹幕"——一群观众围观她的末日直播，弹幕偶尔会冒出来吐槽或提醒。`,
        `世界规则：击杀丧尸/变异体掉落"晶核"，晶核可升级异能、也是末日后的硬通货（以物易物/交保护费）。战斗用跑团骰：战力=异能等级×10+d20，等级差≥2必胜。晶核获得只通过战斗结算或明确的交易，你不要在普通剧情里随意发放晶核。`,
        (s.player.ability.id === 'create' ? '主角异能【造物之手】能少量造出水/食物，可用于救济他人、或与人/基地交易换取晶核与物资——多给她这类经营选择。'
          : s.player.ability.id === 'heal' ? '主角异能【治愈】能为他人疗伤，可借此换取晶核、物资或信任（在缺医少药的末日，这是稀缺的硬本事）——多给她行医、救人换报酬的选择。'
          : '主角异能偏战斗/生存，多给她战斗与搜刮的选择。'),
        `已提前擦肩而过的人（末日前）：${met}。这些人末日后可能重逢。`,
        `男主登场与关系推进：${leadGuide} 用unlock正式解锁男主档案；未解锁前只可远景/传闻/电台铺垫。好感不是恋爱开关，必须通过合作、救援、尸潮、交易、守夜等事件逐步推进，不要一见面就亲密或告白。`,
        `硬机制状态：${s.story.atBase ? `身处基地「${s.story.baseName}」，防御${base.security || 0}，补给${base.supplies || 0}，信任${base.trust || 0}` : '尚未入驻基地'}；尸潮压力${base.zombieHeat || 0}，预计第${base.tideDay || 7}天有一次尸潮检定；${s.hasRadio ? '已获得收音机' : '尚未获得收音机'}。`,
        '叙事要求：第二人称"你"，环境与感官描写细腻，每次输出150-300字剧情，营造危机感与人性张力。剧情正文里【不要】写弹幕，弹幕放到单独的 danmaku 字段。',
        '严格只输出JSON，不要任何额外文字，格式：',
        '{"narrative":"剧情正文","danmaku":["弹幕1","弹幕2"],"choices":["选项1","选项2","选项3"],"crystals":整数,"hp":整数,"combat":{"enemy":"敌人名","level":数字}或null,"unlock":"男主id或null","affection":{"男主id":好感变化}或null,"base":{"name":"基地名","security":整数,"supplies":整数,"trust":整数}或null,"radio":true或false,"exposed":true或false}',
        'danmaku：2-4条观众口吻的短弹幕，每回合必须全新、不得与之前重复。',
        'crystals 和 hp 平时一律填 0；只有当剧情中主角【确实】获得晶核/物资或受伤/恢复时才填非0；严禁凭空奖励，开场更不要给晶核或回血。',
        'combat 非null表示触发战斗（由系统掷骰判定，你不要直接写胜负，等系统回传结果再续写）。unlock用于正式引出某个男主（id见提示）。',
        'base 用于玩家加入/改善/损害基地时输出变化值，不要夸大；radio=true 表示玩家确实拿到可用收音机；exposed=true 表示异能暴露。',
        'choices给3-4个，差异明显、含人性抉择；每3-4回合至少给一次搜刮/加固/交易/侦查/救人等可落地选择。',
      ].join('\n');
    },

    // 导演引导：按末日后天数推进剧情阶段（不写死，给方向）
    directorNote(day, s) {
      let stage;
      if (day <= 2) stage = '【阶段：觉醒逃生】引导玩家面对：是否离开公寓、第一次遭遇丧尸、初次用异能、搜刮就近的便利店/药店。让她真切感到末日降临。';
      else if (day <= 9) stage = '【阶段：独自求生】搜刮商店/药店/居民楼，遭遇零散丧尸与其他幸存者。穿插人性抉择：救不救陌生人、会不会被背刺、信任的代价。资源紧张，每个选择有后果。';
      else if (day <= 16) stage = '【阶段：势力成形】幸存者开始组队、形成小型庇护所/基地。引入晶核经济与以物易物。玩家考虑加入庇护所——需要证明实力，但暴露异能可能被当枪使/沦为炮灰，或被索要晶核当"保护费"。住处、地位、信任都要争取。';
      else stage = '【阶段：基地与男主】基地间的博弈与丧尸潮威胁（可能全灭）。组队外出刷丧尸拿晶核、升级、搜刮。逐步让COD男主登场（用unlock），但他们尊重实力、信任需慢慢挣。可离开旧基地前往更大的据点。';
      const base = s && s.story && s.story.atBase ? `当前玩家身处庇护所「${s.story.baseName}」。` : '当前玩家在野外/独自行动。';
      const exp = s && s.story && s.story.exposed ? '玩家的异能已暴露，相关人会有反应。' : '玩家尚未公开暴露异能。';
      const radio = s && s.hasRadio ? '收音机线已开启：可用断续广播投放基地、尸潮和各势力男主线索。' : '收音机线未开启：适合在搜刮、便利店、保安室或废车里安排一次获得机会。';
      const leads = s ? D.phase2.leadStageNote(s) : '';
      return stage + ' ' + base + exp + ' ' + radio + ' ' + leads + ' 自然推进，不要急于求成，一次只演一个小场景。';
    },

    baseProfiles: [
      { name: '西郊前哨', security: 3, supplies: 2, trust: -1, desc: '废弃物流园改成的临时据点，铁皮墙外挂着一面粗糙的骷髅旗。' },
      { name: '灰水营地', security: 2, supplies: 3, trust: 0, desc: '依着水厂建起的庇护所，水汽、柴油味和消毒水味混在一起。' },
      { name: '骷髅旗哨站', security: 4, supplies: 1, trust: -2, desc: '门口的哨兵纪律森严，枪口压得很低，却从没真正离开你。' },
    ],

    radioSignals(day, s) {
      const U = DS.util;
      const b = (s.story && s.story.base) || {};
      const untilTide = Math.max(0, (b.tideDay || 7) - ((s.story && s.story.day) || day));
      const lead = [];
      const hintIds = D.phase2.availableLeadIds(s, 'rumor').filter(id => !(s.codex && s.codex[id] && s.codex[id].met));
      const hinted = hintIds.length ? U.pick(hintIds) : null;
      if (hinted && D.leadInfo[hinted]) {
        const info = D.leadInfo[hinted];
        lead.push(`……断续信号提到${hinted}相关线索：${(info.tags || []).join('、')}。暂不建议直接接触，先记录频段与势力动向……`);
      }
      if (!s.story.atBase) {
        lead.push(
          '……西郊仍在收人，但不收累赘。能带物资、晶核、医疗或战斗能力者，优先登记……',
          '……重复，认准骷髅旗。不要走高架，那里已经堵死。沿排水渠向西……',
          '……有幸存者声称在西线见过几支不同番号的小队。他们不挂牌，不招募，但会救有价值的人……'
        );
      } else {
        lead.push(
          `……${s.story.baseName}周边尸群正在聚集，下一波冲击约 ${untilTide || 1} 天内抵达……`,
          '……加固门、清理视野、分配夜哨。不要把晶核全攒着，活人先活过今晚……',
          '……基地之间开始交换名单。异能者、医生、会修电台的人，都会被盯上……'
        );
      }
      if (day >= 8) lead.push('……一段加密军频反复出现：Bravo-6、Ghost Actual、Shadow频道互相压线。保持电台静默……');
      if (day >= 14) lead.push('……大型尸潮正沿主干道移动。没有防线的营地，请立刻撤离……');
      return [
        { tag: '电波', h: `幸存者电波 · 末日第${day}天`, b: U.pick(lead) },
        { tag: '噪声', h: '断续军频', b: U.pick([
          '……坐标残缺……西北三公里……火力不足……',
          '……不要暴露异能者名单，重复，不要在明频里报名字……',
          '……骷髅面罩、雪茄、苏格兰口音……信号被强干扰切断……',
        ]) },
      ];
    },
  };

  /* ---------- 八卦（出门打听到） ---------- */
  D.gossip = [
    '听说西郊那个军事基地，其实真的在收人，只是不敢声张。',
    '楼下王婶说，她侄子在医院，最近送进去的人“都不太像人了”。',
    '有人在论坛发帖说梦见了世界末日，结果帖子被删了。',
    '便利店老板囤了一仓库的水，问他他还死不承认。',
    '据说城里来了一批退伍兵模样的人，纪律严得吓人。',
    '隔壁单元搬空了，一夜之间，留了满地的罐头。',
    '有个戴骷髅面具的男人最近老在附近出没，没人敢惹。',
    '炒股群里那个“老股民”，据说提前清仓跑路了。',
  ];

  /* ---------- 报纸：每日更新的小料池 ---------- */
  D.minorNews = [
    { tag: '社会', h: '公园相亲角人数骤减 大妈：现在谁还想这个', b: '' },
    { tag: '体育', h: '本地球队主场再负 球迷散场时沉默', b: '' },
    { tag: '民生', h: '部分公交线路调整 末班车提前', b: '官方未说明原因。' },
    { tag: '社会', h: '宠物医院咨询量上升 不少人想给猫狗囤粮', b: '' },
    { tag: '科技', h: '应急手摇收音机意外热销 商家补货不及', b: '“信号不好的时候还能用。”一位顾客说。' },
    { tag: '社会', h: '献血车前排起长队 又有人匆匆离开', b: '' },
    { tag: '财经', h: '黄金与罐头同时涨价 网友：魔幻现实', b: '' },
    { tag: '民生', h: '社区通知：请居民核对家庭应急物资', b: '清单包括饮用水、食品、药品、照明。' },
  ];
  D.paperAds = [
    { tag: '广告', h: '末日焦虑下"安全屋改造"咨询暴增', b: '商家推出"防爆门+整屋囤货"套餐。专家提醒：盲目死守一处未必安全，勿跟风。' },
    { tag: '社会', h: '西郊军事基地辟谣"收容平民"传闻', b: '官方称纯属谣言。但仍有人坚称——"想活命，就往西走"。' },
    { tag: '社会', h: '深夜超市排起长队 网友：像在抢年货', b: '有顾客一次性购买数十箱矿泉水，称"图个心安"。' },
    { tag: '广告', h: '【特惠】综合超市清仓促销 数量有限', b: '矿泉水、罐头、急救包全场低价，出门或可碰上。' },
  ];

  /* ---------- 每日报纸（每天重新生成，内容都不同） ---------- */
  D.makeNews = function (day) {
    const U = DS.util, pick = a => U.pick(a), news = [];
    // 头条：按阶段给变体池，随机抽一条 → 每天可能不同
    let top;
    if (day <= 3) top = [
      { tag: '头条', h: '本市经济运行平稳，消费市场回暖', b: '相关部门表示物资供应充足，市民无需担忧。' },
      { tag: '头条', h: '周末文化活动丰富，市民出游意愿高', b: '各大景区预计迎来客流高峰。' },
      { tag: '民生', h: '气温回升，气象台提示注意昼夜温差', b: '近日以晴到多云为主。' },
    ];
    else if (day <= 7) top = [
      { tag: '财经', h: '医药板块集体大涨，防疫概念走强', b: '受邻市疫情传闻影响，多只相关股涨停，分析师提示追高风险。' },
      { tag: '社会', h: '市民问询"是否需要囤药"，药店称理性购买', b: '多家药房客流明显增加。' },
      { tag: '财经', h: '口罩消毒用品销量激增，电商现缺货', b: '部分商品已限购。' },
    ];
    else if (day <= 11) top = [
      { tag: '民生', h: '自来水公司：今日管网检修，部分区域停水', b: '请居民提前储水，给您带来不便敬请谅解。' },
      { tag: '民生', h: '多个小区水压不稳，居民反映自来水有异味', b: '供水部门称正在排查。' },
    ];
    else if (day <= 16) top = [
      { tag: '头条', h: '多家超市米面油限购，官方称"供应充足勿恐慌"', b: '呼吁市民理性购买，勿信谣传谣。' },
      { tag: '头条', h: '部分商品价格异常波动，监管部门约谈商家', b: '强调严打囤积居奇。' },
    ];
    else if (day <= 22) top = [
      { tag: '头条', h: '口罩药品脱销价格飞涨，病例数字"暂不公布"', b: '多家药房排起长队，卫生部门未回应病例增长。' },
      { tag: '紧急', h: '医院急诊爆满，院方呼吁非急勿往', b: '有护士称"送来的病人状态很反常"。' },
    ];
    else if (day <= 27) top = [
      { tag: '紧急', h: '市区部分路段交通管制，入夜后请勿外出', b: '警方仅称"为保障市民安全"，多人称夜间听到异响。' },
      { tag: '紧急', h: '多区进入"暂时性管控"，学校停课', b: '官方未说明原因。' },
    ];
    else top = [
      { tag: '紧急', h: '【紧急】全市进入封锁，通讯或将中断', b: '官方呼吁居民紧闭门窗、居家不出。这可能是最后一份报纸。' },
    ];
    news.push(pick(top));

    // 怪病暗线（按阶段推进，措辞随机）
    if (day <= 4) news.push(pick([
      { tag: '简讯', h: '邻市报告数起"不明狂躁症"病例', b: '卫生部门称疑似新型流感，提醒公众无需恐慌。' },
      { tag: '简讯', h: '邻市卫健委：个别"情绪失控"病例已隔离', b: '强调可控，无需囤药。' },
    ]));
    else if (day <= 14) news.push(pick([
      { tag: '简讯', h: '邻市"狂躁症"出现死亡病例，官方称可控', b: '有目击者称患者攻击他人，官方未予证实。' },
      { tag: '简讯', h: '网传邻市患者"咬人"视频，官方称系摆拍', b: '相关视频已下架。' },
    ]));
    else news.push(pick([
      { tag: '简讯', h: '与邻市通讯中断，先遣救援队进入后失联', b: '截至发稿仍无法取得联系。' },
      { tag: '简讯', h: '通往邻市的高速封闭，沿途设置检查站', b: '禁止一切人员进入。' },
    ]));

    // 每日小料 + 广告/八卦（随机）
    news.push(pick(D.minorNews));
    news.push(pick(D.paperAds));
    // 天气条（纯氛围，体现每日更新）
    news.push({ tag: '天气', h: '今日天气：' + pick(['晴', '多云', '阴有阵雨', '大风降温', '闷热潮湿', '雾霾']), b: '' });
    return news;
  };

  /* ---------- 末日后·收音机情报（捡到收音机后逐日更新） ---------- */
  D.radioByDay = function (n, s) {
    return D.phase2.radioSignals(n, s || DS.state);
  };

  /* ---------- 街头随机遭遇（出门时触发） ---------- */
  D.encounters = [
    { id: 'deal',   text: '巷口有人低价甩卖瓶装水，要不要？', good: true,
      run: s => { if (s.player.money >= 40) { s.player.money -= 40; s.resources.water += 2; DS.log('遭遇：低价淘到 2 箱水！', 'good'); } else DS.log('遭遇：有便宜水但你没钱，错过了。', 'info'); } },
    { id: 'warn',   text: '一个老兵模样的人擦肩而过，低声说："别信网上那些话，囤水。"', good: true,
      run: s => { DS.log('遭遇：神秘人提醒你囤水。（是善意还是陷阱？）', 'story'); } },
    { id: 'pick',   text: '你在路边捡到一个被丢弃的急救包。', good: true,
      run: s => { s.resources.meds += 1; DS.log('遭遇：捡到急救包 +1 药品。', 'good'); } },
    { id: 'thief',  text: '人群拥挤，你的钱包被人摸了一把！', good: false,
      run: s => { const lose = Math.min(s.player.money, 60); s.player.money -= lose; DS.log(`遭遇：被偷了 ¥${lose}。`, 'bad'); } },
    { id: 'panic',  text: '超市爆发抢购踩踏，你被挤得够呛，空手而归。', good: false,
      run: s => { DS.log('遭遇：抢购混乱，今天什么都没买到。', 'bad'); } },
    { id: 'nothing',text: '街上一切如常……表面上。', good: true,
      run: s => { DS.log('遭遇：平静的一天。', 'info'); } },
  ];

})();
