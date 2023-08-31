import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import objectPath from 'object-path';
import { v4 as uuidv4 } from 'uuid';
import * as jose from 'jose';
import Docker from 'dockerode';
import streams from 'memory-streams';

var user = process.env.COUCHDB_USER;
var pass = process.env.COUCHDB_PASSWORD;
const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);
if (process.env.NODE_ENV === 'development') {
  var nano = require("nano")(`http://${user}:${pass}@127.0.0.1:5984`);
} else {
  var nano = require("nano")(url.protocol + `//${user}:${pass}@db.` + url.hostname);
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const gnap = await nano.db.use("gnap");
  const vp_id = uuidv4();
  const doc = await gnap.get(req.body._id);
  objectPath.set(doc, 'vp_id', vp_id);
  objectPath.set(doc, 'vc_type', req.body.vc_type);
  const url_req = url.protocol + "//" + url.hostname + "/api/vp/vp_request/" + vp_id;
  const url_res = url.protocol + "//" + url.hostname + "/api/vp/vp_response/" + vp_id;
  const link = "openid-vc://?request_uri=" + encodeURIComponent(url_req);
  // const keys = await nano.db.use("keys");
  // const keyList = await keys.list();
  // const key = await keys.get(keyList.rows[0].id);
  // const rsaPrivateKey = await jose.importJWK(key.privateKey, 'RS256');
  const alg = 'ES256K';
  const docker = new Docker();
  // const pull = new streams.WritableStream();
  const key = new streams.WritableStream();
  const secp_key = new streams.WritableStream();
  const did = new streams.WritableStream();
  const kid_did = new streams.WritableStream();
  const diddoc = new streams.WritableStream();
  // try {
  //   await docker.pull('ghcr.io/spruceid/didkit-cli:latest', pull);
  //   const pull_final = pull.toString();
    try {
      await docker.run('ghcr.io/spruceid/didkit-cli:latest', ['generate-ed25519-key'], key);
      const key_final = key.toString();
      try {
        await docker.run('ghcr.io/spruceid/didkit-cli:latest', ['key-to-did', 'key', '-j', key_final], did);
        const did_final = did.toString().replace( /[\r\n]+/gm, "" );
        try {
          await docker.run('ghcr.io/spruceid/didkit-cli:latest', ['key', 'generate', 'secp256k1'], secp_key);
          const secp_key_final = secp_key.toString();
          await docker.run('ghcr.io/spruceid/didkit-cli:latest', ['key-to-did', 'key', '-j', secp_key_final], kid_did);
          const kid_did_final = kid_did.toString().replace( /[\r\n]+/gm, "" );
          try {
            await docker.run('ghcr.io/spruceid/didkit-cli:latest', ['did-resolve', did_final], diddoc);
            const diddoc_final = diddoc.toString();
            const header = { alg: alg, kid: kid_did_final, typ: 'JWT' };
            const nonce = uuidv4();
            const state = uuidv4();
            const payload = {
              "response_type": "id_token",
              "scope": "openid",
              "client_id": kid_did_final,
              "redirect_uri": url_res,
              "response_mode": "post",
              "nonce": nonce,
              "state": state,
              "registration": {
                "id_token_signing_alg_values_supported": [
                  "RS256",
                  "ES256K"
                ],
                "response_types_supported": [
                  "id_token"
                ],
                "scopes_supported": [
                  "openid"
                ],
                "subject_types_supported": [
                  "pairwise"
                ],
                "subject_syntax_types_supported": [
                  "did:web",
                  "did:key",
                  "did:ethr",
                  "did:ion",
                  "did:jwk"
                ],
                "vp_formats": {
                  "jwt_vp": {
                    "alg": [
                      "RS256",
                      "ES256K"
                    ]
                  },
                  "jwt_vc": {
                    "alg": [
                      "RS256",
                      "ES256K"
                    ]
                  }
                },
                "client_name": "Trustee",
                "client_purpose": "Grant Negotiation and Authorization Protocol (GNAP) Server",
                "client_id": kid_did_final
              },
              "claims": {
                "vp_token": {
                  "presentation_definition": {
                    "id": vp_id,
                    "input_descriptors": [
                      {
                        "id": "1",
                        "name": doc.vc_type + " Verifiable Credential",
                        "purpose": "We want a VC of this type to proof provider claim",
                        "schema": [
                          {
                            "uri": "VerifiableCredential"
                          }
                        ]
                      }
                    ]
                  }
                }
              }
            }
            const privateKey = await jose.importJWK(JSON.parse(secp_key_final), alg)
            const jwt = await new jose.SignJWT(payload)
              .setProtectedHeader(header)
              .setIssuedAt()
              .setIssuer(kid_did_final)
              // .setAudience(aud)
              .setExpirationTime('10m')
              // .setSubject(sub)
              .sign(privateKey)
            objectPath.set(doc, 'vp_jwt', jwt);
            objectPath.set(doc, 'vp_state', state);
            objectPath.set(doc, 'vp_status', 'pending');
            try {
              const response = await gnap.insert(doc);
              if (response.error) {
                res.status(500).send({error: response.error, reason:response.reason});
              }
              res.status(200).json({success: true, link: link, rev: response.rev});
            } catch (error){
              res.status(500).send(error);
            }
          } catch (e) {
            console.log(e)
          }
        } catch (e) {
          console.log(e)
        }
      } catch (e) {
        console.log(e)
      }
    } catch (e) {
      console.log(e)
    }
}

export default handler;
