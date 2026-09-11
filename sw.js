/* ============================================================
   sw.js — NOVA 题库游戏 Service Worker（P2-4）
   策略：
   · 静态资源：缓存优先 + 后台更新（拿到新响应即回填缓存）
   · 导航请求：网络优先，失败回退缓存（再回退根页）
   · install：skipWaiting 立即启用新版；activate：清掉旧版本缓存
   版本号缓存：nova-v1（改静态资源时递增版本号即可整体换血）
   ============================================================ */
/* eslint-env serviceworker */
var CACHE = 'nova-v24';

/* 离线可玩清单：三个入口页 + 全部游戏 JS + PWA 资产
   （docs/ 截图不属于 Web 游戏运行资源，刻意不入缓存） */
var ASSETS = [
  './',
  'index.html',
  'skillmap/index.html',
  'journey/index.html',
  'shared/learner.js',
  'shared/learner-ui.js',
  'manifest.webmanifest',
  'icon.svg',
  'rpg/index.html',
  'rpg/js/bgm.js',
  'rpg/js/cast.js',
  'rpg/js/content.js',
  'rpg/js/engine.js',
  'rpg/js/glossary.js',
  'rpg/js/plant.js',
  'tower/index.html',
  'tower/js/deck-data.js',
  'tower/js/deck-paid.js',
  'shared/paid-crypto.js',
  'tower/js/game.js',
  'shared/achievements.js',
  'shared/cinematic.js',
  'shared/feedback.js',
  'shared/dock.js',
  'shared/plant-core.js',
  'shared/tip.js',
  'shared/leaderboard.js',
  'tower/js/bgm.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys
          .filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    // 导航：网络优先（拿到最新 HTML 并回填缓存），离线时回退缓存页
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (m) { return m || caches.match('./'); });
      })
    );
    return;
  }

  // 静态资源：缓存优先 + 后台更新
  e.respondWith(
    caches.match(req).then(function (hit) {
      var fresh = fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || fresh;
    })
  );
});
