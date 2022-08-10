"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateIssuerFromPublicAddress(publicAddress, method) {
    if (method === void 0) { method = 'ethr'; }
    return "did:" + method + ":" + publicAddress;
}
exports.generateIssuerFromPublicAddress = generateIssuerFromPublicAddress;
function parsePublicAddressFromIssuer(issuer) {
    var _a, _b;
    return (_b = (_a = issuer.split(':')[2]) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '';
}
exports.parsePublicAddressFromIssuer = parsePublicAddressFromIssuer;
//# sourceMappingURL=issuer.js.map