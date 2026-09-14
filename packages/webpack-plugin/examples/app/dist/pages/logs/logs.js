var globalThis = this, self = this;
module.exports =

/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 40:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = __webpack_require__(45)

/***/ }),

/***/ 45:
/***/ (function(__unused_webpack_module, __unused_webpack_exports, __webpack_require__) {

//logs.js
const util = __webpack_require__(46)

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

/***/ 46:
/***/ (function(module) {

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

module.exports = {
  formatTime: formatTime,
}


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
/******/ 		var installedChunks = {"pages/logs/logs":0};
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
/******/ 	var __webpack_exports__ = __webpack_require__(40);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()