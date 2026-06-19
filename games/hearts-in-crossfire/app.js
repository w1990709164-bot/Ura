const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const STORE = "hc21_save_v8";
const API_STORE = "hc21_api_v1";


// 里世界统一 API：只从总入口 index.html 保存的 LW_API_* 读取。
// 旧的 hc21_api_v1 仅作为模型列表缓存/历史兼容，不再作为本游戏的独立 API 设置来源。
function readLegacyApiConfig(){
  try{ return JSON.parse(localStorage.getItem(API_STORE)||"{}"); }catch{ return {}; }
}

function getApiConfig(){
  const legacy=readLegacyApiConfig();
  return {
    url:   localStorage.getItem('LW_API_URL')   || '',
    key:   localStorage.getItem('LW_API_KEY')   || '',
    model: localStorage.getItem('LW_API_MODEL') || legacy.model || 'gpt-4o-mini',
    models: legacy.models || []
  };
}

function ensureApiReady(cfg=getApiConfig()){
  if(!cfg.key) throw new Error('未设置 API Key，请返回里世界首页点击“设置 API”');
  if(!cfg.model) throw new Error('未设置模型名称，请返回里世界首页点击“设置 API”');
}

function splitSystemMessages(messages){
  const system=[];
  const rest=[];
  (messages||[]).forEach(m=>{
    if(!m) return;
    if(m.role==='system') system.push(m.content||'');
    else if(m.role==='assistant' || m.role==='user') rest.push({role:m.role,content:String(m.content||'')});
  });
  if(!rest.length) rest.push({role:'user',content:'继续'});
  return {system:system.join('\n\n'), messages:rest};
}

async function callChatModel(cfg, messages, options={}, timeoutMs=60000){
  ensureApiReady(cfg);
  if(cfg.url){
    const headers={'Content-Type':'application/json','Authorization':`Bearer ${cfg.key}`};
    const res=await fetchWithTimeout(apiEndpoint(cfg.url),{
      method:'POST',
      headers,
      body:JSON.stringify({
        model:cfg.model,
        messages,
        max_tokens:options.max_tokens || 1400,
        temperature:options.temperature ?? 0.85
      })
    },timeoutMs);
    if(!res.ok) await throwResponseError(res);
    return await res.json();
  }
  const anth=splitSystemMessages(messages);
  const res=await fetchWithTimeout('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key':cfg.key,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body:JSON.stringify({
      model:cfg.model,
      system:anth.system || undefined,
      messages:anth.messages,
      max_tokens:options.max_tokens || 1400,
      temperature:options.temperature ?? 0.85
    })
  },timeoutMs);
  if(!res.ok) await throwResponseError(res);
  return await res.json();
}

const cast = [
  { id:"keegan", code:"KR", name:"Keegan P. Russ", unit:"GHOSTS · SGT", role:"精锐侦察兵", status:"尚未正式交谈", hook:"沉默不是冷漠，而是他最熟悉的生存方式。", reason:"强制休假与社会适应评估。", style:"以行动补位，镜头外的偏心远比语言明显。", secret:"他拥有一次提前退出节目的机会。", language:"English / 中文翻译" },
  { id:"krueger", code:"SK", name:"Sebastian Krueger", unit:"CHIMERA · EX-KSK", role:"特种行动人员", status:"保持警戒", hook:"他不相信安排好的巧合，包括你。", reason:"以公开合作换取一项内部审查。", style:"试探、审视，然后给予极少见的信任。", secret:"入住前已经调查过玩家。", language:"Deutsch / 中文翻译" },
  { id:"ghost", code:"GH", name:"Simon “Ghost” Riley", unit:"TF141 · LT", role:"特种作战中尉", status:"拒绝营业", hook:"观众以为他讨厌你。也可能他只是讨厌摄像机。", reason:"心理恢复与公众合作任务。", style:"守住边界，用行动照顾，用冷笑话否认。", secret:"节目组要求他隐瞒一场安全事故。", language:"English / 中文翻译" },
  { id:"nikto", code:"NK", name:"Nikto", unit:"KORTAC · EX-FSB", role:"深潜行动人员", status:"正在观察你", hook:"他的目光像在确认一件只有他知道答案的事。", reason:"社会功能评估与暂时脱离任务体系。", style:"反复确认、守在附近，对清晰的回答形成依赖。", secret:"他并不完全符合公开的筛选结果。", language:"Русский / 中文翻译" },
  { id:"konig", code:"KG", name:"König", unit:"KORTAC", role:"大型战术行动人员", status:"回避镜头", hook:"两米高的阴影努力把自己藏进房间最远的角落。", reason:"公众形象合作与非战斗环境评估。", style:"小心询问，克制靠近，失衡时却极有压迫感。", secret:"组织可随时将他召回。", language:"Deutsch / 中文翻译" },
  { id:"zimo", code:"ZM", name:"王志强 “Zimo”", unit:"PSYOPS · SPECIAL OPS", role:"心理战行动人员", status:"从容友善", hook:"他帮所有人适应镜头，唯独没有说明自己为何如此熟练。", reason:"表面为嘉宾，实际负责评估计划风险。", style:"记住习惯、控制节奏，用体贴隐藏占有。", secret:"定期提交包括玩家在内的观察报告。", language:"中文 / English" }
];

const basePairRelations = {
  "ghost|keegan":62,"konig|krueger":38,"nikto|zimo":32,"ghost|konig":42,
  "keegan|nikto":46,"ghost|zimo":45,"keegan|konig":48,"krueger|zimo":35
};
function pairKey(a,b){ return [a,b].sort().join("|"); }
function createPairRelations(){
  const out={};
  cast.forEach((a,i)=>cast.slice(i+1).forEach(b=>out[pairKey(a.id,b.id)]=basePairRelations[pairKey(a.id,b.id)]??40));
  return out;
}

const achievements = [
  {id:"arrival", icon:"⌂", name:"欢迎入住", desc:"完成核心女嘉宾登记并抵达别墅。"},
  {id:"firstLook", icon:"◉", name:"第一道视线", desc:"与任意男嘉宾产生第一次明确互动。"},
  {id:"signal", icon:"◇", name:"第一颗子弹", desc:"发出第一封匿名心动短信。"},
  {id:"allVotes", icon:"✦", name:"全票焦点", desc:"同一晚收到六人的心动短信。"},
  {id:"offCamera", icon:"◫", name:"他根本没在看镜头", desc:"发现Keegan镜头外的偏心。"},
  {id:"skullJealous", icon:"☠", name:"骷髅也会吃醋", desc:"让Ghost主动介入一次约会。"},
  {id:"wrongAustrian", icon:"⚠", name:"错误的奥地利人", desc:"在同一事件中惹恼König和Krueger。"},
  {id:"understood", icon:"⌁", name:"听得懂", desc:"听懂一段本不打算让你知道的外语。"},
  {id:"myTurn", icon:"+", name:"这次换我来", desc:"在危机中帮助任意男嘉宾。"},
  {id:"honestFail", icon:"≈", name:"承认不会也很酷", desc:"坦白短板并完成一次挑战。"},
  {id:"rules", icon:"∞", name:"规则之外", desc:"解锁任意多人关系结局。"},
  {id:"winner", icon:"♛", name:"真正的赢家", desc:"独自离开，且六人均对你达到真心。"}
];

let state = {
  contentRevision:8, started:false, day:1, scene:0, profile:null, achievements:[], firstFocus:null,
  signalSent:null, signalError:null, signalCommitted:false, relations:Object.fromEntries(cast.map(c=>[c.id,{stage:0,heart:0,trust:0,respect:0,desire:0,jealousy:0,safety:35}])),
  pairRelations:createPairRelations(),
  history:[], memories:[], dailyLog:[], dynamicScene:null, daySlot:0, usedFocus:[], receivedSignals:[], daySceneHistory:[],
  playthrough:1, ending:null, endingText:"", endingChoice:null, routePolicy:"undecided"
};

const dayPrograms = [
  null,
  {theme:"初次交火", activity:"入住、初印象与第一封匿名短信", twist:"所有人仍把节目当成任务"},
  {theme:"六人早餐", activity:"自由选座、共同采购与首次单采", twist:"节目组公开部分初印象关键词"},
  {theme:"搭档厨房", activity:"抽签料理与临时换搭档", twist:"专长或短板必须影响过程"},
  {theme:"默契行动", activity:"非战斗协作挑战", twist:"胜负之外更重视边界和临场判断"},
  {theme:"第一场约会", activity:"玩家主动邀请一人，其他人在别墅自由行动", twist:"未被选择者也会产生独立事件"},
  {theme:"真话与假话", activity:"每人提交三条真假信息", twist:"某条秘密会与玩家隐藏面产生呼应"},
  {theme:"水边夜宴", activity:"泳池、篝火与真心话", twist:"成熟暧昧开放，但必须尊重内容设置"},
  {theme:"强制交换", activity:"与近期互动较少者约会", twist:"节目组故意打乱玩家原本的节奏"},
  {theme:"六份邀请", activity:"男嘉宾自主发出邀约，玩家最多接受两份", twist:"邀请可能彼此冲突"},
  {theme:"心动公开日", activity:"公布模糊排名与观众猜测", twist:"首次大型公开修罗场"},
  {theme:"匿名问题箱", activity:"恋爱史、边界与关系观", twist:"诚实比讨喜更重要"},
  {theme:"无脚本旅行", activity:"玩家选择两人同行", twist:"三人关系首次被真正检验"},
  {theme:"秘密房间", activity:"邀请一人进行不公开的长谈", twist:"可触发关系阶段专属秘密"},
  {theme:"全屋停电", activity:"停电与通讯中断", twist:"玩家专长、短板或恐惧必然触发"},
  {theme:"中期选择", activity:"公开选择一人、多人或拒绝回答", twist:"决定多人路线是否继续开放"},
  {theme:"未播片段", activity:"观看单采与争议剪辑", twist:"玩家可质疑节目组叙事"},
  {theme:"紧急召回", activity:"真实安全警报与临时调离", twist:"所有人恢复军事职业状态"},
  {theme:"重返别墅", activity:"战损照顾、争执与情绪回落", twist:"关系由心动转向现实承受力"},
  {theme:"镜头之外", activity:"无摄像机约会", twist:"关系确认后才允许后期亲密事件"},
  {theme:"坦白之夜", activity:"秘密、嫉妒、承诺与关系边界", twist:"多人路线必须获得明确同意"},
  {theme:"最终告白", activity:"最后谈话、选择与离开", twist:"单人、多人、规则之外或独自离开"}
];

const slotNames = ["晨间共处","主题活动","自由行动","晚间交锋"];
const slotContracts = [
  {purpose:"用自然偶遇承接昨夜短信，只建立当天情绪，不完成今日主题任务",preferred:"卧室走廊、早餐桌、庭院晨跑区或咖啡台",forbidden:"正式约会、集体挑战、长篇采访、夜间场景"},
  {purpose:"完整执行今日节目主题，必须有明确规则、搭档或胜负压力",preferred:"采购地、挑战场地、工作室、户外场地或公共活动区",forbidden:"只聊天不做活动、重复晨间吃饭、提前进行夜间短信"},
  {purpose:"脱离正式任务，制造镜头外偶遇、个人采访、未被选择者支线或玩家主动探索",preferred:"单采室、车内、海边步道、露台、器材间、影音室、便利店或返程途中",forbidden:"再次执行主题活动、重复上午地点、普通集体吃饭"},
  {purpose:"回收白天未解决的情绪，形成晚餐后的私下交锋或修罗场，并通向匿名短信",preferred:"夜间露台、客厅、泳池边、走廊、庭院火炉或熄灯后的公共区",forbidden:"开始新的大型挑战、重复白天活动过程、直接跳到第二天"}
];

