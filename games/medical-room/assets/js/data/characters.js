// ══════════════════════════════
// CHARACTERS - 辅助函数
// assets/js/data/characters.js
// 注意：CHAR_DATA 定义在 22-archive-render.js 里
// 本文件只提供辅助查询函数
// ══════════════════════════════

// 获取角色完整数据（从 22-archive-render.js 的 CHAR_DATA 读取）
function getCharData(id) {
  return (typeof CHAR_DATA !== 'undefined' ? CHAR_DATA[id] : null) || null;
}

// 获取角色精神体信息
function getCharSpirit(id) {
  const c = getCharData(id);
  if (!c) return null;
  return { name: c.spirit, desc: c.spiritDesc || '' };
}

// 获取角色精神图景信息
function getCharLandscape(id) {
  const c = getCharData(id);
  if (!c) return null;
  return { name: c.landscape, desc: c.landscapeDesc || '' };
}
