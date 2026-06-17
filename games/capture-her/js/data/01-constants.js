// ═══════════════════════════════
// CONSTANTS
// ═══════════════════════════════
const CHARS = [
  {id:'price',  name:'Price',   init:'PR', faction:'141',        rank:'上校',   nation:'英国', chatId:'老板',         abo:'Alpha', phero:'雪松与烟草'},
  {id:'ghost',  name:'Ghost',   init:'GH', faction:'141',        rank:'中尉',   nation:'英国', chatId:'000',          abo:'Alpha', phero:'冷金属与寒夜'},
  {id:'soap',   name:'Soap',    init:'SP', faction:'141',        rank:'中士',   nation:'苏格兰',chatId:'麦克泰维什不在',abo:'Alpha', phero:'松木与海盐'},
  {id:'gaz',    name:'Gaz',     init:'GZ', faction:'141',        rank:'中士',   nation:'英国', chatId:'还在线',        abo:'Alpha', phero:'柑橘与檀木'},
  {id:'keegan', name:'Keegan',  init:'KG', faction:'ghost_squad',rank:'中士',   nation:'美国', chatId:'K',            abo:'Alpha', phero:'皮革与冷杉'},
  {id:'merrick',name:'Merrick', init:'MR', faction:'ghost_squad',rank:'上尉',   nation:'美国', chatId:'条例第七条',    abo:'Alpha', phero:'铁与大地'},
  {id:'hesh',   name:'Hesh',    init:'HS', faction:'ghost_squad',rank:'中尉',   nation:'美国', chatId:'沃克二号',      abo:'Alpha', phero:'松针与晨露'},
  {id:'logan',  name:'Logan',   init:'LG', faction:'ghost_squad',rank:'中士',   nation:'美国', chatId:'沃克',         abo:'Alpha', phero:'新鲜泥土与草木'},
  {id:'konig',  name:'König',   init:'KN', faction:'kortac',     rank:'特战员', nation:'奥地利',chatId:'█████',       abo:'Alpha', phero:'云杉与山间寒风'},
  {id:'horangi',name:'Horangi', init:'HO', faction:'kortac',     rank:'上尉',   nation:'韩国', chatId:'虎虎虎虎虎',    abo:'Alpha', phero:'绿茶与晴天'},
  {id:'nikto',  name:'Nikto',   init:'NK', faction:'kortac',     rank:'前FSB',  nation:'俄国', chatId:'没有人',        abo:'Alpha', phero:'桦木与烟'},
  {id:'krueger',name:'Krueger', init:'KR', faction:'chimera',    rank:'前KSK',  nation:'奥地利',chatId:'无罪',         abo:'Alpha', phero:'沉香与冷石'},
  {id:'zimo',   name:'Zimo',    init:'ZM', faction:'specgru',    rank:'特战兵', nation:'中国', chatId:'天津卫',        abo:'Alpha', phero:'墨与雨后青草'},
  {id:'graves', name:'Graves',  init:'GV', faction:'shadow',     rank:'指挥官', nation:'美国', chatId:'CEO',          abo:'Alpha', phero:'威士忌与皮革'},
];

const FACTIONS = {
  '141':'第141特遣队', 'ghost_squad':'幽灵小队',
  'kortac':'KorTac', 'chimera':'奇美拉',
  'specgru':'SpecGru', 'shadow':'暗影公司',
};

const PHASES = ['morning','midday','evening'];
const PHASE_LABELS = {morning:'早晨·任务派发', midday:'白天·事件触发', evening:'傍晚·群聊'};