const episodeBeats = {
  2:[
    {name:"早餐选座",must:"七人第一次共同早餐。玩家必须自由选座；至少两名男嘉宾通过落座、换位或递物表现初印象。出现一张节目组任务卡。",format:"task"},
    {name:"双人采购",must:"节目组抽签分成采购搭档。明确公布玩家的搭档与购物清单，并让另一名嘉宾因临时缺货、路线或节目组安排短暂介入。必须真正离开别墅。",format:"activity"},
    {name:"首次单采",must:"进入独立单采室。先呈现一名男嘉宾对玩家的未播采访，再让玩家面对一个尖锐但可拒绝回答的问题。不得回厨房。",format:"interview"},
    {name:"初印象关键词",must:"晚餐后节目组公开匿名初印象关键词，并插入观察室对关系走向的争论。至少一个关键词造成误会或错认，最后通向心动短信。",format:"observer"}
  ],
  3:[
    {name:"搭档揭晓",must:"节目组在早餐后公布厨房挑战规则与抽签结果。明确主搭档、菜品主题、限制食材和计时规则；未抽中玩家的人必须有不同反应。",format:"task"},
    {name:"限时厨房",must:"完整执行料理挑战：备料、分工、一次具体失误或专长发挥、其他组的竞争。不能只站着聊天。必须有倒计时与节目组临时加码。",format:"activity"},
    {name:"收尾死角",must:"挑战结束后的清理或等待评审时间。选择一名未与玩家搭档的嘉宾触发镜头死角支线，内容必须与白天竞争结果有关。",format:"offcamera"},
    {name:"盲评与单采",must:"公布盲评结果，但胜负不能替代感情发展。插入两名男嘉宾互相矛盾的单采，以及观察室捕捉到的一个微动作，最后通向短信。",format:"observer"}
  ],
  4:[
    {name:"默契搭档公布",must:"节目组发布非战斗协作挑战，玩家先选择或抽取一名主搭档。任务卡必须给出路线、限制和安全退出规则。",format:"task"},
    {name:"协作挑战",must:"完整执行需要沟通、平衡或盲区指引的挑战。玩家专长或短板必须真正改变策略，不允许男嘉宾包办。",format:"activity"},
    {name:"失误复盘",must:"进入器材区或返程车内复盘一次具体失误。主搭档与一名旁观者对玩家的判断产生分歧。",format:"offcamera"},
    {name:"默契榜单",must:"节目组公布匿名默契评价，观察室讨论保护欲与控制欲的区别，引出夜间短信。",format:"observer"}
  ],
  5:[
    {name:"邀约权交付",must:"任务卡宣布玩家拥有第一次正式邀约权。六名男嘉宾以符合性格的方式表达期待或回避，不得集体争抢。",format:"task"},
    {name:"第一次正式约会",must:"玩家与当前选择倾向最高者离开别墅完成有起承转合的约会；必须出现一个价值观分歧或现实职业问题。",format:"activity"},
    {name:"落选者支线",must:"切到别墅中未被邀请者的未播单采或相互试探，让未被选中产生真实后续而不是静止等待。",format:"interview"},
    {name:"约会归来",must:"玩家回到别墅后面对克制的追问、误解或位置变化；观察室不能直接断言恋爱结果。",format:"observer"}
  ],
  6:[
    {name:"真假档案",must:"节目组发布三真一假或两真一假的秘密卡规则，明确禁止涉及机密行动细节。",format:"task"},
    {name:"秘密判断",must:"让玩家根据细节判断至少两名嘉宾的信息，答错也必须产生有趣关系后果。",format:"activity"},
    {name:"隐藏面呼应",must:"玩家填写的隐藏面被节目问题间接触及，但是否公开由玩家决定；一名角色察觉其保留。",format:"offcamera"},
    {name:"答案揭晓",must:"揭晓部分真假信息并保留至少一个长期秘密；插入单采与观察室不同解读。",format:"observer"}
  ],
  7:[
    {name:"水边规则",must:"发布泳池与篝火夜宴规则，包括衣着自主、身体接触需确认、任何人可退出。",format:"task"},
    {name:"水边活动",must:"完整执行水上或岸边团队游戏。若玩家不擅长游泳或有相关短板，必须提供坦白、替代参与和退出三种尊重选择。",format:"activity"},
    {name:"更衣前后",must:"在不物化玩家的前提下写成熟吸引力与镜头压力；出现镜头死角或递毛巾等克制互动。",format:"offcamera"},
    {name:"篝火真心话",must:"进行成人之间有边界的真心话，至少一人拒答；观察室讨论拒绝是否也是诚实。",format:"observer"}
  ],
  8:[
    {name:"强制交换公布",must:"节目组故意将玩家与近期互动较少的嘉宾配对，说明交换规则与不可私换约会对象。",format:"task"},
    {name:"低好感约会",must:"完整生成一次并非天然顺利的约会，通过共同任务或分歧产生新的认识，不得强行心动。",format:"activity"},
    {name:"原倾向者反应",must:"玩家原本互动较多的角色在单采或镜头死角表现复杂反应，但不能幼稚争宠。",format:"interview"},
    {name:"交换后晚餐",must:"两条关系线发生错位或重新评估，观察室指出节目组剪辑可能误导。",format:"observer"}
  ],
  9:[
    {name:"六份邀请",must:"节目组逐一投递男嘉宾邀约卡。邀请内容与方式必须符合角色，允许有人不发。",format:"task"},
    {name:"冲突邀约",must:"玩家最多接受两份时间可能冲突的邀请，并在具体活动中做取舍；未接受者得到明确但不羞辱的反馈。",format:"activity"},
    {name:"等待与取消",must:"描写一名等待、改期或主动撤回邀约的嘉宾支线，体现尊严与误会。",format:"offcamera"},
    {name:"邀请复盘",must:"公开邀请数量但不公布对象，插入两份单采与观察室推理。",format:"observer"}
  ],
  10:[
    {name:"公开心动日",must:"节目组公布模糊热度排名、观众CP猜测和匿名关键词，不公开精确关系数值。",format:"task"},
    {name:"双人直播任务",must:"玩家被安排与非最高倾向者完成直播默契任务，弹幕和主持问题制造压力。",format:"activity"},
    {name:"剪辑争议",must:"玩家发现节目组把某段互动剪成与事实不同的含义，可选择质疑、沉默或保护某人。",format:"offcamera"},
    {name:"首次公开修罗场",must:"至少三名嘉宾围绕剪辑、排名或玩家选择产生克制冲突；观察室明确区分竞争与占有。",format:"observer"}
  ],
  11:[
    {name:"匿名问题箱",must:"公布问题箱规则和可拒答权，问题涉及恋爱史、长期关系、忠诚与隐私。",format:"task"},
    {name:"边界问答",must:"玩家至少面对一个尖锐问题并拥有诚实、保留、反问和拒答路径。角色反应取决于尊重而非答案是否讨喜。",format:"activity"},
    {name:"问题来源",must:"一名角色怀疑问题由节目组改写，另一名角色认为回答本身更重要，形成价值观分歧。",format:"offcamera"},
    {name:"关系观单采",must:"两名男嘉宾谈论排他关系或复杂关系的真实态度，为多人结局建立安全感数据。",format:"interview"}
  ],
  12:[
    {name:"旅行分组",must:"玩家选择两名同行者进行无脚本一日旅行，节目组只提供目的地与返程时间。",format:"task"},
    {name:"三人旅行",must:"完整执行交通、共同体验和一次意外分歧；三人不能只围绕争抢玩家，也要有彼此合作或判断。",format:"activity"},
    {name:"短暂走散",must:"通过玩家短板、路线或突发状况制造短暂分开，谁来寻找与如何寻找必须符合性格。",format:"offcamera"},
    {name:"返程沉默",must:"车内或归家后回收三人之间没说开的情绪，观察室讨论这是否是兼容还是暂时停火。",format:"observer"}
  ],
  13:[
    {name:"秘密房间规则",must:"节目组开放无直播的秘密房间，说明仍保留安全记录、玩家可随时退出，并由玩家邀请一人。",format:"task"},
    {name:"彻夜长谈",must:"围绕被邀请者的专属秘密、职业代价或真实参演原因展开，关系不足时只能透露部分。",format:"activity"},
    {name:"门外的人",must:"未被邀请者之一在单采谈及自己的反应，不贬低玩家也不攻击被邀请者。",format:"interview"},
    {name:"清晨离开房间",must:"以镜头捕捉到的细节制造舆论，但不能默认发生亲密行为；观察室讨论事实与想象。",format:"observer"}
  ],
  14:[
    {name:"停电预兆",must:"节目组活动前出现电力与通讯异常，明确安全广播和人员位置。",format:"task"},
    {name:"全屋停电",must:"停电成为真实突发状况。玩家专长、短板或恐惧必须改变行动；提供自救、求助和协作选择。",format:"activity"},
    {name:"黑暗中的选择",must:"无镜头或仅夜视条件下，角色通过声音、站位与确认表达信任，不得借停电强迫亲密。",format:"offcamera"},
    {name:"恢复供电",must:"节目组解释事故并接受质疑；观察室讨论镜头关闭时谁仍然保持同样态度。",format:"observer"}
  ],
  15:[
    {name:"中期选择公告",must:"节目组要求玩家公布目前最想继续了解的一人或多人，也允许拒绝单选。明确该选择会影响后续约会权。",format:"task"},
    {name:"公开回答",must:"让玩家真正作出单人、多人、暂不回答或反对规则的选择；不得由AI替她决定。",format:"activity"},
    {name:"选择余震",must:"分别呈现被选者与未被选者的克制反应，诚实多选不能被系统自动判为欺骗。",format:"offcamera"},
    {name:"路线结算",must:"观察室讨论诚实与摇摆的差别；节目组更新后半程规则并通向短信。",format:"observer"}
  ],
  16:[
    {name:"未播片段开放",must:"节目组让玩家选择观看两段男嘉宾未播单采，并提示剪辑顺序可能影响理解。",format:"task"},
    {name:"看片与质疑",must:"播放至少两段具体单采，一段温和一段具有争议；玩家可要求查看上下文。",format:"interview"},
    {name:"制作组交涉",must:"玩家发现恶意或误导剪辑后与制作组交涉，可保护自己或某位嘉宾。",format:"offcamera"},
    {name:"公开回应",must:"节目组决定是否更正片段；观察室承认自身也可能被剪辑带偏。",format:"observer"}
  ],
  17:[
    {name:"异常广播",must:"原定军事展示前出现真实安全警报。任务卡中断，节目组启动封锁与保密流程。",format:"task"},
    {name:"紧急召回",must:"六名男嘉宾恢复职业状态并被临时调离。玩家不得加入战斗，但可凭专长协助后勤、急救、信息或稳定现场。",format:"activity"},
    {name:"离开之前",must:"只允许极短的告别或未完成承诺，体现任务优先与无法解释全部工作的现实。",format:"offcamera"},
    {name:"无短信之夜",must:"节目停播或延迟，观察室取消娱乐化评论，只展示制作组通告与玩家可做的等待选择。",format:"observer"}
  ],
  18:[
    {name:"归队消息",must:"节目组确认人员返程但不公布行动细节，玩家选择迎接方式与是否参与照护。",format:"task"},
    {name:"重返别墅",must:"角色带着疲惫或轻微战损回来。照护必须询问同意，玩家专长可发挥但不能爱情治愈创伤。",format:"activity"},
    {name:"情绪爆发",must:"至少一名角色因风险、隐瞒或被等待产生真实争执；冲突不能靠拥抱自动解决。",format:"offcamera"},
    {name:"现实问题单采",must:"单采讨论节目结束后任务、失联和死亡风险，观察室停止只谈甜度。",format:"interview"}
  ],
  19:[
    {name:"无镜头约会权",must:"节目组提供一次真正无拍摄团队随行的约会，仅保留安全联络。玩家选择对象，未达到关系门槛则转为深度谈话。",format:"task"},
    {name:"镜头之外",must:"完成一次与职业现实、未来安排和身体边界有关的约会。成熟或成人内容必须检查设置、阶段、信任与明确同意。",format:"activity"},
    {name:"关系确认",must:"玩家可确认、暂缓或拒绝关系；成人内容不是奖励，拒绝不能扣尊重。",format:"offcamera"},
    {name:"归来后的空白",must:"节目组只能拍到归来后的状态，观察室不得编造私密细节。",format:"observer"}
  ],
  20:[
    {name:"坦白夜规则",must:"公布秘密、嫉妒、承诺与关系边界协商规则，任何人可退出多人讨论。",format:"task"},
    {name:"真相与报告",must:"揭露仍未解决的真实参演原因、Zimo观察报告或节目组操控等关键秘密，依据路线选择相关内容。",format:"activity"},
    {name:"关系协商",must:"玩家明确表达单人、多人的可能性或尚未决定；多人关系必须让每位参与者分别同意并提出边界。",format:"offcamera"},
    {name:"最终夜前单采",must:"至少三名仍具结局资格者做最终单采，明确他们可以拒绝不适合自己的关系。",format:"interview"}
  ],
  21:[
    {name:"最后自由谈话",must:"玩家可依次与具备结局资格的人进行最后短谈，补齐误会但不能临时刷满关系。",format:"task"},
    {name:"最终告白",must:"根据关系门槛生成真实告白或不告白，玩家选择一人、符合条件的多人、拒绝节目规则或独自离开。",format:"activity"},
    {name:"离开别墅",must:"执行玩家选择并生成对应结局，不允许节目组替玩家改答案。",format:"offcamera"},
    {name:"三个月后",must:"生成三个月后采访与后日谈，回应职业现实、关系边界和节目播出影响。",format:"observer"}
  ]
};

function currentBeat(){
  return episodeBeats[state.day]?.[state.daySlot] || {
    name:slotNames[state.daySlot],
    must:slotContracts[state.daySlot].purpose,
    format:"story"
  };
}

