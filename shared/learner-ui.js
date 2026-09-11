/* NOVA Learner UI · V0.5 —— onboarding 覆盖层 + Hub「Your Career Journey」面板
   依赖 shared/learner.js。渲染风格：Game + Sci-Fi + Career（深底 / 霓虹青 / 等宽小字），零依赖。 */
(function () {
  'use strict';
  var css = '' +
    '.lj-panel{position:relative;background:linear-gradient(150deg,rgba(14,19,29,.92),rgba(10,14,24,.96));border:1px solid #26324a;border-radius:22px;padding:26px 30px;margin:26px 0 8px;overflow:hidden}' +
    '.lj-panel::before{content:"";position:absolute;inset:0;background:radial-gradient(600px 200px at 85% -10%,rgba(34,211,238,.10),transparent 60%),radial-gradient(400px 180px at 0% 110%,rgba(167,139,250,.08),transparent 60%);pointer-events:none}' +
    '.lj-kicker{font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:4px;color:#22d3ee;margin-bottom:12px}' +
    '.lj-head{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}' +
    '.lj-name{font-size:26px;font-weight:900;color:#e8f0fb}' +
    '.lj-role{font-size:13px;color:#8b9bb4}' +
    '.lj-lv{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#fbbf24;border:1px solid rgba(251,191,36,.4);border-radius:8px;padding:3px 10px}' +
    '.lj-meta{display:flex;gap:26px;flex-wrap:wrap;margin:14px 0 6px}' +
    '.lj-meta b{display:block;font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:3px;color:#5a6b84;margin-bottom:3px;font-weight:400}' +
    '.lj-meta span{font-size:14.5px;color:#dbe4f0}' +
    '.lj-bars{margin:16px 0 6px;display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px 22px}' +
    '.lj-bar{display:flex;align-items:center;gap:10px;font-size:12.5px}' +
    '.lj-bar .lb{width:118px;color:#8b9bb4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.lj-bar .lt{flex:1;height:7px;background:#131a2b;border-radius:4px;overflow:hidden;position:relative}' +
    '.lj-bar .lf{height:100%;background:linear-gradient(90deg,#0e7490,#22d3ee);border-radius:4px;transition:width .5s}' +
    '.lj-bar .lv{width:26px;text-align:right;font-family:ui-monospace,Menlo,monospace;color:#67e8f9;font-size:11.5px}' +
    '.lj-chips{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 2px}' +
    '.lj-chip{font-size:11.5px;padding:4px 12px;border-radius:999px;border:1px solid #26324a;color:#8b9bb4}' +
    '.lj-chip.up{color:#34d399;border-color:rgba(52,211,153,.45)}' +
    '.lj-chip.grow{color:#fbbf24;border-color:rgba(251,191,36,.45)}' +
    '.lj-quest{margin-top:16px;border:1px solid rgba(34,211,238,.35);background:rgba(34,211,238,.05);border-radius:16px;padding:16px 20px}' +
    '.lj-quest .qt{font-size:15px;font-weight:800;color:#e8f0fb}' +
    '.lj-quest .qs{font-size:13px;color:#8b9bb4;margin:6px 0 8px;line-height:1.6}' +
    '.lj-quest .qw{font-size:12px;color:#67e8f9}' +
    '.lj-quest .qa{display:inline-block;margin-top:12px;font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:2px;color:#04141a;background:linear-gradient(90deg,#22d3ee,#67e8f9);padding:9px 20px;border-radius:10px;text-decoration:none;font-weight:700}' +
    '.lj-links{margin-top:14px;display:flex;gap:18px;font-size:12.5px}' +
    '.lj-links a{color:#8b9bb4;text-decoration:none;border-bottom:1px dashed #33405c;padding-bottom:2px}' +
    '.lj-links a:hover{color:#22d3ee}' +
    '.lj-empty{margin:26px 0 8px;border:1px dashed #26324a;border-radius:22px;padding:30px;text-align:center;color:#8b9bb4;background:rgba(14,19,29,.6)}' +
    '.lj-empty .big{font-size:19px;font-weight:800;color:#dbe4f0;margin-bottom:8px}' +
    '.lj-empty a{display:inline-block;margin-top:14px;color:#04141a;background:linear-gradient(90deg,#22d3ee,#67e8f9);padding:10px 24px;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px}' +
    /* onboarding 覆盖层 */
    '.lj-ob{position:fixed;inset:0;z-index:9999;background:rgba(4,7,15,.86);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px}' +
    '.lj-obc{width:min(560px,94vw);background:linear-gradient(160deg,#0e131d,#0a0f1c);border:1px solid #26324a;border-radius:24px;padding:34px 36px;position:relative;overflow:hidden}' +
    '.lj-obc::before{content:"";position:absolute;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.14),transparent 65%);top:-120px;right:-100px}' +
    '.lj-step{font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:4px;color:#22d3ee;margin-bottom:10px}' +
    '.lj-q{font-size:21px;font-weight:900;color:#e8f0fb;margin-bottom:4px}' +
    '.lj-sub{font-size:12.5px;color:#5a6b84;margin-bottom:18px}' +
    '.lj-opts{display:flex;flex-direction:column;gap:9px}' +
    '.lj-opt{text-align:left;padding:13px 18px;border:1px solid #26324a;border-radius:13px;background:#101827;color:#dbe4f0;font-size:14.5px;cursor:pointer;transition:all .15s;display:flex;justify-content:space-between;align-items:center}' +
    '.lj-opt small{color:#5a6b84;font-size:11.5px}' +
    '.lj-opt:hover{border-color:rgba(34,211,238,.6);background:#12203a;transform:translateX(3px)}' +
    '.lj-opt.on{border-color:#22d3ee;background:rgba(34,211,238,.10)}' +
    '.lj-next{margin-top:20px;width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(90deg,#22d3ee,#67e8f9);color:#04141a;font-weight:800;font-size:14.5px;cursor:pointer;letter-spacing:1px}' +
    '.lj-next:disabled{opacity:.35;cursor:not-allowed}' +
    '.lj-skip{position:absolute;top:16px;right:20px;font-size:11.5px;color:#5a6b84;cursor:pointer;text-decoration:none}' +
    '.lj-skip:hover{color:#8b9bb4}' +
    '.lj-dots{display:flex;gap:6px;margin-top:16px;justify-content:center}' +
    '.lj-dot{width:22px;height:3px;border-radius:2px;background:#26324a}' +
    '.lj-dot.on{background:#22d3ee}' +
    '.lj-ready{text-align:center;padding:16px 0 4px}' +
    '.lj-ready .r1{font-family:ui-monospace,Menlo,monospace;color:#22d3ee;letter-spacing:5px;font-size:13px;margin-bottom:10px}' +
    '.lj-ready .r2{font-size:24px;font-weight:900;color:#e8f0fb;margin-bottom:8px}' +
    '.lj-ready .r3{font-size:13px;color:#8b9bb4}';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fmtTime(t) { if (!t) return ''; var d = new Date(t); return (d.getMonth() + 1) + '/' + d.getDate(); }

  function rpgName() {
    try { var s = JSON.parse(localStorage.getItem('aiProductRpg.v1') || 'null'); if (s && s.name) return s.name; } catch (e) {}
    return '';
  }

  /* ---------- Onboarding（≤3 问） ---------- */
  function onboarding(onDone) {
    var LE = window.LE;
    var st = document.createElement('div');
    st.className = 'lj-ob';
    var step = 0, goalId = null, stageId = null, focusSel = [];
    var data = { goals: LE.GOALS, stages: LE.STAGES, focus: LE.FOCUS_AREAS };
    document.body.appendChild(st);
    try { localStorage.setItem('nova.learner.visited', '1'); } catch (e) {}
    LE && LE.track && window.LE.track('firstVisit', {});

    function opt(id, label, zh, cur) {
      return '<button type="button" class="lj-opt' + (cur === id ? ' on' : '') + '" data-v="' + id + '"><span>' + esc(label) + '</span><small>' + esc(zh) + '</small></button>';
    }
    function render() {
      var inner = '';
      if (step === 0) {
        inner = '<div class="lj-step">QUESTION 01 / 03</div><div class="lj-q">What are you trying to become?</div><div class="lj-sub">你正在努力成为什么？</div><div class="lj-opts">' +
          data.goals.map(function (g) { return opt(g.id, g.label, g.zh, goalId); }).join('') + '</div>';
      } else if (step === 1) {
        inner = '<div class="lj-step">QUESTION 02 / 03</div><div class="lj-q">Where are you now?</div><div class="lj-sub">你现在处于哪个阶段？</div><div class="lj-opts">' +
          data.stages.map(function (s) { return opt(s.id, s.label, s.zh, stageId); }).join('') + '</div>';
      } else if (step === 2) {
        inner = '<div class="lj-step">QUESTION 03 / 03</div><div class="lj-q">What do you want to improve?</div><div class="lj-sub">想优先加强哪些方面？（可多选）</div><div class="lj-opts">' +
          data.focus.map(function (f) { return opt(f.id, f.label, '', focusSel.indexOf(f.id) >= 0 ? f.id : null); }).join('') + '</div>';
      } else {
        var g = data.goals.filter(function (x) { return x.id === goalId; })[0] || {};
        inner = '<div class="lj-ready"><div class="r1">WORLD GENERATED</div><div class="r2">Your world is ready ✦</div><div class="r3">Goal: ' + esc(g.label) + ' · 旅程从今天开始</div>' +
          '<button type="button" class="lj-next" id="ljGo">ENTER SHUAMONE ▸</button></div>';
      }
      st.innerHTML = '<div class="lj-obc"><a class="lj-skip" id="ljSkip">' + (step < 3 ? '先随便看看 skip' : '') + '</a>' + inner +
        (step < 3 ? '<button type="button" class="lj-next" id="ljNext"' + ((step === 0 && !goalId) || (step === 1 && !stageId) ? ' disabled' : '') + '>[CONTINUE ▸]</button>' : '') +
        '<div class="lj-dots">' + [0, 1, 2, 3].map(function (i) { return '<div class="lj-dot' + (i <= step ? ' on' : '') + '"></div>'; }).join('') + '</div></div>';

      st.querySelectorAll('.lj-opt').forEach(function (b) {
        b.onclick = function () {
          var v = b.dataset.v;
          if (step === 0) goalId = v;
          else if (step === 1) stageId = v;
          else { var i = focusSel.indexOf(v); if (i >= 0) focusSel.splice(i, 1); else focusSel.push(v); }
          render();
        };
      });
      var nx = st.querySelector('#ljNext');
      if (nx) nx.onclick = function () { step++; render(); };
      var sk = st.querySelector('#ljSkip');
      if (sk) sk.onclick = function () { st.remove(); if (onDone) onDone('skip'); };
      var go = st.querySelector('#ljGo');
      if (go) go.onclick = function () {
        var nm = rpgName() || 'Explorer';
        LE.create(nm, goalId, stageId, focusSel);
        st.remove();
        if (onDone) onDone('done');
      };
    }
    render();
  }

  /* ---------- Hub 面板 ---------- */
  function hubPanel() {
    var LE = window.LE;
    var host = document.getElementById('careerPanel');
    if (!host) return;
    if (LE.needsOnboarding()) {
      // 老塔友：静默迁移（有试炼记录）
      var tp = null;
      try { tp = JSON.parse(localStorage.getItem('conceptTower.v1') || 'null'); } catch (e) {}
      var played = tp && tp.codex && Object.keys(tp.codex).length > 3;
      if (played) {
        LE.migrateExisting(tp);
      } else {
        host.innerHTML = '<div class="lj-empty"><div class="big">这个世界还不认识你</div>回答 3 个问题，建立你的成长档案——之后塔里的每一道题、每一个任务，都会围绕你的目标组织。<br><a href="#" id="ljStart">▸ 开始建立档案（约 30 秒）</a></div>';
        var b = host.querySelector('#ljStart');
        if (b) b.onclick = function (e) { e.preventDefault(); onboarding(function () { hubPanel(); }); };
        if (!localStorage.getItem('nova.learner.visited')) onboarding(function () { hubPanel(); });
        return;
      }
    }
    var S = LE.profile();
    var rk = LE.ranked();
    var bars = rk.slice(0, 5).map(function (s) {
      return '<div class="lj-bar"><span class="lb">' + esc(s.name) + '</span><span class="lt"><span class="lf" style="width:' + s.v + '%"></span></span><span class="lv">' + s.v + '</span></div>';
    }).join('');
    var ups = LE.strengths().map(function (s) { return '<span class="lj-chip up">▲ ' + esc(s.name) + '</span>'; }).join('');
    var grw = LE.growthAreas().map(function (s) { return '<span class="lj-chip grow">◇ ' + esc(s.name) + '</span>'; }).join('');
    var q = LE.currentQuest();
    var questHtml = '';
    if (q) {
      var href = q.kind === 'rpg' ? 'rpg/' : 'tower/?quest=' + q.id;
      var label = q.kind === 'rpg' ? '▸ 进入 AI PRODUCT RPG' : '▸ 接受任务 ENTER QUEST';
      questHtml = '<div class="lj-quest"><div style="font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:3px;color:#fbbf24;margin-bottom:6px">' + (S.questHistory.length ? "TODAY'S QUEST" : 'FIRST QUEST') + ' · ' + esc(q.zh) + '</div>' +
        '<div class="qt">' + esc(q.title) + '</div><div class="qs">' + esc(q.story) + '</div>' +
        '<div class="qw">Why this, why now — ' + esc(LE.questWhy(q)) + '</div>' +
        '<a class="qa" href="' + href + '">' + label + '</a></div>';
    }
    var stg = LE.STAGES.filter(function (x) { return x.id === S.stage; })[0] || {};
    var lv = LE.level();
    host.innerHTML = '<div class="lj-panel">' +
      '<div class="lj-kicker">YOUR CAREER JOURNEY // ' + esc(stg.label ? stg.label.toUpperCase() : '') + '</div>' +
      '<div class="lj-head"><span class="lj-name">' + esc(S.name || 'Explorer') + '</span><span class="lj-role">→ ' + esc(S.goalLabel) + '</span><span class="lj-lv">LEVEL ' + String(lv).padStart(2, '0') + ' · ' + esc(LE.levelTitle()) + '</span></div>' +
      '<div class="lj-meta"><div><b>CURRENT GOAL</b><span>' + esc(S.goalLabel) + '</span></div><div><b>CURRENT STAGE</b><span>' + esc(stg.label || S.stage) + ' · ' + esc(stg.zh || '') + '</span></div><div><b>冒险足迹</b><span>' + S.questHistory.length + ' 段</span></div><div><b>启程</b><span>' + fmtTime(S.createdAt) + '</span></div></div>' +
      '<div class="lj-bars">' + bars + '</div>' +
      ((ups || grw) ? '<div class="lj-chips">' + ups + grw + '</div>' : '') +
      questHtml +
      '<div class="lj-links"><a href="skillmap/">◈ 完整技能图 SKILL MAP</a><a href="journey/">⟡ 成长旅程 CAREER JOURNEY</a></div></div>';
  }

  function boot() {
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    window.LE && window.LE.tick && window.LE.tick();
    hubPanel();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.LUI = { onboarding: onboarding, hubPanel: hubPanel };
})();
