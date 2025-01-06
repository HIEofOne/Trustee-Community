import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from '../../../lib/cors';
import { agent } from '../../../lib/veramo';
import objectPath from 'object-path';
import { v4 as uuidv4 } from 'uuid';
import { rp } from '../../../lib/rp';

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
  try {
    const identifier = await agent.didManagerGetOrCreate({ alias: 'default' });
    const nonce = uuidv4();
    const state = uuidv4();
    objectPath.set(doc, 'vp_state', state);
    objectPath.set(doc, 'vp_status', 'pending');
    const url_req = url.protocol + "//" + url.hostname + "/api/vp/vp_request/" + vp_id;
    const link = "openid-vc://?request_uri=" + encodeURIComponent(url_req);
    const authrequest = await rp.createAuthorizationRequestURI({
      correlationId: req.body._id,
      nonce: nonce,
      state: state,
      jwtIssuer: {method: 'did', alg: 'EdDSA', didUrl: identifier.did},
      claims: {
        "vp_token": {
          "presentation_definition": {
            "id": vp_id,
            "input_descriptors": [
              {
                "id": "npi credential",
                "name": doc.vc_type + " Verifiable Credential",
                "purpose": "We want a VC of this type to proof provider claim",
                "schema": [
                  {
                    "uri": "VerifiableCredential"
                  }
                ],
                "format": {
                  "jwt_vc": {
                    "alg": [
                      "EdDSA"
                    ]
                  }
                }
              }
            ]
          }
        }
      }
    });
    objectPath.set(doc, 'vp_jwt', authrequest.requestObjectJwt)
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
