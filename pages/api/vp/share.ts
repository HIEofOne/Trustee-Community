import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from '../../../lib/cors';
import { agent } from '../../../lib/veramo';
import objectPath from 'object-path';
import { v4 as uuidv4 } from 'uuid';
import { EdDSASigner, hexToBytes, createJWT, Signer } from 'did-jwt';
import { bytesToBase64url, bytesToBase64, bytesToHex, createJWK, stringToUtf8Bytes } from '@veramo/utils';
import { sha256 } from '@noble/hashes/sha256'

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
  try {
    const identifier = await agent.didManagerGetOrCreate({ alias: 'default' });
    // const header = { alg: alg, kid: kid_did_final, typ: 'JWT' };
    const nonce = uuidv4();
    const state = uuidv4();
    const jwk = createJWK("Ed25519", identifier.keys[0].publicKeyHex);
    const payload = {
      "sub_jwk": jwk,
      "sub": identifier.did,
      "aud": identifier.did,
      "response_type": "id_token",
      "scope": "openid",
      "id_token_type": "subject_signed",
      "client_id": identifier.did,
      "redirect_uri": url_res,
      "response_mode": "post",
      "nonce": nonce,
      "state": state,
      "registration": {
        "id_token_signing_alg_values_supported": [
          "RS256",
          "ES256K",
          "EdDSA"
        ],
        "request_object_signing_alg_values_supported": [
          "EdDSA",
          "ES256K",
          "RS256"
        ],
        "response_types_supported": [
          "vp_token",
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
        "vp_formats_supported": {
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
        "client_id": identifier.did
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
    const header: any = {alg: 'EdDSA', typ: 'JWT', jwk: jwk };
    const signer = (data: string | Uint8Array ) => {
      let dataString, encoding: 'base64' | undefined
      if (typeof data === 'string') {
        dataString = data
        encoding = undefined
      } else {
        ;(dataString = bytesToBase64(data)), (encoding = 'base64')
      }
      return agent.keyManagerSign({ keyRef: identifier.keys[0].kid, data: dataString, alg: header.alg })
    }
    const jwt = await createJWT(
      payload,
      { issuer: identifier.did, signer, alg: header.alg },
      header
    )
    console.log(jwt)
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
}

export default handler;
