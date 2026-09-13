/* SHUAMONE SFX · 全站 UI 音效引擎
   零依赖纯 WebAudio 合成——每个音效可独立播放，支持开关。
   声音设计原则：短（<0.3s）、软（不刺耳）、有音高语义（对=升/错=降）。
   ============================================================ */
(function () {
  'use strict';
  const KEY = 'shuamone.sfx';

  let ctx = null;
  let enabled = (function () { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } })();

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* 通用：单音 */
  function tone(freq, t, dur, type, vol, opts) {
    const c = getCtx(); if (!c || !enabled) return;
    opts = opts || {};
    const osc = c.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t + dur);

    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol || 0.15, t + (opts.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    let node = osc;
    if (opts.filter) {
      const f = c.createBiquadFilter();
      f.type = opts.filter.type || 'lowpass';
      f.frequency.value = opts.filter.freq || 2000;
      f.Q.value = opts.filter.q || 1;
      osc.connect(f); node = f;
    }
    node.connect(g); g.connect(c.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  /* 通用：噪声 */
  function noise(t, dur, vol, filterType, filterFreq) {
    const c = getCtx(); if (!c || !enabled) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = filterType || 'highpass';
    f.frequency.value = filterFreq || 6000;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(t); src.stop(t + dur);
  }

  /* ---------- 音效库 ---------- */

  const SFX = {
    /* 悬停：极轻的高频 tick */
    hover() {
      const c = getCtx(); if (!c) return;
      tone(2400, c.currentTime, 0.03, 'sine', 0.03);
    },

    /* 点击：下扫 pop，有满足感 */
    click() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(800, t, 0.06, 'square', 0.08, { slide: 400, filter: { type: 'lowpass', freq: 1200 } });
      noise(t, 0.02, 0.03, 'highpass', 4000);
    },

    /* 正确/成功：上行大三度琶音 */
    correct() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      [523, 659, 784].forEach((f, i) => {
        tone(f, t + i * 0.06, 0.15, 'triangle', 0.12);
      });
      // 加一个亮尾
      tone(1047, t + 0.18, 0.2, 'sine', 0.08);
    },

    /* 错误/失败：下行小二度（不和谐） */
    wrong() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(392, t, 0.12, 'square', 0.10, { slide: 370, filter: { type: 'lowpass', freq: 800 } });
      tone(185, t + 0.08, 0.18, 'square', 0.08, { filter: { type: 'lowpass', freq: 500 } });
    },

    /* 升级/成就：小号感琶音 */
    levelup() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      [523, 659, 784, 1047, 1319].forEach((f, i) => {
        tone(f, t + i * 0.08, 0.25, 'triangle', 0.14);
        tone(f * 2, t + i * 0.08, 0.15, 'sine', 0.05);
      });
    },

    /* 解锁：低频+五度，有"打开"感 */
    unlock() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(196, t, 0.3, 'triangle', 0.18);
      tone(294, t + 0.05, 0.3, 'triangle', 0.14);
      tone(392, t + 0.1, 0.35, 'triangle', 0.10);
      noise(t, 0.1, 0.05, 'highpass', 3000);
    },

    /* 页面切换：whoosh */
    transition() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      noise(t, 0.25, 0.08, 'bandpass', 2000);
      tone(220, t, 0.2, 'sine', 0.06, { slide: 440 });
    },

    /* 金币/得分：金属质感 ping */
    coin() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(988, t, 0.08, 'square', 0.06);
      tone(1319, t + 0.06, 0.12, 'square', 0.08);
    },

    /* 通知/toast：双音 chime */
    notify() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(880, t, 0.1, 'sine', 0.08);
      tone(1175, t + 0.1, 0.15, 'sine', 0.06);
    },

    /* 暗影出现：低沉威胁 */
    shadow() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      tone(87, t, 0.5, 'sawtooth', 0.12, { filter: { type: 'lowpass', freq: 300 } });
      tone(92, t + 0.05, 0.5, 'sawtooth', 0.10, { filter: { type: 'lowpass', freq: 300 } });  // 微差拍频
    },

    /* 暗影净化：上升星光 */
    purify() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      [659, 880, 1109, 1319, 1760].forEach((f, i) => {
        tone(f, t + i * 0.05, 0.3, 'sine', 0.08);
      });
      noise(t, 0.3, 0.03, 'highpass', 8000);
    },

    /* Boss 出现：紧张鼓点 */
    boss() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      for (let i = 0; i < 4; i++) {
        tone(55, t + i * 0.15, 0.12, 'sine', 0.25, { slide: 30 });
        noise(t + i * 0.15 + 0.05, 0.05, 0.1, 'lowpass', 800);
      }
    },

    /* 求签/六爻：神秘拨弦 */
    divine() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      [440, 554, 659].forEach((f, i) => {
        tone(f, t + i * 0.15, 0.6, 'triangle', 0.10);
      });
      tone(220, t, 0.8, 'sine', 0.06);
    },

    toggle() {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) {}
      if (enabled) SFX.click();
      return enabled;
    },

    isOn: () => enabled
  };

  // 首次交互解锁 AudioContext
  function unlock() {
    getCtx();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  }
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);

  window.SFX = SFX;
})();
