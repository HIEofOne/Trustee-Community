/** The shape of metadata encoded within a DID Token. */
export interface Claim {
    iat: number;
    ext: number;
    iss: string;
    sub: string;
    aud: string;
    nbf: number;
    tid: string;
    add: string;
}
export declare type ParsedDIDToken = [string, Claim];
