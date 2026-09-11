/* ============================================================
   SHUAMONE OPC ENGINE — One-Person Company Simulation
   复用 PM RPG 引擎骨架（SIM 配置驱动），去掉 Boss/技能树/词典等 RPG 特有层
   ============================================================ */
(function () {
  'use strict';
  const SAVE_KEY = 'novaOpc.v1';
  const C = window.CONTENT;
  const SIM = C.SIM;

  /* ---------- 存档 ---------- */
  function freshS(name) {
    return {
      v: 1, started: true, name: name || 'Founder', role: SIM.startRole,
      company: Object.assign({}, SIM.init),
      nodeIdx: 0, phase: 'intro', roundIdx: 0,
      clues: [], roundPicked: [], roundWrong: 0, revealed: false, roundAttempted: false,
      marks: {}, echoDone: {},
      stats: { firstTry: 0, total: 0, wrongTotal: 0 },
      finished: false, finalGrade: ''
    };
  }
  function migrate(s) {
    if (!s) return s;
    if (!s.marks) s.marks = {};
    if (!s.echoDone) s.echoDone = {};
    if (!s.stats) s.stats = { firstTry: 0, total: 0, wrongTotal: 0 };
    return s;
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (s && s.v === 1 && s.started) return migrate(s);
    } catch (e) {}
    return null;
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
  let S = load();

  /* ---------- 指标 ---------- */
  function applyFx(fx) {
    if (!fx) return;
    let changed = false;
    Object.keys(fx).forEach(k => {
      if (S.company[k] === undefined) return;
      const d = Math.round(fx[k]);
      const max = (k === 'runway') ? 24 : (k === 'revenue') ? 100 : 100;
      S.company[k] = Math.max(0, Math.min(max, S.company[k] + d));
      changed = true;
    });
    if (changed) { renderMetrics(); save(); }
  }
  function applyDrift() {
    const DR = SIM.drift || {};
    const drift = {};
    Object.keys(DR).forEach(k => {
      const [mn, mx] = DR[k];
      drift[k] = mn + Math.floor(Math.random() * (mx - mn + 1));
    });
    applyFx(drift);
    return drift;
  }

  /* ---------- 结局 ---------- */
  function checkFail() {
    const F = SIM.final || {};
    for (const fs of (F.failStates || [])) {
      if ((S.company[fs.metric] || 0) < fs.below) return fs;
    }
    return null;
  }
  function companyAvgCalc() {
    const F = SIM.final || {};
    const W = F.weights || {};
    let sum = 0, wsum = 0;
    Object.keys(W).forEach(k => {
      const w = W[k] || 0;
      sum += (S.company[k] || 0) * w; wsum += w;
    });
    return wsum ? Math.round(sum / wsum) : 0;
  }
  function finalTier() {
    const fail = checkFail();
    if (fail) return { grade: 'F', name: fail.name, headline: fail.headline, victor: fail.victor, lin: fail.lin, cls: 'tier-fail', kicker: 'OPC SIMULATION FAILED', title: fail.name };
    const avg = companyAvgCalc();
    const tiers = (SIM.final || {}).tiers || [];
    const gate = (SIM.final || {}).legendGate || {};
    if (tiers[0] && avg >= (gate.min || tiers[0].min || 55)) return tiers[0];
    for (let i = 1; i < tiers.length; i++) {
      if (avg >= (tiers[i].min || 0)) return tiers[i];
    }
    return tiers[tiers.length - 1] || {};
  }

  /* ---------- Learner Model ---------- */
  function rpgSkillFeed(kind) {
    if (!window.LE) return;
    const feed = SIM.skillFeed || {};
    const gains = feed[kind] || {};
    Object.keys(gains).forEach(sk => window.LE.addXp(sk, gains[sk]));
    window.LE.track('opcMilestone', { kind: kind, gains: gains });
  }

  /* ---------- 渲染 ---------- */
  function $(id) { return document.getElementById(id); }
  function h(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

  function renderMetrics() {
    const host = $('metrics');
    if (!host) return;
    host.innerHTML = '';
    SIM.metrics.forEach(m => {
      const v = S.company[m.id] || 0;
      const pct = Math.min(100, (m.id === 'runway' ? v * (100 / 24) : v));
      const bar = h('div', 'opc-metric', `<span class="ml">${esc(m.label)}</span><span class="mt"><span class="mf${v < 20 ? ' low' : ''}" style="width:${pct}%"></span></span><span class="mv">${v}${m.id === 'runway' ? 'mo' : ''}</span>`);
      host.appendChild(bar);
    });
  }
  function renderMsgs(container) {
    const feed = $('msgFeed');
    if (!feed) return;
    feed.querySelectorAll('.opc-node-msg').forEach(e => e.remove());
  }
  function addMsg(npcKey, text, urgent) {
    const feed = $('msgFeed'); if (!feed) return;
    const npc = C.NPCS[npcKey] || C.NPCS.sys || { name: npcKey, color: '#8b9bb4' };
    const d = h('div', 'opc-msg' + (urgent ? ' urgent' : ''));
    d.innerHTML = `<span class="nm" style="color:${npc.color || '#8b9bb4'}">${esc(npc.name)}</span><span class="nt">${esc(text)}</span>`;
    feed.appendChild(d);
    feed.scrollTop = feed.scrollHeight;
  }

  /* ---------- 节点流程 ---------- */
  function startNode(idx) {
    if (idx >= C.CASES.length) { endSimulation(); return; }
    if (idx > S.nodeIdx) rpgSkillFeed('chapter');
    S.nodeIdx = idx; S.phase = 'intro'; S.clues = [];
    S.roundIdx = 0; S.roundPicked = []; S.roundWrong = 0; S.revealed = false; S.roundAttempted = false;
    save();
    renderNodePanel();
    renderAll();
  }
  function renderNodePanel() {
    const cs = C.CASES[S.nodeIdx];
    if (!cs) return;
    const panel = $('nodePanel'); if (!panel) return;
    panel.innerHTML = `<div class="opc-kicker">NODE ${S.nodeIdx + 1} / ${C.CASES.length}</div><div class="opc-title">${esc(cs.title)}</div><div class="opc-brief">${esc(cs.brief)}</div>`;
  }
  function playIntro() {
    const cs = C.CASES[S.nodeIdx];
    (cs.echoes || []).forEach(ez => {
      const key = S.nodeIdx + ':' + ez.mark;
      if (!S.marks[ez.mark] || S.echoDone[key]) return;
      S.echoDone[key] = 1;
      setTimeout(() => addMsg(ez.npc || 'sys', ez.text, true), 1200);
      if (ez.fx) setTimeout(() => applyFx(ez.fx), 1400);
      save();
    });
    cs.intro.forEach((m, i) => {
      setTimeout(() => { if (m.sys) addMsg('sys', m.sys); else if (m.npc) addMsg(m.npc, m.text); }, i * 400);
    });
    setTimeout(() => { S.phase = 'investigate'; renderActionBar(); save(); }, cs.intro.length * 400 + 600);
  }
  function renderActionBar() {
    const bar = $('actionBar'); if (!bar) return;
    bar.innerHTML = '';
    if (S.phase === 'intro') {
      const b = h('button', 'opc-btn primary', '开始调查 ▸');
      b.onclick = () => { S.phase = 'investigate'; renderActionBar(); };
      bar.appendChild(b);
    } else if (S.phase === 'investigate') {
      const cs = C.CASES[S.nodeIdx];
      bar.innerHTML = `<div class="opc-label">// INVESTIGATE · 剩余 ${cs.investigate.budget - S.clues.length}</div><div class="opc-btns"></div>`;
      const btns = bar.querySelector('.opc-btns');
      cs.investigate.options.forEach(op => {
        const used = S.clues.includes(op.id);
        const b = h('button', 'opc-btn' + (used ? ' done' : ''), (used ? '✓ ' : '🔍 ') + esc(op.label));
        if (used) b.disabled = true;
        b.onclick = () => {
          S.clues.push(op.id);
          addMsg('sys', op.clue);
          renderActionBar(); save();
        };
        btns.appendChild(b);
      });
      // budget 强制：耗尽时禁用全部线索按钮
      const left = cs.investigate.budget - S.clues.length;
      if (left <= 0) btns.querySelectorAll('.opc-btn:not(.primary)').forEach(b => b.disabled = true);
      const go = h('button', 'opc-btn primary', '我有了判断 → 进入决策');
      go.disabled = S.clues.length === 0;
      go.onclick = () => { S.phase = 'decide'; renderDecide(); };
      btns.appendChild(go);
    }
  }
  function renderDecide() {
    const cs = C.CASES[S.nodeIdx];
    const round = cs.rounds[S.roundIdx];
    if (!round) { nextNode(); return; }
    const bar = $('actionBar');
    bar.innerHTML = `<div class="opc-label">// DECISION · ${esc(round.q)}</div><div class="opc-opts"></div>`;
    const opts = bar.querySelector('.opc-opts');
    round.options.forEach((op, i) => {
      const b = h('button', 'opc-opt', esc(op.t));
      b.onclick = () => chooseOption(round, i, b);
      opts.appendChild(b);
    });
    S.phase = 'decide'; save();
  }
  function chooseOption(round, i, btnEl) {
    const op = round.options[i];
    applyFx(op.fx);
    if (op.mark) { S.marks[op.mark] = (S.marks[op.mark] || 0) + 1; save(); }
    if (!S.roundAttempted) { S.stats.total++; if (op.ok) S.stats.firstTry++; S.roundAttempted = true; }
    const verdict = $('verdict'); if (!verdict) return;
    verdict.innerHTML = `<div class="opc-verdict ${op.ok ? 'good' : 'warn'}"><b>${op.ok ? '✓ 好判断' : '△ 有代价的选择'}</b><br>${esc(op.fb)}<br><span class="why">${esc(op.why)}</span></div>`;
    const next = h('button', 'opc-btn primary', '下一节点 ▸');
    next.onclick = () => { $('verdict').innerHTML = ''; nextNode(); };
    verdict.appendChild(next);
    renderActionBar(); save();
  }
  function nextNode() {
    const drift = applyDrift();
    const fail = checkFail();
    if (fail) { endSimulation(fail); return; }   // V0.6: 即时出局（不是等到最后一屏）
    addMsg('sys', '节点结算——精力-' + Math.abs(drift.energy || 0) + '，Runway-' + Math.abs(drift.runway || 0) + ' 月。');
    S.nodeIdx++;
    if (S.nodeIdx >= C.CASES.length) { endSimulation(); return; }
    S.phase = 'intro'; S.clues = []; S.roundIdx = 0; save();
    renderNodePanel(); playIntro(); renderActionBar();
  }
  function endSimulation(failOverride) {
    S.finished = true;
    rpgSkillFeed('finished');
    const tier = failOverride || finalTier();
    S.finalGrade = tier.grade;
    save();
    const host = $('gameScreen');
    host.innerHTML = `
      <div class="opc-card opc-result">
        <div class="opc-kicker">${esc(tier.kicker || 'OPC COMPLETE')}</div>
        <div class="opc-tier ${tier.cls || ''}">${esc(tier.title || tier.name)}</div>
        <div class="opc-headline">${esc(tier.headline || '')}</div>
        <div class="opc-quote"><b>VC 朋友：</b>${esc(tier.victor || '')}</div>
        <div class="opc-quote"><b>AI Agent：</b>${esc(tier.lin || '')}</div>
        <div class="opc-stats">
          <div>Revenue: $${S.company.revenue * 10}/mo</div>
          <div>Runway: ${S.company.runway} months</div>
          <div>Energy: ${S.company.energy}%</div>
          <div>首答正确率: ${S.stats.total ? Math.round(S.stats.firstTry / S.stats.total * 100) : 0}%</div>
        </div>
        <button class="opc-btn primary" onclick="localStorage.removeItem('${SAVE_KEY}');location.reload()">再玩一次 ▸</button>
        <a class="opc-link" href="../">◂ 回 Hub</a>
      </div>`;
  }

  /* ---------- 主渲染 ---------- */
  function renderAll() {
    renderMetrics(); renderNodePanel(); renderActionBar();
  }
  function boot() {
    const startHost = $('startScreen');
    const gameHost = $('gameScreen');
    if (!S) {
      gameHost.style.display = 'none'; startHost.style.display = 'flex';
      const btn = $('startBtn'); if (btn) btn.onclick = () => {
        const name = ($('nameInput') || {}).value || 'Founder';
        S = freshS(name); save();
        startHost.style.display = 'none'; gameHost.style.display = 'flex';
        renderAll(); playIntro(); renderActionBar();
      };
      return;
    }
    startHost.style.display = 'none'; gameHost.style.display = 'flex';
    renderAll();
    if (!S.finished) playIntro();
    else endSimulation();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.OPCTEST = { finalTier: finalTier, startNode: startNode, S: S };
})();
