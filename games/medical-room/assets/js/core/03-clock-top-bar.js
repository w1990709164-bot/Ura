// ══════════════════════════════
// CLOCK & TOP BAR
// ══════════════════════════════
const WEATHERS = [
  {icon:'☀️',text:'晴 · 15°C'},{icon:'⛅',text:'多云 · 8°C'},
  {icon:'🌧',text:'小雨 · 6°C'},{icon:'🌫',text:'雾 · 5°C'},
  {icon:'❄️',text:'雪 · -2°C'},{icon:'🌤',text:'晴间多云 · 12°C'},
];

function getGameDate(dayOffset) {
  // Game starts on 2060.01.01, advances with G.day
  const day = (dayOffset !== undefined ? dayOffset : G.day) || 1;
  // Start date: 2060-01-01
  const startMs = new Date(2060, 0, 1).getTime();
  const targetMs = startMs + (day - 1) * 24 * 60 * 60 * 1000;
  const d = new Date(targetMs);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const wk = ['日','一','二','三','四','五','六'][d.getDay()];
  return { full: `${yyyy}.${mm}.${dd}`, weekday: wk, date: d };
}

// ── Unified Game Clock ──
// Maps slotsUsed (0/1/2/done) to a game-hour range that advances in real time
// Base hours per slot: morning=08:00-11:59, afternoon=12:00-16:59, evening=17:00-22:00
const SLOT_HOUR_BASE = [8, 12, 17, 22];
const SLOT_HOUR_END  = [12, 17, 22, 24];

function getGameTime() {
  const slot = Math.min(G.slotsUsed, 2);
  const baseH = SLOT_HOUR_BASE[slot];
  const endH  = SLOT_HOUR_END[slot];
  // Within the slot, advance based on real minutes elapsed since slot started
  const realNow = new Date();
  const minSinceEpoch = realNow.getHours() * 60 + realNow.getMinutes();
  // Map real minutes within a 4-hour window to game time window
  const slotRealMins = 240; // treat each slot as ~4 real hours long for mapping
  const fraction = (minSinceEpoch % slotRealMins) / slotRealMins;
  const gameMinutes = Math.floor(fraction * (endH - baseH) * 60);
  const gh = baseH + Math.floor(gameMinutes / 60);
  const gm = gameMinutes % 60;
  return `${String(gh).padStart(2,'0')}:${String(gm).padStart(2,'0')}`;
}

function getSlotLabel() {
  if (G.slotsUsed === 0) return '早班';
  if (G.slotsUsed === 1) return '午班';
  if (G.slotsUsed === 2) return '晚班';
  return '下班后';
}

function startClock() {
  updateClock();
  setInterval(updateClock, 15000);
}
function updateClock() {
  const gd = getGameDate();
  const gt = getGameTime();
  const slotLabel = getSlotLabel();
  // Top bar: date + game time
  document.getElementById('tb-date').textContent = `${gd.full} ${gt}`;
  // Phone notch: same game time (not real time)
  document.getElementById('phone-time').textContent = gt;
  // Scene header sub: include time
  const shSub = document.getElementById('sh-sub');
  if (shSub && !shSub.dataset.locked) {
    // Only update if not manually overridden
  }
  // Slot display: show slot label + remaining
  updateSlotDisplay();
}
function updateTopBar() {
  // Only randomise if weather not already set for today
  if (!G.weather || !G.weatherIcon) {
    const w = WEATHERS[Math.floor(Math.random()*WEATHERS.length)];
    G.weather = w.text;
    G.weatherIcon = w.icon;
  }
  document.getElementById('tb-weather').textContent = `${G.weatherIcon} ${G.weather}`;
}
