const core = require('../../utils/core.js');
Page({
  data: { rank: '' },
  onShow() {
    const P = getApp().getP();
    this.setData({ rank: core.rankInfo(P).cur[1] });
  },
  goTower() { wx.navigateTo({ url: '/pages/tower/tower' }); },
  onShareAppMessage() {
    return { title: 'AI 产品经理秋招题库 · 闯关刷题，错题重练', path: '/pages/hub/hub' };
  }
});
