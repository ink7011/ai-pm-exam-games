const core = require('../../utils/core.js');
const ELITE_SECONDS = 25;

Page({
  data: {
    phase: 'battle', // battle | shop | result
    hearts: [0, 1, 2, 3, 4],
    hp: 3, coins: 0, score: 0, combo: 0,
    items: {}, itemList: core.ITEMS, usable: {},
    item: {}, opts: [], stars: '',
    kind: 'normal', kindClass: '', kindLabel: '', floorLabel: '',
    isElite: false, timePct: 100,
    hintOn: false,
    verdict: null,
    shopItems: [],
    result: null,
    floors: [], shadowCount: 0,
    towerName: ''
  },

  onLoad(options) {
    const app0 = getApp();
    if (app0 && app0.globalData && app0.globalData.P) core.loadPaidCaches(app0.globalData.P);
    this.towerId = options.tower || 'mix';
    this.P = getApp().getP();
    this.R = core.newRun(this.towerId, this.P);
    const t = core.TOWERS.find(x => x.id === this.towerId);
    this.setData({ towerName: t ? t.name : '' });
    this.refreshStatus();
    this.serve();
  },
  onUnload() { this.clearTimer(); },
  onHide() { this.clearTimer(); },
  onShow() { if (this.cur && this.cur.kind === 'elite' && !this.cur.answered && this.data.phase === 'battle') this.startTimer(); },

  /* ---------- 遭遇调度 ---------- */
  serve() {
    const R = this.R;
    if (R.pendingShadow.length && R.pendingShadow[0].at <= R.pos + 1 && R.hp > 0 && !R.done) {
      const sh = R.pendingShadow.shift();
      const it = core.item(sh.id);
      if (it) { this.renderBattle(it, 'shadow', '暗影 · ' + it.k); return; }
    }
    if (R.hp <= 0 || R.done || R.pos >= R.slots.length) { this.renderResult(); return; }
    const slot = R.slots[R.pos];
    this.renderBattle(core.item(slot.itemId), slot.kind, '第 ' + slot.floor + ' 层');
  },

  renderBattle(it, kind, floorLabel) {
    this.cur = { item: it, kind, answered: false, usedRetry: false, hintOn: false, timeAdded: false, wrongPicks: [], deadline: 0 };
    const opts = it.opts.map((t, i) => ({ letter: 'ABCD'[i], text: t, cls: '', disabled: false }));
    this.setData({
      phase: 'battle',
      item: { q: it.q, k: it.k, expl: it.expl, exp: it.exp || '', modName: it.modName, pri: it.pri || 0, ans: it.ans },
      opts,
      stars: '★'.repeat(it.diff || 1),
      kind,
      kindClass: kind === 'boss' ? 'boss' : (kind === 'elite' ? 'elite' : (kind === 'shadow' ? 'shadowc' : '')),
      kindLabel: kind === 'boss' ? '☠ BOSS' : kind === 'elite' ? '⚡ 精英 · 限时' : kind === 'shadow' ? '👁 暗影复仇' : '概念遭遇',
      floorLabel,
      isElite: kind === 'elite',
      hintOn: false,
      verdict: null,
      timePct: 100
    });
    this.refreshStatus();
    this.refreshFloors();
    if (kind === 'elite') this.startTimer();
  },

  startTimer() {
    this.clearTimer();
    const base = ELITE_SECONDS + (this.cur.timeAdded ? 15 : 0);
    this.cur.deadline = Date.now() + (this.data.timePct < 100 ? this.cur.deadline - Date.now() : base * 1000);
    this.timerId = setInterval(() => {
      if (!this.cur || this.cur.answered) { this.clearTimer(); return; }
      const left = Math.max(0, this.cur.deadline - Date.now());
      const pct = Math.round(left / (base * 1000) * 100);
      this.setData({ timePct: pct });
      if (left <= 0) { this.clearTimer(); this.answer(-1); }
    }, 300);
  },
  clearTimer() { if (this.timerId) { clearInterval(this.timerId); this.timerId = null; } },

  /* ---------- 作答 ---------- */
  tapOption(e) {
    const i = e.currentTarget ? +e.currentTarget.dataset.i : e;
    this.answer(i);
  },
  answer(i) {
    const cur = this.cur;
    if (!cur || cur.answered) return;
    if (i >= 0) {
      const o = this.data.opts[i];
      if (!o || o.disabled || o.cls === 'zapped') return;
    }
    this.clearTimer();
    const it = cur.item;
    const R = this.R;

    if (i === it.ans) {
      cur.answered = true;
      const g = core.settleCorrect(R, cur, it, this.P);
      const opts = this.data.opts.map((o, idx) => idx === it.ans ? { ...o, cls: 'right', disabled: true } : { ...o, disabled: true });
      const purify = g.purify === 'clean' ? ' · 暗影已净化 ✦' : (g.purify === 'half' ? ' · 暗影净化中（再答对 1 次根除）' : '');
      this.setData({
        opts,
        verdict: {
          type: 'good',
          tag: '✓ 击破 · +' + g.coins + ' 金币 · +' + g.score + ' 分' + (R.combo >= 3 ? ' · ' + R.combo + ' 连击!' : '') + purify,
          ansLine: '正确答案：' + 'ABCD'[it.ans],
          exp: it.exp || '',
          dexpl: (it.dexpl || []).map((d, idx) => ({ letter: 'ABCD'[idx] + (idx === it.ans ? ' ✓' : ' ✗'), text: d, ok: idx === it.ans })),
          canRetry: false,
          nextLabel: this.nextLabel()
        }
      });
    } else {
      cur.wrongPicks.push(i);
      if (i >= 0) {
        const opts = this.data.opts.map((o, idx) => idx === i ? { ...o, cls: 'wrongpick', disabled: true } : o);
        this.setData({ opts });
      }
      if ((R.items.retry || 0) > 0 && !cur.usedRetry) {
        cur.usedRetry = true;
        this.setData({
          verdict: { type: 'bad', tag: '✗ 判定错误 —— 你有一张复查券', ansLine: '', canRetry: true, nextLabel: '' }
        });
        return;
      }
      this.finalizeWrong(i < 0 ? '⏰ 超时 · 遭受重击' : '✗ 判定错误 · 受到 1 点伤害');
    }
    this.refreshStatus();
  },
  finalizeWrong(tag) {
    const cur = this.cur, it = cur.item, R = this.R;
    cur.answered = true;
    core.settleWrong(R, cur, it, this.P);
    const opts = this.data.opts.map((o, idx) => idx === it.ans ? { ...o, cls: 'right', disabled: true } : { ...o, disabled: true });
    this.setData({
      opts,
      verdict: {
        type: 'bad',
        tag: tag + '（生命 ' + R.hp + '/' + core.MAX_HP + '）',
        ansLine: '正确答案：' + 'ABCD'[it.ans] + ' · 此题已化为暗影，3 层后复仇',
        exp: it.exp || '',
        dexpl: (it.dexpl || []).map((d, idx) => ({ letter: 'ABCD'[idx] + (idx === it.ans ? ' ✓' : ' ✗'), text: d, ok: idx === it.ans })),
        canRetry: false,
        nextLabel: R.hp <= 0 ? '查看结算 ▸' : this.nextLabel()
      }
    });
  },
  useRetry() {
    this.R.items.retry--;
    this.setData({ verdict: null });
    this.refreshStatus();
  },
  declineRetry() { this.finalizeWrong('✗ 放弃复查 · 受到 1 点伤害'); },

  nextLabel() {
    const R = this.R, cur = this.cur;
    if (cur.kind === 'boss') return '登顶结算 ▸';
    if (cur.kind === 'shadow') return '继续爬塔 ▸';
    const isShop = (R.pos + 1 === core.ELITE_FLOORS[0] || R.pos + 1 === core.ELITE_FLOORS[1]);
    return isShop ? '前往补给站 ▸' : '下一层 ▸';
  },

  next() {
    const R = this.R;
    if (R.hp <= 0) { this.renderResult(); return; }
    if (this.cur && this.cur.kind !== 'shadow') R.pos++;
    if (R.pos >= R.slots.length) { this.renderResult(); return; }
    const shopAfter = this.cur && this.cur.kind !== 'shadow' &&
      (R.pos === core.ELITE_FLOORS[0] || R.pos === core.ELITE_FLOORS[1]);
    if (shopAfter) { this.renderShop(); return; }
    this.serve();
  },

  /* ---------- 道具 ---------- */
  tapItem(e) {
    const id = e.currentTarget.dataset.id;
    const R = this.R, cur = this.cur;
    if ((R.items[id] || 0) <= 0) return;
    if (id === 'potion') {
      if (R.hp >= core.MAX_HP) return;
      R.items.potion--; R.hp++;
      wx.showToast({ title: '❤ 生命 +1', icon: 'none' });
      this.refreshStatus(); return;
    }
    if (!cur || cur.answered) return;
    if (id === 'fifty') {
      R.items.fifty--;
      const wrongIdx = [0, 1, 2, 3].filter(x => x !== cur.item.ans && !cur.wrongPicks.includes(x));
      const zap = wrongIdx.slice(0, 2);
      this.setData({ opts: this.data.opts.map((o, idx) => zap.includes(idx) ? { ...o, cls: 'zapped', disabled: true } : o) });
    } else if (id === 'hint') {
      if (cur.hintOn) return;
      R.items.hint--; cur.hintOn = true;
      this.setData({ hintOn: true });
    } else if (id === 'hourglass') {
      if (cur.kind !== 'elite' || cur.timeAdded) return;
      R.items.hourglass--; cur.timeAdded = true; cur.deadline += 15000;
    }
    this.refreshStatus();
  },

  /* ---------- 补给站 ---------- */
  renderShop() {
    this.setData({
      phase: 'shop',
      floorLabel: String(this.R.pos),
      shopItems: core.ITEMS.map(it => ({ ...it, afford: this.R.coins >= it.cost }))
    });
    this.refreshFloors();
  },
  buyItem(e) {
    const id = e.currentTarget.dataset.sid;
    const it = core.ITEMS.find(x => x.id === id);
    if (!it || this.R.coins < it.cost) return;
    this.R.coins -= it.cost;
    this.R.items[id] = (this.R.items[id] || 0) + 1;
    wx.showToast({ title: '购入 ' + it.name, icon: 'none' });
    this.refreshStatus();
    this.setData({ shopItems: core.ITEMS.map(x => ({ ...x, afford: this.R.coins >= x.cost })) });
  },
  leaveShop() { this.serve(); },

  /* ---------- 结算 ---------- */
  renderResult() {
    const R = this.R;
    core.finishRun(R, this.P);
    const acc = R.asked ? Math.round(R.firstTry / R.asked * 100) : 0;
    const MOD_NAMES = {};
    core.D.items.forEach(x => { if (!MOD_NAMES[x.mod]) MOD_NAMES[x.mod] = x.modName; });
    const mods = Object.keys(R.modRun).map(m => {
      const s = R.modRun[m], t = s.right + s.wrong;
      if (!t) return null;
      const pct = Math.round(s.right / t * 100);
      return { m: MOD_NAMES[m] || m, pct, color: pct >= 75 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171' };
    }).filter(Boolean);
    const r = core.rankInfo(this.P);
    this.setData({
      phase: 'result',
      result: {
        won: R.hp > 0, score: R.score, acc,
        firstTry: R.firstTry, asked: R.asked, maxCombo: R.maxCombo,
        mods,
        rankText: r.cur[1],
        rankNextText: r.next ? ' · 距 ' + r.next[1] + ' 还差 ' + (r.next[0] - this.P.lifetime) + ' 分' : ' · 已至顶点'
      }
    });
    this.refreshFloors();
  },
  again() { this.onLoad({ tower: this.towerId }); },
  backTower() { wx.navigateBack(); },

  /* ---------- 渲染辅助 ---------- */
  refreshStatus() {
    const R = this.R;
    const usable = {};
    core.ITEMS.forEach(it => {
      const n = R.items[it.id] || 0;
      if (n <= 0) { usable[it.id] = false; return; }
      if (it.id === 'potion') usable[it.id] = R.hp < core.MAX_HP;
      else if (it.id === 'retry') usable[it.id] = false;
      else if (!this.cur || this.cur.answered || this.data.phase !== 'battle') usable[it.id] = false;
      else if (it.id === 'hint') usable[it.id] = !this.cur.hintOn;
      else if (it.id === 'hourglass') usable[it.id] = this.cur.kind === 'elite' && !this.cur.timeAdded;
      else usable[it.id] = true;
    });
    this.setData({ hp: R.hp, coins: R.coins, score: R.score, combo: R.combo, items: R.items, usable });
  },
  refreshFloors() {
    const R = this.R;
    const total = R.slots.length;
    const floors = [];
    for (let f = 1; f <= total; f++) {
      const done = R.pos >= f, now = R.pos === f - 1 && !R.done, isBoss = f === total;
      const isElite = core.ELITE_FLOORS.includes(f) && !isBoss;
      floors.push({
        f,
        icon: isBoss ? '☠' : (isElite ? '⚡' : String(f)),
        suffix: isBoss ? ' · BOSS' : (isElite ? ' · 精英' : ''),
        cls: (done ? 'done ' : '') + (now ? 'now' : '')
      });
    }
    this.setData({ floors, shadowCount: R.pendingShadow.length });
  },

  onShareAppMessage() {
    return {
      title: '我在概念试炼塔刷 AI 产品经理笔试题，来跟我比分数',
      path: '/pages/hub/hub'
    };
  }
});
