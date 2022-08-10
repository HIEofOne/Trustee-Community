import { BaseModule } from '../base-module';
import { ParsedDIDToken } from '../../types';
export declare class TokenModule extends BaseModule {
    validate(DIDToken: string, attachment?: string): void;
    decode(DIDToken: string): ParsedDIDToken;
    getPublicAddress(DIDToken: string): string;
    getIssuer(DIDToken: string): string;
}
