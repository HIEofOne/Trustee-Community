import '../utils/shim';
import { TokenModule } from '../modules/token';
import { UsersModule } from '../modules/users';
import { UtilsModule } from '../modules/utils';
export class MagicAdminSDK {
    constructor(secretApiKey, options) {
        this.secretApiKey = secretApiKey;
        const endpoint = options?.endpoint ?? 'https://api.magic.link';
        this.apiBaseUrl = endpoint.replace(/\/+$/, '');
        // Assign API Modules
        this.token = new TokenModule(this);
        this.users = new UsersModule(this);
        this.utils = new UtilsModule(this);
    }
}
//# sourceMappingURL=sdk.js.map