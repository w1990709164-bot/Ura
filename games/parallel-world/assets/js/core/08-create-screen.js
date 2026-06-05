// ════════════════════════════════
// CREATE SCREEN
// ════════════════════════════════
function buildCreateScreen(){
  const grid=document.getElementById('char-grid');grid.innerHTML='';
  Object.values(CHARS_DATA).forEach(c=>{
    const d=document.createElement('div');d.className='char-card';
    d.onclick=()=>selChar(d,c.name);
    d.innerHTML=`<div class="char-name">${c.nation} ${c.name}</div><div class="char-meta">${c.faction}</div><div class="char-tag">${c.mood} ${c.status}</div>`;
    grid.appendChild(d);
  });
}
function selRole(el,r){document.querySelectorAll('.role-card').forEach(c=>c.classList.remove('sel'));el.classList.add('sel');selRoleVal=r;}
function selChar(el,c){document.querySelectorAll('.char-card').forEach(x=>x.classList.remove('sel'));el.classList.add('sel');selCharVal=c;}
function startGame(){
  const name=document.getElementById('c-name').value.trim();
  if(!name){ showMsg('请输入代号'); return; }
  if(!selRoleVal){ showMsg('请选择职位'); return; }
  if(!selCharVal){ showMsg('请选择初始接触角色'); return; }
  G.playerName=name;
  G.realname=document.getElementById('c-realname').value.trim();
  G.appearance=document.getElementById('c-appearance').value.trim();
  G.personality=document.getElementById('c-personality').value.trim();
  G.role=selRoleVal;
  G.currentChar=selCharVal;
  G.chars=JSON.parse(JSON.stringify(CHARS_DATA));
  G.dialogueHistory={};
  G.actionUsed=false;
  G.dialogueRound=0;
  show('s-game');
}
