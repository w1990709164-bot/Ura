// ══════════════════════════════
// YEAR ADVANCE & BIRTHDAY
// ══════════════════════════════
async function advanceYear() {
  document.getElementById('ap-modal')?.remove();
  if ((G.apUsedThisYear || []).length < AP_PER_YEAR) {
    showToast(`还有 ${AP_PER_YEAR - (G.apUsedThisYear || []).length} 个月未完成`);
    return;
  }
  if (G.gameYear >= 7) {
    // Trigger coming of age
    triggerComingOfAge();
    return;
  }

  G.gameYear++;
  G.apUsedThisYear = [];
  G._freeToBond = 0;
  G._freeToGrow = 0;
  G.gameWeek = 1;
  G.apPending = null;
  G.weeklyTaskDone = false;

  // Random market open chance for new year
  G.weeklyMarketOpen = Math.random() < 0.4;

  // Random heat check (成人期才会触发，这里幼崽期不触发)
  saveGame();
  updateTopBar();

  // Get top 3 bond characters for birthday
  const top3 = CHARS
    .map(c=>({c, b:G.bonds[c.id]||{}}))
    .sort((a,b)=>((b.b.stage*100+b.b.value)-(a.b.stage*100+a.b.value)))
    .slice(0,3)
    .filter(x=>(x.b.stage||0)>0 || (x.b.value||0)>0);

  // Generate birthday gifts via AI
  showToast('🎂 生辰将至…');
  const giftData = await generateBirthdayGifts(top3);
  triggerYearTransition(G.gameYear, giftData);
}

async function generateBirthdayGifts(top3) {
  if (!top3.length || !G.apiKey) return [];
  try {
    const charDescs = top3.map(({c,b})=>`${c.name}(${c.species}，${BOND_STAGES[b.stage||0]}阶段，好感${b.value||0}%)`).join('，');
    const prompt = `你是《灰脊》的叙事引擎。现在是${G.player.name}的生辰，她今年${G.gameYear}岁（幼崽）。
以下${top3.length}位角色好感度最高，请为每位角色生成一份生日礼物描述和一句祝福话语。
角色：${charDescs}
玩家种族：${G.player.race}

请严格返回如下JSON格式，不要有其他内容：
[{"charId":"角色id","giftName":"礼物名称","giftDesc":"礼物一句话描述","message":"角色说的祝福话（符合角色语言风格，母语+中文翻译）"}]`;

    const raw = await fetchAI(prompt, [{role:'user',content:'生成生日礼物'}]);
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      const arr = JSON.parse(match[0]);
      return arr.map(item=>{
        const c = CHARS.find(x=>x.id===item.charId);
        return { init: c?.init||'?', name: item.giftName||'神秘礼物', desc: item.giftDesc||'', message: item.message||'……' };
      });
    }
  } catch(e) { console.warn('Birthday gift gen failed:', e); }
  // Fallback
  return top3.map(({c})=>({ init:c.init, name:'手工礼物', desc:'精心准备的', message:'……' }));
}