function intimacyDirective(){
  const level=state.profile?.contentLevel||"fade";
  const focus=(state.dynamicScene?.focus||[]).map(id=>state.relations[id]).filter(Boolean);
  const ready=focus.some(r=>r.stage>=4&&r.trust>=55&&r.respect>=45);
  const boundaries=state.profile?.boundaries?`永久禁用内容：${state.profile.boundaries}。`:"";
  if(level==="fade") return `${boundaries}亲密内容关闭：最多写拥抱或亲吻，随后淡出。`;
  if(level==="mature") return `${boundaries}成熟模式：允许明显欲望张力、经确认的身体接触与事后氛围，但不细写过程。`;
  if(state.day<19 || !ready) return `${boundaries}成人模式已开启，但当前日期或关系门槛不足：只能写成熟张力，禁止完整私密过程。`;
  return `${boundaries}成人模式且关系门槛可能满足：只有玩家主动选择、角色逐步明确确认同意、场景安全私密时才可进入成人内容；任何迟疑立即停止，多人内容必须在Day20完成关系协商后。`;
}

const characterBible = {
  keegan:`Keegan P. Russ：Ghosts侦察兵。寡言、耐心、警觉，习惯先确认出口、遮挡和风险。关心通过提前处理麻烦、记住实用细节、站在摄像死角实现；绝不突然甜言蜜语。吃醋时更沉默、更高效地抢先做完别人想做的事。英语短句，偶尔极淡的冷幽默。`,
  krueger:`Sebastian Krueger：前KSK、现Chimera。高戒备、阴郁、干涩毒舌，厌恶被操控，对节目组抱有敌意。喜欢通过提问和小陷阱验证诚实；玩家不讨好、不退缩时才逐渐尊重。德语为主并附中文。不能写成König，也不能写成普通傲娇。`,
  ghost:`Simon “Ghost” Riley：TF141中尉。极冷静、少言、黑色幽默，骷髅面罩不摘，不描写面部表情。以站位、视线、声线和行动保护边界。公共场合疏离，私下照顾后嘴上否认。吃醋不是幼稚争宠，而是精准打断、改变安排或冷淡质问。英语并附中文。`,
  nikto:`Nikto：前FSB，创伤与解离并存。语言可能使用“我们”，但不能把精神创伤写成猎奇疯癫或爱情治愈。观察细致，重视明确回答、可预测边界与反复确认。允许玩家拒绝、离开或要求空间。俄语并附中文，句子短、偶有断裂。`,
  konig:`König：KorTac大型战术人员，身高压迫感强但社交高度谨慎。镜头前回避、行动前询问是否可以；喜欢后依赖与占有欲从站位、等待和德语失言里泄露。不能写成天真大型犬或只会害羞。德语为主并附中文，偶尔英语。`,
  zimo:`王志强“Zimo”：心理战与特殊行动人员。中文为主，温和从容，偶尔天津口吻；善于记住习惯、调节气氛和不动声色地控制谈话方向。越动心越可能为玩家隐瞒观察报告。真正生气时天津话消失、普通话过分标准。不能写成单纯暖男。`
};

const proseBible = `文风目标：成熟、克制、具有电影镜头感的中文长篇互动小说，而不是游戏任务摘要。
1. 每幕必须有具体空间、声音、光线、温度或气味，环境应参与情绪。
2. 用动作链表现潜台词：谁先看谁、谁挪了杯子、谁挡住镜头、谁停顿后改口。禁止直接概括“气氛暧昧”“火花四射”“他显然吃醋”。
3. 对话必须有前因后果和弦外之音，不能六人轮流发表一句标签化台词。
4. 一幕只围绕一个小冲突或欲望推进，结束时留下未说完的话、动作或选择压力。
5. 玩家是有职业、专长和短板的成年女人，不是被围观的奖品；不得替她脸红、心跳、害怕、感动或自动接受接触。
6. 慢热。阶段0-1只允许注意、评估、礼貌试探和很小的偏心；阶段2-3才允许明显暧昧和醋意；阶段4以上才允许承认感情。
7. 避免高频陈词：狭长的眼眸、嘴角勾起、危险的气息、不容拒绝、该死的甜美、猎物、磁性嗓音。`;

function apiEndpoint(url){
  const base=String(url||"http://127.0.0.1:7897/v1").replace(/\/$/,"");
  return /\/chat\/completions$/i.test(base) ? base : `${base}/chat/completions`;
}

async function fetchWithTimeout(url, options={}, timeoutMs=60000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    return await fetch(url,{...options,signal:controller.signal});
  }catch(e){
    if(e.name==="AbortError") throw new Error(`请求超过 ${Math.round(timeoutMs/1000)} 秒，已停止等待`);
    throw e;
  }finally{
    clearTimeout(timer);
  }
}

function readableApiError(error){
  const raw=String(error?.message||error||"未知错误");
  if(raw.includes("system_memory_overloaded")) return "模型服务内存过载，请稍后重试或更换模型";
  if(raw.includes("Failed to fetch")) return "无法连接API，请检查地址、跨域设置或网络";
  return raw;
}

async function throwResponseError(response){
  let detail="";
  try{ detail=(await response.text()).slice(0,500); }catch{}
  throw new Error(`HTTP ${response.status}${detail?` · ${detail}`:""}`);
}

function modelsEndpoint(url){
  let base=String(url||"http://127.0.0.1:7897/v1").replace(/\/$/,"");
  base=base.replace(/\/chat\/completions$/i,"");
  return `${base}/models`;
}

