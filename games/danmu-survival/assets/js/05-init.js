/* ============================================================
 * 启动 / 标题屏 / API 状态面板
 * ============================================================ */
(function () {
  'use strict';
  const DS = window.DS;
  const U = DS.util;
  const Game = DS.game;
  const API = DS.api;

  /* ---------- API 配置面板 ---------- */
  function openApiPanel() {
    const c = API.getConfig();
    const srcTxt = c.source === 'global' ? '当前：复用主页面全局配置 (LW_*)'
      : '当前：未配置';
    Game.modal('🔌 API 设置', `
      <p class="hint">${srcTxt}<br>
      本游戏直接读取里世界主页的全局 API。需要更换接口、Key 或模型时，请回到主页「设置 API」。</p>
      <label class="fld">接口地址 URL
        <input id="ap-url" class="input" disabled value="${U.esc(c.url || '(未设置，默认 Claude/Anthropic 通道)')}">
      </label>
      <label class="fld">API Key
        <input id="ap-key" class="input" disabled value="${c.key ? '已配置（隐藏）' : '未配置'}">
      </label>
      <label class="fld">模型 Model
        <input id="ap-model" class="input" disabled value="${U.esc(c.model || '未配置')}">
      </label>
      <div id="ap-result" class="ap-result"></div>
    `, [
      { label: '测试连接', onClick: async () => {
        const box = U.$('#ap-result'); box.textContent = '测试中…';
        try { const r = await API.test(); box.innerHTML = '<span class="ok">✓ 连通：' + U.esc(r) + '</span>'; }
        catch (e) { box.innerHTML = '<span class="err">✗ ' + U.esc(e.message) + '</span>'; }
      } },
      { label: '回主页设置', cls: 'btn-primary', onClick: () => { location.href = '../../index.html'; } },
      { label: '关闭', onClick: () => Game.closeModal() },
    ]);
  }
  DS.openApiPanel = openApiPanel;

  /* ---------- 标题屏 ---------- */
  function bindTitle() {
    U.$('#btn-new').onclick = () => {
      if (DS.hasSave() && !confirm('已有存档，开始新游戏会覆盖。继续？')) return;
      Game.newGame();
    };
    const cont = U.$('#btn-continue');
    cont.disabled = !DS.hasSave();
    cont.onclick = () => {
      if (DS.load()) Game.resume();   // 统一走 resume：正确恢复一阶段/创建/二阶段剧情
      else Game.toast('没有可用存档');
    };
    U.$('#btn-api').onclick = openApiPanel;
    U.$('#btn-api-game') && (U.$('#btn-api-game').onclick = openApiPanel);
  }

  /* 标题页氛围弹幕（缓慢循环） */
  DS.bootDanmaku = function () {
    clearInterval(DS._titleTimer);
    const pool = [
      { id: '系统', text: '【欢迎来到末日直播间】', kind: 'flavor' },
      { id: '老观众', text: '又一个穿越的，看她能活几天', kind: 'flavor' },
      { id: '末日预言家233', text: '提醒一句：弹幕会骗人', kind: 'flavor' },
      { id: '神秘ID', text: '……能听见我的话，就向西走。', kind: 'flavor' },
      { id: '乐子人', text: '搬好小板凳，开看', kind: 'flavor' },
    ];
    let i = 0;
    DS._titleTimer = setInterval(() => {
      if (DS.state.screen !== 'title') { clearInterval(DS._titleTimer); return; }
      DS.danmaku.shoot(pool[i % pool.length]); i++;
    }, 2600);
    DS.danmaku.shoot(pool[0]);
  };

  /* ---------- 启动 ---------- */
  function boot() {
    DS.danmaku.init();
    Game.bindActions();
    bindTitle();
    Game.show('title');
    DS.bootDanmaku();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();
