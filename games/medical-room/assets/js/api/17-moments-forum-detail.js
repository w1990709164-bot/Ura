// ══════════════════════════════
// MOMENTS / FORUM DETAIL
// assets/js/systems/17-moments-forum-detail.js
// ══════════════════════════════

const MOMENTS_DATA = [
  {
    charId:'system', name:'塔医疗部', av:'系',
    text:'【公告】精神疏导科第三诊疗组新向导医生今日正式上岗。欢迎。',
    time:'09:00', likes:0, comments:[],
    canComment: true,
  },
];

const FORUM_DATA = [
  {
    id:'f1', tag:'gossip', tagLabel:'八卦',
    title:'听说三楼来了个新向导医生？',
    author:'匿名', time:'今天',
    preview:'今天在走廊看到有人拿着绿萝进了第三诊疗组……',
    content:'今天在走廊看到有人拿着绿萝进了第三诊疗组，不知道是新来的向导医生还是后勤。感觉个子挺高的。有知道的吗？',
    replies:[
      {author:'匿名2', text:'应该是新向导医生，听说今天正式上岗'},
      {author:'后勤部小王', text:'那盆绿萝是三诊疗组原来就有的，活了三年了'},
    ],
    views:12, hot: false,
  },
  {
    id:'f2', tag:'lost', tagLabel:'失物招领',
    title:'寻找：一副黑色战术手套',
    author:'后勤部', time:'今天',
    preview:'在B区训练场附近丢失，有认领请联系内线2341',
    content:'本部门工作人员于今日上午在B区训练场附近遗失黑色战术手套一副，右手手套背面有轻微磨损痕迹。如有发现请联系内线2341，谢谢配合。',
    replies:[{author:'匿名', text:'这手套是不是141那边的……他们昨天在那训练'}],
    views:5, hot: false,
  },
  {
    id:'f3', tag:'intel', tagLabel:'情报',
    title:'近期哨兵感官过载事件增加',
    author:'医疗部', time:'昨天',
    preview:'医疗部数据显示本月感官过载报告同比上涨23%',
    content:'根据医疗部本月统计数据，哨兵感官过载相关报告同比上涨23%，其中听觉过载占比最高。精神疏导科正在扩编，第三诊疗组新向导医生已于今日正式上岗。如有紧急疏导需求，请通过内线预约系统提交。',
    replies:[
      {author:'匿名老兵', text:'这数据一点都不意外，最近任务强度比以前高太多了'},
      {author:'KorTac观察员', text:'建议加强任务后的强制疏导流程'},
    ],
    views:89, hot: true,
  },
];

// ── 论坛AI刷新 ──
let forumRefreshing = false;