function normalizeModels(data){
  const raw=Array.isArray(data) ? data : (data?.data || data?.models || data?.result || []);
  return [...new Set(raw.map(item=>{
    if(typeof item==="string") return item;
    return item?.id || item?.name || item?.model || item?.model_name || "";
  }).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}

function escapeHtml(text){
  return String(text).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}

function populateModels(models, selected=""){
  const select=$("#apiModelSelect"), list=$("#apiModelOptions");
  select.innerHTML=`<option value="">选择模型或手动填写</option>`+
    models.map(m=>`<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("");
  list.innerHTML=models.map(m=>`<option value="${escapeHtml(m)}"></option>`).join("");
  if(selected && models.includes(selected)) select.value=selected;
}

const scenes = [
  {
    title:"初次交火",
    subtitle:"六位陌生人，以及唯一一张没有写好答案的登记表。",
    time:"18:40",
    location:"海岸别墅 · 一层客厅",
    blocks:(p)=>[
      {type:"system", text:"第1日 · 18:40。所有嘉宾已签署保密协议。私人通讯设备将在21:30后统一保管。"},
      {type:"narration", text:`海岸公路在身后被暮色吞没时，你隔着车窗看见了那栋别墅。大片玻璃嵌在灰白色岩壁上，灯火温暖得近乎刻意；庭院里立着节目组的白旗，被带着咸味的风扯得猎猎作响。它不像一个适合坠入爱河的地方，更像一处被精心伪装过的观察站。`},
      {type:"narration", text:`玄关门推开的瞬间，室内的谈话停了。不是综艺节目里为制造戏剧效果剪出来的安静，而是六名长期依靠直觉活下来的人，在陌生动静出现时形成的本能停顿。你的手还搭在行李拉杆上，已经能感觉到目光从不同方向落来：有人先看你的脸，有人看你空着的另一只手，也有人越过你，确认门外是否还站着别人。`},
      {type:"dialogue", char:"zimo", action:"最先从沙发边起身。他没有碰你的手，只在行李轮即将卡住时稳稳扶住箱角，动作自然得像早就计算过你会在哪里停下", original:"中啊，慢点。这门槛设计得跟节目组一样——看着体贴，净给人添麻烦。", translation:""},
      {type:"dialogue", char:"ghost", action:"落地窗边的男人仍靠在阴影里。骷髅面罩遮住所有可供判断的表情，只有视线在Zimo的手与行李箱之间停了半秒", original:"That supposed to be reassuring?", translation:"「这也算安慰？」"},
      {type:"dialogue", char:"keegan", action:"最远处传来一声很轻的鼻息，似乎是笑，又像只是呼吸。他没有加入对话，却不动声色地把挡在通道上的摄像机支架挪开了", original:"", translation:""},
      {type:"narration", text:`空气终于松动了一点。紧接着，墙角、书架与餐厅顶灯旁的红色指示灯依次亮起。你听见耳麦里有人低声倒数，却没有导演出来介绍流程——节目组正在等，等你用第一句话决定今晚最先被剪进预告片的人。`}
    ],
    choices:[
      {text:"站稳后环视所有人，坦率地介绍自己，不把第一句话单独交给任何人。", effect:"group", reply:"你没有顺着节目组预留的暧昧停顿看向某一个人。六道目光因此都多停留了一瞬。Zimo唇边的笑意真实了一点；Ghost轻轻偏头，像是在重新评估你是否清楚自己刚刚拒绝了什么。"},
      {text:"接过自己的行李，先向替你解围的Zimo道谢，再问他是不是已经替节目组观察所有人很久了。", effect:"zimo", reply:"Zimo扶着箱角的手停了极短的一拍。他随即松手，笑意仍然温和，却第一次有了被反向观察的意味。『刚来就给我扣这么大一顶帽子？』他说得轻松，视线却认真落在你脸上。『那往后我可得谨慎点了。』"},
      {text:"越过客厅看向窗边的Ghost：『不能算安慰，但至少比站在那里审讯我友好。』", effect:"ghost", reply:"面罩后的呼吸似乎顿了一下。Ghost没有笑出声，只把交叠的手臂放开，给你让出一小片能看见海面的窗边位置。『You’ll live.』/『看来你能活下来。』这不像欢迎，但也绝不是驱逐。"},
      {text:"先向最远处的Keegan问好，并认真谢谢他挪开那台差点绊倒你的摄像机。", effect:"keegan", reply:"Keegan原本已经收回视线。听见你准确指出那件无人留意的小事，他才重新看过来。『Was in the way.』/『它挡路了。』语气平淡，手指却在膝上轻敲了一下——像某种没有被镜头捕捉到的意外。"}
    ]
  },
  {
    title:"第一张座位表",
    subtitle:"节目组说自由落座。自由通常是精心设计的另一种说法。",
    time:"19:05",
    location:"海岸别墅 · 临海餐厅",
    blocks:(p)=>[
      {type:"narration", text:`十分钟后，广播通知所有人前往餐厅。长桌临海的一侧只放了一把椅子，另外六把呈半弧形散开；七只杯子没有姓名，杯底却印着不同颜色的编号。所谓“自由落座”，从座位间距到镜头角度，都已经替每一种可能的误会留好了位置。`},
      {type:"narration", text:`你拉开椅子。木脚擦过地面的声响并不大，身后却出现了一个短得近乎荒谬的停顿。六个习惯迅速决策的人，竟没有一个立刻坐下。三台摄像机无声转向，机械云台发出细微的嗡鸣。`},
      {type:"dialogue", char:"krueger", action:"指尖拨了一下桌上的座位卡，视线却抬向藏在吊灯后的镜头。兜帽下只露出一双冷淡的眼睛", original:"Sehr subtil. Fast unsichtbar.", translation:"「真够含蓄的。几乎看不出来。」"},
      {type:"dialogue", char:"konig", action:"他的影子先于本人覆盖到你身侧。König停在足够礼貌的距离，像是担心仅仅站得太近就会迫使你答应", original:"Ist dieser Platz frei? Nur wenn es für dich in Ordnung ist.", translation:"「这个位置有人吗？只在你觉得可以的情况下。」"},
      {type:"dialogue", char:"nikto", action:"Nikto没有触碰任何椅子。防毒面具后的声音低而含混，目光始终没有离开你的反应", original:"Вы выбираете. Они хотят видеть, как.", translation:"「由你选择。他们想看你怎么选。」"},
      {type:"narration", text:`这句话让幕后人员的耳麦里传来一阵极轻的杂音。有人不喜欢嘉宾把规则说破。`}
    ],
    choices:[
      {text:"请König坐下，并把自己的杯子稍微移开，为他留出不被镜头正面包围的空间。", effect:"konig", tag:"体贴", reply:"König看了一眼你挪开的杯子，像是立刻明白那几厘米意味着什么。他落座时极力收敛身形，膝盖仍几乎抵到桌沿。『Danke.』那声道谢压得很低。对面的Krueger扫过来一眼，没有评论。"},
      {text:"邀请Nikto坐在正对面：『既然他们想看，那至少我们谈话时应该看得清彼此。』", effect:"nikto", tag:"直接", reply:"Nikto静止了两秒。随后他拉开你对面的椅子，金属椅脚没有发出一点多余声响。『Хорошо. Не отводи взгляд.』/『很好。不要移开视线。』那不像命令，更像一次被谨慎藏起来的请求。"},
      {text:"看向Krueger，问他除了座位角度，还发现节目组安排了什么小把戏。", effect:"krueger", tag:"观察", reply:"Krueger的目光终于从镜头转到你身上。『如果我现在告诉你，就看不到你自己发现时是什么表情了。』他用中文答得生硬却准确，随后坐到斜对面——一个既能观察你，也能观察所有出口的位置。"},
      {text:"不替任何人指定位置：『我已经选完自己的座位了。你们的选择应该由你们负责。』", effect:"group", tag:"边界", reply:"最先拉开椅子的是Ghost。他坐在你侧前方，却把正对面的位置空了出来。其余人随后落座，没有争抢，也没有人真的随意。节目组想要的第一场座位战争没有发生；另一种更安静的较量却已经开始。"}
    ]
  },
  {
    title:"没有脚本的晚餐",
    subtitle:"第一次共同用餐，以及第一场没人承认存在的竞争。",
    time:"19:45",
    location:"海岸别墅 · 临海餐厅",
    blocks:(p)=>[
      {type:"narration", text:`晚餐由节目组提前准备：烤鱼、温热的面包、颜色漂亮却没有多少味道的沙拉。唯一真正有存在感的是一锅明显放多了盐的海鲜汤。Soap若在这里大概会拿它开一晚上玩笑，但桌边这六个人只是沉默地喝水，没有谁愿意先给后期剪辑提供素材。`},
      {type:"narration", text:`你逐渐察觉他们用餐时保留着相似的职业习惯。Keegan背后没有门；Ghost能从玻璃反光里看见走廊；Krueger切食物时刀刃从不朝向旁人。König每次伸手前都会确认没有侵入你的空间，Nikto几乎没碰酒，而Zimo正用几句不着痕迹的话维持着餐桌不至于彻底冷下去。`},
      {type:"system", text:"任务：说出一项擅长的事，以及一项可能会在节目中给你带来麻烦的短板。禁止使用“没有”。"},
      {type:"narration", text:`任务卡被推到你面前。你的登记表上写着：擅长「${p.skills}」；不擅长「${p.weaknesses}」。那是抵达这里以前写下的文字，当时没有六双眼睛等着判断你会不会为了显得可爱而夸大笨拙，也没有成百上千名未来观众准备把你的回答拆成十五秒片段。`},
      {type:"dialogue", char:"keegan", action:"Keegan终于从餐盘上抬起视线。他没有催促，只用拇指缓慢擦过杯沿凝结的水珠", original:"Don't make it sound better for the cameras. Good or bad.", translation:"「别为了镜头把它说得更漂亮。好的坏的都一样。」"},
      {type:"dialogue", char:"zimo", action:"Zimo向后靠进椅背，给你的沉默留出空间", original:"也不用为了证明自己，故意说得更难听。照实就行。", translation:""}
    ],
    choices:(p)=>[
      {text:`照实谈起「${p.skills}」与「${p.weaknesses}」，并说明不擅长一件事不等于等待别人拯救。`, effect:"honest", tag:"诚实", reply:"你没有把短板包装成讨喜的小毛病。话说完后，餐桌安静了一会儿。Ghost的指节在桌面轻叩一下，像是认可；Krueger则直接问了一个足以验证你是否夸大专长的细节。你答上来时，他眼里的审视少了一层。"},
      {text:`不急着解释，直接用手边条件展示一点「${p.skills}」，再让他们猜你的短板。`, effect:"skill", tag:"发挥专长", reply:"起初还有人以为这只是节目效果，直到你真正动手。Zimo最先看懂你并非临时表演，König不自觉向前倾了些；Keegan的注意力则落在你的步骤而不是结果上。能力比自我介绍更快地替你建立了轮廓。"},
      {text:"用一个恰到好处的玩笑化开注视，但暂时保留登记表上那件别人看不出来的事。", effect:"mystery", tag:"保留", reply:"笑声沿着餐桌散开，却没有彻底掩住你的保留。Nikto慢慢偏了下头。『Не всё.』/『不是全部。』他说。Zimo没有追问，只看了你一眼——他也发现了，只是选择让秘密继续属于你。"},
      {text:"看向Keegan：『那你呢？如果任务卡问你，你会对镜头说实话吗？』", effect:"keegan", tag:"反将一军", reply:"Keegan没有立刻回答。镜头悄无声息地推近，他便抬眼直视镜头，直到操控云台的人先把角度移开。『Depends who’s asking.』/『看是谁在问。』然后他的目光回到你身上。答案已经很清楚。"}
    ]
  },
  {
    title:"熄灯之前",
    subtitle:"第一天的节目结束了。真正的选择才刚刚开始。",
    time:"21:37",
    location:"海岸别墅 · 夜间公共区",
    blocks:(p)=>[
      {type:"narration", text:`晚餐结束后，节目组没有安排集体游戏。疲惫和陌生感已经足够制造素材。有人留在厨房收拾，有人去露台吹风；走廊尽头偶尔响起门锁闭合的轻响，像每个人都需要一点没有镜头贴近呼吸的空间。`},
      {type:"narration", text:`21:37，公共区域的主灯逐层熄灭，只留下贴近地面的暖色灯带。工作人员收走你们原本的通讯设备，换来一部没有品牌标识的黑色手机。屏幕亮起时，界面空得近乎冷酷：六个名字，一个发送键，没有撤回。`},
      {type:"system", text:"匿名心动短信已开放。前往「心动」页面，选择今晚最想继续了解的人。"},
      {type:"narration", text:`你并不知道今晚会收到几封，也不知道他们之中有多少人仍把这当成一次必须完成的合作任务。窗外的海浪撞上礁石，声音隔着玻璃变得低沉。二十一天的倒计时已经开始——从今晚起，每一次靠近会留下痕迹，每一次没有选择，也会成为一种选择。`}
    ],
    choices:[{text:"打开心动终端", effect:"phone", tag:"DAY 1 END"}]
  }
];

function save(){ localStorage.setItem(STORE, JSON.stringify(state)); }
function load(){
  try {
    const data = JSON.parse(localStorage.getItem(STORE) || localStorage.getItem("hc21_save_v7") || localStorage.getItem("hc21_save_v6") || localStorage.getItem("hc21_save_v5") || localStorage.getItem("hc21_save_v4") || localStorage.getItem("hc21_save_v3") || localStorage.getItem("hc21_save_v2") || localStorage.getItem("hc21_save_v1"));
    if(data) state = {...state, ...data};
    if(state.contentRevision !== 8){
      state = {...state, contentRevision:8, dynamicScene:null, signalError:null, signalCommitted:false, pairRelations:state.pairRelations||createPairRelations(), usedFocus:state.usedFocus||[], receivedSignals:[], memories:state.memories||[], dailyLog:state.dailyLog||[], daySceneHistory:state.daySceneHistory||[]};
    }
  } catch {}
}
function toast(text){
  const el=$("#toast"); el.textContent=text; el.classList.add("show");
  clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove("show"),1800);
}
function unlock(id){
  if(!state.achievements.includes(id)){ state.achievements.push(id); toast(`成就解锁 · ${achievements.find(a=>a.id===id)?.name}`); save(); renderAchievements(); }
}
function showScreen(id){
  $$(".screen").forEach(s=>s.classList.add("hidden"));
  $(id).classList.remove("hidden");
}
function renderCast(){
  $("#castGrid").innerHTML=cast.map((c,i)=>`
    <button class="cast-card" data-id="${c.id}" data-number="0${i+1}">
      <span class="unit">${c.unit}</span><h3>${c.name}</h3><span class="role">${c.role}</span>
      <span class="status">${relationLabel(c.id)}</span>
    </button>`).join("");
  $$(".cast-card").forEach(btn=>btn.onclick=()=>openCharacter(btn.dataset.id));
}
function relationLabel(id){
  const r=state.relations[id]; const stage=r?.stage||0;
  return ["陌生 · 尚未建立印象","留意 · 视线开始停留","兴趣 · 主动靠近","暧昧 · 偏心正在发生","动心 · 防线松动","真心 · 不再只是节目","承诺 · 选择节目之外"][stage];
}
function openCharacter(id){
  const c=cast.find(x=>x.id===id), r=state.relations[id];
  const relatedMemories=(state.memories||[]).filter(memory=>{
    const text=typeof memory==="string"?memory:JSON.stringify(memory);
    return text.toLowerCase().includes(id) || text.includes(c.name.split(" ")[0]);
  }).slice(-5);
  const recentLogs=(state.dailyLog||[]).filter(log=>(log.focus||[]).includes(id)).slice(-3);
  $("#characterDetail").innerHTML=`
    <div class="dossier-top"><div><p class="eyebrow">${c.unit}</p><h2>${c.name}</h2><small>${c.role}</small></div><span class="code">${c.code}</span></div>
    <div class="dossier-section"><small>PUBLIC PROFILE</small><p>${c.hook}</p></div>
    <div class="dossier-section"><small>PARTICIPATION</small><p>${c.reason}</p></div>
    <div class="dossier-section"><small>OBSERVED PATTERN</small><p>${c.style}</p></div>
    <div class="dossier-section"><small>RELATION</small><div class="stat-row"><span>${relationLabel(id)}</span><span>线索 ${r?.stage||0}/6</span></div></div>
    <div class="dossier-section"><small>WHAT HE REMEMBERS</small><p>${relatedMemories.length?relatedMemories.map(m=>`· ${escapeHtml(typeof m==="string"?m:JSON.stringify(m))}`).join("<br>"):"尚未形成明确的长期记忆。"}</p></div>
    <div class="dossier-section"><small>RECENT CONTACT</small><p>${recentLogs.length?recentLogs.map(log=>`Day ${log.day} · ${escapeHtml(log.choice)}`).join("<br>"):"暂无单独互动记录。"}</p></div>
    <div class="dossier-section"><small>LANGUAGE</small><p>${c.language}</p></div>`;
  $("#characterModal").classList.remove("hidden");
}
function renderAchievements(){
  $("#achievementGrid").innerHTML=achievements.map(a=>{
    const on=state.achievements.includes(a.id);
    return `<div class="achievement ${on?"":"locked"}"><span class="icon">${on?a.icon:"?"}</span><h3>${on?a.name:"未解锁"}</h3><p>${on?a.desc:"继续节目以发现解锁条件。"}</p></div>`;
  }).join("");
  $("#achievementCount").textContent=`${state.achievements.length} / ${achievements.length} 已解锁`;
}
function renderSignals(){
  $("#signalList").innerHTML=cast.map(c=>`
    <button class="signal-person ${state.signalSent===c.id?"selected":""}" data-id="${c.id}" ${state.signalSent?"disabled":""}>
      <span class="avatar">${c.code}</span><span><b>${c.name}</b><small>${c.unit}</small></span><span class="arrow">${state.signalSent===c.id?"已发送":"›"}</span>
    </button>`).join("");
  $$(".signal-person").forEach(btn=>btn.onclick=()=>sendSignal(btn.dataset.id));
  if(state.signalSent) $("#signalStatus").textContent=`今晚的信号已发送给 ${cast.find(c=>c.id===state.signalSent).name}。`;
  renderSignalResults();
}

function renderSignalResults(){
  const box=$("#signalResults");
  if(state.signalSent && state.signalError){
    box.classList.remove("hidden");
    box.innerHTML=`<h3>短信生成失败</h3>
      <div class="day-summary">${escapeHtml(state.signalError)}。短信尚未结算，关系与日期均未改变。</div>
      <button id="retrySignals" class="primary-btn wide">重新生成今晚短信</button>`;
    $("#retrySignals").onclick=()=>settleSignals();
    return;
  }
  if(!state.signalSent || !state.receivedSignals?.length){ box.classList.add("hidden"); box.innerHTML=""; return; }
  box.classList.remove("hidden");
  const next=state.day<21 ? `进入 Day ${String(state.day+1).padStart(2,"0")}` : "查看最终结算";
  box.innerHTML=`<h3>午夜信号</h3>
    ${state.receivedSignals.map(s=>`<div class="received-signal"><small>匿名短信</small><p>${s.text}</p></div>`).join("")}
    <div class="day-summary">DAY ${String(state.day).padStart(2,"0")} 已结算 · 发送者身份不会立即公开。部分措辞已被记入关系线索。</div>
    <button id="nextDayBtn" class="primary-btn wide">${next}</button>`;
  $("#nextDayBtn").onclick=()=>advanceDay();
}
function addBlock(block){
  const wrap=document.createElement("div");
  if(block.type==="narration"){ wrap.className="story-block narration"; wrap.textContent=block.text; }
  if(block.type==="system"){ wrap.className="story-block system"; wrap.textContent=block.text; }
  if(block.type==="task"){
    wrap.className="story-block program-card task-card";
    wrap.innerHTML=`<small>PRODUCTION MISSION</small><b>节目任务卡</b><p>${escapeHtml(block.text)}</p>`;
  }
  if(block.type==="producer"){
    wrap.className="story-block program-card producer-card";
    wrap.innerHTML=`<small>PRODUCTION NOTICE</small><b>节目组通知</b><p>${escapeHtml(block.text)}</p>`;
  }
  if(block.type==="observer"){
    wrap.className="story-block program-card observer-card";
    wrap.innerHTML=`<small>REACTION STUDIO</small><b>观察室</b><p>${escapeHtml(block.text)}</p>`;
  }
  if(block.type==="interview"){
    const c=cast.find(x=>x.id===block.char);
    wrap.className="story-block interview-block";
    wrap.innerHTML=`<div class="interview-label">UNAIRED INTERVIEW · ${c?.code||"??"}</div><div><b>${escapeHtml(c?.name||block.char)}的单人采访</b><p>${escapeHtml(block.text)}</p></div>`;
  }
  if(block.type==="dialogue"){
    const c=cast.find(x=>x.id===block.char) || {code:"??",name:block.char||"未知嘉宾",unit:""};
    wrap.className="story-block dialogue";
    wrap.innerHTML=`<div class="dialogue-avatar">${c.code}</div><div><div class="dialogue-meta"><b>${c.name}</b><small>${c.unit}</small></div><p class="dialogue-action">${block.action}</p><p class="dialogue-line"><span class="original">${block.original}</span>${block.translation?` / ${block.translation}`:""}</p></div>`;
  }
  if(block.type==="player"){ wrap.className="story-block player-line"; wrap.textContent=block.text; }
  $("#storyFeed").appendChild(wrap);
}
function renderScene(){
  if(state.day>1){ renderDynamicScene(); return; }
  const scene=scenes[state.scene]||scenes.at(-1), p=state.profile;
  const blocks=scene.blocks(p);
  const sceneChoices=typeof scene.choices==="function" ? scene.choices(p) : scene.choices;
  $("#timeLabel").textContent=scene.time||"";
  $("#locationLabel").textContent=scene.location||"海岸别墅";
  $("#sceneTitle").textContent=scene.title; $("#sceneSubtitle").textContent=scene.subtitle;
  $("#storyFeed").innerHTML="";
  blocks.forEach((b,i)=>setTimeout(()=>{ addBlock(b); if(i===blocks.length-1) window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}); },i*110));
  $("#choices").innerHTML=sceneChoices.map((c,i)=>`<button class="choice-btn" data-index="${i}">${c.tag?`<span class="tag">${c.tag}</span>`:""}${c.text}</button>`).join("");
  $("#choiceHint").textContent=state.scene===3?"今日最后一步":"选择你的行动";
  $("#freeInputWrap").classList.toggle("hidden", state.scene<1 || state.scene>=3);
  $$(".choice-btn").forEach(btn=>btn.onclick=()=>choose(sceneChoices[Number(btn.dataset.index)]));
}

function renderDynamicScene(){
  const scene=state.dynamicScene;
  $("#dayNumber").textContent=String(state.day).padStart(2,"0");
  if(!scene){
    $("#timeLabel").textContent="--:--";
    $("#locationLabel").textContent="节目组正在重新布置机位";
    $("#sceneTitle").textContent=dayPrograms[state.day]?.theme||"节目进行中";
    $("#sceneSubtitle").textContent="AI导演正在生成本幕，慢速模型最长等待3分钟。";
    $("#storyFeed").innerHTML=`<div class="story-block thinking"><i></i><i></i><i></i></div>`;
    $("#choices").innerHTML="";
    $("#freeInputWrap").classList.add("hidden");
    return;
  }
  if(scene.source==="error"){
    $("#timeLabel").textContent="--:--";
    $("#locationLabel").textContent="生成已暂停";
    $("#sceneTitle").textContent="本幕生成失败";
    $("#sceneSubtitle").innerHTML=`没有使用备用剧情 <span class="director-badge">API ERROR</span>`;
    $("#storyFeed").innerHTML="";
    addBlock({type:"system",text:`AI没有成功返回内容：${scene.error}`});
    addBlock({type:"narration",text:"为避免把接口故障伪装成正式剧情，游戏不会自动使用本地事件，也不会推进时间或改变任何关系。你可以检查设置后重新生成本幕。"});
    $("#choices").innerHTML=`<button class="choice-btn" id="retryDirector"><span class="tag">RETRY</span>重新生成本幕</button>`;
    $("#retryDirector").onclick=()=>directorScene();
    $("#choiceHint").textContent="生成失败";
    $("#freeInputWrap").classList.add("hidden");
    return;
  }
  $("#timeLabel").textContent=scene.time||["08:10","14:20","17:40","21:10"][state.daySlot]||"";
  $("#locationLabel").textContent=scene.location||"海岸别墅";
  $("#sceneTitle").textContent=scene.title||dayPrograms[state.day]?.theme;
  $("#sceneSubtitle").innerHTML=`${scene.subtitle||slotNames[state.daySlot]} <span class="director-badge" title="${scene.diagnostic||""}">AI DIRECTED</span>`;
  $("#storyFeed").innerHTML="";
  (scene.blocks||[]).forEach(addBlock);
  const choices=scene.choices||[];
  $("#choices").innerHTML=choices.map((c,i)=>`<button class="choice-btn" data-index="${i}">${c.tag?`<span class="tag">${c.tag}</span>`:""}${c.text}</button>`).join("");
  $("#choiceHint").textContent=`DAY ${state.day} · ${slotNames[state.daySlot]}`;
  $("#freeInputWrap").classList.remove("hidden");
  $$(".choice-btn").forEach(btn=>btn.onclick=()=>chooseDynamic(choices[Number(btn.dataset.index)]));
}

function relationSnapshot(){
  return Object.fromEntries(cast.map(c=>{
    const r=state.relations[c.id];
    return [c.id,{stage:r.stage,heart:r.heart,trust:r.trust,respect:r.respect,jealousy:r.jealousy,safety:r.safety}];
  }));
}

function pairSnapshot(){
  return Object.fromEntries(Object.entries(state.pairRelations||{}).filter(([,value])=>value!==40));
}

function pickFocus(){
  const sorted=[...cast].sort((a,b)=>{
    const ar=state.relations[a.id], br=state.relations[b.id];
    const ap=state.usedFocus.includes(a.id)?25:0, bp=state.usedFocus.includes(b.id)?25:0;
    return (ar.heart-ap+Math.random()*18)-(br.heart-bp+Math.random()*18);
  });
  return sorted.slice(-2).map(c=>c.id);
}

function extractJson(text){
  const clean=cleanModelText(text);
  const start=clean.indexOf("{"), end=clean.lastIndexOf("}");
  if(start<0||end<start) throw new Error("AI未返回JSON");
  return JSON.parse(clean.slice(start,end+1));
}

function cleanModelText(text){
  if(Array.isArray(text)) text=text.map(part=>typeof part==="string"?part:(part?.text||part?.content||"")).join("\n");
  if(text && typeof text==="object") text=text.text||text.content||text.output_text||"";
  return String(text||"")
    .replace(/<think>[\s\S]*?<\/think>/gi,"")
    .replace(/```(?:json)?|```/gi,"")
    .replace(/【/g,"[")
    .replace(/】/g,"]")
    .trim();
}

function extractAssistantText(data){
  const candidates=[
    data?.choices?.[0]?.message?.content,
    data?.choices?.[0]?.message?.reasoning_content,
    data?.choices?.[0]?.message?.reasoning,
    data?.choices?.[0]?.delta?.content,
    data?.choices?.[0]?.text,
    data?.output_text,
    data?.response,
    data?.content,
    data?.candidates?.[0]?.content?.parts,
    data?.candidates?.[0]?.content,
    data?.result?.choices?.[0]?.message?.content
  ];
  for(const value of candidates){
    const text=cleanModelText(value);
    if(text) return text;
  }
  return "";
}

function responseShape(data){
  try{
    const summary={
      top:Object.keys(data||{}).slice(0,12),
      choice:Object.keys(data?.choices?.[0]||{}).slice(0,12),
      message:Object.keys(data?.choices?.[0]?.message||{}).slice(0,12),
      candidate:Object.keys(data?.candidates?.[0]||{}).slice(0,12),
      finish:data?.choices?.[0]?.finish_reason||data?.candidates?.[0]?.finishReason||""
    };
    return JSON.stringify(summary);
  }catch{ return "无法读取响应结构"; }
}

function parseTaggedScene(raw,focus){
  const clean=cleanModelText(raw);
  const lines=clean.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const scene={
    title:"",subtitle:"",time:"",location:"",focus,
    blocks:[],choices:[]
  };
  for(const line of lines){
    let m;
    if((m=line.match(/^\[标题\]\s*(.+)$/))) scene.title=m[1].trim();
    else if((m=line.match(/^\[副标题\]\s*(.+)$/))) scene.subtitle=m[1].trim();
    else if((m=line.match(/^\[时间\]\s*(.+)$/))) scene.time=m[1].trim();
    else if((m=line.match(/^\[地点\]\s*(.+)$/))) scene.location=m[1].trim();
    else if((m=line.match(/^\[系统\]\s*(.+)$/))) scene.blocks.push({type:"system",text:m[1].trim()});
    else if((m=line.match(/^\[任务卡\]\s*(.+)$/))) scene.blocks.push({type:"task",text:m[1].trim()});
    else if((m=line.match(/^\[单采:([a-z]+)\]\s*(.+)$/i))) scene.blocks.push({type:"interview",char:m[1].toLowerCase(),text:m[2].trim()});
    else if((m=line.match(/^\[观察室\]\s*(.+)$/))) scene.blocks.push({type:"observer",text:m[1].trim()});
    else if((m=line.match(/^\[节目组\]\s*(.+)$/))) scene.blocks.push({type:"producer",text:m[1].trim()});
    else if((m=line.match(/^\[旁白\]\s*(.+)$/))) scene.blocks.push({type:"narration",text:m[1].trim()});
    else if((m=line.match(/^\[台词:([a-z]+)\]\s*(?:\((.*?)\))?\s*(.*?)\s*\|\s*(.+)$/i))){
      scene.blocks.push({type:"dialogue",char:m[1].toLowerCase(),action:(m[2]||"").trim(),original:m[3].trim(),translation:m[4].trim()});
    }else if((m=line.match(/^\[选项(?::([^\]]+))?\]\s*(.+)$/))){
      const index=scene.choices.length;
      scene.choices.push({
        text:m[2].trim(),
        tag:(m[1]||"选择").trim().slice(0,8),
        focus:[focus[index%focus.length]].filter(Boolean),
        effects:index===0?{heart:3,trust:2,respect:2}:index===1?{heart:2,trust:1,jealousy:2}:{respect:2,trust:1},
        memory:`Day ${state.day}，玩家选择：${m[2].trim()}`
      });
    }else if(scene.blocks.length && scene.blocks.at(-1).type==="narration"){
      scene.blocks.at(-1).text+=`\n${line}`;
    }
  }
  scene.blocks=sanitizeStoryBlocks(scene.blocks);
  scene.choices=sanitizeChoices(scene.choices);
  if(!scene.title) scene.title=dayPrograms[state.day]?.theme||"节目进行中";
  if(!scene.subtitle) scene.subtitle=slotNames[state.daySlot];
  if(!scene.time) scene.time=["08:10","14:20","17:40","21:10"][state.daySlot];
  if(!scene.blocks.length) throw new Error("AI没有返回可识别的旁白或台词");
  if(scene.choices.length<2) throw new Error("AI没有返回至少两个有效选项");
  return scene;
}

function parseTaggedConsequence(raw){
  const clean=cleanModelText(raw);
  const lines=clean.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const blocks=[];
  for(const line of lines){
    let m;
    if((m=line.match(/^\[旁白\]\s*(.+)$/))) blocks.push({type:"narration",text:m[1].trim()});
    else if((m=line.match(/^\[台词:([a-z]+)\]\s*(?:\((.*?)\))?\s*(.*?)\s*\|\s*(.+)$/i))){
      blocks.push({type:"dialogue",char:m[1].toLowerCase(),action:(m[2]||"").trim(),original:m[3].trim(),translation:m[4].trim()});
    }else if(blocks.length && blocks.at(-1).type==="narration"){
      blocks.at(-1).text+=`\n${line}`;
    }
  }
  const safe=sanitizeStoryBlocks(blocks);
  if(!safe.length) throw new Error("AI没有返回可识别的选择后续正文");
  return {blocks:safe,memory:"",effects:{},tagged:true};
}

function parseTaggedSignals(raw){
  const clean=cleanModelText(raw);
  const signals=[];
  for(const line of clean.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)){
    const match=line.match(/^\[短信(?::([a-z]+))?\]\s*(.+)$/i);
    if(match) signals.push({sender:cast.some(c=>c.id===match[1])?match[1]:null,text:match[2].trim()});
  }
  return sanitizeSignals(signals);
}

function proseToBlocks(text){
  const clean=cleanModelText(text);
  if(!clean) return [];
  if(/^\s*\{[\s\S]*"(?:blocks|choices|effects)"\s*:/.test(clean)){
    throw new Error("AI返回了损坏或截断的JSON，不能作为正文展示");
  }
  return clean.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean).map(text=>({type:"narration",text}));
}

function extractCompleteObjectsFromArray(text, key){
  const clean=cleanModelText(text);
  const marker=new RegExp(`"${key}"\\s*:\\s*\\[`);
  const hit=marker.exec(clean);
  if(!hit) return [];
  let i=hit.index+hit[0].length, depth=0, start=-1, inString=false, escaped=false;
  const objects=[];
  for(;i<clean.length;i++){
    const ch=clean[i];
    if(inString){
      if(escaped) escaped=false;
      else if(ch==="\\") escaped=true;
      else if(ch==='"') inString=false;
      continue;
    }
    if(ch==='"'){ inString=true; continue; }
    if(ch==="{"){
      if(depth===0) start=i;
      depth++;
    }else if(ch==="}"){
      depth--;
      if(depth===0 && start>=0){
        const fragment=clean.slice(start,i+1);
        try{ objects.push(JSON.parse(fragment)); }catch{}
        start=-1;
      }
    }else if(ch==="]" && depth===0){
      break;
    }
  }
  return objects;
}

function sanitizeStoryBlocks(blocks){
  return (Array.isArray(blocks)?blocks:[]).flatMap(block=>{
    if(!block || typeof block!=="object") return [];
    if(block.type==="dialogue"){
      if(!cast.some(c=>c.id===block.char)) return [];
      const original=String(block.original||"").trim();
      const translation=String(block.translation||"").trim();
      if(!original && !translation) return [];
      return [{type:"dialogue",char:block.char,action:String(block.action||""),original,translation}];
    }
    if(block.type==="narration"){
      const text=String(block.text||"").trim();
      return text?[{type:"narration",text}]:[];
    }
    if(["task","observer","producer"].includes(block.type)){
      const text=String(block.text||"").trim();
      return text?[{type:block.type,text}]:[];
    }
    if(block.type==="interview"){
      const text=String(block.text||"").trim();
      if(!text || !cast.some(c=>c.id===block.char)) return [];
      return [{type:"interview",char:block.char,text}];
    }
    return [];
  });
}

function salvageConsequence(text){
  const blocks=sanitizeStoryBlocks(extractCompleteObjectsFromArray(text,"blocks"));
  if(!blocks.length) throw new Error("AI返回的JSON不完整，且没有可安全恢复的剧情段落");
  return {blocks,memory:"",effects:{},recoveredJson:true};
}

function extractJsonStringField(text,key){
  const clean=cleanModelText(text);
  const match=clean.match(new RegExp(`"${key}"\\s*:\\s*("(?:\\\\.|[^"\\\\])*")`));
  if(!match) return "";
  try{ return JSON.parse(match[1]); }catch{ return ""; }
}

function sanitizeChoices(choices){
  return (Array.isArray(choices)?choices:[]).flatMap(choice=>{
    const text=String(choice?.text||"").trim();
    if(!text) return [];
    const focus=(Array.isArray(choice.focus)?choice.focus:[]).filter(id=>cast.some(c=>c.id===id));
    const effects={};
    ["heart","trust","respect","jealousy","safety"].forEach(key=>{
      if(choice?.effects?.[key]!=null) effects[key]=Number(choice.effects[key])||0;
    });
    return [{
      text,
      tag:String(choice.tag||"选择").slice(0,8),
      focus,
      effects,
      memory:String(choice.memory||"")
    }];
  });
}

function salvageDirectorScene(text,focus){
  const blocks=sanitizeStoryBlocks(extractCompleteObjectsFromArray(text,"blocks"));
  const choices=sanitizeChoices(extractCompleteObjectsFromArray(text,"choices"));
  if(!blocks.length) throw new Error("损坏JSON中没有可安全恢复的剧情段落");
  if(choices.length<2) throw new Error("损坏JSON中没有足够完整的玩家选项");
  return {
    title:extractJsonStringField(text,"title")||dayPrograms[state.day]?.theme||"节目进行中",
    subtitle:extractJsonStringField(text,"subtitle")||slotNames[state.daySlot],
    time:extractJsonStringField(text,"time")||["08:10","14:20","17:40","21:10"][state.daySlot],
    location:extractJsonStringField(text,"location"),
    focus,
    blocks,
    choices,
    recoveredJson:true
  };
}

function sanitizeSignals(signals){
  return (Array.isArray(signals)?signals:[]).flatMap(signal=>{
    const text=String(signal?.text||signal?.content||"").trim();
    if(!text) return [];
    const sender=cast.some(c=>c.id===signal?.sender)?signal.sender:null;
    return [{sender,text}];
  });
}

function proseToSignals(text){
  const clean=cleanModelText(text);
  if(!clean) return [];
  if(/^\s*\{[\s\S]*"signals"\s*:/.test(clean)){
    return sanitizeSignals(extractCompleteObjectsFromArray(clean,"signals"));
  }
  return clean
    .split(/\n{2,}|\n(?=\s*(?:[-*•]|\d+[.、]))/)
    .map(line=>line.replace(/^\s*(?:[-*•]|\d+[.、])\s*/,"").trim())
    .filter(line=>line.length>=2)
    .slice(0,6)
    .map(text=>({sender:null,text}));
}

function sceneSignature(scene){
  return {
    slot:state.daySlot,
    location:String(scene?.location||"").trim(),
    title:String(scene?.title||"").trim(),
    focus:[...(scene?.focus||[])],
    summary:String(scene?.subtitle||"").trim()
  };
}

function validateSceneDiversity(scene){
  const today=(state.daySceneHistory||[]).filter(x=>x.day===state.day);
  const location=String(scene?.location||"").trim();
  const title=String(scene?.title||"").trim();
  if(!location) throw new Error("AI没有返回场景地点");
  if(!scene?.blocks?.length || !scene?.choices?.length) throw new Error("AI返回的场景内容不完整");
  const duplicateLocation=today.some(x=>x.location===location);
  const duplicateTitle=today.some(x=>x.title===title);
  if(duplicateLocation) throw new Error(`场景重复使用地点「${location}」`);
  if(duplicateTitle) throw new Error(`场景重复使用事件「${title}」`);
  if(state.daySlot===2 && /厨房|餐厅|早餐|料理|烹饪/.test(location+title)){
    throw new Error("自由行动不能再次回到厨房或早餐事件");
  }
  const beat=currentBeat();
  const types=new Set((scene.blocks||[]).map(block=>block.type));
  if(beat.format==="task" && !types.has("task")) throw new Error("本幕缺少节目任务卡");
  if(beat.format==="interview" && !types.has("interview")) throw new Error("本幕缺少男嘉宾单人采访");
  if(beat.format==="observer" && !types.has("observer")) throw new Error("本幕缺少观察室内容");
  if(beat.format==="activity" && !types.has("task") && !types.has("producer")) throw new Error("主题活动缺少明确规则或节目组加码");
  return true;
}

async function directorScene(){
  state.dynamicScene=null; save(); renderScene();
  const cfg=getApiConfig();
  const focus=pickFocus(), program=dayPrograms[state.day], contract=slotContracts[state.daySlot], beat=currentBeat();
  const usedScenes=(state.daySceneHistory||[]).filter(x=>x.day===state.day);
  try{
    const prompt=`你是成年女性向COD恋综《交火心跳：21日》的场景导演。不要输出JSON，不要Markdown，只使用下方指定的逐行标签。
玩家：${JSON.stringify(state.profile)}
当前：Day ${state.day}，${slotNames[state.daySlot]}。主题：${program.theme}；活动：${program.activity}；转折：${program.twist}
本幕节目分镜：${beat.name}
本幕必须实际发生：${beat.must}
本幕模块类型：${beat.format}
本时段职责：${contract.purpose}
推荐地点类型：${contract.preferred}
本时段禁止：${contract.forbidden}
今日已经使用的场景（绝对不能重复地点、核心事件或相同功能）：${JSON.stringify(usedScenes)}
本幕优先角色：${focus.join(", ")}。关系：${JSON.stringify(relationSnapshot())}
角色圣经：
${focus.map(id=>characterBible[id]).join("\n")}
${proseBible}
近期记忆：${JSON.stringify(state.memories.slice(-12))}
最近日志：${JSON.stringify(state.dailyLog.slice(-8))}
男嘉宾彼此关系：${JSON.stringify(pairSnapshot())}
亲密规则：${intimacyDirective()}
要求：正文总量900-1400字；只让1-4名自然相关角色出场；每个旁白块至少120字；必须把“本幕必须实际发生”的所有事项写进剧情，不能只提一句任务名称；必须有至少一次节目机制、一次角色之间的相互反应和一次玩家能介入的具体矛盾；与今日所有已用地点和事件明显不同；保留军人职业习惯、母语台词及中文翻译；慢热，不跳阶段，不替玩家说话或决定。最后给出3-4个具体选项，至少一个自然调用玩家专长或短板。
严格按以下格式逐行输出：
[标题] 短标题
[副标题] 一句氛围
[时间] HH:MM
[地点] 具体地点
[系统] 节目规则或时段说明
[任务卡] 只有节目正式发布挑战或规则时使用
[节目组] 只有制作组临时通知、加码或干预时使用
[旁白] 一整段沉浸叙事
[台词:ghost] (动作) English dialogue | 「中文翻译」
[单采:ghost] 角色在独立采访中说的未播内容
[观察室] 主持人或观察嘉宾对一个具体微动作的不同解读
[旁白] 另一整段沉浸叙事
[选项:坦率] 玩家可做或可说的具体内容
[选项:观察] 玩家可做或可说的具体内容
[选项:专长] 玩家可做或可说的具体内容
台词与单采角色ID只能是 keegan、krueger、ghost、nikto、konig、zimo。每个标签必须单独一行。根据本幕模块类型，必须至少使用一个对应标签：task使用[任务卡]，interview使用[单采]，observer使用[观察室]，offcamera必须写明镜头关闭或死角。`;
    const data=await callChatModel(cfg,[{role:"system",content:prompt},{role:"user",content:"按逐行标签格式生成当前场景。"}],{max_tokens:3200,temperature:.92},180000);
    const raw=extractAssistantText(data);
    if(!raw) throw new Error(`API返回成功但正文为空；响应结构：${responseShape(data)}`);
    const parsed=parseTaggedScene(raw,focus);
    validateSceneDiversity(parsed);
    state.dynamicScene={...parsed,source:"ai",diagnostic:`${cfg.model||"gpt-4o-mini"} · ${new Date().toLocaleTimeString()}`};
  }catch(e){
    console.warn("AI导演生成失败",e);
    state.dynamicScene={source:"error",error:readableApiError(e),diagnostic:String(e.message||e)};
    toast("AI生成失败，请重新生成");
  }
  save(); renderScene();
}

function applyStructuredEffects(choice){
  const ids=(choice.focus||[]).filter(id=>state.relations[id]);
  const effects=choice.effects||{};
  ids.forEach(id=>{
    const r=state.relations[id];
    ["heart","trust","respect","jealousy","safety"].forEach(k=>{
      if(effects[k]!=null) r[k]=Math.max(0,Math.min(100,r[k]+Math.max(-5,Math.min(6,Number(effects[k])||0))));
    });
    if(state.day>=7 && state.profile?.contentLevel!=="fade" && (Number(effects.heart)||0)>0){
      r.desire=Math.max(0,Math.min(100,(r.desire||0)+(state.day>=19?4:1)));
    }
    const gate=Math.min(6,Math.floor(Math.min(r.heart,r.trust,r.respect)/18));
    r.stage=Math.max(r.stage,gate);
  });
  if(choice.memory) state.memories.push(choice.memory);
  if(state.day===15){
    if(/多人|不单选|拒绝.*单|规则/.test(choice.text)) state.routePolicy="open";
    else if(/一人|唯一|单独|只选/.test(choice.text)) state.routePolicy="single";
    else state.routePolicy="undecided";
  }
  state.usedFocus=[...new Set([...state.usedFocus,...ids])].slice(-4);
  if(ids.length>=2){
    for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++){
      const key=pairKey(ids[i],ids[j]);
      const delta=(Number(effects.respect)||0)>0?2:(Number(effects.jealousy)||0)>2?-2:0;
      state.pairRelations[key]=Math.max(0,Math.min(100,(state.pairRelations[key]??40)+delta));
    }
  }
}

async function generateConsequence(choice){
  const cfg=getApiConfig();
  const focus=(choice.focus||state.dynamicScene?.focus||[]).filter(id=>characterBible[id]);
  try{
    const prompt=`你负责续写COD恋综《交火心跳：21日》中玩家选择后的即时反应。不要输出JSON，不要Markdown，只使用指定逐行标签。
前景：${JSON.stringify(state.dynamicScene)}
玩家选择：${choice.text}
玩家资料：${JSON.stringify(state.profile)}
关系：${JSON.stringify(relationSnapshot())}
角色圣经：${focus.map(id=>characterBible[id]).join("\n")}
${proseBible}
写500-850字，聚焦这个选择如何真实改变谈话、站位、镜头内外关系与角色判断。必须给选择带来具体后果，可以是好感、误会、尴尬、尊重或醋意，不要所有选择都得到奖励。不得替玩家新增台词、心理和动作。不要开启新场景，不要总结道理。结尾停在一个有余味的动作或未完成的话上。
只允许使用：
[旁白] 一整段剧情
[台词:ghost] (动作) English dialogue | 「中文翻译」
台词角色ID只能是 keegan、krueger、ghost、nikto、konig、zimo。绝对不能使用玩家姓名或player。`;
    const data=await callChatModel(cfg,[{role:"system",content:prompt},{role:"user",content:"按逐行标签格式续写选择后果。"}],{max_tokens:2600,temperature:.86},180000);
    const raw=extractAssistantText(data);
    if(!raw) throw new Error(`API返回成功但正文为空；响应结构：${responseShape(data)}`);
    return parseTaggedConsequence(raw);
  }catch(e){ throw new Error(readableApiError(e)); }
}

function applyReactionEffects(effects){
  Object.entries(effects||{}).forEach(([id,delta])=>{
    const r=state.relations[id]; if(!r) return;
    ["heart","trust","respect","jealousy","safety"].forEach(k=>{
      if(delta?.[k]!=null) r[k]=Math.max(0,Math.min(100,r[k]+Math.max(-4,Math.min(5,Number(delta[k])||0))));
    });
  });
}

function relationshipFeedback(ids){
  const notes=(ids||[]).filter(id=>state.relations[id]).map(id=>{
    const c=cast.find(x=>x.id===id), r=state.relations[id];
    let mood="仍在观察";
    if(r.jealousy>=60) mood="竞争情绪明显升高";
    else if(r.trust>=55&&r.respect>=45) mood="开始把你的话当真";
    else if(r.heart>=45) mood="注意力正在偏向你";
    else if(r.respect>=30) mood="对你的判断有所改观";
    return `${c?.name||id}：${mood}`;
  });
  return notes.join("　·　");
}

async function chooseDynamic(choice){
  addBlock({type:"player",text:choice.text});
  $("#choices").innerHTML="";
  $("#freeInputWrap").classList.add("hidden");
  await resolveDynamicChoice(choice);
}

async function resolveDynamicChoice(choice){
  $("#choiceHint").textContent="正在生成这一选择带来的后果 · 最长等待3分钟";
  $("#choices").innerHTML="";
  const thinking=document.createElement("div"); thinking.className="story-block thinking"; thinking.innerHTML="<i></i><i></i><i></i>"; $("#storyFeed").appendChild(thinking);
  try{
    const reaction=await generateConsequence(choice);
    thinking.remove();
    const safeBlocks=sanitizeStoryBlocks(reaction.blocks);
    if(!safeBlocks.length) throw new Error("AI后续中没有可显示的合格剧情");
    applyStructuredEffects(choice);
    state.dailyLog.push({day:state.day,slot:slotNames[state.daySlot],choice:choice.text,focus:choice.focus||[]});
    safeBlocks.forEach(addBlock);
    if(reaction.memory) state.memories.push(reaction.memory);
    applyReactionEffects(reaction.effects);
    const feedback=relationshipFeedback([...(choice.focus||[]),...Object.keys(reaction.effects||{})]);
    if(feedback) addBlock({type:"system",text:`关系线索 · ${feedback}`});
    if(reaction.formatFallback) toast("AI返回了正文格式，已直接作为剧情采用");
    if(reaction.recoveredJson) toast("AI返回被截断，已安全恢复完整剧情段落");
    $("#choiceHint").textContent="这一幕尚未完全结束";
    $("#choices").innerHTML=`<button class="choice-btn" id="continueDynamic"><span class="tag">CONTINUE</span>带着这段余波继续节目</button>`;
    $("#continueDynamic").onclick=async()=>{
      const signature=sceneSignature(state.dynamicScene);
      if(!state.daySceneHistory.some(x=>x.day===state.day&&x.slot===state.daySlot)){
        state.daySceneHistory.push({day:state.day,...signature});
      }
      if(state.daySlot>=3){
        state.dynamicScene=null; save(); renderCast();
        if(state.day===17) showSuspendedSignalNight();
        else{
          renderSignals(); switchPanel("phonePanel");
          $("#signalStatus").textContent="今晚，你只能将心动发送给一个人。";
        }
      }else{
        state.daySlot++; state.dynamicScene=null; save(); renderCast(); await directorScene();
        window.scrollTo({top:0,behavior:"smooth"});
      }
    };
    save(); renderCast();
  }catch(e){
    thinking.remove();
    addBlock({type:"system",text:`选择后续生成失败：${readableApiError(e)}。本次选择尚未结算，关系与时间均未改变。`});
    $("#choiceHint").textContent="生成失败";
    $("#choices").innerHTML=`<button class="choice-btn" id="retryConsequence"><span class="tag">RETRY</span>重新生成这一选择的后续</button>`;
    $("#retryConsequence").onclick=()=>resolveDynamicChoice(choice);
  }
  window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});
}

function showSuspendedSignalNight(){
  switchPanel("phonePanel");
  $("#signalStatus").textContent="因真实行动召回，今晚的匿名心动短信暂停。";
  $("#signalList").innerHTML="";
  const box=$("#signalResults");
  box.classList.remove("hidden");
  box.innerHTML=`<h3>节目暂停通知</h3>
    <div class="day-summary">所有男嘉宾已进入行动保密状态。今晚没有短信，也不会因此改变任何人的关系数值。</div>
    <button id="resumeAfterRecall" class="primary-btn wide">结束等待，进入 Day 18</button>`;
  $("#resumeAfterRecall").onclick=()=>advanceDay();
}
function choose(choice){
  if(choice.effect==="phone"){ switchPanel("phonePanel"); return; }
  addBlock({type:"player",text:choice.text});
  applyEffect(choice.effect);
  $("#choices").innerHTML=""; $("#freeInputWrap").classList.add("hidden");
  $("#choiceHint").textContent="你的选择正在改变第一印象";
  setTimeout(()=>{
    if(choice.reply) addBlock({type:"narration",text:choice.reply});
    $("#choices").innerHTML=`<button class="choice-btn" id="continueScene"><span class="tag">CONTINUE</span>继续这一晚</button>`;
    $("#continueScene").onclick=()=>{
      state.scene=Math.min(state.scene+1,scenes.length-1);
      save(); renderCast(); renderScene();
      window.scrollTo({top:0,behavior:"smooth"});
    };
    window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});
  },350);
}
function applyEffect(effect){
  const ids=cast.map(c=>c.id);
  if(ids.includes(effect)){
    const r=state.relations[effect]; r.heart+=8; r.trust+=4; r.respect+=4; r.stage=Math.max(1,r.stage);
    state.firstFocus ||= effect; unlock("firstLook");
  } else if(effect==="group"){
    ids.forEach(id=>{state.relations[id].respect+=2;}); unlock("firstLook");
  } else if(effect==="honest"){
    ids.forEach(id=>{state.relations[id].respect+=3;state.relations[id].trust+=1;});
  } else if(effect==="skill"){
    ids.forEach(id=>state.relations[id].heart+=2); unlock("myTurn");
  }
  if(effect==="honest") unlock("honestFail");
}
async function sendSignal(id){
  if(state.signalSent) return;
  state.signalSent=id;
  state.signalError=null;
  state.signalCommitted=false;
  state.receivedSignals=[];
  save(); renderSignals();
  $("#signalStatus").textContent="短信已发送。AI正在生成匿名信号，慢速模型最长等待3分钟……";
  toast("匿名短信已发送");
  await settleSignals();
}

