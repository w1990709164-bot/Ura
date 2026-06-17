// ════════════════════════════════
// INIT
// ════════════════════════════════
window.onload=async ()=>{
  // 主页（里世界）是 API 的唯一来源（LW_API_*）。
  loadGlobalApiIntoState();
  // 兼容：若主页未设置但存在旧的 cod_api，则迁移过来。
  if(!API.key){
    const apiRaw = await Store.get('cod_api');
    if(apiRaw){
      try{
        Object.assign(API, JSON.parse(apiRaw));
        if(API.key) persistGlobalApi();
      }catch(e){}
    }
  }
  document.getElementById('api-url').value=API.url||'';
  document.getElementById('api-key').value=API.key||'';
  document.getElementById('api-model').value=API.model||'gpt-4o';

  let saves=[null,null,null];
  const _wsr=await Store.get('cod_saves'); if(_wsr) try{saves=JSON.parse(_wsr);}catch(e){}

  G.saves=saves;
  let hasAuto=false;
  if(await Store.get('cod_autosave')) hasAuto=true;
  document.getElementById('btn-load').classList.toggle('dim',!saves.find(s=>s)&&!hasAuto);
  buildCreateScreen();
};
