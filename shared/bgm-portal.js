/* SHUAMONE 门户 BGM · Ambient Portal
   氛围型：比塔的 synthwave 更安静、更神秘——门户是"入口"不是"战斗"。
   声部：drone pad / 稀疏琶音 / 远处鼓心跳 / 偶发星光
   76 BPM · Dorian 调式（比小调多一点光）
   ============================================================ */
(function () {
  'use strict';
  const KEY = 'shuamone.portalBgm';
  const BPM = 76;
  const BEAT = 60 / BPM;
  const BAR = BEAT * 4;
  const LOOP_BARS = 8;
  const LOOKAHEAD = 2.0;
  const TICK = 250;

  let ctx = null, master = null, reverb = null, revSend = null;
  let timer = null, nextBeat = 0, beatIdx = 0;
  let running = false;
  let enabled = (function () { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } })();

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* Dorian 调式和弦进行（比纯小调亮一点——门户是希望不是绝望） */
  const CHORDS = [
    { pad: [38, 45, 50, 53, 57], arp: [50, 53, 57, 62], bass: 26 },  // Dm9
    { pad: [36, 43, 48, 52, 55], arp: [48, 52, 55, 60], bass: 24 },  // Cmaj9
    { pad: [41, 48, 53, 57, 60], arp: [53, 57, 60, 65], bass: 29 },  // Fmaj9
    { pad: [43, 50, 55, 59, 62], arp: [55, 59, 62, 67], bass: 31 }   // G13（回到 Dm 的属功能）
  ];

  function chordAt(bar) { return CHORDS[bar % 4]; }

  function initCtx() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();

    master = ctx.createGain();
    master.gain.value = 0.20;   // 门户比塔更安静
    master.connect(ctx.destination);

    // 大混响（门户=空间感）
    reverb = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * 3.5);  // 3.5 秒衰减
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.5);
      }
    }
    reverb.buffer = buf;
    const revGain = ctx.createGain();
    revGain.gain.value = 0.5;    // 混响量大（氛围）
    reverb.connect(revGain);
    revGain.connect(master);

    revSend = ctx.createGain();
    revSend.connect(reverb);
  }

  /* Drone Pad：持续锯齿+低通缓慢扫 */
  function drone(notes, t, dur) {
    notes.forEach((n, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = hz(n);
      osc.detune.value = (i - notes.length / 2) * 5;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(300, t);
      lp.frequency.linearRampToValueAtTime(900, t + dur * 0.5);
      lp.frequency.linearRampToValueAtTime(300, t + dur);
      lp.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.035, t + dur * 0.3);
      g.gain.setValueAtTime(0.035, t + dur * 0.6);
      g.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(lp); lp.connect(g);
      g.connect(master); g.connect(revSend);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  }

  /* 稀疏琶音：只在 2/4 拍出声，随机跳过 */
  function sparkArp(note, t) {
    if (Math.random() < 0.4) return;  // 60% 概率跳过（稀疏感）
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hz(note);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    const dl = ctx.createDelay(1.0);
    dl.delayTime.value = BEAT * 1.5;   // 附点延迟
    const dg = ctx.createGain();
    dg.gain.value = 0.4;
    osc.connect(g);
    g.connect(master); g.connect(revSend);
    g.connect(dl); dl.connect(dg); dg.connect(master); dg.connect(revSend);
    osc.start(t); osc.stop(t + 0.85);
  }

  /* 远处心跳鼓：极低频，每隔几拍一次 */
  function heartbeat(t) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + 0.55);
  }

  /* 偶发星光：高频闪现，大量混响 */
  function starlight(t) {
    if (Math.random() < 0.7) return;  // 30% 概率
    const freq = [1760, 2093, 2349, 2637][Math.floor(Math.random() * 4)];
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.03, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    osc.connect(g);
    g.connect(revSend); g.connect(master);  // 大部分进混响
    osc.start(t); osc.stop(t + 1.6);
  }

  function scheduleBeat(absBeat, bar, beat) {
    const t = nextBeat;
    const ch = chordAt(bar);

    // Drone pad：每 2 小节触发一次
    if (beat === 0 && bar % 2 === 0) {
      drone(ch.pad, t, BAR * 2);
    }

    // 心跳鼓：每 4 拍一次（不是每拍——极稀疏）
    if (beat === 0 && bar % 2 === 0) {
      heartbeat(t);
    }

    // 稀疏琶音：2/4 拍随机触发
    if (beat === 1 || beat === 3) {
      const arpIdx = Math.floor(Math.random() * ch.arp.length);
      sparkArp(ch.arp[arpIdx] + 12, t);
    }

    // 星光：完全随机
    if (beat % 1 === 0) {
      starlight(t + Math.random() * BEAT);
    }
  }

  function tick() {
    while (nextBeat < ctx.currentTime + LOOKAHEAD) {
      const bar = Math.floor(beatIdx / 4) % LOOP_BARS;
      const beat = beatIdx % 4;
      scheduleBeat(beatIdx, bar, beat);
      nextBeat += BEAT / 2;    // 半拍精度
      beatIdx += 0.5;
    }
  }

  function start() {
    if (running || !enabled) return;
    initCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    nextBeat = ctx.currentTime + 0.1;
    beatIdx = 0;
    timer = setInterval(tick, TICK);
    running = true;
  }

  function stop() {
    if (!running) return;
    clearInterval(timer); timer = null;
    running = false;
  }

  function gestureBoot() {
    document.removeEventListener('pointerdown', gestureBoot);
    document.removeEventListener('keydown', gestureBoot);
    if (enabled && !running) start();
  }
  document.addEventListener('pointerdown', gestureBoot);
  document.addEventListener('keydown', gestureBoot);

  window.PBGM = {
    start, stop,
    isOn: () => enabled,
    isPlaying: () => running,
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) {}
      if (enabled) start(); else stop();
      return enabled;
    }
  };
})();