async function settleSignals(){
  const cfg=getApiConfig();
  try{
    const prompt=`你是COD成年女性向恋综《交火心跳：21日》的匿名短信生成器。不要输出JSON，不要Markdown。
当前Day ${state.day}。玩家今晚发给：${state.signalSent}。
关系：${JSON.stringify(relationSnapshot())}
当日选择：${JSON.stringify(state.dailyLog.filter(x=>x.day===state.day))}
关键记忆：${JSON.stringify(state.memories.slice(-10))}
从六位男嘉宾中决定1-6人是否给玩家发短信。感情低时可以不发；短信必须匿名、1-2句、符合角色口吻，不直接在正文署名，不轮流告白。
每封短信单独一行，严格使用：
[短信:ghost] 短信正文
发送者ID只能是 keegan、krueger、ghost、nikto、konig、zimo。`;
    const data=await callChatModel(cfg,[{role:"system",content:prompt},{role:"user",content:"按逐行标签格式生成今晚短信。"}],{max_tokens:800,temperature:.85},180000);
    const raw=extractAssistantText(data);
    if(!raw) throw new Error(`API返回成功但正文为空；响应结构：${responseShape(data)}`);
    let signals=parseTaggedSignals(raw);
    if(!signals.length) signals=proseToSignals(raw);
    state.receivedSignals=signals;
    if(!state.receivedSignals.length) throw new Error("AI没有返回任何有效短信");
    state.signalError=null;
    if(!state.signalCommitted){
      const r=state.relations[state.signalSent];
      r.heart+=12; r.trust+=3; r.stage=Math.max(1,r.stage);
      state.signalCommitted=true;
      unlock("signal");
    }
    if(state.receivedSignals.length===6) unlock("allVotes");
  }catch(e){
    state.receivedSignals=[];
    state.signalError=readableApiError(e);
  }
  save(); renderSignals();
  $("#signalStatus").textContent=state.signalError?"短信生成失败，请重新生成。":`午夜已过。你收到了 ${state.receivedSignals.length} 封匿名短信。`;
}

