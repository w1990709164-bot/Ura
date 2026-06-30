/* ============================================================
 * 弹幕渲染引擎 —— 浮在画面上方的滚动评论层
 * 还原酒馆「文中弹幕」：可配字号/速度/密度/透明度
 *  · kind: true/false 仅内部记录；玩家默认看不到（除非异能“鉴弹之眼”）
 * ============================================================ */
(function () {
  'use strict';
  const DS = window.DS;
  const U = DS.util;

  const Danmaku = (DS.danmaku = {
    layer: null,
    cfg: {
      fontSize: 17,
      durationMin: 17,  // 秒（越大越慢，给足阅读时间）
      durationMax: 25,
      lanes: 5,         // 轨道数（密度）
      opacity: 0.95,
      reveal: false,    // 是否显示真假标记（“鉴弹之眼”异能开启）
    },
    _laneNextFree: [],  // 每条轨道下次可用时间戳

    init() {
      this.layer = U.$('#danmaku-layer');
      if (!this.layer) {
        this.layer = document.createElement('div');
        this.layer.id = 'danmaku-layer';
        document.body.appendChild(this.layer);
      }
      this._laneNextFree = new Array(this.cfg.lanes).fill(0);
    },

    setReveal(on) { this.cfg.reveal = !!on; },

    clear() { if (this.layer) this.layer.innerHTML = ''; },

    // 发一条弹幕
    shoot(item) {
      if (!this.layer) this.init();
      const now = performance.now();
      // 找一条空闲轨道（避免重叠）
      let lane = 0, best = Infinity;
      for (let i = 0; i < this.cfg.lanes; i++) {
        if (this._laneNextFree[i] <= now) { lane = i; break; }
        if (this._laneNextFree[i] < best) { best = this._laneNextFree[i]; lane = i; }
      }
      const dur = U.randInt(this.cfg.durationMin, this.cfg.durationMax);
      // 该轨道在弹幕“离开左边缘约 40%”后才放下一条
      this._laneNextFree[lane] = now + dur * 1000 * 0.42;

      // 真假可见：来自“鉴弹之眼”异能(cfg.reveal)，或该条已被识破为可信源/带节奏(item.revealKind)
      const reveal = (this.cfg.reveal || item.revealKind) && item.kind && item.kind !== 'flavor';
      const el = document.createElement('div');
      el.className = 'danmaku-item';
      if (reveal) {
        el.classList.add(item.kind === 'true' ? 'dm-true' : 'dm-false');
      }
      el.style.top = (8 + lane * (this.cfg.fontSize + 14)) + 'px';
      el.style.fontSize = this.cfg.fontSize + 'px';
      el.style.opacity = this.cfg.opacity;
      el.style.animationDuration = dur + 's';

      const idPart = item.id ? `<span class="dm-id">${U.esc(item.id)}</span>` : '';
      let badge = '';
      if (reveal && item.kind === 'true') badge = '<span class="dm-badge dm-badge-t">真</span>';
      if (reveal && item.kind === 'false') badge = '<span class="dm-badge dm-badge-f">假</span>';
      el.innerHTML = `${idPart}${badge}<span class="dm-text">${U.esc(item.text)}</span>`;

      el.addEventListener('animationend', () => el.remove());
      this.layer.appendChild(el);
    },

    // 批量投放（带随机间隔），返回总时长
    burst(items, gapMs) {
      gapMs = gapMs || 700;
      items.forEach((it, i) => setTimeout(() => this.shoot(it), i * gapMs + U.randInt(0, 300)));
    },
  });

})();
