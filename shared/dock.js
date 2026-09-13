/* NOVA 右下角功能坞：🎒 背包 + 📖 年鉴 —— 两游戏共用
   DOCK.mount({ onBag: fn, onBook: fn })，各自弹自己的 modal */
(function () {
  'use strict';
  function mount(opts) {
    if (document.getElementById('nvDock')) return;
    var css = document.createElement('style');
    css.textContent = '#nvDock{position:fixed;right:14px;bottom:14px;display:flex;flex-direction:column;gap:8px;z-index:800}' +
      '#nvDock button{width:52px;height:52px;border-radius:14px;border:1px solid rgba(170,200,225,.5);background:rgba(255,255,255,.92);backdrop-filter:blur(10px);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;color:#5C6B86;font-size:10px;font-family:inherit;transition:border-color .15s,color .15s,transform .15s;box-shadow:0 4px 16px rgba(150,175,205,.25)}' +
      '#nvDock button:hover{border-color:#3A729B;color:#3A729B;transform:translateY(-2px)}' +
      '#nvDock button:active{transform:translateY(0)}' +
      '#nvDock button i{font-style:normal;font-size:20px;line-height:1}' +
      '@media (max-width:720px){#nvDock button{width:46px;height:46px}#nvDock button i{font-size:17px}}';
    document.head.appendChild(css);
    var d = document.createElement('div');
    d.id = 'nvDock';
    d.innerHTML =
      '<button type="button" id="nvDockBook" title="NOVA 年鉴 · 留言墙"><i>📖</i>年鉴</button>' +
      (opts && typeof opts.onTip === 'function'
        ? '<button type="button" id="nvDockTip" title="每日一签 · 心意随喜"><i>🎋</i>求签</button>'
        : '') +
      '<button type="button" id="nvDockBag" title="背包 · 道具"><i>🎒</i>背包</button>' +
      (opts && typeof opts.onPlant === 'function'
        ? '<button type="button" id="nvDockPlant" title="伴学植物 · 累计陪伴时长"><i>🌱</i>植物</button>'
        : '');
    document.body.appendChild(d);
    var bag = document.getElementById('nvDockBag');
    var book = document.getElementById('nvDockBook');
    var tip = document.getElementById('nvDockTip');
    var plant = document.getElementById('nvDockPlant');
    if (bag && opts && typeof opts.onBag === 'function') bag.onclick = opts.onBag;
    if (book && opts && typeof opts.onBook === 'function') book.onclick = opts.onBook;
    if (tip && opts && typeof opts.onTip === 'function') tip.onclick = opts.onTip;
    if (plant && opts && typeof opts.onPlant === 'function') plant.onclick = opts.onPlant;
  }
  window.DOCK = { mount: mount };
})();
