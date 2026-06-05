// ════════════════════════════════
// DOSSIER
// ════════════════════════════════
function buildDossier(){
  const panel=document.getElementById('panel-dossier');panel.innerHTML='';
  Object.values(G.chars).forEach(c=>{
    const pct=Math.round((c.aff/STAGE_MAX[c.stage])*100);
    const div=document.createElement('div');div.className='dossier-char';
    div.innerHTML=`
      <div class="dossier-head" onclick="toggleDossier(this)">
        <div class="dossier-head-left"><span class="dossier-char-name">${c.nation} ${c.name}</span><span class="dossier-rel">${c.rel||STAGES[c.stage]}</span></div>
        <span class="dossier-arrow">▸</span>
      </div>
      <div class="dossier-body">
        <div class="d-row"><span class="d-lbl">所属</span><span class="d-val">${c.faction}</span></div>
        <div class="d-row"><span class="d-lbl">心情</span><span class="d-val">${c.mood} ${c.status}</span></div>
        <div class="d-row"><span class="d-lbl">当前位置</span><span class="d-val">${c.loc}</span></div>
        <div class="d-row"><span class="d-lbl">当前关系</span><span class="d-val">${STAGES[c.stage]}</span></div>
        <div class="d-aff-wrap">
          <div class="d-aff-stage">${STAGES[c.stage]} · ${c.aff} / ${STAGE_MAX[c.stage]===Infinity?'∞':STAGE_MAX[c.stage]}</div>
          <div class="d-aff-bar"><div class="d-aff-fill" style="width:${pct}%"></div></div>
          <div class="d-aff-nums"><span class="d-aff-cur">${c.aff}</span><span class="d-aff-max">/ ${STAGE_MAX[c.stage]===Infinity?'∞':STAGE_MAX[c.stage]}</span></div>
        </div>
        <div class="d-voice">
          <div class="d-voice-lbl">心声 INNER VOICE</div>
          <div class="d-voice-en">${c.voice_en}</div>
          <div class="d-voice-zh">${c.voice_zh}</div>
        </div>
      </div>`;
    panel.appendChild(div);
  });
}
function toggleDossier(head){
  const body=head.nextElementSibling;const arrow=head.querySelector('.dossier-arrow');
  body.classList.toggle('open');arrow.classList.toggle('open');
}
