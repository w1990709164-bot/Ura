// ═══════════════════════════════
// OPTIONS
// ═══════════════════════════════
function showOptions(opts){
  const area=document.getElementById('options-area');
  area.style.display='flex';
  area.innerHTML='';
  const div=document.createElement('div');
  div.className='opt-divider'; div.textContent='— 选择或自由输入 —';
  area.appendChild(div);
  opts.forEach(o=>{
    const btn=document.createElement('button');
    btn.className='option-btn';
    btn.innerHTML=`<span class="opt-label">${o.label}</span>${o.text}`;
    btn.onclick=()=>selectOption(o.text);
    area.appendChild(btn);
  });
  document.getElementById('input-area').style.display='flex';
  document.getElementById('input-box').placeholder='不满意选项？直接输入…';
  document.getElementById('drawer-mode').textContent='选项';
  document.getElementById('drawer-mode').classList.add('has-opts');
  expandDrawer();
}

function hideOptions(){
  const area=document.getElementById('options-area');
  area.style.display='none'; area.innerHTML='';
  document.getElementById('input-area').style.display='flex';
  document.getElementById('input-box').placeholder='说点什么…';
  document.getElementById('drawer-mode').textContent='INPUT';
  document.getElementById('drawer-mode').classList.remove('has-opts');
}

function selectOption(text){
  hideOptions();
  addPlayerMsg(text);
  G.history.push({role:'user',content:text});
  callAI();
}

function sendMsg(){
  const box=document.getElementById('input-box');
  const text=box.value.trim();
  if(!text||G.isThinking) return;
  box.value=''; box.style.height='auto';
  hideOptions();
  addPlayerMsg(text);
  G.history.push({role:'user',content:text});
  callAI();
}
