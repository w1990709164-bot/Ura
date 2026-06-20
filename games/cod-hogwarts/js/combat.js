// ── 战斗系统 ──────────────────────────────────────────────
let C = null; // 当前战斗上下文

function startCombat(trigger) {
  if (!trigger?.enemies?.length) return;

  const enemies = trigger.enemies.map((e, i) => ({
    id: i,
    name: e.name || '神秘敌人',
    hp: e.hp || 25, maxHp: e.hp || 25,
    atk: e.atk ?? 2, def: e.def ?? 1, dc: e.dc ?? 12,
    xp: e.xp ?? 10
  }));

  const allies = (trigger.allies || [])
    .filter(id => CHAR_MAP[id] && (G.characters[id]?.affection || 0) > 0)
    .map(id => {
      const c = CHAR_MAP[id];
      return {
        id, name: c.name, atk: c.combatStats.atk, def: c.combatStats.def,
        hp: 20 + c.combatStats.def * 5, maxHp: 20 + c.combatStats.def * 5
      };
    });

  const pMaxHp = Math.max(15, G.player.stats.tiPo.cur);
  C = {
    enemies, allies,
    playerHp: pMaxHp, playerMaxHp: pMaxHp,
    playerAtk: 1 + Math.floor(G.player.stats.lingLi.cur / 20),
    playerDef: Math.floor(G.player.stats.tiPo.cur / 25),
    round: 1, log: [], phase: 'action', result: null, usedSpecial: false,
    context: trigger.context || ''
  };
  if (C.context) C.log.push(`⚔ ${C.context}`);

  G.combat = C;
  document.getElementById('modal-combat').style.display = 'flex';
  renderCombatModal();
}

// ─ HP 条 ─
function hpBar(cur, max, cls) {
  const pct = Math.max(0, Math.min(100, Math.round(cur / max * 100)));
  return `<div class="chp-wrap"><div class="chp-fill ${cls}" style="width:${pct}%"></div></div>`;
}

function renderCombatModal() {
  const body = document.getElementById('combat-body');
  if (!body || !C) return;

  const enemyHtml = C.enemies.map(e => `
    <div class="cu ${e.hp<=0?'cu-dead':''}">
      <div class="cu-top">
        <span class="cu-name">${e.name}${e.hp<=0?' <em>（倒下）</em>':''}</span>
        <span class="cu-hp-num">${Math.max(0,e.hp)}/${e.maxHp}</span>
      </div>
      ${hpBar(e.hp, e.maxHp, 'chp-enemy')}
    </div>`).join('');

  const allyHtml = C.allies.length ? `
    <div class="combat-section">
      <div class="cs-label">同行者</div>
      ${C.allies.map(a => `
        <div class="cu ${a.hp<=0?'cu-dead':''}">
          <div class="cu-top">
            <span class="cu-name">${a.name}</span>
            <span class="cu-hp-num">${Math.max(0,a.hp)}/${a.maxHp}</span>
          </div>
          ${hpBar(a.hp, a.maxHp, 'chp-ally')}
        </div>`).join('')}
    </div>` : '';

  const pHpPct = C.playerHp / C.playerMaxHp;
  const pHpCls = pHpPct > 0.5 ? 'chp-player' : pHpPct > 0.25 ? 'chp-warn' : 'chp-danger';

  const logHtml = C.log.slice(-6).map(l => `<div class="cl-line">${l}</div>`).join('');

  let actHtml;
  if (C.result) {
    const isWin = C.result === 'win';
    actHtml = `<div class="combat-actions single">
      <button class="cbtn cbtn-end" onclick="endCombat()">
        ${isWin ? '🏆 胜利，继续故事' : '💀 落败，继续...'}
      </button>
    </div>`;
  } else if (C.phase === 'rolling') {
    actHtml = `<div class="combat-actions single"><div class="combat-rolling">
      <div class="loading-wave"><span></span><span></span><span></span></div>
    </div></div>`;
  } else {
    const conflictWarn = G.player.conflictValue >= 65 ? '<br><small>⚠灵力不稳</small>' : '';
    actHtml = `<div class="combat-actions">
      <button class="cbtn cbtn-atk" onclick="playerAction('attack')">⚔ 攻击${conflictWarn}</button>
      <button class="cbtn cbtn-def" onclick="playerAction('defend')">🛡 防御<br><small>防御+3</small></button>
      <button class="cbtn cbtn-spc" onclick="playerAction('special')" ${C.usedSpecial?'disabled':''}>✦ 灵术<br><small>${C.usedSpecial?'已使用':'高伤+先手'}</small></button>
      <button class="cbtn cbtn-flee" onclick="playerAction('flee')">⤷ 撤退<br><small>50%成功</small></button>
    </div>`;
  }

  body.innerHTML = `
    <div class="combat-round-bar">
      <span>第 ${C.round} 回合</span>
      <span class="conflict-badge">冲突值 ${G.player.conflictValue}</span>
    </div>
    <div class="combat-section">
      <div class="cs-label">敌方</div>
      ${enemyHtml}
    </div>
    ${allyHtml}
    <div class="combat-section">
      <div class="cs-label">你的状态</div>
      <div class="cu">
        <div class="cu-top"><span class="cu-name">HP</span><span class="cu-hp-num">${C.playerHp}/${C.playerMaxHp}</span></div>
        ${hpBar(C.playerHp, C.playerMaxHp, pHpCls)}
      </div>
    </div>
    <div class="combat-log">${logHtml || '<div class="cl-line cl-dim">战斗开始</div>'}</div>
    ${actHtml}
  `;
}

