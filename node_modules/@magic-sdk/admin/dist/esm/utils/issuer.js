export function generateIssuerFromPublicAddress(publicAddress, method = 'ethr') {
    return `did:${method}:${publicAddress}`;
}
export function parsePublicAddressFromIssuer(issuer) {
    return issuer.split(':')[2]?.toLowerCase() ?? '';
}
//# sourceMappingURL=issuer.js.map