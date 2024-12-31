import * as jose from 'jose';
import { randomBytes } from 'crypto';
import objectPath from 'object-path';

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
if (process.env.NODE_ENV === 'development') {
  var nano = require("nano")(`http://${user}:${pass}@127.0.0.1:5984`);
} else {
  var nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
}

async function createJWT(doc: any) {
  const keys = await nano.db.use("keys");
  const keyList = await keys.list();
  const key = await keys.get(keyList.rows[0].id);
  const rsaPrivateKey = await jose.importJWK(key.privateKey, 'RS256');
  const header = { alg: key.privateKey.alg, kid: key.privateKey.kid, typ: 'JWT' };
  const payload = {
    "response_type": "id_token",
  }
  if (objectPath.has(doc, 'vc')) {
    objectPath.set(payload, 'vc', doc.vc);
  };
  const subject = [
    {
      "format": "email",
      "email_id": {
        "email": objectPath.get(doc, 'approved_resources.0.ro')
      }
    }
  ];
  if (objectPath.has(doc, 'approved_resources.0.ro_did')) {
    const did: any = {
      "format": "did",
      "did_id": {
        "url": objectPath.get(doc, 'approved_resources.0.ro_did')
      }
    };
    subject.push(did);
  }
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader(header)
    .setIssuedAt()
    .setIssuer(domain)
    .setAudience(doc.client.display.uri)
    .setExpirationTime('6h')
    .setSubject(doc.email)
    .sign(rsaPrivateKey);
  const token_endpoint_access_token = Buffer.from(randomBytes(16)).toString('base64url');
  // const token_endpoint_access_token = randomBytes(16).toString('base64url');
  const gnap = await nano.use("gnap");
  objectPath.set(doc, 'token_endpoint_access_token', token_endpoint_access_token);
  objectPath.set(doc, 'access_token.value', jwt);
  await gnap.insert(doc);
  const grant = {
    "access_token": {
      "value": jwt,
      "manage": {
        "uri": url.protocol + "//" + url.hostname + "/api/as/token/" + doc.interact_nonce.value,
        "access_token": {
          "value": token_endpoint_access_token
        } 
      },
      "access": doc.access_token.access,
      "expires_in": 21600,
      "flags": ["bearer"],
      "subject": {
        "sub_ids": subject
      }
    }
  }  
  return grant;
}
export default createJWT;