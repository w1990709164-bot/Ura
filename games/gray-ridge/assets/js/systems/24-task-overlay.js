// ══════════════════════════════
// TASK OVERLAY
// ══════════════════════════════
function openTaskOverlay(tasks) {
  const wrap = document.getElementById('task-cards');
  const gradeClass = {D:'grade-d',C:'grade-c',B:'grade-b',A:'grade-a'};
  wrap.innerHTML = tasks.map(t=>`
    <div class="task-card">
      <div class="task-card-name">${t.name}</div>
      <div class="task-card-meta">
        <span class="task-card-tag ${gradeClass[t.grade]||'grade-d'}">${t.grade}级</span>
        <span class="task-card-tag" style="color:var(--sand);border-color:var(--sand-dim)">📍 ${t.location}</span>
      </div>
      <div class="task-card-desc">${t.desc}</div>
      <div class="task-card-members">成员：${t.members}</div>
      <div class="task-card-rec">推荐属性：${t.recommended}</div>
      <div class="task-card-actions">
        <button class="task-card-btn cancel" onclick="closeTaskOverlay()">放弃</button>
        <button class="task-card-btn confirm" onclick="acceptTask('${t.id}')">接取任务</button>
      </div>
    </div>`).join('');
  document.getElementById('task-overlay').style.display = 'flex';
}

function closeTaskOverlay() {
  document.getElementById('task-overlay').style.display = 'none';
}

function acceptTask(taskId) {
  closeTaskOverlay();
  G.weeklyTaskDone = true;
  showToast('任务已接取');
  addSysMsg('任务接取', `已接取任务，前往${G.currentLocation==='hall'?'准备区域':'任务地点'}…`);
  callAI();
}
