import * as jose from 'jose';
import { createVerifier, httpbis } from 'http-message-signatures';
import objectPath from 'object-path';

const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);

async function verifySig(req: any) {
  if (objectPath.has(req, 'body.client.key.jwk')) {
    const tail = req.url;
    objectPath.set(req, 'url', url.protocol + "//" + url.hostname + tail);
    console.log(req)
    const key_jose = await jose.importJWK(req.body.client.key.jwk, req.body.client.key.alg);
    const keys = new Map();
    const algs = []
    if (req.body.client.key.alg === 'RS256') {
      algs.push('rsa-v1_5-sha256')
    }
    keys.set(req.body.client.key.kid, {
        id: req.body.client.key.kid,
        algs,
        verify: createVerifier(key_jose as Uint8Array, 'rsa-v1_5-sha256'),
    });
    const verified = await httpbis.verifyMessage({
      async keyLookup() {
        return keys.get(req.body.client.key.kid);
      },
    }, req);
    return verified;
  } else {
    return false;
  }
}
export default verifySig;