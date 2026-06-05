// ════════════════════════════════
// AUTO SAVE
// ════════════════════════════════
async function autoSave(){
  if(!G.playerName) return;
  const {saves:_s, currentBoard:_cb, currentPost:_cp, ...rest} = G;
  const trimmedHistory = {};
  for(const k in rest.dialogueHistory){
    trimmedHistory[k] = rest.dialogueHistory[k].slice(-10);
  }
  const snap={ ...rest, dialogueHistory:trimmedHistory, date:getDate(), name:G.playerName, api:{...API}, isAuto:true };
  try{
    let saves=[null,null,null];
    const _sr=await Store.get('cod_saves'); if(_sr) try{saves=JSON.parse(_sr);}catch(e){}
    // 自动档用独立key存，不占用三个普通档位
    await Store.set('cod_autosave', JSON.stringify(snap));
    buildSaveSlots();
    showMsg(`✦ 自动存档 · Day ${G.day}`);
  }catch(e){ console.warn('自动存档失败',e); }
}
