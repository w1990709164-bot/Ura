// ══════════════════════════════
// ARCHIVE RENDER
// ══════════════════════════════
function renderArchive() {
  const body = document.getElementById('archive-body');
  body.innerHTML = `<div class="section-title">角色档案</div>`;
  CHARS.forEach(c=>{
    const unlocked = G.unlockedBags[c.id] || 0;
    const total = c.bags;
    const p = G.patients[c.id];
    const visited = (p?.visitCount||0) > 0;
    const phase = visited ? PHASE_LABELS[p?.trustPhase||0]||'戒备' : '未接触';
    const phaseColor = visited ? 'var(--cyan)' : 'var(--text3)';
    body.innerHTML += `
      <div class="archive-char-item" onclick="openCharArchive('${c.id}')">
        <div class="aci-av" style="${visited?'color:var(--cyan);border-color:var(--cyan)':''}">${c.init}</div>
        <div class="aci-info">
          <div class="aci-name">${c.name}</div>
          <div class="aci-unit">${c.unit}</div>
          <div style="font-family:var(--mono);font-size:9px;color:${phaseColor};margin-top:3px">${phase}${visited?` · 接诊${p.visitCount}次`:''}</div>
        </div>
        <div class="aci-bags" style="color:${unlocked>0?'var(--cyan)':'var(--text3)'}">${unlocked}/${total}</div>
      </div>`;
  });
}

