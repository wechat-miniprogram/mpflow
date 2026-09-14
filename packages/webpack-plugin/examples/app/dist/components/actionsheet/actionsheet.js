var globalThis = this, self = this;
module.exports =

/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 31:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = __webpack_require__(39)

/***/ }),

/***/ 39:
/***/ (function() {

Component({
  options: {
    multipleSlots: true, // 在组件定义时的选项中启用多slot支持
    addGlobalClass: true,
  },
  properties: {
    title: {
      // 标题
      type: String,
      value: '',
    },
    showCancel: {
      // 是否显示取消按钮
      type: Boolean,
      value: true,
    },
    cancelText: {
      // 取消按钮文案
      type: String,
      value: '取消',
    },
    maskClass: {
      // 遮罩层class
      type: String,
      value: '',
    },
    extClass: {
      // 弹出窗 class
      type: String,
      value: '',
    },
    maskClosable: {
      // 点击遮罩 关闭 actionsheet
      type: Boolean,
      value: true,
    },
    mask: {
      // 是否需要 遮罩层
      type: Boolean,
      value: true,
    },
    show: {
      // 是否开启 actionsheet
      type: Boolean,
      value: false,
    },
    actions: {
      // actions 列表
      type: Array,
      value: [], // {text, extClass}
      observer: '_groupChange',
    },
  },

  methods: {
    _groupChange(e) {
      // 支持 一维数组 写法
      if (e.length > 0 && typeof e[0] !== 'string' && !(e[0] instanceof Array)) {
        this.setData({
          actions: [this.data.actions],
        })
      }
    },
    buttonTap(e) {
      const { value, groupindex, index } = e.currentTarget.dataset
      this.triggerEvent('actiontap', { value, groupindex, index })
    },
    closeActionSheet(e) {
      const { type } = e.currentTarget.dataset
      if (this.data.maskClosable || type) {
        // 点击 action 里面的 取消
        this.setData({
          show: false,
        })
        // 关闭回调事件
        this.triggerEvent('close')
      }
    },
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
/******/ 		var installedChunks = {"components/actionsheet/actionsheet":0};
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
/******/ 	var __webpack_exports__ = __webpack_require__(31);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()