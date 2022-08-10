import { ParsedDIDToken } from '../types';
interface ParseDIDTokenResult {
    raw: [string, string];
    withParsedClaim: ParsedDIDToken;
}
/**
 * Parses a DID Token so that the encoded `claim` is in object form.
 */
export declare function parseDIDToken(DIDToken: string): ParseDIDTokenResult;
export {};
