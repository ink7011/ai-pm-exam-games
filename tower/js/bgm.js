/* SHUAMONE 概念试炼塔 — BGM v3 · Synthwave Engine
   完全重写：从 8-bit 方波升级到多层 synthwave。
   声部：sub bass / saw pad / pluck arp / lead / percussion
   效果：convolution reverb / filter automation / sidechain pump
   曲式：A(4bar) → B(4bar) → A' → B' → 循环
   ============================================================ */
(function () {
  'use strict';
  const KEY = 'novaTower.bgm';
  const BPM = 100;                     // 稍快一点，更有推进感
  const BEAT = 60 / BPM;
  const BAR = BEAT * 4;
  const LOOP_BARS = 16;               // 16 小节 = 完整曲式
  const LOOKAHEAD = 1.2;
  const TICK = 180;

  let ctx = null, master = null, reverb = null, revSend = null;
  let comp = null;
  let timer = null, nextBeat = 0, beatIdx = 0;
  let running = false;
  let enabled = (function(){ try { return localStorage.getItem(KEY) !== '0'; } catch(e){ return true; } })();

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- 和弦进行（A段 vs B段）---------- */
  const CH_A = [
    { root: 45, pad: [45, 52, 57, 61, 64], arp: [57, 61, 64, 69], bass: 33 },   // Am9
    { root: 41, pad: [41, 48, 53, 57, 60], arp: [53, 57, 60, 65], bass: 29 },   // Fmaj9
    { root: 48, pad: [48, 55, 60, 64, 67], arp: [60, 64, 67, 72], bass: 36 },   // Cmaj7
    { root: 43, pad: [43, 50, 55, 59, 62], arp: [55, 59, 62, 67], bass: 31 }    // G13
  ];
  const CH_B = [
    { root: 45, pad: [45, 52, 57, 61, 64], arp: [57, 61, 64, 69], bass: 33 },
    { root: 38, pad: [38, 45, 50, 54, 57], arp: [50, 54, 57, 62], bass: 26 },   // Dbmaj7（远关系转调）
    { root: 43, pad: [43, 50, 55, 59, 62], arp: [55, 59, 62, 67], bass: 31 },
    { root: 40, pad: [40, 47, 52, 56, 59], arp: [52, 56, 59, 64], bass: 28 }    // Emaj7(#5)
  ];

  function chordAt(bar) {
    const idx = bar % 4;
    const section = Math.floor(bar / 4) % 4;
    // 曲式: A A B A  → 每段 4 小节
    return (section === 2) ? CH_B[idx] : CH_A[idx];
  }

  /* ---------- 初始化 ---------- */
  function initCtx() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();

    // Master chain: compressor → gain → destination
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    master = ctx.createGain();
    master.gain.value = 0.28;

    comp.connect(master);
    master.connect(ctx.destination);

    // Convolution reverb (generated impulse response)
    reverb = ctx.createConvolver();
    reverb.buffer = makeIR(2.8, 2.2);       // 2.8s decay, stereo
    const revGain = ctx.createGain();
    revGain.gain.value = 0.35;
    reverb.connect(revGain);
    revGain.connect(comp);

    revSend = ctx.createGain();
    revSend.gain.value = 1.0;
    revSend.connect(reverb);
  }

  /* 生成脉冲响应（无需外部音频文件） */
  function makeIR(duration, decay) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * duration);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (1 - t * 0.1);
      }
    }
    return buf;
  }

  /* ---------- 音色 ---------- */

  // Sub Bass：正弦波+微量泛音，低通滤波
  function subBass(note, t, dur) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hz(note);
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = hz(note) * 2;
    const g = ctx.createGain();
    const g2 = ctx.createGain();
    g2.gain.value = 0.15;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    lp.Q.value = 0.5;

    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(g); osc2.connect(g2); g2.connect(g);
    g.connect(lp); lp.connect(comp);
    osc.start(t); osc2.start(t);
    osc.stop(t + dur + 0.1); osc2.stop(t + dur + 0.1);
  }

  // Saw Pad：锯齿波叠+低通扫频+大混响
  function sawPad(notes, t, dur) {
    notes.forEach((n, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = hz(n);
      osc.detune.value = (i - notes.length / 2) * 4;  // 微失谐加宽
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(400, t);
      lp.frequency.linearRampToValueAtTime(1800, t + dur * 0.4);
      lp.frequency.linearRampToValueAtTime(500, t + dur);
      lp.Q.value = 1.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + dur * 0.2);
      g.gain.setValueAtTime(0.06, t + dur * 0.7);
      g.gain.linearRampToValueAtTime(0, t + dur);

      osc.connect(lp); lp.connect(g);
      g.connect(comp); g.connect(revSend);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  }

  // Pluck Arp：短促锯齿+高共鸣低通+延迟
  function pluck(note, t, vel) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = hz(note);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(4000, t);
    lp.frequency.exponentialRampToValueAtTime(400, t + 0.15);
    lp.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    // 延迟发送（附点八分音符延迟）
    const dl = ctx.createDelay(1.0);
    dl.delayTime.value = BEAT * 0.75;
    const dg = ctx.createGain();
    dg.gain.value = 0.3;

    osc.connect(lp); lp.connect(g);
    g.connect(comp); g.connect(revSend);
    g.connect(dl); dl.connect(dg); dg.connect(comp); dg.connect(revSend);

    osc.start(t); osc.stop(t + 0.25);
  }

  // Lead：脉冲波+颤音+扫频
  function lead(note, t, dur, vel) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = hz(note);
    const vib = ctx.createOscillator();
    vib.type = 'sine';
    vib.frequency.value = 5.5;
    const vibG = ctx.createGain();
    vibG.gain.value = hz(note) * 0.006;      // 轻微颤音
    vib.connect(vibG); vibG.connect(osc.frequency);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2500, t);
    lp.frequency.linearRampToValueAtTime(1200, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.03);
    g.gain.setValueAtTime(vel, t + dur * 0.6);
    g.gain.linearRampToValueAtTime(0, t + dur);

    osc.connect(lp); lp.connect(g);
    g.connect(comp); g.connect(revSend);
    osc.start(t); vib.start(t);
    osc.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
  }

  /* ---------- 鼓组 ---------- */
  function kick(t) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g); g.connect(comp);
    osc.start(t); osc.stop(t + 0.4);
  }

  function snare(t, vel) {
    // 噪声 + 音调成分
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2000;
    bp.Q.value = 0.8;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vel * 0.4, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    const tone = ctx.createOscillator();
    tone.type = 'triangle';
    tone.frequency.value = 180;
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(vel * 0.2, t);
    tg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(bp); bp.connect(ng); ng.connect(comp); ng.connect(revSend);
    tone.connect(tg); tg.connect(comp);
    noise.start(t); tone.start(t);
    noise.stop(t + 0.2); tone.stop(t + 0.1);
  }

  function hat(t, open) {
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * (open ? 0.3 : 0.05), ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 8000;
    const g = ctx.createGain();
    const dur = open ? 0.25 : 0.04;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hp); hp.connect(g); g.connect(comp);
    src.start(t); src.stop(t + dur + 0.01);
  }

  /* ---------- 编曲 ---------- */
  function scheduleBeat(absBeat, bar, beat) {
    const t = nextBeat;
    const ch = chordAt(bar);
    const section = Math.floor(bar / 4) % 4;
    const isDrop = section === 1 || section === 3;  // B 段 = 更满
    const isBuild = section === 2;

    // 鼓组（所有段落）
    if (beat === 0 || beat === 2) kick(t);
    if (beat === 1 || beat === 3) snare(t, isDrop ? 0.8 : 0.5);
    if (beat % 0.5 === 0.5) hat(t, false);
    if (beat === 3.5 && bar % 2 === 1) hat(t, true);

    // Sub Bass（八分推进）
    if (beat % 0.5 === 0) {
      const pattern = [0, 0, 7, 0, 0, 5, 0, 3]; // 音程变化
      const bassNote = ch.bass + (pattern[(beat * 2) % 8] || 0);
      subBass(bassNote, t, BEAT * 0.45);
    }

    // Pad（每小节第一拍触发）
    if (beat === 0) {
      sawPad(ch.pad, t, BAR * 0.95);
    }

    // Arp（八分音符，drop 段加密到十六分）
    if (isDrop ? beat % 0.25 === 0 : beat % 0.5 === 0) {
      const arpIdx = Math.floor(absBeat * 2) % ch.arp.length;
      const vel = isDrop ? 0.10 : 0.06;
      pluck(ch.arp[arpIdx] + 12, t, vel);  // +12 高八度
    }

    // Lead（只在 drop 段，每两拍一个音）
    if (isDrop && beat % 2 === 0) {
      const melody = [0, 4, 2, 5, 0, 3, 1, 4];  // 级进+跳进混合
      const melNote = ch.arp[melody[bar % 8] % ch.arp.length];
      lead(melNote + 12, t, BEAT * 1.8, 0.07);
    }

    // Build 段：riser 效果（snare roll加密）
    if (isBuild && beat === 3) {
      snare(t, 0.3);
      snare(t + BEAT * 0.33, 0.4);
      snare(t + BEAT * 0.66, 0.5);
    }
  }

  function tick() {
    while (nextBeat < ctx.currentTime + LOOKAHEAD) {
      const absBeat = beatIdx;
      const bar = Math.floor(absBeat / 4) % LOOP_BARS;
      const beat = absBeat % 4;
      scheduleBeat(absBeat, bar, beat);
      nextBeat += BEAT / 4;    // 十六分音符精度调度
      beatIdx += 0.25;
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
    clearInterval(timer);
    timer = null;
    running = false;
  }

  /* 自动播放策略兼容：首次用户交互时自动开播 */
  function gestureBoot() {
    document.removeEventListener('pointerdown', gestureBoot);
    document.removeEventListener('keydown', gestureBoot);
    document.removeEventListener('touchstart', gestureBoot);
    if (enabled && !running) start();
  }
  document.addEventListener('pointerdown', gestureBoot);
  document.addEventListener('keydown', gestureBoot);
  document.addEventListener('touchstart', gestureBoot);

  window.TBGM = {
    start, stop,
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
