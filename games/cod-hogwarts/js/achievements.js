// ── 成就数据 ──────────────────────────────────────────────
const ACHIEVEMENTS = [
  // 剧情类
  { id:'arrival',       cat:'story',   icon:'仙', name:'东方来客',    desc:'完成角色创建，踏入霍格沃茨。', hidden:false },
  { id:'sorted',        cat:'story',   icon:'帽', name:'分院落定',    desc:'经由分院帽测验，被分入学院。', hidden:false },
  { id:'first_flight',  cat:'story',   icon:'云', name:'第一次离地',  desc:'在众人面前首次御风飞行，不借助任何魔杖或扫帚。', hidden:false },
  { id:'hotpot_night',  cat:'story',   icon:'锅', name:'火锅之夜',    desc:'与Zimo共用魔药课大锅煮了一顿火锅。', hidden:false },
  { id:'night_wander',  cat:'story',   icon:'影', name:'夜半游魂',    desc:'使用隐形药水在深夜潜入他人寝室。', hidden:false },
  { id:'conflict_burst',cat:'story',   icon:'乱', name:'灵魔失控',    desc:'灵魔冲突值达到85，触发灵力暴走事件。', hidden:false },
  { id:'black_market',  cat:'story',   icon:'廊', name:'黑市常客',    desc:'累计访问地下走廊黑市5次。', hidden:false },
  { id:'deep_forest',   cat:'story',   icon:'林', name:'禁忌之地',    desc:'进入禁忌森林的深处区域。', hidden:false },
  { id:'fusion_recipe', cat:'story',   icon:'炉', name:'隐藏处方',    desc:'发现并成功炼制第一个东西混合配方。', hidden:false },
  { id:'herbal_care',   cat:'story',   icon:'药', name:'中药煎煮',    desc:'为生病的角色熬制东方草药，并亲手送去。', hidden:false },
  { id:'hat_secret',    cat:'story',   icon:'密', name:'分院帽的话',  desc:'（隐藏）分院帽犹豫了很久才开口。', hidden:true },
  { id:'midnight_lake', cat:'story',   icon:'湖', name:'深夜黑湖',    desc:'（隐藏）在午夜独自来到黑湖，遇见了某人。', hidden:true },

  // 关系类
  { id:'first_known',   cat:'relation',icon:'识', name:'被记住了',    desc:'与任意角色达到相识阶段（好感≥21）。', hidden:false },
  { id:'heart_break',   cat:'relation',icon:'裂', name:'打开一道门',  desc:'首次突破某角色的心防，进入更深的好感阶段。', hidden:false },
  { id:'ghost_guard',   cat:'relation',icon:'护', name:'保护圈',      desc:'被Ghost纳入他的保护范围。', hidden:false },
  { id:'konig_look',    cat:'relation',icon:'眼', name:'他抬起了头',  desc:'König第一次主动与你对视，没有回避。', hidden:false },
  { id:'zimo_mask',     cat:'relation',icon:'白', name:'那不是真心',  desc:'识破Zimo的白切黑面具，看见了他真正在意的东西。', hidden:false },
  { id:'krueger_truth', cat:'relation',icon:'冤', name:'旧伤',        desc:'听到了Krueger被污蔑的真相。', hidden:false },
  { id:'horangi_past',  cat:'relation',icon:'牌', name:'过去的味道',  desc:'Horangi提到了他从前赌博的那段日子。', hidden:false },
  { id:'anon_gift',     cat:'relation',icon:'礼', name:'无名礼物',    desc:'收到一件没有署名的礼物。', hidden:false },
  { id:'all_known',     cat:'relation',icon:'众', name:'全员相识',    desc:'与14名角色全部达到相识阶段。', hidden:false },
  { id:'four_houses',   cat:'relation',icon:'四', name:'四院通吃',    desc:'每个学院至少有一名角色达到亲密阶段。', hidden:false },
  { id:'first_crush',   cat:'relation',icon:'心', name:'第一个心动',  desc:'任意角色达到心动阶段（好感≥81）。', hidden:false },
  { id:'keegan_web',    cat:'relation',icon:'网', name:'他的网',      desc:'（隐藏）发现Keegan的所有"恰好"都是算计好的。', hidden:true },
  { id:'ghost_face',    cat:'relation',icon:'颜', name:'面罩之下',    desc:'（隐藏）Ghost在你面前摘下了围巾的下半部分。', hidden:true },
  { id:'graves_real',   cat:'relation',icon:'真', name:'一次真实',    desc:'（隐藏）Graves在某个关键时刻说了一句没有目的的真话。', hidden:true },
  { id:'nikto_near',    cat:'relation',icon:'近', name:'他一直在',    desc:'（隐藏）你意识到Nikto出现在你练习场合旁边不是偶然。', hidden:true },
  { id:'konig_whisper', cat:'relation',icon:'低', name:'那句德语',    desc:'（隐藏）König用德语说了一句话，你听不懂，但语气很轻柔。', hidden:true },

  // 战斗类
  { id:'first_win',     cat:'combat',  icon:'战', name:'初战告捷',    desc:'赢得第一场战斗。', hidden:false },
  { id:'nat20',         cat:'combat',  icon:'廿', name:'天然二十',    desc:'在战斗中骰出天然20。', hidden:false },
  { id:'nat1',          cat:'combat',  icon:'壹', name:'天然一',      desc:'在战斗中骰出天然1，并承受了后果。', hidden:false },
  { id:'outnumbered',   cat:'combat',  icon:'众', name:'以一敌众',    desc:'单人对抗3名以上敌人并存活。', hidden:false },
  { id:'defeated',      cat:'combat',  icon:'落', name:'落败',        desc:'第一次HP归零，被某人所救。', hidden:false },
  { id:'squad_battle',  cat:'combat',  icon:'队', name:'全员出战',    desc:'一场战斗中同时有5名以上角色参与。', hidden:false },
  { id:'friendly_fire', cat:'combat',  icon:'殃', name:'池鱼之殃',    desc:'冲突值过高导致灵术失控，打到了队友。', hidden:false },
  { id:'quidditch_fly', cat:'combat',  icon:'飞', name:'御风得分',    desc:'在魁地奇比赛中以御风飞行方式得分。', hidden:false },
  { id:'perfect_run',   cat:'combat',  icon:'满', name:'无伤通关',    desc:'（隐藏）在一场困难级战斗中未受到任何伤害。', hidden:true },
  { id:'duo_ghost',     cat:'combat',  icon:'影', name:'双人幽灵',    desc:'（隐藏）与Ghost配合完成一场完美的暗杀战斗。', hidden:true },
  { id:'surge_control', cat:'combat',  icon:'定', name:'灵力制御',    desc:'（隐藏）在灵力暴走的边缘强行压制成功。', hidden:true },
  { id:'quidditch_win', cat:'combat',  icon:'杯', name:'学院荣光',    desc:'（隐藏）在魁地奇比赛中帮助学院赢得胜利。', hidden:true },

  // 炼药·探索类
  { id:'first_brew',    cat:'craft',   icon:'炼', name:'第一炉',      desc:'成功炼制第一个药剂或丹药。', hidden:false },
  { id:'perfect_brew',  cat:'craft',   icon:'品', name:'极品出炉',    desc:'炼制出极品品质的道具。', hidden:false },
  { id:'fusion_fail',   cat:'craft',   icon:'炸', name:'灾难配方',    desc:'东西混合配方炼制失败并触发副作用。', hidden:false },
  { id:'collector',     cat:'craft',   icon:'藏', name:'收藏家',      desc:'收集10种不同的炼药材料。', hidden:false },
  { id:'all_locations', cat:'craft',   icon:'图', name:'地图探索者',  desc:'解锁游戏中全部地点。', hidden:false },
  { id:'market_found',  cat:'craft',   icon:'秘', name:'隐藏走廊',    desc:'发现地下黑市的入口。', hidden:false },
  { id:'lingqi_heal',   cat:'craft',   icon:'愈', name:'灵气疗愈',    desc:'（隐藏）用灵力直接治愈了他人的伤势，而非药剂。', hidden:true },
  { id:'hotpot_all',    cat:'craft',   icon:'宴', name:'人人皆来',    desc:'（隐藏）火锅夜最终聚集了超过5名角色。', hidden:true },
  { id:'invis_caught',  cat:'craft',   icon:'见', name:'被发现了',    desc:'（隐藏）使用隐形药水探索时，角色感知到了你的存在。', hidden:true },
  { id:'dorm_secret',   cat:'craft',   icon:'密', name:'寝室秘密',    desc:'（隐藏）在某人寝室发现了让你改变对他认知的东西。', hidden:true },

  // 数值类
  { id:'first_break',   cat:'stat',    icon:'破', name:'初窥门径',    desc:'任意数值首次突破阶段上限，进入下一阶段。', hidden:false },
  { id:'conflict_edge', cat:'stat',    icon:'危', name:'两界之间',    desc:'灵魔冲突值达到85但成功压制，未完全暴走。', hidden:false },
  { id:'calm_mind',     cat:'stat',    icon:'静', name:'根基稳固',    desc:'心境达到80。', hidden:false },
  { id:'popular',       cat:'stat',    icon:'众', name:'人见人爱',    desc:'人缘达到80。', hidden:false },
  { id:'dual_path',     cat:'stat',    icon:'双', name:'学贯中西',    desc:'灵力与魔法学识同时达到60以上。', hidden:false },
  { id:'max_lingqi',    cat:'stat',    icon:'仙', name:'大乘境',      desc:'（隐藏）灵力突破至满值100。', hidden:true },
  { id:'zero_conflict', cat:'stat',    icon:'和', name:'两仪归一',    desc:'（隐藏）将灵魔冲突值降至0。', hidden:true },

  // 学院类
  { id:'house_win',     cat:'house',   icon:'冠', name:'学院荣耀',    desc:'在学期末积分结算中，你的学院排名第一。', hidden:false },
  { id:'house_last',    cat:'house',   icon:'末', name:'并不重要',    desc:'（隐藏）在学期末积分结算中，你的学院排名最后——但某人说了句让你意外的话。', hidden:true },
  { id:'house_points',  cat:'house',   icon:'分', name:'积分贡献者',  desc:'单学期内为学院贡献超过100积分。', hidden:false },
  { id:'quidditch_mvp', cat:'house',   icon:'星', name:'赛场之星',    desc:'在一场魁地奇比赛中获得最高评分。', hidden:false },
];

const ACH_MAP = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));
