var globalThis = this;
module.exports =
require("./_commons/runtime.js")([
require("./_commons/index~logs.js"),
{
"ids": ["logs"],
"modules":{

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

},
"entries": [[7,"runtime","index~logs"]]
},
]);
