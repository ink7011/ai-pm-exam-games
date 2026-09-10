/* ============================================================
   NOVA 概念试炼塔 — Concept Tower
   Build. Break. Fix. Ship. 的姐妹篇：把概念题变成爬塔。
   ============================================================ */
(function () {
  'use strict';
  const D = window.DECK;
  const SAVE_KEY = 'conceptTower.v1';
  const RUN_LEN = 15, ELITE_FLOORS = [5, 10], BOSS_FLOOR = 15, MAX_HP = 5;

  const ITEMS = [
    { id: 'fifty', name: '50/50', desc: '排除两个错误选项', cost: 30 },
    { id: 'hint', name: '考点提示', desc: '显示本题考点与优先级', cost: 20 },
    { id: 'potion', name: '药水', desc: '恢复 1 点生命（上限 ' + MAX_HP + '）', cost: 45 },
    { id: 'retry', name: '复查券', desc: '答错后免伤重答一次', cost: 35 },
    { id: 'hourglass', name: '沙漏', desc: '精英层限时 +15 秒', cost: 25 }
  ];
  const TOWERS = [
    { id: 'mix', name: '混合乱斗塔', desc: '全部 ' + D.items.length + ' 题 · 每局随机 15 层', mods: null, group: 'basic' },
    { id: 'llm', name: 'LLM 训练塔', desc: '预训练 / SFT / RLHF / DPO / CoT', mods: ['llm'], group: 'basic' },
    { id: 'infer', name: '推理与成本塔', desc: 'KV Cache / 量化 / TTFT / 降本', mods: ['infer'], group: 'basic' },
    { id: 'rag', name: 'RAG 高塔', desc: '检索 / 重排 / 幻觉 / Hybrid', mods: ['rag'], group: 'basic' },
    { id: 'agent', name: 'Agent 堡垒', desc: '工具 / 规划 / 记忆 / MCP', mods: ['agent'], group: 'basic' },
    { id: 'base', name: '地基塔', desc: 'ML / DL / NLP / CV 基础', mods: ['ml', 'dl', 'nlp', 'cv'], group: 'basic' },
    { id: 'rec', name: '推荐广告塔', desc: 'CTR / CVR / MMoE / ESMM', mods: ['rec'], group: 'basic' },
    { id: 'infra', name: 'Infra 塔', desc: 'DP / TP / PP / ZeRO / 显存', mods: ['infra'], group: 'basic' },
    { id: 'evalx', name: '评估塔', desc: '指标 / LLM-as-Judge / Badcase', mods: ['eval'], group: 'basic' },
    { id: 'pob', name: '产品商业塔', desc: '产品 / 运营 / 商业 / 多模态', mods: ['prod', 'ops', 'biz', 'mm'], group: 'basic' },
    { id: 'terms', name: '术语深化塔', desc: 'RPG 术语表 94 词 · 正反双向刷题', mods: ['terms'], group: 'basic' },
    { id: 'meituan', name: '开水团模式塔', desc: '外卖/到店业务实战 A1-A20', mods: ['meituan'], group: 'company', price: 12.9 },
    { id: 'didi', name: '桔厂模式塔', desc: '出行供需 / 安全 / 客服案例', mods: ['didi'], group: 'company', price: 12.9 },
    { id: 'xiaohongshu', name: '薯厂模式塔', desc: '社区 AI · 真实经验 · 独立思考', mods: ['xiaohongshu'], group: 'company', price: 12.9 },
    { id: 'tencent', name: '鹅厂模式塔', desc: '素质测评风格 · 社交AI生态实战', mods: ['tencent'], group: 'company', price: 19.9 },
    { id: 'alibaba', name: '猫厂模式塔', desc: '电商 AI · 导购/搜索 · 价值观情景', mods: ['alibaba'], group: 'company', price: 19.9 },
    { id: 'bytedance', name: '宇宙厂模式塔', desc: '数据驱动 · 对话AI/低代码/实验文化', mods: ['bytedance'], group: 'company', price: 19.9 }
  ];
  const RANKS = [[0, '见习生'], [1000, 'Product Associate'], [3000, 'AI Product Manager'], [7000, 'Senior AI PM'], [15000, 'Head of AI Product']];

  /* ---------------- persistent ---------------- */
  let P = loadP();
  if (!P.paid) P.paid = {};   // 付费解锁 {towerId: 1}
  function freshP() {
    return { v: 2, lifetime: 0, best: {}, clear: {}, codex: {}, wrong: {}, modStats: {}, sound: true, ach: {}, daily: {}, floors: 0 };
  }
  // T6：v1 → v2 迁移（本轮为空实现 + 默认字段占位；后续结构变更在此追加）
  function migrateTower(p) {
    if (!p) return p;
    if (!p.v || p.v < 2) p.v = 2;
    if (!p.ach) p.ach = {};        // P2-1 成就 {id: 时间戳}
    if (!p.clear) p.clear = {};    // P2-1 登顶记录 {towerId: true}
    if (typeof p.floors !== 'number') p.floors = 0;  // P2-1 累计爬塔层数
    if (!p.daily) p.daily = {};    // P2-2 每日挑战 {date, best, streak}
    if (!p.wrong) p.wrong = {};
    if (!p.modStats) p.modStats = {};
    if (!p.best) p.best = {};
    if (!p.codex) p.codex = {};
    return p;
  }
  function loadP() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) { const p = JSON.parse(raw); if (p && p.codex) return migrateTower(Object.assign(freshP(), p)); }
    } catch (e) {}
    return freshP();
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(P)); } catch (e) {} }

  /* ---------------- run state ---------------- */
  let R = null;       // {towerId, hp, coins, combo, maxCombo, items, pos, slots, pendingShadow, score, firstTry, asked, modRun:{}, resolvedThisRun:{}}
  let cur = null;     // 当前 encounter {item, kind, floorLabel, answered, usedRetry, hintOn, timeLeft, timerId, deadline}
  let soundOn = P.sound !== false;

  const $ = (id) => document.getElementById(id);
  const H = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html !== undefined) el.innerHTML = html; return el; };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function beep(freq, dur) {
    if (!soundOn) return;
    try {
      const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq; o.type = 'sine';
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.12));
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + (dur || 0.12));
    } catch (e) {}
  }
  function toast(msg, cls) {
    const t = H('div', 'toast ' + (cls || ''), esc(msg));
    $('toastRoot').appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2400);
    setTimeout(() => t.remove(), 2900);
  }
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const item = (id) => D.items.find(x => x.id === id);

  /* ---------- 成就（P2-1） ---------- */
  function ach(id) { if (window.ACHS) window.ACHS.unlock(id); }
  function rpgSaveRead() { try { return JSON.parse(localStorage.getItem('aiProductRpg.v1') || 'null'); } catch (e) { return null; } }
  function achCodexHalf() {
    if (!window.ACHS || !D.items.length) return;
    if (Object.keys(P.codex).length >= Math.ceil(D.items.length / 2)) ach('tw_codex_half');
  }
  function achDual() {
    // 跨游戏成就：塔侧条件成立后读 RPG 存档判断另一侧
    const rs = rpgSaveRead();
    if (rs && rs.finished && Object.keys(P.clear || {}).length > 0) ach('x_dual_clear');
    if ((P.lifetime || 0) >= 3000 && rs && (rs.finalGrade === 'S' || rs.finalGrade === 'A')) ach('x_dual_elite');
  }
  const COMPANY_IDS = ['meituan', 'tencent', 'didi'];

  /* ---------------- deck / queue ---------------- */
  function poolOf(tower) {
    return tower.mods ? D.items.filter(x => tower.mods.includes(x.mod)) : D.items.slice();
  }
  function buildRun(tower) {
    const pool = poolOf(tower);
    const bosses = pool.filter(x => x.boss);
    const normals = pool.filter(x => !x.boss);
    const bossPool = bosses.length ? bosses : normals.filter(x => x.diff >= 3);
    // 塔长适配题池：小题池塔自动缩短（boss 占最后一层）
    const runLen = Math.min(RUN_LEN, Math.max(5, normals.length + 1));
    const elites = ELITE_FLOORS.filter(f => f < runLen - 1 && f % 5 === 0);
    // 难度曲线：抽中后按难度升序排层（shuffle 已打散同难度内部顺序）
    const pick = shuffle(normals).slice(0, runLen - 1).sort((a, b) => (a.diff || 1) - (b.diff || 1));
    const slots = pick.map((it, i) => {
      const fl = i + 1;
      return { item: it, kind: elites.includes(fl) ? 'elite' : 'normal', floor: fl };
    });
    const bossIt = bossPool.length ? shuffle(bossPool)[0] : shuffle(normals)[0];
    slots.push({ item: bossIt, kind: 'boss', floor: slots.length + 1 });
    // 暗影种子：跨局错题（限本塔题池）最多 2 个提前进塔
    const pending = [];
    Object.keys(P.wrong).filter(id => {
      const it = item(id);
      return it && pool.includes(it) && !P.wrong[id].cleared;
    }).slice(0, 2).forEach((id, i) => pending.push({ id: id, at: 1 + i * 2 }));
    return { slots: slots, pending: pending };
  }

  /* ---------------- 每日挑战（P2-2） ---------------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashDate(dateStr) {           // 'YYYYMMDD' → 32 位种子
    let h = 2166136261;
    for (let i = 0; i < String(dateStr).length; i++) {
      h ^= String(dateStr).charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function todayStr(d) {
    d = d || new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  }
  /* 店主配置：爱发电/面包多商品页链接（留空=仅扫码人工发码）
     BUY_URLS 按塔填各自商品页；没填的塔回退到 BUY_URL */
  const BUY_URL = 'https://afdian.com/a/nova-games';
  const BUY_URLS = {
    meituan: 'https://afdian.com/item/12d884feab6b11f1a21c5254001e7c00',
    didi: 'https://afdian.com/item/324b8a20ab6b11f1b01052540025c377',
    xiaohongshu: 'https://afdian.com/item/407155a8ab6b11f1b1b952540025c377',
    tencent: 'https://afdian.com/item/4e0fee4aab6b11f19ba852540025c377',
    alibaba: 'https://afdian.com/item/5b50b5daab6b11f1944f52540025c377',
    bytedance: 'https://afdian.com/item/6846b3caab6b11f184555254001e7c00'
  };

  /* ---------------- 付费解锁（兑换码制 · 零后端） ---------------- */
  function codeHash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  /* 进阶内容解锁：哈希校验（仓库只含 100 个码的散列）+ 码即钥匙解密 */
  function paidData(t) { return (window.PAID_DECK || {})[t.id] || null; }
  function checkCode(t, code) {
    var pd = paidData(t), PC = window.PAIDCRYPTO;
    if (!pd || !PC) return false;
    code = String(code || '').trim().toUpperCase();
    if (code.indexOf('NOVA-') !== 0) return false;
    return pd.h.indexOf(PC.fnv1a(code)) >= 0;
  }
  function loadPaidCaches() {
    Object.keys(P.paid || {}).forEach(id => {
      if (!P.paid[id] || D.items.some(i => i.mod === id)) return;
      try {
        const cached = JSON.parse(localStorage.getItem('paidDeck.' + id) || 'null');
        if (cached && cached.items) cached.items.forEach(function (q) { D.items.push(q); });
      } catch (e) {}
    });
  }
  function unlockPaid(t, code) {
    var pd = paidData(t), PC = window.PAIDCRYPTO;
    if (!pd || !PC) return false;
    var idx = pd.h.indexOf(PC.fnv1a(code));
    if (idx < 0) return false;
    try {
      var key = PC.unwrapKey(code, pd.salt, pd.w[idx]);
      var deck = PC.decryptDeck(key, pd.d);
      localStorage.setItem('paidDeck.' + t.id, JSON.stringify({ items: deck.items }));
      deck.items.forEach(function (q) { D.items.push(q); }); /* push 保引用 */
      return true;
    } catch (e) { return false; }
  }
  function towerLocked(t) { return !!(t && t.group === 'company' && t.price && !P.paid[t.id]); }
  function paywallModal(t) {
    const pd = paidData(t);
    const n = P.paid[t.id] ? poolOf(t).length : (pd ? pd.q : poolOf(t).length);
    const buyUrl = BUY_URLS[t.id] || BUY_URL;
    const html =
      '<div class="paywall">' +
      '<div class="pw-head">🏢 ' + esc(t.name) + '</div>' +
      '<div class="pw-desc">' + esc(t.desc) + ' · ' + n + ' 题（含压轴 Boss）· 每题带解析 · 暗影复仇适用</div>' +
      '<div class="pw-price">解锁价 <b>¥' + t.price + '</b> <span>· 一次解锁，永久有效，跟随存档码走</span></div>' +
      (buyUrl
        ? '<a class="pw-buy" href="' + buyUrl + '" target="_blank" rel="noopener">🛒 去平台购买 · 付款自动发码，秒到账</a>' +
          '<div class="pw-qr-note">购买页支持微信 / 支付宝付款，完成后把收到的兑换码（NOVA-XXXXXX）填到下面即可</div>'
        : '') +
      '<input id="codeInput" placeholder="输入兑换码（如 NOVA-XXXXXX）" autocomplete="off">' +
      '<button class="pw-btn" id="applyCode">🔓 验证并解锁</button>' +
      '<div class="pw-tip">兑换码一次解锁永久有效，跟随存档码跨设备<br>本塔为原创模拟题：考点整理自公开渠道（面经/官方JD/报道），无内部资料；「鹅厂/猫厂/宇宙厂/开水团/桔厂/薯厂」为社区外号，仅示考点风格，与对应公司无关联</div>' +
      '</div>';
    openModal('大厂实战塔 · 解锁', html, '兑换码与本地存档绑定；更换设备请用存档码迁移。');
    const btn = $('applyCode');
    if (btn) btn.onclick = () => {
      const v = String($('codeInput').value || '').trim().toUpperCase();
      if (checkCode(t, v) && unlockPaid(t, v)) {
        P.paid[t.id] = 1; save();
        $('modalRoot').innerHTML = '';
        toast('🔓 已解锁「' + t.name + '」', 'gold');
        beep(784, 0.1); setTimeout(() => beep(1046, 0.14), 120);
        renderSelect();
      } else { toast('兑换码无效，请检查大小写与连字符', 'err'); }
    };
  }
  function seededShuffle(arr, rng) {
    const r = arr.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }
  // 混合池固定 10 层（第 5 层精英、第 10 层 boss）；深拷贝题池避免污染原题对象
  function buildDaily(dateStr) {
    const ds = String(dateStr || todayStr());
    const rng = mulberry32(hashDate(ds));
    const pool = D.items.map(x => Object.assign({}, x, { opts: x.opts.slice() }));
    const normals = pool.filter(x => !x.boss);
    const bosses = pool.filter(x => x.boss);
    const pick = seededShuffle(normals, rng).slice(0, 9);
    const boss = bosses.length ? bosses[Math.floor(rng() * bosses.length)] : pick[pick.length - 1];
    const slots = pick.map((it, i) => ({
      item: it, kind: i === 4 ? 'elite' : 'normal', floor: i + 1
    }));
    slots.push({ item: boss, kind: 'boss', floor: 10 });
    return { slots: slots, pending: [], date: ds };
  }
  function dailyInfo() {
    const t = todayStr();
    return (P.daily && P.daily.date === t) ? P.daily : null;
  }
  function startDaily() {
    const built = buildDaily();
    const info = dailyInfo();
    R = {
      towerId: 'daily', daily: built.date,
      practice: !!(info && info.done),   // 今日已计入成绩后再刷 = 练习
      hp: 1, maxHp: 1, coins: 0, combo: 0, maxCombo: 0,
      items: { fifty: 0, hint: 0, potion: 0, retry: 0, hourglass: 0 },
      pos: 0, slots: built.slots, pendingShadow: [],
      score: 0, firstTry: 0, asked: 0, modRun: {}, done: false
    };
    renderPlayer(); renderFloors();
    serveNext();
  }
  function settleDaily() {               // 每日成绩：每天首次登顶计入，之后为练习
    const t = todayStr();
    const info = dailyInfo();
    if (R.practice || R.hp <= 0) return;                 // 练习 / 失败不计
    if (info && info.done) return;                       // 双保险
    const y = todayStr(new Date(Date.now() - 86400000));
    const streak = (P.daily && P.daily.date === y) ? (P.daily.streak || 0) + 1 : 1;
    P.daily = { date: t, best: R.score, streak: streak, done: true };
    if (streak >= 7) ach('tw_daily_7');                  // P2-1：每日挑战 7 连胜
    save();
  }

  /* ---------------- panels ---------------- */
  function rankInfo() {
    let cur = RANKS[0], next = null;
    for (let i = 0; i < RANKS.length; i++) {
      if (P.lifetime >= RANKS[i][0]) cur = RANKS[i];
      else { next = RANKS[i]; break; }
    }
    return { cur, next };
  }
  function renderTop() {
    const r = rankInfo();
    $('subrank').textContent = '段位 · ' + r.cur[1] + (r.next ? '（下一阶 ' + r.next[0] + ' 分）' : '（MAX）');
  }
  let lastHud = null; // 上一次 HUD 快照 {hp,coins,score,combo}：动画类只在值变化时添加，避免全量重渲染反复重播
  function renderPlayer() {
    const p = $('playerPanel');
    if (!R) {
      lastHud = null;
      p.innerHTML = '<h3>试炼者</h3><div style="color:var(--dim);font-size:12.5px">选择一座塔开始试炼。<br><br>累计积分：' + P.lifetime + '<br>图鉴收录：' + Object.keys(P.codex).length + ' / ' + D.items.length + '</div>';
      return;
    }
    const prev = lastHud || { hp: -1, coins: -1, score: -1, combo: -1 };
    const hud = { hp: R.hp, coins: R.coins, score: R.score, combo: R.combo };
    const ch = (k) => hud[k] !== prev[k];
    const heartsN = R.maxHp || MAX_HP;   // 每日挑战单心模式
    let hearts = '';
    for (let i = 0; i < heartsN; i++) {
      const on = i < R.hp, wasOn = i < prev.hp;
      const beat = ch('hp') && on !== wasOn;   // 只给刚翻转的红心加动画
      hearts += '<span class="' + (on ? '' : 'lost') + (beat ? ' hbeat' : '') + '">' + (on ? '❤' : '🖤') + '</span>';
    }
    let chips = '';
    ITEMS.forEach(it => {
      const n = R.items[it.id] || 0;
      const dis = !usable(it.id) ? 'disabled' : '';
      chips += '<button class="item-chip" data-item="' + it.id + '" ' + dis + ' title="' + esc(it.desc) + '">' + it.name + '<span class="n">×' + n + '</span></button>';
    });
    p.innerHTML = '<h3>试炼者</h3>' +
      '<div class="hearts">' + hearts + '</div>' +
      '<div class="res-row"><span>金币</span><b class="coins' + (ch('coins') ? ' anim' : '') + '">' + R.coins + '</b></div>' +
      '<div class="res-row"><span>得分</span><b' + (ch('score') ? ' class="anim"' : '') + '>' + R.score + '</b></div>' +
      '<div class="combo-wrap"><span class="combo ' + (R.combo >= 5 ? 'hot' : '') + (ch('combo') ? ' anim' : '') + '">' + (R.combo > 0 ? R.combo + ' 连' : '—') + '</span>' +
      '<span class="combo-hint"> 连击越高 · 金币越丰</span></div>' +
      '<h3 style="margin-top:12px">道具</h3><div class="items">' + chips + '</div>';
    p.querySelectorAll('.item-chip').forEach(b => {
      b.onclick = () => useItem(b.dataset.item);
    });
    lastHud = hud;
  }
  function usable(id) {
    if (!R) return false;
    const n = R.items[id] || 0;
    if (n <= 0) return false;
    if (id === 'potion') return R.hp < MAX_HP; // 任意时刻可喝
    if (id === 'retry') return false;          // 仅答错后经按钮使用
    if (!cur || cur.answered) return false;
    if (id === 'fifty') return true;
    if (id === 'hint') return !cur.hintOn;
    if (id === 'hourglass') return cur.kind === 'elite' && !cur.timeAdded;
    return false;
  }
  function renderFloors() {
    const box = $('floors');
    if (!R) { box.innerHTML = '—'; return; }
    let html = '';
    const total = R.slots.length;
    for (let f = 1; f <= total; f++) {
      const done = R.pos >= f;
      const now = R.pos === f - 1 && !R.done;
      const isBoss = f === total;
      const cls = 'flr' + (done ? ' done' : '') + (now ? ' now cur' : '') +
        (ELITE_FLOORS.includes(f) && !isBoss ? ' elite' : '') + (isBoss ? ' boss' : '');
      const icon = isBoss ? '☠' : (ELITE_FLOORS.includes(f) ? '⚡' : f);
      html += '<div class="' + cls + '"><span class="dot">' + icon + '</span><span>第 ' + f + ' 层' +
        (isBoss ? ' · BOSS' : (ELITE_FLOORS.includes(f) ? ' · 精英' : '')) + '</span></div>';
    }
    const shadowN = R.pendingShadow.length;
    html += '<div class="shadow-note">' + (shadowN ? '⚠ ' + shadowN + ' 道暗影正在接近…' : '塔内暂无暗影') + '</div>';
    box.innerHTML = html;
  }

  /* ---------------- screens ---------------- */
  function setPhase(x) { window.__phase = x; }
  function renderTitle() {
    setPhase('title');
    R = null; renderPlayer(); renderFloors();
    const box = H('div', 'titlebox');
    box.innerHTML =
      '<div style="font-family:var(--mono);font-size:11px;letter-spacing:3px;color:var(--dim)">NOVA·学院 // 林博士的训练模拟器 v2.0</div>' +
      '<div class="biglogo">概念<b>试炼塔</b></div>' +
      '<div class="tagline">CONCEPT TOWER — ' + D.items.length + ' 道真题概念 · 15 层 · 3 颗心 · 暗影复仇</div>' +
      '<div style="color:var(--dim);font-size:13px;line-height:1.9;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 18px;margin:0 0 18px">' +
      '林博士：RPG 教你判断，塔教你记忆。<br>' +
      '· 每层一道概念题：答对通关，答错掉血<br>' +
      '· <b style="color:var(--violet)">⚡精英层</b>限时作答，双倍奖励 · <b style="color:var(--amber)">☠BOSS层</b>是真题级场景题<br>' +
      '· 答错的题化为<b style="color:var(--red)">暗影</b>回塔复仇——连续两次答对才算净化（跨局生效）<br>' +
      '· 金币买道具：50/50、考点提示、复查券、药水、沙漏<br>' +
      '· 积分累计升段位：见习生 → Head of AI Product</div>' +
      '<button class="gobtn" id="goSel">进入选塔 ▸</button>';
    // 每日挑战（P2-2）：标题卡下入口 + 今日战绩
    const dInfo = dailyInfo();
    box.innerHTML +=
      '<div style="margin-top:14px;border:1px dashed var(--violet);border-radius:10px;padding:10px 14px;text-align:left">' +
      '<div style="font-family:var(--mono);font-size:11px;letter-spacing:2px;color:var(--violet);margin-bottom:6px">🎴 DAILY CHALLENGE · 每日挑战</div>' +
      '<div style="font-size:12.5px;color:var(--dim);line-height:1.8">混合池固定 10 层 · 1 颗心 · 无补给站。全世界玩家今天爬的是同一座塔。<br>' +
      (dInfo
        ? '今日最佳 <b style="color:var(--amber)">' + (dInfo.best || 0) + '</b> 分 · 连胜 <b style="color:var(--cyan)">' + (dInfo.streak || 0) + '</b> 天' + (dInfo.done ? '（成绩已计入，再刷为练习）' : '')
        : '今天还没开打 · 每天<b style="color:var(--green)">首次登顶</b>计入成绩，连胜不断则有惊喜') + '</div>' +
      '<button class="retrybtn" id="goDaily" style="margin-top:8px">🎴 进入每日挑战（今日 ' + todayStr().replace(/^(\d{4})(\d{2})(\d{2})$/, '$1/$2/$3') + '）▸</button></div>';
    $('screen').innerHTML = ''; $('screen').appendChild(box);
    $('goSel').onclick = () => { beep(660, 0.08); renderSelect(); };
    $('goDaily').onclick = () => { beep(660, 0.08); startDaily(); };
  }

  function weakTip() {
    const mods = Object.keys(P.modStats).map(m => {
      const s = P.modStats[m];
      const total = s.right + s.wrong;
      return total >= 4 ? { m: m, acc: s.right / total, total: total } : null;
    }).filter(Boolean).sort((a, b) => a.acc - b.acc);
    if (!mods.length) return '';
    const w = mods[0];
    const t = TOWERS.find(t => t.mods && t.mods.length === 1 && t.mods[0] === w.m);
    const name = t ? t.name : '混合乱斗塔';
    return '<div class="weak-tip">🎯 弱点侦察：你最薄弱的模块是 <b>' + esc(name) + '</b>（历史正确率 ' + Math.round(w.acc * 100) + '%，样本 ' + w.total + '）——建议优先攻克。</div>';
  }

  function renderSelect() {
    setPhase('select');
    renderPlayer(); renderFloors();
    const wrap = H('div', 'card');
    wrap.innerHTML = '<div class="titlecard" style="border:1px solid #243048;border-radius:12px;padding:16px 20px;background:linear-gradient(135deg,#0d1524,#0b0f1a)">' +
      '<div style="font-family:var(--mono);color:var(--cyan);font-size:11px;letter-spacing:3px;margin-bottom:6px">TOWER SELECT</div>' +
      '<div style="font-size:19px;font-weight:700">选择试炼塔</div>' + weakTip() + '</div>' +
      '<div class="towergrid" id="tgrid"></div>';
    $('screen').innerHTML = ''; $('screen').appendChild(wrap);
    const grid = wrap.querySelector('#tgrid');
    const groups = [
      { key: 'basic', label: '▸ 基础专项塔 · FOUNDATION', tip: '先在这里把知识打牢' },
      { key: 'company', label: '▸ 大厂实战塔 · COMPANY GAUNTLET', tip: '美团 / 腾讯 / 滴滴风格实战' }
    ];
    groups.forEach(g => {
      const hd = H('div', 'tgroup-h', '<span class="tg-label">' + g.label + '</span><span class="tg-tip">' + g.tip + '</span>');
      hd.style.width = '100%';
      grid.appendChild(hd);
      TOWERS.filter(t => (t.group || 'basic') === g.key).forEach(t => {
        const n = poolOf(t).length;
        const locked = towerLocked(t);
        const b = H('button', 'tower' + (g.key === 'company' ? ' company' : '') + (locked ? ' locked' : ''),
          '<div class="tn">' + esc(t.name) + '</div><div class="td">' + esc(t.desc) + ' · ' + n + ' 题</div>' +
          (locked
            ? '<div class="lock-tag">🔒 解锁 ¥' + t.price + '</div>'
            : (P.best[t.id] ? '<div class="best">最佳：' + P.best[t.id] + ' 分</div>' : '')));
        b.onclick = () => { beep(660, 0.08); startRun(t.id); };
        grid.appendChild(b);
      });
    });
  }

  /* 过场脚本（正典：docs/WORLDVIEW.md §7） */
  const CIN_TOWER_INTRO = [
    { h: '[NOVA 学院]', lines: ['遗忘之潮吞噬世界的方式，不是大火，而是安静。', '被忘记的知识沉入塔底，化为暗影。'] },
    { h: '', lines: ['你的每一次答错，都会喂养你的暗影。', '但规则同样公平——', '连续两次答对，暗影就被净化，化为星光。'] },
    { h: '', lines: ['知识不会遗忘你——直到你掌握它。'] },
    { h: '[试炼塔 · 入塔]', slam: true, lines: [] }
  ];
  const CIN_BOSS_FLOOR = [
    { h: '[BOSS FLOOR]', danger: true, slam: true, lines: ['塔在震动。这一层的暗影格外重。'] }
  ];
  function startRun(towerId) {
    const t = TOWERS.find(x => x.id === towerId);
    if (towerLocked(t)) { paywallModal(t); return; }
    const go = () => startRunNow(towerId);
    let seen = false;
    try { seen = !!localStorage.getItem('novaTower.introSeen'); } catch (e) {}
    if (!seen && window.CINEMA) {
      try { localStorage.setItem('novaTower.introSeen', '1'); } catch (e) {}
      window.CINEMA.play(CIN_TOWER_INTRO).then(go);
    } else go();
  }
  function startRunNow(towerId) {
    const tower = TOWERS.find(t => t.id === towerId);
    const built = buildRun(tower);
    R = {
      towerId: towerId, hp: 3, coins: 20, combo: 0, maxCombo: 0,
      items: { fifty: 1, hint: 1, potion: 0, retry: 0, hourglass: 0 },
      pos: 0, slots: built.slots, pendingShadow: built.pending,
      score: 0, firstTry: 0, asked: 0, modRun: {}, done: false
    };
    renderPlayer(); renderFloors();
    serveNext();
  }

  /* ---------------- encounters ---------------- */
  function serveNext() {
    // 暗影优先
    if (R.pendingShadow.length && R.pendingShadow[0].at <= R.pos + 1 && R.hp > 0 && !R.done) {
      const sh = R.pendingShadow.shift();
      const it = item(sh.id);
      if (it) { renderBattle(it, 'shadow', '暗影 · ' + it.k); return; }
    }
    if (R.hp <= 0 || R.done) { renderResult(); return; }
    if (R.pos >= R.slots.length) { renderResult(); return; }
    const slot = R.slots[R.pos];
    renderBattle(slot.item, slot.kind, '第 ' + slot.floor + ' 层');
  }

  function kindChips(kind) {
    return kind === 'boss' ? '<span class="chip bossc">☠ BOSS</span>'
      : kind === 'elite' ? '<span class="chip elite">⚡ 精英 · 限时</span>'
      : kind === 'shadow' ? '<span class="chip shadow">👁 暗影复仇</span>'
      : '<span class="chip f">概念遭遇</span>';
  }

  function renderBattle(it, kind, floorLabel) {
    setPhase('battle');
    if (kind === 'boss' && window.CINEMA && !R.bossFlash) { R.bossFlash = true; window.CINEMA.play(CIN_BOSS_FLOOR); }
    cur = { item: it, kind: kind, floorLabel: floorLabel, answered: false, usedRetry: false, hintOn: false, timeAdded: false, wrongPicks: [] };
    const isElite = kind === 'elite';
    const battle = H('div', 'card');
    const b = H('div', 'battle ' + (kind === 'boss' ? 'boss' : (isElite ? 'elite' : '')));
    b.id = 'battleCard';
    b.innerHTML =
      (isElite ? '<div class="timerbar" id="tbar"><i style="width:100%"></i></div>' : '') +
      '<div class="b-head">' + kindChips(kind) +
      '<span class="chip">' + esc(it.modName) + '</span>' +
      '<span class="chip">' + '★'.repeat(it.diff || 1) + '</span>' +
      '<span class="chip">P' + (it.pri || 0) + '</span></div>' +
      '<div class="qtext">' + esc(it.q) + '</div>' +
      '<div class="opts" id="opts"></div>' +
      '<div id="hintzone"></div><div id="vzone"></div>';
    battle.appendChild(b);
    $('screen').innerHTML = ''; $('screen').appendChild(battle);
    const opts = b.querySelector('#opts');
    it.opts.forEach((t, i) => {
      const o = H('button', 'opt', '<span class="ol">' + 'ABCD'[i] + '</span><span>' + esc(t) + '</span>');
      o.dataset.i = i;
      o.onclick = () => answer(i);
      opts.appendChild(o);
    });
    renderPlayer(); renderFloors();
    if (isElite) startTimer(25);
    battle.scrollIntoView({ block: 'start' });
  }

  function startTimer(sec) {
    cur.deadline = Date.now() + sec * 1000;
    cur.timerId = setInterval(() => {
      const left = cur.deadline - Date.now();
      const bar = $('tbar');
      if (bar) {
        const pct = Math.max(0, left / (25 * 1000) * 100);
        bar.querySelector('i').style.width = pct + '%';
        bar.classList.toggle('danger', pct < 30);
      }
      if (left <= 0) { clearInterval(cur.timerId); if (!cur.answered) answer(-1); }
    }, 200);
  }

  function useItem(id) {
    if (!R || (R.items[id] || 0) <= 0) return;
    if (id === 'potion') {
      if (R.hp >= MAX_HP) return;
      R.items.potion--; R.hp++; beep(784, 0.1); toast('❤ 药水：生命 +1', 'ok'); renderPlayer(); save(); return;
    }
    if (!cur || cur.answered) return;
    if (id === 'fifty') {
      const wrongIdx = [0, 1, 2, 3].filter(i => i !== cur.item.ans && !cur.wrongPicks.includes(i));
      const zap = shuffle(wrongIdx).slice(0, 2);
      R.items.fifty--;
      document.querySelectorAll('#opts .opt').forEach(el => {
        if (zap.includes(+el.dataset.i)) { el.classList.add('zapped'); el.disabled = true; }
      });
      beep(520, 0.08); toast('⚡ 50/50：已排除 2 个错误选项'); renderPlayer();
    } else if (id === 'hint') {
      if (cur.hintOn) return;
      R.items.hint--; cur.hintOn = true;
      $('hintzone').innerHTML = '<div class="hintline">💡 考点提示：【' + esc(cur.item.k) + '】 · 优先级 P' + (cur.item.pri || 0) + '</div>';
      beep(520, 0.08); renderPlayer();
    } else if (id === 'hourglass') {
      if (cur.kind !== 'elite' || cur.timeAdded) return;
      R.items.hourglass--; cur.timeAdded = true;
      cur.deadline += 15000;
      toast('⏳ 沙漏：限时 +15 秒'); renderPlayer();
    }
  }

  function answer(i) {
    if (!cur || cur.answered) return;
    const it = cur.item;
    if (cur.timerId) { clearInterval(cur.timerId); cur.timerId = null; }
    const optsEls = document.querySelectorAll('#opts .opt');
    const correct = i === it.ans;
    P.codex[it.id] = true;
    achCodexHalf();                                           // P2-1：图鉴过半

    if (correct) {
      cur.answered = true;
      R.asked++;                                  // 只在最终结算时计数一次
      bumpMod(it.mod, cur.wrongPicks.length === 0);
      optsEls.forEach(el => { el.disabled = true; if (+el.dataset.i === it.ans) el.classList.add('right'); });
      $('battleCard').classList.add('slash');
      beep(784, 0.1); setTimeout(() => beep(1046, 0.14), 100);
      if (cur.wrongPicks.length === 0) R.firstTry++;
      R.combo++; R.maxCombo = Math.max(R.maxCombo, R.combo);
      if (R.combo >= 10) ach('tw_combo10');                   // P2-1：十连击
      const mult = cur.kind === 'elite' ? 2 : 1;
      const coinGain = ((10 + Math.min(R.combo, 10) * 3) * mult) + (cur.kind === 'boss' ? 30 : 0) + (cur.kind === 'shadow' ? 5 : 0);
      const scoreGain = Math.round((100 + Math.min(R.combo * 10, 100)) * (cur.kind === 'elite' ? 1.5 : 1)) + (cur.kind === 'boss' ? 300 : 0);
      R.coins += coinGain; R.score += scoreGain;
      // 暗影净化：跨局错题连对 2 次根除
      let purifyNote = '';
      if (P.wrong[it.id]) {
        const w = P.wrong[it.id];
        w.streak = (w.streak || 0) + 1;
        if (w.streak >= 2) {
          delete P.wrong[it.id]; purifyNote = ' · 暗影已净化 ✦'; toast('暗影净化：' + it.k, 'ok');
          ach('tw_first_purify');                             // P2-1：首净化暗影
          if (!Object.keys(P.wrong).length) ach('tw_shadow_zero'); // P2-1：暗影清零（至少净化过一道）
        }
        else { purifyNote = ' · 暗影净化中（再答对 1 次根除）'; }
      }
      verdict('good', '✓ 击破 · +' + coinGain + ' 金币 · +' + scoreGain + ' 分' + (R.combo >= 3 ? ' · ' + R.combo + ' 连击!' : '') + purifyNote,
        '【' + esc(it.k) + '】 ' + esc(it.expl), '正确答案：' + 'ABCD'[it.ans]);
      renderPlayer(); renderFloors(); renderTop(); renderBadge(); save();
    } else {
      // 答错（含超时 i=-1）
      cur.wrongPicks.push(i);
      if (i >= 0) { optsEls.forEach(el => { if (+el.dataset.i === i) { el.classList.add('wrongpick'); el.disabled = true; } }); }
      $('battleCard').classList.add('shake');
      beep(196, 0.22);
      // 复查券机会
      if ((R.items.retry || 0) > 0 && !cur.usedRetry) {
        cur.usedRetry = true;
        verdict('warn', '✗ 判定错误 —— 你有一张复查券', '使用后本次不计伤害、不清连击，可继续作答（错误选项已锁定）。', null, true);
        return;
      }
      finalizeWrong(i < 0 ? '⏰ 超时 · 遭受重击' : '✗ 判定错误 · 受到 1 点伤害');
    }
  }

  function finalizeWrong(tag) {
    const it = cur.item;
    cur.answered = true;
    const optsEls = document.querySelectorAll('#opts .opt');
    optsEls.forEach(el => { el.disabled = true; if (+el.dataset.i === it.ans) el.classList.add('right'); });
    R.asked++;                                  // 最终结算才计数
    bumpMod(it.mod, false);
    R.combo = 0; R.hp--;
    // 错题入册 + 暗影排程
    if (!P.wrong[it.id]) P.wrong[it.id] = { miss: 0, streak: 0 };
    P.wrong[it.id].miss++;
    P.wrong[it.id].streak = 0;
    R.pendingShadow.push({ id: it.id, at: R.pos + 1 + 3 });
    R.pendingShadow.sort((a, b) => a.at - b.at);
    verdict('bad', tag + '（生命 ' + R.hp + '/' + (R.maxHp || MAX_HP) + '）',
      '【' + esc(it.k) + '】 ' + esc(it.expl),
      '正确答案：' + 'ABCD'[it.ans] + ' · 此题已化为暗影，3 层后复仇');
    renderPlayer(); renderFloors(); renderTop(); save();
  }

  function verdict(type, tag, body, ansLine, retryMode) {
    const v = H('div', 'verdict ' + (type === 'good' ? 'good' : type === 'warn' ? 'bad' : 'bad'));
    // 答题解析：答对/答错都显示（复查券模式不显示，避免重答前剧透）
    const expHtml = (!retryMode && cur && cur.item.exp)
      ? '<div class="expl-line"><span class="el-tag">📖 解析</span>' + esc(cur.item.exp) + '</div>' : '';
    // 逐选项解析：每个错误选项错在哪（数据有 dexpl 才显示）
    const dexpHtml = (!retryMode && cur && cur.item.dexpl)
      ? '<div class="dexp">' + cur.item.dexpl.map((d, i) =>
          '<div class="dopt' + (i === cur.item.ans ? ' ok' : '') + '"><b>' + 'ABCD'[i] + (i === cur.item.ans ? ' ✓' : ' ✗') + '</b>' + esc(d) + '</div>').join('') + '</div>' : '';
    v.innerHTML = '<span class="v-tag">' + esc(tag) + '</span>' +
      (ansLine ? '<span class="kd">' + esc(ansLine) + '</span>' : '') +
      '<div>' + body + '</div>' + expHtml + dexpHtml;
    const zone = $('vzone'); zone.innerHTML = ''; zone.appendChild(v);
    if (retryMode) {
      const use = H('button', 'retrybtn', '🔁 使用复查券（免伤重答）');
      use.onclick = () => {
        R.items.retry--;
        v.remove(); use.remove(); decline.remove();
        toast('复查券已使用', 'gold'); renderPlayer();
      };
      const decline = H('button', 'retrybtn', '放弃复查 · 接受伤害 ▸');
      decline.onclick = () => finalizeWrong('✗ 放弃复查 · 受到 1 点伤害');
      zone.appendChild(use);
      zone.appendChild(decline);
    }
    if (!retryMode) {
      const nx = H('button', 'nextbtn', R.hp <= 0 ? '查看结算 ▸' : nextLabel());
      nx.id = 'nextBtn';
      nx.onclick = advance;
      zone.appendChild(nx);
      nx.focus();
    }
    v.scrollIntoView({ block: 'end' });
  }
  function nextLabel() {
    if (cur.kind === 'boss') return '登顶结算 ▸';
    const isShop = !R.daily && (R.pos + 1 === ELITE_FLOORS[0] || R.pos + 1 === ELITE_FLOORS[1]) && cur.kind !== 'shadow';
    if (cur.kind === 'shadow') return '继续爬塔 ▸';
    return isShop ? '前往补给站 ▸' : '下一层 ▸';
  }

  function advance() {
    if (R.hp <= 0) { renderResult(); return; }
    if (cur && cur.kind !== 'shadow') {
      R.pos++;
      P.floors = (P.floors || 0) + 1;                          // P2-1：累计爬塔层数
      if (P.floors >= 100) ach('tw_floors100');
    }
    if (R.pos >= R.slots.length) { renderResult(); return; }
    const shopAfter = !R.daily && cur && cur.kind !== 'shadow' &&
      (R.pos === ELITE_FLOORS[0] || R.pos === ELITE_FLOORS[1]);
    if (shopAfter) { renderShop(); return; }
    serveNext();
  }

  function bumpMod(mod, right) {
    if (!R.modRun[mod]) R.modRun[mod] = { right: 0, wrong: 0 };
    R.modRun[mod][right ? 'right' : 'wrong']++;
    if (!P.modStats[mod]) P.modStats[mod] = { right: 0, wrong: 0 };
    P.modStats[mod][right ? 'right' : 'wrong']++;
  }

  /* ---------------- shop ---------------- */
  function renderShop() {
    setPhase('shop');
    beep(587, 0.1); setTimeout(() => beep(880, 0.12), 110);
    const wrap = H('div', 'card');
    const shop = H('div', 'battle');
    shop.innerHTML =
      '<div class="b-head"><span class="chip" style="color:var(--amber);border-color:var(--amber)">🏪 补给站</span>' +
      '<span class="chip">金币 <b style="color:var(--amber)">' + R.coins + '</b></span>' +
      '<span class="chip">第 ' + R.pos + ' 层休整</span></div>' +
      '<div class="qtext" style="font-size:14px">林博士：接下来的路更陡。备些装备——考试时它们叫"答题策略"。</div>' +
      '<div class="shopgrid" id="sgrid"></div>' +
      '<button class="nextbtn" id="leaveShop">离开补给站 · 继续爬塔 ▸</button>';
    wrap.appendChild(shop);
    $('screen').innerHTML = ''; $('screen').appendChild(wrap);
    const grid = shop.querySelector('#sgrid');
    ITEMS.forEach(it => {
      const afford = R.coins >= it.cost;
      const b = H('button', 'shopitem', '<div class="sn">' + esc(it.name) + '</div><div class="sd">' + esc(it.desc) + '</div><div class="sc">💰 ' + it.cost + '</div>');
      if (!afford) b.disabled = true;
      b.onclick = () => {
        if (R.coins < it.cost) return;
        R.coins -= it.cost;
        R.items[it.id] = (R.items[it.id] || 0) + 1;
        beep(988, 0.1);
        toast('购入 ' + it.name, 'gold');
        renderPlayer(); renderShop(); // 刷新价格可用性
      };
      grid.appendChild(b);
    });
    shop.querySelector('#leaveShop').onclick = () => serveNext();
    renderPlayer(); renderFloors();
  }

  /* ---------------- result ---------------- */
  function renderResult() {
    setPhase('result');
    if (R && !R.done) {
      R.done = true;
      if (R.daily) settleDaily();                 // P2-2：每日挑战成绩（不进生涯积分，防刷）
      else P.lifetime += R.score;
      const prevBest = P.best[R.towerId] || 0;
      const newBest = R.score > prevBest;
      if (newBest) P.best[R.towerId] = R.score;
      const won = R.hp > 0;
      if (won) {
        P.clear[R.towerId] = true;                             // P2-1：登顶记录
        if (!R.daily && COMPANY_IDS.includes(R.towerId)) ach('tw_company_first');
        if (!R.daily && COMPANY_IDS.every((id) => P.clear[id])) ach('tw_company_all');
        if (R.firstTry === R.asked && R.asked >= 10) ach('tw_perfect');
      }
      achDual();                                               // P2-1：跨游戏成就
      save();
      renderTop(); renderPlayer(); renderFloors();
      beep(659, 0.12); setTimeout(() => beep(880, 0.12), 130); setTimeout(() => beep(1318, 0.22), 260);
      var _newBest = newBest; // closure 供模板
    }
    const won = R.hp > 0;
    const acc = R.asked ? Math.round(R.firstTry / R.asked * 100) : 0;
    // 模块准确率
    let modHtml = '';
    Object.keys(R.modRun).forEach(m => {
      const s = R.modRun[m];
      const t = s.right + s.wrong; if (!t) return;
      const pct = Math.round(s.right / t * 100);
      const color = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
      modHtml += '<div class="mrow"><span style="width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(m) + '</span>' +
        '<span class="mbar"><i style="width:' + pct + '%;background:' + color + '"></i></span><b>' + pct + '%</b></div>';
    });
    const r = rankInfo();
    const wrap = H('div', 'card');
    const rep = H('div', 'battle' + (won ? '' : ''));
    const towerName = (TOWERS.find(t => t.id === R.towerId) || {}).name || (R.daily ? '每日挑战' : '');
    rep.innerHTML =
      '<div class="b-head"><span class="chip ' + (won ? '' : 'bossc') + '" style="' + (won ? 'color:var(--green);border-color:var(--green)' : 'color:var(--red);border-color:var(--red)') + '">' +
      (won ? '🏆 登顶成功' : '💀 试炼失败') + '</span><span class="chip">' + esc(towerName) + '</span>' +
      (R.daily && R.practice ? '<span class="chip" style="color:var(--dim)">练习（今日成绩已计入）</span>' : '') + '</div>' +
      '<div class="qtext" style="font-size:16px">' + (won ? R.slots.length + ' 层尽收眼底。林博士在塔顶等着你。' : '血尽而止——但塔记住了你的每一道错题。它们会成为暗影，在下一次爬塔时等你。') + '</div>' +
      '<div class="rgrid">' +
      rcell(R.score, '本局得分') + rcell(acc + '%', '首答正确率') +
      rcell(R.firstTry + '/' + R.asked, '首答命中') + rcell(R.maxCombo, '最高连击') +
      rcell(R.coins, '剩余金币') + rcell(P.lifetime, '生涯积分') + '</div>' +
      '<h3 style="font-family:var(--mono);font-size:12px;color:var(--dim);letter-spacing:2px;margin:8px 0 6px">▸ 本局模块战报</h3>' +
      '<div class="modacc">' + (modHtml || '<div style="color:var(--dim)">无作答记录</div>') + '</div>' +
      '<div class="weak-tip" style="margin-top:12px">段位：<b>' + r.cur[1] + '</b>' + (r.next ? ' · 距 ' + r.next[1] + ' 还差 ' + (r.next[0] - P.lifetime) + ' 分' : ' · 已至顶点') + '</div>' +
      '<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">' +
      '<button class="nextbtn" id="againBtn">再爬一次 ▸</button>' +
      '<button class="retrybtn" id="backSel">换一座塔</button>' +
      '<button class="retrybtn" id="reviewWrong">复盘错题</button></div>';
    wrap.appendChild(rep);
    $('screen').innerHTML = ''; $('screen').appendChild(wrap);
    $('againBtn').onclick = () => R.daily ? startDaily() : startRun(R.towerId);
    $('backSel').onclick = () => renderSelect();
    $('reviewWrong').onclick = () => modalWrong();
  }
  function rcell(v, k) { return '<div class="rcell"><div class="rv">' + v + '</div><div class="rk">' + k + '</div></div>'; }

  /* ---------------- modals ---------------- */
  function openModal(title, bodyHtml, foot) {
    const root = $('modalRoot'); root.innerHTML = '';
    const bd = H('div', 'backdrop');
    const m = H('div', 'modal');
    m.innerHTML = '<h2>' + esc(title) + '<span class="x">✕ ESC</span></h2>' + bodyHtml + (foot ? '<div class="mfoot">' + foot + '</div>' : '');
    bd.appendChild(m);
    bd.onclick = (e) => { if (e.target === bd) root.innerHTML = ''; };
    m.querySelector('.x').onclick = () => root.innerHTML = '';
    root.appendChild(bd);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { $('modalRoot').innerHTML = ''; return; }
    if ($('modalRoot').innerHTML) return;
    if (window.CINEMA && window.CINEMA.isPlaying()) return;   // R3: BOSS 层闪现期间不隐形答题
    const ph = window.__phase;
    if (ph === 'battle' && cur && !cur.answered) {
      const map = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
      const k = e.key.toLowerCase();
      if (k in map) {
        const el = document.querySelectorAll('#opts .opt')[map[k]];
        if (el && !el.disabled) answer(map[k]);
      }
    } else if (ph === 'battle' && cur && cur.answered) {
      if (e.key === 'Enter') { const nb = $('nextBtn'); if (nb) nb.click(); }
    } else if (ph === 'shop' && e.key === 'Enter') {
      const ls = $('leaveShop'); if (ls) ls.click();
    }
  });

  function modalCodex() {
    const got = Object.keys(P.codex).filter(id => item(id));
    const byMod = {};
    D.items.forEach(it => {
      if (!byMod[it.mod]) byMod[it.mod] = { total: 0, got: 0 };
      byMod[it.mod].total++;
      if (P.codex[it.id]) byMod[it.mod].got++;
    });
    let html = '<div style="margin-bottom:12px;font-family:var(--mono);font-size:12px;color:var(--dim)">图鉴收录 ' + got.length + ' / ' + D.items.length + '（作答即收录，含错题——错题也是收藏品）</div>';
    Object.keys(byMod).forEach(m => {
      const s = byMod[m];
      const pct = Math.round(s.got / s.total * 100);
      html += '<div class="mrow"><span style="width:110px">' + esc(m) + '</span><span class="mbar"><i style="width:' + pct + '%;background:var(--cyan)"></i></span><b>' + s.got + '/' + s.total + '</b></div>';
    });
    const collected = D.items.filter(it => P.codex[it.id]).slice(0, 200);
    html += '<div style="margin-top:14px">' + collected.map(it =>
      '<div class="kitem"><b>' + esc(it.k) + '</b> <span class="st">[' + esc(it.modName) + ' · ' + '★'.repeat(it.diff || 1) + ']</span><p>' + esc(it.expl) + '</p></div>'
    ).join('') + '</div>';
    openModal('概念图鉴 · CODEX', html, '每张卡都是考卷上的一道真题考点。');
  }
  function modalWrong() {
    const ids = Object.keys(P.wrong);
    renderBadge();
    const html = ids.length
      ? '<div class="klist">' + ids.map(id => {
          const it = item(id); const w = P.wrong[id];
          if (!it) return '';
          return '<div class="kitem"><b>' + esc(it.k) + '</b> <span class="st">[' + esc(it.modName) + ']</span> ' +
            '<span class="st miss">累计答错 ' + w.miss + ' 次</span>' +
            '<span class="st ' + (w.streak >= 1 ? 'ok' : 'miss') + '">' + (w.streak >= 1 ? ' · 净化中（' + w.streak + '/2）' : ' · 待净化') + '</span>' +
            '<p>' + esc(it.expl) + '</p></div>';
        }).join('') + '</div>'
      : '<div style="color:var(--dim)">零错题。要么你很强，要么你还没爬过塔。</div>';
    openModal('错题本 · 暗影名录', html, '暗影在爬塔中随机复仇；连续两次答对同一暗影即净化。');
  }
  function modalStats() {
    let html = '<button class="nextbtn" id="achBtn" style="width:100%;margin-bottom:12px">🏆 成就墙 · ACHIEVEMENTS</button>' +
      '<div class="rgrid">' +
      rcell(P.lifetime, '生涯积分') + rcell(Object.keys(P.codex).length, '图鉴收录') +
      rcell(Object.keys(P.wrong).length, '待净化暗影') + rcell(rankInfo().cur[1], '当前段位') + '</div>';
    html += '<h3 style="font-family:var(--mono);font-size:12px;color:var(--dim);margin:10px 0 6px">▸ 各塔最佳成绩</h3>';
    TOWERS.forEach(t => {
      html += '<div class="mrow"><span style="width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(t.name) + '</span><span class="mbar"><i style="width:' + Math.min(100, (P.best[t.id] || 0) / 20) + '%;background:var(--amber)"></i></span><b>' + (P.best[t.id] || 0) + '</b></div>';
    });
    openModal('战报 · STATS', html +
      '<div style="display:flex;gap:8px;margin-top:12px"><button class="retrybtn" id="lbBtn" style="margin:0">🔥 贡献榜</button></div>' +
      '<div id="lbPanel" style="margin-top:10px"></div>',
      '历史模块正确率见选塔页的弱点侦察。');
    const lbB = $('lbBtn');
    if (lbB && window.LEADERBOARD) lbB.onclick = () => { $('lbPanel').innerHTML = window.LEADERBOARD.render(); };
    const ab = $('achBtn');
    if (ab) ab.onclick = () => {
      openModal('成就墙 · ACHIEVEMENTS', window.ACHS ? window.ACHS.modalBody() : '');
      if (window.ACHS) window.ACHS.renderIntoWall();
    };
  }
  function modalSettings() {
    const html = '<div style="display:flex;flex-direction:column;gap:10px">' +
      '<div style="font-family:var(--mono);font-size:11px;color:var(--dim);margin-bottom:6px">档案号 ' + (window.LEADERBOARD ? window.LEADERBOARD.pid() : '—') + ' · 存档在本地，跨设备请到 RPG 系统菜单导出存档码</div>' +
      '<button class="retrybtn" id="bgmBtn">BGM（试炼版 · 92BPM）：' + (window.TBGM && window.TBGM.isOn() ? '开 ✓' : '关') + '</button>' +
      '<button class="retrybtn" id="sndBtn">音效：' + (soundOn ? '开 ✓' : '关') + '</button>' +
      '<button class="retrybtn" id="rstBtn">重置全部进度</button>' +
      '<button class="retrybtn" id="fbBtn">📖 年鉴 · 留言</button>' +
      '<div style="color:var(--dim);font-size:12px;line-height:1.8">NOVA 概念试炼塔 · Concept Tower<br>基础题库 245 题 · 进阶 6 塔按需解锁<br>与《AI PRODUCT RPG》同世界观：RPG 练判断，试炼塔练记忆。</div></div>';
    openModal('系统 · SYSTEM', html);
    $('sndBtn').onclick = () => { soundOn = !soundOn; P.sound = soundOn; save(); modalSettings(); };
    const bgmB = $('bgmBtn');
    if (bgmB && window.TBGM) bgmB.onclick = () => { const on = window.TBGM.toggle(); bgmB.textContent = 'BGM（试炼版 · 92BPM）：' + (on ? '开 ✓' : '关'); };
    $('rstBtn').onclick = () => { if (confirm('确定清空段位/图鉴/错题本？')) { P = freshP(); save(); location.reload(); } };
    const fb = $('fbBtn');
    if (fb && window.FEEDBACK) fb.onclick = () => { openYearbook(); };
  }
  /* 背包：道具统一查看（在对局内购买/使用） */
  function modalBag() {
    const ICONS = { fifty: '🔀', hint: '💡', potion: '🧪', retry: '🎟️', hourglass: '⏳' };
    const inRun = !!(R && R.items);
    const rows = ITEMS.map(it => {
      const n = inRun ? (R.items[it.id] || 0) : null;
      return '<div class="bagrow"><span class="bag-ic">' + (ICONS[it.id] || '道具') + '</span>' +
        '<div class="bag-b"><b>' + esc(it.name) + '</b><span>' + esc(it.desc) + ' · 售价 ' + it.cost + ' 金币</span></div>' +
        (n === null ? '<em class="bag-n dim">对局外</em>' : '<em class="bag-n">×' + n + '</em>') + '</div>';
    }).join('');
    openModal('背包 · BACKPACK',
      '<div class="baglist">' + rows + '</div>' +
      '<div class="bagtip">道具在对局内用金币购买（战斗界面下方道具栏，点击即用）。金币来自答题与连胜；背包只做统一查看。🧪 药水恢复生命、🔀 50/50 排除两个错误选项、💡 显示考点、🎟️ 答错免伤重答、⏳ 精英层限时+15秒。</div>');
  }
  loadPaidCaches();
  document.querySelectorAll('.top-actions button').forEach(b => {
    b.onclick = () => {
      const m = b.dataset.modal;
      if (m === 'codex') modalCodex();
      else if (m === 'wrong') modalWrong();
      else if (m === 'stats') modalStats();
      else modalSettings();
    };
  });
  /* 伴学植物：跨游戏时长账本（与 RPG 共用 aiProductRpg.time，每 30s +0.5 分钟） */
  function modalPlant() {
    if (!window.PLANTCORE) return;
    const st = PLANTCORE.info();
    const bar = (n, max) => {
      const pct = Math.round((n / max) * 100);
      return '<span class="pl-bar"><span class="pl-track"><i style="width:' + pct + '%"></i></span><b>' + n + '/' + max + '</b>';
    };
    const vine = st.vUnlocked
      ? '<div class="pl-row"><span class="pl-ic">⭐</span><div class="pl-b"><b>星语藤 · 第 ' + st.v + ' 阶</b><span>通关 RPG 那晚种下，藤上亮星</span></div>' + bar(st.v, st.vMax) + '</div>'
      : '<div class="pl-row locked"><span class="pl-ic">✨</span><div class="pl-b"><b>星语藤 · 沉睡中</b><span>通关《AI PRODUCT RPG》后，星光降临</span></div></div>';
    const bell = st.bUnlocked
      ? '<div class="pl-row"><span class="pl-ic">🔔</span><div class="pl-b"><b>风铃草 · 第 ' + st.b + ' 阶</b><span>累计 3 小时那刻在你的窗台醒了</span></div>' + bar(st.b, st.bMax) + '</div>'
      : '<div class="pl-row locked"><span class="pl-ic">🔔</span><div class="pl-b"><b>风铃草 · 待醒</b><span>再陪 ' + Math.ceil(st.bNeed) + ' 分钟解锁（累计 3 小时）</span></div></div>';
    openModal('伴学植物 · COMPANIONS',
      '<div class="pl-sum">你在两个世界累计陪伴了 <b>' + st.human + '</b><span>RPG 与试炼塔的时长记在同一本账上，爬塔也在浇灌它们</span></div>' +
      '<div class="pl-row"><span class="pl-ic">🪴</span><div class="pl-b"><b>文竹 · ' + st.a + ' 枝</b><span>' + (st.aNext ? '再陪 ' + Math.ceil(st.aNext - st.min) + ' 分钟，醒出新一枝（约每 1 小时一枝）' : '满枝！8/8 · 它记得你的每一分钟') + '</span></div>' + bar(st.a, st.aMax) + '</div>' +
      bell + vine +
      '<div class="pl-tip">🧪 加速药剂（+10 分钟）在 RPG 左下角盆栽窗口使用；零失误章节可获得。植物与时长都存在你自己的浏览器里。</div>');
  }
  setInterval(() => {
    if (document.visibilityState !== 'visible' || !window.PLANTCORE) return;
    try { localStorage.setItem(PLANTCORE.TIME_KEY, String(PLANTCORE.loadMin() + 0.5)); } catch (e) {}
    renderPlantWidget();
  }, 30000);
  /* 左下角伴学小盆栽：真实生长（文竹枝数=两游戏累计时长），点击看详情 */
  function renderPlantWidget() {
    if (!window.PLANTCORE) return;
    let w = $('nvPlant');
    if (!w) {
      const css = document.createElement('style');
      css.textContent = '#nvPlant{position:fixed;left:14px;bottom:14px;z-index:800;cursor:pointer;background:rgba(10,15,26,.82);border:1px solid #26324a;border-radius:16px;padding:6px 8px 2px;backdrop-filter:blur(6px);transition:border-color .15s,transform .15s;box-shadow:0 4px 14px rgba(0,0,0,.4)}#nvPlant:hover{border-color:#34d399;transform:translateY(-2px)}#nvPlant .np-l{display:block;font-size:9px;color:#8b9bb4;text-align:center;letter-spacing:2px;margin-top:2px}';
      document.head.appendChild(css);
      w = document.createElement('div');
      w.id = 'nvPlant';
      w.title = '伴学植物 · 两游戏时长都在浇灌它 · 点击详情';
      w.onclick = modalPlant;
      document.body.appendChild(w);
    }
    w.innerHTML = PLANTCORE.miniSvg(PLANTCORE.info()) + '<span class="np-l">' + (PLANTCORE.info().a) + ' 枝</span>';
  }
  renderPlantWidget();
  /* 彩头 & 年鉴 */
  function openTip() {
    openModal('🎋 求个上上签 · DAILY FORTUNE', window.TIP ? TIP.html() : '配置中');
    if (window.TIP) TIP.wire();
  }
  function openYearbook() {
    if (!window.FEEDBACK) return;
    openModal('NOVA 年鉴 · YEARBOOK', FEEDBACK.html('tower'));
    FEEDBACK.wire('tower');
    const tb = $('fbTip');
    if (tb) tb.onclick = openTip;
  }
  /* 右下角功能坞：背包 + 年鉴 + 彩头（植物在左下角独立盆栽） */
  if (window.DOCK) DOCK.mount({
    onBag: modalBag,
    onBook: openYearbook,
    onTip: openTip
  });
  function renderBadge() {
    const n = Object.keys(P.wrong).length;
    const b = $('wBadge');
    b.style.display = n ? '' : 'none';
    b.textContent = n;
  }

  /* ---------------- boot ---------------- */
  renderTop(); renderBadge();
  renderTitle();
  // P2-1：注入成就系统
  if (window.ACHS) window.ACHS.init({ side: 'tw', get: () => P, persist: save, toast: toast });
  // 冒烟测试钩子（tools/smoke.js 专用；无运行时副作用，生产环境不会被调用）
  window.TOWERTEST = { buildRun: buildRun, TOWERS: TOWERS, buildDaily: buildDaily, hashDate: hashDate, todayStr: todayStr, startDaily: startDaily, checkCode: checkCode, towerLocked: towerLocked, unlockPaid: unlockPaid, loadPaidCaches: loadPaidCaches, P: P, items: D.items };
  // URL 预选塔：?mod=<塔id 或 模块id> 打开即自动进入对应塔；无参数时行为不变
  (function () {
    const m = new URLSearchParams(location.search).get('mod');
    if (!m) return;
    const t = TOWERS.find(x => x.id === m) ||
      TOWERS.find(x => x.mods && x.mods.length === 1 && x.mods[0] === m) ||
      TOWERS.find(x => x.mods && x.mods.includes(m));
    if (t) { beep(660, 0.08); startRun(t.id); }
  })();
})();
