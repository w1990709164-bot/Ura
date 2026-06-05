// ═══════════════════════════════
// LEADERBOARD
// ═══════════════════════════════
async function showLeaderboard(){
  // Sort by completion time
  const ranking=[...G.todayRanking].sort((a,b)=>a.completionTime-b.completionTime);
  const lb=document.getElementById('lb-card');
  document.getElementById('lb-day').textContent=`第${G.totalDay||1}天`;
  document.getElementById('lb-next-day').textContent=(G.totalDay||1)+1;

  const rankClasses=['r1','r2','r3'];
  const rankEmojis=['🥇','🥈','🥉'];

  // Generate system comments via AI
  let comments={};
  if(G.apiKey&&ranking.length){
    try{
      const charList=ranking.slice(0,3).map(r=>CHARS.find(c=>c.id===r.charId)?.chatId||r.charId).join('，');
      const prompt=`为今天完成攻略任务的前三名生成系统排行榜评语。角色ID（按名次）：${charList}。
评语要刻薄有趣，像一个坏系统在嘲讽。每条不超过15字。
返回JSON：{"${ranking[0]?.charId||''}":"评语","${ranking[1]?.charId||''}":"评语","${ranking[2]?.charId||''}":"评语"}`;
      const raw=await fetchAI(prompt,[{role:'user',content:'生成评语'}]);
      const match=raw.match(/\{[\s\S]*\}/);
      if(match) comments=JSON.parse(match[0]);
    } catch(e){}
  }

  if(!ranking.length){
    lb.innerHTML=`<div class="lb-no-task">今天没有人完成任务<br><span style="font-family:var(--mono);font-size:9px;color:var(--text3)">系统表示失望</span></div>`;
  } else {
    lb.innerHTML=ranking.slice(0,3).map((r,i)=>{
      const c=CHARS.find(x=>x.id===r.charId);
      const comment=comments[r.charId]||'……';
      return `<div class="lb-row">
        <div class="lb-rank ${rankClasses[i]}">${rankEmojis[i]}</div>
        <div style="flex:1">
          <div class="lb-id">${c?.chatId||r.charId}</div>
          <div class="lb-comment">${comment}</div>
        </div>
      </div>`;
    }).join('')+(ranking.length<1?`<div class="lb-no-task">今日无人完成任务</div>`:'');
  }

  document.getElementById('leaderboard-overlay').style.display='flex';
}

// closeLB and advanceDay moved to new implementation above
