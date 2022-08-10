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
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("../types");
// --- Base SDK error class
var MagicAdminSDKError = /** @class */ (function (_super) {
    __extends(MagicAdminSDKError, _super);
    function MagicAdminSDKError(code, message, data) {
        if (data === void 0) { data = []; }
        var _this = _super.call(this, "Magic Admin SDK Error: [" + code + "] " + message) || this;
        _this.code = code;
        _this.data = data;
        _this.__proto__ = Error;
        Object.setPrototypeOf(_this, MagicAdminSDKError.prototype);
        return _this;
    }
    return MagicAdminSDKError;
}(Error));
exports.MagicAdminSDKError = MagicAdminSDKError;
// --- SDK error factories
function createTokenExpiredError() {
    return new MagicAdminSDKError(types_1.ErrorCode.TokenExpired, 'DID Token has expired. Request failed authentication.');
}
exports.createTokenExpiredError = createTokenExpiredError;
function createTokenCannotBeUsedYetError() {
    return new MagicAdminSDKError(types_1.ErrorCode.TokenCannotBeUsedYet, 'Given DID Token cannot be used at this time. Please check the `nbf` field and regenerate a new token with a suitable value.');
}
exports.createTokenCannotBeUsedYetError = createTokenCannotBeUsedYetError;
function createIncorrectSignerAddressError() {
    return new MagicAdminSDKError(types_1.ErrorCode.IncorrectSignerAddress, 'Incorrect signer address for DID Token. Request failed authentication.');
}
exports.createIncorrectSignerAddressError = createIncorrectSignerAddressError;
function createFailedRecoveringProofError() {
    return new MagicAdminSDKError(types_1.ErrorCode.FailedRecoveryProof, 'Failed to recover proof. Request failed authentication.');
}
exports.createFailedRecoveringProofError = createFailedRecoveringProofError;
function createApiKeyMissingError() {
    return new MagicAdminSDKError(types_1.ErrorCode.ApiKeyMissing, 'Please provide a secret Fortmatic API key that you acquired from the developer dashboard.');
}
exports.createApiKeyMissingError = createApiKeyMissingError;
function createMalformedTokenError() {
    return new MagicAdminSDKError(types_1.ErrorCode.MalformedTokenError, 'The DID token is malformed or failed to parse.');
}
exports.createMalformedTokenError = createMalformedTokenError;
function createServiceError() {
    var nestedErrors = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        nestedErrors[_i] = arguments[_i];
    }
    return new MagicAdminSDKError(types_1.ErrorCode.ServiceError, 'A service error occurred while communicating with the Magic API. Check the `data` key of this error object to see nested errors with additional context.', nestedErrors);
}
exports.createServiceError = createServiceError;
function createExpectedBearerStringError() {
    return new MagicAdminSDKError(types_1.ErrorCode.ExpectedBearerString, 'Expected argument to be a string in the `Bearer {token}` format.');
}
exports.createExpectedBearerStringError = createExpectedBearerStringError;
//# sourceMappingURL=sdk-exceptions.js.map