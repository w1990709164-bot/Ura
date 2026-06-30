/* ============================================================
 * 启动 / 事件绑定
 * ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const U = TF.util;

  function boot() {
    // 标题屏
    U.$('#btn-new').onclick = () => {
      if (TF.hasSave() && !confirm('已有存档，开始新游戏会覆盖。继续？')) return;
      TF.game.startCreate();
    };
    U.$('#btn-continue').onclick = () => {
      if (!TF.load()) { TF.ui.toast('没有存档'); return; }
      if (TF.state.debuted) { TF.daily.enter(); return; }
      const sc = TF.state.screen;
      TF.screens.go(sc === 'stage' || sc === 'result' ? 'hub' : (sc === 'title' || sc === 'create' ? 'hub' : sc));
    };
    U.$('#btn-continue').style.display = TF.hasSave() ? '' : 'none';
    U.$('#btn-api').onclick = openApi;

    // 捏人
    U.$('#cr-start').onclick = () => TF.game.confirmCreate();

    // 公演 / 成绩
    U.$('#stage-next').onclick = () => TF.stage.finish();
    U.$('#result-next').onclick = () => TF.game.afterResult();

    // 事件结算后继续
    U.$('#event-continue').onclick = () => TF.game.afterEvent();

    // 备战登台
    U.$('#prep-go').onclick = () => TF.prep.go();

    // 手机悬浮按钮（各屏通用）
    U.$$('.phone-fab').forEach(b => b.onclick = () => TF.phone.open('weibo'));
    U.$('#phone-close').onclick = () => TF.phone.close();
    U.$('#phone').onclick = e => { if (e.target.id === 'phone') TF.phone.close(); };

    // API 弹窗
    U.$('#api-save').onclick = () => {
      localStorage.setItem('LW_API_URL', U.$('#api-url').value.trim());
      localStorage.setItem('LW_API_KEY', U.$('#api-key').value.trim());
      localStorage.setItem('LW_API_MODEL', U.$('#api-model').value.trim());
      TF.ui.toast(TF.api.isReady() ? '已保存，AI 已就绪' : '已保存（信息不全，将用模板模式）');
      U.$('#api-modal').classList.remove('show');
    };
    U.$('#api-close').onclick = () => U.$('#api-modal').classList.remove('show');
    U.$('#api-test').onclick = async () => {
      U.$('#api-save').click();
      const btn = U.$('#api-test'); btn.textContent = '测试中…'; btn.disabled = true;
      try { const r = await TF.api.test(); TF.ui.toast('连接成功：' + r); }
      catch (e) { TF.ui.toast('连接失败：' + String(e).slice(0, 60)); }
      btn.textContent = '测试连接'; btn.disabled = false;
    };

    TF.screens.go('title');
  }

  function openApi() {
    U.$('#api-url').value = localStorage.getItem('LW_API_URL') || '';
    U.$('#api-key').value = localStorage.getItem('LW_API_KEY') || '';
    U.$('#api-model').value = localStorage.getItem('LW_API_MODEL') || '';
    U.$('#api-modal').classList.add('show');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

})();
