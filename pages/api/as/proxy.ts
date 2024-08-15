import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import createJWT from '../../../lib/createJWT';
import objectPath from 'object-path';
import parseSig from '../../../lib/parseSig';
import verifyJWT from '../../../lib/verifyJWT';
import verifySig from '../../../lib/verifySig';
import { v4 as uuidv4 } from 'uuid';

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
  const { token, access_token } = req.body;
  if (await verifySig(req)) {
    const parsed = parseSig(req);
    if (!token && !access_token) {
      res.status(200).json({error: "Bad Request: missing items in body"});
    } else {
      const gnap_resources = await nano.db.use("gnap_resources");
      const gnap = await nano.db.use("gnap");
      const doc = {
        access_token,
        created: parsed.created,
        keyid: parsed.keyid
      }
      const r = {
        selector: {
          "locations": {"$elemMatch": {"$eq": access_token.locations[0]}}
        }
      };
      try {
        const resource_docs = await gnap_resources.find(r);
        const approved_resources = []
        for (const resource_doc of resource_docs.docs) {
          if (await verifyJWT(token, objectPath.get(resource_doc, 'ro'))) {
            approved_resources.push(resource_doc);
          }
        }
        const nonce = uuidv4();
        objectPath.set(doc, 'state', 'approved');
        objectPath.set(doc, 'approved_resources', approved_resources);
        const insert = await gnap.insert(doc, nonce);
        objectPath.set(doc, '_id', insert.id);
        objectPath.set(doc, '_rev', insert.rev);
        try {
          const jwt = await createJWT(doc);
          res.status(200).json(jwt);
        } catch (e) {
          res.status(200).json(e);
        }
      } catch (e) {
        res.status(200).json({"error": {"code": "invalid_interaction", "description": "The client instance has provided an interaction reference that is incorrect for this request or the interaction modes in use have expired."}});
      }
    }
  } else {
    res.status(200).json({"error": {"code": "invalid_client", "description": "The request was made from a client that was not recognized or allowed by the AS, or the client's signature validation failed."}});
  }
}

export default handler;
