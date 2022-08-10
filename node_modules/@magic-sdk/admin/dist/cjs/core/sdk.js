"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../utils/shim");
var token_1 = require("../modules/token");
var users_1 = require("../modules/users");
var utils_1 = require("../modules/utils");
var MagicAdminSDK = /** @class */ (function () {
    function MagicAdminSDK(secretApiKey, options) {
        var _a;
        this.secretApiKey = secretApiKey;
        var endpoint = (_a = options === null || options === void 0 ? void 0 : options.endpoint) !== null && _a !== void 0 ? _a : 'https://api.magic.link';
        this.apiBaseUrl = endpoint.replace(/\/+$/, '');
        // Assign API Modules
        this.token = new token_1.TokenModule(this);
        this.users = new users_1.UsersModule(this);
        this.utils = new utils_1.UtilsModule(this);
    }
    return MagicAdminSDK;
}());
exports.MagicAdminSDK = MagicAdminSDK;
//# sourceMappingURL=sdk.js.map