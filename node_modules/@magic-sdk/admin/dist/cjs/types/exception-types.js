"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["MissingAuthHeader"] = "ERROR_MISSING_AUTH_HEADER";
    ErrorCode["TokenExpired"] = "ERROR_DIDT_EXPIRED";
    ErrorCode["TokenCannotBeUsedYet"] = "ERROR_DIDT_CANNOT_BE_USED_YET";
    ErrorCode["IncorrectSignerAddress"] = "ERROR_INCORRECT_SIGNER_ADDR";
    ErrorCode["FailedRecoveryProof"] = "ERROR_FAILED_RECOVERING_PROOF";
    ErrorCode["ApiKeyMissing"] = "ERROR_SECRET_API_KEY_MISSING";
    ErrorCode["MalformedTokenError"] = "ERROR_MALFORMED_TOKEN";
    ErrorCode["ServiceError"] = "SERVICE_ERROR";
    ErrorCode["ExpectedBearerString"] = "EXPECTED_BEARER_STRING";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
//# sourceMappingURL=exception-types.js.map