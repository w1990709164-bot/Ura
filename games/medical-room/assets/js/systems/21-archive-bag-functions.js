// ══════════════════════════════
// ARCHIVE BAG FUNCTIONS
// ══════════════════════════════
function getBagLevel(n) {
  if (n <= 1) return '公开';
  if (n <= 3) return '限阅';
  if (n <= 6) return '机密';
  if (n <= 9) return '高度机密';
  return '绝密';
}
function getBagLevelClass(n) {
  if (n <= 1) return 'level-public';
  if (n <= 3) return 'level-restrict';
  if (n <= 6) return 'level-secret';
  if (n <= 9) return 'level-topsecret';
  return 'level-classified';
}

const BAG_TITLES = {
  keegan: ['入职基础档案','感官评估报告','Marine Corps服役记录','Operation Sand Viper · 2005','心理评估·第一年','感官图谱·听觉','图景报告·永夜针叶林','个人陈述·未完成','精神体报告·美洲狮','—'],
  ghost:  ['入职基础档案','感官评估报告','Manchester·早期记录','Zaragoza事件·2004','心理评估·拒绝配合','Tommy·2009','图景报告·废弃工业区','骷髅面罩·来源','精神体报告·黑豹','Simon'],
  soap:   ['入职基础档案','感官评估报告','SAS选拔·纪录','耳鸣·诊断报告','Price·关系档案','图景报告·苏格兰河流','母亲·格拉斯哥','—'],
  gaz:    ['入职基础档案','感官评估报告','SAS纪录·选拔','图景报告·英国乡村','家·个人档案','—'],
  price:  ['入职基础档案','感官评估报告','Pripyat·1996','Soap·导师档案','图景报告·苏格兰荒野','失去的人·名单','精神体报告·狮子','Bravo Six'],
  hesh:   ['入职基础档案','感官评估报告','San Diego·童年记录','Elias·2027','Logan·兄弟档案','图景报告·初冬加州丘陵','Walker这个名字','—'],
  logan:  ['入职基础档案','感官评估报告','成长记录·Elias视角','Riley·军犬档案','图景报告·大雾加州丘陵','第一句话','精神体报告·马更些狼','Logan T. Walker'],
  merrick:['入职基础档案','感官评估报告','SEAL训练·最年轻纪录','Operation Sand Viper·指挥记录','重量·心理评估','图景报告·深夜军港','父亲·Fallujah','—'],
  konig:  ['入职基础档案','感官评估报告','奥地利·童年记录','KSK申请·被拒记录','面罩·第一次','心理评估·社交障碍','图景报告·奥地利地下湖','门缝里的东西','精神体报告·巨型章鱼','—'],
  horangi:['入职基础档案','感官评估报告','韩国特战·服役记录','图景报告·韩国山地秋天','寺庙·家族记录','—'],
  nikto:  ['入职基础档案','感官评估报告','FSB·卧底档案','折磨·医疗记录','Nobody·名字的来源','人格记录·已知','图景报告·无尽图书馆','渡鸦·哪一只','精神体报告·渡鸦群','Andre'],
  krueger:['入职基础档案','感官评估报告','奥地利·童年记录','KSK·服役记录','Operation Nachtigall·2018','Golem·背叛','双头鹰·纹身记录','图景报告·阿尔卑斯教堂','精神体报告·绿森蚺','Josef'],
  zimo:   ['入职基础档案','感官评估报告','利刃突击营·服役记录','祖母·家族档案','图景报告·华北平原黄昏','—'],
  graves: ['入职基础档案','感官评估报告','德克萨斯·早期记录','暗影公司·创立档案','图景报告·德克萨斯荒原','那栋房子','精神体报告·德克萨斯长角牛','Philip'],
  kick:   ['入职基础档案','感官评估报告','白帽黑客·早期记录','伊莱亚斯·招募档案','Keegan·带训记录','图景报告·数字荒野','K1CK·网名来源','战绩汇编·电子战','精神体报告·游隼','—'],
};

function getBagTitle(charId, n) {
  return BAG_TITLES[charId]?.[n-1] || `档案 #${n}`;
}


