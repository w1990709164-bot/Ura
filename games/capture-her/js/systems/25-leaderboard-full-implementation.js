// ═══════════════════════════════
// LEADERBOARD (full implementation)
// ═══════════════════════════════
async function showLeaderboard() {
  const ranking = [...G.todayRanking].sort((a,b)=>a.completionTime-b.completionTime);

  document.getElementById('lb-day').textContent = `第${G.totalDay||1}天`;
  document.getElementById('lb-next-day').textContent = (G.totalDay||1)+1;

  const rankEmojis = ['🥇','🥈','🥉'];
  const rankClasses = ['r1','r2','r3'];
  const lb = document.getElementById('lb-card');

  // Also show who failed
  const failedChars = G.dailyTasks.filter(t=>!t.done).map(t=>CHARS.find(c=>c.id===t.charId)?.chatId).filter(Boolean);

  // Generate AI comments
  let comments = {};
  if(G.apiKey && ranking.length) {
    try {
      const names = ranking.slice(0,3).map(r=>CHARS.find(c=>c.id===r.charId)?.chatId||r.charId);
      const failNames = failedChars.slice(0,3);
      const prompt = `为今天的攻略任务排行榜生成系统评语，语气刻薄有趣，像一个看热闹的坏系统。
完成者（按速度）：${names.join('、') || '无'}
未完成者：${failNames.join('、') || '无'}
每条评语不超过15字，尽量针对角色性格讽刺。
返回JSON：{"${ranking[0]?.charId||''}":"评语","${ranking[1]?.charId||''}":"评语","${ranking[2]?.charId||''}":"评语","failed":"对未完成者的总结评语"}`;
      const raw = await fetchAI(prompt,[{role:'user',content:'生成评语'}]);
      const match = raw.match(/\{[\s\S]*\}/);
      if(match) comments = JSON.parse(match[0]);
    } catch(e){}
  }

  let html = '';
  if(!ranking.length) {
    html = '<div style="text-align:center;padding:20px;font-family:var(--cormo);font-style:italic;font-size:13px;color:var(--text3)">今日无人完成任务<br><span style="font-size:11px">系统表示失望</span></div>';
  } else {
    html = ranking.slice(0,3).map((r,i)=>{
      const c = CHARS.find(x=>x.id===r.charId);
      const comment = comments[r.charId] || '……';
      const timeStr = r.completionTime ? new Date(r.completionTime).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}) : '--:--';
      return `<div class="lb-row">
        <div class="lb-rank ${rankClasses[i]||''}">${rankEmojis[i]||'·'}</div>
        <div style="flex:1">
          <div class="lb-id">${c?.chatId||r.charId}</div>
          <div class="lb-comment">${comment}</div>
        </div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--text3)">${timeStr}</div>
      </div>`;
    }).join('');
  }

  if(failedChars.length) {
    html += `<div style="padding:10px 16px;font-family:var(--mono);font-size:9px;color:var(--text3);border-top:1px solid var(--border)">
      未完成：${failedChars.join(' · ')} · ${comments.failed||'系统已记录'}
    </div>`;
  }

  lb.innerHTML = html;
  document.getElementById('leaderboard-overlay').style.display='flex';
}

function closeLB() {
  document.getElementById('leaderboard-overlay').style.display='none';
  advanceDay();
}
