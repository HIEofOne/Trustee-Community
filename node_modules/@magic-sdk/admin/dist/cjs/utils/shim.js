"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var atob_1 = __importDefault(require("atob"));
// Shims for atob being undefined in node.js prior version 14
if (!globalThis.atob)
    globalThis.atob = atob_1.default;
//# sourceMappingURL=shim.js.map