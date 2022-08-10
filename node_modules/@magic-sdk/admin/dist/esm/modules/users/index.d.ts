import { BaseModule } from '../base-module';
import { MagicUserMetadata } from '../../types';
export declare class UsersModule extends BaseModule {
    logoutByIssuer(issuer: string): Promise<void>;
    logoutByPublicAddress(publicAddress: string): Promise<void>;
    logoutByToken(DIDToken: string): Promise<void>;
    getMetadataByIssuer(issuer: string): Promise<MagicUserMetadata>;
    getMetadataByToken(DIDToken: string): Promise<MagicUserMetadata>;
    getMetadataByPublicAddress(publicAddress: string): Promise<MagicUserMetadata>;
}
