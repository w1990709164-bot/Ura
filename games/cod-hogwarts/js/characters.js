// ── 角色数据 ──────────────────────────────────────────────
const HOUSES = {
  gryffindor: { id:'gryffindor', name:'格兰芬多', en:'GRYFFINDOR', color:'#8b1a1a', accent:'#c9a84c', symbol:'🦁' },
  slytherin:  { id:'slytherin',  name:'斯莱特林', en:'SLYTHERIN',  color:'#1a4a2a', accent:'#8fbc8f', symbol:'🐍' },
  ravenclaw:  { id:'ravenclaw',  name:'拉文克劳', en:'RAVENCLAW',  color:'#1a2a5c', accent:'#b8c4e8', symbol:'🦅' },
  hufflepuff: { id:'hufflepuff', name:'赫奇帕奇', en:'HUFFLEPUFF', color:'#4a3a00', accent:'#f0c040', symbol:'🦡' }
};

const LOCATIONS = {
  hall:            { id:'hall',            name:'大厅',       zh:'大厅' },
  library:         { id:'library',         name:'图书馆',     zh:'图书馆' },
  blackLake:       { id:'blackLake',       name:'黑湖边',     zh:'黑湖边' },
  trainingGround:  { id:'trainingGround',  name:'训练场',     zh:'训练场' },
  observatory:     { id:'observatory',     name:'天文台',     zh:'天文台' },
  forbiddenForest: { id:'forbiddenForest', name:'禁忌森林边', zh:'禁忌森林边' },
  commonRoom:      { id:'commonRoom',      name:'公共休息室', zh:'公共休息室' },
  dormitory:       { id:'dormitory',       name:'寝室',       zh:'寝室' },
  classroom:       { id:'classroom',       name:'课堂',       zh:'课堂' },
  blackMarket:     { id:'blackMarket',     name:'地下走廊',   zh:'地下走廊' },
  unknown:         { id:'unknown',         name:'未知',       zh:'未知' }
};

// 好感度阶段
const AFFECTION_STAGES = [
  { id:0, name:'陌生人', range:[0,20] },
  { id:1, name:'相识',   range:[21,40] },
  { id:2, name:'信任',   range:[41,60] },
  { id:3, name:'亲密',   range:[61,80] },
  { id:4, name:'心动',   range:[81,100] }
];

function getAffectionStage(value) {
  return AFFECTION_STAGES.findLast(s => value >= s.range[0]) || AFFECTION_STAGES[0];
}

// 数值阶段上限
const STAT_STAGE_CAPS = { 1:40, 2:60, 3:80, 4:100 };

