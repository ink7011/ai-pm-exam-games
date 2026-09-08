/**
 * NOVA 概念试炼塔 · 小程序版核心逻辑（DOM-free，供 pages 调用）
 * 与 web 版 tower/js/game.js 同源规则：爬塔 / 暗影复仇 / 道具 / 段位
 */
const D = require('../data/deck.js');

const RUN_LEN = 15, ELITE_FLOORS = [5, 10], MAX_HP = 5;

const ITEMS = [
  { id: 'fifty', name: '50/50', desc: '排除两个错误选项', cost: 30 },
  { id: 'hint', name: '考点提示', desc: '显示本题考点与优先级', cost: 20 },
  { id: 'potion', name: '药水', desc: '恢复 1 点生命（上限 ' + MAX_HP + '）', cost: 45 },
  { id: 'retry', name: '复查券', desc: '答错后免伤重答一次', cost: 35 },
  { id: 'hourglass', name: '沙漏', desc: '精英层限时 +15 秒', cost: 25 }
];

const TOWERS = [
  { id: 'mix', name: '混合乱斗塔', desc: '全部 335 题 · 每局随机 15 层', mods: null, group: 'basic' },
  { id: 'llm', name: 'LLM 训练塔', desc: '预训练 / SFT / RLHF / DPO', mods: ['llm'], group: 'basic' },
  { id: 'infer', name: '推理与成本塔', desc: 'KV Cache / 量化 / TTFT', mods: ['infer'], group: 'basic' },
  { id: 'rag', name: 'RAG 高塔', desc: '检索 / 重排 / 幻觉 / Hybrid', mods: ['rag'], group: 'basic' },
  { id: 'agent', name: 'Agent 堡垒', desc: '工具 / 规划 / 记忆 / MCP', mods: ['agent'], group: 'basic' },
  { id: 'base', name: '地基塔', desc: 'ML / DL / NLP / CV 基础', mods: ['ml', 'dl', 'nlp', 'cv'], group: 'basic' },
  { id: 'rec', name: '推荐广告塔', desc: 'CTR / CVR / MMoE / ESMM', mods: ['rec'], group: 'basic' },
  { id: 'infra', name: 'Infra 塔', desc: 'DP / TP / PP / ZeRO', mods: ['infra'], group: 'basic' },
  { id: 'evalx', name: '评估塔', desc: '指标 / LLM-as-Judge / Badcase', mods: ['eval'], group: 'basic' },
  { id: 'pob', name: '产品商业塔', desc: '产品 / 运营 / 商业 / 多模态', mods: ['prod', 'ops', 'biz', 'mm'], group: 'basic' },
  { id: 'terms', name: '术语深化塔', desc: 'RPG 术语表 94 词 · 正反双向', mods: ['terms'], group: 'basic' },
  { id: 'meituan', name: '开水团模式塔', desc: '外卖/到店业务实战 A1-A20', mods: ['meituan'], group: 'company', price: 12.9 },
  { id: 'didi', name: '桔厂模式塔', desc: '出行供需 / 安全 / 客服案例', mods: ['didi'], group: 'company', price: 12.9 },
  { id: 'xiaohongshu', name: '薯厂模式塔', desc: '社区 AI · 真实经验 · 独立思考', mods: ['xiaohongshu'], group: 'company', price: 12.9 },
  { id: 'tencent', name: '鹅厂模式塔', desc: '素质测评风格 · 社交AI生态', mods: ['tencent'], group: 'company', price: 19.9 },
  { id: 'alibaba', name: '猫厂模式塔', desc: '电商 AI · 导购/搜索 · 价值观', mods: ['alibaba'], group: 'company', price: 19.9 },
  { id: 'bytedance', name: '宇宙厂模式塔', desc: '数据驱动 · 对话AI/低代码/实验', mods: ['bytedance'], group: 'company', price: 19.9 }
];