async function advanceDay(){
  if(state.day>=21){
    showEndingSelection();
    return;
  }
  state.day++;
  state.scene=0;
  state.daySlot=0;
  state.signalSent=null;
  state.signalError=null;
  state.signalCommitted=false;
  state.receivedSignals=[];
  state.dynamicScene=null;
  state.usedFocus=[];
  state.daySceneHistory=state.daySceneHistory.filter(x=>x.day!==state.day);
  $("#dayNumber").textContent=String(state.day).padStart(2,"0");
  $("#signalResults").classList.add("hidden");
  $("#signalStatus").textContent="今晚，你只能将心动发送给一个人。";
  save();
  switchPanel("storyPanel");
  await directorScene();
}

function endingCandidates(){
  return cast.map(c=>{
    const r=state.relations[c.id];
    const score=r.heart+r.trust+r.respect+r.safety-r.jealousy*.25;
    return {...c,relation:r,score};
  }).sort((a,b)=>b.score-a.score);
}

function groupCompatible(ids){
  for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++){
    if((state.pairRelations?.[pairKey(ids[i],ids[j])]??40)<45) return false;
  }
  return true;
}

function showEndingSelection(){
  const ranked=endingCandidates();
  const singles=ranked.filter(c=>c.relation.stage>=3 || c.score>=95);
  const multi=ranked.filter(c=>c.relation.stage>=3 && c.relation.safety>=45 && c.relation.respect>=35);
  const multiRouteOpen=state.routePolicy!=="single" && (state.dailyLog||[]).some(log=>log.day===20);
  switchPanel("storyPanel");
  $("#dayNumber").textContent="21";
  $("#timeLabel").textContent="19:30";
  $("#locationLabel").textContent="最终选择台";
  $("#sceneTitle").textContent="最终选择";
  $("#sceneSubtitle").textContent="节目组只要求一个答案，但你仍然拥有定义答案的权利。";
  $("#storyFeed").innerHTML="";
  addBlock({type:"system",text:"最终选择不会再增加关系数值。只有二十一天中真正建立的关系具备结局资格。"});
  addBlock({type:"narration",text:"海岸线被黄昏压成一条深色的边。六个位置沿着灯光依次排开，有人站在那里，有人选择把最后的话留在未播采访里。导演示意你走向镜头中央，却没有人能够替你决定接下来要叫出哪个名字。"});
  const options=[];
  singles.slice(0,6).forEach(c=>options.push({label:"单人结局",text:`选择 ${c.name}`,choice:{type:"single",ids:[c.id]}}));
  if(multiRouteOpen && multi.length>=2 && groupCompatible(multi.slice(0,2).map(c=>c.id))) options.push({label:"隐藏结局",text:`邀请 ${multi[0].name} 与 ${multi[1].name} 一起重新讨论规则`,choice:{type:"multi",ids:multi.slice(0,2).map(c=>c.id)}});
  if(multiRouteOpen && multi.length>=3 && groupCompatible(multi.slice(0,3).map(c=>c.id))) options.push({label:"高难结局",text:`拒绝把三段真心排成胜负：${multi.slice(0,3).map(c=>c.name).join("、")}`,choice:{type:"multi",ids:multi.slice(0,3).map(c=>c.id)}});
  if(multiRouteOpen && multi.length>=5 && ranked.reduce((s,c)=>s+c.relation.respect,0)/6>=35) options.push({label:"规则之外",text:"拒绝节目组的单选规则，让所有尚未结束的关系离开镜头后继续",choice:{type:"all",ids:multi.map(c=>c.id)}});
  options.push({label:"独自离开",text:"不选择任何人，带着自己的答案离开节目",choice:{type:"solo",ids:[]}});
  $("#choices").innerHTML=options.map((o,i)=>`<button class="choice-btn" data-ending="${i}"><span class="tag">${o.label}</span>${escapeHtml(o.text)}</button>`).join("");
  $("#choiceHint").textContent="选择最终结局";
  $("#freeInputWrap").classList.add("hidden");
  $$("[data-ending]").forEach(btn=>btn.onclick=()=>generateEnding(options[Number(btn.dataset.ending)].choice));
  $("#signalResults").classList.add("hidden");
}

