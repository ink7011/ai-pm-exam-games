/* ============================================================
   NOVA 概念试炼塔 — BGM · 试炼版（纯 WebAudio 合成，无音频文件）
   与 RPG 同源手感，但更「进击一点」：
   92 BPM · 小调进行 Am9 → Fmaj9 → Cmaj7 → E7(#5)
   声部：脉冲贝斯（八分推进）/ 锯齿琶音（亮而紧）/ 暗垫 / 轻鼓组（底鼓+掌击+踩镲）
   ============================================================ */
(function () {
  'use strict';
  const KEY = 'novaTower.bgm';
  const BPM = 92;
  const BEAT = 60 / BPM;
  const BAR = BEAT * 4;
  const LOOP_BARS = 8;
  const LOOKAHEAD = 1.2;
  const TICK = 220;

  let ctx = null, master = null, delaySend = null;
  let timer = null, nextBeat = 0, beatIdx = 0;
  let running = false;
  let enabled = (function(){ try { return localStorage.getItem(KEY) !== '0'; } catch(e){ return true; } })();

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* 和弦：每 2 小节一个，小调底盘 + 属七张力 */
  const CH = [
    { pad: [45, 52, 59, 64], arp: [57, 60, 64, 67], bass: 33 },  // Am9
    { pad: [41, 48, 57, 60], arp: [53, 57, 60, 65], bass: 29 },  // Fmaj9
    { pad: [48, 55, 62, 64], arp: [60, 64, 67, 71], bass: 36 },  // Cmaj7
    { pad: [40, 47, 56, 59], arp: [52, 56, 59, 63], bass: 28 }   // E7#9 感 → 回 Am
  ];

  function initCtx() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.11;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 7800;
    master.connect(lp); lp.connect(ctx.destination);
    const dl = ctx.createDelay(1.2);
    dl.delayTime.value = BEAT * 0.75;               // 附点短延迟，紧凑
    const fb = ctx.createGain(); fb.gain.value = 0.26;
    delaySend = ctx.createGain(); delaySend.gain.value = 0.5;
    delaySend.connect(dl); dl.connect(fb); fb.connect(dl);
    dl.connect(master);
  }

  function osc(type, midi, t, dur, vol, dest, detune) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = hz(midi);
    if (detune) o.detune.value = detune;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0011, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /* 鼓组（合成）：kick = 正弦下扫，hat = 高通噪声，clap = 带通噪声 */
  function noiseBuf() {
    if (noiseBuf.b) return noiseBuf.b;
    const b = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf.b = b; return b;
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.2);
  }
  function hat(t, open) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf();
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(open ? 0.16 : 0.09, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.16 : 0.045));
    s.connect(hp); hp.connect(g); g.connect(master);
    s.start(t); s.stop(t + 0.2);
  }
  function clap(t) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.34, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    s.connect(bp); bp.connect(g); g.connect(master); g.connect(delaySend);
    s.start(t); s.stop(t + 0.15);
  }

  function scheduleBeat(absBeat, bar, beat) {
    const t = nextBeat;
    const ch = CH[(bar >> 1) % CH.length];

    /* 暗垫：每 2 小节一次，和弦长音 */
    if (beat === 0 && bar % 2 === 0) {
      ch.pad.forEach((m, i) => osc('sawtooth', m - 12, t, BAR * 2 * 0.98, 0.028, master, i * 4 - 6));
    }
    /* 脉冲贝斯：八分音符驱动，小节内 8 个（重拍略强） */
    for (const eighth of [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]) {
      if (Math.abs(beat - eighth) < 0.01) {
        const accent = (eighth % 1 === 0);
        osc('triangle', ch.bass, t, BEAT * 0.42, accent ? 0.3 : 0.2, master);
        osc('square', ch.bass + 12, t, BEAT * 0.2, accent ? 0.05 : 0.03, master);
      }
    }
    /* 锯齿琶音：十六分感（每半拍一个音，跨两八度），亮而紧 */
    const arpNotes = ch.arp.concat(ch.arp.map(m => m + 12));
    const idx = (bar * 8 + beat * 2) % arpNotes.length;
    osc('sawtooth', arpNotes[idx], t, BEAT * 0.36, 0.055, delaySend);
    osc('sawtooth', arpNotes[(idx + 2) % arpNotes.length], t + BEAT * 0.5, BEAT * 0.3, 0.04, delaySend);
    /* 偶发高音星点 */
    if (beat === 2.5 && bar % 2 === 1) osc('square', arpNotes[arpNotes.length - 1] + 12, t, BEAT * 0.9, 0.035, delaySend, 8);

    /* 鼓组：kick 1/3(+3.5 偶发)，clap 2/4，hat 反拍 */
    if (beat === 0 || beat === 2) kick(t);
    if (beat === 3.5 && bar % 4 === 3) kick(t);
    if (beat === 1 || beat === 3) clap(t);
    if (Math.abs(beat % 1) === 0.5) hat(t, false);
    if (beat === 3.75 && bar % 2 === 1) hat(t, true);
  }

  function tick() {
    while (nextBeat < ctx.currentTime + LOOKAHEAD) {
      const absBeat = beatIdx;
      const bar = Math.floor(absBeat / 4) % LOOP_BARS;
      const beat = absBeat % 4;
      scheduleBeat(absBeat, bar, beat);
      nextBeat += BEAT / 2;                 // 半拍调度
      beatIdx += 0.5;
    }
  }
  function start() {
    if (running || !enabled) return;
    initCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    nextBeat = ctx.currentTime + 0.1; beatIdx = 0;
    timer = setInterval(tick, TICK);
    running = true;
  }
  function stop() {
    if (!running) return;
    clearInterval(timer); timer = null;
    running = false;
  }

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

  /* 自动播放策略兼容：浏览器不允许无声页面直接出声——首次用户交互（点击/按键）时自动开播。
     enabled 为开而从未手动进设置关过 BGM 的玩家，点第一个选项的那一刻音乐就进来了。 */
  function gestureBoot() {
    document.removeEventListener('pointerdown', gestureBoot);
    document.removeEventListener('keydown', gestureBoot);
    document.removeEventListener('touchstart', gestureBoot);
    if (enabled && !running) start();
  }
  document.addEventListener('pointerdown', gestureBoot);
  document.addEventListener('keydown', gestureBoot);
  document.addEventListener('touchstart', gestureBoot);
})();
