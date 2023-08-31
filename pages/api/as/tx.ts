import { NextApiRequest, NextApiResponse } from 'next';
import NextCors from 'nextjs-cors';
import { randomBytes } from 'crypto';
import verifySig from '../../../lib/verifySig';
import parseSig from '../../../lib/parseSig';
import objectPath from 'object-path';
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
  if (await verifySig(req)) {
    const gnap = await nano.db.use("gnap");
    const gnap_public_keys = await nano.db.use("gnap_public_keys");
    const nonce = uuidv4();
    const access_token = Buffer.from(randomBytes(16)).toString('base64url');
    const interact_nonce = Buffer.from(randomBytes(16)).toString('base64url');
    objectPath.set(req, 'body.access_token.value', access_token);
    objectPath.set(req, 'body.interact_nonce.value', interact_nonce);
    const parsed = parseSig(req);
    objectPath.set(req, 'body.created', parsed.created);
    objectPath.set(req, 'body.keyid', parsed.keyid);
    objectPath.set(req, 'body.initial_req_tx', domain + req.url);
    objectPath.set(req, 'body.state', 'pending');
    try {
      await gnap_public_keys.get(parsed.keyid);
    } catch (e) {
      await gnap_public_keys.insert(req.body.client.key, parsed.keyid);
    }
    const response = {
      interact: {
        redirect: url.protocol + "//" + url.hostname + "/interact/" + interact_nonce,
        finish: Buffer.from(randomBytes(16)).toString('base64url')
      },
      continue: {
        access_token: {value: access_token},
        uri: url.protocol + "//" + url.hostname + "/api/as/continue",
        wait: 30
      },
      instance_id: nonce
    };
    objectPath.set(req, 'body.response', response);
    await gnap.insert(req.body, nonce);
    res.status(200).json(response);
  } else {
    res.status(401).send('Unauthorized');
  }
}

export default handler;
