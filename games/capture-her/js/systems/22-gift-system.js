// ═══════════════════════════════
// GIFT SYSTEM
// ═══════════════════════════════
function openGiftPicker(itemIdx) {
  const item = G.inventory[itemIdx];
  if(!item) return;
  const existing = document.getElementById('gift-picker');
  if(existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'gift-picker';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;background:rgba(5,5,8,0.9);padding-bottom:var(--safe-b)';
  modal.innerHTML = `
    <div style="width:100%;max-width:420px;background:var(--panel);border:1px solid var(--border2);border-radius:10px 10px 0 0;padding:20px">
      <div style="font-family:var(--display);font-size:16px;font-weight:700;color:var(--white);margin-bottom:4px">送给谁？</div>
      <div style="font-family:var(--cormo);font-style:italic;font-size:13px;color:var(--text2);margin-bottom:16px">${item.name} · 好感 +${item.bondBonus||10}</div>
      <div style="display:flex;flex-direction:column;gap:6px;max-height:50vh;overflow-y:auto;margin-bottom:12px">
        ${CHARS.map(c=>`
          <div onclick="sendGift(${itemIdx},'${c.id}')" style="background:var(--bg3);border:1px solid var(--border);border-radius:3px;padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:border-color 0.2s" onmouseenter="this.style.borderColor='var(--red-dim)'" onmouseleave="this.style.borderColor='var(--border)'">
            <div style="width:32px;height:32px;background:var(--bg2);border:1px solid var(--border2);border-radius:2px;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:10px;font-weight:700;color:var(--red);flex-shrink:0">${c.init}</div>
            <div style="flex:1">
              <div style="font-family:var(--mono);font-size:12px;color:var(--white)">${c.name}</div>
              <div style="font-family:var(--mono);font-size:9px;color:var(--text2)">好感 ${G.chars[c.id]?.goodFeel||0}</div>
            </div>
          </div>`).join('')}
      </div>
      <button onclick="document.getElementById('gift-picker').remove()" style="width:100%;background:none;border:1px solid var(--border2);border-radius:2px;color:var(--text2);font-family:var(--mono);font-size:10px;letter-spacing:2px;padding:10px;cursor:pointer">取消</button>
    </div>`;
  document.body.appendChild(modal);
}

function sendGift(itemIdx, charId) {
  const item = G.inventory[itemIdx];
  const c = CHARS.find(x=>x.id===charId);
  if(!item||!c) return;
  document.getElementById('gift-picker')?.remove();

  const boost = item.bondBonus || 10;
  G.chars[charId].goodFeel = (G.chars[charId].goodFeel||0) + boost;
  G.inventory.splice(itemIdx, 1);
  saveGame(); renderBackpack(); renderDossier();

  showToast(`🎁 送出 ${item.name} → ${c.name} · 好感 +${boost}`);
  addSysMsg('赠礼', `你将${item.name}送给了${c.name}。`);

  // Trigger AI reaction
  G.history.push({role:'user', content:`[${G.player.name}送给${c.name}一件礼物：${item.name}。描述${c.name}收到礼物时符合其性格的反应，不要夸张，一两句话即可。]`});
  callAI();
}
