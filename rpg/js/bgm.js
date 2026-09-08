/* ============================================================
   AI PRODUCT RPG — BGM 引擎 · 轻柔版（纯 WebAudio 合成，无音频文件）
   76 BPM · 8 小节（每和弦 2 小节）· 无鼓组，不催人
   声部：暖垫 pad / 慢琶音电钢 / 柔贝斯 / 稀疏钟琴（带延迟）
   ============================================================ */
(function () {
  'use strict';
  const KEY = 'aiProductRpg.bgm';
  const BPM = 76;
  const BEAT = 60 / BPM;
  const BAR = BEAT * 4;
  const LOOP_BARS = 8;
  const LOOKAHEAD = 1.4;
  const TICK = 250;

  let ctx = null, master = null, delaySend = null;
  let timer = null, nextBeat = 0, beatIdx = 0;
  let running = false;
  let enabled = (function(){ try { return localStorage.getItem(KEY) !== '0'; } catch(e){ return true; } })();

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* 和弦：每 2 小节一个（Cmaj9 → Am9 → Fmaj9 → G13），慢和声节奏 = 平静 */
  const CH = [
    { pad: [48, 55, 62, 64], arp: [60, 64, 67, 71], bass: 36 },  // Cmaj9
    { pad: [45, 52, 60, 64], arp: [57, 60, 64, 67], bass: 33 },  // Am9
    { pad: [41, 48, 57, 60], arp: [53, 57, 60, 65], bass: 29 },  // Fmaj9
    { pad: [43, 50, 59, 62], arp: [55, 59, 62, 64], bass: 31 }   // G13 → 回 C
  ];
  /* 钟琴乐句：[绝对小节, 拍, midi, 时长(拍)] —— 极稀疏 */
  const BELL = [
    [1, 0, 76, 3], [1, 2.5, 72, 2.5],
    [3, 0, 74, 3], [3, 3, 69, 2],
    [5, 1, 71, 3], [5, 3.5, 76, 2],
    [7, 0, 72, 4]
  ];

  function initCtx() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.12;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 6500;   // 更暗更暖
    master.connect(lp); lp.connect(ctx.destination);
    const dl = ctx.createDelay(1.5);
    dl.delayTime.value = BEAT * 1.5;                  // 附点拍延迟，悠长
    const fb = ctx.createGain(); fb.gain.value = 0.32;
    const wet = ctx.createGain(); wet.gain.value = 0.25;
    dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master);
    delaySend = dl;
  }

  function tone(opt) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = opt.type || 'triangle';
    o.frequency.value = hz(opt.midi);
    if (opt.detune) o.detune.value = opt.detune;
    let head = o;
    if (opt.cutoff) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = opt.cutoff;
      o.connect(f); head = f;
    }
    head.connect(g); g.connect(opt.dest || master);
    const v = opt.vel || 0.1;
    g.gain.setValueAtTime(0, opt.t);
    g.gain.linearRampToValueAtTime(v, opt.t + (opt.atk || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0008, opt.t + opt.dur);
    o.start(opt.t); o.stop(opt.t + opt.dur + 0.1);
  }

  function scheduleBeat(i, t) {
    const bar = Math.floor(i / 4) % LOOP_BARS;
    const beat = i % 4;
    const ci = Math.floor(bar / 2) % CH.length;
    const ch = CH[ci];
    const secondBar = bar % 2 === 1;

    /* 暖垫：每和弦开始处，长音铺底（两个轻微失谐层） */
    if (beat === 0 && !secondBar) {
      ch.pad.forEach((m) => {
        tone({ t, dur: BAR * 2.1, midi: m, vel: 0.022, type: 'triangle', atk: 1.2, detune: 4 });
        tone({ t, dur: BAR * 2.1, midi: m, vel: 0.018, type: 'sine', atk: 1.4, detune: -6 });
      });
    }

    /* 慢琶音：每拍一个音，音序上行循环，柔而流动 */
    const arpNote = ch.arp[(beat + bar) % ch.arp.length];
    tone({ t: t + 0.02, dur: 1.6, midi: arpNote, vel: 0.03, type: 'triangle', atk: 0.04, detune: 5 });
    if (beat === 0) tone({ t, dur: 1.8, midi: arpNote + 12, vel: 0.012, type: 'sine', atk: 0.05, dest: delaySend });

    /* 柔贝斯：第 1 小节根音全音符；第 2 小节第 3 拍加一个五度，轻 */
    if (beat === 0 && !secondBar) {
      tone({ t, dur: BAR * 0.95, midi: ch.bass, vel: 0.1, type: 'triangle', atk: 0.06, cutoff: 480 });
    }
    if (secondBar && beat === 2) {
      tone({ t, dur: BAR * 0.45, midi: ch.bass + 7, vel: 0.065, type: 'triangle', atk: 0.08, cutoff: 460 });
    }

    /* 钟琴：极稀疏的长音点缀，穿延迟 */
    BELL.forEach(ph => {
      if (ph[0] === bar && ph[1] === beat) {
        tone({ t, dur: BEAT * ph[3], midi: ph[2], vel: 0.042, type: 'sine', atk: 0.02, dest: delaySend });
        tone({ t, dur: BEAT * ph[3], midi: ph[2], vel: 0.018, type: 'triangle', detune: 8, atk: 0.03, dest: delaySend });
      }
    });
  }

  function scheduler() {
    if (!running) return;
    while (nextBeat < ctx.currentTime + LOOKAHEAD) {
      scheduleBeat(beatIdx, nextBeat);
      beatIdx = (beatIdx + 1) % (4 * LOOP_BARS);
      nextBeat += BEAT;
    }
  }

  function start() {
    initCtx();
    if (!ctx || running) return;
    if (ctx.state === 'suspended') ctx.resume();
    running = true;
    beatIdx = 0;
    nextBeat = ctx.currentTime + 0.15;
    scheduler();
    timer = setInterval(scheduler, TICK);
  }
  function stop() {
    running = false;
    if (timer) { clearInterval(timer); timer = null; }
  }

  window.BGM = {
    start: start,
    stop: stop,
    isOn: () => enabled,
    isPlaying: () => running,
    tryStart() { if (enabled) start(); },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) {}
      if (enabled) start(); else stop();
      return enabled;
    }
  };
})();
