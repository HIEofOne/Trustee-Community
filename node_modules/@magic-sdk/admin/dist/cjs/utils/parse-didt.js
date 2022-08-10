"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var type_guards_1 = require("./type-guards");
var sdk_exceptions_1 = require("../core/sdk-exceptions");
/**
 * Parses a DID Token so that the encoded `claim` is in object form.
 */
function parseDIDToken(DIDToken) {
    try {
        var _a = __read(JSON.parse(globalThis.atob(DIDToken)), 2), proof = _a[0], claim = _a[1];
        var parsedClaim = JSON.parse(claim);
        if (type_guards_1.isDIDTClaim(parsedClaim))
            return { raw: [proof, claim], withParsedClaim: [proof, parsedClaim] };
        throw new Error();
    }
    catch (_b) {
        throw sdk_exceptions_1.createMalformedTokenError();
    }
}
exports.parseDIDToken = parseDIDToken;
//# sourceMappingURL=parse-didt.js.map