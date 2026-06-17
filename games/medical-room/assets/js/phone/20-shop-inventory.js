// ══════════════════════════════
// SHOP & INVENTORY (fix #10)
// ══════════════════════════════
const SHOP_ITEMS = [
  {id:'sensory_spray',  name:'感官抑制喷雾',  price:300, desc:'降低哨兵感官负荷-10', icon:'💊', effect:{mental:-10}},
  {id:'white_noise',    name:'白噪音发生器',  price:500, desc:'诊疗时信任度加成+5%', icon:'🎵', effect:{trust_bonus:5}},
  {id:'anchor',         name:'精神锚定物',    price:600, desc:'进入图景时保护屏障-5', icon:'⚓', effect:{shield_protect:5}},
  {id:'coffee',         name:'特调浓缩咖啡',  price:100, desc:'恢复疲劳-15',          icon:'☕', effect:{fatigue:-15}},
  {id:'shield_potion',  name:'精神稳定剂',    price:400, desc:'恢复精神屏障+20',      icon:'🧪', effect:{shield:20}},
  {id:'gift_book',      name:'奥地利植物图鉴',price:200, desc:'可赠送给König',        icon:'📖', giftFor:'konig'},
  {id:'gift_cigar',     name:'Villa Clara雪茄',price:300,desc:'可赠送给Price',        icon:'🚬', giftFor:'price'},
  {id:'gift_whisky',    name:'苏格兰威士忌',  price:250, desc:'可赠送给Soap',        icon:'🥃', giftFor:'soap'},
  {id:'gift_ammo',      name:'7.62NATO定制弹', price:400, desc:'可赠送给Keegan',     icon:'🔫', giftFor:'keegan'},
  {id:'gift_sticker',   name:'老虎战术贴纸',  price:150, desc:'可赠送给Horangi',     icon:'🐯', giftFor:'horangi'},
];

function openPhoneApp(id) {
  document.getElementById('phone-home').style.display = 'none';
  document.querySelectorAll('.phone-inner').forEach(el=>el.classList.remove('active'));
  const app = document.getElementById('app-'+id);
  if (app) app.classList.add('active');
  // Refresh dynamic content
  if (id === 'wallet') renderWallet();
  if (id === 'bag') renderBag();
  if (id === 'appt') renderPhoneSchedule();
  if (id === 'forum') renderForum();
  if (id === 'journal') renderJournal();
  if (id === 'chat') { renderContactList(); renderMoments(); }
}