async function generateEnding(choice){
  state.endingChoice=choice;
  $("#choices").innerHTML="";
  $("#choiceHint").textContent="正在生成三个月后的答案 · 最长等待3分钟";
  const thinking=document.createElement("div"); thinking.className="story-block thinking"; thinking.innerHTML="<i></i><i></i><i></i>"; $("#storyFeed").appendChild(thinking);
  const cfg=getApiConfig();
  const selected=choice.ids.map(id=>cast.find(c=>c.id===id)).filter(Boolean);
  try{
    const prompt=`你为成年女性向COD恋综《交火心跳：21日》生成最终结局。不要JSON，不要Markdown，只用[旁白]与[台词:角色id]标签。
玩家：${JSON.stringify(state.profile)}
最终选择：${choice.type}；对象：${selected.map(c=>c.id).join(",")||"无"}
关系：${JSON.stringify(relationSnapshot())}
二十一天记忆：${JSON.stringify(state.memories.slice(-30))}
关键选择：${JSON.stringify(state.dailyLog.slice(-30))}
角色圣经：${selected.map(c=>characterBible[c.id]).join("\n")}
${proseBible}
写1200-1800字。包含最终选择现场、离开别墅、三个月后采访。单人结局面对军人职业现实；多人结局必须逐人表达自愿、边界和仍待解决的问题，不能突然和平共享；all是开放式“规则之外”，不是所有人瞬间建立稳定关系；solo必须有力量而非惩罚。成人内容不得出现在公开结局现场。`;
    const data=await callChatModel(cfg,[{role:"system",content:prompt},{role:"user",content:"按标签格式生成完整结局。"}],{max_tokens:4200,temperature:.88},180000), raw=extractAssistantText(data);
    if(!raw) throw new Error(`API正文为空；${responseShape(data)}`);
    const reaction=parseTaggedConsequence(raw);
    thinking.remove();
    reaction.blocks.forEach(addBlock);
    state.ending=choice.type;
    state.endingText=cleanModelText(raw);
    state.playthrough=Math.max(1,state.playthrough||1);
    if(choice.type==="multi"||choice.type==="all") unlock("rules");
    if(choice.type==="solo" && endingCandidates().every(c=>c.relation.stage>=3)) unlock("winner");
    save();
    $("#choiceHint").textContent="本周目完成";
    $("#choices").innerHTML=`<button class="choice-btn" id="newCycle"><span class="tag">NEW GAME+</span>开始二周目（保留成就）</button>`;
    $("#newCycle").onclick=()=>startNewCycle();
  }catch(e){
    thinking.remove();
    addBlock({type:"system",text:`结局生成失败：${readableApiError(e)}。你的最终选择已保留，但尚未结算。`});
    $("#choiceHint").textContent="结局生成失败";
    $("#choices").innerHTML=`<button class="choice-btn" id="retryEnding"><span class="tag">RETRY</span>重新生成结局</button><button class="choice-btn" id="backEnding">返回重新选择</button>`;
    $("#retryEnding").onclick=()=>generateEnding(choice);
    $("#backEnding").onclick=()=>showEndingSelection();
  }
}

