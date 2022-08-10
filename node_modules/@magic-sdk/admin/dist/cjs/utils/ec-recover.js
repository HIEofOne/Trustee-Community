"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var keccak_1 = require("ethereum-cryptography/keccak");
var secp256k1_compat_1 = require("ethereum-cryptography/secp256k1-compat");
var utils_1 = require("ethereum-cryptography/utils");
function hashPersonalMessage(message) {
    var prefix = utils_1.utf8ToBytes("\u0019Ethereum Signed Message:\n" + message.length);
    var totalLength = prefix.length + message.length;
    var output = new Uint8Array(totalLength);
    output.set(prefix);
    output.set(message, prefix.length);
    return keccak_1.keccak256(output);
}
function getRecoveryBit(signature) {
    var bit = signature[64];
    return bit - 27;
}
function prepareSignature(signature) {
    return signature.slice(2); // strip the `0x` prefix
}
function publicKeyToAddress(publicKey) {
    var address = keccak_1.keccak256(publicKey.slice(1)).slice(-20);
    return "0x" + utils_1.bytesToHex(address);
}
/**
 * Recover the signer from an Elliptic Curve signature.
 */
function ecRecover(data, signature) {
    // Use ecdsaRecover on the Proof, to validate if it recovers to the expected
    // Claim, and expected Signer Address.
    var msg = utils_1.utf8ToBytes(data);
    var sig = utils_1.hexToBytes(prepareSignature(signature));
    var recovery = getRecoveryBit(sig);
    var hash = hashPersonalMessage(msg);
    var publicKey = secp256k1_compat_1.ecdsaRecover(sig.slice(0, 64), recovery, hash, false);
    var assertPublicKey = secp256k1_compat_1.publicKeyConvert(publicKey, false);
    return publicKeyToAddress(assertPublicKey);
}
exports.ecRecover = ecRecover;
//# sourceMappingURL=ec-recover.js.map