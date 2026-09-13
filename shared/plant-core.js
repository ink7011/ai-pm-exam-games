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
  /* 左下角迷你盆栽（塔用）：文竹枝数 = 累计时长，铃/星解锁挂小角标
     画法：陶盆 + 光晕 + 弧形茎 + 沿茎水滴叶（梦幻浅色系） */
  function miniSvg(info) {
    var n = info.a || 0;
    var spread = [-50, 48, -30, 28, -12, 8, -42, 38];
    var quad = function (a, b, c, t) { return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c; };
    var fronds = '';
    for (var i = 0; i < n; i++) {
      var ang = spread[i] * Math.PI / 180;
      var len = 20 + (i % 3) * 5;
      var x2 = 32 + Math.sin(ang) * len;
      var y2 = 40 - Math.cos(ang) * len;
      var cx = 32 + Math.sin(ang) * len * 0.55 + (spread[i] >= 0 ? 4 : -4);
      var cy = 40 - Math.cos(ang) * len * 0.6;
      var stem = (i % 2 ? '#3E9B7E' : '#4E8FB5');
      var leaf = (i % 2 ? '#6FC0A4' : '#7CB8D4');
      fronds += '<path d="M32,40 Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + x2.toFixed(1) + ',' + y2.toFixed(1) + '" stroke="' + stem + '" stroke-width="1.7" fill="none" stroke-linecap="round"/>';
      /* 沿茎三片水滴叶，随切线方向旋转 */
      for (var t = 0.38; t <= 0.82; t += 0.22) {
        var px = quad(32, cx, x2, t), py = quad(40, cy, y2, t);
        var tx = 2 * (1 - t) * (cx - 32) + 2 * t * (x2 - cx);
        var ty = 2 * (1 - t) * (cy - 40) + 2 * t * (y2 - cy);
        var deg = Math.atan2(ty, tx) * 180 / Math.PI + 90;
        fronds += '<ellipse cx="' + px.toFixed(1) + '" cy="' + (py - 1.6).toFixed(1) + '" rx="1.7" ry="3.1" fill="' + leaf + '" transform="rotate(' + deg.toFixed(0) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1) + ')"/>';
      }
      /* 最高一枝尖端挂金星 */
      if (i === n - 1 && n >= 3) {
        fronds += '<path d="M' + x2.toFixed(1) + ',' + (y2 - 5).toFixed(1) + ' l1,2 2,.3 -1.5,1.4 .4,2 -1.9-1 -1.9,1 .4-2 -1.5-1.4 2-.3 Z" fill="#E0B33C" opacity=".9"/>';
      }
    }
    if (n === 0) {
      fronds = '<path d="M32,40 Q32,37 32,34.5" stroke="#3E9B7E" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        '<ellipse cx="28.8" cy="32" rx="2.6" ry="4.2" fill="#6FC0A4" transform="rotate(-30 28.8 32)"/>' +
        '<ellipse cx="35.2" cy="32" rx="2.6" ry="4.2" fill="#7CB8D4" transform="rotate(30 35.2 32)"/>';
    }
    var badges = (info.vUnlocked ? '<text x="50" y="16" font-size="11">⭐</text>' : '') + (info.bUnlocked ? '<text x="10" y="16" font-size="11">🔔</text>' : '');
    return '<svg viewBox="0 0 64 64" width="60" height="60">' +
      badges +
      '<circle cx="32" cy="28" r="17" fill="rgba(184,216,232,.16)"/>' +
      '<ellipse cx="32" cy="56.5" rx="13" ry="2.4" fill="rgba(148,176,204,.35)"/>' +
      fronds +
      /* 陶盆：梯形圆底 + 高光 + 盆沿 */
      '<path d="M23,41 L25.5,52 Q32,55 38.5,52 L41,41 Z" fill="#E8A87C" stroke="#C9855C" stroke-width="1"/>' +
      '<path d="M25.5,42.5 L27,50" stroke="#F5CDA8" stroke-width="1.6" opacity=".85" fill="none" stroke-linecap="round"/>' +
      '<rect x="21.5" y="37.8" width="21" height="4.6" rx="2.3" fill="#D98E62" stroke="#C9855C" stroke-width="1"/>' +
      '</svg>';
  }

  window.PLANTCORE = { loadMin: loadMin, info: info, humanTime: humanTime, miniSvg: miniSvg, TIME_KEY: TIME_KEY };
})();
