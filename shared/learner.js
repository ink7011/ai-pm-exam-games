/* NOVA Learner Model · V0.5 Personal Career Layer
   零依赖纯 JS。localStorage: nova.learner.v1
   职责：成长档案(goal/stage/skills) · 事件记录(analytics-ready) · 规则引擎(quest/daily focus) · 老用户迁移
   原则：Adaptive ≠ AI-generated；先用规则系统验证 Personalization → engagement。 */
(function () {
  'use strict';
  var KEY = 'nova.learner.v1';
  var EVMAX = 200;

  /* 16 个题库模块 → 7 项高层技能（复用现有 taxonomy，不另起炉灶） */
  var MOD2SKILL = {
    ml: 'aiFundamentals', dl: 'aiFundamentals', nlp: 'aiFundamentals', cv: 'aiFundamentals',
    mm: 'aiFundamentals', terms: 'aiFundamentals',
    llm: 'technicalDepth', infer: 'technicalDepth', infra: 'technicalDepth',
    rag: 'technicalDepth', agent: 'technicalDepth',
    eval: 'aiEvaluation',
    prod: 'productSense', boss: 'productSense',
    biz: 'business', rec: 'business',
    ops: 'growth'
  };
  var SKILLS = [
    { id: 'aiFundamentals', name: 'AI Fundamentals', zh: 'AI 基础' },
    { id: 'technicalDepth', name: 'Technical Depth', zh: '技术深度' },
    { id: 'aiEvaluation', name: 'AI Evaluation', zh: 'AI 评估' },
    { id: 'productSense', name: 'Product Sense', zh: '产品感' },
    { id: 'business', name: 'Business', zh: '商业' },
    { id: 'growth', name: 'Growth / GTM', zh: '增长' },
    { id: 'judgment', name: 'Product Judgment', zh: '判断力' }
  ];
  var SKILL_NAME = {}; SKILLS.forEach(function (s) { SKILL_NAME[s.id] = s; });

  var GOALS = [
    { id: 'ai-pm', label: 'AI Product Manager', zh: '成为 AI 产品经理' },
    { id: 'ai-ops', label: 'AI Product / Growth', zh: 'AI 产品运营/增长' },
    { id: 'engineer', label: 'AI Engineer', zh: 'AI 工程师' },
    { id: 'founder', label: 'Founder', zh: '创业者' },
    { id: 'other', label: 'Exploring for now', zh: '还在探索' }
  ];
  var STAGES = [
    { id: 'exploring', label: 'Exploring', zh: '在探索' },
    { id: 'preparing', label: 'Preparing', zh: '在准备' },
    { id: 'interviewing', label: 'Interviewing', zh: '在面试' },
    { id: 'starting', label: 'Starting', zh: '刚入行' },
    { id: 'growing', label: 'Growing', zh: '在成长' }
  ];
  var FOCUS_AREAS = [
    { id: 'ai', label: 'AI', skill: 'aiFundamentals' },
    { id: 'product', label: 'Product', skill: 'productSense' },
    { id: 'technical', label: 'Technical', skill: 'technicalDepth' },
    { id: 'business', label: 'Business', skill: 'business' },
    { id: 'growth', label: 'Growth', skill: 'growth' }
  ];

  /* Quest 模板库：每个技能一个叙事化任务（规则引擎，无 LLM） */
  var QUESTS = [
    { id: 'q-eval', skill: 'aiEvaluation', mods: ['eval'], tower: 'evalx', title: 'The Evaluation Problem', zh: '评估迷局', story: 'Your AI product is producing impressive demos, but users report inconsistent answers. What do you do next?', gains: { aiEvaluation: 3, productSense: 2 } },
    { id: 'q-rag', skill: 'technicalDepth', mods: ['rag'], tower: 'rag', title: 'The Hallucination Problem', zh: '幻觉风暴', story: 'The demo was flawless. In production, your AI started making things up with total confidence. Trace the root cause.', gains: { technicalDepth: 3, aiEvaluation: 2 } },
    { id: 'q-agent', skill: 'technicalDepth', mods: ['agent'], tower: 'agent', title: 'The Agent That Broke Prod', zh: 'Agent 失控夜', story: 'Your agent looped, called the wrong tool twice, and happily reported success. Design the guardrails.', gains: { technicalDepth: 3, aiFundamentals: 2 } },
    { id: 'q-base', skill: 'aiFundamentals', mods: ['ml', 'dl'], tower: 'base', title: 'Foundation Check', zh: '地基巡检', story: 'Before you argue about LLMs, prove you still own the classics: bias/variance, overfitting, embeddings.', gains: { aiFundamentals: 3, technicalDepth: 2 } },
    { id: 'q-metric', skill: 'productSense', mods: ['prod', 'boss'], tower: 'pob', title: 'The Metric Trap', zh: '指标陷阱', story: 'DAU is up, the CEO is smiling, and something is deeply wrong. Find the vanity metric.', gains: { productSense: 3, business: 2 } },
    { id: 'q-biz', skill: 'business', mods: ['biz', 'rec'], tower: 'rec', title: 'Unit Economics', zh: '单位经济学', story: 'Your CTR model is a masterpiece. The business is still bleeding. Connect model metrics to money.', gains: { business: 3, productSense: 2 } },
    { id: 'q-growth', skill: 'growth', mods: ['ops'], tower: 'pob', title: 'The Activation Gap', zh: '激活鸿沟', story: 'A/B test won, retention did not move. Diagnose the funnel like an operator.', gains: { growth: 3, business: 2 } },
    { id: 'q-judgment', skill: 'judgment', mods: [], tower: null, kind: 'rpg', title: 'Ten Weeks at NOVA·AI', zh: 'NOVA 十周试用期', story: 'The Tower trains memory. Judgment is earned in the field: live one probation quarter as an AI PM.', gains: { judgment: 4, productSense: 2 } }
  ];

  var LEVELS = ['Aspirant', 'Learner', 'Apprentice', 'Builder', 'Product Builder', 'Senior Builder', 'Lead Builder', 'Architect', 'Veteran', 'Master', 'AI PM Ready'];

  /* ---------- 存取 ---------- */
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.v === 1 && s.goal) {
        var b = blank();                       // 半损坏存档补默认结构，防 recordAnswer/track 炸主流程
        b.skills = b.skills || {};
        ['questHistory', 'events', 'focus'].forEach(function (k) { if (!Array.isArray(s[k])) s[k] = b[k]; });
        if (!s.skills || typeof s.skills !== 'object') s.skills = b.skills;
        SKILLS.forEach(function (sk) { if (typeof s.skills[sk.id] !== 'number' || !isFinite(s.skills[sk.id])) s.skills[sk.id] = 0; });
        if (!s.quest || typeof s.quest !== 'object') s.quest = null;
        return s;
      }
    } catch (e) {}
    return null;
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var S = load();

  function blank() {
    return {
      v: 1, name: '', goal: '', goalLabel: '', stage: '', focus: [],
      skills: {}, quest: null, questHistory: [], events: [],
      createdAt: Date.now(), lastActive: Date.now(),
      migrated: false, onboarded: false, firstVisit: Date.now()
    };
  }
  function touch() { if (S) { S.lastActive = Date.now(); save(S); } }

  /* ---------- 事件（analytics-ready：留 NOVA_ANALYTICS 适配口） ---------- */
  function track(evt, data) {
    if (window.NOVA_ANALYTICS) { try { window.NOVA_ANALYTICS(evt, data || {}); } catch (e) {} }
    if (!S) return;
    S.events.push({ e: evt, t: Date.now(), d: data || {} });
    if (S.events.length > EVMAX) S.events = S.events.slice(-EVMAX);
    save(S);
  }

  /* ---------- 技能值 ---------- */
  function cap(v) { return Math.max(0, Math.min(100, Math.round(v))); }
  function addXp(skill, n) {
    if (!S) return;
    S.skills[skill] = cap((S.skills[skill] || 0) + n);
    save(S);
  }
  function skillOf(mod) { return MOD2SKILL[mod] || 'aiFundamentals'; }
  function recordAnswer(mod, correct, firstTry) {
    if (!S) return;
    var sk = skillOf(mod);
    if (correct) addXp(sk, firstTry ? 2 : 1);
    track(correct ? 'questionAnswered' : 'questionWrong', { mod: mod, skill: sk });
  }
  function recordShadow(mod) { track('shadowTriggered', { mod: mod, skill: skillOf(mod) }); }
  function recordRpgEvent(kind) {
    if (!S) return;
    if (kind === 'chapter') addXp('judgment', 2);
    if (kind === 'finished') addXp('judgment', 6);
    track('rpgMilestone', { kind: kind });
  }

  /* ---------- 派生：强项/成长区/等级 ---------- */
  function ranked() {
    return SKILLS.map(function (s) { return { id: s.id, name: s.name, zh: s.zh, v: S ? (S.skills[s.id] || 0) : 0 }; })
      .sort(function (a, b) { return b.v - a.v; });
  }
  function strengths() { var r = ranked(); return r.filter(function (x) { return x.v >= 30; }).slice(0, 2); }
  function growthAreas() { var r = ranked().slice().reverse(); return r.filter(function (x) { return x.v < 70; }).slice(0, 2); }
  function level() {
    if (!S) return 0;
    var vals = SKILLS.map(function (s) { return S.skills[s.id] || 0; });
    var avg = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    return Math.min(10, Math.floor(avg / 10));
  }
  function levelTitle() { return LEVELS[level()]; }

  /* ---------- Quest 规则引擎 ---------- */
  function recommendQuest() {
    if (!S) return null;
    var done = {}; (S.questHistory || []).forEach(function (q) { done[q.id] = q.t; });
    var pool = QUESTS.filter(function (q) { return !done[q.id]; });
    if (!pool.length) pool = QUESTS.slice();
    // 规则：成长区技能优先；同分取历史完成最少的
    var g = growthAreas().map(function (x) { return x.id; });
    var best = null, bestScore = -1;
    pool.forEach(function (q) {
      var sc = g.indexOf(q.skill) >= 0 ? 100 - (S.skills[q.skill] || 0) : 40 - (S.skills[q.skill] || 0) * 0.5;
      if (sc > bestScore) { bestScore = sc; best = q; }
    });
    return best;
  }
  function currentQuest() {
    if (S && S.quest && S.quest.id) {
      var tpl = QUESTS.filter(function (q) { return q.id === S.quest.id; })[0];
      if (tpl) return tpl;
    }
    return recommendQuest();
  }
  function startQuest(qid) {
    if (!S) return null;
    var tpl = QUESTS.filter(function (q) { return q.id === qid; })[0];
    if (!tpl) return null;
    S.quest = { id: tpl.id, started: Date.now() };
    save(S); track('questStarted', { id: tpl.id });
    return tpl;
  }
  function completeQuest(qid) {
    if (!S) return null;
    var tpl = QUESTS.filter(function (q) { return q.id === qid; })[0];
    if (!tpl) return null;
    if (S.questHistory.some(function (h) { return h.id === qid; })) { if (S.quest && S.quest.id === qid) S.quest = null; return tpl; }  // 已完成过：只清 current，不重复发放
    if (S.quest && S.quest.id === qid) S.quest = null;
    S.questHistory.push({ id: qid, t: Date.now() });
    var gains = tpl.gains || {};
    Object.keys(gains).forEach(function (k) { addXp(k, gains[k]); });
    save(S); track('questCompleted', { id: qid, gains: gains });
    return tpl;
  }
  function questWhy(q) {
    if (!S || !q) return '';
    var cur = S.skills[q.skill] || 0;
    return 'Your ' + (SKILL_NAME[q.skill] || {}).name + ' is at ' + cur + ' — below your target level for ' + (S.goalLabel || 'your goal') + '.';
  }

  /* ---------- Adaptive Daily：今日焦点（规则引擎） ---------- */
  function dailyFocus(towerP) {
    if (!S) return null;
    // 优先：本周错题最多的技能（数据来自塔的错题本）
    var wrongBySkill = {};
    try {
      var now = Date.now();
      Object.keys((towerP && towerP.wrong) || {}).forEach(function (qid) {
        var w = towerP.wrong[qid] || {};
        var mod = w.mod;                        // 生产形状：finalizeWrong 写入 {miss, streak, mod, t}
        if (!mod) return;
        var ageDays = w.t ? (now - w.t) / 86400000 : 99;
        if (ageDays > 7) return;
        var sk = skillOf(mod);
        wrongBySkill[sk] = (wrongBySkill[sk] || 0) + 1;
      });
    } catch (e) {}
    var bestWrong = null, n = 0;
    Object.keys(wrongBySkill).forEach(function (k) { if (wrongBySkill[k] > n) { n = wrongBySkill[k]; bestWrong = k; } });
    if (bestWrong && n >= 3) {
      return { skill: bestWrong, reason: 'You missed ' + n + ' ' + (SKILL_NAME[bestWrong] || {}).name + ' questions this week.', kind: 'wrong' };
    }
    var hasMods = {}; Object.keys(MOD2SKILL).forEach(function (m) { hasMods[MOD2SKILL[m]] = true; });
    var g = growthAreas().filter(function (x) { return hasMods[x.id]; });  // judgment 等无题库映射的技能不参与 daily 聚焦
    if (g.length) return { skill: g[0].id, reason: (SKILL_NAME[g[0].id] || {}).name + ' is one of your current growth areas.', kind: 'gap' };
    return null;
  }

  /* ---------- Career Journey（真实事件推导，无虚构） ---------- */
  function journey(rpgSave) {
    if (!S) return [];
    var steps = [];
    steps.push({ t: S.createdAt, title: 'Started', zh: '旅程开始', desc: (S.goalLabel || 'Goal set') + ' · ' + (S.stage || '') });
    if (S.migrated) steps.push({ t: S.createdAt, title: 'Legacy merged', zh: '试炼记录并入', desc: 'Your tower history seeded this profile.' });
    (S.questHistory || []).slice(0, 3).forEach(function (q, i) {
      var tpl = QUESTS.filter(function (x) { return x.id === q.id; })[0];
      if (tpl) steps.push({ t: q.t, title: 'Quest · ' + tpl.zh, zh: '任务 · ' + tpl.zh, desc: tpl.title });
    });
    SKILLS.forEach(function (s) {
      var v = S.skills[s.id] || 0;
      if (v >= 40) steps.push({ t: null, title: s.name + ' ≥ 40', zh: s.zh + ' 觉醒', desc: s.name + ' reached ' + v });
    });
    var rpgDone = !!(rpgSave && (rpgSave.finished || rpgSave.finalGrade));
    if (rpgDone) steps.push({ t: null, title: 'NOVA RPG Cleared', zh: 'RPG 通关', desc: 'Season 1 complete' + (rpgSave.finalGrade ? ' · Grade ' + rpgSave.finalGrade : '') });
    var core = ['productSense', 'aiFundamentals', 'technicalDepth', 'aiEvaluation'];
    var sum = 0; core.forEach(function (k) { sum += (S.skills[k] || 0); });
    if (sum / core.length >= 70 && rpgDone) {
      steps.push({ t: null, title: 'AI PM READY', zh: 'AI PM 就绪', desc: 'Core skills ≥ 70 · RPG cleared', final: true });
    } else {
      steps.push({ t: null, title: 'Next: AI PM Ready', zh: '下一站：AI PM Ready', desc: 'Core skills avg ' + Math.round(sum / core.length) + ' / 70 · RPG ' + (rpgDone ? '✓' : '—'), pending: true });
    }
    return steps.sort(function (a, b) { return (a.t || 9e15) - (b.t || 9e15); });
  }

  /* ---------- Onboarding / 迁移 ---------- */
  function needsOnboarding() { return !S; }
  function create(name, goalId, stageId, focusIds) {
    var g = GOALS.filter(function (x) { return x.id === goalId; })[0] || GOALS[0];
    S = blank();
    S.name = String(name || '').trim().slice(0, 24);
    S.goal = g.id; S.goalLabel = g.label;
    S.stage = stageId; S.focus = focusIds || [];
    SKILLS.forEach(function (s) { S.skills[s.id] = 0; });
    // focus 区给 5 点起步加成（表达"你想加强什么"）
    (focusIds || []).forEach(function (fid) {
      var f = FOCUS_AREAS.filter(function (x) { return x.id === fid; })[0];
      if (f) S.skills[f.skill] = cap((S.skills[f.skill] || 0) + 5);
    });
    S.onboarded = true;
    save(S); track('onboardingCompleted', { goal: g.id, stage: stageId, focus: focusIds });
    return S;
  }
  /* 老用户：已有塔记录但没有档案 → 用 modStats/codex/wrong 无感建档 */
  function migrateExisting(towerP) {
    if (S || !towerP) return null;
    S = blank();
    S.name = ''; S.goal = 'ai-pm'; S.goalLabel = 'AI Product Manager'; S.stage = 'preparing';
    S.migrated = true; S.onboarded = true;
    SKILLS.forEach(function (s) { S.skills[s.id] = 0; });
    var seeds = {};
    var ms = towerP.modStats || {};
    Object.keys(ms).forEach(function (mod) {
      var st = ms[mod] || {};
      var right = (st.right || 0);              // 生产形状：bumpMod 写 {right, wrong}
      if (right > 0) { var sk = skillOf(mod); seeds[sk] = (seeds[sk] || 0) + right * 2; }
    });
    Object.keys(seeds).forEach(function (k) { S.skills[k] = cap(seeds[k]); });
    save(S); track('profileMigrated', { seeded: Object.keys(seeds).length });
    return S;
  }
  function profile() { return S; }

  /* ---------- 生命周期 ---------- */
  var _dayKey = '';
  function tick() {
    if (!S) return;
    var d = new Date(); var k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    if (k !== _dayKey) {
      _dayKey = k;
      var evs = S.events || [];
      var had = evs.some(function (e) { return e.e === 'sessionStarted' && new Date(e.t).toDateString() === d.toDateString(); });
      if (!had) track('sessionStarted', {});
    }
    touch();
  }

  /* ---------- 挂载 ---------- */
  window.LE = {
    MOD2SKILL: MOD2SKILL, SKILLS: SKILLS, GOALS: GOALS, STAGES: STAGES, FOCUS_AREAS: FOCUS_AREAS, QUESTS: QUESTS,
    needsOnboarding: needsOnboarding, create: create, migrateExisting: migrateExisting, profile: profile,
    track: track, tick: tick,
    recordAnswer: recordAnswer, recordShadow: recordShadow, recordRpgEvent: recordRpgEvent,
    addXp: addXp, skillOf: skillOf,
    strengths: strengths, growthAreas: growthAreas, ranked: ranked, level: level, levelTitle: levelTitle,
    recommendQuest: recommendQuest, currentQuest: currentQuest, startQuest: startQuest, completeQuest: completeQuest, questWhy: questWhy,
    dailyFocus: dailyFocus, journey: journey
  };
})();
