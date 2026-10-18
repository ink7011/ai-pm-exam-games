/* SHUAMONE 概念试炼塔 — BGM v4 · 多曲轮播引擎
   v3 单曲循环 → v4 曲库轮播：5 首风格各异的曲子，每首播 2 遍自动换下一首，
   顺序每轮洗牌；设置面板可看曲名、手动切歌。
   引擎：Web Audio 全合成（无音频文件）
   声部：sub bass / saw pad / pluck·bell arp / lead / percussion
   效果：convolution reverb / filter automation / swing / per-song gain
   ============================================================ */
(function () {
  'use strict';
  const KEY = 'novaTower.bgm';
  const LOOP_BARS = 16;               // 每曲一个循环 16 小节
  const LOOP_BEATS = LOOP_BARS * 4;
  const LOOPS_PER_SONG = 2;           // 每曲播 2 遍再换
  const LOOKAHEAD = 1.2;
  const TICK = 180;

  let ctx = null, master = null, reverb = null, revSend = null, revGain = null;
  let comp = null;
  let timer = null, nextBeat = 0, beatIdx = 0;
  let running = false;
  let lastSongId = null;
  let enabled = (function(){ try { return localStorage.getItem(KEY) !== '0'; } catch(e){ return true; } })();

  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ══════════ 曲库（数据驱动，引擎统一渲染）══════════
     和弦对象：{ root, pad:[…], arp:[…], bass }
     drums: drive(四踩推进) / snap(紧凑) / half(半拍慵懒) / sparse(氛围稀疏)
     arp:   pluck(锯齿拨弦) / bell(正弦钟琴)
     swing: 0-1（8 分音符摇摆量，0.5≈三连音摇摆）            */
  const SONGS = [
    {
      id: 'voyage', name: '启程', tag: 'Synthwave', bpm: 100,
      form: 'AABA', drums: 'drive', arp: 'pluck', arpDiv: 0.5, arpOct: 12, swing: 0,
      bassDiv: 0.5, gain: 0.28, rev: 0.35, drops: [1, 3], builds: [2],
      bassPat: [0, 0, 7, 0, 0, 5, 0, 3],
      leadMel: [0, 4, 2, 5, 0, 3, 1, 4], leadVel: 0.07,
      A: [
        { root: 45, pad: [45, 52, 57, 61, 64], arp: [57, 61, 64, 69], bass: 33 },   // Am9
        { root: 41, pad: [41, 48, 53, 57, 60], arp: [53, 57, 60, 65], bass: 29 },   // Fmaj9
        { root: 48, pad: [48, 55, 60, 64, 67], arp: [60, 64, 67, 72], bass: 36 },   // Cmaj7
        { root: 43, pad: [43, 50, 55, 59, 62], arp: [55, 59, 62, 67], bass: 31 }    // G13
      ],
      B: [
        { root: 45, pad: [45, 52, 57, 61, 64], arp: [57, 61, 64, 69], bass: 33 },
        { root: 38, pad: [38, 45, 50, 54, 57], arp: [50, 54, 57, 62], bass: 26 },   // Dbmaj7
        { root: 43, pad: [43, 50, 55, 59, 62], arp: [55, 59, 62, 67], bass: 31 },
        { root: 40, pad: [40, 47, 52, 56, 59], arp: [52, 56, 59, 64], bass: 28 }    // Emaj7(#5)
      ]
    },
    {
      id: 'cloudride', name: '云端', tag: 'Dream Lo-fi', bpm: 84,
      form: 'AABA', drums: 'half', arp: 'pluck', arpDiv: 0.5, arpOct: 12, swing: 0.45,
      bassDiv: 1, gain: 0.26, rev: 0.45, drops: [3], builds: [],
      bassPat: [0, 0, 0, 7, 0, 0, 5, 0],
      leadMel: null, leadVel: 0,
      A: [
        { root: 41, pad: [41, 53, 57, 60, 64], arp: [60, 64, 65, 69], bass: 29 },   // Fmaj9
        { root: 43, pad: [43, 55, 59, 62, 64], arp: [59, 62, 64, 67], bass: 31 },   // G6
        { root: 45, pad: [45, 52, 57, 59, 64], arp: [57, 64, 67, 71], bass: 33 },   // Am9
        { root: 48, pad: [48, 55, 59, 62, 65], arp: [62, 65, 67, 71], bass: 36 }    // Cmaj9
      ],
      B: [
        { root: 38, pad: [38, 50, 53, 57, 60], arp: [57, 60, 62, 65], bass: 26 },   // Dm9
        { root: 34, pad: [34, 46, 50, 53, 57], arp: [53, 57, 58, 62], bass: 34 },   // Bbmaj9
        { root: 41, pad: [41, 53, 57, 60, 64], arp: [60, 64, 65, 69], bass: 29 },
        { root: 43, pad: [43, 55, 59, 62, 64], arp: [59, 62, 64, 67], bass: 31 }
      ]
    },
    {
      id: 'stardrift', name: '星流', tag: 'Ambient', bpm: 68,
      form: 'ABAB', drums: 'sparse', arp: 'bell', arpDiv: 1, arpOct: 24, swing: 0,
      bassDiv: 1, gain: 0.22, rev: 0.6, drops: [], builds: [],
      bassPat: [0, 0, 0, 0, 7, 0, 0, 0],
      leadMel: null, leadVel: 0,
      A: [
        { root: 48, pad: [48, 55, 59, 62, 67], arp: [60, 64, 67, 72], bass: 36 },   // Cmaj9
        { root: 45, pad: [45, 52, 55, 59, 64], arp: [57, 60, 64, 69], bass: 33 },   // Am9
        { root: 41, pad: [41, 48, 53, 57, 62], arp: [53, 57, 60, 65], bass: 29 },   // Fmaj9
        { root: 43, pad: [43, 50, 55, 59, 62], arp: [55, 59, 62, 67], bass: 31 }    // G
      ],
      B: [
        { root: 40, pad: [40, 52, 55, 59, 62], arp: [64, 67, 71, 74], bass: 28 },   // Em9
        { root: 38, pad: [38, 50, 54, 57, 61], arp: [61, 66, 69, 73], bass: 26 },   // Dmaj9(色彩)
        { root: 41, pad: [41, 48, 53, 57, 62], arp: [53, 57, 60, 65], bass: 29 },
        { root: 45, pad: [45, 52, 55, 59, 64], arp: [57, 60, 64, 69], bass: 33 }
      ]
    },
    {
      id: 'nightwalk', name: '夜行', tag: 'Chillwave', bpm: 94,
      form: 'AABA', drums: 'snap', arp: 'pluck', arpDiv: 0.5, arpOct: 12, swing: 0.18,
      bassDiv: 0.5, gain: 0.27, rev: 0.4, drops: [1, 3], builds: [2],
      bassPat: [0, 7, 0, 0, 10, 0, 7, 0],
      leadMel: [2, 0, 4, 3, 5, 2, 0, 4], leadVel: 0.055,
      A: [
        { root: 38, pad: [38, 50, 53, 57, 60], arp: [50, 57, 60, 65], bass: 26 },   // Dm9
        { root: 34, pad: [34, 46, 50, 53, 57], arp: [46, 53, 57, 62], bass: 22 },   // Bbmaj9
        { root: 43, pad: [43, 55, 58, 62, 65], arp: [55, 58, 62, 65], bass: 31 },   // Gm9
        { root: 45, pad: [45, 52, 55, 58, 63], arp: [55, 58, 63, 67], bass: 33 }    // A7#9
      ],
      B: [
        { root: 38, pad: [38, 50, 53, 57, 60], arp: [50, 57, 60, 65], bass: 26 },
        { root: 41, pad: [41, 48, 53, 56, 60], arp: [53, 56, 60, 65], bass: 29 },   // Fmaj7#11
        { root: 36, pad: [36, 48, 51, 55, 58], arp: [48, 51, 55, 60], bass: 24 },   // Cm9
        { root: 45, pad: [45, 52, 55, 58, 63], arp: [55, 58, 63, 67], bass: 33 }
      ]
    },
    {
      id: 'summit', name: '登顶', tag: 'Uplift', bpm: 110,
      form: 'AABA', drums: 'drive', arp: 'pluck', arpDiv: 0.25, arpOct: 12, swing: 0,
      bassDiv: 0.5, gain: 0.29, rev: 0.32, drops: [1, 3], builds: [2],
      bassPat: [0, 0, 7, 0, 0, 5, 3, 0],
      leadMel: [0, 2, 4, 5, 4, 2, 3, 5], leadVel: 0.075,
      A: [
        { root: 48, pad: [48, 55, 59, 62, 65], arp: [60, 64, 67, 72], bass: 36 },   // Cmaj9
        { root: 43, pad: [43, 50, 55, 59, 64], arp: [55, 59, 62, 67], bass: 31 },   // Gadd9
        { root: 45, pad: [45, 52, 55, 59, 62], arp: [57, 60, 64, 69], bass: 33 },   // Am9
        { root: 41, pad: [41, 48, 53, 57, 60], arp: [57, 60, 65, 69], bass: 29 }    // Fmaj9
      ],
      B: [
        { root: 41, pad: [41, 48, 53, 57, 60], arp: [57, 60, 65, 69], bass: 29 },
        { root: 43, pad: [43, 50, 55, 59, 64], arp: [55, 59, 62, 67], bass: 31 },
        { root: 40, pad: [40, 52, 55, 59, 62], arp: [55, 59, 64, 67], bass: 28 },   // Em7
        { root: 48, pad: [48, 55, 59, 62, 65], arp: [60, 64, 67, 72], bass: 36 }
      ]
    }
  ];

  /* 洗牌轮播顺序 */
  let order = [];
  function reshuffle(keepFirst) {
    const idx = SONGS.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    if (keepFirst != null) {
      const at = idx.indexOf(keepFirst);
      if (at > 0) { idx.splice(at, 1); idx.unshift(keepFirst); }
    }
    order = idx;
  }
  reshuffle();

  /* 由绝对拍号推导：当前曲 / 小节 / 拍 / 段落 */
  function songAt(absBeat) {
    const loopIdx = Math.floor(absBeat / LOOP_BEATS);
    const song = SONGS[order[Math.floor(loopIdx / LOOPS_PER_SONG) % order.length]];
    const inLoop = absBeat % LOOP_BEATS;
    const section = Math.floor(inLoop / 16) % 4;
    const formChar = song.form[section] || 'A';
    return {
      song, loopIdx, section, formChar,
      bar: Math.floor(inLoop / 4),
      beat: absBeat % 4,
      chord: (formChar === 'B' ? song.B : song.A)[Math.floor(inLoop / 4) % 4]
    };
  }

  /* ---------- 初始化 ---------- */
  function initCtx() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();

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

    reverb = ctx.createConvolver();
    reverb.buffer = makeIR(2.8, 2.2);
    revGain = ctx.createGain();
    revGain.gain.value = 0.35;
    reverb.connect(revGain);
    revGain.connect(comp);

    revSend = ctx.createGain();
    revSend.gain.value = 1.0;
    revSend.connect(reverb);
  }

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

  /* 曲目切换时渐变到该曲的音量/混响 */
  function applySongMix(song) {
    if (!ctx || song.id === lastSongId) return;
    const wasFirst = lastSongId === null;
    lastSongId = song.id;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(song.gain, now + (wasFirst ? 0.01 : 1.2));
    revGain.gain.cancelScheduledValues(now);
    revGain.gain.setValueAtTime(revGain.gain.value, now);
    revGain.gain.linearRampToValueAtTime(song.rev, now + 1.2);
  }

  /* ---------- 音色 ---------- */
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

  function sawPad(notes, t, dur, soft) {
    notes.forEach((n, i) => {
      const osc = ctx.createOscillator();
      osc.type = soft ? 'triangle' : 'sawtooth';
      osc.frequency.value = hz(n);
      osc.detune.value = (i - notes.length / 2) * (soft ? 6 : 4);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(soft ? 300 : 400, t);
      lp.frequency.linearRampToValueAtTime(soft ? 1200 : 1800, t + dur * 0.4);
      lp.frequency.linearRampToValueAtTime(soft ? 350 : 500, t + dur);
      lp.Q.value = 1.5;
      const g = ctx.createGain();
      const peak = soft ? 0.085 : 0.06;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + dur * 0.2);
      g.gain.setValueAtTime(peak, t + dur * 0.7);
      g.gain.linearRampToValueAtTime(0, t + dur);

      osc.connect(lp); lp.connect(g);
      g.connect(comp); g.connect(revSend);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  }

  function pluck(note, t, vel, beatSec) {
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

    const dl = ctx.createDelay(1.0);
    dl.delayTime.value = beatSec * 0.75;
    const dg = ctx.createGain();
    dg.gain.value = 0.3;

    osc.connect(lp); lp.connect(g);
    g.connect(comp); g.connect(revSend);
    g.connect(dl); dl.connect(dg); dg.connect(comp); dg.connect(revSend);

    osc.start(t); osc.stop(t + 0.25);
  }

  /* 钟琴：正弦+泛音，长衰减，大混响（氛围曲用） */
  function bell(note, t, vel) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    [1, 2.76, 5.4].forEach((mul, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = hz(note) * mul;
      const og = ctx.createGain();
      og.gain.value = [0.6, 0.22, 0.08][i];
      osc.connect(og); og.connect(g);
      osc.start(t); osc.stop(t + 1.5);
    });
    g.connect(comp); g.connect(revSend);
  }

  function lead(note, t, dur, vel) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = hz(note);
    const vib = ctx.createOscillator();
    vib.type = 'sine';
    vib.frequency.value = 5.5;
    const vibG = ctx.createGain();
    vibG.gain.value = hz(note) * 0.006;
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
  function kick(t, vel) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel == null ? 0.7 : vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g); g.connect(comp);
    osc.start(t); osc.stop(t + 0.4);
  }

  function snare(t, vel) {
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

  function hat(t, open, vel) {
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
    g.gain.setValueAtTime(vel == null ? 0.12 : vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hp); hp.connect(g); g.connect(comp);
    src.start(t); src.stop(t + dur + 0.01);
  }

  /* ---------- 编曲 ---------- */
  function scheduleBeat(absBeat, pos) {
    const song = pos.song;
    applySongMix(song);
    const beatSec = 60 / song.bpm;
    const bar = pos.bar, beat = pos.beat;
    const isDrop = song.drops.indexOf(pos.section) >= 0;
    const isBuild = song.builds.indexOf(pos.section) >= 0;

    /* 摇摆：把 8 分反拍往后推 */
    let t = nextBeat;
    if (song.swing && beat % 1 === 0.5) t += song.swing * beatSec / 3;

    /* 鼓组按曲风分派 */
    if (song.drums === 'drive') {
      if (beat === 0 || beat === 2) kick(t);
      if (beat === 1 || beat === 3) snare(t, isDrop ? 0.8 : 0.5);
      if (beat % 0.5 === 0.5) hat(t, false);
      if (beat === 3.5 && bar % 2 === 1) hat(t, true);
    } else if (song.drums === 'snap') {
      if (beat === 0 || beat === 2) kick(t);
      if (beat === 1 || beat === 3) snare(t, isDrop ? 0.62 : 0.42);
      if (beat % 0.5 === 0.5) hat(t, false, 0.09);
      if (beat === 3.5 && isDrop) hat(t, true);
    } else if (song.drums === 'half') {
      if (beat === 0) kick(t, 0.55);
      if (beat === 2.5 && bar % 2 === 1) kick(t, 0.4);
      if (beat === 2) snare(t, isDrop ? 0.55 : 0.4);
      if (beat % 0.5 === 0.5) hat(t, false, 0.07);
    } else if (song.drums === 'sparse') {
      if (beat === 0 && bar % 2 === 0) kick(t, 0.32);
      if (beat === 2.5 && bar % 4 === 3) kick(t, 0.24);
      if (beat === 1.5 || beat === 3.5) hat(t, false, 0.05);
      if (pos.loopIdx % 2 === 1 && bar === LOOP_BARS - 1 && beat === 3.5) hat(t, true, 0.06);
    }

    /* Sub Bass */
    if (beat % song.bassDiv === 0) {
      const step = Math.round((beat % 4) / song.bassDiv) % song.bassPat.length;
      subBass(pos.chord.bass + (song.bassPat[step] || 0), t, beatSec * song.bassDiv * 0.9);
    }

    /* Pad */
    if (beat === 0) {
      sawPad(pos.chord.pad, t, beatSec * 4 * 0.95, song.arp === 'bell');
    }

    /* Arp（drop 段自动加密一档） */
    const div = isDrop ? song.arpDiv / 2 : song.arpDiv;
    if (div > 0 && beat % div === 0) {
      const arpIdx = Math.floor(absBeat / div) % pos.chord.arp.length;
      if (song.arp === 'bell') {
        if (beat % Math.max(div, 0.5) === 0)   /* 钟琴保持稀疏 */
          bell(pos.chord.arp[arpIdx] + song.arpOct, t, isDrop ? 0.09 : 0.07);
      } else {
        pluck(pos.chord.arp[arpIdx] + song.arpOct, t, isDrop ? 0.10 : 0.06, beatSec);
      }
    }

    /* Lead（仅 drop 段） */
    if (song.leadMel && isDrop && beat % 2 === 0) {
      const melNote = pos.chord.arp[song.leadMel[bar % 8] % pos.chord.arp.length];
      lead(melNote + 12, t, beatSec * 1.8, song.leadVel);
    }

    /* Build 段军鼓滚奏 */
    if (isBuild && beat === 3) {
      snare(t, 0.3);
      snare(t + beatSec * 0.33, 0.4);
      snare(t + beatSec * 0.66, 0.5);
    }
  }

  function tick() {
    while (nextBeat < ctx.currentTime + LOOKAHEAD) {
      const pos = songAt(beatIdx);
      scheduleBeat(beatIdx, pos);
      nextBeat += (60 / pos.song.bpm) / 4;
      beatIdx += 0.25;
    }
  }

  function start() {
    if (running || !enabled) return;
    initCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    nextBeat = ctx.currentTime + 0.1;
    lastSongId = null;
    timer = setInterval(tick, TICK);
    running = true;
  }

  function stop() {
    if (!running) return;
    clearInterval(timer);
    timer = null;
    running = false;
  }

  /* 手动切歌：跳到下一曲开头，主音量短促下潜再回升 */
  function next() {
    if (!running || !ctx) {
      reshuffle(order.length ? (order[0] + 1) % SONGS.length : 0);
      return;
    }
    const loopIdx = Math.floor(beatIdx / LOOP_BEATS);
    beatIdx = (Math.floor(loopIdx / LOOPS_PER_SONG) + 1) * LOOPS_PER_SONG * LOOP_BEATS;
    const now = ctx.currentTime;
    const target = songAt(beatIdx).song.gain;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0.06, now + 0.12);
    master.gain.linearRampToValueAtTime(target, now + 0.9);
  }

  function nowPlaying() {
    const s = songAt(beatIdx).song;
    return { id: s.id, name: s.name, tag: s.tag, bpm: s.bpm, n: SONGS.length };
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
    start, stop, next,
    isOn: () => enabled,
    isPlaying: () => running,
    nowPlaying,
    tryStart() { if (enabled) start(); },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) {}
      if (enabled) start(); else stop();
      return enabled;
    }
  };
})();