/* ---- 付费解锁（兑换码 · 与 web 端同算法同码） ---- */
function codeHash(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const PD = require('../data/deck-paid.js');
const PC = require('./paid-crypto.js');
function paidData(t) { return PD[t] || null; }
function checkCode(t, code) {
  var pd = paidData({ id: t });
  if (!pd) return false;
  code = String(code || '').trim().toUpperCase();
  if (code.indexOf('NOVA-') !== 0) return false;
  return pd.h.indexOf(PC.fnv1a(code)) >= 0;
}
function unlockPaid(t, code) {
  var pd = paidData({ id: t });
  if (!pd) return false;
  var idx = pd.h.indexOf(PC.fnv1a(code));
  if (idx < 0) return false;
  try {
    var key = PC.unwrapKey(code, pd.salt, pd.w[idx]);
    var deck = PC.decryptDeck(key, pd.d);
    wx.setStorageSync('paidDeck.' + t, { items: deck.items });
    deck.items.forEach(function (q) { D.items.push(q); });
    return true;
  } catch (e) { return false; }
}
function loadPaidCaches(P) {
  Object.keys(P.paid || {}).forEach(function (id) {
    if (!P.paid[id] || D.items.some(function (i) { return i.mod === id; })) return;
    try {
      var cached = wx.getStorageSync('paidDeck.' + id);
      if (cached && cached.items) cached.items.forEach(function (q) { D.items.push(q); });
    } catch (e) {}
  });
}
function paidQ(t) { var pd = paidData({ id: t }); return pd ? pd.q : 0; }
function towerLocked(t, P) { return !!(t && t.group === 'company' && t.price && !P.paid[t.id]); }

const RANKS = [[0, '见习生'], [1000, 'Product Associate'], [3000, 'AI Product Manager'], [7000, 'Senior AI PM'], [15000, 'Head of AI Product']];

const SAVE_KEY = 'conceptTower.v1';

function freshP() { return { lifetime: 0, best: {}, clear: {}, codex: {}, wrong: {}, modStats: {}, sound: true, paid: {} }; }
function loadP() {
  try {
    const p = wx.getStorageSync(SAVE_KEY);
    if (p && p.codex) return Object.assign(freshP(), p);
  } catch (e) { }
  return freshP();
}
function saveP(P) { try { wx.setStorageSync(SAVE_KEY, P); } catch (e) { } }

function shuffle(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = r[i]; r[i] = r[j]; r[j] = t; }
  return r;
}
const item = (id) => D.items.find(x => x.id === id);
const poolOf = (tower) => tower.mods ? D.items.filter(x => tower.mods.includes(x.mod)) : D.items.slice();

function buildRun(towerId, P) {
  const tower = TOWERS.find(t => t.id === towerId);
  const pool = poolOf(tower);
  const bosses = pool.filter(x => x.boss);
  const normals = pool.filter(x => !x.boss);
  const bossPool = bosses.length ? bosses : normals.filter(x => x.diff >= 3);
  const runLen = Math.min(RUN_LEN, Math.max(5, normals.length + 1));
  const elites = ELITE_FLOORS.filter(f => f < runLen - 1 && f % 5 === 0);
  const pick = shuffle(normals).slice(0, runLen - 1);
  const slots = pick.map((it, i) => {
    const fl = i + 1;
    return { itemId: it.id, kind: elites.includes(fl) ? 'elite' : 'normal', floor: fl };
  });
  const bossIt = bossPool.length ? shuffle(bossPool)[0] : shuffle(normals)[0];
  slots.push({ itemId: bossIt.id, kind: 'boss', floor: slots.length + 1 });
  // 暗影种子：跨局错题（限本塔题池）最多 2 个
  const pending = [];
  Object.keys(P.wrong).filter(id => {
    const it = item(id);
    return it && pool.includes(it) && !P.wrong[id].cleared;
  }).slice(0, 2).forEach((id, i) => pending.push({ id: id, at: 1 + i * 2 }));
  return { slots: slots, pending: pending };
}

