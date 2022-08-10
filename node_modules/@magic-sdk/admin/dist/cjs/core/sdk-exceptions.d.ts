import { ErrorCode } from '../types';
export declare class MagicAdminSDKError extends Error {
    code: ErrorCode;
    data: any[];
    __proto__: ErrorConstructor;
    constructor(code: ErrorCode, message: string, data?: any[]);
}
export declare function createTokenExpiredError(): MagicAdminSDKError;
export declare function createTokenCannotBeUsedYetError(): MagicAdminSDKError;
export declare function createIncorrectSignerAddressError(): MagicAdminSDKError;
export declare function createFailedRecoveringProofError(): MagicAdminSDKError;
export declare function createApiKeyMissingError(): MagicAdminSDKError;
export declare function createMalformedTokenError(): MagicAdminSDKError;
export declare function createServiceError(...nestedErrors: any[]): MagicAdminSDKError;
export declare function createExpectedBearerStringError(): MagicAdminSDKError;
