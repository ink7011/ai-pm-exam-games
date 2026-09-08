/* ============================================================
   NOVA 学院 · 过场动画引擎 CINEMA（两游戏共用）
   信箱遮幅 + 打字机 + 点击跳过 + reduced-motion 即显
   脚本正典见 docs/WORLDVIEW.md §7
   用法：CINEMA.play([{h:'[标题]', lines:['…','…'], slam:true}], opts).then(...)
   ============================================================ */
window.CINEMA = (function () {
  'use strict';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var injecting = false;

  function injectStyles() {
    if (document.getElementById('cinemaStyles')) return;
    var st = document.createElement('style');
    st.id = 'cinemaStyles';
    st.textContent =
      '#cinemaOverlay{position:fixed;inset:0;z-index:900;display:none;flex-direction:column;justify-content:center;align-items:center;background:rgba(4,6,10,.97);cursor:pointer;font-family:ui-monospace,\'SF Mono\',Menlo,Consolas,monospace;user-select:none}' +
      '#cinemaOverlay.show{display:flex;animation:cinFade .35s both}' +
      '@keyframes cinFade{from{opacity:0}to{opacity:1}}' +
      '.cin-bar{position:absolute;left:0;right:0;height:11%;background:#020407;z-index:2}' +
      '.cin-bar.t{top:0;animation:cinBarT .5s cubic-bezier(.2,.8,.3,1) both}' +
      '.cin-bar.b{bottom:0;animation:cinBarB .5s cubic-bezier(.2,.8,.3,1) both}' +
      '@keyframes cinBarT{from{transform:translateY(-100%)}to{transform:none}}' +
      '@keyframes cinBarB{from{transform:translateY(100%)}to{transform:none}}' +
      '.cin-stage{max-width:640px;width:88%;min-height:200px;position:relative;z-index:1}' +
      '.cin-scene{animation:cinScene .4s both}' +
      '@keyframes cinScene{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
      '.cin-h{color:#22d3ee;font-size:13px;letter-spacing:3px;margin-bottom:14px;text-shadow:0 0 16px rgba(34,211,238,.4)}' +
      '.cin-line{color:#dbe4f0;font-size:15.5px;line-height:2.15;min-height:2.15em;letter-spacing:.5px}' +
      '.cin-line .caret{display:inline-block;width:9px;height:1.05em;background:#22d3ee;vertical-align:-.18em;margin-left:2px;animation:cinCaret 1s steps(2) infinite}' +
      '@keyframes cinCaret{50%{opacity:0}}' +
      '.cin-h.slam{font-size:24px;letter-spacing:6px;color:#fbbf24;text-shadow:0 0 26px rgba(251,191,36,.55);animation:cinScene .4s both,cinSlam .55s cubic-bezier(.2,.9,.3,1.3) both}' +
      '@keyframes cinSlam{from{transform:scale(1.6);opacity:0;filter:blur(6px)}to{transform:none;opacity:1;filter:none}}' +
      '.cin-h.danger{color:#f87171;text-shadow:0 0 22px rgba(248,113,113,.5)}' +
      '.cin-skip{position:absolute;bottom:13%;right:5%;z-index:3;color:#8b9bb4;font-size:11px;letter-spacing:2px;animation:cinFade .6s 1s both}' +
      '.cin-progress{position:absolute;bottom:13%;left:5%;z-index:3;display:flex;gap:6px}' +
      '.cin-progress i{width:16px;height:2px;background:#233048;border-radius:1px;transition:.3s}' +
      '.cin-progress i.on{background:#22d3ee;box-shadow:0 0 8px rgba(34,211,238,.6)}' +
      '@media(max-width:640px){.cin-line{font-size:14px}.cin-h.slam{font-size:19px}}';
    document.head.appendChild(st);
  }

  function ensureDom() {
    injectStyles();
    var ov = document.getElementById('cinemaOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'cinemaOverlay';
      ov.innerHTML = '<div class="cin-bar t"></div><div class="cin-bar b"></div>' +
        '<div class="cin-stage"></div>' +
        '<div class="cin-progress"></div>' +
        '<div class="cin-skip">点击任意处跳过 ▸</div>';
      document.body.appendChild(ov);
    }
    return ov;
  }

  var playing = false;

  function play(scenes, opts) {
    opts = opts || {};
    if (playing) return Promise.resolve();
    return new Promise(function (resolve) {
      var RED = REDUCED || opts.instant;
      var TIMEOUT = opts.timeout || 25000;   // 硬看门狗：最长场景约 20s，超时=异常兜底强制完成
      var ov = ensureDom();
      var stage = ov.querySelector('.cin-stage');
      var prog = ov.querySelector('.cin-progress');
      var finished = false;
      var timers = [];

      // 单一 done()：先移除 keydown 监听 → 再清理全部 timers（含看门狗）→ 再 resolve
      function done() {
        if (finished) return;
        finished = true;
        document.removeEventListener('keydown', key);
        timers.forEach(clearTimeout);
        timers = [];
        ov.classList.remove('show');
        playing = false;
        resolve();
      }
      function later(fn, ms) { timers.push(setTimeout(fn, RED ? Math.min(ms, 120) : ms)); }

      // 进度点
      prog.innerHTML = scenes.map(function () { return '<i></i>'; }).join('');
      var dots = prog.querySelectorAll('i');

      // 跳过：点击 / Esc / 空格
      function skip() { done(); }
      ov.onclick = skip;
      function key(e) { if (e.key === 'Escape' || e.key === ' ') { e.preventDefault(); skip(); } }
      document.addEventListener('keydown', key);

      // 看门狗：无论中途何处抛异常/卡死，超时后强制完成并 resolve
      timers.push(setTimeout(done, TIMEOUT));

      playing = true;
      ov.classList.add('show');
      stage.innerHTML = '';

      var si = 0;
      function nextScene() {
        if (finished) return;
        if (si >= scenes.length) { later(done, 700); return; }
        var sc = scenes[si];
        if (dots[si]) dots[si].classList.add('on');
        var el = document.createElement('div');
        el.className = 'cin-scene';
        var hHtml = '<div class="cin-h' + (sc.slam ? ' slam' : '') + (sc.danger ? ' danger' : '') + '">' + sc.h + '</div>';
        el.innerHTML = hHtml;
        stage.innerHTML = '';
        stage.appendChild(el);
        var li = 0;
        var lines = sc.lines || [];
        function nextLine() {
          if (finished) return;
          if (li >= lines.length) { si++; later(nextScene, sc.hold || 650); return; }
          var text = lines[li];
          var div = document.createElement('div');
          div.className = 'cin-line';
          el.appendChild(div);
          if (RED) {
            div.textContent = text;
            li++;
            later(nextLine, 160);
            return;
          }
          var ci = 0;
          div.innerHTML = '<span class="caret"></span>';
          var span = document.createElement('span');
          div.insertBefore(span, div.firstChild);
          function type() {
            if (finished) return;
            if (ci <= text.length) {
              span.textContent = text.slice(0, ci);
              ci++;
              timers.push(setTimeout(type, 26));
            } else {
              div.querySelector('.caret').remove();
              li++;
              later(nextLine, 340);
            }
          }
          type();
        }
        later(nextLine, 300);
      }
      later(nextScene, 450);
    });
  }

  return { play: play, isPlaying: function () { return playing; } };
})();
