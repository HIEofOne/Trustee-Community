import { BaseModule } from '../base-module';
export declare class UtilsModule extends BaseModule {
    /**
     * Parse a raw DID Token from the given Authorization header.
     */
    parseAuthorizationHeader(header: string): string;
}
