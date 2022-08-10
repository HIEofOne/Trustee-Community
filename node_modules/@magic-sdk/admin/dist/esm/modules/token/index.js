/* eslint-disable prefer-destructuring */
import { BaseModule } from '../base-module';
import { createFailedRecoveringProofError, createIncorrectSignerAddressError, createTokenExpiredError, createMalformedTokenError, createTokenCannotBeUsedYetError, } from '../../core/sdk-exceptions';
import { ecRecover } from '../../utils/ec-recover';
import { parseDIDToken } from '../../utils/parse-didt';
import { parsePublicAddressFromIssuer } from '../../utils/issuer';
export class TokenModule extends BaseModule {
    validate(DIDToken, attachment = 'none') {
        let tokenSigner = '';
        let attachmentSigner = '';
        let claimedIssuer = '';
        let parsedClaim;
        let proof;
        let claim;
        try {
            const tokenParseResult = parseDIDToken(DIDToken);
            [proof, claim] = tokenParseResult.raw;
            parsedClaim = tokenParseResult.withParsedClaim[1];
            claimedIssuer = parsePublicAddressFromIssuer(parsedClaim.iss);
        }
        catch {
            throw createMalformedTokenError();
        }
        try {
            // Recover the token signer
            tokenSigner = ecRecover(claim, proof).toLowerCase();
            // Recover the attachment signer
            attachmentSigner = ecRecover(attachment, parsedClaim.add).toLowerCase();
        }
        catch {
            throw createFailedRecoveringProofError();
        }
        // Assert the expected signer
        if (claimedIssuer !== tokenSigner || claimedIssuer !== attachmentSigner) {
            throw createIncorrectSignerAddressError();
        }
        const timeSecs = Math.floor(Date.now() / 1000);
        const nbfLeeway = 300; // 5 min grace period
        // Assert the token is not expired
        if (parsedClaim.ext < timeSecs) {
            throw createTokenExpiredError();
        }
        // Assert the token is not used before allowed.
        if (parsedClaim.nbf - nbfLeeway > timeSecs) {
            throw createTokenCannotBeUsedYetError();
        }
    }
    decode(DIDToken) {
        const parsedToken = parseDIDToken(DIDToken);
        return parsedToken.withParsedClaim;
    }
    getPublicAddress(DIDToken) {
        const claim = this.decode(DIDToken)[1];
        const claimedIssuer = claim.iss.split(':')[2];
        return claimedIssuer;
    }
    getIssuer(DIDToken) {
        return this.decode(DIDToken)[1].iss;
    }
}
//# sourceMappingURL=index.js.map