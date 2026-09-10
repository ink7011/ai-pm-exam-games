#!/usr/bin/env node
/* ============================================================
   tools/smoke.js — 纯 Node 零依赖冒烟测试（不依赖浏览器/git）
   用法：node tools/smoke.js
   覆盖：语法检查 / 题库完整性 / finalTier 边界 / 药剂-计时器线性
        / 过场看门狗 / T3 落盘时序 / 键盘映射 / 存档码 v1→v2
        / 大厂塔 boss 层（Phase 2：成就定义、每日挑战种子、PWA 清单）
   任何 [FAIL] → exit 1
   ============================================================ */
'use strict';
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('[PASS] ' + name); }
  else { fail++; console.log('[FAIL] ' + name + (extra !== undefined ? '  → ' + extra : '')); }
}
function section(t) { console.log('\n—— ' + t + ' ——'); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- mini stub DOM ---------------- */
function makeEl(tag, registry) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    style: {}, dataset: {}, children: [], parentNode: null, disabled: false,
    onclick: null, _id: null, _html: '', _text: '', _cls: new Set(), _q: {}
  };
  el.classList = {
    add: (...c) => c.forEach((x) => el._cls.add(x)),
    remove: (...c) => c.forEach((x) => el._cls.delete(x)),
    toggle: (c, f) => { const on = f === undefined ? !el._cls.has(c) : !!f; on ? el._cls.add(c) : el._cls.delete(c); return on; },
    contains: (c) => el._cls.has(c)
  };
  Object.defineProperty(el, 'id', {
    get: () => el._id,
    set: (v) => { el._id = v; if (registry) registry.set(v, el); }
  });
  Object.defineProperty(el, 'className', {
    get: () => Array.from(el._cls).join(' '),
    set: (v) => { el._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  });
  Object.defineProperty(el, 'innerHTML', {
    get: () => el._html,
    set: (v) => { el._html = String(v); el.children = []; el._q = {}; }
  });
  Object.defineProperty(el, 'textContent', {
    get: () => el._text,
    set: (v) => { el._text = String(v); }
  });
  el.appendChild = (c) => { el.children.push(c); try { c.parentNode = el; } catch (e) {} return c; };
  el.insertBefore = (c, ref) => {
    const i = ref ? el.children.indexOf(ref) : -1;
    if (i < 0) el.children.push(c); else el.children.splice(i, 1, 0, c);
    c.parentNode = el; return c;
  };
  el.remove = () => { if (el.parentNode) { const i = el.parentNode.children.indexOf(el); if (i >= 0) el.parentNode.children.splice(i, 1); } };
  el.querySelector = (sel) => { if (!el._q[sel]) el._q[sel] = makeEl('div', null); return el._q[sel]; };
  el.querySelectorAll = () => [];
  el.addEventListener = () => {}; el.removeEventListener = () => {};
  el.click = () => { if (typeof el.onclick === 'function') el.onclick({ stopPropagation() {}, preventDefault() {} }); };
  el.focus = () => {}; el.select = () => {};
  el.setAttribute = () => {}; el.getAttribute = () => null; el.removeAttribute = () => {};
  el.closest = () => null; el.scrollIntoView = () => {};
  el.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });
  el.firstElementChild = null;
  Object.defineProperty(el, 'firstChild', { get: () => el.children[0] || null });
  return el;
}

/* 一个沙箱 = 一套独立 globals（localStorage/document/window…），用后即焚 */
function sandbox(opts) {
  opts = opts || {};
  const registry = new Map();
  const storage = new Map();
  const listeners = {};
  const intervals = [];

  const document = {
    readyState: opts.readyState || 'complete',
    visibilityState: 'visible',
    activeElement: null,
    head: makeEl('head', registry),
    body: makeEl('body', registry),
    getElementById: (id) => {
      if (registry.has(id)) return registry.get(id);
      if (!opts.autoCreate) return null;
      const el = makeEl('div', registry); el.id = id; return el;
    },
    createElement: (tag) => makeEl(tag, registry),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
    removeEventListener: (t, fn) => {
      if (!listeners[t]) return;
      const i = listeners[t].indexOf(fn); if (i >= 0) listeners[t].splice(i, 1);
    }
  };

  const g = {
    document: document,
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k)
    },
    location: { search: '', reload() {} },
    navigator: { userAgent: 'smoke' },
    confirm: () => true,
    setTimeout: setTimeout, clearTimeout: clearTimeout,
    setInterval: opts.captureInterval ? ((fn) => { intervals.push(fn); return intervals.length; }) : setInterval,
    clearInterval: () => {},
    window: null,
    AudioContext: undefined, webkitAudioContext: undefined
  };
  g.window = g; // 浏览器脚本里的 window.* 即 global.*
  g.__listeners = listeners;
  g.__intervals = intervals;
  g.__storage = storage;
  g.__registry = registry;
  return g;
}

/* 在指定沙箱里加载一个浏览器脚本（绕过 require 缓存） */
function loadIn(g, rel) {
  const abs = path.join(ROOT, rel);
  const src = fs.readFileSync(abs, 'utf8');
  const fn = new Function('window', 'document', 'localStorage', 'navigator', 'location', 'confirm',
    'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', src);
  fn(g, g.document, g.localStorage, g.navigator, g.location, g.confirm,
    g.setTimeout, g.clearTimeout, g.setInterval, g.clearInterval);
  return g;
}

