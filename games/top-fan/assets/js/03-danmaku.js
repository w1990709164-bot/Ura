/* ============================================================
 * 弹幕渲染引擎 —— 公演「直播中」浮层滚动评论
 *  改自《弹幕求生》，去掉真假机制，纯氛围。
 * ============================================================ */
(function () {
  'use strict';
  const TF = window.TF;
  const U = TF.util;

  const D = (TF.danmaku = {
    layer: null,
    cfg: { fontSize: 16, durMin: 9, durMax: 15, lanes: 5, opacity: 0.96 },
    _laneFree: [],

    init() {
      this.layer = U.$('#danmu-layer');
      if (!this.layer) {
        this.layer = document.createElement('div');
        this.layer.id = 'danmu-layer';
        document.body.appendChild(this.layer);
      }
      this._laneFree = new Array(this.cfg.lanes).fill(0);
    },
    clear() { if (this.layer) this.layer.innerHTML = ''; },
    show() { if (this.layer) this.layer.style.display = 'block'; },
    hide() { if (this.layer) { this.layer.style.display = 'none'; this.clear(); } },

    // it: {id, text, leadColor?}
    shoot(it) {
      if (!this.layer) this.init();
      const now = performance.now();
      let lane = 0, best = Infinity;
      for (let i = 0; i < this.cfg.lanes; i++) {
        if (this._laneFree[i] <= now) { lane = i; break; }
        if (this._laneFree[i] < best) { best = this._laneFree[i]; lane = i; }
      }
      const dur = U.randInt(this.cfg.durMin, this.cfg.durMax);
      this._laneFree[lane] = now + dur * 1000 * 0.42;

      const el = document.createElement('div');
      el.className = 'danmu-item' + (it.leadColor ? ' dm-lead' : '');
      el.style.top = (10 + lane * (this.cfg.fontSize + 16)) + 'px';
      el.style.fontSize = this.cfg.fontSize + 'px';
      el.style.opacity = this.cfg.opacity;
      el.style.animationDuration = dur + 's';
      if (it.leadColor) el.style.color = it.leadColor;
      const idPart = it.id ? `<span class="dm-id">${U.esc(it.id)}</span>` : '';
      el.innerHTML = `${idPart}<span class="dm-text">${U.esc(it.text)}</span>`;
      el.addEventListener('animationend', () => el.remove());
      this.layer.appendChild(el);
    },

    burst(items, gapMs) {
      gapMs = gapMs || 650;
      items.forEach((it, i) => setTimeout(() => this.shoot(it), i * gapMs + U.randInt(0, 260)));
    },
  });

})();