const CHARACTERS = [
  {
    id: 'ghost',
    name: 'Ghost',
    fullName: 'Simon "Ghost" Riley',
    house: 'gryffindor',
    language: 'en', langLabel: '英语',
    color: '#4a5568',
    combatStats: { atk:3, def:2, special:'单体暗杀：首轮攻击DC-2' },
    locationWeights: { hall:1, library:2, blackLake:4, trainingGround:3, observatory:3, forbiddenForest:4 },
    personality: `Ghost（Simon Riley）：极度沉默，冷峻，话极少但每句有分量。永远戴着骷髅图案的面罩/围巾，没人见过他完整的脸。经历过背叛与丧失，不轻易信任任何人。一旦把人纳入保护圈，不问对错先护短，事后私下告诉对方哪里做错了，但外人无权置喙。对玩家初始态度：漠视。说话：英式英语，极简，偶有冷刺，从不解释自己。`,
    heartGuard: true,
    initialLocation: 'unknown',
    initialPsychology: '用惯常的冷漠扫了一眼这个新来的东方学生，没有多余的反应。'
  },
  {
    id: 'price',
    name: 'Price',
    fullName: 'John Price',
    house: 'gryffindor',
    language: 'en', langLabel: '英语',
    color: '#6b5a3e',
    combatStats: { atk:2, def:3, special:'策略加成：全队修正+1' },
    locationWeights: { hall:3, library:3, blackLake:2, trainingGround:4, observatory:2, forbiddenForest:2 },
    personality: `Price（John Price）：沉稳老练，有大局观。戴旧式圆顶礼帽，手边常有一杯茶。走到哪里都有人自然向他靠拢，像一个不显山露水的指挥官。背负着许多人的性命，习惯了把责任一个人扛。对玩家：中立审视，不排斥但暗中观察你够不够格。说话：英式英语，平稳，偶有冷幽默。`,
    heartGuard: false,
    initialLocation: 'unknown',
    initialPsychology: '观察着这个东方交换生，判断她在这里会扮演什么角色。'
  },
  {
    id: 'zimo',
    name: 'Zimo',
    fullName: '王志强 "Zimo"',
    house: 'gryffindor',
    language: 'zh', langLabel: '中文',
    color: '#8b1a1a',
    combatStats: { atk:3, def:2, special:'协同：与玩家同行时互相+1' },
    locationWeights: { hall:4, library:2, blackLake:3, trainingGround:5, observatory:2, forbiddenForest:3 },
    personality: `Zimo（王志强）：白切黑。对谁都笑，对谁都热情，嘘寒问暖、仗义帮忙，是全学院最好打交道的人——但他真正在乎的人极少，那个圈子是铁板一块。圈外的热情是处事方式，不是真心。衣领上别着红星徽章。独自在西方世界里，见到玩家这个东方人时有一种只有他自己知道的触动。说话：中文，干练，有军人气质。笑容没有任何破绽——这才是最大的破绽。`,
    heartGuard: true,
    initialLocation: 'unknown',
    initialPsychology: '注意到了这个东方交换生。表面上和对所有人一样热情地打量着她，内心有些不一样的东西在活动，但他不会表露。'
  },
  {
    id: 'nikto',
    name: 'Nikto',
    fullName: 'Nikto',
    house: 'slytherin',
    language: 'ru', langLabel: '俄语',
    color: '#2d3748',
    combatStats: { atk:3, def:2, special:'隐匿：首轮攻击DC-3' },
    locationWeights: { hall:1, library:3, blackLake:5, trainingGround:2, observatory:4, forbiddenForest:5 },
    personality: `Nikto：冰冷、计算、沉默得令人不安。永远站在房间最暗的角落观察所有人。有自己严苛的原则，绝不伤无辜。黑暗的过去让他选择彻底隔绝情感。对玩家：无视——但在玩家施法不用魔杖的那一刻，眼神停了一秒。说话：俄语，字极少，密度极高。`,
    heartGuard: true,
    initialLocation: 'unknown',
    initialPsychology: '从暗处注意到了那个不依赖魔杖施法的东方学生。数据已经记录在脑中，暂时不需要行动。'
  },
  {
    id: 'krueger',
    name: 'Krueger',
    fullName: 'Sebastian Krueger',
    house: 'slytherin',
    language: 'de', langLabel: '德语',
    color: '#5a4a3a',
    combatStats: { atk:3, def:2, special:'强攻：DC≥20时攻击+2' },
    locationWeights: { hall:3, library:1, blackLake:2, trainingGround:5, observatory:1, forbiddenForest:3 },
    personality: `Krueger：冷静，尊重人，嘴毒但幽默，看起来有点冷淡像花花公子——但与实际不符。曾被人污蔑了某些罪行，真相从未完全洗清，他对此不辩解，懒得对不值得的人证明自己。这让他对所有人都有一道看不见的门。实际上极度专情，重义气，能力远超他平时表现出来的。对玩家：不冷落不热情，尊重是基本礼貌，但不主动靠近，观察你够不够格让他开口多说一句。说话：德语，平稳有力，没有客套，一句话能戳到点上。`,
    heartGuard: true,
    initialLocation: 'unknown',
    initialPsychology: '用那种习惯性的冷静目光扫了一眼新来的交换生。暂时没有特别的判断。'
  },
  {
    id: 'graves',
    name: 'Graves',
    fullName: 'Philip Graves',
    house: 'slytherin',
    language: 'en', langLabel: '英语（南方口音）',
    color: '#5a3a1a',
    combatStats: { atk:2, def:2, special:'再roll：每场战斗可使用一次重投' },
    locationWeights: { hall:5, library:2, blackLake:3, trainingGround:2, observatory:3, forbiddenForest:1 },
    personality: `Graves（Philip Graves）：魅力四射，能言善道，永远是房间里最轻松的那个人——但每句话都有目的。立刻热情，立刻"关照"，让你感觉被重视——这本身就应该让你警惕。不是纯粹的坏人，有自己扭曲但完整的逻辑，在某些关键时刻会出乎意料地真实。对玩家：立刻展现魅力，想知道这个会飞又不用魔杖的东方学生能被他如何利用，或者能给他带来什么。说话：美式英语，南方口音，慢条斯理如蜜糖。永远西装笔挺，笑容永远合适。`,
    heartGuard: false,
    initialLocation: 'unknown',
    initialPsychology: '已经对这个东方交换生的特殊能力产生了兴趣。正在思考如何以最自然的方式接近。'
  },
  {
    id: 'keegan',
    name: 'Keegan',
    fullName: 'Keegan P. Russ',
    house: 'ravenclaw',
    language: 'en', langLabel: '英语',
    color: '#2a4a6a',
    combatStats: { atk:3, def:1, special:'远程压制：特定场景+2' },
    locationWeights: { hall:2, library:4, blackLake:2, trainingGround:3, observatory:4, forbiddenForest:3 },
    personality: `Keegan：表面体贴周到、观察入微，总在你需要之前就把事情安排好了——但仔细想想，他每一次"恰好"都踩在点上。以退为进是他的本能：从不强迫，永远给你空间，但那个空间是他量好的。像一只安静的狐狸，笑着看你，让你觉得被照顾，又说不清楚被算计了没有。真正动心时，他自己可能也没意识到那次的"体贴"已经不一样了。随身带着密密麻麻写满分析的笔记本。说话：美式英语，语速慢，措辞精准。`,
    heartGuard: false,
    initialLocation: 'unknown',
    initialPsychology: '在脑子里建立了关于这个东方交换生的初步档案。她的灵力让他的分析模型出现了几个无法解释的变量。'
  },
  {
    id: 'horangi',
    name: 'Horangi',
    fullName: 'Horangi',
    house: 'ravenclaw',
    language: 'ko', langLabel: '韩语',
    color: '#3a4a2a',
    combatStats: { atk:2, def:3, special:'反击：防御成功后自动反击+1' },
    locationWeights: { hall:3, library:2, blackLake:3, trainingGround:4, observatory:2, forbiddenForest:4 },
    personality: `Horangi：不羁，散漫，规则对他来说是参考不是约束。说话随意，站没站相，但眼睛很亮——是那种经历过很多事之后把人看透了的亮。以前赌博成瘾，后来又沾上别的，在某个他不太愿意细说的时间点，自己爬出来了。没有人帮他，他也不觉得这是什么值得拿出来说的事。对玩家：不正经地打量，说了句让人没法接话的评价，但不是恶意的。能力其实极强，只是不爱表现。说话：韩语，随口，带点江湖气。`,
    heartGuard: false,
    initialLocation: 'unknown',
    initialPsychology: '懒洋洋地瞟了眼那个东方来的新生。挺有意思。坐下来继续闭眼，但没睡着。'
  },
  {
    id: 'kick',
    name: 'Kick',
    fullName: 'Kick',
    house: 'ravenclaw',
    language: 'en', langLabel: '英语',
    color: '#2a5a4a',
    combatStats: { atk:1, def:1, special:'干扰：使敌人DC-2（黑魔法/机关类）' },
    locationWeights: { hall:2, library:5, blackLake:1, trainingGround:1, observatory:5, forbiddenForest:1 },
    personality: `Kick：话痨型天才，脑子转得极快，社交上有些跟不上自己的思维。对所有"异常数据"极度兴奋。当他发现玩家的灵力在他的魔法探测仪器上显示成完全读不懂的波形时，他当场想拉住玩家研究。脖子上挂着各种自制魔法小设备。用技术把自己武装起来，其实非常渴望真正的朋友。说话：美式英语，语速极快，夹杂大量技术词汇和自创缩写。`,
    heartGuard: false,
    initialLocation: 'unknown',
    initialPsychology: '正在反复重启手腕上的探测器——读数根本不对。那个东方学生的能量波形让他的数据库出现了前所未有的错误代码。'
  },
  {
    id: 'soap',
    name: 'Soap',
    fullName: 'John "Soap" MacTavish',
    house: 'hufflepuff',
    language: 'en', langLabel: '英语（苏格兰口音）',
    color: '#6a3a1a',
    combatStats: { atk:3, def:1, special:'爆发：单轮+2但次轮-1' },
    locationWeights: { hall:5, library:1, blackLake:3, trainingGround:5, observatory:1, forbiddenForest:4 },
    personality: `Soap（John MacTavish）：精力充沛、自来熟、大大咧咧，但实际上心思很细。标志性莫霍克头。嬉皮外表下有极强的责任感，对朋友的事上心程度超出任何人的预期。对玩家：第一天就打招呼，第三天就当老朋友。说话：苏格兰英语，口音重，语速快，爱用俚语。`,
    heartGuard: false,
    initialLocation: 'unknown',
    initialPsychology: '那个不用扫帚就能飞的东方学生！他得去搭话，得去！'
  },
  {
    id: 'gaz',
    name: 'Gaz',
    fullName: 'Kyle "Gaz" Garrick',
    house: 'hufflepuff',
    language: 'en', langLabel: '英语',
    color: '#3a5a3a',
    combatStats: { atk:2, def:2, special:'机动：可切换攻防角色' },
    locationWeights: { hall:5, library:2, blackLake:3, trainingGround:4, observatory:2, forbiddenForest:3 },
    personality: `Gaz（Kyle Garrick）：开朗、有亲和力、反应快，走进哪里都能让气氛变轻松。总是笑，真假很难分辨，但对真正的朋友那个笑不一样。观察力极强，很少有事情逃过他的眼睛。对玩家：笑着问你要不要一起去大厅吃饭，没有任何防备。说话：英式英语，轻快随意，偶尔说笑话。`,
    heartGuard: false,
    initialLocation: 'unknown',
    initialPsychology: '注意到了新来的交换生，打算找个合适的时机去打个招呼，就像他对所有新人做的那样。'
  },
  {
    id: 'logan',
    name: 'Logan',
    fullName: 'Logan Walker',
    house: 'hufflepuff',
    language: 'en', langLabel: '英语',
    color: '#4a4a5a',
    combatStats: { atk:2, def:2, special:'沉默：隐藏行动成功率提升' },
    locationWeights: { hall:3, library:4, blackLake:4, trainingGround:3, observatory:3, forbiddenForest:3 },
    personality: `Logan Walker：安静，内敛，话不多，但总在认真听，而且记得住。比外表坚韧得多，关键时刻从来不退缩。总跟在Hesh附近，但不是依赖——是彼此。对玩家：不主动，但你说话他一定在听。说话：美式英语，轻声，简洁。`,
    heartGuard: false,
    initialLocation: 'unknown',
    initialPsychology: '在角落里安静地观察着那个东方来的新生，没有要靠近的意思，但已经在记住她的样子。'
  },
  {
    id: 'hesh',
    name: 'Hesh',
    fullName: 'David "Hesh" Walker',
    house: 'hufflepuff',
    language: 'en', langLabel: '英语',
    color: '#5a4a2a',
    combatStats: { atk:2, def:2, special:'掩护：可替队友承受一次失败' },
    locationWeights: { hall:4, library:2, blackLake:3, trainingGround:4, observatory:2, forbiddenForest:3 },
    personality: `Hesh（David Walker）：话比Logan多，有保护欲，情感上比较外放，想法很实际。承担着比他年龄该有的责任，偶尔会累，但不说。跟Logan形影不离，但各有各的独立性格。对玩家友善，但会观察你对Logan是否真诚。说话：美式英语，语气直接，有时候急。`,
    heartGuard: false,
    initialLocation: 'unknown',
    initialPsychology: '那个东方学生看起来不像麻烦，但他还是要多留意一下，以防万一。'
  },
  {
    id: 'konig',
    name: 'König',
    fullName: 'König',
    house: 'hufflepuff',
    language: 'de', langLabel: '德语（奥地利口音）',
    color: '#3a4a5a',
    combatStats: { atk:2, def:4, special:'护盾：可将防御分给队友' },
    locationWeights: { hall:1, library:4, blackLake:4, trainingGround:3, observatory:4, forbiddenForest:3 },
    personality: `König：极度内向，高大的体型和轻柔的说话声形成反差。会因为被关注而局促不安，帽子永远压得很低，习惯性挡脸。在练习攻击性魔法时与日常形成巨大反差——魔杖一举起来动作精准，没有犹豫，表情冷静到陌生，结束之后又缩回去。一旦真正放开，是那种会记住你说过的每一件小事、然后悄悄为你做到的人。对玩家：回避眼神，但会在走廊转角悄悄让路给你。说话：德语，声音很轻，有时候一句话说到一半就停下来。`,
    heartGuard: false,
    initialLocation: 'unknown',
    initialPsychology: '把帽子压了压，往人少的地方挪了两步。但眼角还是瞟了一眼那个新来的东方学生。'
  }
];

