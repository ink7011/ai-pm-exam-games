/* ============================================================
   AI PRODUCT RPG — 游戏引擎
   Build. Break. Fix. Ship.
   ============================================================ */
(function () {
  'use strict';
  const C = window.CONTENT;
  const SAVE_KEY = 'aiProductRpg.v1';
  const SIM = (window.CONTENT && window.CONTENT.SIM) || {};   // V0.6 票1：从 content.js 读配置
  const METRIC_DEFS = (SIM.metrics || []).map(m => [m.id, m.label].concat(m.reversed ? [true] : []));
  const LAYERS = ['Data', 'Model', 'Retrieval', 'Infra', 'Eval', 'Product', 'Growth', 'Business'];

  /* ---------------- state ---------------- */
  let S = null;
  let soundOn = true;

  function newState(name) {
    return {
      v: 2, started: true, name: name || 'Nova',
      role: 'Product Associate', xp: 0,
      company: Object.assign({}, (window.CONTENT && window.CONTENT.SIM && window.CONTENT.SIM.init) || { revenue: 58, users: 52, trust: 68, quality: 72, cost: 45, morale: 64 }),
      caseIdx: 0, phase: 'intro', roundIdx: 0,
      clues: [], roundPicked: [], roundWrong: 0, revealed: false, roundAttempted: false, potions: 0, roundsFirstTryThisCase: 0,
      marks: {}, echoDone: {},
      skills: [], errors: [], profile: {},
      stats: { firstTry: 0, total: 0, wrongTotal: 0, investLeftoverXp: 0 },
      bossVariants: [], bossVariantIdx: 0, finished: false, clock: 9 * 60,
      ach: {}, cleanStreak: 0, finalGrade: ''
    };
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
  // T6：v1 → v2 迁移（本轮为空实现 + 默认字段占位；后续结构变更在此追加）
  function migrateRpg(s) {
    if (!s) return s;
    if (!s.v || s.v < 2) s.v = 2;
    if (!s.stats) s.stats = { firstTry: 0, total: 0, wrongTotal: 0, investLeftoverXp: 0 };
    if (typeof s.potions !== 'number') s.potions = 0;
    if (!s.ach) s.ach = {};                                  // P2-1 成就 {id: 时间戳}
    if (typeof s.cleanStreak !== 'number') s.cleanStreak = 0; // P2-1 连续零失误章节
    if (typeof s.finalGrade !== 'string') s.finalGrade = '';  // P2-1 通关评级（跨游戏成就用）
    if (typeof s.learnerFini !== 'boolean') s.learnerFini = !!s.finished;  // V0.5：老通关档视为已发过（防重开页刷 XP）
    if (!s.profile) s.profile = {};                 // 老档兜底：调查点击依赖 S.profile（engine.js:383）
    if (!s.marks) s.marks = {};                     // V0.6：选择印记（世界记忆）
    if (!s.echoDone) s.echoDone = {};               // V0.6：回响已触发记录
    if (!s.bossVariants) s.bossVariants = [];
    if (typeof s.clock !== 'number') s.clock = 9 * 60;
    return s;
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (s && (s.v === 1 || s.v === 2) && s.started) return migrateRpg(s);
    } catch (e) {}
    return null;
  }
  function resetGame() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); }

  /* ---------------- tiny helpers ---------------- */
  const $ = (id) => document.getElementById(id);
  function h(tag, cls, html) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html !== undefined) el.innerHTML = html;
    return el;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  /* ---------- 术语悬浮词典 ---------- */
  let G_TERMS = null;
  function initGlossary() {
    if (G_TERMS || !window.GLOSSARY) return;
    G_TERMS = [];
    window.GLOSSARY.entries.forEach(e => e.keys.forEach(k => G_TERMS.push({ key: k, entry: e })));
    G_TERMS.sort((a, b) => b.key.length - a.key.length);
  }
  function entryById(id) { return window.GLOSSARY ? window.GLOSSARY.entries.find(x => x.id === id) : null; }
  function fmt(raw) {
    initGlossary();
    if (!G_TERMS || !G_TERMS.length) return esc(raw);
    let segs = [{ t: String(raw), hit: null }];
    for (const g of G_TERMS) {
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        if (seg.hit) continue;
        const k = g.key;
        const idx = seg.t.indexOf(k);
        if (idx < 0) continue;
        const ascii = /[A-Za-z0-9]/.test(k[0]) || /[A-Za-z0-9]/.test(k[k.length - 1]);
        if (ascii) {
          const b = idx > 0 ? seg.t[idx - 1] : '';
          const a = idx + k.length < seg.t.length ? seg.t[idx + k.length] : '';
          if ((b && /[A-Za-z0-9]/.test(b)) || (a && /[A-Za-z0-9]/.test(a))) continue;
        }
        const parts = [];
        if (idx > 0) parts.push({ t: seg.t.slice(0, idx), hit: null });
        parts.push({ t: k, hit: g.entry });
        if (idx + k.length < seg.t.length) parts.push({ t: seg.t.slice(idx + k.length), hit: null });
        segs.splice(i, 1, ...parts);
        break;
      }
    }
    return segs.map(s => s.hit
      ? '<span class="term" data-g="' + s.hit.id + '">' + esc(s.t) + '</span>'
      : esc(s.t)).join('');
  }
  function showTermTip(el) {
    const e = entryById(el.dataset.g);
    if (!e) return;
    const tip = $('termTip');
    tip.innerHTML = '<div class="tt-name">📘 ' + esc(e.t) + (e.en ? ' <span class="tt-en">' + esc(e.en) + '</span>' : '') + '</div>' +
      '<div class="tt-body">' + esc(e.d) + '</div>';
    tip.style.display = 'block';
    const r = el.getBoundingClientRect();
    const tw = Math.min(320, window.innerWidth - 20);
    let x = Math.min(Math.max(10, r.left + r.width / 2 - tw / 2), window.innerWidth - tw - 10);
    let y = r.top - tip.offsetHeight - 8;
    if (y < 62) y = r.bottom + 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function hideTermTip() { const t = $('termTip'); if (t) t.style.display = 'none'; }
  function initTermTip() {
    document.addEventListener('click', (e) => {
      const t = e.target.closest ? e.target.closest('.term') : null;
      if (t) { showTermTip(t); e.stopPropagation(); } else hideTermTip();
    });
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest ? e.target.closest('.term') : null;
      if (t) showTermTip(t);
      else hideTermTip();
    });
    document.addEventListener('scroll', hideTermTip, true);
  }
  function timeStr() {
    const m = S.clock; S.clock += 4 + Math.floor(Math.random() * 6);
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }
  function beep(freq, dur) {
    if (!soundOn) return;
    try {
      const ctx = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = freq; o.type = 'sine';
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.12));
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + (dur || 0.12));
    } catch (e) {}
  }
  function toast(msg, cls) {
    const t = h('div', 'toast ' + (cls || ''), esc(msg));
    $('toastRoot').appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 2600);
    setTimeout(() => t.remove(), 3100);
  }

  /* ---------- 成就（P2-1） ---------- */
  function ach(id) { if (window.ACHS) window.ACHS.unlock(id); }
  function towerSave() { try { return JSON.parse(localStorage.getItem('conceptTower.v1') || 'null'); } catch (e) { return null; } }
  function achCrossDual(grade) {
    // 跨游戏成就：本侧条件成立后，读塔侧存档判断另一侧是否已达成（同源可行）
    const tw = towerSave();
    if (S.finished && tw && tw.clear && Object.keys(tw.clear).length > 0) ach('x_dual_clear');
    if ((grade === 'S' || grade === 'A') && tw && (tw.lifetime || 0) >= 3000) ach('x_dual_elite');
  }

  /* ---------------- panels ---------------- */
  function renderTicker() {
    $('tickerText').textContent = C.TICKER.join('   ///   ');
  }
  function xpInLevel() {
    if (S.xp >= 700) return [S.xp, 9999, 'Head of AI Product'];
    if (S.xp >= 300) return [S.xp - 300, 400, 'Senior Product Associate'];
    return [S.xp, 300, 'Product Associate'];
  }
  function renderChar() {
    const [cur, next, lvName] = xpInLevel();
    const displayRole = S.role || lvName;
    const pct = Math.min(100, Math.round((cur / next) * 100));
    const acc = S.stats.total ? Math.round((S.stats.firstTry / S.stats.total) * 100) : 0;
    $('charPanel').innerHTML =
      '<h3>角色档案</h3>' +
      '<div class="char-name">' + esc(S.name) + '</div>' +
      '<div class="char-role">' + esc(displayRole) + '</div>' +
      '<div class="xp-row"><span>XP ' + S.xp + '</span><span>' + pct + '% → 晋升线</span></div>' +
      '<div class="xpbar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="stat-line"><span>技能</span><b>' + S.skills.length + ' / ' + Object.keys(C.SKILLS).length + '</b></div>' +
      '<div class="stat-line"><span>首答正确率</span><b class="' + (acc >= 70 ? 'good' : (acc > 0 && acc < 50 ? 'bad' : '')) + '">' + acc + '%</b></div>' +
      '<div class="stat-line"><span>错题(未掌握)</span><b class="' + (unresolvedErrors().length ? 'bad' : 'good') + '">' + unresolvedErrors().length + '</b></div>';
  }
  function unresolvedErrors() { return S.errors.filter(e => !e.resolved); }
  function renderCompany() {
    const box = $('metrics'); box.innerHTML = '';
    METRIC_DEFS.forEach(([key, label, rev]) => {
      const v = S.company[key];
      const color = rev ? (v > 65 ? 'var(--red)' : v < 30 ? 'var(--green)' : 'var(--amber)')
                        : (v >= 70 ? 'var(--green)' : v < 35 ? 'var(--red)' : 'var(--cyan)');
      const d = lastDeltas[key];
      const dHtml = d ? '<span class="delta ' + (d > 0 ? 'up' : 'down') + '">' + (d > 0 ? '+' : '') + d + '</span>' : '';
      const m = h('div', 'metric');
      m.innerHTML = '<div class="m-head"><span>' + label + dHtml + '</span><b>' + v + '</b></div>' +
        '<div class="bar' + (rev ? ' rev' : '') + '"><i style="width:' + v + '%;background:' + color + '" class="' + (d ? 'flash' : '') + '"></i></div>';
      box.appendChild(m);
    });
    lastDeltas = {};
  }
  function rpgSkillFeed(kind) {
    if (!window.LE) return;
    const feed = (window.CONTENT && window.CONTENT.SIM && window.CONTENT.SIM.skillFeed) || {};
    const gains = feed[kind] || (kind === 'chapter' ? { judgment: 2 } : {});
    Object.keys(gains).forEach(sk => window.LE.addXp(sk, gains[sk]));
    window.LE.track('rpgMilestone', { kind: kind, gains: gains });
  }
  let lastDeltas = {};
  function applyFx(fx) {
    if (!fx) return;
    let changed = false;
    Object.keys(fx).forEach(k => {
      if (S.company[k] === undefined) return;
      const d = Math.round(fx[k]);
      S.company[k] = Math.max(5, Math.min(100, S.company[k] + d));
      lastDeltas[k] = (lastDeltas[k] || 0) + d;
      changed = true;
    });
    if (changed) { renderCompany(); save(); }
  }
  function addXp(n, why) {
    S.xp += n;
    renderChar(); save();
    if (why) toast('+' + n + ' XP · ' + why, 'ok');
  }
  function renderCasePanel() {
    const cs = C.CASES[Math.min(S.caseIdx, C.CASES.length - 1)];
    $('caseInfo').innerHTML =
      '<div style="font-weight:700;font-size:13.5px">' + (cs.kind === 'boss' ? '⚔ ' : '') + esc(cs.title) + '</div>' +
      '<div class="tags">' + cs.tags.map(t => '<span class="tag">' + esc(t) + '</span>').join('') + '</div>' +
      '<div class="brief">' + esc(cs.brief) + '</div>';
    $('objText').innerHTML = {
      intro: '阅读剧情消息，点击下方进入调查阶段。',
      investigate: '点击调查项收集线索（有限次数）。看得准，就能少走弯路。',
      decide: '综合线索做出决策。选错会有真实后果，但林博士会给提示。',
      outro: '事件收尾。点击继续推进剧情。',
      done: 'Season 1 已通关。'
    }[S.phase] || '—';
  }
  function renderBadge() {
    const n = unresolvedErrors().length;
    const b = $('errBadge');
    b.style.display = n ? '' : 'none';
    b.textContent = n;
  }

  /* ---------------- feed widgets ---------------- */
  function scrollFeed() { const f = $('feed'); f.scrollTop = f.scrollHeight; }
  function addMsg(npcKey, text, urgent) {
    const npc = C.NPCS[npcKey] || C.NPCS.sys;
    const wrap = h('div', 'card msg' + (urgent ? ' urgent' : ''));
    const av = (window.CAST && window.CAST.avatar(npcKey))
      ? window.CAST.avatar(npcKey, 'av-svg')
      : '<div class="avatar" style="background:' + npc.color + '">' + esc(npc.name[0]) + '</div>';
    wrap.innerHTML =
      av +
      '<div class="msg-body"><div class="msg-head"><b>' + esc(npc.name) + '</b> · ' + timeStr() + '</div>' +
      '<div class="msg-text">' + fmt(text) + '</div></div>';
    $('feed').appendChild(wrap); scrollFeed();
  }
  function addSys(text, title) {
    const el = h('div', 'card');
    const card = h('div', 'syscard');
    card.innerHTML = (title ? '<div class="sc-title">' + esc(title) + '</div>' : '') + '<p>' + fmt(text) + '</p>';
    el.appendChild(card); $('feed').appendChild(el); scrollFeed();
  }
  function addClue(title, text) {
    const el = h('div', 'card');
    const card = h('div', 'syscard clue');
    card.innerHTML = '<div class="sc-title">▸ CLUE // ' + esc(title) + '</div><p>' + fmt(text).replace(/\n/g, '<br>') + '</p>';
    el.appendChild(card); $('feed').appendChild(el);
    el.scrollIntoView({ block: 'end' });
  }
  function addTitleCard(cs) {
    const el = h('div', 'card');
    const t = h('div', 'titlecard' + (cs.kind === 'boss' ? ' boss' : ''));
    t.innerHTML = '<div class="kicker">' + (cs.kind === 'boss' ? 'BOSS FIGHT' : 'CASE ' + String(S.caseIdx + 1).padStart(2, '0') + ' / 10') + '</div>' +
      '<h2>' + esc(cs.title) + '</h2><div class="sub">' + esc(cs.brief) + '</div>' +
      (cs.kind === 'boss' && window.CAST ? '<div class="boss-art">' + window.CAST.boss + '</div>' : '');
    el.appendChild(t); $('feed').appendChild(el); scrollFeed();
  }
  function addVerdict(type, tag, bodyHtml) {
    const el = h('div', 'card');
    const v = h('div', 'verdict ' + type);
    v.innerHTML = '<span class="v-tag">' + esc(tag) + '</span>' + bodyHtml;
    el.appendChild(v); $('feed').appendChild(el); scrollFeed();
  }
  function unlockSkill(skillId) {
    if (!skillId || S.skills.includes(skillId)) return;
    S.skills.push(skillId);
    const k = C.KNOWLEDGE[skillId]; const sk = C.SKILLS[skillId];
    const el = h('div', 'card');
    const kp = h('div', 'kp');
    kp.innerHTML = '<div class="kp-tag">◈ KNOWLEDGE UNLOCKED</div>' +
      '<div class="kp-name">' + esc(k.title) + '</div>' +
      '<div class="kp-body">' + fmt(k.body) + '</div>' +
      '<div class="kp-exam">🎓 ' + fmt(k.exam) + '</div>';
    el.appendChild(kp); $('feed').appendChild(el); scrollFeed();
    toast('技能解锁：' + sk.name, 'ok');
    beep(880, 0.1); setTimeout(() => beep(1174, 0.14), 110);
    renderChar(); save();
  }
  function recordError(kp) {
    if (!kp) return;
    const found = S.errors.find(e => e.kp === kp);
    if (found) { found.count++; } else { S.errors.push({ kp: kp, count: 1, resolved: false }); }
    renderBadge(); renderChar(); save();
  }
  function markResolved(kp) {
    const found = S.errors.find(e => e.kp === kp);
    if (found) { found.resolved = true; renderBadge(); save(); }
  }

  /* ---------------- case flow ---------------- */
  /* 过场脚本（正典：docs/WORLDVIEW.md §7） */
  const CIN_OPEN = [
    { h: '[SHUAMONE 耍门 · 档案馆]', lines: ['在遗忘之潮的边缘，有一座学院。', '它收集所有正在消失的知识，把它们铸成塔。'] },
    { h: '[沙盘编号 S1 · 平行世界]', lines: ['现在，你将进入学院的实战沙盘——', '一家名为 NOVA·AI 的公司。', '十周试用期。真实的指标，真实的后果。'] },
    { h: '', lines: ['规则只有一条：', '知识不会遗忘你——直到你掌握它。'] },
    { h: '[WEEK 01 · 试用期开始]', slam: true, lines: [] }
  ];
  const CIN_REVIEW = [
    { h: '[第十周 · 夜]', lines: ['会议室的灯亮了。三个影子坐下。'] },
    { h: '[季终复盘会 · THE REVIEW]', danger: true, lines: ['「十周了。说说吧，你都学到了什么？」', '你不需要开口——', '所有你答对过的题，此刻替你回答。'] },
    { h: '[SEASON 1 COMPLETE]', slam: true, lines: [] }
  ];
  function cinWeek(idx, title) {
    return [
      { h: '[WEEK ' + String(idx + 1).padStart(2, '0') + ']', slam: true, lines: [] },
      { h: '', lines: ['「本周事件：' + title + '」', '世界在滑动：竞对在迭代，期待在抬高。', '不进则退。'] }
    ];
  }
  function startCase(idx) {
    // T3 修复：播过场之前先把新一周状态落盘——动画中刷新页面也能 resume 到本周，
    // 而不是回退到上一案的 outro。startCaseNow 开头的重复赋值保留（幂等无害）。
    if (idx > S.caseIdx) rpgSkillFeed('chapter');   // V0.6：一周复盘完毕 → 按 SIM.skillFeed 喂技能
    S.caseIdx = idx; S.phase = 'intro'; S.clues = [];
    S.roundIdx = 0; S.roundPicked = []; S.roundWrong = 0; S.revealed = false; S.roundAttempted = false; S.roundsFirstTryThisCase = 0;
    save();
    const begin = () => startCaseNow(idx);
    if (idx > 0 && window.CINEMA) window.CINEMA.play(cinWeek(idx, C.CASES[idx].title)).then(begin);
    else begin();
  }
  function startCaseNow(idx) {
    S.caseIdx = idx; S.phase = 'intro'; S.clues = [];
    S.roundIdx = 0; S.roundPicked = []; S.roundWrong = 0; S.revealed = false; S.roundAttempted = false; S.roundsFirstTryThisCase = 0;
    renderCasePanel();
    const cs = C.CASES[idx];
    addTitleCard(cs);
    // V0.6：世界记忆——若本 Case 声明了 echoes 且印记在场，注入回响剧情（一次性）
    (cs.echoes || []).forEach(ez => {
      const key = idx + ':' + ez.mark;
      if (!S.marks[ez.mark] || S.echoDone[key]) return;
      S.echoDone[key] = 1;
      addMsg(ez.npc || 'sys', ez.text);
      if (ez.fx) applyFx(ez.fx);
      save();
    });
    cs.intro.forEach(m => { if (m.npc) addMsg(m.npc, m.text, m.urgent); else addSys(m.sys); });
    if (idx > 0) {
      const DR = (window.CONTENT && window.CONTENT.SIM && window.CONTENT.SIM.drift) || { quality: [-4, -2], trust: [-3, -1], cost: [1, 3] };
      const drift = {};
      Object.keys(DR).forEach(k => { const [mn, mx] = DR[k]; drift[k] = mn + Math.floor(Math.random() * (mx - mn + 1)); });
      applyFx(drift);
      addSys('第 ' + (idx + 1) + ' 周开始。竞对在迭代、用户期待在抬高——什么都不做，指标会自然下滑（质量 ' + drift.quality + ' / 信任 ' + drift.trust + ' / 成本 +' + drift.cost + '）。', 'TIME PASSES // 不进则退');
    }
    actionBarIntro();
    save();
  }
  function actionBarIntro() {
    const bar = $('actionBar');
    bar.innerHTML = '<div class="ab-label">// READY</div><div class="ab-btns"></div>';
    const btn = h('button', 'ab-btn primary', isBoss() ? '进入会议室 ▸' : '开始调查 ▸');
    btn.onclick = () => {
      beep(660, 0.08);
      if (isBoss()) enterDecide();
      else enterInvestigate();
    };
    bar.querySelector('.ab-btns').appendChild(btn);
  }
  function enterInvestigate() {
    S.phase = 'investigate'; renderCasePanel();
    const cs = C.CASES[S.caseIdx];
    const bar = $('actionBar');
    bar.innerHTML = '<div class="ab-label">// INVESTIGATE · 剩余调查机会 <span class="cnt" id="invCnt">' + (cs.investigate.budget - S.clues.length) + '</span></div><div class="ab-btns"></div>';
    const btns = bar.querySelector('.ab-btns');
    cs.investigate.options.forEach(op => {
      const used = S.clues.includes(op.id);
      const b = h('button', 'ab-btn', (used ? '✓ ' : '🔍 ') + esc(op.label) + ' <span style="color:var(--dim);font-size:11px">[' + op.layer + ']</span>');
      if (used) b.disabled = true;
      b.onclick = () => {
        S.clues.push(op.id);
        S.profile[op.layer] = (S.profile[op.layer] || 0) + 1;
        addClue(op.title, op.clue);
        beep(520, 0.06);
        const left = cs.investigate.budget - S.clues.length;
        const cnt = $('invCnt'); if (cnt) cnt.textContent = Math.max(0, left);
        b.disabled = true; b.innerHTML = '✓ ' + esc(op.label) + ' <span style="color:var(--dim);font-size:11px">[' + op.layer + ']</span>';
        go.disabled = S.clues.length === 0; // 有线索即可决策
        if (left <= 0) btns.querySelectorAll('.ab-btn').forEach(x => { if (x !== go) x.disabled = true; });
        save();
      };
      btns.appendChild(b);
    });
    const go = h('button', 'ab-btn primary', '我有了判断 → 进入决策');
    go.disabled = S.clues.length === 0;
    go.onclick = () => {
      const left = cs.investigate.budget - S.clues.length;
      if (left > 0) { S.stats.investLeftoverXp += left * 10; addXp(left * 10, '调查效率加成 ×' + left); }
      enterDecide();
    };
    btns.appendChild(go);
  }
  function enterDecide() {
    S.phase = 'decide'; renderCasePanel();
    // boss: queue 回炉 variants first
    if (isBoss() && S.bossVariants.length === 0) {
      const pend = unresolvedErrors();
      const pool = [];
      C.VARIANTS.forEach((v, i) => { if (pend.some(e => e.kp === v.kp)) pool.push(i); });
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      S.bossVariants = pool.slice(0, 2);
      S.bossVariantIdx = 0;
      save();
    }
    $('actionBar').innerHTML = '<div class="ab-label">// DECIDE</div><div class="ab-btns" id="decBtns"></div>';
    if (isBoss() && S.bossVariantIdx < S.bossVariants.length) {
      renderVariantCard(C.VARIANTS[S.bossVariants[S.bossVariantIdx]]);
      save();
      return;
    }
    renderDecisionCard(currentRound(), false);
    save();
  }
  function isBoss() { const cs = C.CASES[S.caseIdx]; return cs && cs.kind === 'boss'; }
  function currentRound() { return C.CASES[S.caseIdx].rounds[S.roundIdx]; }

  function renderDecisionCard(round, restored) {
    const wrap = h('div', 'card');
    const d = h('div', 'decision');
    d.innerHTML = '<div class="q-label">' + esc(round.qLabel || 'DECISION') + '</div><div class="q">' + fmt(round.q) + '</div>';
    const opts = h('div', 'opts');
    round.options.forEach((op, i) => {
      const b = h('button', 'opt', '<span class="ol">' + 'ABCD'[i] + '</span><span>' + esc(op.t) + '</span>');
      if (restored && S.roundPicked.includes(i)) {
        if (!op.ok) { b.classList.add('wrong'); b.disabled = true; }
      }
      b.onclick = () => chooseOption(round, i, b);
      opts.appendChild(b);
    });
    d.appendChild(opts);
    if (restored && S.roundWrong > 0 && !round._hintShown) showHintInCard(d, round, Math.min(S.roundWrong, round.hints.length));
    wrap.appendChild(d);
    $('feed').appendChild(wrap); scrollFeed();
  }

  function showHintInCard(d, round, level) {
    if (!round.hints || level < 1) return;
    const hint = h('div', 'hintcard', '<b>HINT</b> · ' + fmt(round.hints[Math.min(level, round.hints.length) - 1]));
    d.appendChild(hint);
  }

  function chooseOption(round, i, btnEl) {
    const op = round.options[i];
    const card = btnEl.closest('.decision');
    applyFx(op.fx);
    if (op.mark) { S.marks[op.mark] = (S.marks[op.mark] || 0) + 1; save(); }   // V0.6：选择印记——世界会记住
    // 首答口径：每个 round 只统计第一次点击
    if (!S.roundAttempted) {
      S.stats.total++;
      if (op.ok) S.stats.firstTry++;
      S.roundAttempted = true;
    }
    if (op.ok && S.roundWrong === 0 && !S.revealed) S.roundsFirstTryThisCase = (S.roundsFirstTryThisCase || 0) + 1;

    if (op.ok) {
      btnEl.classList.add('right');
      card.querySelectorAll('.opt').forEach(b => b.disabled = true);
      beep(784, 0.1); setTimeout(() => beep(1046, 0.15), 110);
      const gained = (S.roundWrong === 0 && !S.revealed) ? 100 : 50;
      addVerdict('good', '✓ 决策正确' + (gained === 100 ? ' · 首答命中' : ' · 修正后命中'),
        '<div><b>反馈：</b>' + fmt(op.fb) + '</div><div style="margin-top:6px;color:var(--dim)"><b>为什么：</b>' + fmt(op.why) + '</div>');
      addXp(gained, gained === 100 ? '首答正确' : '二次修正');
      unlockSkill(round.skill);
      roundDoneContinue();
    } else {
      S.roundWrong++; S.stats.wrongTotal++;
      S.roundPicked.push(i);
      btnEl.classList.add('wrong'); btnEl.disabled = true;
      beep(220, 0.18);
      applyDefaultPenalty();
      addVerdict('bad', '✗ 后果已发生',
        '<div>' + fmt(op.fb) + '</div>');
      recordError(round.kp);
      if (S.roundWrong >= 2) {
        // reveal
        S.revealed = true;
        const rightIdx = round.options.findIndex(o => o.ok);
        const cards = card.querySelectorAll('.opt');
        cards.forEach((b, idx) => { b.disabled = true; if (idx === rightIdx) b.classList.add('right'); });
        const right = round.options[rightIdx];
        addVerdict('teach', '◈ 林博士复盘 · 正确答案：' + 'ABCD'[rightIdx],
          '<div>' + fmt(right.fb) + '</div><div style="margin-top:6px;color:var(--dim)"><b>为什么：</b>' + fmt(right.why) + '</div>');
        unlockSkill(round.skill); // 学会了再走
        roundDoneContinue();
      } else {
        showHintInCard(card, round, S.roundWrong);
        toast('提示已给出 · 再试一次（这次后果会更重）', 'err');
      }
    }
    renderChar(); save();
  }
  function applyDefaultPenalty() {
    applyFx({ trust: -1, morale: -1 });
  }

  function roundDoneContinue() {
    const bar = $('actionBar');
    bar.innerHTML = '<div class="ab-label">// CONTINUE</div><div class="ab-btns"></div>';
    const cs = C.CASES[S.caseIdx];
    const lastRound = S.roundIdx >= cs.rounds.length - 1;
    const b = h('button', 'ab-btn primary', lastRound ? '收尾 →' : '下一问 ▸');
    b.onclick = () => {
      S.roundIdx++; S.roundPicked = []; S.roundWrong = 0; S.revealed = false; S.roundAttempted = false;
      if (S.roundIdx >= cs.rounds.length) finishCase();
      else { renderDecisionCard(currentRound()); }
      save();
    };
    bar.querySelector('.ab-btns').appendChild(b);
  }

  /* ---------------- boss variants (回炉) ---------------- */
  function renderVariantCard(v) {
    addSys('检测到未掌握知识点，Boss 战前回炉测试。答对即可标记为"已掌握"。', 'RE-TEST // 错题回炉');
    const wrap = h('div', 'card');
    const d = h('div', 'decision');
    d.innerHTML = '<div class="q-label">RE-TEST ' + (S.bossVariantIdx + 1) + ' / ' + S.bossVariants.length + '</div><div class="q">' + esc(v.text) + '</div>';
    const opts = h('div', 'opts');
    let answered = false;
    v.options.forEach((t, i) => {
      const b = h('button', 'opt', '<span class="ol">' + 'ABCD'[i] + '</span><span>' + esc(t) + '</span>');
      b.onclick = () => {
        if (answered) return; answered = true;
        opts.querySelectorAll('.opt').forEach(x => x.disabled = true);
        if (i === v.ans) {
          b.classList.add('right'); markResolved(v.kp); addXp(40, '错题回炉成功');
          addVerdict('good', '✓ 回炉通过', esc(v.explain));
          beep(880, 0.12);
        } else {
          b.classList.add('wrong');
          opts.querySelectorAll('.opt')[v.ans].classList.add('right');
          addVerdict('teach', '◈ 再记一次', esc(v.explain));
          recordError(v.kp);
        }
        S.bossVariantIdx++;
        const bar = $('actionBar');
        bar.innerHTML = '<div class="ab-label">// CONTINUE</div><div class="ab-btns"></div>';
        const nb = h('button', 'ab-btn primary', '继续 ▸');
        nb.onclick = () => {
          if (S.bossVariantIdx < S.bossVariants.length) renderVariantCard(C.VARIANTS[S.bossVariants[S.bossVariantIdx]]);
          else renderDecisionCard(currentRound());
        };
        bar.querySelector('.ab-btns').appendChild(nb);
        save();
      };
      opts.appendChild(b);
    });
    d.appendChild(opts); wrap.appendChild(d);
    $('feed').appendChild(wrap); scrollFeed();
    $('actionBar').innerHTML = '<div class="ab-label">// RE-TEST · 这是你的错题变体</div><div class="ab-btns"></div>';
  }

  /* ---------------- case end / chapter end ---------------- */
  function finishCase() {
    S.phase = 'outro'; renderCasePanel();
    const cs = C.CASES[S.caseIdx];
    if ((S.roundsFirstTryThisCase || 0) >= cs.rounds.length && cs.rounds.length > 0) {
      S.potions = (S.potions || 0) + 1;
      toast('获得 🧪 加速药剂 ×1（本章零失误）· 点击左下角盆栽使用', 'gold');
      S.cleanStreak = (S.cleanStreak || 0) + 1;                  // P2-1 成就进度
      if (S.caseIdx === 0) ach('rpg_first_clean');
      if (S.cleanStreak >= 3) ach('rpg_three_clean');
    } else {
      S.cleanStreak = 0;
    }
    cs.outro.forEach(m => { if (m.npc) addMsg(m.npc, m.text); else addSys(m.sys); });
    const bar = $('actionBar');
    bar.innerHTML = '<div class="ab-label">// NEXT</div><div class="ab-btns"></div>';
    if (cs.kind === 'boss') {
      const b = h('button', 'ab-btn primary', '生成季终报告 ▸');
      b.onclick = () => {
        const go = () => chapterEnd();
        if (window.CINEMA) window.CINEMA.play(CIN_REVIEW).then(go); else go();
      };
      bar.querySelector('.ab-btns').appendChild(b);
    } else {
      const b = h('button', 'ab-btn primary', '下一起事件 ▸');
      b.onclick = () => startCase(S.caseIdx + 1);
      bar.querySelector('.ab-btns').appendChild(b);
    }
    save();
  }

  function finalTier(acc, trust) {
    const F = (window.CONTENT && window.CONTENT.SIM && window.CONTENT.SIM.final) || {};
    const tiers = F.tiers || [];
    const tr = (typeof trust === 'number') ? trust : (S && S.company ? S.company.trust : 0);
    const gate = F.legendGate || { min: 95, minTrust: 85 };
    // 天选之人双门：满分直达，或高分+高信任
    if (tiers[0]) {
      const t0 = tiers[0];
      if (acc >= (t0.min || 100) || (acc >= gate.min && tr >= gate.minTrust)) return t0;
    }
    for (let i = 1; i < tiers.length; i++) {
      if (acc >= (tiers[i].min || 0)) return tiers[i];
    }
    return tiers[tiers.length - 1] || {};
  }
  // companyAvg ← SIM.final.weights/invert（权重求和，cost 反向）
  function companyAvgCalc() {
    const F = (window.CONTENT && window.CONTENT.SIM && window.CONTENT.SIM.final) || {};
    const W = F.weights || {};
    const INV = new Set(F.invert || ['cost']);
    let sum = 0, wsum = 0;
    Object.keys(W).forEach(k => {
      const w = W[k] || 0;
      let v = (S.company[k] !== undefined) ? S.company[k] : 0;
      if (INV.has(k)) v = 100 - v;
      sum += v * w; wsum += w;
    });
    return wsum ? Math.round(sum / wsum) : 0;
  }
  window.RPGTEST = { finalTier: finalTier, startCase: startCase };
  /* 天选之人彩带：纯 CSS 动画，3.6s 后自动清理 */
  function spawnConfetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const glyphs = ['✦', '✧', '★', '👑', '◆', '❖', '·'];
    const colors = ['#a78bfa', '#22d3ee', '#fbbf24', '#34d399', '#f472b6'];
    for (let i = 0; i < 46; i++) {
      const c = document.createElement('span');
      c.className = 'confetti';
      c.textContent = glyphs[i % glyphs.length];
      c.style.left = (Math.random() * 100) + 'vw';
      c.style.animationDuration = (2.2 + Math.random() * 1.8) + 's';
      c.style.animationDelay = (Math.random() * 1.4) + 's';
      c.style.fontSize = (11 + Math.random() * 10) + 'px';
      c.style.color = colors[i % colors.length];
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 5200);
    }
  }

  function chapterEnd() {
    S.phase = 'done'; S.finished = true;
    S.role = (window.CONTENT && window.CONTENT.SIM && window.CONTENT.SIM.role) || 'AI Product Manager';
    renderChar(); renderCasePanel(); save();
    const acc = S.stats.total ? Math.round((S.stats.firstTry / S.stats.total) * 100) : 0;
    const companyAvg = companyAvgCalc();   // V0.6 票1：权重配置化
    const tier = finalTier(acc, S.company.trust);
    const grade = tier.grade;
    S.finalGrade = grade;                                     // P2-1：跨游戏成就读取
    ach('rpg_finish');
    if (!S.learnerFini) { S.learnerFini = true; rpgSkillFeed('finished'); }  // V0.6：通关 XP 仅首发一次，喂养表来自 SIM.skillFeed
    if (grade === 'S' && tier.name === '天选之人') ach('rpg_chosen');
    if (S.errors.length > 0 && unresolvedErrors().length === 0) ach('rpg_lantern');
    achCrossDual(grade);
    const el = h('div', 'card');
    const rep = h('div', 'titlecard report');
    rep.classList.add(tier.cls);
    rep.innerHTML =
      '<div class="kicker">' + tier.kicker + '</div>' +
      '<h2>' + tier.title + '</h2>' +
      '<div class="sub">' + tier.headline + '</div>' +
      '<div class="tier-quotes"><div class="tq"><b>Victor：</b>' + tier.victor + '</div><div class="tq"><b>林博士：</b>' + tier.lin + '</div></div>' +
      '<div class="sub" style="margin-top:12px">晋升：Product Associate → <b style="color:var(--cyan)">AI Product Manager</b> · 评级 <b style="color:var(--amber)">' + grade + ' · ' + tier.name + '</b></div>' +
      '<div class="rgrid">' +
      rcell(S.xp, '总 XP') + rcell(acc + '%', '首答正确率') +
      rcell(S.skills.length + '/' + Object.keys(C.SKILLS).length, '技能解锁') +
      rcell((S.errors.length - unresolvedErrors().length) + '/' + S.errors.length, '错题已回炉') +
      rcell(companyAvg, '公司状态指数') + rcell(S.stats.investLeftoverXp, '调查效率 XP') +
      '</div>' +
      '<h3 style="font-family:var(--mono);font-size:12px;color:var(--dim);letter-spacing:2px;margin:10px 0 8px">▸ 你的诊断路径画像（AI Product Thinking Profile）</h3>' +
      profileBarsHtml() +
      (unresolvedErrors().length
        ? '<div class="verdict bad" style="margin-top:10px"><span class="v-tag">未掌握知识点</span>' + unresolvedErrors().map(e => esc(e.kp)).join('、') + ' —— 复盘后再战，Boss 会记得它们。</div>'
        : '<div class="verdict good" style="margin-top:10px"><span class="v-tag">全部错题已回炉</span>漂亮，没有欠账。</div>') +
      '<div class="season2"><b>SEASON 2 · 模型战争（预告）</b><br>公司发布下一代 Foundation Model：benchmark 拿了第一，用户却开始流失。<br>你将深入 Benchmark 迷思、SFT/RLHF/DPO、Reasoning 模型与 Multimodal——以及"分数第一为什么救不了产品"。<br><span style="font-family:var(--mono);font-size:11px">[ LOCKED · 开发中 ]</span></div>';
    el.appendChild(rep);
    $('feed').appendChild(el); scrollFeed();
    if (tier.cls === 'tier-legend') spawnConfetti();

    const bar = $('actionBar');
    bar.innerHTML = '<div class="ab-label">// FIN</div><div class="ab-btns"></div>';
    const exp = h('button', 'ab-btn', '导出能力报告（复制到剪贴板）');
    exp.onclick = exportReport;
    const rst = h('button', 'ab-btn', '重玩 Season 1');
    rst.onclick = () => { if (confirm('确定重置全部进度？')) resetGame(); };
    bar.querySelector('.ab-btns').appendChild(exp);
    bar.querySelector('.ab-btns').appendChild(rst);
    beep(659, 0.12); setTimeout(() => beep(880, 0.12), 130); setTimeout(() => beep(1318, 0.2), 260);
    toast('Season 1 通关 · 晋升 ' + S.role, 'ok');
  }
  function rcell(v, k) { return '<div class="rcell"><div class="rv">' + v + '</div><div class="rk">' + k + '</div></div>'; }
  function profileBarsHtml() {
    const total = Object.values(S.profile).reduce((a, b) => a + b, 0) || 1;
    return '<div class="pbars">' + LAYERS.map(l => {
      const v = S.profile[l] || 0;
      const pct = Math.round((v / total) * 100);
      return '<div class="prow"><div class="p-head"><span>' + l + '</span><span>' + v + ' 次 · ' + pct + '%</span></div><div class="bar"><i style="width:' + pct + '%"></i></div></div>';
    }).join('') + '</div>' +
    '<div style="color:var(--dim);font-size:11.5px;margin-top:6px">画像解读：你更习惯从哪些层切入问题？校招场景题里，均衡的排查视野（Data/Model/Retrieval/Infra/Product）是加分项。</div>';
  }
  function exportReport() {
    const acc = S.stats.total ? Math.round((S.stats.firstTry / S.stats.total) * 100) : 0;
    const txt = [
      'AI PRODUCT RPG — Season 1 能力报告',
      '角色：' + S.name + ' · ' + S.role,
      'XP：' + S.xp + ' · 首答正确率：' + acc + '%',
      '技能解锁：' + S.skills.length + '/' + Object.keys(C.SKILLS).length,
      '已解锁：' + S.skills.map(id => C.SKILLS[id].name).join('、'),
      '诊断路径画像：' + LAYERS.map(l => (l + ' ' + (S.profile[l] || 0)).trim()).join(' / '),
      '错题回炉：' + (S.errors.length - unresolvedErrors().length) + '/' + S.errors.length,
      unresolvedErrors().length ? '待巩固：' + unresolvedErrors().map(e => e.kp).join('、') : '无欠账'
    ].join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => toast('报告已复制到剪贴板', 'ok'), () => showReportModal(txt));
    } else showReportModal(txt);
  }
  function showReportModal(txt) {
    openModal('能力报告', '<textarea style="width:100%;height:260px;background:#0b111c;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:10px" readonly>' + esc(txt) + '</textarea>');
  }

  /* ---------------- modals ---------------- */
  function openModal(title, bodyHtml, foot) {
    const root = $('modalRoot');
    root.innerHTML = '';
    const bd = h('div', 'backdrop');
    const m = h('div', 'modal');
    m.innerHTML = '<h2>' + esc(title) + '<span class="x">✕ ESC</span></h2>' + bodyHtml + (foot ? '<div class="mfoot">' + foot + '</div>' : '');
    bd.appendChild(m);
    bd.onclick = (e) => { if (e.target === bd) root.innerHTML = ''; };
    m.querySelector('.x').onclick = () => root.innerHTML = '';
    root.appendChild(bd);
  }
  /* ---------------- 键盘操作（T5） ---------------- */
  // 纯函数：A-D / 1-4 → 当前（最后一张）决策卡里对应序号且未禁用的选项按钮；否则 null
  function pickOptBtn(key, doc) {
    const map = { a: 0, b: 1, c: 2, d: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
    const k = String(key || '').toLowerCase();
    if (!(k in map)) return null;
    const cards = (doc || document).querySelectorAll('.decision');
    const card = cards[cards.length - 1];
    if (!card) return null;
    const btn = card.querySelectorAll('.opt')[map[k]];
    return (btn && !btn.disabled) ? btn : null;
  }
  window.RPGKB = { pickOptBtn: pickOptBtn }; // 供 smoke 测试断言
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { $('modalRoot').innerHTML = ''; return; }
    if ($('modalRoot').innerHTML) return;                     // R1: 弹窗开着不隐形答题
    if (window.CINEMA && window.CINEMA.isPlaying()) return;   // R2: 过场动画期间不点按钮（防 chapterEnd 双触发）
    const ae = document.activeElement;
    // 输入框聚焦时不劫持（开场 startbox 输入名字同理）；按钮聚焦时交给浏览器原生 Enter/Space，避免双触发
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'BUTTON' || ae.isContentEditable)) return;
    const opt = pickOptBtn(e.key, document);
    if (opt) { opt.click(); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      const bar = $('actionBar');
      if (!bar) return;
      const enabled = Array.from(bar.querySelectorAll('.ab-btn')).filter(b => !b.disabled);
      const target = enabled.find(b => b.classList.contains('primary')) || enabled[0];
      if (target) { e.preventDefault(); target.click(); }
    }
  });

  function modalSkills() {
    let html = '';
    C.SKILL_CATS.forEach(cat => {
      const nodes = Object.entries(C.SKILLS).filter(([, s]) => s.cat === cat);
      html += '<div class="skillcat"><h4>' + esc(cat) + '</h4><div class="skillgrid">' +
        nodes.map(([id, s]) => {
          const on = S.skills.includes(id);
          return '<div class="sklnode ' + (on ? 'on' : 'lock') + '"><div class="sn">' + (on ? '◆ ' : '◇ ') + esc(s.name) + '</div><div class="sd">' + (on ? esc(s.desc) : '完成剧情解锁') + '</div></div>';
        }).join('') + '</div></div>';
    });
    openModal('技能树 · SKILL TREE', html, '技能通过解决剧情中的真实问题解锁，不靠背诵。');
  }
  function modalKnowledge() {
    const ks = S.skills.map(id => C.KNOWLEDGE[id]).filter(Boolean);
    const html = ks.length
      ? '<div class="klist">' + ks.map(k =>
          '<div class="kitem"><b>◈ ' + esc(k.title) + '</b><p>' + fmt(k.body) + '</p><div class="exam">🎓 ' + fmt(k.exam) + '</div></div>'
        ).join('') + '</div>'
      : '<div style="color:var(--dim)">尚未解锁任何知识。推进剧情后，这里会出现你"用过才学会"的概念卡。</div>';
    openModal('知识库 · KNOWLEDGE (' + ks.length + ')', html, '每张卡都标注了对应的校招笔试映射——游戏里的判断，就是考卷上的选项。');
  }
  function modalErrors() {
    const html = S.errors.length
      ? '<div class="klist">' + S.errors.map(e =>
          '<div class="kitem"><span class="err-state ' + (e.resolved ? 'done' : 'pend') + '">' + (e.resolved ? '已回炉 ✓' : '待回炉 · Boss 战再见') + '</span><b>' + esc(e.kp) + '</b><p>累计答错 ' + e.count + ' 次。错题不会消失——它们会换一张脸，在 Boss 战前再次出现。</p></div>'
        ).join('') + '</div>'
      : '<div style="color:var(--dim)">零错题。要么你很强，要么你还没开始冒险。</div>';
    openModal('错题本 · ERROR MEMORY', html, '机制：错误 → 记录知识点 → 变体重测 → 掌握为止。');
  }
  // T6：存档码导入路径的校验/归一（纯函数，smoke 可断言）。
  // v2 码直接放行；v1 旧码也接受——字段少就少，写入后由 load()/migrateRpg 补默认并升到 v2。
  function normalizeSaveData(d) {
    if (!d || (d.v !== 1 && d.v !== 2) || !d.rpg) throw new Error('bad');
    return {
      v: 2, ts: d.ts || Date.now(),
      rpg: d.rpg, time: d.time || '0', vineBorn: d.vineBorn || '', tower: d.tower || ''
    };
  }
  window.RPGSAVE = { normalizeSaveData: normalizeSaveData, migrateRpg: migrateRpg };

  function modalSettings() {
    const html =
      '<div style="display:flex;flex-direction:column;gap:10px">' +
      '<button class="ab-btn" id="achBtn">🏆 成就墙 · ACHIEVEMENTS</button>' +
      '<button class="ab-btn" id="sndBtn">音效：' + (soundOn ? '开 ✓' : '关') + '</button>' +
      '<button class="ab-btn" id="bgmBtn">BGM（轻柔慢板）：' + (window.BGM && window.BGM.isOn() ? '开 ✓' : '关') + '</button>' +
      '<div style="border:1px dashed var(--line);border-radius:8px;padding:10px 12px">' +
      '<div style="font-family:var(--mono);font-size:11px;color:var(--dim);letter-spacing:1px;margin-bottom:8px">存档码 · 换设备继续玩</div>' +
      '<div id="lbPanelR" style="margin:6px 0"></div><div style="display:flex;gap:8px;margin-bottom:8px"><button class="ab-btn" id="lbBtnR">🔥 贡献榜</button><button class="ab-btn" id="expBtn">📤 导出存档码</button><button class="ab-btn" id="impBtn">📥 导入存档码</button></div>' +
      '<div id="saveBox" style="display:none">' +
      '<textarea id="saveCode" style="width:100%;height:84px;background:#0b111c;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px;font:11px var(--mono);word-break:break-all" placeholder="粘贴存档码…"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:8px"><button class="ab-btn" id="copySave">复制</button><button class="ab-btn primary" id="applySave">应用导入</button></div>' +
      '<div style="color:var(--dim);font-size:11px;margin-top:6px">存档码打包两个游戏进度 + 文竹时长，复制保存好，在任何设备浏览器导入即可继续。</div>' +
      '</div></div>' +
      '<button class="ab-btn" id="rstBtn">重置全部进度</button>' +
      '<button class="ab-btn" id="fbBtnR">📖 年鉴 · 留言</button>' +
      '<div style="color:var(--dim);font-size:12px;line-height:1.8">AI PRODUCT RPG · Build. Break. Fix. Ship.<br>Learn AI by running an AI company.<br>进度自动保存在本地浏览器（localStorage）。</div></div>';
    openModal('系统 · SYSTEM', html);
    const ab = $('achBtn');
    if (ab) ab.onclick = () => {
      openModal('成就墙 · ACHIEVEMENTS', window.ACHS ? window.ACHS.modalBody() : '');
      if (window.ACHS) window.ACHS.renderIntoWall();
    };
    $('sndBtn').onclick = () => { soundOn = !soundOn; modalSettings(); };
    const bb = $('bgmBtn');
    if (bb) bb.onclick = () => { if (window.BGM) { window.BGM.toggle(); } modalSettings(); };
    const b64e = (s) => btoa(unescape(encodeURIComponent(s)));
    const b64d = (s) => decodeURIComponent(escape(atob(s.trim())));
    const eb = $('expBtn'), ib = $('impBtn');
    if (eb) eb.onclick = () => {
      const data = { v: 2, ts: Date.now(),
        rpg: localStorage.getItem('aiProductRpg.v1') || '',
        time: localStorage.getItem('aiProductRpg.time') || '0',
        vineBorn: localStorage.getItem('aiProductRpg.vineBorn') || '',
        tower: localStorage.getItem('conceptTower.v1') || '' };
      $('saveBox').style.display = '';
      $('saveCode').readOnly = true;
      $('saveCode').value = b64e(JSON.stringify(data));
      toast('存档码已生成，记得复制保存', 'ok');
    };
    if (ib) ib.onclick = () => {
      $('saveBox').style.display = '';
      $('saveCode').readOnly = false;
      $('saveCode').value = '';
      $('saveCode').focus();
    };
    const cp = $('copySave');
    if (cp) cp.onclick = () => {
      const ta = $('saveCode');
      if (ta.select) ta.select();
      if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(() => toast('已复制到剪贴板', 'ok'), () => {});
      else toast('请手动 Ctrl/Cmd+C 复制');
    };
    const lbR = $('lbBtnR');
    if (lbR && window.LEADERBOARD) lbR.onclick = () => { $('lbPanelR').innerHTML = window.LEADERBOARD.render(); };
    const fbR = $('fbBtnR');
    if (fbR && window.FEEDBACK) fbR.onclick = () => { openYearbookR(); };
    const ap = $('applySave');
    if (ap) ap.onclick = () => {
      try {
        const d = normalizeSaveData(JSON.parse(b64d($('saveCode').value)));
        if (localStorage.getItem('aiProductRpg.v1') && !confirm('导入会覆盖当前进度，继续？')) return;
        localStorage.setItem('aiProductRpg.v1', d.rpg);
        if (d.time) localStorage.setItem('aiProductRpg.time', d.time);
        if (d.vineBorn) localStorage.setItem('aiProductRpg.vineBorn', d.vineBorn);
        if (d.tower) localStorage.setItem('conceptTower.v1', d.tower);
        toast('导入成功，即将刷新…', 'ok');
        setTimeout(() => location.reload(), 900);
      } catch (err) { toast('存档码无效，请检查是否复制完整', 'err'); }
    };
    $('rstBtn').onclick = () => { if (confirm('确定重置全部进度？此操作不可恢复。')) resetGame(); };
  }
  function modalGlossary() {
    const es = window.GLOSSARY ? window.GLOSSARY.entries : [];
    const list = es.map(e =>
      '<div class="kitem"><b>📘 ' + esc(e.t) + '</b>' + (e.en ? ' <span class="st">' + esc(e.en) + '</span>' : '') +
      '<p>' + fmt(e.d) + '</p>' +
      (e.m ? '<div class="glink" data-m="' + e.m + '">去试炼塔专项练习 ▸</div>' : '') + '</div>'
    ).join('');
    openModal('术语表 · GLOSSARY（' + es.length + ' 条）',
      '<input id="gSearch" placeholder="搜索术语…" style="width:100%;background:#0b111c;border:1px solid var(--line);color:var(--ink);border-radius:8px;padding:9px 12px;font:13px inherit;outline:none;margin-bottom:10px">' +
      '<div class="klist" id="gList">' + list + '</div>' +
      '<button id="gTowerCta" style="width:100%;margin-top:14px;display:block;background:linear-gradient(90deg,rgba(167,139,250,.16),rgba(34,211,238,.16));border:1px solid var(--violet);color:var(--ink);border-radius:10px;padding:12px 16px;cursor:pointer;font:13px inherit;line-height:1.7">🗼 到试炼塔继续 · <b style="color:var(--violet)">术语深化塔</b>（' + es.length + ' 词专项刷题，答错会进暗影复仇循环）</button>',
      '游戏内正文里的术语都带虚线下划线，点一下就能看解释。');
    const inp = $('gSearch');
    inp.oninput = () => {
      const q = inp.value.trim().toLowerCase();
      $('gList').querySelectorAll('.kitem').forEach(el => {
        el.style.display = (!q || el.textContent.toLowerCase().includes(q)) ? '' : 'none';
      });
    };
    const cta = $('gTowerCta');
    if (cta) cta.onclick = () => window.open('../tower/index.html?mod=terms', '_blank');
    $('gList').querySelectorAll('.glink').forEach(el => {
      el.onclick = () => window.open('../tower/index.html?mod=' + encodeURIComponent(el.dataset.m || ''), '_blank');
    });
  }
  document.querySelectorAll('.top-actions button').forEach(b => {
    b.onclick = () => {
      const m = b.dataset.modal;
      if (m === 'skills') modalSkills();
      else if (m === 'knowledge') modalKnowledge();
      else if (m === 'glossary') modalGlossary();
      else if (m === 'errors') modalErrors();
      else modalSettings();
    };
  });

  /* ---------------- boot ---------------- */
  // P2-1：注入成就系统（懒取 S —— boot 时才赋值）
  if (window.ACHS) window.ACHS.init({ side: 'rpg', get: () => S, persist: save, toast: toast });
  function startScreen() {
    $('feed').innerHTML = '';
    const box = h('div', 'startbox');
    box.innerHTML =
      '<div style="font-family:var(--mono);font-size:11px;letter-spacing:3px;color:var(--dim)">NOVA·AI // 09:00 MON / 你的工位 / 第 1 天</div>' +
      '<div class="biglogo">AI PRODUCT <b>RPG</b></div>' +
      '<div class="tagline">BUILD. BREAK. FIX. SHIP. — LEARN AI BY RUNNING AN AI COMPANY.</div>' +
      '<div style="color:var(--dim);font-size:13px;line-height:1.9;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 18px;margin:0 0 18px">' +
      '每一个想成为 AI 产品经理的人，都值得一次真实的"试用期"。<br>' +
      '无论你是什么背景——今天起，你是 NOVA·AI 的 Product Associate。<br>' +
      '十周后，公司会把一条产品线交到你手上——如果你能活过：<br>' +
      '<span style="color:var(--cyan)">虚伪的增长指标 · 99% 的谎言 · 胡说八道的 AI · 凌晨两点的报警电话 · CEO 的复盘会</span><br>' +
      '你的武器不是代码，是判断力。</div>' +
      '<input id="nameInput" maxlength="12" placeholder="输入你的名字（将出现在角色档案）">' +
      '<br><button class="gobtn" id="startBtn">入 职 ▸</button>' +
      '<div class="bg-note">进度自动保存 · 纯本地运行 · 预计通关 40-60 分钟</div>';
    $('feed').appendChild(box);
    $('actionBar').innerHTML = '<div class="ab-label">// STANDBY</div><div class="ab-btns"><span style="color:var(--dim);font-size:12px">点击「入职」开始 Season 1</span></div>';
    $('startBtn').onclick = () => {
      const name = ($('nameInput').value || '').trim() || 'Nova';
      const go = () => {
        S = newState(name);
        save(); renderAll();
        ach('rpg_join');                                      // P2-1：入职成就
        addSys('欢迎加入 NOVA·AI。你的第一个十周，从一条 Slack 消息开始……', 'SYSTEM');
        startCase(0);
      };
      if (window.CINEMA) window.CINEMA.play(CIN_OPEN).then(go); else go();
    };
    // 名字输入框聚焦时 Enter 直接入职（全局键盘处理器对 input 不劫持）
    $('nameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('startBtn').click(); });
    $('nameInput').focus();
  }
  function resumeGame() {
    renderAll();
    const cs = C.CASES[S.caseIdx];
    addSys('检测到本地存档，已恢复进度：' + (cs.kind === 'boss' ? 'BOSS 战' : 'Case ' + (S.caseIdx + 1)) + ' · ' + cs.title, 'SYSTEM // RESUME');
    // 重放本 case 的剧情与已获线索
    addTitleCard(cs);
    cs.intro.forEach(m => { if (m.npc) addMsg(m.npc, m.text, m.urgent); else addSys(m.sys); });
    if (cs.investigate) cs.investigate.options.forEach(op => { if (S.clues.includes(op.id)) addClue(op.title, op.clue); });

    if (S.phase === 'intro') actionBarIntro();
    else if (S.phase === 'investigate' && cs.investigate) enterInvestigate();
    else if (S.phase === 'decide' || (isBoss() && S.phase !== 'outro' && S.phase !== 'done')) {
      $('actionBar').innerHTML = '<div class="ab-label">// DECIDE</div><div class="ab-btns"></div>';
      if (isBoss() && S.bossVariantIdx < (S.bossVariants || []).length) {
        renderVariantCard(C.VARIANTS[S.bossVariants[S.bossVariantIdx]]);
      } else {
        renderDecisionCard(currentRound(), true);
      }
    } else if (S.phase === 'outro') finishCase();
    else if (S.phase === 'done') chapterEnd();
  }
  function renderAll() {
    renderTicker(); renderChar(); renderCompany(); renderCasePanel(); renderBadge();
  }
  /* 背包：药剂/收藏统一查看 */
  function modalBagR() {
    const potions = S.potions || 0;
    let achN = 0;
    try {
      const r = JSON.parse(localStorage.getItem('aiProductRpg.v1') || 'null');
      const t = JSON.parse(localStorage.getItem('conceptTower.v1') || 'null');
      const rk = Object.keys((r && r.ach) || {});
      achN = rk.length + Object.keys((t && t.ach) || {}).filter(k => !rk.includes(k)).length;
    } catch (e) {}
    const achTotal = 18;
    openModal('背包 · BACKPACK',
      '<div style="display:flex;flex-direction:column;gap:10px">' +
      '<div style="display:flex;gap:12px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:12px 14px"><span style="font-size:28px">🧪</span><div><b style="color:var(--ink)">加速药剂 ×' + potions + '</b><div style="color:var(--dim);font-size:12px;line-height:1.7">本章零失误获得 · 点击<b>左下角盆栽</b>使用（+10分钟生长）</div></div></div>' +
      '<div style="display:flex;gap:12px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:12px 14px"><span style="font-size:28px">🌱</span><div><b style="color:var(--ink)">伴学植物</b><div style="color:var(--dim);font-size:12px;line-height:1.7">学习时长会浇灌它 · 左下角盆栽窗口查看三盆状态</div></div></div>' +
      '<div style="display:flex;gap:12px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:12px 14px"><span style="font-size:28px">🏆</span><div><b style="color:var(--ink)">成就 ×' + achN + '/' + achTotal + '</b><div style="color:var(--dim);font-size:12px;line-height:1.7">跨两个游戏统计 · 系统菜单可开成就墙</div></div></div>' +
      '<div style="color:var(--dim);font-size:12px;line-height:1.8">RPG 的道具走"剧情获得"路线：零失误章节得 🧪，压轴复盘和结局在各章末尾。塔的金币道具体系在试炼塔的背包里。</div></div>');
  }
  /* 打赏：请作者喝杯奶茶（零后端，静态收款码） */
  function openTipR() {
    openModal('🎋 求个上上签 · DAILY FORTUNE', window.TIP ? TIP.html() : '配置中');
    if (window.TIP) TIP.wire();
  }
  function openYearbookR() {
    if (!window.FEEDBACK) return;
    openModal('NOVA 年鉴 · YEARBOOK', FEEDBACK.html('rpg'));
    FEEDBACK.wire('rpg');
    const tb = $('fbTip');
    if (tb) tb.onclick = openTipR;
  }
  function boot() {
    initTermTip();
    if (window.DOCK) DOCK.mount({
      onBag: modalBagR,
      onBook: openYearbookR,
      onTip: openTipR
    });
    if (window.BGM) {
      const kick = () => { window.BGM.tryStart(); document.removeEventListener('click', kick); };
      document.addEventListener('click', kick);
    }
    renderTicker();
    const saved = load();
    if (saved) {
      S = saved;
      if (S.finished) { renderAll(); chapterEnd(); }
      else resumeGame();
    } else {
      S = newState(''); // 临时状态，仅用于面板渲染
      renderAll();
      startScreen();
    }
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
