/* ============================================================
   SHUAMONE 耍门 · 贡献榜（本地 · 零后端 · 设计原则见 docs/LEADERBOARD-DESIGN.md）
   · 贡献值 = 两游戏真实成就折算（答题/净化/连胜/成就/通关）
   · 不给玩家显示名次数字，只显示「点亮第 N 层」+ 超过比例（保护积极性）
   · 示范塔友（种子账号）为虚构人物，用于冷启动氛围
   · 档案号（TA-XXXX）= 本地身份，跨设备靠存档码（界间护照）
   ============================================================ */
window.LEADERBOARD = (function () {
  'use strict';

  var PID_KEY = 'novaAcademy.pid';

  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }

  /* ---- 档案号：首次生成，永久保存在本地 ---- */
  function pid() {
    try {
      var p = localStorage.getItem(PID_KEY);
      if (p) return p;
      var A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', s = 'TA-';
      for (var i = 0; i < 4; i++) s += A[Math.floor(Math.random() * 31)];
      localStorage.setItem(PID_KEY, s);
      return s;
    } catch (e) { return 'TA-????'; }
  }

  /* ---- 贡献值：两游戏折算（只读存档，幂等） ---- */
  function contribution() {
    var parts = [];
    var tw = readJSON('conceptTower.v1');
    var rpg = readJSON('aiProductRpg.v1');
    var c = 0;
    if (tw) {
      var life = Math.floor((tw.lifetime || 0) / 10);            // 塔积分
      var fl = (tw.floors || 0) * 2;                              // 爬过的层数
      var st = ((tw.daily && tw.daily.streak) || 0) * 15;         // 每日连胜
      var achT = Object.keys(tw.ach || {}).length * 40;           // 塔成就
      if (life) parts.push('塔积分 ' + life);
      if (fl) parts.push('登塔 ' + fl);
      if (st) parts.push('连胜 ' + st);
      if (achT) parts.push('成就 ' + achT);
      c += life + fl + st + achT;
    }
    if (rpg) {
      var xp = Math.floor((rpg.xp || 0) / 8);                     // RPG 经验
      var achR = Object.keys(rpg.ach || {}).length * 40;
      var fin = rpg.finished ? 60 : 0;
      if (xp) parts.push('历练 ' + xp);
      if (achR) parts.push('成就 ' + achR);
      if (fin) parts.push('通关 ' + fin);
      c += xp + achR + fin;
    }
    return { total: c, parts: parts };
  }

  /* ---- 层级（贡献 → 点亮第几层塔） ---- */
  var TIERS = [0, 40, 100, 200, 350, 550, 800, 1150, 1600, 2200, 3000];
  function tierOf(v) {
    var n = 1;
    for (var i = 0; i < TIERS.length; i++) if (v >= TIERS[i]) n = i + 1;
    return n; // 1..11
  }
  var TIER_NAME = { 1: '火种', 2: '烛光', 3: '萤火', 4: '提灯', 5: '灯台', 6: '灯塔', 7: '灯塔', 8: '星辰', 9: '星辰', 10: '执灯者', 11: '执灯者' };

  /* ---- 示范塔友（虚构种子 · 冷启动氛围 · 数值错落） ---- */
  var SEEDS = [
    { n: '执灯的Leona', v: 890,  note: '已净化 14 道暗影' },
    { n: '27届转码Product', v: 612, note: '字节塔登顶 ×3' },
    { n: '鹅厂预备役Kira', v: 528, note: '每日挑战 5 连胜' },
    { n: '面到第9面的Allen', v: 431, note: '六厂实战全解锁' },
    { n: '深夜刷塔的猫', v: 316, note: '错题本清零达成' },
    { n: '双休日爬塔人', v: 242, note: '术语塔 94/112' },
    { n: '秋招冲刺ing', v: 158, note: 'RPG 通关 · 稳健派' },
    { n: '刚入职的新雀', v: 84, note: '爬到第 8 层' },
    { n: '第3层的见习生', v: 36, note: '今天刚入塔' }
  ];

  function pctAbove(v) {
    var below = SEEDS.filter(function (s) { return s.v < v; }).length;
    return Math.round((below / (SEEDS.length + 1)) * 100);
  }

  /* ---- 渲染 ---- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function render() {
    var me = contribution();
    var myTier = tierOf(me.total);
    var rows = SEEDS.map(function (s) {
      var t = tierOf(s.v);
      return '<div class="lb-row">' +
        '<span class="lb-name">' + esc(s.n) + '</span>' +
        '<span class="lb-tier t' + Math.min(t, 10) + '">第 ' + t + ' 层 · ' + (TIER_NAME[t] || '灯塔') + '</span>' +
        '<span class="lb-val">' + s.v + '</span></div>' +
        '<div class="lb-note">' + esc(s.note) + '</div>';
    }).join('');
    var ybAv = '', ybNick = '', luck = '';
    try {
      if (window.FEEDBACK) { ybAv = FEEDBACK.meAvatar(); ybNick = FEEDBACK.nick(); }
      if (window.TIP && TIP.luckOn()) luck = ' <span title="今日好运加持 · 来自你的彩头">🍀</span>';
    } catch (e) {}
    return '<div class="lb-me">' +
      '<div class="lb-pid">' +
      (ybAv ? '<span style="display:inline-block;width:26px;height:26px;border-radius:50%;overflow:hidden;vertical-align:-8px;margin-right:7px;box-shadow:0 0 0 1.5px #26324a">' + ybAv + '</span>' : '') +
      (ybNick ? '<b style="margin-right:7px">' + esc(ybNick) + '</b>' : '') +
      '档案号 <b>' + esc(pid()) + '</b>' + luck + ' · 贡献 <b>' + me.total + '</b></div>' +
      '<div class="lb-tower">你的贡献点亮了 <b>第 ' + myTier + ' 层</b> 塔 · ' + (TIER_NAME[myTier] || '灯塔') + ' · 超过 <b>' + pctAbove(me.total) + '%</b> 的塔友</div>' +
      (me.parts.length ? '<div class="lb-parts">构成：' + me.parts.join(' + ') + '</div>' : '<div class="lb-parts">开始答题，点亮你的第一缕火种。</div>') +
      '</div>' +
      '<div class="lb-head">▸ 塔友动向 · COMMUNITY</div>' + rows +
      '<div class="lb-foot">贡献值来自你本地的真实战绩（两游戏合并计算）· 示范塔友为虚构 · 未来接入真实同步后替换</div>';
  }

  return { render: render, contribution: contribution, tierOf: tierOf, pid: pid, seeds: SEEDS, TIERS: TIERS };
})();
