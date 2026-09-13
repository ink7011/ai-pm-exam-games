/* NOVA 年鉴 · YEARBOOK —— 玩家留言墙（美式年鉴拼贴风），两游戏共用
   FEEDBACK.html(game) 经各游戏 openModal 渲染；FEEDBACK.wire(game) 接线。
   零后端：预设留言墙（虚构同学）+ 本机留言（localStorage）；
   「复制给制作人」才是作者真正能看到的通道（FEEDBACK_URL 可接问卷）。 */
(function () {
  'use strict';
  /* 店主配置：反馈问卷链接（腾讯问卷/金数据），留空=仅复制 */
  var FEEDBACK_URL = '';
  var KEY = 'novaAcademy.yearbook';
  var OLDKEY = 'novaAcademy.feedback';
  var ROLES = ['备考AI产品', '在职PM/运营', '转行探索中', '纯路过好奇'];

  /* 8 个预设头像（几何小生物，无刻板印象） */
  var AV = [
    { n: '机器人', s: '<svg viewBox="0 0 48 48"><rect x="8" y="14" width="32" height="26" rx="6" fill="#4E8FB5"/><rect x="14" y="22" width="6" height="6" fill="#2A3A4E"/><rect x="28" y="22" width="6" height="6" fill="#2A3A4E"/><rect x="18" y="32" width="12" height="3" rx="1.5" fill="#2A3A4E"/><line x1="24" y1="14" x2="24" y2="7" stroke="#4E8FB5" stroke-width="3"/><circle cx="24" cy="6" r="3" fill="#8F6A1E"/></svg>' },
    { n: '橘猫', s: '<svg viewBox="0 0 48 48"><circle cx="24" cy="27" r="17" fill="#8F6A1E"/><polygon points="10,16 16,4 22,15" fill="#8F6A1E"/><polygon points="38,16 32,4 26,15" fill="#8F6A1E"/><circle cx="18" cy="25" r="2.6" fill="#31220b"/><circle cx="30" cy="25" r="2.6" fill="#31220b"/><polygon points="24,29 21,32 27,32" fill="#f97316"/><path d="M14 33 q10 7 20 0" stroke="#31220b" fill="none" stroke-width="2"/></svg>' },
    { n: '小幽灵', s: '<svg viewBox="0 0 48 48"><path d="M10 44 V22 a14 14 0 0 1 28 0 V44 l-4.6-4 -4.7 4 -4.7-4 -4.7 4 -4.7-4 z" fill="#AC9CC8"/><circle cx="18" cy="22" r="3" fill="#241a3f"/><circle cx="30" cy="22" r="3" fill="#241a3f"/><circle cx="24" cy="30" r="2" fill="#241a3f" opacity=".6"/></svg>' },
    { n: '星球', s: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="13" fill="#4A7EC0"/><ellipse cx="24" cy="24" rx="21" ry="6" fill="none" stroke="#93c5fd" stroke-width="2.4"/><circle cx="19" cy="20" r="3" fill="#1e3a8a"/><circle cx="28" cy="27" r="2.2" fill="#1e3a8a"/></svg>' },
    { n: '小太阳', s: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="10" fill="#fde047"/><g stroke="#fde047" stroke-width="3" stroke-linecap="round"><line x1="24" y1="4" x2="24" y2="9"/><line x1="24" y1="39" x2="24" y2="44"/><line x1="4" y1="24" x2="9" y2="24"/><line x1="39" y1="24" x2="44" y2="24"/><line x1="9.9" y1="9.9" x2="13.4" y2="13.4"/><line x1="34.6" y1="34.6" x2="38.1" y2="38.1"/><line x1="9.9" y1="38.1" x2="13.4" y2="34.6"/><line x1="34.6" y1="13.4" x2="38.1" y2="9.9"/></g></svg>' },
    { n: '月亮', s: '<svg viewBox="0 0 48 48"><path d="M30 6 a18 18 0 1 0 12 30 a15 15 0 0 1 -12 -30 z" fill="#e2e8f0"/><circle cx="26" cy="20" r="2.4" fill="#94a3b8"/><circle cx="22" cy="30" r="1.8" fill="#94a3b8"/></svg>' },
    { n: '蘑菇', s: '<svg viewBox="0 0 48 48"><path d="M8 24 a16 13 0 0 1 32 0 z" fill="#CC6B6B"/><circle cx="17" cy="18" r="3" fill="#fecaca"/><circle cx="29" cy="16" r="2.4" fill="#fecaca"/><rect x="18" y="24" width="12" height="14" rx="5" fill="#fef3c7"/><circle cx="21" cy="30" r="1.4" fill="#d6d3d1"/><circle cx="27" cy="33" r="1.2" fill="#d6d3d1"/></svg>' },
    { n: '小鱼', s: '<svg viewBox="0 0 48 48"><polygon points="10,24 18,16 18,32" fill="#3E9B7E"/><ellipse cx="28" cy="24" rx="14" ry="10" fill="#3E9B7E"/><circle cx="34" cy="22" r="2.4" fill="#064e3b"/><path d="M28 14 q4 -5 6 0" stroke="#065f46" fill="none" stroke-width="2"/></svg>' }
  ];

  /* 预设留言墙（虚构同学；让玩家知道"不只是我这么想"） */
  var SEEDS = [
    { a: 1, nick: '三战大厂的鲸鱼', role: '备考AI产品', g: 'tower', t: '第52题我选A好像也说得通？题干表述有点歧义，建议修一下🥲' },
    { a: 0, nick: 'LLM炼丹学徒', role: '备考AI产品', g: 'tower', t: 'DPO 和 KTO 的区别那题解析可以再展开一点，惩罚项到底差在哪' },
    { a: 3, nick: '想上岸的鲤鱼', role: '转行探索中', g: 'tower', t: '想要网易风格的塔！猪厂什么时候安排🐷' },
    { a: 2, nick: '测试の菜狗', role: '在职PM/运营', g: 'tower', t: '键盘1-4答题好评，上班摸鱼静音也能刷（不是' },
    { a: 5, nick: '秋招第无数次', role: '备考AI产品', g: 'tower', t: '暗影复仇太狠了，早上错的题晚上又跳出来。但真记住了，恨并感谢着' },
    { a: 4, nick: 'PM小蟹', role: '在职PM/运营', g: 'rpg', t: '第三周虚荣指标那题选了B被mentor约谈——痛，但太真实了' },
    { a: 6, nick: '转行的前端仔', role: '转行探索中', g: 'rpg', t: '第一次玩到把"北极星指标 vs 虚荣指标"做成剧情的游戏，比背概念强' },
    { a: 7, nick: 'NOVA一年级', role: '纯路过好奇', g: 'rpg', t: '存档码真的能跨设备！公司电脑的进度搬回家继续了哈哈' },
    { a: 3, nick: '408难民', role: '备考AI产品', g: 'tower', t: '免费部分也太良心：335题每题带解析，还有每日挑战' },
    { a: 0, nick: '大厂的鹅', role: '备考AI产品', g: 'tower', t: '开水团塔21题打完，A11的考点提示和解析感觉对不上，作者看看？' },
    { a: -1, nick: '', role: '备考AI产品', g: 'tower', t: '匿名说一句：大厂风格塔比想象中便宜，一杯奶茶换个心理安慰，冲了' }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function load() {
    var d;
    try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { d = {}; }
    if (!d.migrated) {
      try {
        var o = JSON.parse(localStorage.getItem(OLDKEY));
        if (o) { d.nick = d.nick || o.nick || ''; d.role = d.role || o.role || ''; d.draft = d.draft || o.text || ''; }
      } catch (e) {}
      d.migrated = true; persist(d);
    }
    return d;
  }
  function persist(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function when(ts) {
    if (!ts) return '';
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return '刚刚';
    if (m < 60) return m + ' 分钟前';
    if (m < 1440) return Math.floor(m / 60) + ' 小时前';
    return Math.floor(m / 1440) + ' 天前';
  }
  function avSvg(d, post) {
    if (post) {
      if (post.a < 0) return AV[4].s;
      if (post.a === 'up' && d.up) return '<img src="' + d.up + '" alt="">';
      return AV[(post.a + 8) % 8].s;
    }
    return AV[(d.avatar || 0) % 8].s;
  }
  function wallHtml(d, game) {
    var own = (d.posts || []).filter(function (p) { return p.t; }).map(function (p) {
      if (p.kind === 'tip') return card(p.nick || '不肯留名的善人', p.a < 0 ? AV[4].s : (p.a === 'up' && d.up ? '<img src="' + d.up + '" alt="">' : AV[(p.a + 8) % 8].s), p.role, 'tip', p.t, when(p.ts), true, true);
      return card(p.a < 0 ? '匿名同学' : (p.nick || '我'), p.a < 0 ? AV[4].s : (p.a === 'up' && d.up ? '<img src="' + d.up + '" alt="">' : AV[p.a % 8].s), p.role, p.g, p.t, when(p.ts), true, false);
    });
    var seeds = SEEDS.map(function (p) { return card(p.nick || '匿名同学', p.a < 0 ? AV[4].s : AV[p.a % 8].s, p.role, p.g, p.t, '本届同学', false, false); });
    var all = own.concat(seeds);
    return all.join('');
    function card(nick, av, role, g, text, time, mine, gold) {
      return '<div class="fb-card' + (mine ? ' mine' : '') + (gold ? ' gold' : '') + '">' +
        '<div class="fc-av">' + av + '</div>' +
        '<div class="fc-b"><div class="fc-h"><b>' + esc(nick) + '</b>' + (gold ? '<span class="fc-tip">🕯 感谢墙</span>' : '') + '<span class="fc-r">' + esc(role || '') + '</span><span class="fc-g">' + (g === 'rpg' ? 'RPG' : g === 'tip' ? '随喜' : '试炼塔') + '</span><i>' + esc(time) + '</i></div>' +
        '<div class="fc-t">' + esc(text) + '</div></div></div>';
    }
  }

  function meAvHtml(d) {
    if (d.up && d.avatar === 'up') return '<img src="' + d.up + '" alt="">';
    return AV[(d.avatar || 0) % 8].s;
  }
  function html(game) {
    var d = load();
    var src = game === 'rpg' ? 'AI PRODUCT RPG' : 'NOVA 概念试炼塔';
    var avBtns = AV.map(function (a, i) {
      return '<button type="button" class="fa-av' + ((d.avatar === i && !d.up) ? ' on' : '') + '" data-i="' + i + '" title="' + a.n + '">' + a.s + '</button>';
    }).join('');
    return '<style>' +
      '.fbw{position:relative;background:#f8f2e2;color:#2b2a26;border-radius:10px;padding:20px 20px 16px;font-family:"Comic Sans MS","Marker Felt","Chalkboard SE","Kaiti SC","KaiTi","STKaiti",cursive,serif;box-shadow:0 6px 24px rgba(0,0,0,.45)}' +
      '.fbw::before{content:"";position:absolute;top:-11px;left:34px;width:92px;height:24px;background:rgba(255,222,130,.8);transform:rotate(-5deg)}' +
      '.fbw::after{content:"";position:absolute;top:-11px;right:34px;width:92px;height:24px;background:rgba(255,222,130,.8);transform:rotate(4deg)}' +
      '.fbw .fb-k{font-size:11px;letter-spacing:3px;color:#8a7f68;text-transform:uppercase}.fbw .fb-t{font-size:20px;font-weight:700;margin:2px 0 8px;letter-spacing:1px}' +
      '.fbw .fb-cols{display:flex;gap:14px;align-items:stretch}' +
      '.fbw .fb-wall{flex:1.15;min-width:0;max-height:420px;overflow-y:auto;padding:10px 10px 4px;background:repeating-linear-gradient(0deg,transparent 0 26px,rgba(185,172,141,.25) 26px 27px);border:1.5px dashed #b9ac8d;border-radius:6px}' +
      '.fb-card{display:flex;gap:8px;background:#fffdf6;border:1px solid #e2d8bf;border-radius:6px;padding:8px 10px;margin-bottom:8px;box-shadow:1.5px 2px 6px rgba(0,0,0,.12);transform:rotate(-.5deg)}' +
      '.fb-card:nth-child(even){transform:rotate(.6deg)}.fb-card.mine{border:1.5px solid #c2452d}' +
      '.fc-av{width:34px;height:34px;flex:none;border-radius:50%;overflow:hidden;background:#fff;box-shadow:0 0 0 2px #e2d8bf}.fc-av svg,.fc-av img{width:100%;height:100%;display:block}' +
      '.fc-b{min-width:0;flex:1}.fc-h{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}.fc-h b{font-size:13px}.fc-h .fc-r{font-size:10px;color:#8a7f68;border:1px solid #c9bd9c;border-radius:99px;padding:0 7px}.fc-h .fc-g{font-size:10px;color:#3f6f8f}.fc-h i{font-size:10px;color:#b0a488;margin-left:auto;font-style:normal}' +
      '.fc-t{font-size:12.5px;line-height:1.65;margin-top:3px;word-break:break-word}' +
      '.fb-card.gold{border:1.5px solid #d4a72c;background:linear-gradient(180deg,#fdf6e0,#fffdf6)}' +
      '.fb-card.gold .fc-av{box-shadow:0 0 0 2px #e6c964}' +
      '.fc-h .fc-tip{font-size:10px;color:#a16207;border:1px solid #d4a72c;border-radius:99px;padding:0 7px;background:rgba(212,167,44,.12)}' +
      '.fbw .fb-form{flex:1;min-width:0;display:flex;flex-direction:column}' +
      '.fbw .fa-av{width:34px;height:34px;border-radius:50%;border:2px solid transparent;background:#fff;padding:1px;cursor:pointer;flex:none}' +
      '.fa-av.on{border-color:#c2452d}.fa-av svg,.fa-av img{width:100%;height:100%;display:block}' +
      '.fbw .fb-namerow{position:relative;display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}' +
      '.fbw .fb-me{width:32px;height:32px;border-radius:50%;overflow:hidden;border:2px solid #b9ac8d;background:#fff;padding:0;cursor:pointer;flex:none;box-shadow:1px 2px 4px rgba(0,0,0,.15)}' +
      '.fbw .fb-me svg,.fbw .fb-me img{width:100%;height:100%;display:block}' +
      '.fbw .fb-pop{display:none;position:absolute;top:38px;left:0;z-index:6;background:#fffdf6;border:1.5px solid #b9ac8d;border-radius:10px;padding:9px;box-shadow:0 8px 20px rgba(0,0,0,.22);gap:5px;width:224px}' +
      '.fbw .fb-pop.open{display:flex;flex-wrap:wrap}' +
      '.fbw .fa-up{font:inherit;font-size:11px;border:1.5px dashed #b9ac8d;background:transparent;color:#6f6753;border-radius:6px;padding:3px 10px;cursor:pointer}' +
      '.fbw input[type=text]{background:transparent;border:0;border-bottom:2px dashed #b9ac8d;outline:none;font:inherit;font-size:13px;color:2b2a26;color:#2b2a26;padding:2px 6px;width:150px}' +
      '.fbw .fb-chip{font:inherit;font-size:11px;border:1.4px solid #b9ac8d;background:transparent;color:#6f6753;border-radius:999px;padding:2px 10px;cursor:pointer}' +
      '.fbw .fb-chip.on{background:#2b2a26;color:#f8f2e2;border-color:#2b2a26}' +
      '.fbw textarea{width:100%;min-height:104px;resize:vertical;background:repeating-linear-gradient(transparent 0 24px,#d8ccb0 24px 25px),#fffdf6;border:1.5px solid #b9ac8d;border-radius:6px;outline:none;font:inherit;font-size:13.5px;line-height:25px;color:#2b2a26;padding:3px 10px;margin-top:8px}' +
      '.fbw .fb-anon{display:flex;align-items:center;gap:6px;font-size:12px;color:#6f6753;margin-top:8px;cursor:pointer;user-select:none}' +
      '.fbw .fb-anon input{accent-color:#c2452d}' +
      '.fbw .fb-foot{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}' +
      '.fbw .fb-send{font:inherit;font-size:13px;font-weight:700;color:#fff;background:#c2452d;border:0;border-radius:6px;padding:8px 16px;cursor:pointer;box-shadow:2px 3px 0 rgba(0,0,0,.25)}' +
      '.fbw .fb-send:active{transform:translateY(2px);box-shadow:none}' +
      '.fbw .fb-copy{font:inherit;font-size:12px;border:1.5px solid #b9ac8d;background:transparent;color:#6f6753;border-radius:6px;padding:7px 12px;cursor:pointer}' +
      '.fbw .fb-hint{font-size:10.5px;color:#8a7f68;line-height:1.6;margin-top:8px}' +
      '.fbw .fb-stamp{display:none;position:absolute;right:22px;top:16px;border:3px double #c2452d;color:#c2452d;border-radius:8px;padding:5px 10px;font-size:14px;font-weight:700;letter-spacing:2px;transform:rotate(12deg);background:rgba(248,242,226,.75)}' +
      '.fbw .fb-stamp.on{display:block;animation:fbstamp .45s ease-out}' +
      '@keyframes fbstamp{0%{transform:rotate(12deg) scale(2.2);opacity:0}60%{transform:rotate(12deg) scale(.92);opacity:1}100%{transform:rotate(12deg) scale(1)}}' +
      '</style>' +
      '<div class="fbw">' +
      '<div class="fb-stamp" id="fbStamp">已写进年鉴 ✓</div>' +
      '<div class="fb-k">SHUAMONE · Yearbook · 来自 ' + esc(src) + '</div>' +
      '<div class="fb-t">📖 NOVA 年鉴 · 留言墙</div>' +
      '<div class="fb-cols">' +
      '<div class="fb-wall" id="fbWall">' + wallHtml(d, game) + '</div>' +
      '<div class="fb-form">' +
      '<div class="fb-namerow"><button type="button" class="fb-me" id="fbMe" title="点我换头像">' + meAvHtml(d) + '</button><span class="fb-k" style="letter-spacing:1px">署名</span><input type="text" id="fbNick" maxlength="16" placeholder="想匿就勾下面"><span class="fb-k" style="letter-spacing:1px;margin-left:6px">我是</span></div>' +
      '<div class="fb-pop" id="fbAvPop">' + avBtns + '<button type="button" class="fa-up" id="fbUp" title="上传自己的照片">📷</button><input type="file" id="fbFile" accept="image/*" style="display:none">' +
      (d.up ? '<button type="button" class="fa-av' + (d.avatar === 'up' ? ' on' : '') + '" data-i="up" title="我的照片"><img src="' + d.up + '" alt=""></button>' : '') + '</div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px" id="fbRoles">' + ROLES.map(function (r) { return '<button type="button" class="fb-chip' + (d.role === r ? ' on' : '') + '" data-r="' + esc(r) + '">' + esc(r) + '</button>'; }).join('') + '</div>' +
      '<textarea id="fbText" maxlength="300" placeholder="一句吐槽 / 一个bug / 一座你想爬的塔 / 一个想要的结局……">' + esc(d.draft || '') + '</textarea>' +
      '<label class="fb-anon"><input type="checkbox" id="fbAnon"> 匿名发布（不显示署名和头像）</label>' +
      '<div class="fb-foot"><button type="button" class="fb-send" id="fbSend">📝 写进年鉴</button><button type="button" class="fb-copy" id="fbCopy">📋 复制给制作人</button></div>' +
      '<div class="fb-hint">年鉴墙保存在你自己的浏览器里；点「复制给制作人」并粘贴到问卷/评论区，作者才能真正看到。这个项目大部分免费、为爱发电——真话最重要。</div>' +
      '<div style="margin-top:8px;text-align:right"><button type="button" id="fbTip" style="font:inherit;font-size:12px;border:none;background:transparent;color:#c2452d;cursor:pointer;text-decoration:underline dotted">🎋 求个上上签</button></div>' +
      '</div></div></div>';
  }

  function wire(game) {
    var d = load();
    var root = document.getElementById('fbWall');
    var nick = document.getElementById('fbNick');
    var text = document.getElementById('fbText');
    if (!nick || !text) return;
    nick.value = d.nick || '';
    var src = game === 'rpg' ? 'AI PRODUCT RPG' : 'NOVA 概念试炼塔';
    var avatar = d.up ? 'up' : (d.avatar || 0);
    var persistFn = function () {
      d.nick = nick.value.trim(); d.role = window.FEEDBACK._role || d.role || ''; d.draft = text.value; d.avatar = avatar === 'up' ? 'up' : avatar;
      persist(d);
    };
    var tm = null;
    var deb = function () { clearTimeout(tm); tm = setTimeout(persistFn, 400); };
    text.oninput = deb; nick.oninput = deb;
    window.FEEDBACK._role = d.role || '';
    var roles = document.getElementById('fbRoles');
    if (roles) roles.onclick = function (e) {
      var b = e.target.closest('.fb-chip'); if (!b) return;
      roles.querySelectorAll('.fb-chip').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on'); window.FEEDBACK._role = b.dataset.r; deb();
    };
    var pop = document.getElementById('fbAvPop');
    var meBtn = document.getElementById('fbMe');
    if (meBtn && pop) meBtn.onclick = function (e) { e.stopPropagation(); pop.classList.toggle('open'); };
    if (pop) pop.onclick = function (e) {
      var b = e.target.closest('.fa-av'); if (!b) return;
      pop.querySelectorAll('.fa-av').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      avatar = b.dataset.i === 'up' ? 'up' : parseInt(b.dataset.i, 10);
      if (meBtn) meBtn.innerHTML = avatar === 'up' && d.up ? '<img src="' + d.up + '" alt="">' : AV[avatar % 8].s;
      pop.classList.remove('open');
      deb();
    };
    var up = document.getElementById('fbUp'), file = document.getElementById('fbFile');
    if (up && file) {
      up.onclick = function () { file.click(); };
      file.onchange = function () {
        var f = file.files && file.files[0]; if (!f) return;
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas'); c.width = c.height = 96;
          var x = c.getContext('2d');
          var s = Math.min(img.width, img.height);
          x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 96, 96);
          d.up = c.toDataURL('image/jpeg', 0.82);
          avatar = 'up'; persistFn();
          if (meBtn) meBtn.innerHTML = '<img src="' + d.up + '" alt="">';
          var old = pop && pop.querySelector('.fa-av[data-i="up"]');
          if (pop) {
            if (old) old.classList.add('on');
            else {
              var btn = document.createElement('button');
              btn.type = 'button'; btn.className = 'fa-av on'; btn.dataset.i = 'up'; btn.title = '我的照片';
              btn.innerHTML = '<img src="' + d.up + '" alt="">';
              pop.insertBefore(btn, null);
            }
            pop.querySelectorAll('.fa-av').forEach(function (x) { if (x.dataset.i !== 'up') x.classList.remove('on'); });
          }
        };
        img.src = URL.createObjectURL(f);
      };
    }
    var send = document.getElementById('fbSend');
    if (send) send.onclick = function () {
      if (!text.value.trim()) { text.focus(); return; }
      clearTimeout(tm); persistFn(); /* 先把署名/身份一并存下 */
      var anon = document.getElementById('fbAnon').checked;
      d.posts = d.posts || [];
      d.posts.push({ a: anon ? -1 : avatar, nick: nick.value.trim(), role: window.FEEDBACK._role || '', g: game, t: text.value.trim(), ts: Date.now() });
      d.draft = ''; persist(d);
      text.value = '';
      if (root) { root.innerHTML = wallHtml(d, game); root.scrollTop = 0; }
      var st = document.getElementById('fbStamp');
      if (st) { st.classList.remove('on'); void st.offsetWidth; st.classList.add('on'); }
    };
    var copy = document.getElementById('fbCopy');
    if (copy) copy.onclick = function () {
      if (!text.value.trim()) { text.focus(); return; }
      persistFn();
      var msg = '【NOVA年鉴·玩家留言】\n署名：' + (document.getElementById('fbAnon').checked ? '匿名' : (nick.value.trim() || '匿名')) + ' ｜ 身份：' + (window.FEEDBACK._role || '未填') + ' ｜ 来自：' + src + '\n——\n' + text.value.trim();
      var settled = false;
      var done = function () {
        if (settled) return; settled = true;
        var st = document.getElementById('fbStamp');
        if (st) { st.textContent = '已复制 ✓'; st.classList.remove('on'); void st.offsetWidth; st.classList.add('on'); setTimeout(function () { st.textContent = '已写进年鉴 ✓'; }, 2500); }
        if (FEEDBACK_URL) window.open(FEEDBACK_URL, '_blank', 'noopener');
      };
      var guard = setTimeout(done, 800);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).then(function () { clearTimeout(guard); done(); }, function () { clearTimeout(guard); done(); });
      else done();
    };
  }

  window.FEEDBACK = { html: html, wire: wire, url: FEEDBACK_URL, meAvatar: function () { return meAvHtml(load()); }, nick: function () { return load().nick || ''; } };
})();