function startNewCycle(){
  const kept={achievements:[...state.achievements],playthrough:(state.playthrough||1)+1,profile:state.profile};
  localStorage.removeItem(STORE);
  state={
    contentRevision:8,started:true,day:1,scene:0,profile:kept.profile,achievements:kept.achievements,firstFocus:null,
    signalSent:null,signalError:null,signalCommitted:false,
    relations:Object.fromEntries(cast.map(c=>[c.id,{stage:0,heart:0,trust:0,respect:0,desire:0,jealousy:0,safety:35}])),
    pairRelations:createPairRelations(),
    history:[],memories:[],dailyLog:[],dynamicScene:null,daySlot:0,usedFocus:[],receivedSignals:[],daySceneHistory:[],
    playthrough:kept.playthrough,ending:null,endingText:"",endingChoice:null,routePolicy:"undecided"
  };
  save(); switchPanel("storyPanel"); renderCast(); renderSignals(); renderAchievements(); renderScene();
}
function switchPanel(id){
  $$(".panel").forEach(p=>p.classList.toggle("active",p.id===id));
  $$(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.panel===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
async function sendFree(){
  const text=$("#freeInput").value.trim(); if(!text) return;
  addBlock({type:"player",text}); $("#freeInput").value="";
  const cfg=getApiConfig();
  if(!cfg.key){
    addBlock({type:"system",text:"尚未配置 API。请返回里世界首页点击“设置 API”，所有游戏会共用同一套配置。"});
    state.history.push({role:"user",content:text}); save(); return;
  }
  const thinking=document.createElement("div"); thinking.className="story-block thinking"; thinking.innerHTML="<i></i><i></i><i></i>"; $("#storyFeed").appendChild(thinking);
  try{
    const prompt=`你是成年女性向COD恋综文字游戏《交火心跳：21日》的沉浸式叙事引擎。当前是Day ${state.day}，${state.day>1?slotNames[state.daySlot]:"入住日"}。玩家资料：${JSON.stringify(state.profile)}。男嘉宾为Keegan、Krueger、Ghost、Nikto、König、Zimo，保留军人身份、战术习惯与核心性格。当前关系：${JSON.stringify(relationSnapshot())}。关键记忆：${JSON.stringify(state.memories.slice(-10))}。

每次续写约450-750字。必须先写可感知的环境，再通过视线、站位、手部动作、停顿、声线和镜头反应表现人物，不要用“气氛暧昧”“他很心动”这类概括句替代细节。人物不会刚见面就爱上玩家；吸引应当表现为注意力、重新评估、克制的试探或不自觉的补位。保留恋综镜头内外的差异、节目组操控感和成年人的边界意识。

角色母语台词后给中文翻译；避免所有人轮流说话，只有自然相关的人出场。不得替玩家添加未设定的外貌、感受、台词或决定，不得跳跃感情阶段。结尾留下一个具体而细微的互动悬点，不输出选项、数值、标题或解释。`;
    const data=await callChatModel(cfg,[{role:"system",content:prompt},...state.history.slice(-8),{role:"user",content:text}],{max_tokens:1400,temperature:.85},180000); const answer=extractAssistantText(data);
    if(!answer) throw new Error(`API返回成功但正文为空；响应结构：${responseShape(data)}`);
    thinking.remove(); addBlock({type:"narration",text:answer}); state.history.push({role:"user",content:text},{role:"assistant",content:answer}); save();
  }catch(e){ thinking.remove(); addBlock({type:"system",text:`生成失败：${e.message}。请检查接口地址、密钥和模型名称。`}); }
}
function startApp(){
  showScreen("#app"); renderCast(); renderSignals(); renderAchievements(); renderScene(); unlock("arrival");
  $("#dayNumber").textContent=String(state.day).padStart(2,"0");
  if(state.day>1 && !state.dynamicScene) directorScene();
}

load();
$("#ageConfirm").addEventListener("change", e=>{
  $("#enterSetup").classList.toggle("confirmed", e.target.checked);
});
$("#ageConfirm").addEventListener("input", e=>{
  $("#enterSetup").classList.toggle("confirmed", e.target.checked);
});
$("#enterSetup").onclick=()=>{
  openRegistration();
};
$("#profileForm").onsubmit=e=>{
  e.preventDefault();
  const age=Number($("#playerAge").value);
  if(age<21){ $("#formError").textContent="核心女嘉宾年龄必须为21岁以上。"; return; }
  state.profile={
    name:$("#playerName").value.trim(), age, gender:"女",
    look:$("#playerLook").value.trim(), personality:$("#playerPersonality").value.trim(),
    job:$("#playerJob").value.trim(), skills:$("#playerSkills").value.trim(),
    weaknesses:$("#playerWeaknesses").value.trim(), hidden:$("#playerHidden").value.trim(),
    boundaries:$("#playerBoundaries").value.trim(),
    contentLevel:$('input[name="contentLevel"]:checked').value
  };
  state.started=true; save(); startApp();
};
$$(".bottom-nav button").forEach(b=>b.onclick=()=>switchPanel(b.dataset.panel));
$$("[data-close]").forEach(b=>b.onclick=()=>$("#"+b.dataset.close).classList.add("hidden"));
$$(".modal").forEach(m=>m.onclick=e=>{if(e.target===m)m.classList.add("hidden");});
$("#settingsBtn").onclick=()=>{
  const cfg=getApiConfig();
  $("#apiUrl").value=cfg.url||""; $("#apiKey").value=cfg.key||""; $("#apiModel").value=cfg.model||"";
  $("#settingsContentLevel").value=state.profile?.contentLevel||"fade";
  $("#settingsBoundaries").value=state.profile?.boundaries||"";
  populateModels(cfg.models||[],cfg.model||"");
  $("#apiTestStatus").textContent=cfg.key ? `API 已读取里世界首页配置：${cfg.url||'Anthropic 官方接口'} · ${cfg.model}` : "未检测到首页 API，请返回里世界首页设置。";
  $("#settingsModal").classList.remove("hidden");
};
$("#apiModelSelect").onchange=e=>{
  if(e.target.value) $("#apiModel").value=e.target.value;
};
$("#apiModel").oninput=e=>{
  const select=$("#apiModelSelect");
  select.value=[...select.options].some(o=>o.value===e.target.value) ? e.target.value : "";
};
$("#loadModels").onclick=async()=>{
  const status=$("#apiTestStatus");
  const cfg=getApiConfig();
  const url=cfg.url;
  const key=cfg.key;
  if(!url){ status.textContent="当前为 Anthropic 官方接口，模型列表请在里世界首页手动填写。"; return; }
  status.textContent="正在获取模型列表……";
  status.style.color="var(--muted)";
  try{
    const headers={}; if(key) headers.Authorization=`Bearer ${key}`;
    const res=await fetch(modelsEndpoint(url),{headers});
    const text=await res.text();
    if(!res.ok) throw new Error(`HTTP ${res.status} · ${text.slice(0,180)}`);
    const models=normalizeModels(JSON.parse(text));
    if(!models.length) throw new Error("接口返回成功，但没有识别到模型名称");
    populateModels(models,$("#apiModel").value.trim());
    status.textContent=`✓ 已获取 ${models.length} 个模型，请从下拉列表选择`;
    status.style.color="var(--safe)";
  }catch(e){
    status.textContent=`✕ 获取失败：${e.message}。仍可在下方手动填写模型名。`;
    status.style.color="var(--red)";
  }
};
$("#saveSettings").onclick=()=>{
  const models=[...$("#apiModelSelect").options].map(o=>o.value).filter(Boolean);
  const cfg=getApiConfig();
  localStorage.setItem(API_STORE,JSON.stringify({model:cfg.model,models}));
  if(state.profile){
    state.profile.contentLevel=$("#settingsContentLevel").value;
    state.profile.boundaries=$("#settingsBoundaries").value.trim();
    save();
  }
  $("#settingsModal").classList.add("hidden"); toast("游戏设置已保存；API 仍使用里世界首页配置");
};
$("#testSettings").onclick=async()=>{
  const status=$("#apiTestStatus");
  const cfg=getApiConfig();
  status.textContent="正在测试首页 API 配置……";
  try{
    await callChatModel(cfg,[{role:"user",content:"只回复 OK"}],{max_tokens:8,temperature:0},60000);
    status.textContent=`✓ 连接成功：${cfg.url||'Anthropic 官方接口'} · ${cfg.model}`;
    status.style.color="var(--safe)";
  }catch(e){
    status.textContent=`✕ 连接失败：${e.message}`;
    status.style.color="var(--red)";
  }
};
$("#manualSave").onclick=()=>{
  const slot=prompt("保存到槽位 1、2 或 3：","1");
  if(!["1","2","3"].includes(slot)) return;
  localStorage.setItem(`hc21_manual_${slot}`,JSON.stringify({...state,savedAt:new Date().toISOString()}));
  toast(`已保存到槽位 ${slot}`);
};
$("#manualLoad").onclick=()=>{
  const slot=prompt("读取槽位 1、2 或 3：","1");
  if(!["1","2","3"].includes(slot)) return;
  const raw=localStorage.getItem(`hc21_manual_${slot}`);
  if(!raw){ toast(`槽位 ${slot} 为空`); return; }
  try{
    state={...state,...JSON.parse(raw)};
    save(); $("#settingsModal").classList.add("hidden"); startApp(); toast(`已读取槽位 ${slot}`);
  }catch{ toast("存档损坏，无法读取"); }
};
$("#exportSave").onclick=()=>{
  const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download=`hearts-in-crossfire-day${state.day}-save.json`; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$("#importSave").onclick=()=>$("#importSaveFile").click();
$("#importSaveFile").onchange=async e=>{
  const file=e.target.files?.[0]; if(!file) return;
  try{
    const imported=JSON.parse(await file.text());
    if(!imported.profile || !imported.relations) throw new Error("缺少游戏数据");
    state={...state,...imported,contentRevision:8,pairRelations:imported.pairRelations||createPairRelations()};
    save(); $("#settingsModal").classList.add("hidden"); startApp(); toast("存档导入成功");
  }catch(err){ toast(`导入失败：${err.message}`); }
  e.target.value="";
};
$("#resetGame").onclick=()=>{ if(confirm("确定清除当前存档吗？")){localStorage.removeItem(STORE); location.reload();} };
$("#sendFreeInput").onclick=sendFree;
$("#freeInput").onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendFree();}};

if(state.started && state.profile) startApp();
