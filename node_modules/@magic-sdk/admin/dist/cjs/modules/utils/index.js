"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var base_module_1 = require("../base-module");
var sdk_exceptions_1 = require("../../core/sdk-exceptions");
var UtilsModule = /** @class */ (function (_super) {
    __extends(UtilsModule, _super);
    function UtilsModule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Parse a raw DID Token from the given Authorization header.
     */
    UtilsModule.prototype.parseAuthorizationHeader = function (header) {
        if (!header.toLowerCase().startsWith('bearer ')) {
            throw sdk_exceptions_1.createExpectedBearerStringError();
        }
        return header.substring(7);
    };
    return UtilsModule;
}(base_module_1.BaseModule));
exports.UtilsModule = UtilsModule;
//# sourceMappingURL=index.js.map