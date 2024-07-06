import * as jose from 'jose';
import { Component, createVerifier, httpis } from 'http-message-signatures';
import objectPath from 'object-path';

const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);

async function verifySig(req: any) {
  if (objectPath.has(req, 'body.client.key.jwk')) {
    const tail = req.url;
    console.log(req.url)
    objectPath.set(req, 'url', url.protocol + "//" + url.hostname + tail);
    console.log(req.url)
    const signature = httpis.extractHeader(req, 'signature').replace('sig1=:', '').slice(0,-1);
    const signature_input = httpis.extractHeader(req, 'signature-input').replace('sig1=', '');
    const key = await jose.importJWK(req.body.client.key.jwk, req.body.client.key.alg);
    //@ts-ignore
    const verifier = createVerifier('rsa-v1_5-sha256', key);
    const components: Component[] = [
      '@method',
      '@target-uri',
      'content-digest',
      'content-type'
    ];
    const data = httpis.buildSignedData(req, components, signature_input);
    console.log(req.url)
    console.log(data)
    console.log(signature)
    const verify = await verifier(Buffer.from(data), Buffer.from(signature, 'base64'));
    return verify;
  } else {
    return false;
  }
}
export default verifySig;