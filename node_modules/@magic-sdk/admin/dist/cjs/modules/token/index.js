"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
/* eslint-disable prefer-destructuring */
var base_module_1 = require("../base-module");
var sdk_exceptions_1 = require("../../core/sdk-exceptions");
var ec_recover_1 = require("../../utils/ec-recover");
var parse_didt_1 = require("../../utils/parse-didt");
var issuer_1 = require("../../utils/issuer");
var TokenModule = /** @class */ (function (_super) {
    __extends(TokenModule, _super);
    function TokenModule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TokenModule.prototype.validate = function (DIDToken, attachment) {
        var _a;
        if (attachment === void 0) { attachment = 'none'; }
        var tokenSigner = '';
        var attachmentSigner = '';
        var claimedIssuer = '';
        var parsedClaim;
        var proof;
        var claim;
        try {
            var tokenParseResult = parse_didt_1.parseDIDToken(DIDToken);
            _a = __read(tokenParseResult.raw, 2), proof = _a[0], claim = _a[1];
            parsedClaim = tokenParseResult.withParsedClaim[1];
            claimedIssuer = issuer_1.parsePublicAddressFromIssuer(parsedClaim.iss);
        }
        catch (_b) {
            throw sdk_exceptions_1.createMalformedTokenError();
        }
        try {
            // Recover the token signer
            tokenSigner = ec_recover_1.ecRecover(claim, proof).toLowerCase();
            // Recover the attachment signer
            attachmentSigner = ec_recover_1.ecRecover(attachment, parsedClaim.add).toLowerCase();
        }
        catch (_c) {
            throw sdk_exceptions_1.createFailedRecoveringProofError();
        }
        // Assert the expected signer
        if (claimedIssuer !== tokenSigner || claimedIssuer !== attachmentSigner) {
            throw sdk_exceptions_1.createIncorrectSignerAddressError();
        }
        var timeSecs = Math.floor(Date.now() / 1000);
        var nbfLeeway = 300; // 5 min grace period
        // Assert the token is not expired
        if (parsedClaim.ext < timeSecs) {
            throw sdk_exceptions_1.createTokenExpiredError();
        }
        // Assert the token is not used before allowed.
        if (parsedClaim.nbf - nbfLeeway > timeSecs) {
            throw sdk_exceptions_1.createTokenCannotBeUsedYetError();
        }
    };
    TokenModule.prototype.decode = function (DIDToken) {
        var parsedToken = parse_didt_1.parseDIDToken(DIDToken);
        return parsedToken.withParsedClaim;
    };
    TokenModule.prototype.getPublicAddress = function (DIDToken) {
        var claim = this.decode(DIDToken)[1];
        var claimedIssuer = claim.iss.split(':')[2];
        return claimedIssuer;
    };
    TokenModule.prototype.getIssuer = function (DIDToken) {
        return this.decode(DIDToken)[1].iss;
    };
    return TokenModule;
}(base_module_1.BaseModule));
exports.TokenModule = TokenModule;
//# sourceMappingURL=index.js.map