import { isDIDTClaim } from './type-guards';
import { createMalformedTokenError } from '../core/sdk-exceptions';
/**
 * Parses a DID Token so that the encoded `claim` is in object form.
 */
export function parseDIDToken(DIDToken) {
    try {
        const [proof, claim] = JSON.parse(globalThis.atob(DIDToken));
        const parsedClaim = JSON.parse(claim);
        if (isDIDTClaim(parsedClaim))
            return { raw: [proof, claim], withParsedClaim: [proof, parsedClaim] };
        throw new Error();
    }
    catch {
        throw createMalformedTokenError();
    }
}
//# sourceMappingURL=parse-didt.js.map