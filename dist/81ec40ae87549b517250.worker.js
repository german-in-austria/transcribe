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
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction isPromise (obj) {\n  // via https://unpkg.com/is-promise@2.1.0/index.js\n  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function'\n}\n\nfunction registerPromiseWorker (callback) {\n  function postOutgoingMessage (e, messageId, error, result) {\n    function postMessage (msg) {\n      /* istanbul ignore if */\n      if (typeof self.postMessage !== 'function') { // service worker\n        e.ports[0].postMessage(msg)\n      } else { // web worker\n        self.postMessage(msg)\n      }\n    }\n    if (error) {\n      /* istanbul ignore else */\n      if (typeof console !== 'undefined' && 'error' in console) {\n        // This is to make errors easier to debug. I think it's important\n        // enough to just leave here without giving the user an option\n        // to silence it.\n        console.error('Worker caught an error:', error)\n      }\n      postMessage([messageId, {\n        message: error.message\n      }])\n    } else {\n      postMessage([messageId, null, result])\n    }\n  }\n\n  function tryCatchFunc (callback, message) {\n    try {\n      return { res: callback(message) }\n    } catch (e) {\n      return { err: e }\n    }\n  }\n\n  function handleIncomingMessage (e, callback, messageId, message) {\n    var result = tryCatchFunc(callback, message)\n\n    if (result.err) {\n      postOutgoingMessage(e, messageId, result.err)\n    } else if (!isPromise(result.res)) {\n      postOutgoingMessage(e, messageId, null, result.res)\n    } else {\n      result.res.then(function (finalResult) {\n        postOutgoingMessage(e, messageId, null, finalResult)\n      }, function (finalError) {\n        postOutgoingMessage(e, messageId, finalError)\n      })\n    }\n  }\n\n  function onIncomingMessage (e) {\n    var payload = e.data\n    if (!Array.isArray(payload) || payload.length !== 2) {\n      // message doens't match communication format; ignore\n      return\n    }\n    var messageId = payload[0]\n    var message = payload[1]\n\n    if (typeof callback !== 'function') {\n      postOutgoingMessage(e, messageId, new Error(\n        'Please pass a function into register().'))\n    } else {\n      handleIncomingMessage(e, callback, messageId, message)\n    }\n  }\n\n  self.addEventListener('message', onIncomingMessage)\n}\n\nmodule.exports = registerPromiseWorker\n\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9+L3Byb21pc2Utd29ya2VyL3JlZ2lzdGVyLmpzPzU2MWQiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtREFBbUQ7QUFDbkQ7QUFDQSxPQUFPLE9BQU87QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUCxLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxjQUFjO0FBQ2QsS0FBSztBQUNMLGNBQWM7QUFDZDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0EsT0FBTztBQUNQO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0Esb0RBQW9EO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSIsImZpbGUiOiIwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbmZ1bmN0aW9uIGlzUHJvbWlzZSAob2JqKSB7XG4gIC8vIHZpYSBodHRwczovL3VucGtnLmNvbS9pcy1wcm9taXNlQDIuMS4wL2luZGV4LmpzXG4gIHJldHVybiAhIW9iaiAmJiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykgJiYgdHlwZW9mIG9iai50aGVuID09PSAnZnVuY3Rpb24nXG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyUHJvbWlzZVdvcmtlciAoY2FsbGJhY2spIHtcbiAgZnVuY3Rpb24gcG9zdE91dGdvaW5nTWVzc2FnZSAoZSwgbWVzc2FnZUlkLCBlcnJvciwgcmVzdWx0KSB7XG4gICAgZnVuY3Rpb24gcG9zdE1lc3NhZ2UgKG1zZykge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICBpZiAodHlwZW9mIHNlbGYucG9zdE1lc3NhZ2UgIT09ICdmdW5jdGlvbicpIHsgLy8gc2VydmljZSB3b3JrZXJcbiAgICAgICAgZS5wb3J0c1swXS5wb3N0TWVzc2FnZShtc2cpXG4gICAgICB9IGVsc2UgeyAvLyB3ZWIgd29ya2VyXG4gICAgICAgIHNlbGYucG9zdE1lc3NhZ2UobXNnKVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmICdlcnJvcicgaW4gY29uc29sZSkge1xuICAgICAgICAvLyBUaGlzIGlzIHRvIG1ha2UgZXJyb3JzIGVhc2llciB0byBkZWJ1Zy4gSSB0aGluayBpdCdzIGltcG9ydGFudFxuICAgICAgICAvLyBlbm91Z2ggdG8ganVzdCBsZWF2ZSBoZXJlIHdpdGhvdXQgZ2l2aW5nIHRoZSB1c2VyIGFuIG9wdGlvblxuICAgICAgICAvLyB0byBzaWxlbmNlIGl0LlxuICAgICAgICBjb25zb2xlLmVycm9yKCdXb3JrZXIgY2F1Z2h0IGFuIGVycm9yOicsIGVycm9yKVxuICAgICAgfVxuICAgICAgcG9zdE1lc3NhZ2UoW21lc3NhZ2VJZCwge1xuICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlXG4gICAgICB9XSlcbiAgICB9IGVsc2Uge1xuICAgICAgcG9zdE1lc3NhZ2UoW21lc3NhZ2VJZCwgbnVsbCwgcmVzdWx0XSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0cnlDYXRjaEZ1bmMgKGNhbGxiYWNrLCBtZXNzYWdlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB7IHJlczogY2FsbGJhY2sobWVzc2FnZSkgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiB7IGVycjogZSB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlSW5jb21pbmdNZXNzYWdlIChlLCBjYWxsYmFjaywgbWVzc2FnZUlkLCBtZXNzYWdlKSB7XG4gICAgdmFyIHJlc3VsdCA9IHRyeUNhdGNoRnVuYyhjYWxsYmFjaywgbWVzc2FnZSlcblxuICAgIGlmIChyZXN1bHQuZXJyKSB7XG4gICAgICBwb3N0T3V0Z29pbmdNZXNzYWdlKGUsIG1lc3NhZ2VJZCwgcmVzdWx0LmVycilcbiAgICB9IGVsc2UgaWYgKCFpc1Byb21pc2UocmVzdWx0LnJlcykpIHtcbiAgICAgIHBvc3RPdXRnb2luZ01lc3NhZ2UoZSwgbWVzc2FnZUlkLCBudWxsLCByZXN1bHQucmVzKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQucmVzLnRoZW4oZnVuY3Rpb24gKGZpbmFsUmVzdWx0KSB7XG4gICAgICAgIHBvc3RPdXRnb2luZ01lc3NhZ2UoZSwgbWVzc2FnZUlkLCBudWxsLCBmaW5hbFJlc3VsdClcbiAgICAgIH0sIGZ1bmN0aW9uIChmaW5hbEVycm9yKSB7XG4gICAgICAgIHBvc3RPdXRnb2luZ01lc3NhZ2UoZSwgbWVzc2FnZUlkLCBmaW5hbEVycm9yKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvbkluY29taW5nTWVzc2FnZSAoZSkge1xuICAgIHZhciBwYXlsb2FkID0gZS5kYXRhXG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHBheWxvYWQpIHx8IHBheWxvYWQubGVuZ3RoICE9PSAyKSB7XG4gICAgICAvLyBtZXNzYWdlIGRvZW5zJ3QgbWF0Y2ggY29tbXVuaWNhdGlvbiBmb3JtYXQ7IGlnbm9yZVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHZhciBtZXNzYWdlSWQgPSBwYXlsb2FkWzBdXG4gICAgdmFyIG1lc3NhZ2UgPSBwYXlsb2FkWzFdXG5cbiAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBwb3N0T3V0Z29pbmdNZXNzYWdlKGUsIG1lc3NhZ2VJZCwgbmV3IEVycm9yKFxuICAgICAgICAnUGxlYXNlIHBhc3MgYSBmdW5jdGlvbiBpbnRvIHJlZ2lzdGVyKCkuJykpXG4gICAgfSBlbHNlIHtcbiAgICAgIGhhbmRsZUluY29taW5nTWVzc2FnZShlLCBjYWxsYmFjaywgbWVzc2FnZUlkLCBtZXNzYWdlKVxuICAgIH1cbiAgfVxuXG4gIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uSW5jb21pbmdNZXNzYWdlKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyUHJvbWlzZVdvcmtlclxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3Byb21pc2Utd29ya2VyL3JlZ2lzdGVyLmpzXG4vLyBtb2R1bGUgaWQgPSAwXG4vLyBtb2R1bGUgY2h1bmtzID0gMCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///0\n");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\nvar registerPromiseWorker = __webpack_require__(0);\nconsole.log('hello');\n// Post data to parent thread\nregisterPromiseWorker(function (message) {\n    console.log(message);\n    return 'pong';\n});\n\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvc2VydmljZS93YXZlZm9ybS53b3JrZXIudHM/MjhhOSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsSUFBTSxxQkFBcUIsR0FBRyxtQkFBTyxDQUFDLENBQXlCLENBQUM7QUFDaEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDcEIsNkJBQTZCO0FBQzdCLHFCQUFxQixDQUFDLFVBQUMsT0FBWTtJQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztJQUNwQixPQUFPLE1BQU07QUFDZixDQUFDLENBQUMiLCJmaWxlIjoiMS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuY29uc3QgcmVnaXN0ZXJQcm9taXNlV29ya2VyID0gcmVxdWlyZSgncHJvbWlzZS13b3JrZXIvcmVnaXN0ZXInKVxuY29uc29sZS5sb2coJ2hlbGxvJylcbi8vIFBvc3QgZGF0YSB0byBwYXJlbnQgdGhyZWFkXG5yZWdpc3RlclByb21pc2VXb3JrZXIoKG1lc3NhZ2U6IGFueSkgPT4ge1xuICBjb25zb2xlLmxvZyhtZXNzYWdlKVxuICByZXR1cm4gJ3BvbmcnXG59KVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3NlcnZpY2Uvd2F2ZWZvcm0ud29ya2VyLnRzIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///1\n");

/***/ })
/******/ ]);