var globalThis = this, self = this;
exports.id = "utils_util_js";
exports.ids = ["utils_util_js"];
exports.modules = [
/* 0 */,
/* 1 */,
/* 2 */
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "formatNumber": function() { return /* reexport safe */ _formatNumber__WEBPACK_IMPORTED_MODULE_0__.formatNumber; },
/* harmony export */   "formatTime": function() { return /* reexport safe */ _formatTime__WEBPACK_IMPORTED_MODULE_1__.formatTime; }
/* harmony export */ });
/* harmony import */ var _formatNumber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3);
/* harmony import */ var _formatTime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4);




/***/ }),
/* 3 */
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "formatNumber": function() { return /* binding */ formatNumber; }
/* harmony export */ });
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}


/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "formatTime": function() { return /* binding */ formatTime; }
/* harmony export */ });
/* harmony import */ var _formatNumber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3);


const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(_formatNumber__WEBPACK_IMPORTED_MODULE_0__.formatNumber).join('/') + ' ' + [hour, minute, second].map(_formatNumber__WEBPACK_IMPORTED_MODULE_0__.formatNumber).join(':')
}


/***/ })
];
;