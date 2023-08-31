import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import { v4 as uuidv4 } from 'uuid';
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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    methods: ["POST"],
    origin: process.env.DOMAIN,
    optionsSuccessStatus: 200
  });
  const gnap = await nano.db.use("gnap");
  const interact_nonce = Buffer.from(randomBytes(16)).toString('base64url');
  const doc = {
    "state": "pending",
    "pending_resources": [],
    "email": req.body.email,
    "interact_nonce": {
      "value": interact_nonce
    }
  }
  const nonce = uuidv4();
  try {
    const response = await gnap.insert(doc, nonce);
    objectPath.set(doc, '_id', response.id);
    objectPath.set(doc, '_rev', response.rev);
    res.status(200).json({success: true, doc: doc});
  } catch (e) {
    res.status(500).send(e);
  }
}

export default handler;
