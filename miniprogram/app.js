const core = require('./utils/core.js');
App({
  globalData: { P: null },
  onLaunch() {
    this.globalData.P = core.loadP();
  },
  getP() { return this.globalData.P; }
});
