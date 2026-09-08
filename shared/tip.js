/* NOVA 求签 · 周易六爻起卦 —— 两游戏共用（零后端）
   起卦三要素：求签人（年鉴署名或档案号）+ 当日 + 时辰（两小时一柱）。
   六爻由种子确定性推出（老阳⚊○/老阴⚋✕为动爻，动则变卦），全无随机数。
   不重复保证：签池 N=1080（=90天×12时辰）。同一人签号 = 人盐 + (天数×12+时辰) mod N，
   任意连续 90 天的偏移量恰好取遍 0..1079 —— 数学上保证一季之内绝不重签。
   主体验免费；商业化一笔带过：折叠「随喜」区（点亮感谢墙留名+好运加持）。
   店主规则：随喜单笔不超过 ¥10000（内置不可见上限，超出才提示并按上限计）。 */
(function () {
  'use strict';
  var QR = { wx: '../docs/images/pay-wechat.jpg', ali: '../docs/images/pay-alipay.jpg' };
  var TIP_URL = '';
  var CAP = 10000;
  var LUCK_KEY = 'novaAcademy.luck';
  var YB_KEY = 'novaAcademy.yearbook';
  var POOL = 1080; /* 90 天 × 12 时辰 */
  var PRESETS = [
    { v: 5.2, label: '💚 5.2', note: '好运起步' },
    { v: 9.9, label: '☕ 9.9', note: 'offer 长长久久' },
    { v: 16.6, label: '🎁 16.6', note: '一路顺利' },
    { v: 0, label: '✍️ 自定义', note: '随心' }
  ];
  /* 八卦：下标 = 三爻位（初爻为最低位）。TRI[v]=卦名，NAT[v]=象 */
  var TRI = ['坤', '震', '坎', '兑', '艮', '离', '巽', '乾'];
  var NAT = ['地', '雷', '水', '泽', '山', '火', '风', '天'];
  /* 六十四卦名：HEX[上卦名行 × 下卦名列]，行列序 = 乾兑离震巽坎艮坤 */
  var HEX = [
    ['乾为天', '天泽履', '天火同人', '天雷无妄', '天风姤', '天水讼', '天山遁', '天地否'],
    ['泽天夬', '兑为泽', '泽火革', '泽雷随', '泽风大过', '泽水困', '泽山咸', '泽地萃'],
    ['火天大有', '火泽睽', '离为火', '火雷噬嗑', '火风鼎', '火水未济', '火山旅', '火地晋'],
    ['雷天大壮', '雷泽归妹', '雷火丰', '震为雷', '雷风恒', '雷水解', '雷山小过', '雷地豫'],
    ['风天小畜', '风泽中孚', '风火家人', '风雷益', '巽为风', '风水涣', '风山渐', '风地观'],
    ['水天需', '水泽节', '水火既济', '水雷屯', '水风井', '坎为水', '水山蹇', '水地比'],
    ['山天大畜', '山泽损', '山火贲', '山雷颐', '山风蛊', '山水蒙', '艮为山', '山地剥'],
    ['地天泰', '地泽临', '地火明夷', '地雷复', '地风升', '地水师', '地山谦', '坤为地']
  ];
  var RIDX = { '乾': 0, '兑': 1, '离': 2, '震': 3, '巽': 4, '坎': 5, '艮': 6, '坤': 7 };
  var POSN = ['初', '二', '三', '四', '五', '上'];
  var HOURS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  /* 签文（AI 产品人黑话祝福）：与卦象组合呈现 */
  var BLESS = [
    '你的北极星指标正在悄悄变好——中途的虚荣指标骗不了你。',
    '训练要收敛，求职也要收敛：这周的你，比上周更接近 offer。',
    '命运正在跑一组 A/B 测试，你恰好被分进了好运实验组。',
    '你的 offer 需求已排入 P0，命运研发部正在加急上线。',
    '冷启动最难的一步你已经迈完，接下来是自然增长。',
    '错题的暗影连对两次就能净化——面试的坎，也一样。',
    '好运正在对你小流量灰度，全量放量就在下周。',
    '100% 首答命中——这一季的 offer 之道上，写着你的名字。',
    '认真刷塔的人，命运也对你高留存。',
    '你的人生版本号今天 +1：修复了焦虑，新增了好运。',
    '别盯着看板焦虑，你的增长曲线只是还没到拐点。',
    '把简历当作 PRD 打磨：这卦说，下一次评审就过。'
  ];
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(v) { return (Math.round(v * 100) / 100).toString(); }
  function fnv(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function todayStr() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  }
  function dateCn() {
    var d = new Date();
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function hourIdx(d) {
    d = d || new Date();
    return Math.floor((((d.getHours() + 1) % 24) / 2)); /* 23:00–00:59 为子时 */
  }
  function dayIdx(d) {
    d = d || new Date();
    return Math.floor(d.getTime() / 86400000);
  }
  function personKey() {
    try {
      var yb = JSON.parse(localStorage.getItem(YB_KEY) || '{}');
      if (yb && yb.nick) return yb.nick;
    } catch (e) {}
    try {
      var p = localStorage.getItem('novaAcademy.pid');
      if (p) return p;
    } catch (e) {}
    return '无名';
  }
  /* 核心：由（人, 天, 时辰）确定性起卦。_d/_h 可注入用于测试。
     idx = (人盐 + 天×12 + 时辰) mod 1080 —— 固定人时，90 天窗口内 idx 两两不同；
     12 位爻象 = idx 的 11 位 + 人盐第 16 位（同人恒定），idx 不同则六爻象不同。 */
  function deriveAt(key, _d, _h) {
    var salt = fnv(String(key));
    var d = (_d == null) ? dayIdx() : _d;
    var h = (_h == null) ? hourIdx() : _h;
    var idx = ((salt % POOL) + (d % POOL) * 12 + h) % POOL;
    var pattern = idx | (((salt >>> 16) & 1) << 11);
    var lines = [], benBits = 0, moving = [], zhiBits = 0;
    for (var i = 0; i < 6; i++) {
      var st = (pattern >> (2 * i)) & 3; /* 0少阳 1少阴 2老阳(动) 3老阴(动) */
      var yang = (st === 0 || st === 2);
      var dong = (st >= 2);
      lines.push({ yang: yang, dong: dong });
      if (yang) benBits |= (1 << i);
      if (dong) { moving.push(POSN[i] + (yang ? '九' : '六')); zhiBits |= (1 << i); }
    }
    if (moving.length) { /* 动爻翻转得之卦 */
      zhiBits = benBits;
      for (var m2 = 0; m2 < 6; m2++) if (lines[m2].dong) zhiBits ^= (1 << m2);
    }
    var lower = benBits & 7, upper = (benBits >> 3) & 7;
    var hexName = HEX[RIDX[TRI[upper]]][RIDX[TRI[lower]]];
    var zhiName = '';
    if (moving.length) {
      var l2 = zhiBits & 7, u2 = (zhiBits >> 3) & 7;
      zhiName = HEX[RIDX[TRI[u2]]][RIDX[TRI[l2]]];
    }
    return {
      no: idx + 1, key: String(key),
      hexName: hexName, zhiName: zhiName,
      trigrams: TRI[upper] + NAT[upper] + '上 · ' + TRI[lower] + NAT[lower] + '下',
      moving: moving, lines: lines,
      bless: BLESS[(idx * 7 + salt) % BLESS.length],
      hour: HOURS[h], dateCn: dateCn()
    };
  }
  function luckOn() {
    try { return localStorage.getItem(LUCK_KEY) === todayStr(); } catch (e) { return false; }
  }
  function lineHtml(lines) {
    var out = '';
    for (var i = 5; i >= 0; i--) { /* 上爻在上 */
      var L = lines[i];
      out += '<div class="sg-line' + (L.dong ? ' mv' : '') + '">' +
        (L.yang ? '<span class="yang"></span>' : '<span class="yin"></span>') +
        (L.dong ? '<i>' + (L.yang ? '○' : '✕') + '</i>' : '<i> </i>') + '</div>';
    }
    return out;
  }
  function showSign(sg) {
    var box = document.getElementById('tpSign');
    if (!box) return;
    var hexLine = '《' + sg.hexName + '》' + (sg.zhiName ? ' 之 《' + sg.zhiName + '》' : ' · 静卦');
    document.getElementById('tpSignT').innerHTML = '第 ' + sg.no + ' 签 · ' + esc(hexLine) +
      (sg.moving.length ? ' · ' + esc(sg.moving.join('、')) + ' 爻动' : '');
    document.getElementById('tpSignL').innerHTML = lineHtml(sg.lines);
    document.getElementById('tpSignS').textContent = sg.bless;
    document.getElementById('tpSignD').textContent = '起卦：' + sg.key + ' · ' + sg.dateCn + ' · ' + sg.hour + '时 · NOVA 学院六爻';
    box.classList.remove('on'); void box.offsetWidth; box.classList.add('on');
  }
  function bless(amount) {
    var sg = deriveAt(personKey());
    try { localStorage.setItem(LUCK_KEY, todayStr()); } catch (e) {}
    try {
      var yb = JSON.parse(localStorage.getItem(YB_KEY) || '{}') || {};
      yb.posts = (yb.posts || []).filter(function (p) { return p.kind !== 'tip'; });
      yb.posts.push({ kind: 'tip', a: (yb.up && yb.avatar === 'up') ? 'up' : (yb.avatar || 0), nick: yb.nick || '', g: 'tip', t: '随喜 ¥' + fmt(amount) + ' —— 第' + sg.no + '签《' + sg.hexName + '》：' + sg.bless, ts: Date.now() });
      localStorage.setItem(YB_KEY, JSON.stringify(yb));
    } catch (e) {}
    return sg;
  }

  function html() {
    var lucky = luckOn();
    return '<style>' +
      '.tipw{position:relative;color:#dbe4f0;font-family:inherit}' +
      '.tipw .tp-k{font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:3px;color:#8b9bb4;text-transform:uppercase;margin-bottom:6px}' +
      '.tipw .tp-t{font-size:20px;font-weight:800;margin-bottom:8px}' +
      '.tipw .tp-note{font-size:13px;color:#8b9bb4;line-height:1.85;margin-bottom:12px}' +
      '.tipw .tp-note b{color:#dbe4f0}' +
      '.tipw .tp-signbtn{width:100%;font-size:15px;font-weight:700;color:#07090f;background:linear-gradient(90deg,#fbbf24,#f59e0b);border:0;border-radius:10px;padding:12px;cursor:pointer;box-shadow:0 4px 14px rgba(251,191,36,.25);margin-bottom:12px}' +
      '.tipw .tp-signbtn:active{transform:translateY(1px)}' +
      '.tipw .tp-sign{display:none;background:#f8f2e2;color:#2b2a26;border-radius:12px;padding:16px 18px;margin-bottom:12px;position:relative;font-family:"Comic Sans MS","Marker Felt","Kaiti SC","KaiTi",cursive,serif}' +
      '.tipw .tp-sign.on{display:block;animation:tpsign .5s ease-out}' +
      '@keyframes tpsign{0%{transform:rotate(-3deg) scale(1.15);opacity:0}100%{transform:rotate(-1deg) scale(1);opacity:1}}' +
      '.tipw .tp-sign .sg-t{font-size:14px;font-weight:800;letter-spacing:1px;color:#c2452d;margin-bottom:8px;line-height:1.7}' +
      '.tipw .tp-sign .sg-lines{display:flex;flex-direction:column;gap:3px;margin:6px 0 10px;align-items:center}' +
      '.tipw .sg-line{display:flex;align-items:center;gap:6px}' +
      '.tipw .sg-line .yang{display:inline-block;width:120px;height:7px;background:#2b2a26;border-radius:2px}' +
      '.tipw .sg-line .yin{display:inline-block;width:120px;height:0;border-top:7px solid #2b2a26;border-radius:2px;position:relative}' +
      '.tipw .sg-line .yin::after{content:"";position:absolute;left:47px;top:-7px;width:26px;height:7px;background:#f8f2e2}' +
      '.tipw .sg-line i{font-style:normal;font-size:12px;color:#c2452d;width:14px;text-align:center}' +
      '.tipw .sg-line.mv .yang,.tipw .sg-line.mv .yin{opacity:.92;box-shadow:0 0 0 1px rgba(194,69,45,.25)}' +
      '.tipw .tp-sign .sg-s{font-size:14px;line-height:1.8}' +
      '.tipw .tp-sign .sg-d{font-size:11px;color:#8a7f68;margin-top:8px;line-height:1.7}' +
      '.tipw .tp-sign .sg-stamp{position:absolute;right:12px;top:10px;border:3px double #c2452d;color:#c2452d;border-radius:8px;padding:3px 9px;font-size:13px;font-weight:700;transform:rotate(12deg);letter-spacing:2px}' +
      '.tipw .tp-sx{border-top:1px dashed #26324a;margin-top:14px;padding-top:10px}' +
      '.tipw .tp-sxh{color:#5a6b84;font-size:12px;text-align:center;letter-spacing:1px;margin-bottom:2px}' +
      '.tipw .tp-sxnote{font-size:12px;color:#8b9bb4;line-height:1.8;margin:10px 0;border:1px dashed rgba(251,191,36,.35);border-radius:10px;padding:8px 12px;background:rgba(251,191,36,.04)}' +
      '.tipw .tp-sxnote b{color:#fbbf24}' +
      '.tipw .tp-presets{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}' +
      '.tipw .tp-chip{font-size:12px;color:#dbe4f0;border:1.5px solid #26324a;background:#0e131d;border-radius:10px;padding:7px 12px;cursor:pointer;text-align:center}' +
      '.tipw .tp-chip i{display:block;font-style:normal;font-size:10px;color:#5a6b84;margin-top:2px}' +
      '.tipw .tp-chip.on{border-color:#fbbf24;background:rgba(251,191,36,.08)}' +
      '.tipw .tp-chip.on i{color:#fbbf24}' +
      '.tipw .tp-custom{display:none;gap:8px;align-items:center;margin-bottom:10px}' +
      '.tipw .tp-custom.show{display:flex}' +
      '.tipw .tp-custom input{width:110px;background:#0e131d;border:1.5px solid #26324a;border-radius:8px;color:#dbe4f0;font:13px ui-monospace,Menlo,monospace;padding:7px 10px;outline:none}' +
      '.tipw .tp-custom input:focus{border-color:#fbbf24}' +
      '.tipw .tp-cap{display:none;font-size:12px;color:#fbbf24;line-height:1.7;margin:0 0 10px;padding:8px 12px;border:1px dashed rgba(251,191,36,.5);border-radius:8px;background:rgba(251,191,36,.05)}' +
      '.tipw .tp-cap.show{display:block}' +
      '.tipw .tp-qrbox{display:flex;flex-direction:column;align-items:center;gap:8px;border:1px solid #26324a;border-radius:12px;padding:12px;background:#0e131d}' +
      '.tipw .tp-tabs{display:flex;gap:8px}' +
      '.tipw .tp-tab{font-size:12px;color:#8b9bb4;border:1px solid #26324a;background:transparent;border-radius:8px;padding:5px 14px;cursor:pointer}' +
      '.tipw .tp-tab.on{color:#fbbf24;border-color:rgba(251,191,36,.5)}' +
      '.tipw .tp-qr{width:150px;height:150px;border-radius:10px;background:#fff;object-fit:contain}' +
      '.tipw .tp-qrmiss{display:none;width:150px;padding:16px 10px;border:1px dashed #26324a;border-radius:10px;font-size:11px;color:#5a6b84;text-align:center;line-height:1.8}' +
      '.tipw .tp-amount{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#8b9bb4}' +
      '.tipw .tp-amount b{color:#34d399;font-size:14px}' +
      '.tipw .tp-bless{width:100%;font-size:13px;font-weight:700;color:#fde68a;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.4);border-radius:10px;padding:9px;cursor:pointer;margin:10px 0}' +
      '.tipw .tp-foot{font-size:11px;color:#5a6b84;line-height:1.8;margin-top:12px;text-align:center}' +
      '</style><div class="tipw">' +
      '<div class="tp-k">NOVA Academy · I-Ching Fortune</div>' +
      '<div class="tp-t">🎋 求个上上签</div>' +
      '<div class="tp-note">周易六爻起卦：以<b>你的名（或档案号）+ 今日 + 此时辰</b>摇卦，<b>免费求</b>。卦随人变、随日变、随时辰变——一季（90 天）之内，你的签<b>不会重复</b>。截图当壁纸，愿它陪你好运上岸。</div>' +
      '<button type="button" class="tp-signbtn" id="tpDraw">' + (lucky ? '🎋 再摇一卦' : '🎋 摇卦起签') + '</button>' +
      '<div class="tp-sign" id="tpSign"><div class="sg-stamp">灵验 ✓</div><div class="sg-t" id="tpSignT"></div><div class="sg-lines" id="tpSignL"></div><div class="sg-s" id="tpSignS"></div><div class="sg-d" id="tpSignD"></div></div>' +
      '<div class="tp-sx">' +
      '<div class="tp-sxh">随喜 · 心意随心</div>' +
      '<div class="tp-sxb">' +
      '<div class="tp-sxnote">随喜后点亮 <b>🕯 年鉴感谢墙留名</b> 与 <b>🍀 今日好运加持</b>（贡献榜档案号旁）。</div>' +
      '<div class="tp-presets">' + PRESETS.map(function (p, i) {
        return '<button type="button" class="tp-chip' + (i === 0 ? ' on' : '') + '" data-v="' + p.v + '">' + p.label + '<i>' + p.note + '</i></button>';
      }).join('') + '</div>' +
      '<div class="tp-custom" id="tpCustom"><span style="font-size:12px;color:#8b9bb4">金额</span><input type="number" id="tpInput" min="0.01" step="0.01" placeholder="¥ 心意金额"><span style="font-size:11px;color:#5a6b84">元</span></div>' +
      '<div class="tp-cap" id="tpCap">心意收到啦，真的不用这么多🙏 单笔最多 <b>¥10000</b>，已按 ¥10000 帮你算——超额的部分，就把好运留给下一个塔友吧。</div>' +
      '<div class="tp-qrbox">' +
      '<div class="tp-tabs"><button type="button" class="tp-tab on" data-p="wx">微信</button><button type="button" class="tp-tab" data-p="ali">支付宝</button></div>' +
      '<img class="tp-qr" id="tpQr" src="' + QR.wx + '" alt="收款码">' +
      '<div class="tp-qrmiss" id="tpMiss">📷 收款码配置中<br>（docs/images/pay-wechat.jpg / pay-alipay.jpg）</div>' +
      '<div class="tp-amount">扫码后请手动输入 <b id="tpAmt">¥5.2</b>（金额随心）</div>' +
      '</div>' +
      '<button type="button" class="tp-bless" id="tpBless">' + (lucky ? '🕯 已点亮 · 今日 🍀' : '🕯 随喜并点亮（留名 + 好运）') + '</button>' +
      (TIP_URL ? '<div class="tp-foot"><a href="' + esc(TIP_URL) + '" target="_blank" rel="noopener" style="color:#22d3ee">去爱发电支持 →</a></div>' : '') +
      '</div></div>' +
      '<div class="tp-foot">求签永远免费 · 好运不设付费墙 · 六爻无随机，卦卦有来处 ✦</div>' +
      '</div>';
  }

  function wire() {
    var amount = PRESETS[0].v;
    var amt = document.getElementById('tpAmt');
    var chips = document.querySelectorAll('.tp-chip');
    var custom = document.getElementById('tpCustom');
    var input = document.getElementById('tpInput');
    var cap = document.getElementById('tpCap');
    function apply(v) {
      amount = v > CAP ? CAP : v;
      if (amt) amt.textContent = '¥' + fmt(amount);
      if (cap) cap.classList.toggle('show', v > CAP); /* 超上限才提示，规则平时不可见 */
    }
    if (chips) chips.forEach(function (c) {
      c.onclick = function () {
        chips.forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        var v = parseFloat(c.dataset.v);
        if (v === 0) {
          if (custom) custom.classList.add('show');
          if (input) { input.value = ''; input.focus(); }
          if (cap) cap.classList.remove('show');
        } else {
          if (custom) custom.classList.remove('show');
          apply(v);
        }
      };
    });
    if (input) input.oninput = function () {
      var v = parseFloat(input.value);
      if (isNaN(v) || v <= 0) { if (cap) cap.classList.remove('show'); return; }
      apply(v);
    };
    var draw = document.getElementById('tpDraw');
    if (draw) draw.onclick = function () {
      showSign(deriveAt(personKey())); /* 免费摇卦：只出卦象，无副作用 */
      draw.textContent = '🎋 再摇一卦';
    };
    var bl = document.getElementById('tpBless');
    if (bl) bl.onclick = function () {
      showSign(bless(amount)); /* 随喜：卦象 + 感谢墙金色留名 + 今日好运 */
      bl.textContent = '🕯 已点亮 · 今日 🍀';
    };
    var tabs = document.querySelectorAll('.tp-tab');
    var qr = document.getElementById('tpQr');
    var miss = document.getElementById('tpMiss');
    if (tabs && qr) tabs.forEach(function (t) {
      t.onclick = function () {
        tabs.forEach(function (x) { x.classList.remove('on'); });
        t.classList.add('on');
        qr.src = QR[t.dataset.p === 'wx' ? 'wx' : 'ali'];
        qr.style.display = '';
        if (miss) miss.style.display = 'none';
      };
    });
    if (qr && miss) qr.onerror = function () { qr.style.display = 'none'; miss.style.display = ''; };
  }

  window.TIP = { html: html, wire: wire, luckOn: luckOn, todayStr: todayStr, deriveAt: deriveAt, personKey: personKey };
})();
