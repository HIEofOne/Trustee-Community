import * as jose from 'jose';
import { createVerifier, httpbis } from 'http-message-signatures';
import objectPath from 'object-path';

const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);

async function verifySig(req: any) {
  if (objectPath.has(req, 'body.client.key.jwk')) {
    const tail = req.url;
    let port = ''
    if (url.port !== '') {
      port = ':' + url.port
    }
    objectPath.set(req, 'url', url.protocol + "//" + url.hostname + port + tail);
    const key_jose = await jose.importJWK(req.body.client.key.jwk, req.body.client.key.jwk.alg);
    const keys = new Map();
    const algs = []
    if (req.body.client.key.jwk.alg === 'RS256') {
      algs.push('rsa-v1_5-sha256')
    }
    if (req.body.client.key.jwk.alg === 'HS256') {
      algs.push('hmac-sha256')
    }
    if (req.body.client.key.jwk.alg === 'PS512') {
      algs.push('rsa-pss-sha512')
    }
    if (req.body.client.key.jwk.alg === 'ES256') {
      algs.push('ecdsa-p256-sha256-sha256')
    }
    if (req.body.client.key.jwk.alg === 'ES384') {
      algs.push('ecdsa-p384-sha384')
    }
    keys.set(req.body.client.key.jwk.kid, {
        id: req.body.client.key.jwk.kid,
        algs,
        verify: createVerifier(key_jose as Uint8Array, algs[0]),
    });
    const verified = await httpbis.verifyMessage({
      async keyLookup() {
        return keys.get(req.body.client.key.jwk.kid);
      },
    }, req);
    return verified;
  } else {
    return false;
  }
}
export default verifySig;