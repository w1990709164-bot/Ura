// ═══════════════════════════════
// BACKPACK
// ═══════════════════════════════
function renderBackpack(filter){
  const list=document.getElementById('bp-list');
  let items=[...(G.inventory||[])];
  if(filter&&filter!=='all') items=items.filter(i=>i.type===filter);
  if(!items.length){ list.innerHTML='<div class="bp-empty">背包是空的……</div>'; return; }
  list.innerHTML=items.map((item,idx)=>`<div class="bp-item"><div class="bp-icon">${item.icon||'📦'}</div><div class="bp-info"><div class="bp-name">${item.name}</div><div class="bp-desc">${item.desc||''}</div>${item.sender?`<div class="bp-sender">来自：${item.sender}</div>`:''}</div><div class="bp-use" onclick="useBackpackItem(${idx})">使用</div></div>`).join('');
}
function bpTab(type,btn){ document.querySelectorAll('.bp-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderBackpack(type); }
function useBackpackItem(idx){
  const item=G.inventory[idx]; if(!item) return;
  if(item.type==='gift') { openGiftPicker(idx); return; }
  if(item.type==='dice') { G.activeDiceBonus=(G.activeDiceBonus||0)+(item.bonus||3); showToast('✓ '+item.name+' · 下次检定 +'+(item.bonus||3)); G.inventory.splice(idx,1); saveGame(); renderBackpack(); return; }
  showToast('使用了：'+item.name); G.inventory.splice(idx,1); saveGame(); renderBackpack();
}
