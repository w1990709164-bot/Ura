// ════════════════════════════════
// STORAGE ADAPTER（兼容 artifact + 独立HTML）
// ════════════════════════════════
const Store = {
  _hasWS: typeof window !== 'undefined' && typeof window.storage !== 'undefined' && typeof window.storage.set === 'function',
  get(key){
    if(this._hasWS){
      return window.storage.get(key).then(r => r ? r.value : null).catch(()=>null);
    }
    return Promise.resolve(localStorage.getItem(key));
  },
  set(key, val){
    if(this._hasWS){
      return window.storage.set(key, val).catch(()=>{});
    }
    try{ localStorage.setItem(key, val); }catch(e){}
    return Promise.resolve();
  }
};
