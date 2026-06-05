// ══════════════════════════════
// ACTION POINTS SYSTEM (幼崽期)
// ══════════════════════════════
const AP_PER_YEAR = 8;

function openActionPointPanel() {
  if (G.phase !== 'cub') { showToast('成人期无行动点'); return; }
  const existing = document.getElementById('ap-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'ap-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9500;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(5,4,2,0.97);padding:24px;overflow-y:auto;pointer-events:all;-webkit-overflow-scrolling:touch';
  
  const used = G.apUsedThisYear?.length || 0;
  const remaining = AP_PER_YEAR - used;
  const bondUsed = G.apUsedThisYear?.filter(a=>a.type==='bond').length || 0;
  const growUsed = G.apUsedThisYear?.filter(a=>a.type==='grow').length || 0;
  const freeUsed = G.apUsedThisYear?.filter(a=>a.type==='free').length || 0;
  // Include free points converted to bond/grow in their limits
  const bondLimit = 3 + (G._freeToBond||0);
  const growLimit = 3 + (G._freeToGrow||0);
  const bondLeft = Math.max(0, bondLimit - bondUsed);
  const growLeft = Math.max(0, growLimit - growUsed);
  const freeLeft = Math.max(0, 2 - freeUsed);

  // dots rendered inline below

  modal.innerHTML = `
    <div style="width:100%;max-width:400px">
      <div style="font-family:var(--cinzel);font-size:16px;font-weight:700;color:var(--gold);letter-spacing:3px;text-align:center;margin-bottom:6px">行动点分配</div>
      <div style="font-family:var(--hud);font-size:10px;color:var(--text2);letter-spacing:2px;text-align:center;margin-bottom:20px">第${G.gameYear}年 · 剩余 ${remaining} 点</div>
      
      <div style="display:flex;gap:6px;margin-bottom:20px;justify-content:center" id="ap-dots-row">
        ${Array.from({length:AP_PER_YEAR},(_,i)=>{
          const e=G.apUsedThisYear?.[i];
          const cls=e?(e.type==='bond'?'ap-dot bond':e.type==='grow'?'ap-dot grow':'ap-dot free'):'ap-dot';
          return '<div class="'+cls+'"></div>';
        }).join('')}
      </div>

      ${remaining > 0 ? `
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
        ${bondLeft > 0 ? `
        <div style="background:var(--panel);border:1px solid var(--border2);border-radius:4px;padding:14px">
          <div style="font-family:var(--cinzel);font-size:11px;font-weight:700;color:#CC6666;letter-spacing:2px;margin-bottom:8px">🐾 羁绊点 · 剩余${bondLeft}次</div>
          <div style="font-family:var(--hud);font-size:10px;color:var(--text2);margin-bottom:10px;letter-spacing:0.5px">选择角色互动，增加羁绊值，同时获得该角色影响的属性小幅成长</div>
          <div style="display:flex;flex-direction:column;gap:6px" id="bond-ap-list">
            ${CHARS.map(c=>`<div onclick="useApBond('${c.id}')" style="background:var(--bg3);border:1px solid var(--border);border-radius:2px;padding:8px 12px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-family:var(--hud);font-size:11px;color:var(--sand)">
              <span>${c.name} <span style="color:var(--text3)">${c.species}</span></span>
              <span style="color:var(--text3);font-size:9px">${c.attrs.map(k=>STATS_DEF.find(s=>s.key===k)?.name||k).join('/')}</span>
            </div>`).join('')}
          </div>
        </div>` : ''}

        ${growLeft > 0 ? `
        <div style="background:var(--panel);border:1px solid var(--border2);border-radius:4px;padding:14px">
          <div style="font-family:var(--cinzel);font-size:11px;font-weight:700;color:var(--green);letter-spacing:2px;margin-bottom:8px">📈 成长点 · 剩余${growLeft}次</div>
          <div style="font-family:var(--hud);font-size:10px;color:var(--text2);margin-bottom:10px;letter-spacing:0.5px">直接强化某项属性 +2</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${STATS_DEF.map(s=>`<div onclick="useApGrow('${s.key}')" style="background:var(--bg3);border:1px solid var(--border);border-radius:2px;padding:8px 10px;cursor:pointer;font-family:var(--hud);font-size:11px;color:var(--sand);text-align:center">${s.name} <span style="color:var(--gold)">${G.stats[s.key]||0}</span></div>`).join('')}
          </div>
        </div>` : ''}

        ${freeLeft > 0 ? `
        <div style="background:var(--panel);border:1px solid var(--border2);border-radius:4px;padding:14px">
          <div style="font-family:var(--cinzel);font-size:11px;font-weight:700;color:var(--sand);letter-spacing:2px;margin-bottom:8px">⭐ 自由点 · 剩余${freeLeft}次</div>
          <div style="font-family:var(--hud);font-size:10px;color:var(--text2);margin-bottom:10px;letter-spacing:0.5px">可追加为羁绊点或成长点</div>
          <div style="display:flex;gap:8px">
            <div onclick="closeFreeApChoice('bond')" style="flex:1;background:var(--bg3);border:1px solid #6A2020;border-radius:2px;padding:10px;cursor:pointer;font-family:var(--hud);font-size:11px;color:#CC6666;text-align:center">追加为羁绊点</div>
            <div onclick="closeFreeApChoice('grow')" style="flex:1;background:var(--bg3);border:1px solid var(--green-dim);border-radius:2px;padding:10px;cursor:pointer;font-family:var(--hud);font-size:11px;color:var(--green);text-align:center">追加为成长点</div>
          </div>
        </div>` : ''}
      </div>` : `
      <div style="text-align:center;font-family:var(--fell);font-style:italic;font-size:14px;color:var(--text3);padding:24px">本年度行动点已全部使用</div>`}

      ${remaining === 0 ? `<button onclick="advanceYear()" style="width:100%;padding:12px;background:linear-gradient(135deg,var(--gold-dim),#3A2008);border:1px solid var(--gold);border-radius:2px;color:var(--gold);font-family:var(--cinzel);font-size:12px;font-weight:700;letter-spacing:3px;cursor:pointer;margin-bottom:10px">进入下一年</button>` : ''}
      <button onclick="document.getElementById('ap-modal').remove()" style="width:100%;padding:10px;background:none;border:1px solid var(--border2);border-radius:2px;color:var(--text2);font-family:var(--hud);font-size:11px;letter-spacing:2px;cursor:pointer">关闭</button>
    </div>`;
  document.body.appendChild(modal);
}

// Free AP choice routing
let pendingFreeApType = null;
function closeFreeApChoice(type) {
  document.getElementById('ap-modal')?.remove();
  if (!G.apUsedThisYear) G.apUsedThisYear = [];

  // Record free point as consumed, and expand the target limit
  G.apUsedThisYear.push({type:'free', convertTo:type, year:G.gameYear});
  if (type === 'bond') {
    G._freeToBond = (G._freeToBond||0) + 1;
  } else {
    G._freeToGrow = (G._freeToGrow||0) + 1;
  }
  saveGame();
  openActionPointPanel();
}

function useApBond(charId) {
  if (!G.apUsedThisYear) G.apUsedThisYear = [];
  const bondUsed = G.apUsedThisYear.filter(a=>a.type==='bond').length;
  const bondLimit = 3 + (G._freeToBond||0);
  if (bondUsed >= bondLimit) { showToast('羁绊点已用完'); return; }
  if (G.apUsedThisYear.length >= AP_PER_YEAR) { showToast('行动点已全部使用'); return; }

  const c = CHARS.find(x=>x.id===charId);
  const b = G.bonds[charId];
  if (!c || !b) return;

  // Bond gain
  const bondGain = 12 + Math.floor(Math.random()*8);
  b.value = Math.min(100, (b.value||0) + bondGain);
  if (b.value >= 100 && b.stage < 6) { b.stage++; b.value = 0; showToast('🐾 ' + c.name + ' 关系升级：' + BOND_STAGES[b.stage]); }

  // Small stat gain from character's attrs
  const gainedStats = c.attrs.map(k => {
    G.stats[k] = (G.stats[k]||0) + 1;
    return STATS_DEF.find(s=>s.key===k)?.name||k;
  });
  showToast('🐾 ' + c.name + ' · 羁绊+' + bondGain + ' · ' + gainedStats.join('/') + ' +1');

  G.apUsedThisYear.push({type:'bond', charId, year:G.gameYear});
  saveGame(); updateStatsBar(); renderBonds(); renderStatus();
  document.getElementById('ap-modal')?.remove();

  // Trigger AI scene
  addSysMsg('羁绊互动', `本年度与 ${c.name} 度过了一段时光。`);
  G.history.push({role:'user', content:'[行动点·羁绊互动：与' + c.name + '互动，描述幼崽期的一个温馨/有趣的互动片段，体现双方关系的增进]'});
  callAI();
  openActionPointPanel();
}

function useApGrow(statKey) {
  if (!G.apUsedThisYear) G.apUsedThisYear = [];
  const growUsed = G.apUsedThisYear.filter(a=>a.type==='grow').length;
  const growLimit = 3 + (G._freeToGrow||0);
  if (growUsed >= growLimit) { showToast('成长点已用完'); return; }
  if (G.apUsedThisYear.length >= AP_PER_YEAR) { showToast('行动点已全部使用'); return; }

  G.stats[statKey] = (G.stats[statKey]||0) + 2;
  G.apUsedThisYear.push({type:'grow', statKey, year:G.gameYear});
  saveGame(); updateStatsBar(); renderStatus();
  const statName = STATS_DEF.find(s=>s.key===statKey)?.name||statKey;
  document.getElementById('ap-modal')?.remove();
  showToast('📈 ' + statName + ' +2');
  setTimeout(()=>openActionPointPanel(), 300);
}
