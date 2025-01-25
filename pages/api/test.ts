import { NextApiRequest, NextApiResponse } from 'next'
import { agent } from '../../lib/veramo';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import objectPath from 'object-path';
import { rp } from '../../lib/rp';

const domain: string = process.env.DOMAIN !== undefined ? process.env.DOMAIN: '';
const url = new URL(domain);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req
  switch (method) {
    case 'GET':
      try {
        const nonce = uuidv4();
        const state = uuidv4();
        const vp_id = uuidv4();
        const vc_type = "NPI";
        const identifier = await agent.didManagerGetOrCreate({ alias: 'default' });
        const authrequest = await rp(vc_type, vp_id).createAuthorizationRequest({
          correlationId: uuidv4(),
          nonce: nonce,
          state: state,
          jwtIssuer: {method: 'did', alg: 'EdDSA', didUrl: identifier.did},
        });
        // const nonce = uuidv4();
        // const state = uuidv4();
        // const vp_id = uuidv4();
        // const vc_type = 'NPICredential';
        // const url_res = url.protocol + "//" + url.hostname + "/api/vp/vp_response/" + vp_id;
        // const payload = {
        //   "response_type": "vp_token id_token",
        //   "scope": "openid",
        //   "client_id": identifier.did,
        //   "response_uri": url_res,
        //   "response_mode": "direct_post",
        //   "nonce": nonce,
        //   "state": state,
        //   "registration": {
        //     "id_token_signing_alg_values_supported": [
        //       "RS256",
        //       "ES256K"
        //     ],
        //     "response_types_supported": [
        //       "id_token"
        //     ],
        //     "scopes_supported": [
        //       "openid"
        //     ],
        //     "subject_types_supported": [
        //       "pairwise"
        //     ],
        //     "subject_syntax_types_supported": [
        //       "did:web",
        //       "did:key",
        //       "did:ethr",
        //       "did:ion",
        //       "did:jwk"
        //     ],
        //     "vp_formats": {
        //       "jwt_vp": {
        //         "alg": [
        //           "RS256",
        //           "ES256K"
        //         ]
        //       },
        //       "jwt_vc": {
        //         "alg": [
        //           "RS256",
        //           "ES256K"
        //         ]
        //       }
        //     },
        //     "client_name": "Trustee",
        //     "client_purpose": "Grant Negotiation and Authorization Protocol (GNAP) Server",
        //     "client_id": identifier.did
        //   },
        //   "claims": {
        //     "vp_token": {
        //       "presentation_definition": {
        //         "id": vp_id,
        //         "input_descriptors": [
        //           {
        //             "id": "1",
        //             "name": vc_type + " Verifiable Credential",
        //             "purpose": "We want a VC of this type to proof provider claim",
        //             "schema": [
        //               {
        //                 "uri": "VerifiableCredential"
        //               }
        //             ]
        //           }
        //         ]
        //       }
        //     }
        //   }
        // }
        // const jwt:any = await agent.keyManagerSignJWT({kid: identifier.keys[0].kid, data: JSON.stringify(payload)})
        res.send(authrequest)
      } catch (e) {
        console.log(e)
        res.send('error')
      }
      break
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

export default handler;