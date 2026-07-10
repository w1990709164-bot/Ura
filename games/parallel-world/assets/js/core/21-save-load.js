// ════════════════════════════════
// SAVE / LOAD
// ════════════════════════════════
async function buildSaveSlots(){
  const wrap=document.getElementById('save-slots-ui');wrap.innerHTML='';
  // 自动档
  let autoSnap=null;
  const _lgar=await Store.get('cod_autosave'); if(_lgar) try{autoSnap=JSON.parse(_lgar);}catch(e){}
  const autoDiv=document.createElement('div');autoDiv.className='save-slot';
  autoDiv.style.cssText='border-left:2px solid var(--gold);opacity:0.9;';
  autoDiv.innerHTML=`<div class="save-slot-info"><span class="save-slot-num" style="color:var(--gold)">AUTO</span><span class="save-slot-data" style="${!autoSnap?'color:rgba(232,220,200,0.22)':''}">${autoSnap?`${autoSnap.date} · Day ${autoSnap.day} · ${autoSnap.name}`:'— 暂无自动存档 —'}</span></div>
    <div class="save-slot-btns"><button class="ss-btn" style="${!autoSnap?'opacity:0.3':''}" ${!autoSnap?'disabled':''} onclick="loadAutoSave()">读</button></div>`;
  wrap.appendChild(autoDiv);
  // 手动档
  [0,1,2].forEach(i=>{
    const s=G.saves[i];
    const div=document.createElement('div');div.className='save-slot';
    div.innerHTML=`<div class="save-slot-info"><span class="save-slot-num">SLOT 0${i+1}</span><span class="save-slot-data" style="${!s?'color:rgba(232,220,200,0.22)':''}">${s?`${s.date} · Day ${s.day} · ${s.name}`:'— 空档 —'}</span></div>
      <div class="save-slot-btns"><button class="ss-btn" onclick="saveToSlot(${i})">存</button><button class="ss-btn" onclick="loadFromSlot(${i})" style="${!s?'opacity:0.3':''}" ${!s?'disabled':''}>读</button></div>`;
    wrap.appendChild(div);
  });
}
async function loadAutoSave(){
  let snap=null;
  const _lar=await Store.get('cod_autosave'); if(_lar) try{snap=JSON.parse(_lar);}catch(e){}
  if(!snap){ showMsg('没有自动存档'); return; }
  Object.assign(G,normalizeParallelSave(snap));
  loadGlobalApiIntoState(); // API 以主页为准，不用存档里的旧值
  show('s-game');
  updateBountyTimer();
  updateBountyButtons();
  showMsg('已读取自动存档');
}
async function saveToSlot(i){
  if(!G.playerName){ showMsg('请先开始游戏再存档'); return; }
  const {saves:_s, currentBoard:_cb, currentPost:_cp, ...rest} = G;
  // 裁剪dialogueHistory，每角色只保留最近10条，避免超出存储限制
  const trimmedHistory = {};
  for(const k in rest.dialogueHistory){
    trimmedHistory[k] = rest.dialogueHistory[k].slice(-10);
  }
  const snap={ ...rest, dialogueHistory:trimmedHistory, date:getDate(), savedAt:Date.now(), name:G.playerName, api:{...API} };
  if(!G.saves) G.saves=[null,null,null];
  G.saves[i]=snap;
  try{
    let saves=[null,null,null];
    const _lsr=await Store.get('cod_saves'); if(_lsr) try{saves=JSON.parse(_lsr);}catch(e){}
    saves[i]=snap;
    const serialized = JSON.stringify(saves);
    await Store.set('cod_saves', serialized);
    buildSaveSlots();
    showMsg(`已存入 SLOT 0${i+1}`);
  }catch(e){ showMsg('存档失败：'+e.message); }
}
async function loadFromSlot(i){
  let saves=[null,null,null];
  const _lgsr=await Store.get('cod_saves'); if(_lgsr) try{saves=JSON.parse(_lgsr);}catch(e){}
  const s=saves[i];
  if(!s){ showMsg('该档位无存档'); return; }
  Object.assign(G,normalizeParallelSave(s));
  loadGlobalApiIntoState(); // API 以主页为准，不用存档里的旧值
  show('s-game');
  updateBountyTimer();
  updateBountyButtons();
  showMsg(`已读取 SLOT 0${i+1}`);
}
async function loadGame(){
  // 找最新的存档：比较手动档和自动档的day
  let saves=[null,null,null];
  const _bsr2=await Store.get('cod_saves'); if(_bsr2) try{saves=JSON.parse(_bsr2);}catch(e){}
  let autoSnap=null;
  const _bsr=await Store.get('cod_autosave'); if(_bsr) try{autoSnap=JSON.parse(_bsr);}catch(e){}
  const manualFirst=saves.find(s=>s!==null);
  // 选day最大的
  const scoreSave = s => {
    if(!s) return -1;
    const day = Number(s.day) || 0;
    const time = Number(s.timeIdx) || 0;
    const savedAt = Number(s.savedAt || s._savedAt || 0);
    return day * 100000000 + time * 1000000 + Math.floor(savedAt / 1000);
  };
  let best=[...saves.filter(Boolean), autoSnap].filter(Boolean)
    .sort((a,b)=>scoreSave(b)-scoreSave(a))[0] || manualFirst || null;
  if(!best){ showMsg('没有找到存档'); return; }
  Object.assign(G,normalizeParallelSave(best));
  loadGlobalApiIntoState(); // API 以主页为准，不用存档里的旧值
  show('s-game');
  updateBountyButtons();
}

function normalizeParallelSave(save){
  const fixed = Object.assign({}, save || {});
  if(!fixed.chars || typeof fixed.chars !== 'object') fixed.chars = JSON.parse(JSON.stringify(CHARS_DATA));
  Object.keys(CHARS_DATA).forEach(k=>{
    fixed.chars[k] = Object.assign({}, CHARS_DATA[k], fixed.chars[k] || {});
    if(!fixed.chars[k].rel) fixed.chars[k].rel = CHARS_DATA[k].rel || STAGES[0];
    if(!Number.isFinite(Number(fixed.chars[k].stage))) fixed.chars[k].stage = 0;
    if(!Number.isFinite(Number(fixed.chars[k].aff))) fixed.chars[k].aff = 0;
    if(!Number.isFinite(Number(fixed.chars[k].maxAff))) fixed.chars[k].maxAff = STAGE_MAX[fixed.chars[k].stage] || 100;
  });
  if(!fixed.dialogueHistory || typeof fixed.dialogueHistory !== 'object') fixed.dialogueHistory = {};
  if(!Array.isArray(fixed.saves)) fixed.saves = [null,null,null];
  return fixed;
}
