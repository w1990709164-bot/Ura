// ════════════════════════════════
// FORUM
// ════════════════════════════════
function openBoard(boardKey,title,desc){
  G.currentBoard={key:boardKey,title,desc};
  document.getElementById('forum-boards-view').style.display='none';
  document.getElementById('forum-post-view').classList.add('open');
  document.getElementById('forum-detail-view').classList.remove('open');
  document.getElementById('forum-board-title').textContent=title;
  document.getElementById('forum-board-desc').textContent=desc;
  document.getElementById('post-list').innerHTML=`<div style="font-family:'IM Fell English',serif;font-style:italic;font-size:0.7rem;color:rgba(232,220,200,0.3);text-align:center;padding:1rem;">点击「刷新」加载帖子</div>`;
}
function backToBoards(){
  document.getElementById('forum-boards-view').style.display='block';
  document.getElementById('forum-post-view').classList.remove('open');
  document.getElementById('forum-detail-view').classList.remove('open');
}
function backToPostList(){
  document.getElementById('forum-post-view').classList.add('open');
  document.getElementById('forum-detail-view').classList.remove('open');
}
function toggleNewPost(){document.getElementById('new-post-form').classList.toggle('open');}

async function refreshPosts(){
  if(!API.key){ showMsg('请先设置 API Key'); return; }
  const btn=document.getElementById('btn-refresh-posts');
  btn.disabled=true;btn.textContent='生成中…';
  const b=G.currentBoard;
  const sysPrompt=`你是一个军事内部论坛的内容生成器。根据板块类型生成3条匿名帖子。
板块：${b.title}
基地背景：141联合基地，有TF141、Ghosts、KorTac、Chimera四支小队，成员包括Ghost、Keegan、Krueger、König、Nikto、Zimo、Riley（军犬）等。时间是2030年。
要求：
- 帖子要符合板块氛围，生动有趣
- 作者用匿名ID（如anon_1234、shadow_9、mystery_buyer等）
- 帖子里角色可以以匿名方式出现（但不用真名）
- 每条帖子要有2-3条评论，其中至少一条是角色的匿名发言
- 八卦板要搞笑，树洞要有情绪，技术板要专业，情报板要有紧张感
返回JSON数组：[{"title":"帖子标题","author":"匿名ID","time":"X小时前","body":"帖子正文","replies":[{"a":"匿名ID","t":"评论内容","char":true或false}]}]`;
  try{
    const posts=await callAIJson([{role:'user',content:`生成${b.title}板块的3条帖子`}],sysPrompt,900);
    const list=Array.isArray(posts)?posts:[posts];
    renderPostList(list);
  }catch(e){ showMsg('生成失败：'+e.message); }
  btn.disabled=false;btn.textContent='↻ 刷新';
}

function renderPostList(posts){
  const list=document.getElementById('post-list');list.innerHTML='';
  posts.forEach(p=>{
    const div=document.createElement('div');div.className='post-card';
    div.onclick=()=>openPost(p);
    div.innerHTML=`<div class="post-header"><div class="post-title">${p.title}</div><span class="post-replies">${(p.replies||[]).length}回复</span></div>
      <div class="post-meta"><span class="post-author">${p.author}</span><span class="post-time">${p.time}</span></div>
      <div class="post-preview">${(p.body||'').slice(0,40)}…</div>`;
    list.appendChild(div);
  });
}

function openPost(post){
  G.currentPost=post;
  document.getElementById('forum-post-view').classList.remove('open');
  document.getElementById('forum-detail-view').classList.add('open');
  document.getElementById('detail-title').textContent=post.title;
  document.getElementById('detail-meta').textContent=`${post.author} · ${post.time}`;
  document.getElementById('detail-body').textContent=post.body;
  const cl=document.getElementById('comment-list');cl.innerHTML='';
  (post.replies||[]).forEach(r=>{
    const div=document.createElement('div');
    div.className='comment'+(r.char?' highlight':'');
    div.innerHTML=`<div class="comment-author${r.char?' char':''}">${r.a}</div><div class="comment-text">${r.t}</div>`;
    cl.appendChild(div);
  });
}

async function submitPost(){
  const t=document.getElementById('post-title-input').value.trim();
  const b=document.getElementById('post-body-input').value.trim();
  if(!t){ showMsg('请填写标题'); return; }
  if(!API.key){ showMsg('请先设置 API Key'); return; }
  const btn=document.getElementById('btn-submit-post');
  btn.disabled=true;btn.textContent='发布中…';
  // AI generates replies
  const sysPrompt=`你是一个军事内部论坛的回复生成器。根据用户发的帖子，生成2-3条匿名回复。背景：141联合基地，2030年。回复要自然，符合军人语气，其中可以有1条是角色的匿名发言。
返回JSON数组：[{"a":"匿名ID","t":"回复内容","char":true或false}]`;
  try{
    const replies=await callAIJson([{role:'user',content:`帖子标题：${t}\n内容：${b}`}],sysPrompt,400);
    const newPost={title:t,author:`anon_${G.playerName}`,time:'刚刚',body:b,replies:Array.isArray(replies)?replies:[]};
    // add to current list (in memory)
    document.getElementById('post-title-input').value='';
    document.getElementById('post-body-input').value='';
    document.getElementById('new-post-form').classList.remove('open');
    openPost(newPost);
    showMsg('发布成功（匿名）');
  }catch(e){ showMsg('发布失败：'+e.message); }
  btn.disabled=false;btn.textContent='匿名发布';
}

async function sendComment(){
  const v=document.getElementById('comment-input').value.trim();
  if(!v){ showMsg('请输入内容'); return; }
  if(!API.key){ showMsg('请先设置 API Key'); return; }
  const btn=document.getElementById('btn-send-comment');
  btn.disabled=true;
  // AI generates a reply to the comment
  const sysPrompt=`你是一个军事内部论坛里的匿名用户（可能是基地某个角色的匿名账号）。根据帖子内容和用户的评论，生成一条简短的回复。要自然、符合军人语气，可以带一点角色特色但不要暴露身份。
只返回JSON：{"a":"匿名ID","t":"回复内容","char":true或false}`;
  try{
    const post=G.currentPost;
    post.replies.push({a:`anon_${G.playerName}`,t:v,char:false});
    const aiReply=await callAIJson([{role:'user',content:`帖子：${post.title}\n用户评论：${v}`}],sysPrompt,200);
    post.replies.push(aiReply);
    openPost(post);
  }catch(e){
    if(G.currentPost) G.currentPost.replies.push({a:`anon_${G.playerName}`,t:v,char:false});
    if(G.currentPost) openPost(G.currentPost);
  }
  document.getElementById('comment-input').value='';
  btn.disabled=false;
}
