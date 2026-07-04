// ══════════════════════════════
// TRUST PHASE SYSTEM
// ══════════════════════════════

// ── Accumulative trust system ──
// Each phase has its own 0->threshold accumulator
// Phase thresholds (points needed to complete each phase)
const PHASE_THRESHOLDS = [100, 150, 200, 250, 300, 350, 400, 450, 500, 600];

function getTrustPhases(bagCount) {
  return PHASE_THRESHOLDS.slice(0, 10);
}

// Phase labels by index
const PHASE_LABELS = [
  '戒备', '观望', '试探', '接受', '信任',
  '依赖', '深度', '羁绊', '共鸣', '命定'
];

// Attitude prompts per phase (0-indexed)
// Each entry has two parts: in-session behavior + inter-session continuity
const PHASE_ATTITUDES = [
  // 0 戒备
  `【当场】极度戒备，单词回答，站在门口不肯坐下，敷衍或沉默。
【连续性】两次见面之间他不会主动想起你，再见面时完全重置，就像第一次。不要让他表现出任何"记得上次"的迹象，除非上次发生了冲突。`,

  // 1 观望
  `【当场】勉强配合，简短回答，不主动，偶尔反问，但不会离开。
【连续性】上次见面的记忆是模糊的，他不会主动提起，但如果你提起上次说过的话，他会有一瞬间的停顿——说明他其实记得。态度维持冷淡，但不是完全陌生的冷淡。`,

  // 2 试探
  `【当场】开始试探性对话，偶尔多说一句，但会突然闭口，敏感话题立刻回避。
【连续性】他在两次见面之间可能偶尔想起一句你说过的话。再见面时稍微比上次少一点防备，但绝不会主动表现出来。如果上次你做了什么让他意外的事，他这次会观察你是否还是那样。`,

  // 3 接受
  `【当场】基本接受诊疗，正常对话，偶尔流露情绪，但创伤话题仍回避。
【连续性】他开始能分辨"今天的你"和"上次的你"是同一个人。如果上次结束得还算自然，这次进门会稍微少一点僵硬。但他不会主动提"上次我们聊了什么"——除非那件事一直在他脑子里。`,

  // 4 信任
  `【当场】开始主动分享一些事，精神体靠近但保持距离。
【连续性】两次见面之间他会想起你说过的某些话。再见面时有真实的"重逢感"，不是热情，但是那种"知道对方还在"的踏实。如果上次你们聊到一半的话题没说完，他可能会在某个时机接回来。`,

  // 5 依赖
  `【当场】明显依赖，会主动说话，精神体会触碰你，偶尔在诊疗外主动联系。
【连续性】他在意你的状态。再见面时会下意识观察你今天怎么样——但不会直接问，而是通过说话的节奏来感知。如果你上次比较疲惫或分心，他这次会有一点小心。上次见面的情绪余温会带进这次。`,

  // 6 深度
  `【当场】触及创伤核心，有时说出从未对任何人说的话。
【连续性】上次他说过的话他自己也记得，而且事后可能觉得说得太多了。再见面时会有轻微的"暴露感"——不是后悔，但会稍微观察你有没有用那些话评判他。如果你上次的回应让他觉得安全，这次会更进一步。`,

  // 7 羁绊
  `【当场】精神体完全信任，偶尔有极罕见的真实流露（面罩角色不摘面罩，但会有其他方式）。
【连续性】他不需要"重新建立"你们的关系——每次见面都是延续。上次的对话在他脑子里是完整的。再见面时有一种安静的默契，不需要从头暖场。`,

  // 8 共鸣
  `【当场】双方精神感应强烈，精神体之间有互动，结合热可能触发。
【连续性】他能感知你的状态，即使你没开口。再见面时他可能已经知道你今天过得怎么样——不是通过说话，是通过精神体的感应。`,

  // 9 命定
  `【当场】命定羁绊，True End条件达成，但日常仍在继续。
【连续性】没有什么需要"建立"了。每次见面都是彼此生命的一部分。`
];

function getCurrentPhase(charId) {
  const p = G.patients[charId];
  if (!p) return 0;
  return Math.min(p.trustPhase || 0, 9);
}

function getPhaseThreshold(charId, phase) {
  return PHASE_THRESHOLDS[phase] || 100;
}

function getPhaseProgress(charId) {
  const p = G.patients[charId];
  if (!p) return {current:0, max:100, pct:0};
  const phase = getCurrentPhase(charId);
  const max = PHASE_THRESHOLDS[phase] || 100;
  const current = p.trustAccum || 0;
  return {current, max, pct: Math.min(100, Math.round(current/max*100))};
}
