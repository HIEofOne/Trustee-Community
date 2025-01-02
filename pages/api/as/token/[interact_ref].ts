import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from '../../../../lib/cors';
import createJWT from '../../../../lib/createJWT';
import verifySig from '../../../../lib/verifySig';
import parseSig from '../../../../lib/parseSig';

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
    methods: ["POST", "DELETE"],
    origin: '*',
    optionsSuccessStatus: 200
  });
  const { interact_ref } = req.query

  if (await verifySig(req)) {
    const parsed = parseSig(req);
    const now = Math.floor(Date.now() / 1000);
    const test = parseInt(parsed.created) + 30;
    if (test >= now) {
      const gnap = await nano.use("gnap");
      const q = {
        selector: {
          "interact_nonce.value": {"$eq": interact_ref}
        }
      };
      try {
        const response = await gnap.find(q);
        const req_token = <string>req.headers['authorization'];
        const req_token_final = req_token.replace('GNAP ', '');
        if (response.docs[0] && response.docs[0].state === 'approved' && response.docs[0].token_endpoint_access_token === req_token_final) {
          if (req.method === 'POST') {
            const jwt = await createJWT(response.docs[0]);
            res.status(200).json(jwt);
          } else {
            await gnap.destroy(response.docs[0]._id, response.docs[0]._rev);
            res.status(204).send('No Content');
          }
        } else {
          res.status(200).json({"error": {"code": "invalid_request", "description": "The request is missing a required parameter, includes an invalid parameter value or is otherwise malformed."}});
        }
      } catch (e) {
        res.status(200).json({"error": {"code": "invalid_interaction", "description": "The client instance has provided an interaction reference that is incorrect for this request or the interaction modes in use have expired."}});
      }
    } else {
      res.status(200).json({"error": {"code": "too_fast", "description": "The client instance did not respect the timeout in the wait response before the next call."}});
    }
  } else {
    res.status(200).json({"error": {"code": "invalid_client", "description": "The request was made from a client that was not recognized or allowed by the AS, or the client's signature validation failed."}});
  }
}

export default handler;