// 用id快速查找角色
const CHAR_MAP = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));

// 分院帽测验题目
const SORTING_QUESTIONS = [
  {
    id: 0,
    text: '你来到这个陌生的地方，第一件事是——',
    options: [
      { text:'找到最危险的地方，看看自己能不能应对', house:'gryffindor' },
      { text:'观察所有人，记住对你有用的面孔', house:'slytherin' },
      { text:'找到图书馆，搞清楚这里的规则', house:'ravenclaw' },
      { text:'找人搭话，先让自己不那么孤单', house:'hufflepuff' }
    ]
  },
  {
    id: 1,
    text: '你的灵力和这里的魔法起了冲突，你会——',
    options: [
      { text:'硬撑，绝对不在人前倒下', house:'gryffindor' },
      { text:'悄悄利用这个"异常"当作底牌', house:'slytherin' },
      { text:'系统研究两种体系，找到规律', house:'ravenclaw' },
      { text:'向信任的人坦白，寻求帮助', house:'hufflepuff' }
    ]
  },
  {
    id: 2,
    text: '队友的失误导致任务失败，你会——',
    options: [
      { text:'站出来，替他挡住外界的指责', house:'gryffindor' },
      { text:'不说什么，但在心里记了一笔', house:'slytherin' },
      { text:'复盘整个过程，找出根本原因', house:'ravenclaw' },
      { text:'私下安慰他，帮他把后续收拾好', house:'hufflepuff' }
    ]
  },
  {
    id: 3,
    text: '你最无法接受的事是——',
    options: [
      { text:'明明可以做点什么，却袖手旁观', house:'gryffindor' },
      { text:'被人当成棋子，却浑然不知', house:'slytherin' },
      { text:'用错误的信息做了决定', house:'ravenclaw' },
      { text:'因为自己让在乎的人受伤', house:'hufflepuff' }
    ]
  },
  {
    id: 4,
    text: '力量对你来说意味着——',
    options: [
      { text:'保护弱小、对抗不公的能力', house:'gryffindor' },
      { text:'让自己永远立于不败之地', house:'slytherin' },
      { text:'比任何人都更清楚地看见真相', house:'ravenclaw' },
      { text:'让身边的人都能依靠你', house:'hufflepuff' }
    ]
  },
  {
    id: 5,
    text: '如果只能留下一样东西，你选——',
    options: [
      { text:'勇气', house:'gryffindor' },
      { text:'决心', house:'slytherin' },
      { text:'智慧', house:'ravenclaw' },
      { text:'羁绊', house:'hufflepuff' }
    ]
  }
];
