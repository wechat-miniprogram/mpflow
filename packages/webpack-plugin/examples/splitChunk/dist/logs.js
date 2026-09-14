var globalThis = this, self = this;
module.exports =
require("./_commons/runtime.js")([
require("./_commons/common-utils_util_js.js"),
 {
"ids": ["logs"],
"modules":{

/***/ 7:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = __webpack_require__(12)

/***/ }),

/***/ 12:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

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


/***/ })

},
"entries": [[7,"runtime","common-utils_util_js"]]
},
]);
