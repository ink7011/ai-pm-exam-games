/* 伴学植物 · 共享核心（读取侧）—— RPG 与试炼塔共用同一本时长账本
   账本：localStorage 'aiProductRpg.time'（累计分钟，RPG 与塔各自计时累加）
   档位与 rpg/js/plant.js 保持一致，调整时两处同步。 */
(function () {
  'use strict';
  var TIME_KEY = 'aiProductRpg.time';
  var VINE_KEY = 'aiProductRpg.vineBorn';
  var STAGES_A = [0, 20, 45, 90, 150, 240, 360, 540]; /* 文竹 1-8 枝 */
  var STAGES_B = [0, 30, 90, 180, 300];               /* 风铃草 1-5 铃 */
  var STAGES_V = [0, 60, 180, 360, 600];              /* 星语藤 1-5 星 */
  var UNLOCK_B = 180;                                 /* 风铃草：累计 3 小时 */

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function loadMin() { return parseFloat(lsGet(TIME_KEY)) || 0; }
  function stageOf(stages, m) {
    var n = 0;
    for (var i = 0; i < stages.length; i++) if (m >= stages[i]) n = i + 1;
    return Math.min(n, stages.length - 1);
  }
  function nextAt(stages, m) {
    var cur = stageOf(stages, m);
    if (cur >= stages.length - 1) return null;
    return stages[cur + 1];
  }
  function humanTime(min) {
    var h = Math.floor(min / 60), m = Math.floor(min % 60);
    return h ? h + ' 小时 ' + m + ' 分钟' : m + ' 分钟';
  }
  function rpgFinished() {
    try { var s = JSON.parse(lsGet('aiProductRpg.v1') || 'null'); return !!(s && s.finished); } catch (e) { return false; }
  }
  /* 汇总：文竹 a/8；风铃草 180 分钟解锁；星语藤通关 RPG 后按 VINE_KEY 起算 */
  function info() {
    var min = loadMin();
    var born = parseFloat(lsGet(VINE_KEY)) || 0;
    var bUnlocked = min >= UNLOCK_B;
    var vUnlocked = rpgFinished();
    return {
      min: min,
      a: stageOf(STAGES_A, min), aMax: STAGES_A.length - 1, aNext: nextAt(STAGES_A, min),
      bUnlocked: bUnlocked, b: bUnlocked ? stageOf(STAGES_B, min - UNLOCK_B) : 0, bMax: STAGES_B.length - 1,
      bNeed: Math.max(0, UNLOCK_B - min),
      vUnlocked: vUnlocked, v: vUnlocked ? stageOf(STAGES_V, min - born) : 0, vMax: STAGES_V.length - 1,
      human: humanTime(min)
    };
  }
  /* 左下角迷你盆栽（塔用）：文竹枝数 = 累计时长，铃/星解锁挂小角标 */
  function miniSvg(info) {
    var n = info.a || 0;
    var spread = [-50, 48, -30, 28, -12, 8, -42, 38];
    var fronds = '';
    for (var i = 0; i < n; i++) {
      var ang = spread[i] * Math.PI / 180;
      var len = 20 + (i % 3) * 5;
      var x2 = 32 + Math.sin(ang) * len;
      var y2 = 40 - Math.cos(ang) * len;
      var cx = 32 + Math.sin(ang) * len * 0.55 + (spread[i] >= 0 ? 4 : -4);
      var cy = 40 - Math.cos(ang) * len * 0.6;
      fronds += '<path d="M32,40 Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + x2.toFixed(1) + ',' + y2.toFixed(1) + '" stroke="' + (i % 2 ? '#6FC0A4' : '#7CB8D4') + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    }
    if (n === 0) fronds = '<circle cx="32" cy="36" r="2.4" fill="#8b9bb4"/>';
    var badges = (info.vUnlocked ? '<text x="50" y="16" font-size="11">⭐</text>' : '') + (info.bUnlocked ? '<text x="10" y="16" font-size="11">🔔</text>' : '');
    return '<svg viewBox="0 0 64 64" width="60" height="60">' +
      badges + fronds +
      '<path d="M20,40 L24,52 Q32,55 40,52 L44,40 Z" fill="#334155" stroke="#475569"/>' +
      '<rect x="19" y="37" width="26" height="4" rx="2" fill="#475569"/>' +
      '</svg>';
  }

  window.PLANTCORE = { loadMin: loadMin, info: info, humanTime: humanTime, miniSvg: miniSvg, TIME_KEY: TIME_KEY };
})();
