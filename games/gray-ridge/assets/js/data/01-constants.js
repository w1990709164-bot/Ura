// ══════════════════════════════
// CONSTANTS
// ══════════════════════════════
const GAME_YEAR_BASE = 2060;

const STATS_DEF = [
  {key:'tq', name:'体魄'},
  {key:'mj', name:'敏捷'},
  {key:'jz', name:'精准'},
  {key:'js', name:'技术'},
  {key:'zs', name:'智识'},
  {key:'qs', name:'情商'},
  {key:'yl', name:'医疗'},
];

const LOCATIONS = [
  {id:'hall',    name:'中央议事厅', icon:'🏛', desc:'各势力会议、任务分配、公告'},
  {id:'forge',   name:'锻造区',    icon:'⚒', desc:'武器维护、装备升级'},
  {id:'medical', name:'医疗营',    icon:'🏥', desc:'治伤、休养、药品'},
  {id:'training',name:'训练场',    icon:'🎯', desc:'日常训练、比武'},
  {id:'canteen', name:'公共食堂',  icon:'🍖', desc:'吃饭、闲聊、消息最灵通'},
  {id:'camps',   name:'各势力营地',icon:'⛺', desc:'141/幽灵/KorTac/奇美拉/SpecGru/暗影'},
  {id:'market',  name:'黑市巷',   icon:'🕯', desc:'废墟边缘，随机刷新'},
];

const CHARS = [
  // 141
  {id:'price',   name:'Price',   init:'PR', faction:'141',    species:'狮子',    rank:'上校',     attrs:['zs','qs']},
  {id:'ghost',   name:'Ghost',   init:'GH', faction:'141',    species:'黑豹',    rank:'中士',     attrs:['mj','jz']},
  {id:'soap',    name:'Soap',    init:'SP', faction:'141',    species:'北美灰狼', rank:'上士',     attrs:['tq','mj']},
  {id:'gaz',     name:'Gaz',    init:'GZ', faction:'141',    species:'猎豹',    rank:'中士',     attrs:['qs','zs']},
  // Ghost Squad
  {id:'keegan',  name:'Keegan',  init:'KG', faction:'ghost',  species:'美洲狮',  rank:'中士',     attrs:['jz','mj']},
  {id:'merrick', name:'Merrick', init:'MR', faction:'ghost',  species:'北美野牛', rank:'少校',     attrs:['tq','zs']},
  {id:'hesh',    name:'Hesh',    init:'HS', faction:'ghost',  species:'马更些狼', rank:'中尉',     attrs:['zs','qs']},
  {id:'logan',   name:'Logan',   init:'LG', faction:'ghost',  species:'马更些狼', rank:'中士',     attrs:['tq','mj']},
  // KorTac
  {id:'konig',   name:'König',   init:'KN', faction:'kortac', species:'驼鹿',    rank:'上士',     attrs:['tq','js']},
  {id:'horangi', name:'Horangi', init:'HO', faction:'kortac', species:'韩国白虎', rank:'上尉',     attrs:['qs','yl']},
  {id:'nikto',   name:'Nikto',   init:'NK', faction:'kortac', species:'棕熊',    rank:'前FSB',    attrs:['mj','jz']},
  // Chimera
  {id:'krueger', name:'Krueger', init:'KR', faction:'chimera',species:'绿森蚺',  rank:'前KSK',    attrs:['js','zs']},
  // SpecGru
  {id:'zimo',    name:'Zimo',    init:'ZM', faction:'specgru',species:'东北虎',  rank:'特战兵',   attrs:['jz','qs']},
  // Shadow
  {id:'graves',  name:'Graves',  init:'GV', faction:'shadow', species:'长角牛',  rank:'指挥官',   attrs:['zs','qs']},
];

const BOND_STAGES = ['陌生','族群','同伴','信任','守护','羁绊','命定'];
const FACTION_NAMES = {
  '141':'第141特遣队',
  'ghost':'幽灵小队',
  'kortac':'KorTac',
  'chimera':'奇美拉',
  'specgru':'SpecGru',
  'shadow':'暗影公司',
};

const JOBS = {
  assault:   {name:'突击手',  attrs:['tq','mj']},
  sniper:    {name:'狙击手',  attrs:['jz','mj']},
  medic:     {name:'医疗兵',  attrs:['yl','qs']},
  intel:     {name:'情报专家',attrs:['zs','mj']},
  demo:      {name:'爆破手',  attrs:['js','tq']},
  negotiator:{name:'谈判官',  attrs:['qs','zs']},
};