function newRun(towerId, P) {
  const built = buildRun(towerId, P);
  return {
    towerId: towerId, hp: 3, coins: 20, combo: 0, maxCombo: 0,
    items: { fifty: 1, hint: 1, potion: 0, retry: 0, hourglass: 0 },
    pos: 0, slots: built.slots, pendingShadow: built.pending,
    score: 0, firstTry: 0, asked: 0, modRun: {}, done: false
  };
}

function rankInfo(P) {
  let cur = RANKS[0], next = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (P.lifetime >= RANKS[i][0]) cur = RANKS[i];
    else { next = RANKS[i]; break; }
  }
  return { cur, next };
}

function weakTip(P) {
  const rows = Object.keys(P.modStats).map(m => {
    const s = P.modStats[m];
    const total = s.right + s.wrong;
    return total >= 4 ? { m, acc: s.right / total, total } : null;
  }).filter(Boolean).sort((a, b) => a.acc - b.acc);
  if (!rows.length) return null;
  const t = TOWERS.find(t => t.mods && t.mods.length === 1 && t.mods[0] === rows[0].m);
  return { tower: t ? t.name : '混合乱斗塔', acc: Math.round(rows[0].acc * 100), total: rows[0].total };
}

/** 答对结算：返回 {coins, score, purify} 由页面渲染 */
function settleCorrect(R, enc, it, P) {
  R.asked++;
  bumpMod(R, P, it.mod, enc.wrongPicks.length === 0);
  if (enc.wrongPicks.length === 0) R.firstTry++;
  R.combo++; R.maxCombo = Math.max(R.maxCombo, R.combo);
  const mult = enc.kind === 'elite' ? 2 : 1;
  const coins = ((10 + Math.min(R.combo, 10) * 3) * mult) + (enc.kind === 'boss' ? 30 : 0) + (enc.kind === 'shadow' ? 5 : 0);
  const score = Math.round((100 + Math.min(R.combo * 10, 100)) * (enc.kind === 'elite' ? 1.5 : 1)) + (enc.kind === 'boss' ? 300 : 0);
  R.coins += coins; R.score += score;
  P.codex[it.id] = true;
  let purify = '';
  if (P.wrong[it.id]) {
    const w = P.wrong[it.id];
    w.streak = (w.streak || 0) + 1;
    if (w.streak >= 2) { delete P.wrong[it.id]; purify = 'clean'; }
    else purify = 'half';
  }
  saveP(P);
  return { coins, score, purify };
}

/** 答错结算 */
function settleWrong(R, enc, it, P) {
  R.asked++;
  bumpMod(R, P, it.mod, false);
  R.combo = 0; R.hp--;
  P.codex[it.id] = true;
  if (!P.wrong[it.id]) P.wrong[it.id] = { miss: 0, streak: 0 };
  P.wrong[it.id].miss++;
  P.wrong[it.id].streak = 0;
  R.pendingShadow.push({ id: it.id, at: R.pos + 1 + 3 });
  R.pendingShadow.sort((a, b) => a.at - b.at);
  saveP(P);
}

function bumpMod(R, P, mod, right) {
  if (!R.modRun[mod]) R.modRun[mod] = { right: 0, wrong: 0 };
  R.modRun[mod][right ? 'right' : 'wrong']++;
  if (!P.modStats[mod]) P.modStats[mod] = { right: 0, wrong: 0 };
  P.modStats[mod][right ? 'right' : 'wrong']++;
}

/** 结束一局：累计生涯积分 */
function finishRun(R, P) {
  if (R.done) return;
  R.done = true;
  P.lifetime += R.score;
  if (R.score > (P.best[R.towerId] || 0)) P.best[R.towerId] = R.score;
  saveP(P);
}

module.exports = {
  D, ITEMS, TOWERS, RANKS, RUN_LEN, ELITE_FLOORS, MAX_HP,
  freshP, loadP, saveP, item, poolOf, buildRun, newRun, rankInfo, weakTip,
  settleCorrect, settleWrong, finishRun,
  checkCode: checkCode,
  towerLocked: towerLocked,
  unlockPaid: unlockPaid,
  loadPaidCaches: loadPaidCaches,
  paidQ: paidQ
};