// Character data for archive display
const CHAR_DATA = {
  keegan: {
    landscape:'永夜针叶林',
    landscapeDesc:'无月·无风·无声，薄雪，树与树之间的间距精确得像天然狙击廊道',
    spirit:'美洲狮',
    spiritStatus:'隐匿',
    spiritLoc:'树冠深处，未现身',
    landscapeStatus:'稳定 / 轻度封闭',
    explored:'外层边缘',
    location:'休息中',
    ability:'S级',
  },
  ghost: {
    landscape:'废弃工业区',
    landscapeDesc:'曼彻斯特风格，生锈钢铁，积水地面倒映灰天，永远阴天永远湿润但不下雨',
    spirit:'黑豹',
    spiritStatus:'隐匿',
    spiritLoc:'某个角落，永远找不到',
    landscapeStatus:'封闭 / 多层防御',
    explored:'未进入',
    location:'巡逻中',
    ability:'S级',
  },
  soap: {
    landscape:'苏格兰高地河流',
    landscapeDesc:'水流湍急清澈，充满能量，但河床下有暗礁，还有些地方没开凿出来',
    spirit:'边境牧羊犬',
    spiritStatus:'活跃',
    spiritLoc:'河岸附近来回跑',
    landscapeStatus:'轻度开放',
    explored:'外层边缘',
    location:'休息中',
    ability:'S级',
  },
  gaz: {
    landscape:'英国乡村清晨',
    landscapeDesc:'薄雾，绿地，平静，心理最健康的图景',
    spirit:'猎豹',
    spiritStatus:'静默',
    spiritLoc:'草地远处',
    landscapeStatus:'开放',
    explored:'未进入',
    location:'待命',
    ability:'S级',
  },
  price: {
    landscape:'苏格兰荒野高地',
    landscapeDesc:'乱石，低云压顶，风很大但站得住，粗粝经得住风吹',
    spirit:'狮子',
    spiritStatus:'静默',
    spiritLoc:'最高的石头上',
    landscapeStatus:'轻度封闭',
    explored:'未进入',
    location:'任务中',
    ability:'S级',
  },
  hesh: {
    landscape:'初冬加州丘陵',
    landscapeDesc:'枯黄草地，海在远处隐约可见，山脊上有马更些狼在独行',
    spirit:'马更些狼',
    spiritStatus:'巡视',
    spiritLoc:'山脊处，往南边看',
    landscapeStatus:'稳定',
    explored:'未进入',
    location:'休息中',
    ability:'S级',
  },
  logan: {
    landscape:'大雾加州丘陵',
    landscapeDesc:'同一片丘陵，但大雾弥漫，海岸线消失，连山脊都模糊',
    spirit:'马更些狼',
    spiritStatus:'迷途',
    spiritLoc:'原地，不知往哪走',
    landscapeStatus:'稳定 / 轻度封闭',
    explored:'未进入',
    location:'休息中',
    ability:'S级',
  },
  merrick: {
    landscape:'深夜军港',
    landscapeDesc:'停满船的港口，灯光昏黄，水面平静，水下极深',
    spirit:'虎鲸',
    spiritStatus:'潜行',
    spiritLoc:'深水处，不可见',
    landscapeStatus:'封闭',
    explored:'未进入',
    location:'简报中',
    ability:'S级',
  },
  konig: {
    landscape:'奥地利深山地下湖',
    landscapeDesc:'幽暗，水面如镜，与世隔绝，他把自己藏在最深处',
    spirit:'巨型章鱼',
    spiritStatus:'隐匿',
    spiritLoc:'岩壁深处，缩成一团',
    landscapeStatus:'封闭 / 回声陷阱',
    explored:'未进入',
    location:'走廊等候',
    ability:'S级',
  },
  horangi: {
    landscape:'韩国山地秋天',
    landscapeDesc:'红叶正盛，远处有寺庙轮廓，有虎在林中游荡',
    spirit:'虎',
    spiritStatus:'游荡',
    spiritLoc:'林中，慵懒巡视',
    landscapeStatus:'开放',
    explored:'未进入',
    location:'休息中',
    ability:'S级',
  },
  nikto: {
    landscape:'无尽图书馆档案馆',
    landscapeDesc:'高耸书架延伸至看不到尽头，里面全是别人的身份档案',
    spirit:'渡鸦群',
    spiritStatus:'凝视',
    spiritLoc:'高处，俯视全场',
    landscapeStatus:'封闭 / 信息迷宫',
    explored:'未进入',
    location:'未知',
    ability:'S级',
  },
  krueger: {
    landscape:'阿尔卑斯山间小镇',
    landscapeDesc:'冬天，石头建筑，钟声，教堂的门是锁着的，他站在外面进不去',
    spirit:'绿森蚺',
    spiritStatus:'蜷缩',
    spiritLoc:'教堂石阶，异乡之物',
    landscapeStatus:'轻度封闭',
    explored:'未进入',
    location:'任务待命',
    ability:'S级',
  },
  zimo: {
    landscape:'华北平原冬日黄昏',
    landscapeDesc:'高粱地，远处烽火台轮廓，干燥厚重，有家族传承的重量',
    spirit:'金雕',
    spiritStatus:'盘旋',
    spiritLoc:'高空，从不落地',
    landscapeStatus:'稳定',
    explored:'未进入',
    location:'任务中',
    ability:'S级',
  },
  graves: {
    landscape:'德克萨斯荒原',
    landscapeDesc:'远处有一栋灯是亮的房子，他每次都不走近',
    spirit:'德克萨斯长角牛',
    spiritStatus:'静立',
    spiritLoc:'房子与向导之间',
    landscapeStatus:'轻度封闭',
    explored:'未进入',
    location:'商务会议',
    ability:'S级',
  },
};

