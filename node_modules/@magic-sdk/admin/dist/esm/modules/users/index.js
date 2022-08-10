import { BaseModule } from '../base-module';
import { createApiKeyMissingError } from '../../core/sdk-exceptions';
import { post, get } from '../../utils/rest';
import { generateIssuerFromPublicAddress } from '../../utils/issuer';
export class UsersModule extends BaseModule {
    // --- User logout endpoints
    async logoutByIssuer(issuer) {
        if (!this.sdk.secretApiKey)
            throw createApiKeyMissingError();
        const body = { issuer };
        await post(`${this.sdk.apiBaseUrl}/v2/admin/auth/user/logout`, this.sdk.secretApiKey, body);
    }
    async logoutByPublicAddress(publicAddress) {
        const issuer = generateIssuerFromPublicAddress(publicAddress);
        await this.logoutByIssuer(issuer);
    }
    async logoutByToken(DIDToken) {
        const issuer = this.sdk.token.getIssuer(DIDToken);
        await this.logoutByIssuer(issuer);
    }
    // --- User metadata endpoints
    async getMetadataByIssuer(issuer) {
        if (!this.sdk.secretApiKey)
            throw createApiKeyMissingError();
        const data = await get(`${this.sdk.apiBaseUrl}/v1/admin/auth/user/get`, this.sdk.secretApiKey, { issuer });
        return {
            issuer: data.issuer ?? null,
            publicAddress: data.public_address ?? null,
            email: data.email ?? null,
            oauthProvider: data.oauth_provider ?? null,
            phoneNumber: data.phone_number ?? null,
        };
    }
    async getMetadataByToken(DIDToken) {
        const issuer = this.sdk.token.getIssuer(DIDToken);
        return this.getMetadataByIssuer(issuer);
    }
    async getMetadataByPublicAddress(publicAddress) {
        const issuer = generateIssuerFromPublicAddress(publicAddress);
        return this.getMetadataByIssuer(issuer);
    }
}
//# sourceMappingURL=index.js.map