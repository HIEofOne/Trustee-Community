import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";
import crypto from 'crypto';
import verifySig from "../../../lib/verifySig";
import parseSig from "../../../lib/parseSig";

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
    const nonce = crypto.randomBytes(16).toString('base64url');
    const access_token = crypto.randomBytes(16).toString('base64url');
    const interact_nonce = crypto.randomBytes(16).toString('base64url');
    req.body.access_token.value = access_token;
    req.body.interact_nonce.value = interact_nonce;
    const parsed = parseSig(req);
    req.body.created = parsed.created;
    req.body.keyid = parsed.keyid;
    req.body.state = 'pending';
    await gnap.insert(req.body, nonce);
    await gnap_public_keys.insert(req.body.client.key, parsed.keyid);
    const response = {
      interact: {
        redirect: url.protocol + "//" + url.hostname + "/interact/" + interact_nonce,
        finish: crypto.randomBytes(16).toString('base64url')
      },
      continue: {
        access_token: {value: access_token},
        uri: url.protocol + "//" + url.hostname + "/api/as/continue",
        wait: 30
      },
      instance_id: nonce
    };
    res.status(200).json(response);
  } else {
    res.status(401).send('Unauthorized');
  }
}

export default handler;
