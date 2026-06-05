// ═══════════════════════════════
// SOCIAL DEATH PUNISHMENT UI
// ═══════════════════════════════
function triggerSocialDeath(charId, forcedAction) {
  const c = CHARS.find(x=>x.id===charId); if(!c) return;
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(232,53,74,0.08);backdrop-filter:blur(4px);padding:32px';
  modal.innerHTML = `<div style="width:100%;max-width:360px"><div style="font-family:var(--mono);font-size:8px;color:var(--red);letter-spacing:4px;text-align:center;margin-bottom:8px;animation:urgent-pulse 0.8s infinite">⚠ SYSTEM OVERRIDE ⚠</div><div style="background:var(--panel);border:2px solid var(--red);border-radius:4px;padding:20px;box-shadow:0 0 40px rgba(232,53,74,0.3)"><div style="font-family:var(--mono);font-size:9px;color:var(--text2);letter-spacing:2px;margin-bottom:6px">强制行为触发 · ${c.name} [${c.chatId}]</div><div style="font-family:var(--serif);font-size:15px;color:var(--white);line-height:1.8;margin-bottom:14px">${forcedAction}</div><div style="font-family:var(--mono);font-size:9px;color:var(--red);letter-spacing:1px">任务超时惩罚 · 系统强制执行中…</div><div style="height:3px;background:var(--border);border-radius:2px;margin-top:10px;overflow:hidden"><div style="height:100%;background:var(--red);border-radius:2px;animation:progress-drain 3s linear forwards"></div></div></div></div>`;
  document.body.appendChild(modal);
  setTimeout(()=>modal.remove(), 3200);
  if(!charPovData[charId]) charPovData[charId] = [];
  charPovData[charId].push({type:'thought', content:`【系统强制执行】${forcedAction} ——我他妈的……`});
  if(currentCharPovId === charId) renderCharPovContent(charId);
}