function playerAction(action) {
  if (!C || C.phase !== 'action' || C.result) return;
  C.phase = 'rolling';
  renderCombatModal();

  setTimeout(() => {
    // 撤退
    if (action === 'flee') {
      const r = rollD20();
      if (r >= 10) {
        C.log.push(`🎲 ${r} — 撤退成功！`);
        C.result = 'flee'; C.phase = 'done';
      } else {
        C.log.push(`🎲 ${r} — 撤退失败，遭到反击！`);
        enemyAttackPhase(0);
        C.round++; C.phase = 'action';
      }
      renderCombatModal(); return;
    }

    const liveEnemies = C.enemies.filter(e => e.hp > 0);

    // 玩家攻击
    if (liveEnemies.length) {
      const target = liveEnemies[0];
      const roll = rollD20();
      const isNat20 = roll === 20, isNat1 = roll === 1;

      if (isNat20) { unlockAchievement('nat20'); showAchievementToast('nat20'); }
      if (isNat1) {
        unlockAchievement('nat1');
        C.log.push(`🎲 天然1！灵力失控，攻击无效！`);
        changeConflict(3);
        if (G.player.conflictValue >= 40 && C.allies.length && Math.random() < 0.3) {
          const hit = C.allies[0];
          hit.hp = Math.max(0, hit.hp - 3);
          C.log.push(`💥 灵力混乱，误伤了${hit.name}！(-3HP)`);
          unlockAchievement('friendly_fire');
        }
      } else {
        let bonus = C.playerAtk + (action === 'special' ? 2 : 0);
        if (G.player.conflictValue >= 65) {
          const u = Math.random() < 0.5 ? 2 : -2;
          bonus += u;
          C.log.push(`（灵力不稳，修正${u>0?'+':''}${u}）`);
        }
        const total = roll + bonus;
        if (total >= target.dc || isNat20) {
          const dmg = Math.max(1, (isNat20 ? 8 : action === 'special' ? 6 : 4) - target.def);
          target.hp = Math.max(0, target.hp - dmg);
          C.log.push(`🎲 ${roll}${bonus>=0?'+':''}${bonus}=${total} vs DC${target.dc} — 命中！-${dmg}HP`);
          if (action === 'special') { C.usedSpecial = true; changeConflict(4); }
        } else {
          C.log.push(`🎲 ${roll}+${bonus}=${total} vs DC${target.dc} — 未命中`);
        }
      }
    }

    // 同行者攻击
    C.allies.forEach(ally => {
      if (ally.hp <= 0) return;
      const liveE = C.enemies.filter(e => e.hp > 0);
      if (!liveE.length) return;
      const tgt = liveE[0];
      const r = rollD20(); const tot = r + ally.atk;
      if (tot >= tgt.dc) {
        const d = Math.max(1, ally.atk + (r >= 15 ? 1 : 0));
        tgt.hp = Math.max(0, tgt.hp - d);
        C.log.push(`${ally.name} 命中！-${d}HP`);
      } else { C.log.push(`${ally.name} 未命中`); }
    });

    if (checkWin()) { renderCombatModal(); return; }

    // 敌人反击
    const defBonus = action === 'defend' ? 3 : 0;
    enemyAttackPhase(defBonus);

    if (C.playerHp <= 0) {
      unlockAchievement('defeated');
      C.log.push('💀 你倒下了...');
      C.result = 'lose'; C.phase = 'done';
    } else {
      C.round++;
      C.phase = 'action';
    }
    renderCombatModal();
  }, 700);
}

function enemyAttackPhase(defBonus) {
  C.enemies.filter(e => e.hp > 0).forEach(enemy => {
    const r = rollD20();
    const dc = 8 + C.playerDef + defBonus;
    if (r + enemy.atk >= dc) {
      const d = Math.max(1, enemy.atk - C.playerDef);
      C.playerHp = Math.max(0, C.playerHp - d);
      C.log.push(`${enemy.name} 命中！你 -${d}HP`);
    } else { C.log.push(`${enemy.name} 攻击被化解`); }
  });
}

function checkWin() {
  if (!C.enemies.every(e => e.hp <= 0)) return false;
  const xp = C.enemies.reduce((s, e) => s + (e.xp || 10), 0);
  unlockAchievement('first_win');
  if (C.allies.length >= 4) unlockAchievement('squad_battle');
  if (C.enemies.length >= 3 && !C.allies.length) unlockAchievement('outnumbered');
  changeStat('lingLi', Math.floor(xp / 3));
  changeStat('tiPo', Math.floor(xp / 4));
  C.log.push(`🏆 胜利！灵力+${Math.floor(xp/3)} 体魄+${Math.floor(xp/4)}`);
  C.result = 'win'; C.phase = 'done';
  persistAll();
  return true;
}

async function endCombat() {
  const result = C?.result || 'unknown';
  const log = (C?.log || []).slice(-4).join(' | ');
  G.combat = null; C = null;
  document.getElementById('modal-combat').style.display = 'none';
  persistAll();

  setLoading(true);
  try {
    const { story, options } = await generateStory(
      `[战斗结束。结果：${result==='win'?'玩家胜利':result==='flee'?'玩家撤退':'玩家落败'}。战斗摘要：${log}。请根据此战斗结果继续故事叙述。]`
    );
    renderStory(story); renderOptions(options); updateTopBar(); persistAll();
  } catch (e) {
    renderStory('战斗结束后，尘埃慢慢落定...');
    showRegenButton();
  } finally { setLoading(false); }
}
