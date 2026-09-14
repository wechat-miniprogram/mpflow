var globalThis = this, self = this;
module.exports =

/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 0:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = __webpack_require__(10)

/***/ }),

/***/ 10:
/***/ (function() {

//app.js
App({
  onLaunch() {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // import('./b').then(({ b }) => {
        //   console.log(b)
        // })
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      },
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            },
          })
        }
      },
    })
  },
  globalData: {
    userInfo: null,
  },
})


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); };
/******/ 	
/******/ 	/* webpack/runtime/miniprogram chunk loading */
/******/ 	!function() {
/******/ 		var installedChunks = {"app":0};
/******/ 		var deferredModules = [];
/******/ 		__webpack_require__.mpflow = function(loadModules) {
/******/ 			var result;
/******/ 			for(var i = 0; i < loadModules.length; i++) {
/******/ 				var chunk = loadModules[i], moreModules = chunk.modules, chunkIds = chunk.ids;
/******/ 				for(var moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) __webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 				if(chunk.runtime) chunk.runtime(__webpack_require__);
/******/ 				for(var j = 0; j < chunkIds.length; j++) installedChunks[chunkIds[j]] = 0;
/******/ 				deferredModules.push.apply(deferredModules, chunk.entries || []);
/******/ 			}
/******/ 			for(var k = 0; k < deferredModules.length; k++) {
/******/ 				var deferredModule = deferredModules[k], fulfilled = true;
/******/ 				for(var j = 1; j < deferredModule.length; j++) {
/******/ 					if(installedChunks[deferredModule[j]] !== 0) fulfilled = false;
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferredModules.splice(k--, 1);
/******/ 					result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 				}
/******/ 			}
/******/ 		
/******/ 			return result;
/******/ 		};
/******/ 		
/******/ 	
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module factories are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()