async function refreshForum() {
  if (forumRefreshing) return;
  forumRefreshing = true;

  const btn = document.getElementById('forum-refresh-btn');
  if (btn) { btn.textContent = '刷新中…'; btn.disabled = true; }

  try {
    // 构建今日剧情上下文
    const todayLogs = (G.worldLog||[]).filter(e=>e.day===G.day).slice(0,6).map(e=>e.text).join('；');
    const contacts  = G.contacts.map(id=>{
      const c = CHARS.find(x=>x.id===id);
      const p = G.patients[id];
      const phase = (typeof PHASE_LABELS !== 'undefined' ? PHASE_LABELS[p?.trustPhase||0] : null) || '戒备';
      return c ? `${c.name}（${phase}）` : id;
    }).join('、');
    const existingTitles = FORUM_DATA.slice(0,5).map(p=>p.title).join('、');

    const prompt = `你是"塔区论坛"的内容生成器。根据今日发生的事情，生成2-3条新的论坛帖子。

今日剧情：${todayLogs||'向导医生第'+G.day+'天在塔内日常工作'}
已接触哨兵：${contacts||'无'}
现有帖子标题（不要重复）：${existingTitles}

要求：
- 帖子要有塔内生活感，像真实的内部论坛
- 可以是八卦、失物招领、情报、通知、匿名吐槽
- 内容可以隐晦涉及今日发生的事，但不要直接点名
- 作者可以是匿名、后勤部、医疗部、某阵营观察员等
- 每条帖子有1-2条回复，回复要有活人感
- tag只能是：gossip / lost / intel / notice / anon

严格返回JSON数组，不要任何其他内容：
[
  {
    "tag":"gossip",
    "title":"标题（20字内）",
    "author":"作者",
    "content":"正文（100字内）",
    "replies":[{"author":"回复者","text":"回复内容"}]
  }
]`;

    const endpoint = G.apiEndpoint ? G.apiEndpoint.replace(/\/$/,'')+'/chat/completions' : 'https://api.anthropic.com/v1/messages';
    const isOAI = !!G.apiEndpoint;
    const model = G.apiModel||(isOAI?'gpt-4o':'claude-sonnet-4-20250514');

    let rawText = '';
    if (isOAI) {
      const r = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${G.apiKey}`},body:JSON.stringify({model,max_tokens:800,messages:[{role:'user',content:prompt}]})});
      const data = await r.json();
      rawText = data.choices?.[0]?.message?.content||'[]';
    } else {
      const r = await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-api-key':G.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model,max_tokens:800,messages:[{role:'user',content:prompt}]})});
      const data = await r.json();
      rawText = data.content?.[0]?.text||'[]';
    }

    // 解析JSON
    const clean = rawText.replace(/```json|```/g,'').trim();
    const posts = JSON.parse(clean);
    const tagLabels = {gossip:'八卦',lost:'失物招领',intel:'情报',notice:'通知',anon:'匿名'};

    posts.forEach(post => {
      const id = 'ai_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
      FORUM_DATA.unshift({
        id,
        tag: post.tag || 'gossip',
        tagLabel: tagLabels[post.tag] || '杂谈',
        title: post.title,
        author: post.author || '匿名',
        time: `第${G.day}天`,
        preview: (post.content||'').slice(0,40)+'…',
        content: post.content || '',
        replies: post.replies || [],
        views: Math.floor(Math.random()*30)+5,
        hot: false,
      });
    });

    // 维护热门帖子列表（供角色在私聊里提到）
    updateHotPosts();

    // 保持最多30条
    while (FORUM_DATA.length > 30) FORUM_DATA.pop();

    renderForum();
    showToast('论坛已刷新');

  } catch(e) {
    console.error('[forum refresh]', e);
    showToast('刷新失败，稍后再试');
  }

  forumRefreshing = false;
  if (btn) { btn.textContent = '🔄 刷新'; btn.disabled = false; }
}

function updateHotPosts() {
  // 按浏览量排序，取前3作为热门
  G.hotPosts = [...FORUM_DATA]
    .sort((a,b)=>(b.views||0)-(a.views||0))
    .slice(0,3)
    .map(p=>({ id:p.id, title:p.title, author:p.author, views:p.views }));
  // 标记hot
  FORUM_DATA.forEach(p => { p.hot = G.hotPosts.some(h=>h.id===p.id); });
}

// ── 朋友圈详情 ──
function openMomentDetail(idx) {
  const m = MOMENTS_DATA[idx];
  if (!m) return;
  showMomentModal(m, idx);
}

function showMomentModal(m, idx) {
  let modal = document.getElementById('content-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'content-modal';
    modal.style.cssText = `position:fixed;inset:0;z-index:700;background:rgba(5,8,16,0.95);display:flex;flex-direction:column;overflow:hidden`;
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="height:50px;background:var(--panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0">
      <button onclick="document.getElementById('content-modal').remove()" style="background:none;border:none;color:var(--cyan);font-size:20px;cursor:pointer">‹</button>
      <div style="font-family:var(--hud);font-size:14px;color:var(--white);font-weight:600">朋友圈</div>
    </div>
    <div style="flex:1;overflow-y:auto;padding:16px;-webkit-overflow-scrolling:touch">
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--bg3);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-family:var(--hud);font-size:14px;font-weight:700;color:var(--cyan);flex-shrink:0">${m.av}</div>
        <div>
          <div style="font-family:var(--hud);font-size:14px;font-weight:600;color:var(--cyan)">${m.name}</div>
          <div style="font-family:var(--mono);font-size:10px;color:var(--text3)">${m.time}</div>
        </div>
      </div>
      <div style="font-size:14px;color:var(--text);line-height:1.9;margin-bottom:16px">${m.text}</div>
      <div style="border-top:1px solid var(--border);padding-top:12px">
        <div style="font-family:var(--hud);font-size:11px;color:var(--text3);letter-spacing:1px;margin-bottom:10px">评论 ${m.comments.length}</div>
        ${m.comments.map(c=>`
          <div style="padding:8px 0;border-bottom:1px solid rgba(26,40,64,0.4)">
            <div style="font-family:var(--hud);font-size:12px;color:var(--cyan);margin-bottom:4px">${c.author}</div>
            <div style="font-size:13px;color:var(--text);line-height:1.7">${c.text}</div>
          </div>`).join('')}
      </div>
    </div>
    ${m.canComment ? `
    <div style="padding:12px 16px;border-top:1px solid var(--border);background:var(--panel);display:flex;gap:8px">
      <input id="moment-comment-input" style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--white);font-family:var(--serif);font-size:13px;padding:8px 12px;outline:none" placeholder="发表评论…">
      <button onclick="postMomentComment(${idx})" style="padding:8px 14px;background:var(--cyan-glow);border:1px solid var(--cyan);border-radius:6px;color:var(--cyan);font-family:var(--hud);font-size:12px;cursor:pointer">发送</button>
    </div>` : ''}
  `;
  modal.style.display = 'flex';
}

function postMomentComment(idx) {
  const input = document.getElementById('moment-comment-input');
  const text = input?.value.trim();
  if (!text) return;
  MOMENTS_DATA[idx].comments.push({author: G.player.name||'向导医生', text});
  input.value = '';
  showMomentModal(MOMENTS_DATA[idx], idx);
  showToast('评论已发送');
}

// ── 论坛详情 ──
function openForumPost(postId) {
  const post = FORUM_DATA.find(p=>p.id===postId);
  if (!post) return;
  let modal = document.getElementById('content-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'content-modal';
    modal.style.cssText = `position:fixed;inset:0;z-index:700;background:rgba(5,8,16,0.95);display:flex;flex-direction:column;overflow:hidden`;
    document.body.appendChild(modal);
  }
  const tagColors = {gossip:'var(--yellow,#ffd600)',lost:'var(--teal)',intel:'var(--pink)',notice:'var(--cyan)',anon:'var(--text3)'};
  modal.innerHTML = `
    <div style="height:50px;background:var(--panel);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;gap:10px;flex-shrink:0">
      <button onclick="document.getElementById('content-modal').remove()" style="background:none;border:none;color:var(--cyan);font-size:20px;cursor:pointer">‹</button>
      <div style="font-family:var(--hud);font-size:14px;color:var(--white);font-weight:600">论坛</div>
      ${post.hot?'<div style="margin-left:auto;font-family:var(--mono);font-size:9px;color:var(--pink);background:rgba(255,45,107,0.1);border:1px solid rgba(255,45,107,0.3);padding:2px 8px;border-radius:10px">🔥 热门</div>':''}
    </div>
    <div style="flex:1;overflow-y:auto;padding:16px;-webkit-overflow-scrolling:touch">
      <div style="font-family:var(--mono);font-size:10px;color:${tagColors[post.tag]||'var(--cyan)'};background:rgba(0,0,0,0.3);border:1px solid;border-color:${tagColors[post.tag]||'var(--cyan)'};padding:2px 8px;border-radius:2px;display:inline-block;margin-bottom:10px">${post.tagLabel}</div>
      <div style="font-family:var(--hud);font-size:16px;font-weight:700;color:var(--white);margin-bottom:8px;line-height:1.4">${post.title}</div>
      <div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-bottom:14px">${post.author} · ${post.time} · 👁 ${post.views}</div>
      <div style="font-size:14px;color:var(--text);line-height:1.9;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)">${post.content}</div>
      <div style="font-family:var(--hud);font-size:11px;color:var(--text3);letter-spacing:1px;margin-bottom:12px">回复 ${post.replies.length}</div>
      ${post.replies.map(r=>`
        <div style="padding:10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;margin-bottom:8px">
          <div style="font-family:var(--hud);font-size:12px;color:var(--cyan);margin-bottom:4px">${r.author}</div>
          <div style="font-size:13px;color:var(--text);line-height:1.7">${r.text}</div>
        </div>`).join('')}
    </div>
    <div style="padding:12px 16px;border-top:1px solid var(--border);background:var(--panel);display:flex;gap:8px">
      <input id="forum-reply-input" style="flex:1;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--white);font-family:var(--serif);font-size:13px;padding:8px 12px;outline:none" placeholder="发表回复…">
      <button onclick="postForumReply('${postId}')" style="padding:8px 14px;background:var(--cyan-glow);border:1px solid var(--cyan);border-radius:6px;color:var(--cyan);font-family:var(--hud);font-size:12px;cursor:pointer">回复</button>
    </div>
  `;
  modal.style.display = 'flex';
  post.views++;
  updateHotPosts();
}

function postForumReply(postId) {
  const post = FORUM_DATA.find(p=>p.id===postId);
  const input = document.getElementById('forum-reply-input');
  const text = input?.value.trim();
  if (!text || !post) return;
  post.replies.push({author: G.player.name||'向导医生', text});
  input.value = '';
  openForumPost(postId);
  showToast('回复已发送');
}
