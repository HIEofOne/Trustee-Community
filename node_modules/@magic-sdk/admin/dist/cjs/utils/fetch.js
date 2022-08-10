"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* istanbul ignore next */
exports.fetch = !globalThis.fetch
    ? function (url, init) { return Promise.resolve().then(function () { return __importStar(require('node-fetch')); }).then(function (_a) {
        var f = _a.default;
        return f(url, init);
    }); }
    : globalThis.fetch;
//# sourceMappingURL=fetch.js.map