// Full bag content for ALL characters
const BAG_CONTENTS = {
  keegan: [
    {title:'入职基础档案', level:'公开', content:'姓名：Keegan P. Russ · 职级：中士 · 单位：幽灵小队\n服役年限：11年 · 专长：长距离狙击、渗透侦察\n现任职位：幽灵小队战术狙击手\n备注：沙蛇行动幸存者 · 能力等级：S'},
    {title:'感官评估报告', level:'限阅', content:'主治医师备注：\n"患者对听觉刺激反应异常敏感，拒绝说明原因。\n测试期间全程保持极低声音环境，否则拒绝配合。\n感官负荷长期维持在高位，本人否认有任何不适。"'},
    {title:'Marine Corps服役记录', level:'限阅', content:'Force Recon训练成绩：优秀\n狙击手资质认证：通过\n任务记录：[已涉密]\n\n一张训练场的老照片，背面铅笔字：\n"Good shot, Russ. —M"'},
    {title:'Operation Sand Viper · 2005', level:'机密', content:'行动概要：[大量内容已涂黑]\n时间：2005年4月\n地点：伊朗边境附近\n初始兵力：60人 · 最终幸存：15人\n\n幸存者名单第三行：Keegan P. Russ\n出生年份旁有红笔问号——他那年十六岁。'},
    {title:'心理评估·第一年', level:'机密', content:'沙蛇行动后心理评估报告\n\n评估师手写结尾：\n"他不谈那三天。\n但他睡觉时把枪放在枕头旁边。"'},
    {title:'感官图谱·听觉', level:'机密', content:'详细听觉感官地图\n标注了哪些频率会触发过载\n\n某个频率旁Keegan自己写了：\n"第二天黎明前。枪声。"\n\n就这一句，没有更多。'},
    {title:'图景报告·永夜针叶林', level:'高度机密', content:'向导观察报告（手绘不完整地图）\n\n备注：\n"第三次进入，它在距离我约二十米的树上\n看了我四分钟，没有动。"'},
    {title:'个人陈述·未完成', level:'高度机密', content:'一份Keegan开始写又停下的陈述\n只有开头两行：\n\n"2005年4月的第一天，\n我们还有六十个人。"\n\n下面是空白。纸张有轻微褶皱，像是被攥过。'},
    {title:'精神体报告·美洲狮', level:'高度机密', content:'精神体活动轨迹记录\n\n最后一页是一张素描，美洲狮蜷在树根下\n旁边Keegan用极小的字写了：\n\n"它从来不睡觉。\n我也是。"'},
    {title:'—', level:'绝密', content:'一张便条，他的笔迹：\n\n"你是第一个进来的人。\n我不知道该说什么。\n所以我什么都不说了。"\n\n便条压着一枚7.62NATO弹壳。'},
  ],
  ghost: [
    {title:'入职基础档案', level:'公开', content:'姓名：Simon "Ghost" Riley · 职级：中尉 · 单位：TF141\n[大量内容标注"已删除"]\n连出生地都是空白，只剩职级和代号。'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"患者全程未摘面罩，拒绝眼神接触。\n但对环境细节的感知精度远超正常值。\n当我移动了桌上一支笔，他立刻注意到了。"'},
    {title:'Manchester·早期记录', level:'限阅', content:'一份极简的童年档案\n父亲姓名：[涂黑] · 母亲姓名：[涂黑]\n弟弟：Tommy Riley\n\n只剩一行地址：\n"Manchester, England"'},
    {title:'Zaragoza事件·2004', level:'机密', content:'被活埋事件行动报告 [大部分涂黑]\n\n可见的只有：\n"Riley, Simon\nStatus: MIA → KIA → Recovered"\n\n三个状态的更改记录，日期跨度四个月。'},
    {title:'心理评估·拒绝配合', level:'机密', content:'三份心理评估报告\n每份结尾都是：\n"患者拒绝继续本次评估。"\n\n第三份评估师加了一句：\n"但他回来了。"'},
    {title:'Tommy·2009', level:'机密', content:'一份事故报告，内容涂黑\n只有一行日期和地点\n\n受害者名单：\nTommy Riley, Beth Riley, Joseph Riley\n\nGhost的名字出现在"通知人"一栏。'},
    {title:'图景报告·废弃工业区', level:'高度机密', content:'向导进入记录\n标注了三处陷阱位置\n\n备注：\n"第二层有一扇门，门后是空的。\n但他每次经过都会停下来。"'},
    {title:'骷髅面罩·来源', level:'高度机密', content:'一张照片描述：\nTommy生前照片，戴着骷髅图案的万圣节面罩\n对镜头做鬼脸。\n\n照片背面没有字。'},
    {title:'精神体报告·黑豹', level:'高度机密', content:'精神体观察记录\n\n最后一页：\n"它第一次靠近我的时候，\n我注意到它的眼睛。\n不是愤怒。是疲惫。"'},
    {title:'Simon', level:'绝密', content:'"Simon Riley. 1984-∞.\nNot a ghost. Still here."\n\n下面压着一颗曼彻斯特的鹅卵石。'},
  ],
  soap: [
    {title:'入职基础档案', level:'公开', content:'姓名：John "Soap" MacTavish · 职级：中士 · 单位：TF141\n国籍：英国（苏格兰·格拉斯哥）· 专长：全能型，适应力强\n备注：Price上尉手写："Watch this one. He\'s good. —但别让他知道。"'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"患者是我见过配合度最高也最话多的哨兵。\n他在整个评估过程中问了我二十七个问题。\n其中有三个是真的很好的问题。"'},
    {title:'SAS选拔·纪录', level:'限阅', content:'选拔成绩单，几项纪录用红色标注\n\n教官评语："史上最嘴碎的优秀学员。"\n下面Soap自己加了一句：\n"Aye, and the best one too."'},
    {title:'耳鸣·诊断报告', level:'机密', content:'轻度听觉感官震荡，任务噪音暴露所致\n\nSoap在备注栏手写：\n"Docs say it\'ll pass.\n我说行吧，反正耳朵响总比什么都听不见强。"'},
    {title:'Price·关系档案', level:'机密', content:'与Price共同执行任务的记录，密密麻麻\n\n最后一条Soap写了：\n"他不说废话，但他每次都在。\n我数过——他救了我六次。他不知道我数了。"'},
    {title:'图景报告·苏格兰河流', level:'机密', content:'向导观察记录\n\n备注：\n"牧羊犬一直在来回跑，\n不停地把河里漂来的东西叼上岸再扔回去。\n它很快，但不知道要去哪里。"'},
    {title:'母亲·格拉斯哥', level:'高度机密', content:'一份关于家庭的信息片段\n\n备注：\n"他说起格拉斯哥的方式，\n像是那是一个很远很远的地方，\n不是因为距离，而是因为现在的他。"'},
    {title:'—', level:'绝密', content:'一张便条，他的字，很潦草：\n\n"Aye, I know I\'m the rookie.\nBut I\'m learning.\nFaster than they think."\n\n旁边有一个小小的，不太熟练的格拉斯哥市徽涂鸦。'},
  ],
  gaz: [
    {title:'入职基础档案', level:'公开', content:'姓名：Kyle "Gaz" Garrick · 职级：中士 · 单位：TF141\n备注：由Price上尉直接提名入队。'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"这是我评估过的最稳定的哨兵。\n有点不正常的稳定。"'},
    {title:'SAS纪录·选拔', level:'限阅', content:'选拔成绩，多项第一\n\n某项旁边有人用铅笔写了：\n"Soap比你慢三秒。别告诉他。"\n笔迹是Price的。'},
    {title:'图景报告·英国乡村清晨', level:'机密', content:'向导记录\n\n备注：\n"这是我进入过的最平静的图景。\n但平静本身就是一种答案——\n他把所有东西都收得太干净了。"'},
    {title:'家·个人档案', level:'高度机密', content:'一张家庭照片描述，父母，Gaz年轻时\n普通的英国家庭\n\n背面他的字：\n"They don\'t know what I do.\nBetter that way."'},
    {title:'—', level:'绝密', content:'一张便条：\n"You asked me once why I\'m always okay.\nI\'m not.\nI just know which battles to pick."'},
  ],
  price: [
    {title:'入职基础档案', level:'公开', content:'姓名：John Price · 职级：上尉 · 单位：TF141\n服役年限：30年+ · 专长：指挥、近战、狙击\n备注：拒绝所有勋章提名。'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"Price上尉全程抽着雪茄，回答每个问题都只用一句话。\n但数据显示他的感官负荷已经在临界值维持了很多年了。\n他只是习惯了。"'},
    {title:'Pripyat·1996', level:'限阅', content:'切尔诺贝利狙击任务报告（部分涂黑）\n\n可见：\n"目标存活。Price中尉左肩中弹。\nMacMillan上尉腿部骨折。\nPrice中尉独自将MacMillan背至撤离点。"'},
    {title:'Soap·导师档案', level:'机密', content:'Price对Soap的内部评估报告，专业冷静\n\n最后一行：\n"他会比我更好。"'},
    {title:'图景报告·苏格兰荒野高地', level:'机密', content:'向导记录\n\n备注：\n"风很大，但他站在最高的那块石头上。\n图景里没有其他人。\n我不确定这是孤独还是选择。"'},
    {title:'失去的人·名单', level:'高度机密', content:'一份手写名单，名字很多\n每个名字后面有一个日期。\n\n最后一行是空白的，只有一个破折号。'},
    {title:'精神体报告·狮子', level:'高度机密', content:'精神体观察记录\n\n备注：\n"它的鬃毛里有很多白色。\n它看着我的方式不像在审视敌人——\n更像在看一个它决定信任的人。\n我不确定自己配得上。"'},
    {title:'Bravo Six', level:'绝密', content:'一张便条，Price的字，极简：\n\n"Still standing. That\'s enough."\n\n下面压着半截Villa Clara雪茄。'},
  ],
  hesh: [
    {title:'入职基础档案', level:'公开', content:'姓名：David "Hesh" Walker · 职级：中尉 · 单位：幽灵小队\n父亲：Elias T. Walker（已故）\n兄弟：Logan Walker（在队）'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"患者全程保持高度警觉，\n每隔几分钟会看一眼门口方向。\n问他在看什么，他说：\"习惯了。\""'},
    {title:'San Diego·童年记录', level:'限阅', content:'一张儿时照片描述：\nHesh和Logan在树林里，\n父亲Elias站在后面，\n三个人都在看同一个方向。\n\nLogan踩着Hesh的脚印。'},
    {title:'Elias·2027', level:'机密', content:'Elias Walker死亡报告，大量内容涂黑\n可见："目击者：David Walker，Logan Walker。"\n\nHesh在报告空白处写了一个字：\n"Sorry."'},
    {title:'Logan·兄弟档案', level:'机密', content:'Hesh自己写的一份关于Logan的观察记录，密密麻麻\n\n最后：\n"他不说话，但他一直在。\n这就够了。"'},
    {title:'图景报告·初冬加州丘陵', level:'机密', content:'向导记录\n\n备注：\n"马更些狼在山脊上，一直往南边看。\n那个方向是San Diego。"\n同时记录："Logan的图景今天有轻微震动。"'},
    {title:'Walker这个名字', level:'高度机密', content:'一封Hesh写给Logan但没有寄出的信：\n\n"你像爸爸，我也像爸爸。\n但我们都比他更害怕失去对方。"'},
    {title:'—', level:'绝密', content:'那张Logan小时候的画，\n背面Hesh写了：\n\n"我把它挂起来了。"'},
  ],
  logan: [
    {title:'入职基础档案', level:'公开', content:'姓名：Logan Walker · 职级：中士 · 单位：幽灵小队\n性格一栏："沉默型。"\n特殊备注："本人不开口，由兄长David Walker代为提供信息。"'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"全程未说话。\n但当我提到Riley（军犬）时，\n他的感官负荷读数下降了8个单位。"'},
    {title:'成长记录·Elias视角', level:'限阅', content:'Elias留下的育儿笔记片段：\n\n"Logan总是踩着Hesh的脚印走。\n我有一次回头，只看到两组脚印。\n他把自己藏进去了。"'},
    {title:'Riley·军犬档案', level:'机密', content:'Riley的服役档案\nLogan被列为"副处理员"\n\n备注栏Logan的字（极少见）：\n"他不需要命令。他知道。"'},
    {title:'图景报告·大雾加州丘陵', level:'机密', content:'向导记录\n\n备注：\n"雾很厚，我几乎找不到他。\n但马更些狼一直在原地。\n它不是迷路——它在等什么人。"\n同时记录："Hesh的图景今天有轻微震动。"'},
    {title:'第一句话', level:'高度机密', content:'一份特殊记录，向导的手写：\n\n"今天他开口说话了。只有一句。\n\"He used to sleep on my feet.\"\n他说的是Riley。"'},
    {title:'精神体报告·马更些狼', level:'高度机密', content:'精神体观察记录\n\n备注：\n"它第一次嚎叫是在第七次进入图景的时候。\n声音很小，像是在练习。\nHesh的图景里，那头马更些狼停下来侧耳听了很久。"'},
    {title:'Logan T. Walker', level:'绝密', content:'一张他自己画的画，一只马更些狼\n\n旁边有他的字迹：\n"I think I know what I sound like now."'},
  ],
  merrick: [
    {title:'入职基础档案', level:'公开', content:'姓名：Thomas A. Merrick · 职级：上尉 · 单位：幽灵小队\n三代军人记录，祖父，父亲，本人\n一张家族照，三代人都穿着军装。'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"Merrick上尉将本次评估视为一项需要高效完成的任务。\n他全程计时。"'},
    {title:'SEAL训练·最年轻纪录', level:'限阅', content:'训练成绩，17岁完成记录标红\n\n教官评语：\n"他比大他十岁的人更了解自己的极限在哪里。"'},
    {title:'Operation Sand Viper·指挥记录', level:'机密', content:'沙蛇行动中Merrick的指挥日志\n\n第三天记录：\n"还剩十五个人。我数过六十次了。"'},
    {title:'重量·心理评估', level:'机密', content:'评估师记录：\n"他描述指挥官的职责时使用了"重量"这个词三次。\n我问他重不重，他说："我没有感觉到。"\n这才是问题所在。"'},
    {title:'图景报告·深夜军港', level:'机密', content:'向导记录\n\n备注：\n"水面很平静。但虎鲸在深处游动的时候，\n整个港口的水都在微微震动。\n他以为没有人察觉。"'},
    {title:'父亲·Fallujah', level:'高度机密', content:'父亲Nicholas Merrick的阵亡通知书\n\nMerrick在空白处写了一行字：\n"I\'ll finish what you started."'},
    {title:'—', level:'绝密', content:'一份他亲手写的评估报告——评估对象是他自己。\n\n最后一行：\n"Status: Still functional. Barely."'},
  ],
  konig: [
    {title:'入职基础档案', level:'公开', content:'姓名：König · 职级：特种兵 · 单位：KorTac\n身高：2米+ · 国籍：奥地利\n备注："本人要求保留面罩，已批准。"'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"患者在评估全程距离门口不超过两步。\n感官数据显示严重过载，\n但他的表情完全看不出来。"'},
    {title:'奥地利·童年记录', level:'限阅', content:'学校档案，成绩优秀\n但出勤记录有多次缺席\n原因一栏："霸凌相关事件"\n具体内容空白。'},
    {title:'KSK申请·被拒记录', level:'机密', content:'他最初申请KSK被拒的记录\n原因："心理评估未通过。"\n\n三年后重新申请，通过了。\n评估师换了一个人。'},
    {title:'面罩·第一次', level:'机密', content:'一份KorTac内部记录，同队成员陈述：\n\n"他第一次戴上面罩是在一次任务之后。\n没有人问他为什么。\n大家都假装没注意到。"'},
    {title:'心理评估·社交障碍', level:'机密', content:'评估报告\n诊断："社交焦虑，躯体变形恐惧倾向。"\n\nKönig在报告边缘写了：\n"我知道自己长什么样子。"'},
    {title:'图景报告·奥地利地下湖', level:'高度机密', content:'向导记录\n\n备注：\n"湖水很深。章鱼第一次伸出触手的时候，\n我没有动。\n我们就这样对视了很久。\n那是目前为止整个图景里最安静的时刻。"'},
    {title:'门缝里的东西', level:'高度机密', content:'一张纸，上面是一幅手绘素描——\n诊疗室的窗外景色，画得很细，很安静\n\n右下角签了一个极小的K。'},
    {title:'精神体报告·巨型章鱼', level:'高度机密', content:'精神体观察记录\n\n备注：\n"它把一条触手搭在我手腕上的时候，\n整个图景的光线亮了一点。\nKönig在图景外问：\"它有没有伤到你？\"\n这是他第一次主动关心我。"'},
    {title:'—', level:'绝密', content:'"Danke. Thank you. 谢谢你。"\n三种语言。\n\n便条旁边夹着那本植物图鉴里\n他最喜欢的那一页的书签。'},
  ],
  horangi: [
    {title:'入职基础档案', level:'公开', content:'姓名：Horangi · 职级：特种兵 · 单位：KorTac\n国籍：韩国 · 专长：全能\n备注栏他自己写的："호랑이. 别忘了。"'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"这是我见过配合度最高的哨兵。\n他甚至提前做了功课，知道每个测试在测什么。\n然后他给我讲了二十分钟老虎的冷知识。"'},
    {title:'韩国特战·服役记录', level:'限阅', content:'出色的服役记录\n某次任务评语：\n"独自完成了原定需要四人小组的渗透任务，\n事后解释说队友\"太吵了\"。"'},
    {title:'图景报告·韩国山地秋天', level:'机密', content:'向导记录\n\n备注：\n"这是所有图景里唯一一个让我觉得放松的地方。\n老虎走过来在我旁边坐下了，像只猫。\n我不确定这是信任还是他在逗我。"'},
    {title:'寺庙·家族记录', level:'高度机密', content:'图景里寺庙的原型——\n他家乡山上的一座小寺庙，家族每年都去\n\n一张合影，他站在最边上，\n比所有人都高一头，笑得最大声。'},
    {title:'—', level:'绝密', content:'一张战术贴纸，老虎图案\n和他贴在装备上那个一模一样\n\n背面写了：\n"You\'re not as scary as you think you are, Doc.\nThat\'s a compliment."'},
  ],
  nikto: [
    {title:'入职基础档案', level:'公开', content:'姓名：Nikto（真实姓名：机密）\n职级：特种兵 · 单位：KorTac\n国籍：俄罗斯\n其余大量涂黑。'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"患者在评估过程中回答了所有问题，\n但我无法确认哪些答案来自同一个\"他\"。"'},
    {title:'FSB·卧底档案', level:'限阅', content:'卧底任务概要，渗透Zakhaev武器网络\n任务时长两年\n\n结果："身份暴露，被捕。"\n后续空白。'},
    {title:'折磨·医疗记录', level:'机密', content:'获救后的医疗报告，面部损伤记录\n\n心理诊断："急性解离性人格障碍"\n\n医生备注：\n"他问我他叫什么名字。"'},
    {title:'Nobody·名字的来源', level:'机密', content:'一份俄语文件的翻译片段\n内容是Zakhaev手下的审讯记录\n\n其中一行：\n"他说他叫Nikto。没有人。\n我们都笑了。"'},
    {title:'人格记录·已知', level:'机密', content:'医疗记录，已记录的人格状态及触发条件\n\n某一项旁边有字：\n"这一个记得Andre是谁。"\n\nAndre是他的真名。'},
    {title:'图景报告·无尽图书馆', level:'高度机密', content:'向导记录\n\n备注：\n"我在第三层找到了一个书架，\n上面所有档案袋都是空的。\n但有一个不一样——\n它的封面上写了\"Andre Nikto\"，\n里面有一张照片，照片里的人在笑。\n我不知道那是不是他。"'},
    {title:'渡鸦·哪一只', level:'高度机密', content:'向导观察记录：\n"今天有一只渡鸦落在了我肩上。\n其他的都没动。\n我问它叫什么名字。\n它用俄语说了一个词。\n我查了，那个词的意思是：\"我记得。\""'},
    {title:'精神体报告·渡鸦群', level:'高度机密', content:'精神体观察记录\n\n备注：\n"当所有渡鸦同时看向我的时候，\n我意识到——\n它们不是不同的人格，\n它们是同一个人，在不同时间的碎片。\n他们都记得一些，但没有一个记得全部。"'},
    {title:'Andre', level:'绝密', content:'那个空白档案袋里终于有了东西——\n一张照片，一个年轻人在笑\n\n背面三个字：\n"I remember."'},
  ],
  krueger: [
    {title:'入职基础档案', level:'公开', content:'姓名：Sebastian Josef Krueger · 单位：奇美拉\n国籍：奥地利 · 前KSK\n备注："前战争罪嫌疑人（本人否认），现状：已结案。"'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"他回答每个问题都精确到只有问题要求的信息量，不多一个字。\n但他的感官数据显示他捕捉到了我今天换了香皂。"'},
    {title:'奥地利·童年记录', level:'限阅', content:'学校成绩优秀\n一张童年照片描述：\n山间小镇，他和父母在教堂门口，阳光很好，他在笑。\n\n背面没有字。'},
    {title:'KSK·服役记录', level:'机密', content:'以Josef Doss身份的服役记录，长程侦察优秀\n\nGolem的评语：\n"talent in a troubled mind."'},
    {title:'Operation Nachtigall·2018', level:'机密', content:'莫桑比克行动报告，大量涂黑\n\n可见："平民死亡，弹道与Krueger武器一致。"\n\nKrueger在档案边缘写了一行：\n"I did not."'},
    {title:'Golem·背叛', level:'机密', content:'Krueger逃离KSK的记录\nGolem协助逃跑但随后与他断绝关系\n\n最后一行记录：\n"Krueger独自越境，方向：东欧。"'},
    {title:'双头鹰·纹身记录', level:'高度机密', content:'医疗记录中的纹身描述\n俄罗斯国徽双头鹰，覆盖整个胸口\n\n医疗记录员备注：\n"询问纹身含义，患者说：\"拜占庭的事。\"\n没有进一步解释。"'},
    {title:'图景报告·阿尔卑斯教堂', level:'高度机密', content:'向导记录\n\n备注：\n"今天我走到教堂门口，试着推了一下——\n门没有锁。\n但他站在原地没有动。\n我回头看他，他说：\"我知道。\""'},
    {title:'精神体报告·绿森蚺', level:'高度机密', content:'精神体观察记录\n\n备注：\n"它把身体缠在教堂门柱上，头搭在我肩上，很重，但很暖。\nKrueger在远处看着，第一次没有背对我。"'},
    {title:'Josef', level:'绝密', content:'一张明信片，奥地利山间小镇，教堂在阳光下\n\n背面他的字：\n"The door was never locked.\nI just forgot how to knock."'},
  ],
  zimo: [
    {title:'入职基础档案', level:'公开', content:'姓名：王志强（Zhiqiang "Zimo" Wang）\n单位：SpecGru · 国籍：中国（天津）\n家族军人传统，祖母参加过中国内战。'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"数据稳定，精神状态良好。\n唯一异常是当我提到家乡时，\n他的感官负荷有轻微波动——\n不是痛苦，更像是一种遥远的疼。"'},
    {title:'利刃突击营·服役记录', level:'限阅', content:'火箭军精锐服役档案，任务记录\n\n备注："执行过全球多处核设施保护任务。"\n\n一张任务合影，他站在最边上，表情认真。'},
    {title:'祖母·家族档案', level:'机密', content:'祖母的简短传记，中国内战参与记录\n一张老照片，年轻的祖母穿着军装\n和Zimo有几分相似\n\n背面她的字："为了后来的人。"'},
    {title:'图景报告·华北平原黄昏', level:'高度机密', content:'向导记录\n\n备注：\n"金雕一直在空中盘旋，从不落地。\n我在高粱地里站了很久，抬头看它。\n它也在看我。\n我问Zimo为什么它不落下来，\n他沉默了一会，说：\n\"落下来就回不去了。\""'},
    {title:'—', level:'绝密', content:'那张天津老街照片\n背面多了他新写的字：\n\n"我回去过一次。\n街还在。"'},
  ],
  graves: [
    {title:'入职基础档案', level:'公开', content:'姓名：Phillip Graves · 职级：CEO · 单位：暗影公司\n国籍：美国（德克萨斯）\n备注："本人主动预约，原因：\"例行检查，保持竞争力。\""'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"Graves先生将本次评估变成了一次关于我的问询。\n我花了二十分钟才意识到我在回答他的问题。"'},
    {title:'德克萨斯·早期记录', level:'限阅', content:'军事训练记录，早期表现\n\n某位教官评语：\n"他不是最强的，但他是最会让你觉得他是最强的那个。"'},
    {title:'暗影公司·创立档案', level:'机密', content:'公司创立记录\n最早的成员名单只有三个人\n其中一个已经划掉了\n\nGraves在那个名字旁边写了：\n"My fault."'},
    {title:'图景报告·德克萨斯荒原', level:'机密', content:'向导记录\n\n备注：\n"图景里有一栋房子，灯是亮的。\n他带我走了很远，但始终没有走近那栋房子。\n我没有问。"'},
    {title:'那栋房子', level:'高度机密', content:'向导的后续记录：\n\n"今天他走向那栋房子了，在门口停下来，没有进去。\n他说：\n"There are people in there I don\'t want to disappoint.""'},
    {title:'精神体报告·德克萨斯长角牛', level:'高度机密', content:'精神体观察记录\n\n备注：\n"它站在那栋房子和我们之间，\n不是在保护房子——\n是在保护他不要走进去然后失望。"'},
    {title:'Philip', level:'绝密', content:'一张便条，第一次没有用职业语气：\n\n"I went in.\nIt was okay.\nThought you should know."'},
  ],
  kick: [
    {title:'入职基础档案', level:'公开', content:'代号：Kickstart / Kick\n职级：下士 · 单位：幽灵小队 · 电子战\n专长：系统入侵、通讯干扰、水陆两栖机动\n备注："破格录用。伊莱亚斯上校特批。"'},
    {title:'感官评估报告', level:'限阅', content:'评估师备注：\n"患者配合度极高，全程保持鸭舌帽和护目镜。\n感官数据显示听觉异常敏锐——\n他能感知到我笔记本电脑的风扇频率变化。\n这应该是长年接触高频电子设备的结果。"'},
    {title:'白帽黑客·早期记录', level:'限阅', content:'民间黑客档案（前塔时期）\n\n网名：K1Ck\n主要活动：破解多国企业安防、捣毁黑市数据集团\n\n某机构的追踪报告边缘有人手写了：\n"找到他之前让他把漏洞补上了。\n这小子不一般。—E"'},
    {title:'伊莱亚斯·招募档案', level:'机密', content:'伊莱亚斯亲签的破格录用报告\n\n原因栏：\n"技术能力S级，心性纯粹，三观可信赖。\n年龄不是问题，战场才是标准。"\n\n旁边Kick用小字写了：\n"Cap，我没让你失望，对吗。"'},
    {title:'Keegan·带训记录', level:'机密', content:'Keegan P. Russ带训报告，内容简短：\n\n"技术不需要我教，\n战场判断需要。\n他学得很快。"\n\n报告结尾Kick写了：\n"Russ就是那种你说感谢他会更沉默的人。\n所以我没说。"'},
    {title:'图景报告·数字荒野', level:'机密', content:'向导记录\n\n备注：\n"游隼在信号流最密集的地方停着，\n看见我进来立刻俯冲，\n在我肩边掠过但没有停下，\n绕了一圈才回到高处。\n他在测试我够不够快。"'},
    {title:'K1CK·网名来源', level:'高度机密', content:'一份他自己写的备忘录，语气很跳脱：\n\n"K1Ck = Kickstart，但1代替了i。\n因为那年我第一次黑进一个系统，\n用的是一台被丢弃的旧主机，\n编号里有个1。\n我不知道那算不算某种命运。\nProbably overthinking it. Heh."\n\n便条旁边夹着一颗旧主机的内存条。'},
    {title:'战绩汇编·电子战', level:'高度机密', content:'主要战绩记录：\n\n· 黑入敌方防空系统，掩护直升机接应全队\n· 水下破解电子安防，完成纵深渗透\n· 城区就地解锁民用车辆电控，一秒带队突围\n· 切断敌军通讯，为小队创造三十秒撤离窗口\n· 远程关停重兵设防据点的大门\n\n评级：S\n\nKeegan在最后写了一行：\n"I trained him.\n—K.R."'},
    {title:'精神体报告·游隼', level:'高度机密', content:'精神体观察记录\n\n备注：\n"第一次进入图景时，游隼在极高处。\n我等了很久它才下来，\n在我头顶盘旋一圈，\n然后停在离我一米的信号柱上。\n\n它的眼神很锐利，\n但尾羽轻轻摆动着——\n我突然想到一个词：\n好奇。"'},
    {title:'—', level:'绝密', content:'一条手机截图，一段代码注释：\n\n// TODO: tell them i was scared too\n// but the door opened\n// so i went in\n// no sweat.\n\n截图时间是某次任务结束后十分钟。\n代码从来没有提交。'},
  ],
};


function openBag(charId, n) {
  const c = CHARS.find(x => x.id === charId);
  if (!c) return;
  const unlocked = G.unlockedBags[charId] || 0;
  if (n > unlocked) { showToast('档案袋尚未解锁'); return; }
  const bagData = BAG_CONTENTS[charId]?.[n-1];
  if (!bagData) { showToast('档案内容加载失败'); return; }

  // Show bag content modal
  const existing = document.getElementById('bag-content-modal');
  if (existing) existing.remove();
  const bg = document.createElement('div');
  bg.id = 'bag-content-bg';
  bg.style.cssText = 'position:fixed;inset:0;background:rgba(5,8,16,0.92);z-index:9499;backdrop-filter:blur(6px)';
  document.body.appendChild(bg);

  const modal = document.createElement('div');
  modal.id = 'bag-content-modal';
  modal.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    z-index:9500;background:#0a1020;
    border:1px solid #1e3040;border-radius:8px;
    width:min(360px,92vw);max-height:80vh;
    display:flex;flex-direction:column;
    box-shadow:0 0 40px rgba(0,229,255,0.15);
    animation:msg-in 0.3s ease-out;
  `;
  const levelColors = {'公开':'#00ffcc','限阅':'#ffd600','机密':'#00e5ff','高度机密':'#ff2d6b','绝密':'#ff3030'};
  const levelColor = levelColors[bagData.level] || '#00e5ff';
  modal.innerHTML = `
    <div style="padding:16px;border-bottom:1px solid #1e3040;flex-shrink:0">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="font-size:20px">📂</div>
        <div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;color:#e8f4ff">${c.name}</div>
          <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:#2a4050;letter-spacing:1px">档案袋 #${String(n).padStart(2,'0')} · <span style="color:${levelColor}">${bagData.level}</span></div>
        </div>
      </div>
      <div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:600;color:${levelColor}">${bagData.title}</div>
    </div>
    <div style="flex:1;overflow-y:auto;padding:16px;-webkit-overflow-scrolling:touch">
      <div style="font-family:'Noto Serif SC',serif;font-size:13.5px;color:#c8dde8;line-height:2;white-space:pre-wrap">${bagData.content}</div>
    </div>
    <div style="padding:12px 16px;border-top:1px solid #1e3040;flex-shrink:0">
      <button onclick="document.getElementById('bag-content-modal').remove();document.getElementById('bag-content-bg').remove()"
        style="width:100%;padding:10px;background:rgba(0,229,255,0.08);border:1px solid #1e3040;border-radius:4px;color:#5a7a90;font-family:'Share Tech Mono',monospace;font-size:11px;cursor:pointer;letter-spacing:1px">
        收起档案
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  bg.onclick = () => { modal.remove(); bg.remove(); };
}

function renderBag() {
  // Inventory
  const invEl = document.getElementById('inventory-list');
  if (invEl) {
    const consumables = G.inventory.filter(i=>!i.giftFor);
    const giftable = G.inventory.filter(i=>i.giftFor);
    if (giftable.length + consumables.length === 0) {
      invEl.innerHTML = '<div style="font-family:var(--mono);font-size:12px;color:var(--text3);text-align:center;padding:16px 0">背包是空的</div>';
    } else {
      invEl.innerHTML = [...giftable, ...consumables].map(item=>`
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;margin-bottom:8px">
          <div style="font-size:20px">${item.icon}</div>
          <div style="flex:1">
            <div style="font-family:var(--hud);font-size:13px;font-weight:600;color:var(--white)">${item.name}</div>
            <div style="font-family:var(--mono);font-size:10px;color:var(--text3)">${item.desc}</div>
            ${item.giftFor?`<div style="font-family:var(--mono);font-size:9px;color:var(--teal);margin-top:2px">礼品 · 赠送给 ${CHARS.find(c=>c.id===item.giftFor)?.name||item.giftFor}</div>`:''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <div style="font-family:var(--mono);font-size:9px;color:var(--text3)">x${item.qty||1}</div>
            ${item.giftFor
              ? `<button onclick="giftItem('${item.id}')" style="background:rgba(0,255,204,0.1);border:1px solid var(--teal-dim);border-radius:4px;color:var(--teal);font-family:var(--mono);font-size:10px;padding:3px 8px;cursor:pointer">赠送</button>`
              : `<button onclick="useItem('${item.id}')" style="background:var(--cyan-glow);border:1px solid var(--cyan-dim);border-radius:4px;color:var(--cyan);font-family:var(--mono);font-size:10px;padding:3px 8px;cursor:pointer">使用</button>`
            }
          </div>
        </div>`).join('');
    }
  }
  // Gifts received
  const giftEl = document.getElementById('gifts-list');
  if (giftEl) {
    if (G.gifts.length === 0) {
      giftEl.innerHTML = '<div style="font-family:var(--mono);font-size:12px;color:var(--text3);text-align:center;padding:16px 0">还没有礼物记录</div>';
    } else {
      giftEl.innerHTML = G.gifts.map(g => {
        const isSent = g.direction === 'sent';
        const label = isSent
          ? `<span style="color:var(--teal)">→ 赠送给 ${g.to||'—'}</span>`
          : `<span style="color:var(--cyan)">← 来自 ${g.from||'—'}</span>`;
        return `
          <div style="padding:10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;margin-bottom:8px">
            <div style="font-family:var(--hud);font-size:12px;margin-bottom:4px">${label}</div>
            <div style="font-family:var(--serif);font-size:13px;color:var(--text)">${g.item}</div>
            <div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:4px">${g.date}</div>
          </div>`;
      }).join('');
    }
  }
  // Shop
  const shopEl = document.getElementById('shop-list');
  if (shopEl) {
    shopEl.innerHTML = SHOP_ITEMS.map(item=>`
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;margin-bottom:8px">
        <div style="font-size:20px">${item.icon}</div>
        <div style="flex:1">
          <div style="font-family:var(--hud);font-size:13px;font-weight:600;color:var(--white)">${item.name}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text3)">${item.desc}</div>
        </div>
        <button onclick="buyItem('${item.id}')" style="background:var(--cyan-glow);border:1px solid var(--cyan-dim);border-radius:4px;color:var(--cyan);font-family:var(--mono);font-size:10px;padding:4px 8px;cursor:pointer;white-space:nowrap">${item.price}积分</button>
      </div>`).join('');
  }
}

function buyItem(itemId) {
  const item = SHOP_ITEMS.find(i=>i.id===itemId);
  if (!item) return;
  if (!spendMoney(item.price, `购买${item.name}`)) return;
  const existing = G.inventory.find(i=>i.id===itemId);
  if (existing) { existing.qty = (existing.qty||1) + 1; }
  else { G.inventory.push({...item, qty:1}); }
  saveGame();
  renderBag();
  showToast(`✓ 购买成功：${item.name}`);
}

function useItem(itemId) {
  const idx = G.inventory.findIndex(i=>i.id===itemId);
  if (idx === -1) return;
  const item = G.inventory[idx];
  // Apply effect
  if (item.effect?.fatigue) G.playerStats.fatigue = Math.max(0, G.playerStats.fatigue + item.effect.fatigue);
  if (item.effect?.shield)  G.playerStats.shield  = Math.min(100, G.playerStats.shield + item.effect.shield);
  if (item.effect?.mental && G.clinicSession) {
    G.patients[G.clinicSession].mental = Math.max(0, G.patients[G.clinicSession].mental + item.effect.mental);
  }
  // Remove or reduce qty
  if ((item.qty||1) <= 1) G.inventory.splice(idx,1);
  else item.qty--;
  saveGame();
  renderBag();
  showToast(`使用了${item.name}`);
}

function giftItem(itemId) {
  const idx = G.inventory.findIndex(i=>i.id===itemId);
  if (idx === -1) return;
  const item = G.inventory[idx];
  if (!item.giftFor) { showToast('这个物品无法赠送'); return; }
  const c = CHARS.find(x=>x.id===item.giftFor);
  if (!c) return;
  const p = G.patients[item.giftFor];
  if (!p || p.visitCount === 0) {
    showToast(`需要先与${c.name}接触后才能赠送`);
    return;
  }
  // Apply gift effect: trust bonus
  if (p.trustAccum !== undefined) p.trustAccum = Math.min(p.trustAccum + 15, (PHASE_THRESHOLDS[p.trustPhase||0]||100));
  p.trust = Math.min(100, (p.trust||0) + 8);
  // Remove from inventory
  if ((item.qty||1) <= 1) G.inventory.splice(idx,1);
  else item.qty--;
  // Record gift — direction: 'sent' = player→char, 'received' = char→player
  G.gifts = G.gifts || [];
  G.gifts.push({from: G.player.name||'向导医生', to: c.name, item: item.name, date: `第${G.day}天`, direction: 'sent'});
  // Add to chat history as system message
  if (!G.chatHistories[item.giftFor]) G.chatHistories[item.giftFor] = [];
  G.chatHistories[item.giftFor].push({role:'assistant', content: `[收到礼物] 你送来了「${item.name}」。（${item.desc}）`});
  // Narrate in main scene
  addNarr(`*你将${item.name}作为礼物送给了${c.name}。*`);
  // Push to AI context
  G.history.push({role:'user', content:`[赠送礼物] 我把「${item.name}」送给了${c.name}。请描写${c.name}收到礼物时的反应，符合他的性格，必须包含四个选项，格式：[OPTIONS: A.xxx | B.xxx | C.xxx | D.xxx]`});
  saveGame();
  renderBag();
  renderContactList();
  showToast(`✓ 已将${item.name}赠送给${c.name}`);
  // Close phone and trigger AI response
  closePhone();
  callAI();
}


function addJournalEntry(text, dateStr) {
  if (!G.journalEntries) G.journalEntries = [];
  const gd = getGameDate();
  const date = dateStr || gd.full;
  const slotTimeMap = {0:'09:00', 1:'12:00', 2:'17:00', 3:'20:00'};
  const timeStr = slotTimeMap[Math.min(G.slotsUsed, 3)] || '09:00';
  G.journalEntries.unshift({ date: `${date} · ${timeStr}`, text });
  if (G.journalEntries.length > 30) G.journalEntries.pop();
  renderJournal();
  saveGame();
}

function renderJournal() {
  const el = document.getElementById('journal-content');
  if (!el) return;

  const allEntries = G.journalEntries && G.journalEntries.length > 0
    ? [...G.journalEntries]
    : [{ date: '2060.01.01 · 09:00', text: '今天是上岗第一天。诊疗室比想象中安静，绿萝掉了两片叶子。' }];

  // 按天分组
  const groups = {};
  const groupOrder = [];
  allEntries.forEach(e => {
    // 从 date 里提取天标识，如"第3天"或"2060.01.03"
    const dayKey = e.date ? e.date.split(' ·')[0].trim() : `第${G.day}天`;
    if (!groups[dayKey]) {
      groups[dayKey] = [];
      groupOrder.push(dayKey);
    }
    groups[dayKey].push(e);
  });

  // 渲染手风琴
  el.innerHTML = groupOrder.map((dayKey, idx) => {
    const entries = groups[dayKey];
    const isFirst = idx === 0; // 最新一天默认展开
    const domId = `journal-day-${idx}`;
    return `
      <div style="border-bottom:1px solid var(--border);margin-bottom:2px">
        <!-- 天标题行，点击展开/折叠 -->
        <div onclick="toggleJournalDay('${domId}')"
          style="display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;background:var(--bg3);border-radius:4px;margin-bottom:2px;transition:background 0.2s"
          onmousedown="this.style.background='var(--bg2)'" onmouseup="this.style.background='var(--bg3)'">
          <div id="${domId}-arrow" style="font-family:var(--mono);font-size:10px;color:var(--cyan);width:12px;flex-shrink:0;transition:transform 0.2s;${isFirst?'transform:rotate(90deg)':''}"
          >▶</div>
          <div style="font-family:var(--mono);font-size:11px;color:var(--text2);flex:1;letter-spacing:1px">${dayKey}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text3);background:var(--bg);border:1px solid var(--border);padding:2px 8px;border-radius:10px">${entries.length}条</div>
        </div>
        <!-- 条目列表 -->
        <div id="${domId}" style="display:${isFirst?'block':'none'};padding:0 4px 8px">
          ${entries.map(e => `
            <div style="padding:8px 12px;margin-bottom:4px;background:var(--bg);border:1px solid var(--border);border-radius:4px;border-left:2px solid var(--border2)">
              <div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-bottom:4px;letter-spacing:1px">${e.date}</div>
              <div style="font-family:var(--serif);font-size:13px;color:var(--text);line-height:1.8">${e.text}</div>
            </div>`).join('')}
        </div>
      </div>`;
  }).join('');
}

function toggleJournalDay(domId) {
  const content = document.getElementById(domId);
  const arrow   = document.getElementById(domId + '-arrow');
  if (!content) return;
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(90deg)';
}
function addMoment(charId, text, time) {
  const c = CHARS.find(x=>x.id===charId);
  if (!c) return;
  MOMENTS_DATA.unshift({
    charId, name: c.name,
    av: c.init,
    text,
    time: time || `第${G.day}天`,
    likes: 0,
    comments: [],
    canComment: true,
  });
  // Keep max 20 moments
  if (MOMENTS_DATA.length > 20) MOMENTS_DATA.pop();
  // Update chat badge
  const badge = document.getElementById('chat-badge');
  if (badge) badge.textContent = '!';
  // Re-render if moments tab is currently visible
  if (document.getElementById('chat-moments')?.style.display !== 'none') renderMoments();
}

// Add a dynamic forum post from a character after their session
const FORUM_ID_COUNTER = { n: 100 };
function addForumPost(charId, title, content, tag) {
  const c = CHARS.find(x=>x.id===charId);
  const tagLabel = {gossip:'八卦', lost:'失物招领', intel:'情报', notice:'通知', anon:'匿名'}[tag] || '匿名';
  FORUM_DATA.unshift({
    id: 'dyn_' + (++FORUM_ID_COUNTER.n),
    tag: tag || 'gossip',
    tagLabel,
    title,
    author: c ? c.name : '匿名',
    time: `第${G.day}天`,
    preview: content.slice(0, 40) + (content.length > 40 ? '…' : ''),
    content,
    replies: [],
    views: Math.floor(Math.random()*30)+1,
  });
  if (FORUM_DATA.length > 30) FORUM_DATA.pop();
  const badge = document.getElementById('appt-badge');
  // Re-render if forum is open
  if (document.getElementById('forum-list')) renderForum();
}

// Player posts to moments
function playerPostMoment() {
  const input = document.getElementById('player-moment-input');
  const text = input?.value.trim();
  if (!text) return;
  MOMENTS_DATA.unshift({
    charId: 'player', name: G.player.name || '向导医生',
    av: (G.player.name||'向导').slice(0,2),
    text,
    time: `第${G.day}天`,
    likes: 0,
    comments: [],
    canComment: true,
  });
  if (MOMENTS_DATA.length > 20) MOMENTS_DATA.pop();
  input.value = '';
  renderMoments();
  showToast('动态已发布');
}

// Player posts to forum
function playerPostForum() {
  const titleEl = document.getElementById('player-forum-title');
  const bodyEl = document.getElementById('player-forum-body');
  const title = titleEl?.value.trim();
  const body = bodyEl?.value.trim();
  if (!title || !body) { showToast('标题和内容不能为空'); return; }
  addForumPost('player', title, body, 'gossip');
  if (titleEl) titleEl.value = '';
  if (bodyEl) bodyEl.value = '';
  showToast('帖子已发布');
  renderForum();
}

// Trigger moments and forum posts after clinic sessions
function triggerPostSessionMoment(charId) {
  const c = CHARS.find(x=>x.id===charId);
  const p = G.patients[charId];
  if (!c || !p) return;

  // Moments post (60% chance)
  if (Math.random() < 0.6) {
    const momentTemplates = {
      soap:    ["Just had my check-up. Doc's... not bad. / 「刚做完检查，医生还不错。」",
                "Earrings still ringing but whatever. / 「耳鸣还在响但没事。」",
                "MacTavish recommends: the clinic on floor 3. / 「MacTavish推荐：三楼诊疗室。」"],
      ghost:   [".", "*沉默*", "—"],
      horangi: ["오늘 진료 받았는데 괜찮네요. / 「今天去看诊了，还可以。」",
                "의사 선생님이 신기하게도 많이 이해해 주더라고요. / 「医生居然还挺理解人的。」",
                "호랑이도 가끔은 쉬어야 한다. / 「老虎也需要休息。」"],
      konig:   ["...", "*删除了一条动态*", "Heute war ein schwerer Tag. / 「今天很沉重。」"],
      price:   ["Routine check done. / 「例行检查完成。」",
                "Still in one piece. / 「还没散架。」"],
      keegan:  ["—", "Done."],
      gaz:     ["Mandatory check-in complete. / 「强制签到完成。」",
                "The new doc's alright. / 「新医生还行。」"],
      graves:  ["Voluntary this time. / 「这次是自愿去的。」"],
      merrick: ["Checked in at medical. As required. / 「已按要求前往医疗部报到。」"],
      hesh:    ["Checked in. Logan, you should too. / 「打卡了，Logan你也该去了。」"],
      logan:   ["—"],
      nikto:   ["Я был там. / 「我去了那里。」", "..."],
      krueger: ["Pflicht erfüllt. / 「职责已尽。」"],
      zimo:    ["中啊，打卡完事了。", "去了趟三楼，还行。"],
      kick:    ["Just hacked my way through that check-up. / 「我用我的方式完成了今天的检查。」","Doc's got good reaction time. Noted. / 「医生反应挺快的，记下来了。」","System check complete. All good. / 「系统检测完成。一切正常。」"],
    };
    const templates = momentTemplates[charId];
    if (templates) {
      addMoment(charId, templates[Math.floor(Math.random()*templates.length)]);
      renderMoments();
    }
  }

  // Forum post (25% chance, only after 2nd+ visit)
  if (p.visitCount >= 2 && Math.random() < 0.25) {
    const forumTemplates = {
      soap:    {title:'三楼那个新向导医生……', content:'不知道是不是就我这样，但三楼新来的向导医生挺有两下子的。耳鸣的事他居然一次就找到了突破口。有条件的可以去约个号。', tag:'gossip'},
      horangi: {title:'例行疏导复查感想', content:'第三诊疗组的例行疏导比预期有效。建议各位不要排斥疏导，感官问题早发现早处理。', tag:'intel'},
      price:   {title:'关于医疗强检流程', content:'今天完成了上级要求的例行检查。制度归制度，但执行质量确实参差不齐。第三诊疗组的新向导至少是认真的。', tag:'intel'},
      merrick: {title:'精神疏导强制执行通知', content:'根据塔医疗部规定，所有一线人员须按周期完成精神压力评估。第三诊疗组负责执行本轮检查，请各部门配合安排时间。', tag:'notice'},
      konig:   {title:'（匿名）', content:'有没有人觉得那个诊疗室比较安静……就单纯的安静。', tag:'anon'},
      kick:    {title:'关于电子战哨兵的感官问题（技术向）', content:'感官过载其实有点像系统溢出——输入量超过处理上限。有没有人研究过用特定频率信号做预缓冲的？单纯好奇，不是在写论文。', tag:'intel'},
    };
    const tmpl = forumTemplates[charId];
    if (tmpl) addForumPost(charId, tmpl.title, tmpl.content, tmpl.tag);
  }
}

function renderStatus() {
  const body = document.getElementById('status-body');
  const ps = G.playerStats;
  body.innerHTML = `
    <div class="player-status-card">
      <div class="psc-header">
        <div class="psc-av">${G.player.name.slice(0,2)}</div>
        <div class="psc-info">
          <div class="psc-name">${G.player.name}</div>
          <div class="psc-role">${G.playerStats.level||'见习'}向导医生 · 第三诊疗组</div>
        </div>
        <div class="psc-level">${G.playerStats.level||'见习'}</div>
      </div>
      <div class="stat-row">
        <div class="stat-lbl">精神屏障</div>
        <div class="stat-bar"><div class="stat-fill fill-shield" style="width:${ps.shield}%"></div></div>
        <div class="stat-val">${ps.shield}</div>
      </div>
      <div class="stat-row">
        <div class="stat-lbl">疏导疲劳</div>
        <div class="stat-bar"><div class="stat-fill fill-fatigue" style="width:${ps.fatigue}%"></div></div>
        <div class="stat-val">${ps.fatigue}</div>
      </div>
      <div class="stat-row">
        <div class="stat-lbl">污染度</div>
        <div class="stat-bar"><div class="stat-fill fill-contam" style="width:${ps.contam}%"></div></div>
        <div class="stat-val">${ps.contam}</div>
      </div>
    </div>
    <div class="section-title">已接触患者</div>
  `;
  // Show contacted patients: any sign of contact
  const contacted = CHARS.filter(c => {
    const p = G.patients[c.id];
    if (!p) return false;
    if (G.clinicSession === c.id) return true;
    if ((G.unlockedBags[c.id]||0) > 0) return true;
    if ((p.visitCount||0) > 0) return true;
    if (p.trust > 0 || p.trustAccum > 0) return true;
    if (p.tags && p.tags.length > 0 && !p.tags.includes('初次接触')) return true;
    // Check contacts list
    if (G.contacts && G.contacts.includes(c.id)) return true;
    return false;
  });
  if (contacted.length === 0) {
    body.innerHTML += `<div style="font-family:var(--mono);font-size:12px;color:var(--text3);text-align:center;padding:20px 0">尚未接触任何患者</div>`;
  }
  contacted.forEach(c=>{
    const p = G.patients[c.id];
    body.innerHTML += `
      <div class="patient-mini" onclick="openOverlay('archive-panel');renderArchive();setTimeout(()=>openCharArchive('${c.id}'),100)" style="cursor:pointer">
        <div class="pm-av active">${c.init}</div>
        <div class="pm-info">
          <div class="pm-name">${c.name}</div>
          <div class="pm-unit">${c.unit}</div>
          <div class="pm-bars">
            <div class="pm-bar" title="精神力"><div class="pm-fill" style="width:${p.mental}%;background:var(--cyan)"></div></div>
            <div class="pm-bar" title="信任进度"><div class="pm-fill" style="width:${getPhaseProgress(c.id).pct}%;background:var(--teal)"></div></div>
            <div class="pm-bar" title="应激值"><div class="pm-fill" style="width:${p.stress}%;background:var(--pink)"></div></div>
          </div>
          <div style="font-family:var(--mono);font-size:9px;color:var(--text3);margin-top:3px">
            阶段${(p.trustPhase||0)+1} · ${PHASE_LABELS[p.trustPhase||0]||'戒备'} · 接诊${p.visitCount||'?'}次
            ${p.spiritContact?'<span style="color:var(--teal);margin-left:4px">◈ 精神体已接触</span>':''}
          </div>
        </div>
      </div>`;
  });
}