function openCharArchive(charId) {
  const c = CHARS.find(x=>x.id===charId);
  if (!c) return;
  const body = document.getElementById('archive-body');
  const unlocked = G.unlockedBags[charId] || 0;
  const p = G.patients[charId] || {mental:50,trust:20,stress:70,heat:0,tags:['未接触'],injury:'',visitCount:0};
  const cd = CHAR_DATA[charId] || {};

  const statBar = (label, val, color) => `
    <div class="stat-row">
      <div class="stat-lbl">${label}</div>
      <div class="stat-bar"><div class="stat-fill" style="width:${val}%;background:${color}"></div></div>
      <div class="stat-val">${val}</div>
    </div>`;

  const divider = (title) => `
    <div style="font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:2px;
      margin:14px 0 8px;display:flex;align-items:center;gap:8px">
      ── ${title}
      <span style="flex:1;height:1px;background:var(--border);display:inline-block"></span>
    </div>`;

  let html = `
    <!-- Back button -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;position:sticky;top:0;background:var(--bg);padding:6px 0;z-index:2;border-bottom:1px solid var(--border)">
      <button onclick="renderArchive()" style="background:none;border:1px solid var(--border2);border-radius:4px;color:var(--cyan);font-size:16px;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0">‹</button>
      <div style="font-family:var(--hud);font-size:15px;font-weight:700;color:var(--white);flex:1">${c.name}</div>
      <div style="font-family:var(--mono);font-size:10px;color:var(--cyan);background:var(--cyan-glow);border:1px solid var(--cyan-dim);padding:2px 8px;border-radius:2px">能力等级 ${cd.ability||'S级'}</div>
    </div>

    <!-- 阶段进度 -->
    <div style="background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:10px 12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-family:var(--mono);font-size:10px;color:var(--text3);letter-spacing:1px">关系阶段</div>
        <div style="font-family:var(--hud);font-size:12px;font-weight:700;color:var(--cyan)">${PHASE_LABELS[getCurrentPhase(charId)]||'戒备'} · 第${(p.trustPhase||0)+1}/${c.bags}阶段</div>
      </div>
      <div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden;border:1px solid var(--border)">
        <div style="height:100%;background:linear-gradient(90deg,var(--cyan-dim),var(--cyan));border-radius:3px;width:${getPhaseProgress(charId).pct}%;transition:width 0.8s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;font-family:var(--mono);font-size:9px;color:var(--text3)">
        <span>${getPhaseProgress(charId).current} / ${getPhaseProgress(charId).max} 点</span>
        <span>${getPhaseProgress(charId).pct}%</span>
      </div>
    </div>
    <!-- 当前状态标签 -->
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
      <div style="font-family:var(--mono);font-size:10px;color:var(--cyan);background:var(--cyan-glow);border:1px solid var(--cyan-dim);padding:3px 8px;border-radius:3px">${p.location||cd.location||'未知'}</div>
      ${(p.tags||[]).map(t=>`<div style="font-family:var(--mono);font-size:10px;color:var(--text2);background:var(--bg3);border:1px solid var(--border);padding:3px 8px;border-radius:3px">${t}</div>`).join('')}
    </div>

    ${divider('精神数值')}
    ${statBar('感官负荷', p.mental, 'linear-gradient(90deg,var(--cyan-dim),var(--cyan))')}
    ${statBar('精神稳定', Math.max(0,100-p.stress), 'linear-gradient(90deg,#005a40,var(--teal))')}
    ${statBar('信任度', p.trust, 'linear-gradient(90deg,var(--teal-dim),var(--teal))')}
    ${statBar('结合热', p.heat, 'linear-gradient(90deg,#5a0020,var(--pink))')}

    ${divider('身体状态')}
    <div style="font-family:var(--mono);font-size:12px;color:var(--text2);line-height:2;padding:0 4px">
      ${p.injury || '无异常'}
    </div>

    ${divider('状态标签')}
    <div style="display:flex;gap:6px;flex-wrap:wrap;padding:0 4px">
      ${(p.tags||[]).map(t=>`
        <div style="font-family:var(--mono);font-size:10px;color:var(--cyan);background:var(--cyan-glow);border:1px solid var(--cyan-dim);padding:3px 8px;border-radius:3px">${t}</div>
      `).join('')}
    </div>

    ${divider('精神体')}
    <div style="padding:0 4px">
      <div style="font-family:var(--mono);font-size:12px;color:var(--text2);line-height:2.2">
        <div><span style="color:var(--text3)">名称：</span><span style="color:var(--white)">${cd.spirit||'未知'}</span></div>
        <div><span style="color:var(--text3)">当前状态：</span><span style="color:var(--cyan)">${p.spiritStatus||cd.spiritStatus||'未知'}</span></div>
        <div><span style="color:var(--text3)">位置：</span><span style="color:var(--text)">${p.spiritLoc||cd.spiritLoc||'未知'}</span></div>
      </div>
    </div>

    ${divider('关系记忆卡')}
    <div style="padding:0 4px">
      ${renderMemoryCard(charId)}
    </div>

    ${divider('精神图景')}
    <div style="padding:0 4px">
      <div style="font-family:var(--mono);font-size:12px;color:var(--text2);line-height:2.2">
        <div><span style="color:var(--text3)">名称：</span><span style="color:var(--white)">${cd.landscape||'未知'}</span></div>
        <div><span style="color:var(--text3)">已探索区域：</span><span style="color:var(--cyan)">${cd.explored||'未进入'}</span></div>
        <div><span style="color:var(--text3)">图景状态：</span><span style="color:var(--cyan)">${p.landscapeStatus||cd.landscapeStatus||'未知'}</span></div>
        <div><span style="color:var(--text3)">上次进入：</span><span style="color:var(--text)">${p.lastVisit||'未进入'}</span></div>
        <div><span style="color:var(--text3)">图景内位置：</span><span style="color:var(--text)">${p.spiritContact?'跟随向导':'隐匿于深处'}</span></div>
        <div><span style="color:var(--text3)">异常：</span><span style="color:${p.landscapeAnomaly?'var(--pink)':'var(--teal)'}">${p.landscapeAnomaly||'无'}</span></div>
      </div>
    </div>

    ${divider('档案袋 · '+unlocked+'/'+c.bags+' 已解锁')}
  `;

  for (let i=1; i<=c.bags; i++) {
    const isUnlocked = i <= unlocked;
    html += `
      <div class="file-bag ${isUnlocked?'':'locked'}" onclick="${isUnlocked?`openBag('${charId}',${i})`:''}">
        <div class="bag-icon ${isUnlocked?'':'locked-bag'}">
          ${isUnlocked?'📂':'📁'}
          ${!isUnlocked?'<div class="bag-seal"></div>':''}
        </div>
        <div class="bag-info">
          <div class="bag-num">#${String(i).padStart(2,'0')} · ${charId.toUpperCase()}</div>
          <div class="bag-title">${isUnlocked?getBagTitle(charId,i):'[封存]'}</div>
          <div class="bag-level ${isUnlocked?getBagLevelClass(i):''}">
            ${isUnlocked?getBagLevel(i):'🔒 未解锁'}
          </div>
        </div>
      </div>`;
  }
  body.innerHTML = html;
}

