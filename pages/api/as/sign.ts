import { importJWK } from 'jose';
import { createHash } from 'crypto';
import { nanoid } from 'nanoid';
import { createSigner, httpbis } from 'http-message-signatures';

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
if (process.env.NODE_ENV === 'development') {
  var nano = require("nano")(`http://${user}:${pass}@127.0.0.1:5984`);
} else {
  var nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
}

const Sign = async(req: any, res: any) => {
  if (req.method !== 'POST') return res.status(405).end();
  const keys = await nano.db.use("keys");
  const keyList = await keys.list();
  const my_key: any = await keys.get(keyList.rows[0].id);
  const rsaPrivateKey: any = await importJWK(my_key.privateKey, my_key.privateKey.alg);
  const final_url = url.origin + req.body.urlinput;
  const body = {
    ...req.body.doc,
    "client": {
      "display": {
        "name": "Trustee",
        "uri": url.protocol + "://" + url.hostname
      },
      "key": {
        "proof": "httpsig",
        "jwk": my_key.publicKey
      }
    }
  }
  const opt = {
    method: req.body.method,
    url: final_url,
    headers: {
      "content-digest": "sha-256=:" + createHash('sha256').update(JSON.stringify(body)).digest('hex') + "=:",
      "content-type": "application/json",
      "authorization": "GNAP " + req.body.jwt
    },
    body: JSON.stringify(body)
  }
  try {
    const key = createSigner(rsaPrivateKey, 'rsa-v1_5-sha256')
    const signedRequest = await httpbis.signMessage({
      key,
      name: 'sig1',
      fields: [
        '@method',
        '@target-uri',
        'content-digest',
        'content-type'
      ],
      params: [
        'created',
        'nonce',
        'tag',
        'keyid',
        'alg'
      ],
      paramValues: {
        nonce: nanoid(22),
        tag: "gnap",
        keyid: my_key.publicKey.kid
      }
    }, opt)
    try {
      const update = await fetch(final_url, signedRequest)
        .then((res1) => {
          if (res1.status > 400 && res1.status < 600) { 
            return {error: res1.statusText};
          } else {
            return res1.json();
          }
        });
      res.status(200).json(update);
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};

export default Sign;
