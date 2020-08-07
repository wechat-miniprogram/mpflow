exports.ids = ["logs"];
exports.modules = {

/***/ 12:
/***/ (function(module, exports, __webpack_require__) {

//logs.js
const util = __webpack_require__(6)

Page({
  data: {
    logs: [],
  },
  onLoad: function () {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(log => {
        return util.formatTime(new Date(log))
      }),
    })
  },
})


/***/ }),

/***/ 7:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(12)

/***/ })

};
exports.entries = [[7,"runtime","index~logs"]];
;