function openPhone() {
  document.getElementById('phone-overlay').classList.add('show');
  document.getElementById('phone-home').style.display = 'flex';
  document.querySelectorAll('.phone-inner').forEach(el=>el.classList.remove('active'));

}
function closePhone() {
  document.getElementById('phone-overlay').classList.remove('show');
}
// openPhoneApp moved to shop section
function closePhoneApp() {
  document.querySelectorAll('.phone-inner').forEach(el=>el.classList.remove('active'));
  document.getElementById('phone-home').style.display = 'flex';
}
function switchChatTab(tab) {
  ['private','group','moments'].forEach(t=>{
    document.getElementById('chat-'+t).style.display = t===tab?'block':'none';
    const el = document.getElementById('tab-'+t);
    if (el) {
      el.style.color = t===tab?'var(--cyan)':'var(--text3)';
      el.style.borderBottom = t===tab?'2px solid var(--cyan)':'2px solid transparent';
    }
  });
  if (tab==='moments') renderMoments();
}

function renderMoments() {
  const el = document.getElementById('chat-moments');
  if (!el) return;
  const playerName = G.player.name || '向导医生';
  const playerAv = playerName.slice(0,2);
  const postBox = `
    <div style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--cyan-glow);border:1px solid var(--cyan);display:flex;align-items:center;justify-content:center;font-family:var(--hud);font-size:11px;font-weight:700;color:var(--cyan);flex-shrink:0">${playerAv}</div>
        <div style="font-family:var(--hud);font-size:12px;color:var(--cyan)">${playerName}</div>
      </div>
      <textarea id="player-moment-input" rows="2" style="width:100%;box-sizing:border-box;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--white);font-family:var(--serif);font-size:12px;padding:8px;outline:none;resize:none" placeholder="发点什么…"></textarea>
      <div style="text-align:right;margin-top:6px">
        <button onclick="playerPostMoment()" style="padding:6px 14px;background:var(--cyan-glow);border:1px solid var(--cyan);border-radius:6px;color:var(--cyan);font-family:var(--hud);font-size:11px;cursor:pointer">发布</button>
      </div>
    </div>`;
  el.innerHTML = postBox + MOMENTS_DATA.map((m,i)=>`
    <div class="moment-item" onclick="showMomentModal(MOMENTS_DATA[${i}],${i})" style="cursor:pointer">
      <div class="moment-header">
        <div class="moment-av">${m.av}</div>
        <div class="moment-name">${m.name}</div>
        <div class="moment-time">${m.time}</div>
      </div>
      <div class="moment-text">${m.text.length>60?m.text.slice(0,60)+'…':m.text}</div>
      <div class="moment-actions">
        <div class="moment-action" onclick="event.stopPropagation();likeMoment(${i},this)">👍 ${m.likes}</div>
        <div class="moment-action">💬 ${m.comments.length}</div>
      </div>
    </div>
  `).join('');
}