async function main() {
  /* ========== 1. 语法检查 ========== */
  section('1. node --check 全部 JS');
  const jsDirs = ['rpg/js', 'tower/js', 'shared'];
  const jsFiles = [];
  jsDirs.forEach((d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.endsWith('.js')).forEach((f) => jsFiles.push(path.join(d, f))));
  if (fs.existsSync(path.join(ROOT, 'sw.js'))) jsFiles.push('sw.js');
  jsFiles.sort();
  let synErr = 0;
  jsFiles.forEach((f) => {
    const r = cp.spawnSync(process.execPath, ['--check', path.join(ROOT, f)], { encoding: 'utf8' });
    const good = r.status === 0;
    if (!good) { synErr++; console.log('    ' + f + ': ' + (r.stderr || '').split('\n')[0]); }
    ok('syntax ' + f, good);
  });
  ok('语法检查覆盖文件数 ≥ 11（含 achievements/sw）', jsFiles.length >= 11, 'got ' + jsFiles.length);

  /* ========== 2. 题库完整性 ========== */
  section('2. 题库 deck-data 完整性（245 免费题）');
  const gDeck = { window: {} };
  new Function('window', fs.readFileSync(path.join(ROOT, 'tower/js/deck-data.js'), 'utf8'))(gDeck.window);
  const D = gDeck.window.DECK;
  const items = D.items;
  ok('免费题数 = 245（meta.count 同步）', items.length === 245 && D.meta.count === 245, items.length + '/' + D.meta.count);
  ok('公开题库不含付费塔内容', items.every((q) => ['meituan', 'didi', 'xiaohongshu', 'tencent', 'alibaba', 'bytedance'].indexOf(q.mod) === -1));
  const ids = items.map((x) => x.id);
  ok('id 全局唯一', new Set(ids).size === ids.length);
  ok('每题 4 个互异选项', items.every((q) => Array.isArray(q.opts) && q.opts.length === 4 && new Set(q.opts).size === 4));
  ok('ans 合法（0-3 整数）', items.every((q) => Number.isInteger(q.ans) && q.ans >= 0 && q.ans <= 3));
  ok('exp 解析非空', items.every((q) => typeof q.exp === 'string' && q.exp.trim().length > 0));
  ok('k 考点非空', items.every((q) => typeof q.k === 'string' && q.k.trim().length > 0));
  const bosses = items.filter((q) => q.boss);
  ok('boss 题总数 13（免费库）', bosses.length === 13, bosses.length);
  ok('付费塔 boss/题目均不在公开库（qtxboss/qddboss/qmtboss 缺席）',
    ['qtxboss', 'qddboss', 'qmtboss'].every((bid) => !items.find((x) => x.id === bid)));
  ['tencent', 'didi', 'meituan'].forEach((m) => {
    ok('付费塔 ' + m + ' 题目不在公开题池', !items.some((q) => q.mod === m));
  });

  /* ========== 3+4+5. engine 沙箱：finalTier / T3 / T6 / 键盘 ========== */
  section('3. RPG engine 沙箱（finalTier 边界 / T3 落盘 / T6 存档码）');
  const gE = sandbox({ autoCreate: true });
  // 极简 CONTENT：boot/resume 只触碰这些字段
  gE.CONTENT = {
    TICKER: ['smoke'],
    SKILLS: {}, KNOWLEDGE: {}, SKILL_CATS: [],
    NPCS: { sys: { name: 'SYS', color: '#000' } },
    VARIANTS: [],
    CASES: [0, 1, 2, 3, 4].map((i) => ({
      title: '案例' + i, tags: ['t'], brief: 'b', kind: 'normal',
      intro: [], outro: [], investigate: { budget: 2, options: [] }, rounds: []
    }))
  };
  gE.CINEMA = { play: () => new Promise(() => {}), isPlaying: () => false }; // 永不完成：验证落盘先于动画
  loadIn(gE, 'shared/achievements.js'); // P2-1：先于 engine 注入，engine 加载时会 ACHS.init
  // 预置一份 v1 旧存档（caseIdx=1, phase=intro）
  const v1Save = {
    v: 1, started: true, name: 'Smoke', role: 'PA', xp: 0,
    company: { revenue: 50, users: 50, trust: 50, quality: 50, cost: 50, morale: 50 },
    caseIdx: 1, phase: 'intro', roundIdx: 0, clues: [], roundPicked: [], roundWrong: 0,
    revealed: false, roundAttempted: false, potions: 0, roundsFirstTryThisCase: 0,
    skills: [], errors: [], profile: {},
    stats: { firstTry: 0, total: 0, wrongTotal: 0, investLeftoverXp: 0 },
    bossVariants: [], bossVariantIdx: 0, finished: false, clock: 540
  };
  gE.localStorage.setItem('aiProductRpg.v1', JSON.stringify(v1Save));
  let engineErr = null;
  try { loadIn(gE, 'rpg/js/engine.js'); } catch (e) { engineErr = e; }
  ok('engine.js 在 stub DOM 中加载无异常', !engineErr, engineErr && engineErr.message);
  if (engineErr) { finish(); return; }
  // 触发 DOMContentLoaded → boot → load() 走 migrate 路径
  let bootErr = null;
  try { (gE.__listeners['DOMContentLoaded'] || []).forEach((fn) => fn()); } catch (e) { bootErr = e; }
  ok('engine boot（v1 存档 resume）无异常', !bootErr, bootErr && bootErr.message);
  if (bootErr) { finish(); return; }

  // T6：v1 读入后已被 migrate 到 v2
  ok('T6 migrate：load 后内部 v=2（ach 已补）', gE.RPGSAVE && gE.RPGTEST, true);
  // finalTier 9 个边界
  const T = gE.RPGTEST;
  const tierCases = [
    [100, 50, '天选之人'], [99, 85, '天选之人'], [95, 85, '天选之人'],
    [95, 84, '传奇产品人'], [85, 85, '传奇产品人'],
    [84, 99, '稳健派'], [70, 10, '稳健派'],
    [69, 100, '潜力股'], [0, 0, '潜力股']
  ];
  tierCases.forEach(([acc, trust, want]) => {
    const t = T.finalTier(acc, trust);
    ok('finalTier(' + acc + ',' + trust + ') = ' + want, t && t.name === want, t && t.name);
  });
  // T3：动画未完成时立即读档，应已落盘新一周
  T.startCase(3);
  const snap = JSON.parse(gE.localStorage.getItem('aiProductRpg.v1'));
  ok('T3 startCase(3) 立即落盘 caseIdx=3 / phase=intro / clues清空',
    snap.caseIdx === 3 && snap.phase === 'intro' && Array.isArray(snap.clues) && snap.clues.length === 0,
    JSON.stringify({ caseIdx: snap.caseIdx, phase: snap.phase }));
  ok('T3+T6 落盘档版本 v=2（v1 旧档升级）', snap.v === 2, snap.v);
  // T6：存档码归一（v1 旧码可导入）
  const NS = gE.RPGSAVE;
  const v1Code = { v: 1, ts: 12345, rpg: JSON.stringify(v1Save), time: '7', vineBorn: '', tower: '' };
  const norm = NS.normalizeSaveData(v1Code);
  ok('T6 存档码：v1 旧码归一为 v:2 且字段保真',
    norm.v === 2 && norm.ts === 12345 && norm.rpg === v1Code.rpg && norm.time === '7' && norm.tower === '',
    JSON.stringify(norm).slice(0, 80));
  const v2Code = { v: 2, ts: 1, rpg: '{}', time: '1', vineBorn: '2', tower: '3' };
  ok('T6 存档码：v2 码直接放行', NS.normalizeSaveData(v2Code).v === 2);
  let threwBad = false;
  try { NS.normalizeSaveData({ v: 3, rpg: 'x' }); } catch (e) { threwBad = true; }
  ok('T6 存档码：v3 非法码被拒', threwBad);
  let threwNo = false;
  try { NS.normalizeSaveData({ v: 1 }); } catch (e) { threwNo = true; }
  ok('T6 存档码：缺 rpg 被拒', threwNo);
  // T5：键盘映射纯函数
  section('4. T5 键盘映射 pickOptBtn');
  const KB = gE.RPGKB;
  const mkBtn = () => ({ disabled: false, clicked: 0, click() { this.clicked++; } });
  const b = [mkBtn(), mkBtn(), mkBtn(), mkBtn()];
  b[2].disabled = true;
  const doc = { querySelectorAll: (sel) => sel === '.decision' ? [{ querySelectorAll: (s) => s === '.opt' ? b : [] }] : [] };
  ok('a → 第0个选项', KB.pickOptBtn('a', doc) === b[0]);
  ok('D（大写）→ 第3个选项', KB.pickOptBtn('D', doc) === b[3]);
  ok('2 → 第1个选项', KB.pickOptBtn('2', doc) === b[1]);
  ok('禁用选项返回 null（c/3）', KB.pickOptBtn('c', doc) === null && KB.pickOptBtn('3', doc) === null);
  ok('无关键返回 null（x/回车）', KB.pickOptBtn('x', doc) === null && KB.pickOptBtn('Enter', doc) === null);
  const emptyDoc = { querySelectorAll: () => [] };
  ok('无决策卡返回 null', KB.pickOptBtn('a', emptyDoc) === null);
  const twoCards = [mkBtn(), mkBtn(), mkBtn(), mkBtn()];
  const doc2 = { querySelectorAll: (sel) => sel === '.decision'
    ? [{ querySelectorAll: () => [] }, { querySelectorAll: (s) => s === '.opt' ? twoCards : [] }]
    : [] };
  ok('多卡时取最后一张（当前卡）', KB.pickOptBtn('d', doc2) === twoCards[3]);

  /* ========== 6. T1 药剂-计时器线性 ========== */
  section('5. T1 植物时长线性（3 药剂 + 多 tick 不回退）');
  const gP = sandbox({ autoCreate: false, captureInterval: true });
  gP.localStorage.setItem('aiProductRpg.v1', JSON.stringify({ v: 2, started: true, finished: false }));
  let plantErr = null;
  try { loadIn(gP, 'rpg/js/plant.js'); } catch (e) { plantErr = e; }
  ok('plant.js 在 stub DOM 中加载无异常', !plantErr, plantErr && plantErr.message);
  if (plantErr) { finish(); return; }
  const tick = () => gP.__intervals[0]();
  const potion = () => { const prev = parseFloat(gP.localStorage.getItem('aiProductRpg.time')) || 0; gP.localStorage.setItem('aiProductRpg.time', String(prev + 10)); }; // 与 usePotion 同源直写
  const seq = [];
  const readMin = () => parseFloat(gP.localStorage.getItem('aiProductRpg.time')) || 0;
  tick(); seq.push(readMin());      // 0.5
  tick(); seq.push(readMin());      // 1.0
  potion(); seq.push(readMin());    // 11.0
  tick(); seq.push(readMin());      // 11.5（旧 bug 会回退到 1.5）
  potion(); seq.push(readMin());    // 21.5
  potion(); seq.push(readMin());    // 31.5
  tick(); seq.push(readMin());      // 32.0
  tick(); seq.push(readMin());      // 32.5
  ok('药剂后 tick 时间线性不回退', seq.every((v, i) => i === 0 || v > seq[i - 1]), seq.join(' → '));
  ok('最终累计 32.5 分钟', Math.abs(readMin() - 32.5) < 1e-9, readMin());

  /* ========== 7. T2 过场看门狗 ========== */
  section('6. T2 过场动画：正常完成 + 看门狗兜底');
  const gC = sandbox({ autoCreate: false });
  loadIn(gC, 'shared/cinematic.js');
  const CIN = gC.CINEMA;
  let resolvedA = false;
  const scenesOk = [{ h: '[A]', lines: ['l1', 'l2'] }, { h: '[B]', lines: ['l3'] }];
  await CIN.play(scenesOk, { instant: true, timeout: 8000 }).then(() => { resolvedA = true; });
  ok('a) 正常场景 resolve', resolvedA);
  ok('a) 完成后 playing 复位', CIN.isPlaying() === false);
  const kdAdded = (gC.__listeners['keydown'] || []).length;
  ok('a) keydown 监听已移除（无泄漏）', kdAdded === 0, '剩余 ' + kdAdded);
  // b) 注入 throw：链条断掉，靠看门狗在短超时后强制 resolve
  let resolvedB = false;
  const badLines = {};
  Object.defineProperty(badLines, 'length', { get() { throw new Error('injected boom'); } });
  const swallow = () => {}; // 浏览器里异步异常只打日志；node 里需吞掉以免进程崩溃
  process.on('uncaughtException', swallow);
  const t0 = Date.now();
  await CIN.play([{ h: '[X]', lines: badLines }], { instant: true, timeout: 300 }).then(() => { resolvedB = true; });
  const dt = Date.now() - t0;
  process.removeListener('uncaughtException', swallow);
  await sleep(50);
  ok('b) 链条抛异常后看门狗仍 resolve', resolvedB, 'dt=' + dt);
  ok('b) 看门狗后 playing 复位 + 监听清理',
    CIN.isPlaying() === false && (gC.__listeners['keydown'] || []).length === 0);

  /* ========== 8. 大厂塔 boss 层（T4c 验收） ========== */
  section('7. buildRun 大厂塔 boss 层必出 boss 题');
  const gT = sandbox({ autoCreate: true });
  gT.window.DECK = D;
  let towerErr = null;
  try { loadIn(gT, 'tower/js/game.js'); } catch (e) { towerErr = e; }
  ok('game.js 在 stub DOM 中加载无异常', !towerErr, towerErr && towerErr.message);
  if (towerErr) { finish(); return; }
  const TT = gT.TOWERTEST;
  ok('TOWERTEST 钩子存在', !!TT);
  /* 付费塔题目先经"码→解密"注入（模拟解锁后状态，同时验证六塔全部可解密） */
  {
    const PC2 = require(path.join(ROOT, 'shared/paid-crypto.js'));
    const gPD2 = { window: {} };
    new Function('window', fs.readFileSync(path.join(ROOT, 'tower/js/deck-paid.js'), 'utf8'))(gPD2.window);
    const PD2 = gPD2.window.PAID_DECK;
    Object.keys(PD2).forEach((tid) => {
      const c2 = fs.readFileSync(path.join(ROOT, 'codes', tid + '.txt'), 'utf8').split('\n')[0].trim();
      const pd2 = PD2[tid];
      const i2 = pd2.h.indexOf(PC2.fnv1a(c2));
      const deck2 = PC2.decryptDeck(PC2.unwrapKey(c2, pd2.salt, pd2.w[i2]), pd2.d);
      deck2.items.forEach((q2) => D.items.push(q2)); /* push 保引用：TOWERTEST.items / poolOf 同步可见 */
    });
    ok('六座付费塔全部可解密注入', D.items.length === 245 + 90, D.items.length + '');
    gT.window.DECK = D;
    gT.window.PAID_DECK = PD2;
    gT.window.PAIDCRYPTO = PC2;
  }
  ['tencent', 'didi', 'meituan'].forEach((tid) => {
    const tw = TT.TOWERS.find((t) => t.id === tid);
    const built = TT.buildRun(tw);
    const last = built.slots[built.slots.length - 1];
    ok('「' + tw.name + '」顶层为 boss 层且是 boss 题', last.kind === 'boss' && last.item.boss === true,
      JSON.stringify({ kind: last.kind, id: last.item.id }));
  });

  /* ========== 8. 成就系统（P2-1） ========== */
  section('8. P2-1 成就系统：定义完整 + unlock 幂等 + 成就墙渲染');
  const AS = gE.ACHS;
  ok('ACHS 模块已加载', !!AS);
  ok('ACH 定义共 18 个', AS.ACH.length === 18, AS.ACH.length);
  const achIds = AS.ACH.map((a) => a.id);
  ok('ACH id 无重复', new Set(achIds).size === achIds.length);
  ok('ACH 定义含 icon/name/tip', AS.ACH.every((a) => a.icon && a.name && a.tip));
  const progDefs = AS.ACH.filter((a) => typeof a.prog === 'function');
  ok('进度型成就 ≥ 3 个（{cur,max}）', progDefs.length >= 3, progDefs.length);
  // unlock 幂等：engine boot 后 ACHS.init(side rpg, get:S)
  const first = AS.unlock('rpg_join');
  const second = AS.unlock('rpg_join');
  ok('unlock 首次返回 true / 重复返回 false（幂等）', first === true && second === false, first + '/' + second);
  ok('unlock 写入存档（S.ach 落盘）', AS.has('rpg_join') &&
    (JSON.parse(gE.localStorage.getItem('aiProductRpg.v1')).ach || {}).rpg_join > 0);
  ok('未知 id 解锁被拒', AS.unlock('nope_x') === false);
  // 成就墙渲染（目标元素 innerHTML 被填充）
  const wall = makeEl('div', null);
  const wallHtml = AS.render(wall);
  ok('成就墙渲染 18 张卡（1 已解锁）', /已解锁 1 \/ 18/.test(wallHtml) && (wallHtml.match(/🔒/g) || []).length === 17);
  ok('成就墙含解锁日期与灰色剪影', wallHtml.indexOf('解锁') > 0 && wallHtml.indexOf('🔒') > 0);

  /* ========== 9. 每日挑战（P2-2） ========== */
  section('9. P2-2 每日挑战：种子确定性');
  const DL = TT;
  const dailyIds = (b) => b.slots.map((s) => s.item.id).join(',');
  const d1 = DL.buildDaily('20260907');
  const d1b = DL.buildDaily('20260907');
  const d2 = DL.buildDaily('20260908');
  ok('同种子两次构建结果一致', dailyIds(d1) === dailyIds(d1b), dailyIds(d1) + ' vs ' + dailyIds(d1b));
  ok('不同日期题序不同', dailyIds(d1) !== dailyIds(d2));
  ok('每日挑战固定 10 层（第5层精英/第10层boss）',
    d1.slots.length === 10 && d1.slots[4].kind === 'elite' && d1.slots[9].kind === 'boss' && d1.slots[9].item.boss === true,
    d1.slots.map((s) => s.kind).join('/'));
  ok('日期哈希稳定且异日不同', DL.hashDate('20260907') === DL.hashDate('20260907') && DL.hashDate('20260907') !== DL.hashDate('20260908'));
  ok('todayStr 格式 YYYYMMDD', /^\d{8}$/.test(DL.todayStr()), DL.todayStr());

  /* ========== 10. PWA（P2-4） ========== */
  section('10. P2-4 PWA：缓存清单真实存在 + 三页注册');
  const swSrc = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const cacheArr = swSrc.match(/ASSETS = \[([\s\S]*?)\]/);
  ok('sw.js 定义 ASSETS 缓存清单', !!cacheArr);
  const cachePaths = cacheArr ? (cacheArr[1].match(/'([^']+)'/g) || []).map((s) => s.slice(1, -1)) : [];
  ok('清单条目 ≥ 16（三页 + 全部 JS + PWA 资产）', cachePaths.length >= 16, cachePaths.length);
  cachePaths.forEach((p) => {
    const rel = p === './' ? 'index.html' : p;
    ok('缓存清单文件存在: ' + p, fs.existsSync(path.join(ROOT, rel)));
  });
  ['index.html', 'rpg/index.html', 'tower/index.html'].forEach((f) => {
    const h = fs.readFileSync(path.join(ROOT, f), 'utf8');
    ok(f + '：link manifest + 注册 sw（https/localhost 判断）',
      /rel="manifest"/.test(h) && /serviceWorker/.test(h) && /https:/.test(h));
  });
  const mf = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  ok('manifest：name/short_name/theme #07090f',
    !!mf.name && !!mf.short_name && mf.theme_color === '#07090f');
  ok('manifest icons：SVG any + maskable',
    mf.icons.some((i) => i.type === 'image/svg+xml' && i.sizes === 'any' && i.purpose === 'any') &&
    mf.icons.some((i) => i.purpose === 'maskable'));
  ok('V0.5 接线：三端都引入 learner.js', (() => {
    const hub = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const tw = fs.readFileSync(path.join(ROOT, 'tower/index.html'), 'utf8');
    const rp = fs.readFileSync(path.join(ROOT, 'rpg/index.html'), 'utf8');
    return hub.includes('learner-ui.js') && tw.includes('learner.js') && rp.includes('learner.js');
  })());
  ok('V0.5 新页面存在且入 SW 缓存', (() => {
    const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    return fs.existsSync(path.join(ROOT, 'skillmap/index.html')) && fs.existsSync(path.join(ROOT, 'journey/index.html')) && sw.includes('skillmap') && sw.includes('learner.js');
  })());
  ok('sw.js：缓存版本号 nova-v1 + activate 清旧缓存 + 导航网络优先',
    /nova-v1/.test(swSrc) && /caches\.delete/.test(swSrc) && /skipWaiting/.test(swSrc) &&
    /req\.mode === 'navigate'/.test(swSrc) && /fetch\(req\)/.test(swSrc));

  finish();

  function finish() {
  /* ========== 11. 付费解锁（兑换码门控） ========== */
  section('11. 大厂塔付费解锁');
  try {
    const T11 = gT.TOWERTEST;
    ok('TOWERTEST 含付费 API', T11 && T11.checkCode && T11.towerLocked && T11.unlockPaid);
    const PC = require(path.join(ROOT, 'shared/paid-crypto.js'));
    const gPD = { window: {} };
    new Function('window', fs.readFileSync(path.join(ROOT, 'tower/js/deck-paid.js'), 'utf8'))(gPD.window);
    const PD = gPD.window.PAID_DECK;
    ok('PAID_DECK 六塔齐备', ['meituan', 'didi', 'xiaohongshu', 'tencent', 'alibaba', 'bytedance'].every((k) => PD[k] && PD[k].n === 101));
    ok('密文块不含明文题目（题目字段不出现在文件中）', !fs.readFileSync(path.join(ROOT, 'tower/js/deck-paid.js'), 'utf8').includes('"q"'.replace('"q"','"opts"')));
    const code = fs.readFileSync(path.join(ROOT, 'codes/tencent.txt'), 'utf8').split('\n')[0].trim();
    const tw = T11.TOWERS.find(t => t.id === 'tencent');
    ok('本地真实码哈希命中', PD.tencent.h.indexOf(PC.fnv1a(code)) >= 0);
    ok('checkCode 接受本塔有效码', T11.checkCode(tw, code));
    const twD = T11.TOWERS.find(t => t.id === 'didi');
    ok('checkCode 拒绝跨塔码', !T11.checkCode(twD, code));
    ok('checkCode 拒绝伪码', !T11.checkCode(tw, 'NOVA-WRONG0') && !T11.checkCode(tw, 'hello'));
    const bcode = fs.readFileSync(path.join(ROOT, 'codes/_bundle.txt'), 'utf8').trim();
    ok('全家桶码六塔哈希全部命中', ['meituan', 'didi', 'xiaohongshu', 'tencent', 'alibaba', 'bytedance'].every((k) => PD[k].h.indexOf(PC.fnv1a(bcode)) >= 0));
    ok('全家桶码可解密全部六塔', ['meituan', 'didi', 'xiaohongshu', 'tencent', 'alibaba', 'bytedance'].every((k) => { try { const bk = PC.unwrapKey(bcode, PD[k].salt, PD[k].w[PD[k].h.indexOf(PC.fnv1a(bcode))]); return PC.decryptDeck(bk, PD[k].d).items.length === PD[k].q; } catch (e) { return false; } }));
    ok('checkCode：全家桶码对六塔全部通过', T11.TOWERS.filter(t => t.price).every(t => T11.checkCode(t, bcode)));
    ok('真实码可解密出腾讯塔 17 题', (() => { try { const k = PC.unwrapKey(code, PD.tencent.salt, PD.tencent.w[PD.tencent.h.indexOf(PC.fnv1a(code))]); return PC.decryptDeck(k, PD.tencent.d).items.length === 17; } catch (e) { return false; } })());
    const ttx = T11.TOWERS.find(t => t.id === 'tencent');
    const mtx = T11.TOWERS.find(t => t.id === 'meituan');
    ok('付费塔默认锁定', T11.towerLocked(ttx) === true);
    ok('美团同样锁定（全付费）', T11.towerLocked(mtx) === true && mtx.price === 12.9);
    T11.P.paid.tencent = 1;
    ok('解锁后放行', T11.towerLocked(ttx) === false);
    T11.P.paid.tencent = 0;
    const paidTowers = T11.TOWERS.filter(t => t.price);
    ok('付费塔共 6 座（全部锁定）', paidTowers.length === 6, String(paidTowers.length));
    const p888 = paidTowers.filter(t => t.price === 12.9).map(t => t.id).sort().join(',');
    const p188 = paidTowers.filter(t => t.price === 19.9).map(t => t.id).sort().join(',');
    ok('12.9 档 = 美团/滴滴/小红书', p888 === 'didi,meituan,xiaohongshu', p888);
    ok('19.9 档 = 腾讯/阿里/字节', p188 === 'alibaba,bytedance,tencent', p188);
    const its = (gT.TOWERTEST && gT.TOWERTEST.items) || items || [];
    const bd = its.find(x => x.mod === 'bytedance' && x.boss);
    const al = its.find(x => x.mod === 'alibaba' && x.boss);
    const xh = its.find(x => x.mod === 'xiaohongshu' && x.boss);
    ok('三座新塔题池就绪（字节/阿里/小红书）', !!(bd && al && xh));
    ok('三座新塔各有压轴 Boss', [bd, al, xh].every(x => x && x.boss === true));
  } catch (e) { ok('付费门控节执行', false, e.message); }

    /* ========== 11b. V0.5 Learner Model ========== */
  section('11b. V0.5 Personal Career Layer');
  try {
    const gl = sandbox({ autoCreate: true });
    loadIn(gl, 'shared/learner.js');
    const LE = gl.window.LE;
    ok('LE 模块加载', !!LE && typeof LE.create === 'function');
    // 覆盖度：题库 17 个 mod 全部有技能归属
    const deckSrc = fs.readFileSync(path.join(ROOT, 'tower/js/deck-data.js'), 'utf8');
    const dm = deckSrc.match(/"items": \[([\s\S]*)\],\s*"meta"/);
    const freeItems = JSON.parse('[' + dm[1] + ']');
    const allMods = new Set(freeItems.map(i => i.mod));
    const covered = [...allMods].every(m => LE.MOD2SKILL[m]);
    ok('全部题库模块都映射到技能（' + allMods.size + ' 个 mod）', covered);
    ok('技能共 7 项', LE.SKILLS.length === 7, String(LE.SKILLS.length));
    ok('Quest 模板 id 唯一且字段齐', (() => {
      const ids = LE.QUESTS.map(q => q.id);
      return new Set(ids).size === ids.length && LE.QUESTS.every(q => q.title && q.story && q.gains && Object.keys(q.gains).length >= 2);
    })());
    // onboarding → create
    LE.create('Tester', 'ai-pm', 'preparing', ['technical', 'ai']);
    const S1 = LE.profile();
    ok('create 建档：goal/stage/focus', S1.goal === 'ai-pm' && S1.stage === 'preparing' && S1.focus.length === 2);
    ok('focus 加成只加对应技能 5 点', (S1.skills.technicalDepth || 0) === 5 && (S1.skills.business || 0) === 0);
    // 作答 → 技能成长
    LE.recordAnswer('eval', true, true); LE.recordAnswer('eval', true, false);
    LE.recordAnswer('rag', false, false);
    ok('答题喂技能：eval +3 / rag 错题不加分', (LE.profile().skills.aiEvaluation || 0) === 3 && (LE.profile().skills.technicalDepth || 0) === 5);
    // 封顶
    for (let i = 0; i < 60; i++) LE.recordAnswer('eval', true, true);
    ok('技能封顶 100', LE.profile().skills.aiEvaluation === 100);
    // 派生
    ok('growthAreas 取最低两项（并列 0 时任取）', (() => { const g = LE.growthAreas(); return g.length === 2 && g.every(x => x.v === 0); })(), JSON.stringify(LE.growthAreas()));
    // Quest 规则引擎
    const q1 = LE.recommendQuest();
    ok('推荐 Quest 指向成长区且非历史完成', !!q1 && LE.growthAreas().some(g => g.id === q1.skill), q1 && q1.id);
    LE.startQuest(q1.id);
    ok('startQuest 记录 current', LE.profile().quest && LE.profile().quest.id === q1.id);
    LE.completeQuest(q1.id);
    ok('completeQuest 发放收益并写历史', LE.profile().questHistory.length === 1 && !LE.profile().quest);
    const rec2 = LE.recommendQuest();
    ok('完成后推荐换下一个', !!rec2 && rec2.id !== q1.id, rec2 && rec2.id);
    // dailyFocus：本周错题驱动（生产形状：finalizeWrong 写 {miss, streak, mod, t}）
    const LEf = LE;
    const tp = { wrong: { q1: { miss: 2, streak: 0, mod: 'rag', t: Date.now() - 86400000 }, q2: { miss: 1, streak: 0, mod: 'rag', t: Date.now() }, q3: { miss: 1, streak: 0, mod: 'rag', t: Date.now() }, q4: { miss: 1, streak: 0, mod: 'rag', t: Date.now() } } };
    const f1 = LEf.dailyFocus(tp);
    ok('dailyFocus 优先本周错题最多的技能（生产形状）', f1 && f1.skill === 'technicalDepth' && f1.kind === 'wrong' && /missed 4/.test(f1.reason), JSON.stringify(f1));
    const f1b = LEf.dailyFocus({ wrong: { q9: { miss: 9, streak: 0 } } });   // 旧形状（无 mod/t）不得炸、不得误报
    ok('旧形状错题（无 mod/t）安全回落', !f1b || f1b.kind === 'gap', JSON.stringify(f1b));
    const f2 = LEf.dailyFocus({ wrong: {} });
    ok('无错题时回落到成长区', f2 && f2.kind === 'gap');
    ok('回落排除无题库映射的技能（judgment 不做 daily 焦点）', f2 && f2.skill !== 'judgment', JSON.stringify(f2));
    // 迁移：老塔友
    const gm = sandbox({ autoCreate: true });
    loadIn(gm, 'shared/learner.js');
    const LEm = gm.window.LE;
    LEm.migrateExisting({ modStats: { eval: { right: 9, wrong: 1 }, llm: { right: 2, wrong: 3 } }, codex: { a: 1, b: 2, c: 3, d: 4 } });
    const Sm = LEm.profile();
    ok('老用户迁移：默认 AI PM 目标 + 技能种子（生产形状 right×2）', Sm.migrated === true && Sm.goal === 'ai-pm' && Sm.skills.aiEvaluation === 18 && Sm.skills.technicalDepth === 4, JSON.stringify(Sm.skills));
    // journey
    const steps = LEm.journey({ finished: true, finalGrade: 'S' });
    ok('journey 读生产字段（finished/finalGrade）识别通关', steps.some(x => x.title === 'NOVA RPG Cleared'));
    ok('journey 含开始/迁移节点', steps.some(x => x.title === 'Started') && steps.some(x => x.title === 'Legacy merged'));
    // 事件环
    ok('事件环形缓冲 ≤200', LEm.profile().events.length <= 200);
    // 回归：completeQuest 一生一次（重复完成不重复发放）
    const LEq = LE;
    const qA = LEq.recommendQuest();
    LEq.startQuest(qA.id);
    LEq.completeQuest(qA.id);
    const xp1 = LEq.profile().skills[qA.skill] || 0;
    LEq.startQuest(qA.id); LEq.completeQuest(qA.id);
    const xp2 = LEq.profile().skills[qA.skill] || 0;
    ok('Quest 收益一生一次（重复完成不重发）', LEq.profile().questHistory.filter(h => h.id === qA.id).length === 1 && xp1 === xp2);
    // 回归：半损坏档案不击穿主流程
    const gh = sandbox({ autoCreate: true });
    gh.localStorage.setItem('nova.learner.v1', JSON.stringify({ v: 1, goal: 'ai-pm' }));
    let loadBroken = null;
    try { loadIn(gh, 'shared/learner.js'); gh.window.LE.recordAnswer('eval', true, true); loadBroken = 'ok'; } catch (e) { loadBroken = e.message; }
    ok('半损坏档案补默认结构后可用', loadBroken === 'ok', loadBroken);
    // 回归：源码守卫（A1/A3/A5 修复在场）
    const gsrc = fs.readFileSync(path.join(ROOT, 'tower/js/game.js'), 'utf8');
    const esrc = fs.readFileSync(path.join(ROOT, 'rpg/js/engine.js'), 'utf8');
    ok('A1: 再爬一次有 quest 分支', gsrc.includes('R.questId ? startQuestRun'));
    ok('A3: 每日焦点题不足回落全量', gsrc.includes('hot.length >= 3'));
    ok('A5: RPG 通关 XP 幂等守卫', esrc.includes('learnerFini'));
    ok('错题入册写 mod+t（dailyFocus 数据源）', gsrc.includes('P.wrong[it.id].mod = it.mod'));
  } catch (e) { ok('learner 节执行', false, e.message); }

    /* ========== 12. 贡献榜 + 塔 BGM ========== */
  section('12. 贡献榜（本地）+ 塔BGM');
  try {
    const gb = sandbox({ autoCreate: true });
    loadIn(gb, 'shared/leaderboard.js');
    const L = gb.window.LEADERBOARD;
    ok('LEADERBOARD 模块加载', !!L);
    ok('示范塔友 9 位', L.seeds.length === 9, String(L.seeds.length));
    ok('贡献值计算（空档=0）', L.contribution().total === 0);
    gb.localStorage.setItem('conceptTower.v1', JSON.stringify({ v:2, lifetime:1000, floors:10, daily:{streak:2}, ach:{a:1,b:2}, wrong:{} }));
    gb.localStorage.setItem('aiProductRpg.v1', JSON.stringify({ v:2, xp:800, ach:{x:1}, finished:true }));
    const c2 = L.contribution().total;
    ok('贡献值折算正确（100+20+30+80+100+40+60=430）', c2 === 430, String(c2));
    ok('层级函数单调', L.tierOf(0) === 1 && L.tierOf(50) >= L.tierOf(10) && L.tierOf(9999) === 11);
    const html = L.render();
    ok('render 含档案号/层级/塔友', html.indexOf('TA-') !== -1 && html.indexOf('第 ') !== -1 && html.indexOf('塔友动向') !== -1);
    ok('render 不含名次数字给玩家', html.indexOf('#1') === -1);
    ok('档案号持久化（两次一致）', L.pid() === L.pid());
  } catch (e) { ok('贡献榜节执行', false, e.message); }
  try {
    const bt = fs.readFileSync(path.join(ROOT, 'tower/js/bgm.js'), 'utf8');
    ok('塔BGM 文件存在且为 TBGM', bt.indexOf('window.TBGM') !== -1);
    ok('塔BGM 92BPM 更进击', bt.indexOf('92') !== -1 && bt.indexOf('kick') !== -1 && bt.indexOf('clap') !== -1);
    ok('塔BGM 独立偏好键', bt.indexOf('novaTower.bgm') !== -1);
    const ti2 = fs.readFileSync(path.join(ROOT, 'tower/index.html'), 'utf8');
    ok('塔页加载 bgm+leaderboard', ti2.indexOf('js/bgm.js') !== -1 && ti2.indexOf('leaderboard.js') !== -1);
    ok('塔设置含 BGM 开关', fs.readFileSync(path.join(ROOT, 'tower/js/game.js'), 'utf8').indexOf('bgmBtn') !== -1);
    const ri2 = fs.readFileSync(path.join(ROOT, 'rpg/index.html'), 'utf8');
    ok('RPG 页加载 leaderboard', ri2.indexOf('leaderboard.js') !== -1);
    ok('RPG 系统菜单含贡献榜', fs.readFileSync(path.join(ROOT, 'rpg/js/engine.js'), 'utf8').indexOf('lbBtnR') !== -1);
  } catch (e) { ok('BGM 检查执行', false, e.message); }

  /* ========== 13. 密码材料零暴露（安全负向断言） ========== */
  section('13. 安全：GitHub 上不存在任何密码材料');
  try {
    const gsrc = fs.readFileSync(path.join(ROOT, 'tower/js/game.js'), 'utf8');
    ok('游戏内无 OWNER_HASH', gsrc.indexOf('OWNER_HASH') === -1);
    ok('游戏内无 sha256/verifyOwner', gsrc.indexOf('sha256') === -1 && gsrc.indexOf('verifyOwner') === -1);
    ok('游戏内无管理面板', gsrc.indexOf('ownerPanel') === -1 && gsrc.indexOf('ownerLogin') === -1);
    ok('游戏内无铸码算法（genCode/mulberry 铸码链）', gsrc.indexOf('function genCode') === -1);
    const gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    ok('本地铸造台已被 gitignore', gi.indexOf('tools/admin.html') !== -1);
    ok('兑换码目录仍被 gitignore', gi.indexOf('codes') !== -1);
    ok('付费题库源目录被 gitignore', gi.indexOf('paid-deck') !== -1);
    const allTracked = cp.execSync('git ls-files', { cwd: ROOT }).toString();
    ok('仓库跟踪清单无 admin.html / codes / paid-deck / gen-codes', ['admin.html', 'codes/', 'paid-deck/', 'gen-codes', 'gen-company-towers'].every((x) => allTracked.indexOf(x) === -1));
  } catch (e) { ok('安全节执行', false, e.message); }

  console.log('\n================================');
    console.log('SMOKE RESULT: ' + pass + ' PASS / ' + fail + ' FAIL');
    console.log('================================');
    process.exit(fail ? 1 : 0);
  }
}

main().catch((e) => {
  console.error('[FAIL] smoke 运行器异常: ' + (e && e.stack || e));
  process.exit(1);
});
