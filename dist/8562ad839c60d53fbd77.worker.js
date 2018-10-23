/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/dist/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\r\n\r\nvar isPromise = __webpack_require__(1);\r\n\r\nfunction registerPromiseWorker(callback) {\r\n\r\n  function postOutgoingMessage(e, messageId, error, result) {\r\n    function postMessage(msg, transferList) {\r\n      /* istanbul ignore if */\r\n      if (typeof self.postMessage !== 'function') { // service worker\r\n        e.ports[0].postMessage(msg, transferList);\r\n      } else { // web worker\r\n        self.postMessage(msg, transferList);\r\n      }\r\n    }\r\n    if (error) {\r\n      /* istanbul ignore else */\r\n      if (typeof console !== 'undefined' && 'error' in console) {\r\n        // This is to make errors easier to debug. I think it's important\r\n        // enough to just leave here without giving the user an option\r\n        // to silence it.\r\n        console.error('Worker caught an error:', error);\r\n      }\r\n      postMessage([messageId, {\r\n        message: error.message\r\n      }]);\r\n    } else {\r\n      if (result instanceof MessageWithTransferList) {\r\n        postMessage([messageId, null, result.message], result.transferList);\r\n      } else {\r\n        postMessage([messageId, null, result]);\r\n      }\r\n    }\r\n  }\r\n\r\n  function tryCatchFunc(callback, message) {\r\n    try {\r\n      return {res: callback(message, withTransferList)};\r\n    } catch (e) {\r\n      return {err: e};\r\n    }\r\n  }\r\n\r\n  function withTransferList(resMessage, transferList) {\r\n    return new MessageWithTransferList(resMessage, transferList);\r\n  } \r\n\r\n  function handleIncomingMessage(e, callback, messageId, message) {\r\n\r\n    var result = tryCatchFunc(callback, message);\r\n\r\n    if (result.err) {\r\n      postOutgoingMessage(e, messageId, result.err);\r\n    } else if (!isPromise(result.res)) {\r\n        postOutgoingMessage(e, messageId, null, result.res);\r\n    } else {\r\n      result.res.then(function (finalResult) {\r\n        postOutgoingMessage(e, messageId, null, finalResult);\r\n      }, function (finalError) {\r\n        postOutgoingMessage(e, messageId, finalError);\r\n      });\r\n    }\r\n  }\r\n\r\n  function onIncomingMessage(e) {\r\n    var payload = e.data;\r\n    if (!Array.isArray(payload) || payload.length !== 2) {\r\n      // message doens't match communication format; ignore\r\n      return;\r\n    }\r\n    var messageId = payload[0];\r\n    var message = payload[1];\r\n\r\n    if (typeof callback !== 'function') {\r\n      postOutgoingMessage(e, messageId, new Error(\r\n        'Please pass a function into register().'));\r\n    } else {\r\n      handleIncomingMessage(e, callback, messageId, message);\r\n    }\r\n  }\r\n\r\n  function MessageWithTransferList(message, transferList) {\r\n    this.message = message;\r\n    this.transferList = transferList;\r\n  }\r\n\r\n  self.addEventListener('message', onIncomingMessage);\r\n}\r\n\r\nmodule.exports = registerPromiseWorker;\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9+L3Byb21pc2Utd29ya2VyLXRyYW5zZmVyYWJsZS9yZWdpc3Rlci5qcz8yN2RjIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1EQUFtRDtBQUNuRDtBQUNBLE9BQU8sT0FBTztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQLEtBQUs7QUFDTDtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxjQUFjO0FBQ2QsS0FBSztBQUNMLGNBQWM7QUFDZDtBQUNBOztBQUVBO0FBQ0E7QUFDQSxHOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBLE9BQU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG9EQUFvRDtBQUNwRDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEiLCJmaWxlIjoiMC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBpc1Byb21pc2UgPSByZXF1aXJlKCdpcy1wcm9taXNlJyk7XHJcblxyXG5mdW5jdGlvbiByZWdpc3RlclByb21pc2VXb3JrZXIoY2FsbGJhY2spIHtcclxuXHJcbiAgZnVuY3Rpb24gcG9zdE91dGdvaW5nTWVzc2FnZShlLCBtZXNzYWdlSWQsIGVycm9yLCByZXN1bHQpIHtcclxuICAgIGZ1bmN0aW9uIHBvc3RNZXNzYWdlKG1zZywgdHJhbnNmZXJMaXN0KSB7XHJcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqL1xyXG4gICAgICBpZiAodHlwZW9mIHNlbGYucG9zdE1lc3NhZ2UgIT09ICdmdW5jdGlvbicpIHsgLy8gc2VydmljZSB3b3JrZXJcclxuICAgICAgICBlLnBvcnRzWzBdLnBvc3RNZXNzYWdlKG1zZywgdHJhbnNmZXJMaXN0KTtcclxuICAgICAgfSBlbHNlIHsgLy8gd2ViIHdvcmtlclxyXG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UobXNnLCB0cmFuc2Zlckxpc3QpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cclxuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiAnZXJyb3InIGluIGNvbnNvbGUpIHtcclxuICAgICAgICAvLyBUaGlzIGlzIHRvIG1ha2UgZXJyb3JzIGVhc2llciB0byBkZWJ1Zy4gSSB0aGluayBpdCdzIGltcG9ydGFudFxyXG4gICAgICAgIC8vIGVub3VnaCB0byBqdXN0IGxlYXZlIGhlcmUgd2l0aG91dCBnaXZpbmcgdGhlIHVzZXIgYW4gb3B0aW9uXHJcbiAgICAgICAgLy8gdG8gc2lsZW5jZSBpdC5cclxuICAgICAgICBjb25zb2xlLmVycm9yKCdXb3JrZXIgY2F1Z2h0IGFuIGVycm9yOicsIGVycm9yKTtcclxuICAgICAgfVxyXG4gICAgICBwb3N0TWVzc2FnZShbbWVzc2FnZUlkLCB7XHJcbiAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxyXG4gICAgICB9XSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAocmVzdWx0IGluc3RhbmNlb2YgTWVzc2FnZVdpdGhUcmFuc2Zlckxpc3QpIHtcclxuICAgICAgICBwb3N0TWVzc2FnZShbbWVzc2FnZUlkLCBudWxsLCByZXN1bHQubWVzc2FnZV0sIHJlc3VsdC50cmFuc2Zlckxpc3QpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHBvc3RNZXNzYWdlKFttZXNzYWdlSWQsIG51bGwsIHJlc3VsdF0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB0cnlDYXRjaEZ1bmMoY2FsbGJhY2ssIG1lc3NhZ2UpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHJldHVybiB7cmVzOiBjYWxsYmFjayhtZXNzYWdlLCB3aXRoVHJhbnNmZXJMaXN0KX07XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIHJldHVybiB7ZXJyOiBlfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHdpdGhUcmFuc2Zlckxpc3QocmVzTWVzc2FnZSwgdHJhbnNmZXJMaXN0KSB7XHJcbiAgICByZXR1cm4gbmV3IE1lc3NhZ2VXaXRoVHJhbnNmZXJMaXN0KHJlc01lc3NhZ2UsIHRyYW5zZmVyTGlzdCk7XHJcbiAgfSBcclxuXHJcbiAgZnVuY3Rpb24gaGFuZGxlSW5jb21pbmdNZXNzYWdlKGUsIGNhbGxiYWNrLCBtZXNzYWdlSWQsIG1lc3NhZ2UpIHtcclxuXHJcbiAgICB2YXIgcmVzdWx0ID0gdHJ5Q2F0Y2hGdW5jKGNhbGxiYWNrLCBtZXNzYWdlKTtcclxuXHJcbiAgICBpZiAocmVzdWx0LmVycikge1xyXG4gICAgICBwb3N0T3V0Z29pbmdNZXNzYWdlKGUsIG1lc3NhZ2VJZCwgcmVzdWx0LmVycik7XHJcbiAgICB9IGVsc2UgaWYgKCFpc1Byb21pc2UocmVzdWx0LnJlcykpIHtcclxuICAgICAgICBwb3N0T3V0Z29pbmdNZXNzYWdlKGUsIG1lc3NhZ2VJZCwgbnVsbCwgcmVzdWx0LnJlcyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXN1bHQucmVzLnRoZW4oZnVuY3Rpb24gKGZpbmFsUmVzdWx0KSB7XHJcbiAgICAgICAgcG9zdE91dGdvaW5nTWVzc2FnZShlLCBtZXNzYWdlSWQsIG51bGwsIGZpbmFsUmVzdWx0KTtcclxuICAgICAgfSwgZnVuY3Rpb24gKGZpbmFsRXJyb3IpIHtcclxuICAgICAgICBwb3N0T3V0Z29pbmdNZXNzYWdlKGUsIG1lc3NhZ2VJZCwgZmluYWxFcnJvcik7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gb25JbmNvbWluZ01lc3NhZ2UoZSkge1xyXG4gICAgdmFyIHBheWxvYWQgPSBlLmRhdGE7XHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocGF5bG9hZCkgfHwgcGF5bG9hZC5sZW5ndGggIT09IDIpIHtcclxuICAgICAgLy8gbWVzc2FnZSBkb2Vucyd0IG1hdGNoIGNvbW11bmljYXRpb24gZm9ybWF0OyBpZ25vcmVcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIG1lc3NhZ2VJZCA9IHBheWxvYWRbMF07XHJcbiAgICB2YXIgbWVzc2FnZSA9IHBheWxvYWRbMV07XHJcblxyXG4gICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBwb3N0T3V0Z29pbmdNZXNzYWdlKGUsIG1lc3NhZ2VJZCwgbmV3IEVycm9yKFxyXG4gICAgICAgICdQbGVhc2UgcGFzcyBhIGZ1bmN0aW9uIGludG8gcmVnaXN0ZXIoKS4nKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoYW5kbGVJbmNvbWluZ01lc3NhZ2UoZSwgY2FsbGJhY2ssIG1lc3NhZ2VJZCwgbWVzc2FnZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBNZXNzYWdlV2l0aFRyYW5zZmVyTGlzdChtZXNzYWdlLCB0cmFuc2Zlckxpc3QpIHtcclxuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XHJcbiAgICB0aGlzLnRyYW5zZmVyTGlzdCA9IHRyYW5zZmVyTGlzdDtcclxuICB9XHJcblxyXG4gIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uSW5jb21pbmdNZXNzYWdlKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZWdpc3RlclByb21pc2VXb3JrZXI7XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3Byb21pc2Utd29ya2VyLXRyYW5zZmVyYWJsZS9yZWdpc3Rlci5qc1xuLy8gbW9kdWxlIGlkID0gMFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///0\n");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

eval("module.exports = isPromise;\n\nfunction isPromise(obj) {\n  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';\n}\n\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9+L2lzLXByb21pc2UvaW5kZXguanM/ZDZiZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQTtBQUNBO0FBQ0EiLCJmaWxlIjoiMS5qcyIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gaXNQcm9taXNlO1xuXG5mdW5jdGlvbiBpc1Byb21pc2Uob2JqKSB7XG4gIHJldHVybiAhIW9iaiAmJiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykgJiYgdHlwZW9mIG9iai50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L2lzLXByb21pc2UvaW5kZXguanNcbi8vIG1vZHVsZSBpZCA9IDFcbi8vIG1vZHVsZSBjaHVua3MgPSAwIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///1\n");

/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("Object.defineProperty(__webpack_exports__, \"__esModule\", { value: true });\nvar registerPromiseWorker = __webpack_require__(0);\n// Post data to parent thread\nregisterPromiseWorker(function (_a) {\n    var buffer = _a[0], options = _a[1];\n    var upperHalf = '';\n    var lowerHalf = '';\n    var opts = JSON.parse(options);\n    var chanData = new Float32Array(buffer);\n    var step = Math.ceil(chanData.length / opts.width);\n    var amp = opts.height / 2;\n    console.time('draw wave async');\n    for (var i = 0; i < opts.width; i++) {\n        var min = 1.0;\n        var max = -1.0;\n        for (var j = 0; j < step; j++) {\n            var datum = chanData[(i * step) + j];\n            if (datum < min) {\n                min = datum;\n            }\n            if (datum > max) {\n                max = datum;\n            }\n        }\n        upperHalf = upperHalf + ((i === 0 ? 'M' : 'L') + \" \" + (i + opts.offsetLeft) + \" \" + (1 + min) * amp + \" \");\n        lowerHalf = \"L \" + (i + opts.offsetLeft) + \" \" + (Math.max(1, (max - min) * amp) + ((1 + min) * amp)) + \" \" + lowerHalf;\n    }\n    console.timeEnd('draw wave async');\n    return upperHalf + lowerHalf + 'Z';\n});\n/* harmony default export */ __webpack_exports__[\"default\"] = (null);\n\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvc2VydmljZS93YXZlZm9ybS53b3JrZXIudHM/MjhhOSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtBQUFBLElBQU0scUJBQXFCLEdBQUcsbUJBQU8sQ0FBQyxDQUFzQyxDQUFDO0FBQzdFLDZCQUE2QjtBQUM3QixxQkFBcUIsQ0FBQyxVQUFDLEVBQTBDO1FBQXpDLGNBQU0sRUFBRSxlQUFPO0lBQ3JDLElBQUksU0FBUyxHQUFHLEVBQUU7SUFDbEIsSUFBSSxTQUFTLEdBQUcsRUFBRTtJQUNsQixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztJQUNoQyxJQUFNLFFBQVEsR0FBRyxJQUFJLFlBQVksQ0FBQyxNQUFNLENBQUM7SUFDekMsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUU7SUFDdEQsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDO0lBQzNCLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7SUFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDbkMsSUFBSSxHQUFHLEdBQUcsR0FBRztRQUNiLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRztRQUNkLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDN0IsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0QyxJQUFJLEtBQUssR0FBRyxHQUFHLEVBQUU7Z0JBQ2YsR0FBRyxHQUFHLEtBQUs7YUFDWjtZQUNELElBQUksS0FBSyxHQUFHLEdBQUcsRUFBRTtnQkFDZixHQUFHLEdBQUcsS0FBSzthQUNaO1NBQ0Y7UUFDRCxTQUFTLEdBQUcsU0FBUyxJQUFHLENBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLFdBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLFVBQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxNQUFJO1FBQ2pHLFNBQVMsR0FBRyxRQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxXQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLE9BQUksR0FBRyxTQUFTO0tBQzlHO0lBQ0QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztJQUNsQyxPQUFPLFNBQVMsR0FBRyxTQUFTLEdBQUcsR0FBRztBQUNwQyxDQUFDLENBQUM7QUFDRiwrREFBZSxJQUFXIiwiZmlsZSI6IjIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmNvbnN0IHJlZ2lzdGVyUHJvbWlzZVdvcmtlciA9IHJlcXVpcmUoJ3Byb21pc2Utd29ya2VyLXRyYW5zZmVyYWJsZS9yZWdpc3RlcicpXG4vLyBQb3N0IGRhdGEgdG8gcGFyZW50IHRocmVhZFxucmVnaXN0ZXJQcm9taXNlV29ya2VyKChbYnVmZmVyLCBvcHRpb25zXTogWyBBcnJheUJ1ZmZlciwgc3RyaW5nIF0pID0+IHtcbiAgbGV0IHVwcGVySGFsZiA9ICcnXG4gIGxldCBsb3dlckhhbGYgPSAnJ1xuICBjb25zdCBvcHRzID0gSlNPTi5wYXJzZShvcHRpb25zKVxuICBjb25zdCBjaGFuRGF0YSA9IG5ldyBGbG9hdDMyQXJyYXkoYnVmZmVyKVxuICBjb25zdCBzdGVwID0gTWF0aC5jZWlsKCBjaGFuRGF0YS5sZW5ndGggLyBvcHRzLndpZHRoIClcbiAgY29uc3QgYW1wID0gb3B0cy5oZWlnaHQgLyAyXG4gIGNvbnNvbGUudGltZSgnZHJhdyB3YXZlIGFzeW5jJylcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcHRzLndpZHRoOyBpKyspIHtcbiAgICBsZXQgbWluID0gMS4wXG4gICAgbGV0IG1heCA9IC0xLjBcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IHN0ZXA7IGorKykge1xuICAgICAgY29uc3QgZGF0dW0gPSBjaGFuRGF0YVsoaSAqIHN0ZXApICsgal1cbiAgICAgIGlmIChkYXR1bSA8IG1pbikge1xuICAgICAgICBtaW4gPSBkYXR1bVxuICAgICAgfVxuICAgICAgaWYgKGRhdHVtID4gbWF4KSB7XG4gICAgICAgIG1heCA9IGRhdHVtXG4gICAgICB9XG4gICAgfVxuICAgIHVwcGVySGFsZiA9IHVwcGVySGFsZiArIGAkeyBpID09PSAwID8gJ00nIDogJ0wnIH0gJHsgaSArIG9wdHMub2Zmc2V0TGVmdCB9ICR7ICgxICsgbWluKSAqIGFtcCB9IGBcbiAgICBsb3dlckhhbGYgPSBgTCAkeyBpICsgb3B0cy5vZmZzZXRMZWZ0IH0gJHsgTWF0aC5tYXgoMSwgKG1heCAtIG1pbikgKiBhbXApICsgKCgxICsgbWluKSAqIGFtcCkgfSBgICsgbG93ZXJIYWxmXG4gIH1cbiAgY29uc29sZS50aW1lRW5kKCdkcmF3IHdhdmUgYXN5bmMnKVxuICByZXR1cm4gdXBwZXJIYWxmICsgbG93ZXJIYWxmICsgJ1onXG59KVxuZXhwb3J0IGRlZmF1bHQgbnVsbCBhcyBhbnlcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9zZXJ2aWNlL3dhdmVmb3JtLndvcmtlci50cyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///2\n");

/***/ })
/******/ ]);