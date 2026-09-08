/* NOVA 进阶内容解密（零依赖纯 JS，Web 与小程序共用同一实现）
   - fnv1a(s)：兑换码校验哈希（与 pack-paid.py 同构）
   - sha256hex / sha256bytes：纯 JS 同步实现
   - keystream(seedHex, len)：sha256 链式密钥流（与 pack-paid.py 同构）
   - unwrapKey(code, salt, wrappedB64)：用码解出塔钥匙
   - decryptDeck(towerKeyHex, blobB64)：解密题库 JSON */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PAIDCRYPTO = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function fnv1a(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  /* ---- 纯 JS SHA-256 ---- */
  var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
  function sha256bytes(msg) {
    var ml = msg.length, wl = [], i;
    for (i = 0; i < ml; i++) wl.push(msg[i]);
    wl.push(0x80);
    while (wl.length % 64 !== 56) wl.push(0);
    var hi = Math.floor(ml / 0x20000000), lo = (ml << 3) >>> 0;
    wl.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255,
      (lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var w = new Array(64);
    for (var b = 0; b < wl.length; b += 64) {
      for (i = 0; i < 16; i++) w[i] = (wl[b + i * 4] << 24) | (wl[b + i * 4 + 1] << 16) | (wl[b + i * 4 + 2] << 8) | wl[b + i * 4 + 3];
      for (i = 16; i < 64; i++) {
        var s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (i = 0; i < 64; i++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[i] + w[i]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var mj = (a & bb) ^ (a & c) ^ (bb & c);
        var t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = [];
    for (i = 0; i < 8; i++) out.push((H[i] >>> 24) & 255, (H[i] >>> 16) & 255, (H[i] >>> 8) & 255, H[i] & 255);
    return out;
  }
  function hexOf(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += ('0' + bytes[i].toString(16)).slice(-2);
    return s;
  }
  function bytesOf(hex) {
    var out = [];
    for (var i = 0; i < hex.length; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16));
    return out;
  }
  function sha256hex(str) { return hexOf(sha256bytes(utf8(str))); }
  function utf8(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.codePointAt(i);
      if (c > 0xffff) i++;
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
  }
  function keystream(seedHex, length) {
    var out = [], block = bytesOf(seedHex);
    while (out.length < length) {
      block = sha256bytes(block);
      for (var i = 0; i < block.length && out.length < length; i++) out.push(block[i]);
    }
    return out;
  }
  function b64d(b64) {
    var bin = atob(b64), out = [];
    for (var i = 0; i < bin.length; i++) out.push(bin.charCodeAt(i));
    return out;
  }
  function xorBytes(a, b) {
    var out = [];
    for (var i = 0; i < a.length; i++) out.push(a[i] ^ b[i]);
    return out;
  }
  function unwrapKey(code, salt, wrappedB64) {
    var seed = sha256hex(code + '|' + salt);
    var ks = keystream(seed, 32);
    return hexOf(xorBytes(b64d(wrappedB64), ks));
  }
  function decryptDeck(towerKeyHex, blobB64) {
    var data = b64d(blobB64);
    var ks = keystream(towerKeyHex, data.length);
    var plain = xorBytes(data, ks);
    var s = '';
    for (var i = 0; i < plain.length; i++) s += String.fromCharCode(plain[i]);
    return JSON.parse(decodeURIComponent(escape(s)));
  }
  return { fnv1a: fnv1a, sha256hex: sha256hex, keystream: keystream, unwrapKey: unwrapKey, decryptDeck: decryptDeck, utf8: utf8 };
});
