// ══════════════════════════════
// SPIRIT APPEARANCE (real world)
// ══════════════════════════════
const SPIRIT_EVENTS = [
  {charId:'konig', minPhase:2, text:'*走廊里你感觉到什么东西从脚边擦过，低头看，什么都没有。但地板上有一小片湿印。*'},
  {charId:'ghost', minPhase:3, text:'*你抬头，窗玻璃上映出一道黑色的影，回头什么都不在。但窗台上有一根黑色的羽毛。*'},
  {charId:'keegan',minPhase:3, text:'*宿舍外的树上，有一双眼睛看着你。你眨眼，不见了。*'},
  {charId:'soap',  minPhase:2, text:'*食堂里有什么在你腿边蹭了一下，你低头，空的。但你的手背上残留着一点温度。*'},
  {charId:'konig', minPhase:4, text:'*半夜，你醒来，桌上的植物图鉴被翻开了——翻到你上次没翻过的那页。*'},
  {charId:'horangi',minPhase:3, text:'*训练场上，有只大猫懒洋洋地坐在器械顶上打哈欠，你揉眼睛，没了。*'},
];

function checkSpiritAppearance() {
  // Use trustPhase as the gate: minTrust now represents the minimum trustPhase required
  const eligible = SPIRIT_EVENTS.filter(e=>{
    const p = G.patients[e.charId];
    return p && (p.trustPhase||0) >= e.minPhase && Math.random() < 0.15;
  });
  if (eligible.length > 0) {
    const ev = eligible[Math.floor(Math.random()*eligible.length)];
    setTimeout(()=>addNarr(ev.text), 3000 + Math.random()*5000);
  }
}
