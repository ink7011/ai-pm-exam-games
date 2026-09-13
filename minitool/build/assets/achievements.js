/* ============================================================
   SHUAMONE 耍门 · 成就系统 ACHS（RPG / 试炼塔共用，纯本地）
   · ACH 定义数组（跨游戏成就两边渲染时互读对方 localStorage）
   · ACHS.init({side, get, persist, toast}) 各游戏启动时注入自己的存档
   · ACHS.unlock(id) 去重 + toast 庆祝 + 写档（幂等）
   · ACHS.render(el) 成就墙：已解锁亮色 + 日期，未解锁灰色剪影 + 提示
   存储位置：各游戏自己的存档里（S.ach / P.ach，{id: 时间戳}）
   ============================================================ */
window.ACHS = (function () {
  'use strict';

  /* ---------------- 定义（id 必须全局唯一，smoke 会断言） ---------------- */
  var ACH = [
    /* —— RPG 侧 —— */
    { id: 'rpg_join',        icon: '📋', name: '入职 NOVA·AI',   tip: '在 RPG 输入名字、点击「入职」' },
    { id: 'rpg_first_clean', icon: '🧪', name: '首章零失误',     tip: '第一个 Case 全部首答命中（奖励药剂的那种完美）' },
    { id: 'rpg_three_clean', icon: '🎯', name: '三连零失误',     tip: '连续 3 章每题首答命中', prog: function (c) { return { cur: Math.min(3, (c.rpg && c.rpg.cleanStreak) || 0), max: 3 }; } },
    { id: 'rpg_finish',      icon: '🎓', name: '转正 · AI PM',   tip: '完成 Season 1 季终复盘会' },
    { id: 'rpg_chosen',      icon: '👑', name: '天选之人',       tip: '以 S 级「天选之人」评价通关' },
    { id: 'rpg_lantern',     icon: '🏮', name: '暗夜执灯',       tip: '答过错、且全部错题回炉完毕——没有欠账' },
    { id: 'rpg_vine',        icon: '✨', name: '星语藤发芽',     tip: '通关 Season 1 后，星语藤在你的窗台苏醒' },
    /* —— 试炼塔侧 —— */
    { id: 'tw_first_purify', icon: '🕯️', name: '首净化暗影',    tip: '同一道错题连续答对 2 次，净化你的第一道暗影' },
    { id: 'tw_combo10',      icon: '⚡', name: '十连击',         tip: '单局连击达到 10' },
    { id: 'tw_company_first',icon: '🏢', name: '首通大厂塔',     tip: '登顶腾讯 / 滴滴 / 美团任一模式塔' },
    { id: 'tw_company_all',  icon: '🏭', name: '三厂通吃',       tip: '腾讯、滴滴、美团三座大厂塔全部登顶' },
    { id: 'tw_perfect',      icon: '💯', name: '单局满分',       tip: '一局 15 层首答全对并登顶' },
    { id: 'tw_shadow_zero',  icon: '🌅', name: '暗影清零',       tip: '错题本里所有暗影净化完毕（至少捕获过一道）' },
    { id: 'tw_floors100',    icon: '🪜', name: '爬满 100 层',    tip: '累计爬塔层数达到 100', prog: function (c) { return { cur: Math.min(100, (c.tw && c.tw.floors) || 0), max: 100 }; } },
    { id: 'tw_codex_half',   icon: '📖', name: '图鉴过半',       tip: '概念图鉴收录超过题库一半', prog: function (c) {
        var D = window.DECK; var total = D && D.items ? D.items.length : 0;
        if (!total) return null;
        var got = c.tw && c.tw.codex ? Object.keys(c.tw.codex).length : 0;
        return { cur: Math.min(got, total), max: Math.ceil(total / 2) };
      } },
    { id: 'tw_daily_7',      icon: '📅', name: '七日之约',       tip: '每日挑战连续 7 天有成绩', prog: function (c) { return { cur: Math.min(7, (c.tw && c.tw.daily && c.tw.daily.streak) || 0), max: 7 }; } },
    /* —— 跨游戏 —— */
    { id: 'x_dual_clear',    icon: '🔭', name: '双修 · 毕业生',  tip: 'RPG 通关 Season 1，且试炼塔登顶过任意一座塔' },
    { id: 'x_dual_elite',    icon: '🌌', name: '双修 · 卓越',    tip: 'RPG 评级 A/S，且试炼塔段位达 AI Product Manager（3000 分）' }
  ];
  var defs = {};
  ACH.forEach(function (a) { defs[a.id] = a; });

  /* ---------------- 注入（各游戏启动时） ---------------- */
  var side = null, getHolder = null, persist = null, toastFn = null;
  function init(cfg) {
    side = (cfg && cfg.side) || null;
    getHolder = cfg && cfg.get;
    persist = cfg && cfg.persist;
    toastFn = cfg && cfg.toast;
  }

  function readRpg() { try { return JSON.parse(localStorage.getItem('aiProductRpg.v1') || 'null'); } catch (e) { return null; } }
  function readTower() { try { return JSON.parse(localStorage.getItem('conceptTower.v1') || 'null'); } catch (e) { return null; } }

  /* ---------------- 解锁（幂等） ---------------- */
  function unlock(id) {
    if (!side || !defs[id]) return false;
    var holder = getHolder ? getHolder() : null;
    if (!holder) return false;
    if (!holder.ach || typeof holder.ach !== 'object') holder.ach = {};
    if (holder.ach[id]) return false;                      // 去重
    holder.ach[id] = Date.now();
    try { if (persist) persist(); } catch (e) {}
    if (toastFn) toastFn('🏆 成就解锁 · ' + defs[id].icon + ' ' + defs[id].name, 'gold');
    return true;
  }
  function has(id) {
    var holder = getHolder ? getHolder() : null;
    return !!(holder && holder.ach && holder.ach[id]);
  }

  /* ---------------- 成就墙渲染 ---------------- */
  function fmtDate(ts) {
    var d = new Date(ts || 0);
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
  }
  function mergedAch() {
    var mine = (getHolder ? getHolder() : null) || {};
    var other = side === 'rpg' ? (readTower() || {}) : (readRpg() || {});
    var out = {};
    Object.keys(mine.ach || {}).forEach(function (k) { out[k] = mine.ach[k]; });
    Object.keys(other.ach || {}).forEach(function (k) { if (!out[k]) out[k] = other.ach[k]; }); // 跨游戏互读
    return out;
  }
  function render(target) {
    if (!target) return '';
    var got = mergedAch();
    var ctx = { rpg: readRpg(), tw: readTower() };
    var n = 0;
    var cards = ACH.map(function (a) {
      var ts = got[a.id] || 0;
      var on = !!ts;
      if (on) n++;
      var prog = null;
      if (!on && a.prog) { try { prog = a.prog(ctx); } catch (e) { prog = null; } }
      var foot = on
        ? '<div style="color:var(--green);font-size:11px;font-family:var(--mono)">✓ ' + fmtDate(ts) + ' 解锁</div>'
        : '<div style="color:var(--dim);font-size:11.5px">' + a.tip + '</div>' +
          (prog ? '<div style="margin-top:5px;height:3px;border-radius:2px;background:#1e2836;overflow:hidden"><i style="display:block;height:100%;width:' +
            Math.min(100, Math.round((prog.cur / (prog.max || 1)) * 100)) + '%;background:var(--cyan)"></i></div>' +
            '<div style="color:var(--dim);font-size:10.5px;font-family:var(--mono);margin-top:2px">' + prog.cur + ' / ' + prog.max + '</div>' : '');
      return '<div style="display:flex;align-items:flex-start;border:1px solid ' + (on ? 'var(--line)' : '#141b28') +
        ';border-radius:10px;padding:10px 12px;' + (on ? 'background:linear-gradient(135deg,rgba(34,211,238,.06),transparent)' : 'opacity:.55') + '">' +
        '<div style="font-size:22px;line-height:1.2;margin-right:10px;filter:' + (on ? 'none' : 'grayscale(1)') + '">' + (on ? a.icon : '🔒') + '</div>' +
        '<div style="flex:1"><div style="font-weight:700;font-size:13px">' + a.name + '</div>' + foot + '</div></div>';
    }).join('');
    var head = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<span style="font-family:var(--mono);font-size:12px;color:var(--dim)">已解锁 ' + n + ' / ' + ACH.length + '</span>' +
      '<span style="font-size:11px;color:var(--dim)">两游戏成就互通 · 存档码会一并打包</span></div>';
    var html = head + '<div style="display:grid;grid-template-columns:1fr;grid-gap:8px;max-height:56vh;overflow:auto;padding-right:4px">' + cards + '</div>';
    target.innerHTML = html;
    return html;
  }
  function modalBody() { return '<div id="achWall"></div>'; }
  function renderIntoWall() { var w = document.getElementById('achWall'); if (w) render(w); }

  return {
    ACH: ACH, defs: defs,
    init: init, unlock: unlock, has: has,
    render: render, modalBody: modalBody, renderIntoWall: renderIntoWall
  };
})();
