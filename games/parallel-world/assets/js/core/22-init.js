// ════════════════════════════════
// INIT
// ════════════════════════════════
window.onload=async ()=>{
  let apiRaw = null;
  apiRaw = await Store.get('cod_api');
  if(apiRaw){
    Object.assign(API,JSON.parse(apiRaw));
    document.getElementById('api-url').value=API.url||'';
    document.getElementById('api-key').value=API.key||'';
    document.getElementById('api-model').value=API.model||'gpt-4o';
  }
  let saves=[null,null,null];
  const _wsr=await Store.get('cod_saves'); if(_wsr) try{saves=JSON.parse(_wsr);}catch(e){}

  G.saves=saves;
  let hasAuto=false;
  if(await Store.get('cod_autosave')) hasAuto=true;
  document.getElementById('btn-load').classList.toggle('dim',!saves.find(s=>s)&&!hasAuto);
  buildCreateScreen();
};
