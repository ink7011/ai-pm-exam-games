const core = require('../../utils/core.js');
Page({
  data: { rank: '' },
  onShow() {
    const P = getApp().getP();
    this.setData({ rank: core.rankInfo(P).cur[1] });
  },
  goTower() { wx.navigateTo({ url: '/pages/tower/tower' }); },
  onShareAppMessage() {
    return { title: 'AI 产品经理秋招题库游戏 · 爬塔背题，暗影复仇', path: '/pages/hub/hub' };
  }
});
