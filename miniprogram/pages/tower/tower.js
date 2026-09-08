const core = require('../../utils/core.js');
Page({
  data: { groups: [], weak: null },
  onShow() {
    const P = getApp().getP();
    const groups = [
      { key: 'basic', label: '基础专项塔', en: 'FOUNDATION' },
      { key: 'company', label: '大厂实战塔', en: 'COMPANY' }
    ].map(g => ({
      key: g.key, label: g.label, en: g.en,
      towers: core.TOWERS.filter(t => (t.group || 'basic') === g.key).map(t => ({
        id: t.id, name: t.name, desc: t.desc, price: t.price || 0,
        locked: core.towerLocked(t, P),
        n: core.poolOf(t).length,
        best: P.best[t.id] || 0
      }))
    }));
    this.setData({ groups, weak: core.weakTip(P) });
  },
  pick(e) {
    const id = e.currentTarget.dataset.id;
    const t = core.TOWERS.find(x => x.id === id);
    const P = getApp().getP();
    if (core.towerLocked(t, P)) { this.askCode(t); return; }
    wx.navigateTo({ url: '/pages/battle/battle?tower=' + id });
  },
  askCode(t) {
    const that = this;
    wx.showModal({
      title: '🏢 ' + t.name,
      content: t.desc + ' · ' + core.poolOf(t).length + ' 题（含压轴 Boss）\n解锁价 ¥' + t.price + ' · 一次解锁永久有效\n\n（原创模拟题 · 非官方真题）\n\n请输入兑换码（NOVA-XXXXXX）：',
      editable: true,
      placeholderText: 'NOVA-XXXXXX',
      confirmText: '解锁',
      cancelText: '取消',
      success(res) {
        if (!res.confirm) return;
        const codeStr = String(res.content || '').trim().toUpperCase();
        if (core.checkCode(t.id, codeStr) && core.unlockPaid(t.id, codeStr)) {
          const app = getApp();
          app.globalData.P.paid[t.id] = 1;
          core.saveP(app.globalData.P);
          wx.showToast({ title: '🔓 已解锁', icon: 'success' });
          that.onShow();
        } else {
          wx.showToast({ title: '兑换码无效', icon: 'none' });
          setTimeout(() => that.askCode(t), 1200);
        }
      }
    });
  },
  onShareAppMessage() {
    return { title: 'AI 产品经理秋招题库游戏 · 爬塔背题，暗影复仇', path: '/pages/hub/hub' };
  }
});
