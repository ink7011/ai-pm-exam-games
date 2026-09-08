/* ============================================================
   AI PRODUCT RPG — 伴学植物系统 v2
   三盆：文竹（开局）/ 风铃草（累计3小时）/ 星语藤（通关解锁·虚构）
   · 时长生长（各 5-8 档）· 零失误章节可获得 🧪 加速药剂（+10分钟）
   · 连续 3 小时温柔休息提醒（不强制，可继续）
   ============================================================ */
(function () {
  'use strict';
  const TIME_KEY = 'aiProductRpg.time';
  const VINE_KEY = 'aiProductRpg.vineBorn';

  const STAGES_A = [0, 20, 45, 90, 150, 240, 360, 540];   // 文竹 1-8 枝
  const STAGES_B = [0, 30, 90, 180, 300];                  // 风铃草 1-5 铃
  const STAGES_V = [0, 60, 180, 360, 600];                 // 星语藤 1-5 星
  const UNLOCK_B = 180;                                    // 风铃草：累计 3 小时
  const POTION_MIN = 10;                                   // 药剂 = +10 分钟生长

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function loadMin() { return parseFloat(lsGet(TIME_KEY)) || 0; }
  function rpgSave() { try { return JSON.parse(lsGet('aiProductRpg.v1') || 'null'); } catch (e) { return null; } }
  function gameStarted() { const s = rpgSave(); return !!(s && s.started); }
  function stageOf(stages, m) {
    let n = 1;
    for (let i = 0; i < stages.length; i++) if (m >= stages[i]) n = i + 1;
    return Math.min(n, stages.length);
  }
  function humanTime(min) {
    const h = Math.floor(min / 60), m = Math.floor(min % 60);
    return (h > 0 ? h + ' 小时 ' : '') + m + ' 分钟';
  }
  function toast(msg, cls) {
    const root = document.getElementById('toastRoot');
    if (!root) return;
    const t = document.createElement('div');
    t.className = 'toast ' + (cls || 'ok');
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 3200);
    setTimeout(() => t.remove(), 3700);
  }

  /* ---------- 文竹（同 v1） ---------- */
  function frondSVG(angle, len, flip, delay) {
    const tipX = 50 + Math.sin(angle) * (6 + len * 0.55);
    const tipY = 64 - len;
    const cx = 50 + Math.sin(angle) * (2 + len * 0.3);
    const cy = 64 - len * 0.55;
    let branches = '';
    for (let k = 1; k <= 5; k++) {
      const tt = k / 6;
      const bx = 50 + (tipX - 50) * (tt * tt * 0.6 + tt * 0.4) + (cx - 50) * (1 - tt) * 0.5;
      const by = 64 + (tipY - 64) * (tt * tt * 0.6 + tt * 0.4) + (cy - 64) * (1 - tt) * 0.5;
      const dir = (k % 2 === 0 ? 1 : -1) * flip;
      const bl = 5 + k * 1.2;
      const ex = bx + dir * bl * 0.9, ey = by - bl * 0.55;
      branches += '<path d="M' + bx.toFixed(1) + ',' + by.toFixed(1) + ' Q' + (bx + dir * bl * 0.5).toFixed(1) + ',' + (by - bl * 0.3).toFixed(1) + ' ' + ex.toFixed(1) + ',' + ey.toFixed(1) + '" class="pl-branch"/>';
      branches += '<circle cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="1" class="pl-leaf"/>';
    }
    return '<g class="pl-frond" style="animation-delay:' + delay + 's">' +
      '<path d="M50,64 Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + tipX.toFixed(1) + ',' + tipY.toFixed(1) + '" class="pl-stem"/>' + branches + '</g>';
  }
  function potA(min) {
    const n = stageOf(STAGES_A, min);
    let fronds = '';
    const spread = [-0.62, 0.55, -0.35, 0.3, -0.12, 0.05, -0.5, 0.45];
    for (let i = 0; i < n; i++) {
      const ang = spread[i];
      fronds += frondSVG(ang, 30 + (i % 3) * 9 + (i > 5 ? 6 : 0), ang >= 0 ? 1 : -1, (i * 0.7) % 4);
    }
    return soilAndPot() + fronds;
  }

  /* ---------- 风铃草：茎 + 悬垂小铃铛 ---------- */
  function bellSVG(x, y, s) {
    return '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(' + s + ')">' +
      '<path d="M0,0 C-4,2 -5,7 -4,11 C-2,13 2,13 4,11 C5,7 4,2 0,0 Z" class="bf-bell"/>' +
      '<path d="M-4,11 L-2.6,13 M0,12 L0,14.5 M4,11 L2.6,13" class="bf-rim"/>' +
      '<circle cx="0" cy="15" r="1.2" class="bf-clap"/>' +
      '<line x1="0" y1="-3" x2="0" y2="0" class="bf-stem"/></g>';
  }
  function potB(min) {
    const since = Math.max(0, min - UNLOCK_B);
    const n = stageOf(STAGES_B, since);
    let out = '<path d="M50,64 Q46,50 52,40 Q58,30 54,22" class="bf-vine"/>';
    const pos = [[54, 22, 1], [43, 36, 0.85], [60, 44, 0.9], [46, 50, 0.75], [58, 55, 0.7]];
    for (let i = 0; i < n; i++) out += bellSVG(pos[i][0], pos[i][1], pos[i][2]);
    out += '<ellipse cx="44" cy="46" rx="5" ry="2.4" class="pl-leaf2" transform="rotate(-24 44 46)"/>';
    out += '<ellipse cx="58" cy="52" rx="5" ry="2.4" class="pl-leaf2" transform="rotate(20 58 52)"/>';
    return soilAndPot() + out;
  }

  /* ---------- 星语藤（虚构）：蜿蜒藤 + 发光小星 ---------- */
  function starSVG(x, y, s, d) {
    return '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(' + s + ')" class="vine-star" style="animation-delay:' + d + 's">' +
      '<path d="M0,-6 L1.6,-1.6 L6,0 L1.6,1.6 L0,6 L-1.6,1.6 L-6,0 L-1.6,-1.6 Z" class="vs-star"/>' +
      '<circle cx="0" cy="0" r="1.1" class="vs-core"/></g>';
  }
  function potV(min) {
    const born = parseFloat(lsGet(VINE_KEY)) || 0;
    const since = Math.max(0, min - born);
    const n = stageOf(STAGES_V, since);
    let out = '<path d="M50,64 Q42,52 52,42 Q62,34 54,24 Q46,16 52,8" class="vs-vine"/>' +
      '<path d="M50,64 Q58,56 48,46" class="vs-vine thin"/>';
    const stars = [[52, 8, 1, 0], [54, 24, 0.8, 1.2], [44, 38, 0.7, 2.1], [60, 50, 0.65, 0.6], [47, 56, 0.55, 1.8]];
    for (let i = 0; i < n; i++) out += starSVG(stars[i][0], stars[i][1], stars[i][2], stars[i][3]);
    return soilAndPot() + out;
  }

  function soilAndPot() {
    return '<ellipse cx="50" cy="66" rx="17" ry="3" class="pl-soil"/>' +
      '<path d="M32,66 L37,92 L63,92 L68,66 Z" class="pl-pot"/>' +
      '<rect x="30" y="63" width="40" height="5" rx="2" class="pl-potrim"/>';
  }

  /* ---------- 状态计算 ---------- */
  function pots(min) {
    const s = rpgSave() || {};
    const a = stageOf(STAGES_A, min);
    const bUnlocked = min >= UNLOCK_B;
    const b = bUnlocked ? stageOf(STAGES_B, min - UNLOCK_B) : 0;
    const vUnlocked = !!s.finished;
    const v = vUnlocked ? stageOf(STAGES_V, min - (parseFloat(lsGet(VINE_KEY)) || min)) : 0;
    return { a, bUnlocked, b, vUnlocked, v };
  }
  function checkUnlockToast(prevMin, min) {
    const p1 = stageOf(STAGES_A, prevMin), p2 = stageOf(STAGES_A, min);
    if (p2 > p1) toast('🌱 你的文竹长出了第 ' + p2 + ' 枝！');
    if (min >= UNLOCK_B && prevMin < UNLOCK_B) toast('🔔 累计 ' + humanTime(min) + '——一株风铃草在你的窗台醒了');
    const s = rpgSave() || {};
    if (s.finished && !lsGet(VINE_KEY)) {
      lsSet(VINE_KEY, String(min));
      if (window.ACHS) window.ACHS.unlock('rpg_vine');   // P2-1：星语藤发芽
    }
  }

  /* ---------- 渲染 ---------- */
  function render() {
    const box = document.getElementById('plantBox');
    if (!box) return;
    const min = loadMin();
    const st = pots(min);
    const s = rpgSave() || {};
    const potions = s.potions || 0;
    const svg = (inner, cls) =>
      '<svg viewBox="0 0 100 100" width="84" height="84" class="' + cls + '" aria-hidden="true">' + inner + '</svg>';
    box.innerHTML =
      '<button class="pot" aria-label="文竹，第 ' + st.a + ' 阶">' + svg(potA(min), '') + '</button>' +
      '<button class="pot' + (st.bUnlocked ? '' : ' locked') + '" aria-label="风铃草' + (st.bUnlocked ? '，第 ' + st.b + ' 阶' : '（未解锁）') + '">' + (st.bUnlocked ? svg(potB(min), '') : svg(soilAndPot() + '<circle cx="50" cy="58" r="2" class="pl-seed"/>', '')) + '</button>' +
      '<button class="pot' + (st.vUnlocked ? '' : ' locked') + '" aria-label="星语藤' + (st.vUnlocked ? '，第 ' + st.v + ' 阶' : '（未解锁）') + '">' + (st.vUnlocked ? svg(potV(min), '') : svg(soilAndPot() + '<circle cx="50" cy="58" r="2" class="pl-seed"/>', '')) + '</button>' +
      '<div class="pl-menu" id="plantMenu">' +
      '<div class="pm-row">🌱 文竹 · ' + st.a + '/8 枝</div>' +
      (st.bUnlocked
        ? '<div class="pm-row">🔔 风铃草 · ' + st.b + '/5 铃</div>'
        : '<div class="pm-row dim">🔔 风铃草 · 再陪 ' + Math.ceil(UNLOCK_B - min) + ' 分钟会醒来</div>') +
      (st.vUnlocked
        ? '<div class="pm-row">✨ 星语藤 · ' + st.v + '/5 星</div>'
        : '<div class="pm-row dim">✨ 星语藤 · 通关 Season 1 解锁</div>') +
      '<div class="pm-row pm-time">⏱ 累计陪伴 ' + (gameStarted() ? humanTime(min) : '0 分钟') + '</div>' +
      '<button class="pm-potion' + (potions > 0 ? '' : ' off') + '" id="usePotion">🧪 使用加速药剂 ×' + potions + '（+' + POTION_MIN + ' 分钟）</button>' +
      '<div class="pm-lore">✨ 星语藤：据说它会在主人专注时轻声拼出单词。没有人知道它来自哪里——也许，是某段训练语料里逃出来的一首诗。</div>' +
      '</div>';
    bindMenu();
  }
  function bindMenu() {
    const btn = document.getElementById('usePotion');
    if (!btn) return;
    btn.onclick = (e) => {
      e.stopPropagation();
      const s = rpgSave() || {};
      if (!(s.potions > 0)) return;
      s.potions -= 1;
      lsSet('aiProductRpg.v1', JSON.stringify(s));
      const prev = loadMin();
      const now = prev + POTION_MIN;
      lsSet(TIME_KEY, String(now));
      checkUnlockToast(prev, now);
      render();
      const box = document.getElementById('plantBox');
      if (box) { box.classList.add('boost'); setTimeout(() => box.classList.remove('boost'), 1200); }
      toast('🧪 药剂生效：植物们快进了 ' + POTION_MIN + ' 分钟', 'gold');
    };
  }

  /* ---------- 休息提醒 ---------- */
  let sessionMin = 0, nextRestAt = 180, restShown = false;
  function ensureRestOverlay() {
    if (document.getElementById('restOverlay')) return;
    const ov = document.createElement('div');
    ov.id = 'restOverlay';
    ov.innerHTML =
      '<div class="rest-card">' +
      '<div class="rest-emoji">🌿☕🌤️</div>' +
      '<h2>已经连续 3 小时啦</h2>' +
      '<p>站一站，伸伸懒腰，喝杯咖啡，看看阳光，走一走。<br>进度已自动保存，三盆小植物会替你守着工位。</p>' +
      '<button class="rest-btn" id="restGo">去休息一会儿 🚶</button>' +
      '<button class="rest-btn ghost" id="restStay">再玩一会（45 分钟后再提醒我）</button>' +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector('#restGo').onclick = hide;
    ov.querySelector('#restStay').onclick = hide;
    function hide() {
      ov.classList.remove('show');
      nextRestAt = sessionMin + 45;
      restShown = false;
    }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    if (document.getElementById('plantBox')) return;
    const box = document.createElement('div');
    box.id = 'plantBox';
    box.setAttribute('role', 'button');
    box.setAttribute('tabindex', '0');
    box.setAttribute('aria-label', '伴学植物 · 查看生长与道具');
    document.body.appendChild(box);
    render();
    const toggleMenu = () => {
      box.classList.toggle('open');
      box.setAttribute('aria-expanded', box.classList.contains('open') ? 'true' : 'false');
      render();
    };
    box.addEventListener('click', (e) => {
      // 点在菜单内部（药剂按钮自己有处理器）不切换
      if (e.target.closest && e.target.closest('.pl-menu')) return;
      // 必须阻止冒泡：render() 会重建 innerHTML，把 e.target 从 DOM 摘下，
      // 若冒泡到 document，closest('#plantBox') 会失败而误关菜单
      e.stopPropagation();
      toggleMenu();
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest || !e.target.closest('#plantBox')) {
        box.classList.remove('open');
        box.setAttribute('aria-expanded', 'false');
      }
    });
    ensureRestOverlay();
    setInterval(() => {
      if (document.visibilityState !== 'visible' || !gameStarted()) return;
      // T1 修复：每 tick 从 localStorage 重读，与 usePotion 的直接写入保持同源，
      // 避免闭包累计值把药剂加成整写覆盖掉
      const prev = loadMin();
      const min = prev + 0.5; sessionMin += 0.5;
      lsSet(TIME_KEY, String(min));
      checkUnlockToast(prev, min);
      render();
      if (!restShown && gameStarted() && sessionMin >= nextRestAt) {
        restShown = true;
        const ov = document.getElementById('restOverlay');
        if (ov) ov.classList.add('show');
      }
    }, 30000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
