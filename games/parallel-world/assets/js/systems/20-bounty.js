// ════════════════════════════════
// BOUNTY
// ════════════════════════════════
async function generateBounties(){
  if(!API.key){ showMsg('请先设置 API Key'); return; }
  const btn=document.getElementById('btn-gen-bounty');
  btn.disabled=true;btn.textContent='生成中…';
  const sysPrompt=`你是一个军事基地内部悬赏公告板的内容生成器。生成5条奇葩有趣的悬赏委托。
背景：141联合基地，有Ghost、Keegan、Krueger、König、Nikto、Zimo、Riley（军犬）等成员。主角代号是${G.playerName}。
要求：
- 委托内容要搞怪有趣（比如要某人用过的东西、要某人签名、要主角的东西等）
- 每条委托难度不同（easy/normal/hard）
- 发布者用奇怪的匿名ID
- 酬金300-5000之间
- 截止时间用纯数字天数，如"3"代表3天内
严格要求：只返回JSON数组，不要任何解释文字，不要markdown，直接输出[...]
返回JSON数组：[{"title":"委托内容","reward":数字,"diff":"easy/normal/hard","poster":"匿名ID","deadline":"数字"}]`;
  try{
    const bounties=await callAIJson([{role:'user',content:'生成本周5条悬赏委托'}],sysPrompt,600);
    G.bounties=Array.isArray(bounties)?bounties:[];
    renderBounties();
    showMsg('本周悬赏已刷新');
  }catch(e){ showMsg('生成失败：'+e.message); }
  btn.disabled=false;btn.textContent='↻ 生成新委托';
}

function renderBounties(){
  const list=document.getElementById('bounty-list');list.innerHTML='';
  G.bounties.forEach((b,i)=>{
    const taken=G.activeBounty&&G.activeBounty.idx!==i;
    const isActive=G.activeBounty&&G.activeBounty.idx===i;
    const div=document.createElement('div');
    div.className='bounty-card'+(isActive?' taken':(taken?' taken':' available'));
    div.innerHTML=`<div class="bounty-card-top"><div class="bounty-card-title">${b.title}</div><div class="bounty-card-reward">¥${(b.reward||0).toLocaleString()}</div></div>
      <div class="bounty-card-meta"><span class="bounty-card-poster">${b.poster}</span><span class="bounty-card-tag bounty-tag-${b.diff||'normal'}">${{easy:'简单',normal:'普通',hard:'困难'}[b.diff||'normal']}</span><span class="bounty-card-deadline">截止：${b.deadline}</span></div>`;
    if(!taken&&!isActive) div.onclick=()=>acceptBounty(i,b);
    list.appendChild(div);
  });
}

function acceptBounty(idx,b){
  if(G.activeBounty){ showMsg('你已有进行中的委托'); return; }
  const deadlineDays = parseInt(b.deadline) || 3;
  G.activeBounty={idx, data:b, acceptedDay:G.day, deadlineDays, completed:false};
  document.getElementById('bounty-active-wrap').style.display='block';
  document.getElementById('bounty-active-title').textContent=b.title;
  document.getElementById('bounty-active-reward').textContent=`¥${(b.reward||0).toLocaleString()}`;
  updateBountyButtons();
  updateBountyTimer();
  renderBounties();
  showMsg(`接取委托：${b.title.slice(0,15)}…`);
}

function updateBountyButtons(){
  const done = G.activeBounty?.completed;
  const btnDone = document.getElementById('btn-bounty-done');
  const btnSubmit = document.getElementById('btn-bounty-submit');
  if(!btnDone||!btnSubmit) return;
  if(done){
    btnDone.style.display='none';
    btnSubmit.style.display='';
  } else {
    btnDone.style.display='';
    btnSubmit.style.display='none';
  }
}

function markBountyDone(){
  if(!G.activeBounty) return;
  G.activeBounty.completed = true;
  updateBountyButtons();
  showMsg('已标记为完成，可以交付了');
}

function updateBountyTimer(){
  if(!G.activeBounty) return;
  const daysLeft = G.activeBounty.deadlineDays - (G.day - G.activeBounty.acceptedDay);
  const el = document.getElementById('bounty-timer');
  if(el){
    if(daysLeft <= 0){
      el.textContent = '⚠ 已超时！';
      el.style.color='var(--red)';
    } else {
      el.textContent = `剩余 ${daysLeft} 天`;
      el.style.color = daysLeft <= 1 ? 'var(--red)' : 'rgba(232,220,200,0.6)';
    }
  }
  // 检查是否超时
  if(daysLeft <= 0 && G.activeBounty){
    const fine = Math.floor((G.activeBounty.data?.reward||500)*0.5);
    G.money = Math.max(0, G.money - fine);
    updateStats();
    G.activeBounty = null;
    document.getElementById('bounty-active-wrap').style.display='none';
    renderBounties();
    showMsg(`委托超时！扣除罚款 ¥${fine}`);
  }
}

function completeBounty(){
  if(!G.activeBounty) return;
  const reward = G.activeBounty.data?.reward || 0;
  G.money += reward;
  updateStats();
  showMsg(`✓ 委托完成！获得 ¥${reward.toLocaleString()}`);
  G.activeBounty = null;
  document.getElementById('bounty-active-wrap').style.display='none';
  renderBounties();
}

function abandonBounty(){
  const fine=Math.floor((G.activeBounty?.data?.reward||500)*0.3);
  G.money=Math.max(0,G.money-fine);
  G.activeBounty=null;
  document.getElementById('bounty-active-wrap').style.display='none';
  updateStats();
  renderBounties();
  showMsg(`委托已放弃，扣除违约金 ¥${fine}`);
}