function likeMoment(idx, btn) {
  MOMENTS_DATA[idx].likes++;
  btn.textContent = `👍 ${MOMENTS_DATA[idx].likes}`;
}

function renderForum() {
  const el = document.getElementById('forum-list');
  if (!el) return;
  const tagColors = {gossip:'tag-gossip',lost:'tag-lost',intel:'tag-intel',notice:'tag-intel',anon:'tag-gossip'};
  const postBox = `
    <div style="background:var(--bg3);border:1px solid var(--border2);border-radius:8px;padding:12px;margin-bottom:14px">
      <div style="font-family:var(--hud);font-size:11px;color:var(--text3);letter-spacing:1px;margin-bottom:8px">— 发帖 —</div>
      <input id="player-forum-title" style="width:100%;box-sizing:border-box;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--white);font-family:var(--serif);font-size:12px;padding:7px 10px;outline:none;margin-bottom:6px" placeholder="标题…">
      <textarea id="player-forum-body" rows="2" style="width:100%;box-sizing:border-box;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--white);font-family:var(--serif);font-size:12px;padding:7px 10px;outline:none;resize:none" placeholder="内容…"></textarea>
      <div style="text-align:right;margin-top:6px">
        <button onclick="playerPostForum()" style="padding:6px 14px;background:var(--cyan-glow);border:1px solid var(--cyan);border-radius:6px;color:var(--cyan);font-family:var(--hud);font-size:11px;cursor:pointer">发帖</button>
      </div>
    </div>`;
  el.innerHTML = '<div style="padding:14px">' + postBox + FORUM_DATA.map(p=>`
    <div class="forum-item" onclick="openForumPost('${p.id}')" style="cursor:pointer">
      <div class="forum-tag ${tagColors[p.tag]||''}">${p.tagLabel}</div>
      <div class="forum-title">${p.title}</div>
      <div class="forum-preview">${p.preview}</div>
      <div class="forum-footer"><span>${p.author} · ${p.time}</span><span>👁 ${p.views}</span></div>
    </div>
  `).join('') + '</div>';
}
